"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { NAV_ITEMS, NavItem } from "@/lib/nav";
import { useCart } from "@/context/CartContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * Full-height mobile navigation drawer. Slides in from the left with a
 * soft backdrop; expandable subcategory sections per primary link.
 */
export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { totalItems } = useCart();

  // Body scroll lock + Escape to close while open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const toggle = (label: string) =>
    setExpanded((prev) => (prev === label ? null : label));

  const renderLink = (label: string, href: string, extra?: string) => (
    <Link
      key={href + label}
      href={href}
      onClick={onClose}
      className={`block py-2 text-[13px] tracking-wide text-ink-soft hover:text-ink transition-colors ${extra ?? ""}`}
    >
      {label}
    </Link>
  );

  const renderItem = (item: NavItem) => {
    const isExpanded = expanded === item.label;
    return (
      <div key={item.label} className="border-b border-hairline">
        {item.children && item.children.length > 0 ? (
          <>
            <button
              type="button"
              onClick={() => toggle(item.label)}
              aria-expanded={isExpanded}
              className={`w-full flex items-center justify-between py-4 text-label ${
                item.highlight ? "text-sale" : "text-ink"
              }`}
            >
              {item.label}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                strokeWidth={1.5}
              />
            </button>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="pb-4 flex flex-col">
                    {item.children.map((child) => renderLink(child.label, child.href))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <Link
            href={item.href}
            onClick={onClose}
            className={`block py-4 text-label ${item.highlight ? "text-sale" : "text-ink"}`}
          >
            {item.label}
          </Link>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.38, ease: EASE }}
            className="absolute left-0 top-0 bottom-0 w-[88%] max-w-sm bg-white flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-hairline">
              <span className="wordmark text-[17px]">Coach&nbsp;1</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="p-1 hover:opacity-60 transition-opacity"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Primary navigation */}
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 pt-2">
              {NAV_ITEMS.map(renderItem)}
            </nav>

            {/* Utility links */}
            <div className="px-5 py-5 border-t border-hairline">
              <div className="flex flex-col gap-1 mb-4">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="flex items-center justify-between py-2 text-label"
                >
                  Shopping Bag
                  <span className="text-[11px] text-muted tabular-nums">{totalItems}</span>
                </Link>
                <Link
                  href="/wishlist"
                  onClick={onClose}
                  className="flex items-center justify-between py-2 text-label"
                >
                  Wishlist
                </Link>
                {renderLink("Customer Care", "/customer-care")}
                {renderLink("Privacy Policy", "/privacy-policy")}
                {renderLink("Terms of Use", "/terms")}
              </div>
              <p className="text-[10.5px] text-muted tracking-wide">
                Complimentary shipping &amp; returns on all orders.
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
