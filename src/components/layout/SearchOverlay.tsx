"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { NAV_ITEMS, SEARCH_QUICK_LINKS } from "@/lib/nav";

interface Product {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  image: string;
  category: string;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen search overlay in the style of premium fashion storefronts:
 * a large input, trending quick links, and an instant product result grid
 * filtered client-side from the existing /api/products feed.
 */
export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error loading products for search:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = window.setTimeout(() => {
        fetchProducts();
        inputRef.current?.focus();
      }, 0);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = "";
        window.clearTimeout(timer);
        window.removeEventListener("keydown", onKey);
      };
    }
    document.body.style.overflow = "";
  }, [isOpen, onClose]);

  const q = query.trim().toLowerCase();
  const filteredResults =
    q === ""
      ? []
      : products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );

  const browseColumns = NAV_ITEMS.filter((item) => item.children?.length);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-white overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-6 pb-20">
            {/* Input bar */}
            <div className="flex items-center justify-between gap-4 mb-10">
              <div className="relative flex-1 flex items-center border-b border-hairline focus-within:border-ink transition-colors">
                <Search
                  className="w-5 h-5 text-muted mr-3 flex-shrink-0 pointer-events-none"
                  strokeWidth={1.5}
                />
                <label htmlFor="search-input" className="sr-only">
                  Search for products
                </label>
                <input
                  id="search-input"
                  ref={inputRef}
                  type="text"
                  autoComplete="off"
                  placeholder="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full py-4 text-lg md:text-2xl bg-transparent outline-none placeholder:text-muted font-light tracking-wide"
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="p-2 hover:opacity-60 transition-opacity"
              >
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>

            {q !== "" ? (
              <SearchResults
                results={filteredResults}
                query={query.trim()}
                onClose={onClose}
              />
            ) : (
              <SearchEmptyState onClose={onClose} browseColumns={browseColumns} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Results grid ─────────────────────────────────────────────────────────── */

function SearchResults({
  results,
  query,
  onClose,
}: {
  results: Product[];
  query: string;
  onClose: () => void;
}) {
  return (
    <div>
      <p className="text-label text-muted mb-8">
        {results.length} {results.length === 1 ? "Result" : "Results"} for
        &ldquo;{query}&rdquo;
      </p>
      {results.length === 0 ? (
        <div className="py-16 text-center">
          <p className="headline-serif text-2xl md:text-3xl text-ink mb-4">
            Nothing found.
          </p>
          <p className="text-sm text-muted mb-8">
            Check the spelling or explore one of our edits below.
          </p>
          <QuickLinks onClose={onClose} centered />
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
          {results.map((product) => (
            <li key={product.id}>
              <Link href={`/product/${product.id}`} onClick={onClose} className="group block">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-canvas">
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <h3 className="mt-3 text-[13px] leading-snug line-clamp-1">{product.name}</h3>
                <p className="mt-1 text-[13px] text-muted">{product.priceLabel}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuickLinks({
  onClose,
  centered = false,
}: {
  onClose: () => void;
  centered?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap gap-x-8 gap-y-4 ${centered ? "items-center justify-center" : ""}`}
    >
      {SEARCH_QUICK_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClose}
          className="link-underline text-[15px] tracking-wide"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

/* ── Empty state: trending + browse columns ───────────────────────────────── */

function SearchEmptyState({
  onClose,
  browseColumns,
}: {
  onClose: () => void;
  browseColumns: (typeof NAV_ITEMS)[number][];
}) {
  return (
    <div>
      <p className="text-label text-muted mb-6">Trending</p>
      <div className="mb-14">
        <QuickLinks onClose={onClose} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 border-t border-hairline pt-10">
        {browseColumns.map((item) => (
          <div key={item.label}>
            <p className="text-label mb-4">{item.label}</p>
            <ul className="flex flex-col gap-2.5">
              {item.children?.slice(0, 6).map((child, idx) => (
                <li key={`${child.href}-${idx}`}>
                  <Link
                    href={child.href}
                    onClick={onClose}
                    className="text-[13px] text-ink-soft hover:text-ink hover:underline underline-offset-4 transition-colors"
                  >
                    {child.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
