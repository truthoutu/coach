import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ number: string }> };

/**
 * Customer-side live order status, polled every few seconds by the tracker.
 * Light verification: the caller must pass the email used at checkout.
 * Reading the thread marks admin messages as seen by the customer.
 */
export async function GET(request: Request, { params }: RouteParams) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }
  try {
    const { number } = await params;
    const { searchParams } = new URL(request.url);
    const email = String(searchParams.get("email") || "").trim().toLowerCase();

    const order = await prisma.order.findUnique({
      where: { number },
    });

    if (!order || !email || order.email.trim().toLowerCase() !== email) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderId = order.id;
    const [gift, threadRows] = await Promise.all([
      prisma.giftCardSubmission.findUnique({
        where: { orderId },
        select: {
          brand: true,
          codeLast4: true,
          claimedValue: true,
          status: true,
          reviewNotes: true,
        },
      }),
      prisma.orderMessage.findMany({
        where: { orderId },
        orderBy: { createdAt: "asc" },
        select: { id: true, senderRole: true, body: true, createdAt: true },
      }),
    ]);

    // Reading the thread marks admin replies as seen by the customer.
    await prisma.orderMessage.updateMany({
      where: { orderId, senderRole: "ADMIN", readByCustomer: false },
      data: { readByCustomer: true },
    });

    return NextResponse.json({
      order: {
        number: order.number,
        status: order.status,
        paymentMethod: order.paymentMethod,
        total: order.total.toNumber(),
      },
      giftCard: gift
        ? {
            brand: gift.brand,
            codeLast4: gift.codeLast4,
            claimedValue: gift.claimedValue == null ? null : Number(gift.claimedValue.toString()),
            status: gift.status,
            reviewNotes: gift.reviewNotes,
          }
        : null,
      messages: threadRows.map((m) => ({
        id: m.id,
        senderRole: m.senderRole,
        body: m.body,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching live order:", error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch order status" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to fetch order status. Please try again." }, { status: 500 });
  }
}
