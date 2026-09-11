import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json([], { status: 200 });
  }
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subtitle, image, link, isFeatured, displayOrder } = body;

    if (!title || !image) {
      return NextResponse.json(
        { error: "Title and image URL are required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        subtitle: subtitle || "",
        image,
        link: link || "#",
        isFeatured: Boolean(isFeatured),
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
