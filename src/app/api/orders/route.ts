import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";
import { toNumber } from "@/lib/money";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const FULFILLING = new Set<OrderStatus>(["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]);

function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `COACH-${stamp}${rand}`;
}

function serializeOrder(order: {
  id: string;
  number: string;
  customerName: string;
  email: string;
  phone: string | null;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  itemsTotal: { toNumber(): number } | number | string;
  shippingCost: { toNumber(): number } | number | string;
  taxTotal: { toNumber(): number } | number | string;
  total: { toNumber(): number } | number | string;
  currency: string;
  status: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: Date;
  items: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    price: { toNumber(): number } | number | string;
    image: string | null;
  }[];
}) {
  const num = (v: { toNumber(): number } | number | string) =>
    typeof v === "object" && v && "toNumber" in v ? v.toNumber() : toNumber(v);

  return {
    id: order.id,
    number: order.number,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    address: order.address,
    city: order.city,
    postalCode: order.postalCode,
    country: order.country,
    itemsTotal: num(order.itemsTotal),
    shippingCost: num(order.shippingCost),
    taxTotal: num(order.taxTotal),
    total: num(order.total),
    currency: order.currency,
    status: order.status,
    paymentMethod: order.paymentMethod,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((it) => ({
      id: it.id,
      name: it.name,
      sku: it.sku,
      quantity: it.quantity,
      price: num(it.price),
      priceLabel: `$${num(it.price).toFixed(2)}`,
      image: it.image,
    })),
  };
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ orders: [] }, { status: 200 });
  }
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    return NextResponse.json({ orders: orders.map(serializeOrder) });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const status = body.status as OrderStatus;
    if (!id || !ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Valid order id and status are required" }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const wasHeld = existing.status === "PENDING_PAYMENT" || existing.status === "CANCELLED";
    const willHold = status === "PENDING_PAYMENT" || status === "CANCELLED";
    const shouldDecrement = wasHeld && FULFILLING.has(status);
    const shouldRestore = FULFILLING.has(existing.status) && willHold;

    const updated = await prisma.$transaction(async (tx) => {
      if (shouldDecrement || shouldRestore) {
        for (const item of existing.items) {
          if (!item.productId) continue;
          const delta = shouldDecrement ? -item.quantity : item.quantity;
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { inventory: { increment: delta } },
          });
        }
      }
      return tx.order.update({
        where: { id },
        data: { status },
        include: { items: true },
      });
    });

    return NextResponse.json({ order: serializeOrder(updated) });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
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

    if (!email || !firstName || !lastName || !address || !city || !postalCode || !country) {
      return NextResponse.json(
        { error: "Contact and shipping details are required" },
        { status: 400 },
      );
    }
    const methods = ["BITCOIN", "ZELLE", "CHIME"];
    if (!methods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order has no items" }, { status: 400 });
    }

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
            { status: 400 },
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
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
