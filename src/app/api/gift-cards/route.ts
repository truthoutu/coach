import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Admin listing of gift card payment submissions.
 * Codes are NEVER returned here — only the masked last-4. The full code is
 * available exclusively through the "reveal" action on /api/gift-cards/[id].
 */
export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ submissions: [] }, { status: 200 });
  }
  try {
    const submissions = await prisma.giftCardSubmission.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        brand: true,
        codeLast4: true,
        claimedValue: true,
        status: true,
        reviewNotes: true,
        createdAt: true,
        updatedAt: true,
        order: {
          select: {
            id: true,
            number: true,
            customerName: true,
            email: true,
            phone: true,
            total: true,
            status: true,
          },
        },
      },
    });
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error fetching gift card submissions:", error);
    return NextResponse.json({ error: "Failed to fetch gift card submissions" }, { status: 500 });
  }
}
