import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "Newsletter signup is unavailable right now" },
      { status: 503 },
    );
  }
  try {
    const body = await request.json();
    const { email, consent, source } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    if (consent !== true) {
      return NextResponse.json(
        { error: "Consent is required to join the mailing list" },
        { status: 400 }
      );
    }

    const subscription = await prisma.newsletterSubscription.upsert({
      where: { email: normalized },
      update: { consent: true, source: source || "footer" },
      create: {
        email: normalized,
        consent: true,
        source: source || "footer",
      },
    });

    return NextResponse.json(
      { subscribed: true, email: subscription.email },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}