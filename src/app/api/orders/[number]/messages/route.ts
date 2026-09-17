import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ number: string }> };

const MAX_BODY = 1000;

/**
 * Per-order message thread.
 *  - GET  (admin): full thread; marks customer messages as read by admin.
 *  - POST: admin ({ admin: true, body }) or customer ({ email, body }) message.
 *    The admin flag is trusted the same way the rest of /admin APIs are
 *    (the dashboard is currently unauthenticated — see BUILT.md).
 */
export async function GET(request: Request, { params }: RouteParams) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }
  try {
    const { number } = await params;
    const order = await prisma.order.findUnique({ where: { number } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const messages = await prisma.orderMessage.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderRole: true, body: true, createdAt: true },
    });
    // Reading the thread marks customer messages as seen by the admin.
    await prisma.orderMessage.updateMany({
      where: { orderId: order.id, senderRole: "CUSTOMER", readByAdmin: false },
      data: { readByAdmin: true },
    });
    return NextResponse.json({
      order: { number: order.number, status: order.status, paymentMethod: order.paymentMethod },
      messages,
    });
  } catch (error) {
    console.error("Error fetching order messages:", error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch messages" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to fetch messages. Please try again." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }
  try {
    const { number } = await params;
    const body = await request.json().catch(() => ({}));
    const text = String(body?.body || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }
    if (text.length > MAX_BODY) {
      return NextResponse.json({ error: `Message too long (max ${MAX_BODY} characters)` }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { number } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isAdmin = body?.admin === true;
    // No email verification - just check if it's admin or customer

    const created = await prisma.orderMessage.create({
      data: {
        orderId: order.id,
        senderRole: isAdmin ? "ADMIN" : "CUSTOMER",
        body: text,
        readByAdmin: isAdmin,
        readByCustomer: !isAdmin,
      },
      select: { id: true, senderRole: true, body: true, createdAt: true },
    });

    // Admin payment-detail messages also land on Order.paymentNote so the
    // customer tracker can promote them into the main "details ready" card
    // instead of leaving the spinner forever.
    if (isAdmin && !order.paymentNote) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentNote: text },
      });
    }

    // The customer's "I have paid" tap is persisted on the order (not just in
    // component state) so the tracker survives a page refresh and the admin
    // dashboard can flag the request as "payment claimed — confirm now".
    let customerPaidAt = order.customerPaidAt;
    if (!isAdmin && body?.paid === true && !customerPaidAt) {
      const paid = await prisma.order.update({
        where: { id: order.id },
        data: { customerPaidAt: new Date() },
        select: { customerPaidAt: true },
      });
      customerPaidAt = paid.customerPaidAt;
    }

    return NextResponse.json({ message: created, customerPaidAt }, { status: 201 });
  } catch (error) {
    console.error("Error creating order message:", error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to send message" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
