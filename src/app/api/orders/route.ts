import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";
import {
  encryptGiftCardSecret,
  last4OfCode,
  validateGiftCardSubmission,
} from "@/lib/gift-cards";

export const dynamic = "force-dynamic";

function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `COACH-${stamp}${rand}`;
}

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ orders: [] }, { status: 200 });
  }
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        // Gift card codes are sensitive: only masked fields leave the server.
        giftCardSubmission: {
          select: {
            id: true,
            brand: true,
            codeLast4: true,
            claimedValue: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
        return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch orders" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to fetch orders. Please try again." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable (database not configured). Please try again or contact support via WhatsApp." },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      address,
      city,
      postalCode,
      country,
      paymentMethod,
      items,
      notes,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!email || !firstName || !lastName || !address || !city || !postalCode || !country) {
      return NextResponse.json(
        { error: "Contact and shipping details are required" },
        { status: 400 }
      );
    }
    const methods = ["BITCOIN", "ZELLE", "CHIME", "CASHAPP", "GIFT_CARD"];
    if (!methods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order has no items" }, { status: 400 });
    }

    // ── Gift card submission (GIFT_CARD method only) ───────────────────────
    // Codes are validated, then encrypted before they ever touch the database.
    let giftCardRecord: {
      brand: string;
      codeEncrypted: string;
      codeLast4: string;
      pinEncrypted: string | null;
      claimedValue: number | null;
    } | null = null;
    if (paymentMethod === "GIFT_CARD") {
      const result = validateGiftCardSubmission(body.giftCard ?? {});
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      giftCardRecord = {
        brand: result.brand,
        codeEncrypted: encryptGiftCardSecret(result.code),
        codeLast4: last4OfCode(result.code),
        pinEncrypted: result.pin ? encryptGiftCardSecret(result.pin) : null,
        claimedValue: result.claimedValue,
      };
    }

    // ── Server-side authoritative totals ──────────────────────────────────
    // Prices always come from the database — never trust the client.
    let itemsTotal = 0;
    const validated: {
      productId: string | null;
      name: string;
      sku: string | null;
      price: number;
      currency: string;
      quantity: number;
      image: string | null;
    }[] = [];

    for (const item of items) {
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || product.status !== "ACTIVE") {
          return NextResponse.json(
            { error: `Product no longer available: ${item.name ?? item.productId}` },
            { status: 400 }
          );
        }
        const price = product.price.toNumber();
        itemsTotal += price * quantity;
        validated.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price,
          currency: product.currency,
          quantity,
          image: product.images[0] ?? null,
        });
      } else {
        const price = Number(item.price);
        if (!Number.isFinite(price) || price < 0) {
          return NextResponse.json({ error: "Invalid item price" }, { status: 400 });
        }
        itemsTotal += price * quantity;
        validated.push({
          productId: null,
          name: String(item.name || "Item"),
          sku: item.sku ?? null,
          price,
          currency: item.currency || "USD",
          quantity,
          image: item.image ?? null,
        });
      }
    }

    const shippingCost = 0;
    const taxTotal = 0;
    const total = itemsTotal + shippingCost + taxTotal;

    // ── Persist (order + gift card submission atomically) ─────────────────
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          number: generateOrderNumber(),
          customerName: `${firstName} ${lastName}`.trim(),
          email,
          phone: phone || null,
          address,
          city,
          postalCode,
          country,
          itemsTotal,
          shippingCost,
          taxTotal,
          total,
          currency: "USD",
          status: "PENDING_PAYMENT",
          paymentMethod,
          notes: notes || null,
          items: {
            create: validated.map((v) => ({
              productId: v.productId,
              name: v.name,
              sku: v.sku,
              price: v.price,
              currency: v.currency,
              quantity: v.quantity,
              image: v.image,
            })),
          },
        },
        include: { items: true },
      });

      if (giftCardRecord) {
        await tx.giftCardSubmission.create({
          data: {
            orderId: created.id,
            brand: giftCardRecord.brand,
            codeEncrypted: giftCardRecord.codeEncrypted,
            codeLast4: giftCardRecord.codeLast4,
            pinEncrypted: giftCardRecord.pinEncrypted,
            claimedValue: giftCardRecord.claimedValue,
            status: "SUBMITTED",
          },
        });
      }

      // ── Seed the live thread: the customer "message" the admin is notified about ──
      // ("Someone wants to buy [bag] via [method]") + a gift-card pointer if present.
      const methodLabel =
        paymentMethod === "GIFT_CARD"
          ? "Gift Card"
          : paymentMethod === "CASHAPP"
            ? "Cash App"
            : paymentMethod.charAt(0) + paymentMethod.slice(1).toLowerCase();
      const itemSummary = validated
        .map((v) => `${v.name} ×${v.quantity}`)
        .join(", ")
        .slice(0, 400);
      const newOrderMsg =
        `🛍️ New order — ${itemSummary} — Total $${total.toFixed(2)} via ${methodLabel}.`;
      await tx.orderMessage.create({
        data: {
          orderId: created.id,
          senderRole: "CUSTOMER",
          body: newOrderMsg,
          readByAdmin: false,
          readByCustomer: true,
        },
      });
      if (giftCardRecord) {
        const giftMsg =
          `🎁 Gift card: ${giftCardRecord.brand.replace(/_/g, " ")} •••• ${giftCardRecord.codeLast4} — please verify in the Gift Cards tab.`;
        await tx.orderMessage.create({
          data: {
            orderId: created.id,
            senderRole: "CUSTOMER",
            body: giftMsg,
            readByAdmin: false,
            readByCustomer: true,
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        order: {
          id: order.id,
          number: order.number,
          status: order.status,
          total: order.total.toNumber(),
          createdAt: order.createdAt,
        },
      },
      { status: 201 }
    );
    } catch (error) {
    console.error("Error creating order:", error);
    if (
      error instanceof Error &&
      /GIFT_CARD_ENC_KEY|Database is not configured/i.test(error.message)
    ) {
      return NextResponse.json(
        { error: `Checkout is temporarily unavailable (${error.message}). Please contact support via WhatsApp.` },
        { status: 503 }
      );
    }
    // Surface the actual error so it can be diagnosed instead of being masked
    // as a generic "Failed to create order" 500 response.
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create order" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to create order. Please try again or contact support via WhatsApp." }, { status: 500 });
  }
}