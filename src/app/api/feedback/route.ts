import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "Feedback is unavailable right now" },
      { status: 503 },
    );
  }
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    if (message.trim().length > 5000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    if (email) {
      const normalized = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
      }
    }

    const feedback = await prisma.feedback.create({
      data: {
        name: name?.trim() || null,
        email: email?.trim() || null,
        message: message.trim(),
      },
    });

    return NextResponse.json({ submitted: true, id: feedback.id }, { status: 201 });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}