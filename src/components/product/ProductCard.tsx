"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Check } from "lucide-react";
import ProductSwatches from "@/components/product/ProductSwatches";
import { WishlistToggle } from "@/components/layout/WishlistButton";

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  image: string;
  /** Full image list — when a second image exists it is revealed on hover. */
  images?: string[];
  compareAtPriceLabel?: string | null;
  isNew?: boolean;
  category?: string;
  subcategory?: string | null;
  description?: string | null;
  inventory?: number;
}

interface ProductCardProps extends ProductCardData {
  /** Eager-load the image (for above-the-fold carousel items). */
  priority?: boolean;
  /** Hide the quick-add affordance (e.g. inside search results). */
  compact?: boolean;
  /** Force the sold-out state (when inventory is known server-side). */
  soldOut?: boolean;
}

/**
 * Storefront product card: 3:4 editorial image, hover second-image reveal,
 * quiet "New" tag, desktop-only quick add (existing cart flow), and
 * sale pricing in the reference's red treatment.
 */
export default function ProductCard({
  id,
  name,
  price,
  priceLabel,
  image,
  images,
  compareAtPriceLabel,
  isNew,
  category,
  description,
  soldOut = false,
  priority = false,
  compact = false,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const hoverImage =
    images && images.length > 1 ? images.find((src) => src !== image) : undefined;

  const unavailable = soldOut;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (unavailable) return;
    addToCart({
      id,
      name,
      price,
      priceLabel: priceLabel || `$${price.toFixed(2)}`,
      image,
      category,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const onSale = Boolean(compareAtPriceLabel);

  return (
    <div className="group relative flex flex-col">
      {/* Image */}
      <div className="relative">
        <Link
          href={`/product/${id}`}
          aria-label={name}
          className="relative block aspect-[3/4] w-full overflow-hidden bg-canvas"
        >
        {image && (
          <Image
            src={image}
            alt={name}
            fill
            priority={priority}
            sizes="(max-width: 480px) 75vw, (max-width: 768px) 45vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover transition-opacity duration-500 ease-out group-hover:opacity-0"
          />
        )}
        {hoverImage && (
          <Image
            src={hoverImage}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 480px) 75vw, (max-width: 768px) 45vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
          />
        )}

        {unavailable ? (
          <span className="absolute top-3 left-3 bg-white/95 px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.16em] text-ink">
            Sold Out
          </span>
        ) : (
          <>
            {isNew && (
              <span className="absolute top-3 left-3 bg-white/95 px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.16em] text-ink">
                New
              </span>
            )}
            {onSale && (
              <span className="absolute top-3 right-3 bg-white/95 px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.16em] text-sale">
                Sale
              </span>
            )}
          </>
        )}
        </Link>

        {/* Quick add — desktop hover only */}
        {!compact && (
          <div className="absolute bottom-3 left-3 right-3 hidden lg:block opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={unavailable}
              className="w-full bg-white/95 backdrop-blur-sm text-ink border border-hairline py-3 text-[10.5px] font-medium uppercase tracking-[0.16em] hover:bg-ink hover:text-white hover:border-ink transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {added ? (
                <span className="inline-flex items-center gap-2">
                  <Check size={13} /> Added to Bag
                </span>
              ) : unavailable ? (
                "Sold Out"
              ) : (
                "Quick Add"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="pt-3.5 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[13px] leading-snug text-ink">
              <Link href={`/product/${id}`} className="hover:underline underline-offset-4">
                {name}
              </Link>
            </h3>
            {category && (
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted">
                {category}
              </p>
            )}
            <ProductSwatches name={name} description={description} compact className="mt-2" />
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-[13px] ${onSale ? "text-sale" : "text-ink"}`}>{priceLabel}</p>
            {compareAtPriceLabel && (
              <p className="text-[12px] text-muted line-through mt-0.5">{compareAtPriceLabel}</p>
            )}
          </div>
        </div>
        <WishlistToggle
          productId={id}
          productName={name}
          className="absolute top-2.5 right-2.5 z-10 opacity-0 transition-all duration-200 group-hover:opacity-100"
        />
      </div>
    </div>
  );
}
