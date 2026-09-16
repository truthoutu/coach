import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ number: string }> };

const ALLOWED_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

/**
 * Admin actions on an order (dashboard is currently unauthenticated, like
 * the rest of the admin APIs):
 *  - { action: "confirm" }  → status CONFIRMED; a pending gift card on this
 *    order is also marked VERIFIED (confirming payment implies the card
 *    checked out).
 *  - { action: "cancel" }   → status CANCELLED.
 *  - { status: "…" }        → direct status set (allowed values above).
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }
  try {
    const { number } = await params;
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "");

    const order = await prisma.order.findUnique({ where: { number } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (action === "confirm") {
      // Confirming payment implies the card checked out: flip a pending card
      // to VERIFIED as part of the confirm (runs after the order update so a
      // relation-shape error can never block the CONFIRMED write itself).
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED" },
        select: { number: true, status: true },
      });
      if (order.paymentMethod === "GIFT_CARD") {
        const pendingCard = await prisma.giftCardSubmission.findUnique({
          where: { orderId: order.id },
          select: { status: true },
        });
        if (pendingCard?.status === "SUBMITTED") {
          await prisma.giftCardSubmission.update({
            where: { orderId: order.id },
            data: { status: "VERIFIED" },
          });
        }
      }
      return NextResponse.json({ order: updated });
    }

    if (action === "cancel") {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
        select: { number: true, status: true },
      });
      return NextResponse.json({ order: updated });
    }

    const nextStatus = String(body?.status || "");
    if (ALLOWED_STATUSES.includes(nextStatus)) {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status: nextStatus as "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" },
        select: { number: true, status: true },
      });
      return NextResponse.json({ order: updated });
    }

    return NextResponse.json(
      { error: "Use action 'confirm', 'cancel', or a valid status." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
