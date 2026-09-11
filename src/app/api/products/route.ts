import { NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/prisma";
import { serializeProduct } from "@/lib/serializers";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || `bag-${Date.now()}`;
  let slug = root;
  let n = 2;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${root}-${n++}`;
  }
}

function parseInventory(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? "0"), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function parseImages(body: { image?: unknown; images?: unknown }): string[] {
  const list: string[] = Array.isArray(body.images)
    ? body.images.filter((u: unknown): u is string => typeof u === "string" && u.length > 0)
    : [];
  if (list.length === 0 && typeof body.image === "string" && body.image.length > 0) {
    list.push(body.image);
  }
  return list;
}

export async function GET(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json([], { status: 200 });
  }
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope");
    const adminScope = scope === "admin" && (await isAdminRequest(request));

    const products = await prisma.product.findMany({
      where: adminScope ? {} : { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products.map(serializeProduct));
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
      sku,
      inventory,
      isNew,
      isFeatured,
      description,
      status,
    } = body;

    const imageList = parseImages(body);

    if (!name || price === undefined || price === null || price === "" || imageList.length === 0) {
      return NextResponse.json(
        { error: "Name, price, and at least one photo are required" },
        { status: 400 },
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
        slug: await uniqueSlug(typeof body.slug === "string" && body.slug ? body.slug : name),
        name,
        price: numericPrice,
        compareAtPrice: numericCompare,
        currency: currency || "USD",
        category: category || "Bags",
        subcategory: subcategory || null,
        gender: gender || "Unisex",
        collection: collection || null,
        images: imageList,
        sku: typeof sku === "string" && sku.trim() ? sku.trim() : null,
        inventory: parseInventory(inventory),
        isNew: Boolean(isNew),
        isFeatured: Boolean(isFeatured),
        status: status === "HIDDEN" ? "HIDDEN" : "ACTIVE",
        description: description || "",
      },
    });

    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
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
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
      data.slug = await uniqueSlug(body.slug || body.name, id);
    }
    if (body.price !== undefined && body.price !== null && body.price !== "") {
      const numericPrice = Number(body.price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return NextResponse.json({ error: "Price must be a valid non-negative number" }, { status: 400 });
      }
      data.price = numericPrice;
    }
    if (body.compareAtPrice !== undefined) {
      if (body.compareAtPrice === null || body.compareAtPrice === "") {
        data.compareAtPrice = null;
      } else {
        const numericCompare = Number(body.compareAtPrice);
        if (!Number.isFinite(numericCompare)) {
          return NextResponse.json({ error: "Compare-at price must be a valid number" }, { status: 400 });
        }
        data.compareAtPrice = numericCompare;
      }
    }
    if (typeof body.category === "string") data.category = body.category;
    if (body.subcategory !== undefined) data.subcategory = body.subcategory || null;
    if (typeof body.gender === "string") data.gender = body.gender;
    if (body.collection !== undefined) data.collection = body.collection || null;
    if (body.sku !== undefined) data.sku = typeof body.sku === "string" && body.sku.trim() ? body.sku.trim() : null;
    if (body.inventory !== undefined) data.inventory = parseInventory(body.inventory);
    if (body.isNew !== undefined) data.isNew = Boolean(body.isNew);
    if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured);
    if (body.description !== undefined) data.description = body.description || "";
    if (body.status === "HIDDEN" || body.status === "ACTIVE") data.status = body.status;

    const imageList = parseImages(body);
    if (imageList.length > 0) data.images = imageList;

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json(serializeProduct(product));
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
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
