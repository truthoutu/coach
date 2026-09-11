import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

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
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { title, subtitle, image, link, isFeatured, displayOrder } = body;

    if (!title || !image) {
      return NextResponse.json(
        { error: "Title and image URL are required" },
        { status: 400 },
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        subtitle: subtitle || "",
        image,
        link: link || "#",
        isFeatured: Boolean(isFeatured),
        displayOrder: displayOrder ? parseInt(String(displayOrder), 10) || 0 : 0,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title;
    if (body.subtitle !== undefined) data.subtitle = body.subtitle || "";
    if (typeof body.image === "string" && body.image) data.image = body.image;
    if (body.link !== undefined) data.link = body.link || "#";
    if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured);
    if (body.displayOrder !== undefined) {
      data.displayOrder = parseInt(String(body.displayOrder), 10) || 0;
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data,
    });
    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
