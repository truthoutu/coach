import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import CategoryGrid from "@/components/category/CategoryGrid";
import { prisma, hasDatabase } from "@/lib/prisma";

/** Database-backed pages must render on demand, never prerender at build. */
export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const TITLE_MAP: Record<string, string> = {
  "new-arrivals": "New Arrivals",
  "women-new-arrivals": "Women's New Arrivals",
  "men-new-arrivals": "Men's New Arrivals",
  "tabby-collection": "The Tabby Collection",
  denim: "On Trend: Denim",
  "season-edit": "Season Edit",
  gifts: "Gifts & Accessories",
  women: "Women's Collection",
  "women-bags": "Women's Bags & Totes",
  "women-leather-goods": "Women's Small Leather Goods",
  "women-accessories": "Women's Accessories & Jewellery",
  "women-ready-to-wear": "Women's Ready-To-Wear",
  "women-shoes": "Women's Footwear",
  men: "Men's Collection",
  "men-bags": "Men's Bags & Backpacks",
  "men-wallets": "Men's Wallets & Card Cases",
  "men-ready-to-wear": "Men's Ready-To-Wear",
  "men-shoes": "Men's Shoes",
  "men-accessories": "Men's Accessories",
  "men-edits": "Men's Seasonal Edits",
  sale: "Special Sale & Offers",
};

function formatTitle(slug: string): string {
  if (TITLE_MAP[slug]) return TITLE_MAP[slug];
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Translates a category URL slug into real product filters.
 * Unknown slugs match nothing rather than dumping the whole catalog.
 */
function buildWhere(slug: string): Record<string, unknown> {
  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (slug === "women" || slug.startsWith("women-")) {
    where.gender = { in: ["Women", "Unisex"] };
  } else if (slug === "men" || slug.startsWith("men-")) {
    where.gender = { in: ["Men", "Unisex"] };
  }

  if (slug.includes("bags")) {
    where.category = "Bags";
  } else if (slug.includes("shoes")) {
    where.category = "Shoes";
  } else if (slug.includes("wallets")) {
    where.category = "Wallets";
  } else if (slug.includes("accessories")) {
    where.category = "Accessories";
  } else if (slug.includes("leather-goods")) {
    where.category = { in: ["Wallets", "Small Leather Goods"] };
  } else if (slug.includes("ready-to-wear")) {
    where.category = "Ready-To-Wear";
  }

  if (slug.includes("new") || slug.includes("new-arrival")) {
    where.isNew = true;
  } else if (slug.includes("sale") || slug.includes("sale-")) {
    where.compareAtPrice = { not: null };
  }

  if (slug.includes("tabby")) {
    where.collection = { in: ["Tabby", "Soft Tabby"] };
  } else if (slug.includes("season-edit")) {
    where.isFeatured = true;
  } else if (slug.includes("gifts")) {
    where.category = { in: ["Bags", "Wallets", "Accessories"] };
  }

  // Denim and other unmapped slugs intentionally return nothing.
  if (slug === "denim") {
    return { status: "ACTIVE", name: { contains: "denim", mode: "insensitive" } };
  }

  return where;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = formatTitle(slug);
  return {
    title,
    description: `Shop ${title} at COACH 1 — hand-picked luxury bags, shoes, and accessories with complimentary shipping and 30-day returns.`,
    alternates: { canonical: `/category/${slug}` },
    openGraph: {
      title: `${title} | COACH 1`,
      description: `Shop ${title} at COACH 1.`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryTitle = formatTitle(slug);

  const products = hasDatabase()
    ? await prisma.product.findMany({
        where: buildWhere(slug) as never,
        orderBy: [{ isNew: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const gridProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price.toNumber(),
    priceLabel: `$${product.price.toNumber().toFixed(2)}`,
    image: product.images[0] ?? "",
    images: product.images,
    compareAtPriceLabel: product.compareAtPrice
      ? `$${product.compareAtPrice.toNumber().toFixed(2)}`
      : null,
    isNew: product.isNew,
    category: product.category,
    subcategory: product.subcategory,
  }));

  return (
    <div className="bg-white">
      {/* Editorial category header */}
      <header className="text-center px-6 pt-14 lg:pt-20 pb-10 lg:pb-14">
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex items-center justify-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-muted">
            <li>
              <Link href="/" className="hover:text-ink transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink">{categoryTitle}</li>
          </ol>
        </nav>
        <h1 className="headline-serif text-4xl sm:text-5xl text-ink">
          {categoryTitle}
        </h1>
        <p className="mt-4 text-[13px] text-muted">
          Hand-picked pieces from our curated boutique.
        </p>
      </header>

      <div className="pb-20 lg:pb-24">
        {products.length === 0 ? (
          <div className="py-16 text-center px-6">
            <p className="headline-serif text-2xl text-ink mb-4">
              Nothing here just yet.
            </p>
            <p className="text-sm text-muted mb-8">
              This edit is being restocked — explore our newest arrivals in
              the meantime.
            </p>
            <Link href="/category/new-arrivals" className="btn-outline">
              Shop New Arrivals
            </Link>
          </div>
        ) : (
          <CategoryGrid products={gridProducts} />
        )}
      </div>
    </div>
  );
}
