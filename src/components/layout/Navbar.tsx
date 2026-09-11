"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Menu } from "lucide-react";
import Logo from "./Logo";
import AnnouncementBar from "./AnnouncementBar";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import SearchOverlay from "./SearchOverlay";
import LocaleSelector from "./LocaleSelector";
import AccountButton from "./AccountButton";
import ShoppingBagButton from "./ShoppingBagButton";
import { WishlistButton } from "./WishlistButton";
import { useCart } from "@/context/CartContext";

/**
 * Storefront header — three rows per the reference:
 *  1. dark brand switcher (scrolls away)
 *  2. utility row: locale left · promo center · care links right (desktop)
 *  3. sticky white main row: search-underline left · centered wordmark · icons right
 *  4. centered desktop category nav (inside the sticky header)
 */
export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <>
      <AnnouncementBar />

      {/* ── Utility row (desktop, scrolls away) ─────────────────────────── */}
      <div className="hidden border-b border-hairline bg-white lg:block">
        <div className="mx-auto grid max-w-[1440px] grid-cols-3 items-center px-8 py-2 text-[10.5px] uppercase tracking-[0.14em] text-muted">
          <div className="flex justify-start">
            <LocaleSelector />
          </div>
          <p className="text-center normal-case tracking-[0.06em]">
            Complimentary shipping &amp; returns on all orders
          </p>
          <div className="flex items-center justify-end gap-6">
            <Link href="/customer-care" className="transition-colors hover:text-ink">
              Customer Care
            </Link>
            <Link href="/customer-care" className="transition-colors hover:text-ink">
              Store Locator
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-hairline bg-white">
        {/* ── Main row ─────────────────────────────────────────────────── */}
        <div className="relative flex h-16 items-center justify-between px-4 sm:px-6 lg:h-[76px] lg:px-8">
          {/* Left cluster */}
          <div className="flex flex-1 items-center gap-5">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="-ml-1 p-1 transition-opacity hover:opacity-60 lg:hidden"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-[20px] w-[20px]" strokeWidth={1.25} />
            </button>

            {/* Underlined search control (desktop) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search"
              className="group hidden w-44 items-end justify-between border-b border-ink pb-1.5 text-left lg:inline-flex"
            >
              <span className="text-[12px] tracking-[0.08em] text-ink">Search</span>
              <Search className="h-[16px] w-[16px] text-ink" strokeWidth={1.25} aria-hidden="true" />
            </button>

            {/* Compact locale on small desktop widths */}
            <span className="hidden md:inline lg:hidden">
              <LocaleSelector />
            </span>
          </div>

          {/* Centered wordmark — absolutely centered to the viewport */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Logo className="text-[21px] sm:text-[23px] lg:text-[27px]" />
          </div>

          {/* Right cluster */}
          <div className="flex flex-1 items-center justify-end gap-4 sm:gap-5">
            <span className="hidden items-center sm:inline-flex">
              <WishlistButton />
            </span>
            <span className="hidden items-center sm:inline-flex">
              <AccountButton />
            </span>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-1 transition-opacity hover:opacity-60 lg:hidden"
              aria-label="Open search"
            >
              <Search className="h-[20px] w-[20px]" strokeWidth={1.25} />
            </button>
            <ShoppingBagButton count={totalItems} />
          </div>
        </div>

        {/* ── Mobile icon row: wishlist + account live under the main bar ── */}
        <div className="flex items-center justify-between border-t border-hairline px-4 py-1.5 sm:hidden">
          <span className="inline-flex items-center">
            <LocaleSelector />
          </span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
            <ShoppingBag className="mr-1 inline h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
        </div>

        {/* ── Desktop category nav ─────────────────────────────────────── */}
        <DesktopNav />
      </header>

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
