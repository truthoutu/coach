import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";
import { toNumber } from "@/lib/money";
import { ensureOrderSchema } from "@/lib/ensure-order-schema";

export const dynamic = "force-dynamic";

function publicOrder(order: {
  number: string;
  status: string;
  paymentMethod: string;
  total: { toNumber(): number } | number | string;
  paymentImage: string | null;
  paymentNote: string | null;
  customerPaidAt: Date | null;
}) {
  const total =
    typeof order.total === "object" && order.total && "toNumber" in order.total
      ? order.total.toNumber()
      : toNumber(order.total);
  return {
    number: order.number,
    status: order.status,
    paymentMethod: order.paymentMethod,
    total,
    paymentImage: order.paymentImage,
    paymentNote: order.paymentNote,
    customerPaidAt: order.customerPaidAt ? order.customerPaidAt.toISOString() : null,
    detailsReady: Boolean(order.paymentImage || order.paymentNote),
    confirmed: order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED",
  };
}

export async function GET(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
  await ensureOrderSchema();
  const number = new URL(request.url).searchParams.get("number") || "";
  if (!number) return NextResponse.json({ error: "Missing order" }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { number } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: publicOrder(order) });
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
  await ensureOrderSchema();
  const body = await request.json();
  const number = typeof body.number === "string" ? body.number : "";
  if (!number) return NextResponse.json({ error: "Missing order" }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { number } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "Order cancelled" }, { status: 400 });
  }
  const updated = await prisma.order.update({
    where: { number },
    data: { customerPaidAt: new Date() },
  });
  return NextResponse.json({ order: publicOrder(updated) });
}
