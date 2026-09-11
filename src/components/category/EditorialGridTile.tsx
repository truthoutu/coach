"use client";

import React from "react";
import Link from "next/link";

interface EditorialTileProps {
  image: string;
  eyebrow?: string;
  headline: string;
  copy?: string;
  ctaText?: string;
  ctaHref?: string;
  /** Grid span on desktop — editorial tiles punctuate the product rhythm. */
  span?: "1" | "2";
  tall?: boolean;
}

/**
 * EditorialGridTile — storytelling content embedded directly inside product
 * grids (PLP + search). Image-led with a centered caption block; visually
 * belongs to the grid, not a separate campaign section.
 */
export default function EditorialGridTile({
  image,
  eyebrow,
  headline,
  copy,
  ctaText = "Shop Now",
  ctaHref = "/category/new-arrivals",
  span = "1",
  tall = false,
}: EditorialTileProps) {
  return (
    <div className={span === "2" ? "col-span-2 md:col-span-2 xl:col-span-2" : ""}>
      <Link href={ctaHref} className="group block" aria-label={`${headline} — ${ctaText}`}>
        <span
          className={`relative block w-full overflow-hidden bg-canvas ${
            tall ? "aspect-[3/4] md:aspect-[16/10]" : "aspect-[3/4]"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </span>
        <span className="block px-1 pb-1 pt-4 text-center">
          {eyebrow && (
            <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
              {eyebrow}
            </span>
          )}
          <span className="headline-serif mx-auto block max-w-[26ch] text-[19px] leading-snug text-ink">
            &ldquo;{headline}&rdquo;
          </span>
          {copy && (
            <span className="mx-auto mt-2 block max-w-[34ch] text-[12.5px] leading-relaxed text-ink-soft">
              {copy}
            </span>
          )}
          <span className="link-underline mt-3 inline-block text-[11px] font-medium uppercase tracking-[0.16em] text-ink">
            {ctaText}
          </span>
        </span>
      </Link>
    </div>
  );
}
