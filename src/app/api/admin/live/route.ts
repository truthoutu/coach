import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Admin live feed, polled every ~5s by the dashboard.
 * Returns lightweight counts; the dashboard compares them with its previous
 * snapshot to decide when to toast/beep/refresh the tables.
 */
export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ stats: { pendingOrders: 0, unreadCustomerMessages: 0, pendingGiftCards: 0 } });
  }
  try {
    const [pendingOrders, unreadCustomerMessages, pendingGiftCards] = await Promise.all([
      prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
      prisma.orderMessage.count({
        where: { senderRole: "CUSTOMER", readByAdmin: false },
      }),
      prisma.giftCardSubmission.count({ where: { status: "SUBMITTED" } }),
    ]);
    return NextResponse.json({
      stats: { pendingOrders, unreadCustomerMessages, pendingGiftCards },
    });
  } catch (error) {
    console.error("Error fetching admin live stats:", error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch live stats" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to fetch live stats. Please try again." }, { status: 500 });
  }
}
