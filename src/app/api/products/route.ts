import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";
import { serializeProduct } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json([], { status: 200 });
  }
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products.map(serializeProduct));
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      price,
      compareAtPrice,
      currency,
      category,
      subcategory,
      gender,
      collection,
      image,
      images,
      sku,
      inventory,
      isNew,
      isFeatured,
      description,
    } = body;

    const imageList: string[] = Array.isArray(images)
      ? images.filter((u: unknown): u is string => typeof u === "string" && u.length > 0)
      : [];

    if (!name || price === undefined || price === null || price === "" || (imageList.length === 0 && !image)) {
      return NextResponse.json(
        { error: "Name, price, and at least one image URL are required" },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: "Price must be a valid non-negative number" }, { status: 400 });
    }

    const numericCompare =
      compareAtPrice === undefined || compareAtPrice === null || compareAtPrice === ""
        ? null
        : Number(compareAtPrice);
    if (numericCompare !== null && !Number.isFinite(numericCompare)) {
      return NextResponse.json({ error: "Compare-at price must be a valid number" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        slug: body.slug ? slugify(body.slug) : slugify(name),
        name,
        price: numericPrice,
        compareAtPrice: numericCompare,
        currency: currency || "USD",
        category: category || "Bags",
        subcategory: subcategory || null,
        gender: gender || "Unisex",
        collection: collection || null,
        images: imageList.length > 0 ? imageList : [image as string],
        sku: sku || null,
        inventory: inventory !== undefined ? parseInt(inventory, 10) : 0,
        isNew: Boolean(isNew),
        isFeatured: Boolean(isFeatured),
        status: body.status || "ACTIVE",
        description: description || "",
      },
    });

    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}