"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";

interface Product {
  id: string;
  slug?: string;
  name: string;
  price: number;
  priceLabel: string;
  compareAtPrice?: number | null;
  compareAtPriceLabel?: string | null;
  image: string;
  images?: string[];
  isNew?: boolean;
  category?: string;
}

interface ProductCarouselProps {
  title?: string;
  eyebrow?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Server-provided products (e.g. PDP related items). When omitted the
   * carousel self-fetches from /api/products, preserving the resilient
   * client-fallback pattern used by the homepage. */
  products?: Product[];
  excludeId?: string;
  priorityFirst?: boolean;
}

const CARD_WIDTH =
  "w-[66vw] min-[480px]:w-[52vw] sm:w-[38vw] md:w-[27vw] lg:w-[22vw] xl:w-[18.5vw]";

/**
 * Horizontal product carousel: scroll-snap track, desktop arrow controls,
 * and edge-bleed scrolling. Falls back to the full catalog from
 * /api/products when no products are passed in.
 */
export default function ProductCarousel({
  title = "New Arrivals",
  eyebrow = "Just In",
  viewAllHref = "/category/new-arrivals",
  viewAllLabel = "View All",
  products: productsProp,
  excludeId,
  priorityFirst = false,
}: ProductCarouselProps) {
  const [products, setProducts] = useState<Product[]>(productsProp ?? []);
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const isSelfFetching = productsProp === undefined;

  useEffect(() => {
    if (!isSelfFetching) {
      setProducts(productsProp);
      return;
    }
    let cancelled = false;
    async function loadProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data) && data.length > 0) {
            setProducts(data);
          }
        }
      } catch (err) {
        console.error("Failed to load products from database:", err);
      }
    }
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [isSelfFetching, productsProp]);

  const visible = products.filter((p) => p.id !== excludeId);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
  }, [visible.length]);

  const scrollByAmount = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="py-14 lg:py-20">
      {/* Header */}
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 flex items-end justify-between gap-6">
        <div>
          {eyebrow && (
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-muted mb-3">
              {eyebrow}
            </p>
          )}
          <h2 className="headline-serif text-3xl sm:text-4xl text-ink">{title}</h2>
        </div>

        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <Link href={viewAllHref} className="link-underline text-label mr-2">
            {viewAllLabel}
          </Link>
          <CarouselArrow
            direction="left"
            disabled={atStart}
            onClick={() => scrollByAmount(-1)}
          />
          <CarouselArrow
            direction="right"
            disabled={atEnd}
            onClick={() => scrollByAmount(1)}
          />
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="mt-8 lg:mt-10 overflow-x-auto snap-x snap-mandatory hide-scrollbar"
      >
        <ul className="flex gap-4 sm:gap-5 px-5 sm:px-8 lg:px-12 w-max">
          {visible.map((product, idx) => (
            <li key={product.id} className={`snap-start flex-shrink-0 ${CARD_WIDTH}`}>
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                priceLabel={product.priceLabel}
                image={product.image}
                images={product.images}
                compareAtPriceLabel={product.compareAtPriceLabel ?? null}
                isNew={product.isNew}
                category={product.category}
                priority={priorityFirst && idx < 4}
              />
            </li>
          ))}

          {/* Skeleton shimmer while self-fetching with no data yet */}
          {isSelfFetching &&
            visible.length === 0 &&
            Array.from({ length: 4 }).map((_, i) => (
              <li key={`skeleton-${i}`} className={`snap-start flex-shrink-0 ${CARD_WIDTH}`}>
                <div className="aspect-[3/4] w-full bg-canvas animate-pulse" />
                <div className="mt-3 h-3 w-2/3 bg-canvas animate-pulse" />
              </li>
            ))}
        </ul>
      </div>

      {/* Mobile "View All" */}
      <div className="md:hidden text-center mt-9">
        <Link href={viewAllHref} className="link-underline text-label">
          {viewAllLabel}
        </Link>
      </div>
    </section>
  );
}

function CarouselArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Scroll products ${direction}`}
      className="w-10 h-10 border border-hairline flex items-center justify-center hover:border-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
    >
      <Icon className="w-4 h-4" strokeWidth={1.5} />
    </button>
  );
}
