/**
 * Shared storefront navigation model.
 * Consumed by the desktop nav, the mobile menu, and the search overlay's
 * quick links so all three stay in sync. Every href maps to a category slug
 * that `buildWhere()` in `src/app/(storefront)/category/[slug]/page.tsx`
 * already resolves into a real product filter.
 */

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  highlight?: boolean;
  children?: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Women",
    href: "/category/women",
    children: [
      { label: "View All", href: "/category/women" },
      { label: "New Arrivals", href: "/category/women-new-arrivals" },
      { label: "Bags", href: "/category/women-bags" },
      { label: "Small Leather Goods", href: "/category/women-leather-goods" },
      { label: "Wallets", href: "/category/women-leather-goods" },
      { label: "Shoes", href: "/category/women-shoes" },
      { label: "Accessories", href: "/category/women-accessories" },
      { label: "Ready-To-Wear", href: "/category/women-ready-to-wear" },
      { label: "Gifts", href: "/category/gifts" },
    ],
  },
  {
    label: "Men",
    href: "/category/men",
    children: [
      { label: "View All", href: "/category/men" },
      { label: "New Arrivals", href: "/category/men-new-arrivals" },
      { label: "Bags", href: "/category/men-bags" },
      { label: "Wallets", href: "/category/men-wallets" },
      { label: "Shoes", href: "/category/men-shoes" },
      { label: "Accessories", href: "/category/men-accessories" },
      { label: "Ready-To-Wear", href: "/category/men-ready-to-wear" },
    ],
  },
  {
    label: "New",
    href: "/category/new-arrivals",
    children: [
      { label: "All New Arrivals", href: "/category/new-arrivals" },
      { label: "Women's New", href: "/category/women-new-arrivals" },
      { label: "Men's New", href: "/category/men-new-arrivals" },
      { label: "The Tabby Edit", href: "/category/tabby-collection" },
      { label: "Season Edit", href: "/category/season-edit" },
    ],
  },
  { label: "Bags", href: "/category/women-bags" },
  { label: "Shoes", href: "/category/shoes" },
  { label: "Wallets", href: "/category/wallets" },
  { label: "Sale", href: "/category/sale", highlight: true },
  { label: "Discover", href: "/category/season-edit" },
];

export const LOCALES = [
  { code: "US", label: "United States (USD $)", flag: "🇺🇸" },
  { code: "GB", label: "United Kingdom (GBP £)", flag: "🇬🇧" },
  { code: "CA", label: "Canada (CAD $)", flag: "🇨🇦" },
  { code: "AU", label: "Australia (AUD $)", flag: "🇦🇺" },
  { code: "FR", label: "France (EUR €)", flag: "🇫🇷" },
  { code: "DE", label: "Germany (EUR €)", flag: "🇩🇪" },
  { code: "AE", label: "UAE (AED د.إ)", flag: "🇦🇪" },
  { code: "NG", label: "Nigeria (NGN ₦)", flag: "🇳🇬" },
];

export const WISHLIST_EVENT = "coach1:wishlist-updated";

export function getWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("coach1:wishlist");
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function isWishlisted(id: string): boolean {
  return getWishlist().includes(id);
}

export function toggleWishlist(id: string): boolean {
  if (typeof window === "undefined") return false;
  const current = getWishlist();
  const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
  try {
    window.localStorage.setItem("coach1:wishlist", JSON.stringify(next));
  } catch {
    /* storage unavailable — state simply won't persist */
  }
  window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: { id, wishlisted: next.includes(id) } }));
  return next.includes(id);
}

export function wishlistCount(): number {
  return getWishlist().length;
}

/** Quick category links surfaced inside the search overlay. */
export const SEARCH_QUICK_LINKS: { label: string; href: string }[] = [
  { label: "New Arrivals", href: "/category/new-arrivals" },
  { label: "The Tabby Edit", href: "/category/tabby-collection" },
  { label: "Shoulder Bags", href: "/category/women-bags" },
  { label: "Shoes", href: "/category/shoes" },
  { label: "Gifts", href: "/category/gifts" },
  { label: "Sale", href: "/category/sale" },
];
