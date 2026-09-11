"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import EditorialGridTile from "@/components/category/EditorialGridTile";
import { deriveSwatches } from "@/components/product/ProductSwatches";

export interface CategoryProduct {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  image: string;
  images?: string[];
  compareAtPriceLabel?: string | null;
  isNew?: boolean;
  category?: string;
  subcategory?: string | null;
  description?: string | null;
  inventory?: number;
}

type SortKey = "best" | "newest" | "price-asc" | "price-desc";

const MATERIAL_KEYWORDS = [
  "Nappa leather",
  "Pebble leather",
  "Suede",
  "Canvas",
  "Denim",
  "Shearling",
  "Satin",
  "Patent leather",
  "Raffia",
  "Metallic",
];

function deriveMaterials(name: string, description?: string | null): string[] {
  const haystack = `${name} ${description ?? ""}`;
  const found = MATERIAL_KEYWORDS.filter((m) => {
    const key = m.split(" ")[0];
    return new RegExp(key, "i").test(haystack);
  });
  return found.slice(0, 4);
}

function derivePriceBuckets(products: CategoryProduct[]): [number, number][] {
  const prices = products
    .map((p) => p.price)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  if (prices.length === 0) return [];
  const min = Math.floor(prices[0] / 50) * 50;
  const max = Math.ceil(prices[prices.length - 1] / 50) * 50;
  const span = Math.max(50, max - min);
  const step = span <= 200 ? 50 : span <= 500 ? 100 : 250;
  const buckets: [number, number][] = [];
  for (let lo = min; lo < max; lo += step) {
    buckets.push([lo, Math.min(lo + step, max)]);
  }
  return buckets.slice(0, 5);
}

function deriveCategories(products: CategoryProduct[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    if (p.subcategory) set.add(p.subcategory);
    else if (p.category) set.add(p.category);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b)).slice(0, 8);
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "best", label: "Best Matches" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price Low to High" },
  { value: "price-desc", label: "Price High to Low" },
];

const PAGE_SIZE = 12;
const PAGE_STEP = 8;

type PillId = "color" | "material" | "price" | "category";

const EDITORIAL_TILE = {
  image: "/hero-tabby-street.png",
  eyebrow: "The Tabby Edit",
  headline: "Your perfect plus-one, all summer long.",
  copy: "Soft structure, signature hardware — built for every day.",
  ctaText: "Shop Tabby",
  ctaHref: "/category/tabby-collection",
};

/**
 * Client-side category grid over server-fetched products. Pill filters
 * (color / material / price / category), Best-Matches sorting, and
 * progressive loading are presentation-only — the Prisma query and its
 * slug→filter mapping stay on the server exactly as before. An editorial
 * tile punctuates the grid after the 7th product, per the reference.
 */
export default function CategoryGrid({
  products,
}: {
  products: CategoryProduct[];
}) {
  const [sort, setSort] = useState<SortKey>("best");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openPill, setOpenPill] = useState<PillId | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const availableColors = useMemo(() => {
    const set = new Map<string, string>();
    for (const p of products) {
      for (const s of deriveSwatches(p.name, p.description)) {
        if (!set.has(s.label)) set.set(s.label, s.hex);
      }
    }
    return Array.from(set.entries()).map(([label, hex]) => ({ label, hex }));
  }, [products]);

  const availableMaterials = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      for (const m of deriveMaterials(p.name, p.description)) set.add(m);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const priceBuckets = useMemo(() => derivePriceBuckets(products), [products]);
  const categories = useMemo(() => deriveCategories(products), [products]);

  // Close the open pill popover on outside click / Escape.
  useEffect(() => {
    if (!openPill) return;
    const onDown = (e: PointerEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenPill(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPill(null);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openPill]);

  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFiltersOpen]);

  const resetFilters = () => {
    setSelectedColors([]);
    setSelectedMaterials([]);
    setSelectedPrices([]);
    setSelectedCategory(null);
    setVisibleCount(PAGE_SIZE);
  };

  const activeFilterCount =
    selectedColors.length +
    selectedMaterials.length +
    selectedPrices.length +
    (selectedCategory ? 1 : 0);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && (p.subcategory ?? p.category) !== selectedCategory) return false;
      if (selectedColors.length > 0) {
        const labels = deriveSwatches(p.name, p.description).map((s) => s.label);
        if (!selectedColors.some((c) => labels.includes(c))) return false;
      }
      if (selectedMaterials.length > 0) {
        const haystack = `${p.name} ${p.description ?? ""}`.toLowerCase();
        if (!selectedMaterials.some((m) => haystack.includes(m.split(" ")[0].toLowerCase()))) return false;
      }
      if (selectedPrices.length > 0) {
        const inBucket = selectedPrices.some((key) => {
          const [lo, hi] = key.split("-").map(Number);
          return p.price >= lo && p.price <= hi;
        });
        if (!inBucket) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedColors, selectedMaterials, selectedPrices]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        list.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
        break;
      default:
        break; // "best" preserves the server ordering
    }
    return list;
  }, [filtered, sort]);

  const visible = sorted.slice(0, visibleCount);
  const remaining = sorted.length - visible.length;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (remaining <= 0) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + PAGE_STEP, sorted.length));
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [remaining, sorted.length]);

  const changeSort = (value: SortKey) => {
    setSort(value);
    setVisibleCount(PAGE_SIZE);
  };

  const toggleColor = (value: string) => {
    setSelectedColors(
      selectedColors.includes(value)
        ? selectedColors.filter((c) => c !== value)
        : [...selectedColors, value]
    );
    setVisibleCount(PAGE_SIZE);
  };
  const toggleMaterial = (value: string) => {
    setSelectedMaterials(
      selectedMaterials.includes(value)
        ? selectedMaterials.filter((c) => c !== value)
        : [...selectedMaterials, value]
    );
    setVisibleCount(PAGE_SIZE);
  };
  const togglePrice = (key: string) => {
    setSelectedPrices(
      selectedPrices.includes(key)
        ? selectedPrices.filter((c) => c !== key)
        : [...selectedPrices, key]
    );
    setVisibleCount(PAGE_SIZE);
  };
  const toggleCategory = (value: string) => {
    setSelectedCategory(selectedCategory === value ? null : value);
    setVisibleCount(PAGE_SIZE);
  };

  const pills: { id: PillId; label: string; count: number }[] = [
    { id: "color", label: "Color", count: selectedColors.length },
    { id: "material", label: "Material", count: selectedMaterials.length },
    { id: "price", label: "Price", count: selectedPrices.length },
    { id: "category", label: "Category", count: selectedCategory ? 1 : 0 },
  ];

  return (
    <div>
      {/* ── Grid header: View All + product count ─────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-8 lg:pt-12">
        <p className="text-[26px] leading-none tracking-[0.02em] text-ink">
          View All{" "}
          <span className="text-[15px] font-normal text-muted">
            {filtered.length} {filtered.length === 1 ? "Product" : "Products"}
          </span>
        </p>
      </div>

      {/* ── Toolbar: pills + sort ─────────────────────────────────────── */}
      <div
        ref={toolbarRef}
        className="relative max-w-[1440px] mx-auto px-5 pb-10 sm:px-8 lg:px-12"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Mobile filter trigger + desktop pills */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              aria-haspopup="dialog"
              className="rounded-pill border border-hairline bg-white px-5 py-2 text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink cursor-pointer"
            >
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
          </div>
          <div className="hidden w-full md:flex flex-wrap items-center gap-2.5">
          {pills.map((pill) => (
            <PillButton
              key={pill.id}
              label={pill.label}
              count={pill.count}
              open={openPill === pill.id}
              onToggle={() => setOpenPill(openPill === pill.id ? null : pill.id)}
            />
          ))}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] uppercase tracking-[0.14em] text-muted underline underline-offset-4 hover:text-ink transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="relative">
          <label htmlFor="category-sort" className="sr-only">Sort products</label>
          <select
            id="category-sort"
            value={sort}
            onChange={(e) => changeSort(e.target.value as SortKey)}
            className="appearance-none border border-hairline bg-white py-2 pl-3.5 pr-8 text-[12.5px] tracking-wide text-ink outline-none transition-colors hover:border-ink cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ── Filter popover (desktop) ─────────────────────────────────────── */}
      {openPill && (
        <FilterPopover onClose={() => setOpenPill(null)}>
          {openPill === "color" && (
            <ul className="flex flex-col gap-2.5">
              {availableColors.map((swatch) => (
                <li key={swatch.label}>
                  <button
                    type="button"
                    onClick={() => toggleColor(swatch.label)}
                    aria-pressed={selectedColors.includes(swatch.label)}
                    className="flex w-full items-center gap-3 text-left text-[13px] tracking-wide hover:text-ink transition-colors cursor-pointer"
                  >
                    <span
                      className={`h-4 w-4 rounded-full border border-black/15 ${selectedColors.includes(swatch.label) ? "ring-1 ring-ink ring-offset-2" : ""}`}
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className={selectedColors.includes(swatch.label) ? "font-medium text-ink" : "text-ink-soft"}>
                      {swatch.label}
                    </span>
                    {selectedColors.includes(swatch.label) && <CheckMark />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {openPill === "material" && (
            <ul className="flex flex-col gap-2.5">
              {availableMaterials.map((material) => (
                <li key={material}>
                  <button
                    type="button"
                    onClick={() => toggleMaterial(material)}
                    aria-pressed={selectedMaterials.includes(material)}
                    className="flex w-full items-center justify-between text-left text-[13px] tracking-wide transition-colors cursor-pointer"
                  >
                    <span className={selectedMaterials.includes(material) ? "font-medium text-ink" : "text-ink-soft"}>
                      {material}
                    </span>
                    {selectedMaterials.includes(material) && <CheckMark />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {openPill === "price" && (
            <ul className="flex flex-col gap-2.5">
              {priceBuckets.map(([lo, hi]) => {
                const key = `${lo}-${hi}`;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => togglePrice(key)}
                      aria-pressed={selectedPrices.includes(key)}
                      className="flex w-full items-center justify-between text-left text-[13px] tracking-wide transition-colors cursor-pointer"
                    >
                      <span className={selectedPrices.includes(key) ? "font-medium text-ink" : "text-ink-soft"}>
                        ${lo.toFixed(0)} — ${hi.toFixed(0)}
                      </span>
                      {selectedPrices.includes(key) && <CheckMark />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {openPill === "category" && (
            <ul className="flex flex-col gap-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => toggleCategory("All")}
                  aria-pressed={selectedCategory === null}
                  className={`flex w-full items-center justify-between text-left text-[13px] tracking-wide transition-colors cursor-pointer ${
                    selectedCategory === null ? "font-medium text-ink" : "text-ink-soft"
                  }`}
                >
                  <span>All</span>
                  {selectedCategory === null && <CheckMark />}
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    aria-pressed={selectedCategory === cat}
                    className={`flex w-full items-center justify-between text-left text-[13px] tracking-wide transition-colors cursor-pointer ${
                      selectedCategory === cat ? "font-medium text-ink" : "text-ink-soft"
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <CheckMark />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FilterPopover>
      )}
      </div>

      {/* ── Product grid (plp surface) ─────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto bg-plp px-4 sm:px-6 lg:px-10 py-14 lg:py-20">
        {visible.length === 0 ? (
          <div className="py-20 text-center">
            <p className="headline-serif text-2xl text-ink mb-4">No products match your filters.</p>
            <p className="text-sm text-muted mb-8">Adjust or clear the active filters to see more.</p>
            <button type="button" onClick={resetFilters} className="btn-outline">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-12 lg:gap-x-8 lg:gap-y-16">
            {visible.map((product, idx) => (
              <React.Fragment key={product.id}>
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
                  description={product.description}
                  soldOut={product.inventory !== undefined ? product.inventory <= 0 : undefined}
                />
                {idx === 6 && (
                  <EditorialGridTile
                    image={EDITORIAL_TILE.image}
                    eyebrow={EDITORIAL_TILE.eyebrow}
                    headline={EDITORIAL_TILE.headline}
                    copy={EDITORIAL_TILE.copy}
                    ctaText={EDITORIAL_TILE.ctaText}
                    ctaHref={EDITORIAL_TILE.ctaHref}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {remaining > 0 && (
          <div ref={sentinelRef} className="mt-16 h-10 flex items-center justify-center text-[11px] tracking-[0.14em] uppercase text-muted">
            Loading more
          </div>
        )}
      </div>

      {/* ── Mobile filter drawer ─────────────────────────────────────── */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 bg-white md:hidden overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Filter products"
        >
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <span className="text-label text-ink">Filters</span>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="Close filters"
              className="p-1 transition-opacity hover:opacity-60"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="px-5 pb-16 pt-6">
            <p className="text-label text-muted mb-5">Color</p>
            <div className="mb-10 flex flex-wrap gap-2.5">
              {availableColors.map((swatch) => (
                <button
                  key={swatch.label}
                  type="button"
                  onClick={() => toggleColor(swatch.label)}
                  aria-pressed={selectedColors.includes(swatch.label)}
                  className={`rounded-pill border px-4 py-2 text-[11.5px] uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                    selectedColors.includes(swatch.label)
                      ? "border-ink bg-ink text-white"
                      : "border-hairline bg-white text-ink-soft hover:border-ink"
                  }`}
                >
                  {swatch.label}
                </button>
              ))}
            </div>

            <p className="text-label text-muted mb-5">Material</p>
            <div className="mb-10 flex flex-wrap gap-2.5">
              {availableMaterials.map((material) => (
                <button
                  key={material}
                  type="button"
                  onClick={() => toggleMaterial(material)}
                  aria-pressed={selectedMaterials.includes(material)}
                  className={`rounded-pill border px-4 py-2 text-[11.5px] uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                    selectedMaterials.includes(material)
                      ? "border-ink bg-ink text-white"
                      : "border-hairline bg-white text-ink-soft hover:border-ink"
                  }`}
                >
                  {material}
                </button>
              ))}
            </div>

            <p className="text-label text-muted mb-5">Price</p>
            <div className="mb-10 flex flex-wrap gap-2.5">
              {priceBuckets.map(([lo, hi]) => {
                const key = `${lo}-${hi}`;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePrice(key)}
                    aria-pressed={selectedPrices.includes(key)}
                    className={`rounded-pill border px-4 py-2 text-[11.5px] uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                      selectedPrices.includes(key)
                        ? "border-ink bg-ink text-white"
                        : "border-hairline bg-white text-ink-soft hover:border-ink"
                    }`}
                  >
                    ${lo.toFixed(0)} — ${hi.toFixed(0)}
                  </button>
                );
              })}
            </div>

            <p className="text-label text-muted mb-5">Category</p>
            <div className="mb-10 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => toggleCategory("All")}
                aria-pressed={selectedCategory === null}
                className={`rounded-pill border px-4 py-2 text-[11.5px] uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                  selectedCategory === null ? "border-ink bg-ink text-white" : "border-hairline bg-white text-ink-soft hover:border-ink"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                  className={`rounded-pill border px-4 py-2 text-[11.5px] uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                    selectedCategory === cat ? "border-ink bg-ink text-white" : "border-hairline bg-white text-ink-soft hover:border-ink"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button type="button" onClick={resetFilters} className="btn-outline w-full">
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary w-full"
              >
                Show {filtered.length} {filtered.length === 1 ? "Result" : "Results"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Toolbar pill ──────────────────────────────────────────────────────── */
function PillButton({
  label,
  count,
  open,
  onToggle,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`rounded-pill border px-4 py-2 text-[11.5px] font-medium uppercase tracking-[0.12em] transition-colors cursor-pointer ${
        open || count > 0
          ? "border-ink bg-white text-ink"
          : "border-hairline bg-white text-ink-soft hover:border-ink"
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        {count > 0 && <span className="text-[10px]">{count}</span>}
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

/* ── Popover panel for a filter group ──────────────────────────────────── */
function FilterPopover({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-40">
      <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className="rounded-sm border border-hairline bg-white shadow-none px-6 py-5">
        {children}
      </div>
    </div>
  );
}

function CheckMark() {
  return (
    <span aria-hidden="true" className="ml-auto text-[12px] text-ink">
      ✓
    </span>
  );
}