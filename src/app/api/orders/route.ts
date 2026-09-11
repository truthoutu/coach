import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";

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
      include: { items: true },
    });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const methods = ["BITCOIN", "ZELLE", "CHIME"];
    if (!methods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order has no items" }, { status: 400 });
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

    // ── Persist ───────────────────────────────────────────────────────────
    const order = await prisma.order.create({
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
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}