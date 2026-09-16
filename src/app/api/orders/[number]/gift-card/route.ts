import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";
import { encryptGiftCardSecret, last4OfCode, validateGiftCardSubmission } from "@/lib/gift-cards";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ number: string }> };

/**
 * Customer-side gift card retry: replaces a rejected submission with a new
 * code (same order, one active submission). Only while payment is still
 * pending. A note is posted to the thread so the admin sees the retry.
 */
export async function POST(request: Request, { params }: RouteParams) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }
  try {
    const { number } = await params;
    const body = await request.json().catch(() => ({}));

    const order = await prisma.order.findUnique({ where: { number } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email || order.email.trim().toLowerCase() !== email) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "This order can no longer be paid with a new gift card. Contact us on WhatsApp." },
        { status: 400 }
      );
    }

    const result = validateGiftCardSubmission(body.giftCard ?? {});
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const pinValue: string | null = result.pin ? encryptGiftCardSecret(result.pin) : null;
    const codeValue = encryptGiftCardSecret(result.code);
    const last4Value = last4OfCode(result.code);

    // One active submission per order: replacing a rejected card updates the
    // existing row (orderId is unique) and resets it to SUBMITTED.
    const submission = await prisma.giftCardSubmission.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        brand: result.brand,
        codeEncrypted: codeValue,
        codeLast4: last4Value,
        pinEncrypted: pinValue,
        claimedValue: result.claimedValue,
        status: "SUBMITTED",
      },
      update: {
        brand: result.brand,
        codeEncrypted: codeValue,
        codeLast4: last4Value,
        pinEncrypted: pinValue,
        claimedValue: result.claimedValue,
        status: "SUBMITTED",
        reviewNotes: null,
      },
      select: { id: true, brand: true, codeLast4: true, status: true },
    });

    const retryNote =
      `🎁 Submitted a new ${submission.brand.replace(/_/g, " ")} gift card code (•••• ${submission.codeLast4}) — please check again.`;
    await prisma.orderMessage.create({
      data: {
        orderId: order.id,
        senderRole: "CUSTOMER",
        body: retryNote,
        readByAdmin: false,
        readByCustomer: true,
      },
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error("Error resubmitting gift card:", error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to submit gift card" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to submit gift card. Please try again." }, { status: 500 });
  }
}
