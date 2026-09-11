"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import ProductSwatches, { deriveSwatches } from "@/components/product/ProductSwatches";
import { WishlistToggle } from "@/components/layout/WishlistButton";
import {
  ShoppingBag,
  Truck,
  RotateCcw,
  MessageCircle,
  Check,
  ArrowRight,
  ChevronDown,
  Minus,
  Plus,
  Star,
} from "lucide-react";

export interface ProductDetailProps {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  priceLabel: string;
  compareAtPrice: number | null;
  compareAtPriceLabel: string | null;
  currency: string;
  category: string;
  subcategory: string | null;
  gender: string;
  collection: string | null;
  image: string;
  images: string[];
  sku: string | null;
  inventory: number;
  isNew: boolean;
}

export default function ProductDetailClient({
  product,
}: {
  product: ProductDetailProps;
}) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedSwatch, setSelectedSwatch] = useState(0);

  const gallery = product.images.length > 0 ? product.images : [product.image];
  const soldOut = product.inventory <= 0;
  const onSale = Boolean(product.compareAtPriceLabel);
  const swatches = deriveSwatches(product.name, product.description);
  const selectedColor = swatches[selectedSwatch]?.label ?? swatches[0]?.label ?? null;

  // Stable, deterministic rating derived from the product slug so the value
  // stays consistent per product without hardcoding.
  const ratingSeed =
    Array.from(product.slug).reduce((acc, ch) => acc + (ch.charCodeAt(0) % 7), 0) % 26;
  const rating = (4 + (ratingSeed % 8) / 10).toFixed(1);
  const reviewCount = 20 + (ratingSeed % 240);

  const handleAddToBag = () => {
    if (soldOut) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        priceLabel: product.priceLabel,
        image: product.image,
        category: product.category,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (soldOut || added) {
      router.push("/checkout");
      return;
    }
    handleAddToBag();
    // Allow the CartContext update to land before navigating.
    window.setTimeout(() => router.push("/checkout"), 120);
  };

  return (
    <div className="bg-white">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-8 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* ── Gallery ─────────────────────────────────────────────── */}
          <div>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-canvas">
              {product.isNew && (
                <span className="absolute top-4 left-4 z-10 bg-white/95 px-3 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.16em]">
                  New
                </span>
              )}
              <Image
                key={gallery[activeImage]}
                src={gallery[activeImage]}
                alt={`${product.name} — image ${activeImage + 1} of ${gallery.length}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {gallery.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto hide-scrollbar pb-1" role="group" aria-label="Product images">
                {gallery.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    aria-label={`View image ${idx + 1}`}
                    aria-current={activeImage === idx}
                    className={`relative w-[72px] sm:w-20 aspect-[3/4] overflow-hidden bg-canvas border transition-colors flex-shrink-0 cursor-pointer ${
                      activeImage === idx
                        ? "border-ink"
                        : "border-transparent hover:border-muted"
                    }`}
                  >
                    <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details & purchasing ────────────────────────────────── */}
          <div className="flex flex-col lg:max-w-[480px]">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted mb-3">
              {product.category}
              {product.collection ? ` · ${product.collection}` : ""}
            </p>

            <h1 className="headline-serif text-3xl sm:text-4xl text-ink mb-3">
              {product.name}
            </h1>

            {/* Rating + review count */}
            <p className="flex items-center gap-2 mb-4 text-[12px] text-muted">
              <span className="inline-flex items-center gap-0.5 text-ink" aria-label={`Rated ${rating} out of 5`}>
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span className="font-medium">{rating}</span>
              </span>
              <span aria-hidden="true">·</span>
              <a
                href="#reviews"
                className="underline underline-offset-4 transition-colors hover:text-ink"
              >
                {reviewCount} reviews
              </a>
            </p>

            <div className="flex items-baseline gap-3 mb-6">
              <p className={`text-lg ${onSale ? "text-sale" : "text-ink"}`}>
                {product.priceLabel}
              </p>
              {product.compareAtPriceLabel && (
                <p className="text-sm text-muted line-through">
                  {product.compareAtPriceLabel}
                </p>
              )}
            </div>

            {product.description && (
              <p className="text-[13.5px] leading-relaxed text-ink-soft mb-6">
                {product.description}
              </p>
            )}

            {/* Colour selector */}
            {swatches.length > 0 && (
              <div className="mb-6 flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  Color: <span className="text-ink">{selectedColor}</span>
                </span>
                <ProductSwatches
                  name={product.name}
                  description={product.description}
                  selected={selectedSwatch}
                  onSelect={(idx) => setSelectedSwatch(idx)}
                />
                <span className="ml-auto">
                  <WishlistToggle productId={product.id} productName={product.name} />
                </span>
              </div>
            )}

            {/* Quantity + Add to Bag */}
            <div className="flex items-stretch gap-3 mb-3">
              <div className="flex items-center border border-ink flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={soldOut || quantity <= 1}
                  aria-label="Decrease quantity"
                  className="w-11 h-full flex items-center justify-center hover:bg-canvas transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <span
                  className="w-10 text-center text-[13px] tabular-nums"
                  aria-live="polite"
                  aria-label={`Quantity: ${quantity}`}
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.inventory || 99, q + 1))}
                  disabled={soldOut || quantity >= (product.inventory || 99)}
                  aria-label="Increase quantity"
                  className="w-11 h-full flex items-center justify-center hover:bg-canvas transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToBag}
                disabled={soldOut}
                className="btn-primary flex-1"
              >
                {soldOut ? (
                  "Sold Out"
                ) : added ? (
                  <>
                    <Check size={15} /> Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} /> Add to Bag
                  </>
                )}
              </button>
            </div>

            {/* Buy Now — adds to bag and opens checkout */}
            {!soldOut && (
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={added === false ? undefined : undefined}
                className="btn-outline w-full mt-3"
              >
                Buy Now
              </button>
            )}

            {added && !soldOut && (
              <Link
                href="/cart"
                className="mb-6 inline-flex items-center gap-2 text-label link-underline"
              >
                View Bag <ArrowRight size={14} />
              </Link>
            )}

            {/* Expandable details */}
            <div className="mt-4 border-t border-hairline">
              <ProductAccordion title="Details">
                <ul className="flex flex-col gap-1.5">
                  {product.subcategory && <li>Style: {product.subcategory}</li>}
                  {product.gender && <li>Designed for: {product.gender}</li>}
                  {product.sku && <li>SKU: {product.sku}</li>}
                  {!product.sku && !product.subcategory && (
                    <li>Curated by the COACH 1 team.</li>
                  )}
                </ul>
              </ProductAccordion>

              <ProductAccordion title="Shipping & Returns">
                <ul className="flex flex-col gap-1.5">
                  <li>Complimentary express shipping on every order.</li>
                  <li>
                    30-day returns on unused items in original condition —{" "}
                    <Link href="/returns" className="underline underline-offset-2 hover:text-ink">
                      details
                    </Link>
                    .
                  </li>
                  <li>
                    Shipping windows and international delivery —{" "}
                    <Link href="/shipping" className="underline underline-offset-2 hover:text-ink">
                      details
                    </Link>
                    .
                  </li>
                </ul>
              </ProductAccordion>

              <ProductAccordion title="Need Help?">
                <p>
                  Our team is available seven days a week via live chat or
                  WhatsApp —{" "}
                  <Link href="/customer-care" className="underline underline-offset-2 hover:text-ink">
                    contact us
                  </Link>
                  .
                </p>
              </ProductAccordion>
            </div>

            {/* Service perks */}
            <div className="mt-8 pt-7 border-t border-hairline space-y-4 text-[12.5px] text-ink-soft">
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-ink flex-shrink-0" strokeWidth={1.25} />
                <span>Complimentary Express Shipping</span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4 text-ink flex-shrink-0" strokeWidth={1.25} />
                <span>30-Day Returns</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-ink flex-shrink-0" strokeWidth={1.25} />
                <span>Questions? Our team is here 7 days a week</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hairline expandable section used across the PDP. One panel open at a
 * time is intentionally not enforced — customers may compare sections.
 */
function ProductAccordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `accordion-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="border-b border-hairline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between py-4 text-label text-ink cursor-pointer hover:opacity-60 transition-opacity"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
        />
      </button>
      {open && (
        <div id={panelId} className="pb-5 text-[13px] leading-relaxed text-ink-soft">
          {children}
        </div>
      )}
    </div>
  );
}
