import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import ProductCarousel from "@/components/home/ProductCarousel";
import { prisma, hasDatabase } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";

/** Database-backed page: render on demand so builds never need a database. */
export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProduct(id: string) {
  if (!hasDatabase()) return null;
  try {
    return await prisma.product.findUnique({
      where: { id, status: "ACTIVE" },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const description =
    product.description ??
    `Shop ${product.name} at COACH 1 — hand-picked luxury with complimentary shipping and 30-day returns.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: `${product.name} | COACH 1`,
      description,
      images: product.images.length > 0 ? [{ url: product.images[0] }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;

  const product = await getProduct(id);

  if (!product) {
    return notFound();
  }

  // Related products: same category first; top up with newest if sparse.
  let related: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  if (hasDatabase()) {
    try {
      related = await prisma.product.findMany({
        where: { status: "ACTIVE", category: product.category, id: { not: product.id } },
        orderBy: [{ isNew: "desc" }, { createdAt: "desc" }],
        take: 8,
      });
      if (related.length < 4) {
        const extra = await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            id: { notIn: [product.id, ...related.map((r) => r.id)] },
          },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          take: 8 - related.length,
        });
        related = [...related, ...extra];
      }
    } catch {
      related = [];
    }
  }

  const relatedProducts = related.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price.toNumber(),
    priceLabel: formatPrice(item.price.toNumber(), item.currency),
    compareAtPriceLabel: item.compareAtPrice
      ? formatPrice(item.compareAtPrice.toNumber(), item.currency)
      : null,
    image: item.images[0] ?? "",
    images: item.images,
    isNew: item.isNew,
    category: item.category,
  }));

  // Structured data for search engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    sku: product.sku ?? undefined,
    category: product.category,
    image: product.images.length > 0 ? product.images : undefined,
    offers: {
      "@type": "Offer",
      price: product.price.toNumber(),
      priceCurrency: product.currency,
      availability:
        product.inventory > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-5">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-muted">
              <li>
                <Link href="/" className="hover:text-ink transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/category/${product.category.toLowerCase()}`}
                  className="hover:text-ink transition-colors"
                >
                  {product.category}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-ink truncate max-w-[140px] sm:max-w-none">
                {product.name}
              </li>
            </ol>
          </nav>
        </div>

        <ProductDetailClient
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            description: product.description,
            price: product.price.toNumber(),
            priceLabel: formatPrice(product.price.toNumber(), product.currency),
            compareAtPrice: product.compareAtPrice
              ? product.compareAtPrice.toNumber()
              : null,
            compareAtPriceLabel: product.compareAtPrice
              ? formatPrice(product.compareAtPrice.toNumber(), product.currency)
              : null,
            currency: product.currency,
            category: product.category,
            subcategory: product.subcategory,
            gender: product.gender,
            collection: product.collection,
            image: product.images[0] ?? "",
            images: product.images,
            sku: product.sku,
            inventory: product.inventory,
            isNew: product.isNew,
          }}
        />
      </div>

      {relatedProducts.length > 0 && (
        <div className="border-t border-hairline">
          <ProductCarousel
            eyebrow="You May Also Like"
            title="Pairs well with"
            viewAllHref="/category/new-arrivals"
            products={relatedProducts}
            excludeId={product.id}
          />
        </div>
      )}
    </>
  );
}
