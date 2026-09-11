"use client";

import React from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import NewsletterForm from "./NewsletterForm";

const WHATSAPP_LINK = "https://wa.me/15058006451";

const LINK_COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Customer Care",
    links: [
      { label: "Contact Us", href: "/customer-care" },
      { label: "FAQs", href: "/faq" },
      { label: "Shipping & Delivery", href: "/shipping" },
      { label: "Returns & Exchanges", href: "/returns" },
      { label: "Feedback", href: "/feedback" },
    ],
  },
  {
    heading: "Our Company",
    links: [
      { label: "About Us", href: "/about-us" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Use", href: "/terms" },
      { label: "Manage Cookies", href: "/cookies" },
      { label: "Site Map", href: "/sitemap" },
    ],
  },
  {
    heading: "Shopping",
    links: [
      { label: "New Arrivals", href: "/category/new-arrivals" },
      { label: "Women", href: "/category/women" },
      { label: "Men", href: "/category/men" },
      { label: "Sale", href: "/category/sale" },
      { label: "Gifts", href: "/category/gifts" },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com" },
  { label: "Pinterest", href: "https://www.pinterest.com" },
  { label: "TikTok", href: "https://www.tiktok.com" },
];

/**
 * Storefront footer: newsletter signup (existing /api/newsletter flow),
 * link columns, social row, and a legal bar with the boutique's
 * non-affiliation disclaimer.
 */
export default function Footer() {
  return (
    <footer className="bg-white border-t border-hairline mt-auto">
      {/* ── Newsletter + link columns ─────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Newsletter */}
          <div className="lg:col-span-5">
            <h2 className="headline-serif text-2xl md:text-[28px] text-ink mb-2">
              Join our mailing list
            </h2>
            <p className="text-[13px] text-muted leading-relaxed mb-7 max-w-md">
              Be the first to know about new arrivals, exclusive launches, and
              private previews — delivered straight to your inbox.
            </p>
            <NewsletterForm idPrefix="footer" source="footer" />
          </div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10">
            {LINK_COLUMNS.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <h3 className="text-label text-muted mb-5">{column.heading}</h3>
                <ul className="flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-[13px] text-ink-soft hover:text-ink hover:underline underline-offset-4 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </div>

      {/* ── Social + support row ──────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="py-7 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-label text-muted">Follow Us</span>
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline text-[13px] text-ink-soft hover:text-ink transition-colors"
              >
                {social.label}
              </a>
            ))}
          </div>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink transition-colors"
          >
            <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
            Questions about an order? WhatsApp support
          </a>
        </div>
      </div>

      {/* ── Legal bar ─────────────────────────────────────────────────── */}
      <div className="border-t border-hairline">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] tracking-wide text-muted">
            <span>United States (USD $)</span>
            <span>English</span>
          </div>
          <div className="text-[11px] tracking-wide text-muted">
            © 2026 COACH 1. All rights reserved. COACH 1 is an independent
            boutique with no affiliation with Coach IP Holdings LLC.
          </div>
        </div>
      </div>
    </footer>
  );
}
