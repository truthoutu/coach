import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";
import { decryptGiftCardSecret } from "@/lib/gift-cards";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Admin actions on a gift card submission:
 *  - { action: "verify", confirmOrder?: boolean }  → status VERIFIED (optionally CONFIRM the order)
 *  - { action: "reject", reviewNotes?: string }    → status REJECTED
 *  - { action: "reveal" }                          → returns the decrypted code (PIN if present)
 *
 * The reveal action is the ONLY place a full code is ever returned.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "");

    const submission = await prisma.giftCardSubmission.findUnique({
      where: { id },
      include: { order: { select: { id: true, status: true } } },
    });
    if (!submission) {
      return NextResponse.json({ error: "Gift card submission not found" }, { status: 404 });
    }

    if (action === "verify") {
      const confirmOrder = body?.confirmOrder === true;
      const updated = await prisma.giftCardSubmission.update({
        where: { id },
        data: {
          status: "VERIFIED",
          reviewNotes: body?.reviewNotes ? String(body.reviewNotes) : submission.reviewNotes,
          order: confirmOrder
            ? { update: { status: "CONFIRMED" } }
            : undefined,
        },
        select: { id: true, status: true, order: { select: { id: true, status: true } } },
      });
      return NextResponse.json({ submission: updated });
    }

    if (action === "reject") {
      const updated = await prisma.giftCardSubmission.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewNotes: body?.reviewNotes ? String(body.reviewNotes) : submission.reviewNotes,
        },
        select: { id: true, status: true, reviewNotes: true },
      });
      return NextResponse.json({ submission: updated });
    }

    if (action === "reveal") {
      let code: string;
      let pin: string | null = null;
      try {
        code = decryptGiftCardSecret(submission.codeEncrypted);
        pin = submission.pinEncrypted ? decryptGiftCardSecret(submission.pinEncrypted) : null;
      } catch (error) {
        console.error("Error decrypting gift card submission:", error);
        return NextResponse.json(
          { error: "Could not decrypt this code. Is GIFT_CARD_ENC_KEY the same key used at submission time?" },
          { status: 500 }
        );
      }
      return NextResponse.json({ id: submission.id, brand: submission.brand, code, pin });
    }

    return NextResponse.json(
      { error: "Unknown action. Use 'verify', 'reject', or 'reveal'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating gift card submission:", error);
    return NextResponse.json({ error: "Failed to update gift card submission" }, { status: 500 });
  }
}
