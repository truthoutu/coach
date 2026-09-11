"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface HeroProps {
  imageSrc?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * Full-bleed editorial campaign hero. Copy sits in the lower third over a
 * restrained scrim; the serif headline is sentence case per the reference
 * storefront's storytelling style.
 */
export default function Hero({
  imageSrc = "/hero-season-ahead.jpg",
  eyebrow = "Autumn Collection",
  title = "The Season Ahead",
  subtitle = "New arrivals crafted to carry you through every day, wherever it leads.",
  ctaText = "Shop New Arrivals",
  ctaLink = "/category/new-arrivals",
  secondaryCtaText = "Explore the Collection",
  secondaryCtaLink = "/category/women",
}: HeroProps) {
  return (
    <section className="relative w-full h-[82vh] min-h-[560px] lg:h-[88vh] overflow-hidden bg-canvas">
      <Image
        src={imageSrc}
        alt={title}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Legibility scrim — strongest at the bottom where the copy sits */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="max-w-3xl mx-auto px-6 pb-14 lg:pb-20 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
          >
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-white/80 mb-4">
              {eyebrow}
            </p>
            <h1 className="headline-serif text-4xl sm:text-5xl lg:text-[64px] mb-4">
              {title}
            </h1>
            <p className="text-sm sm:text-[15px] leading-relaxed text-white/90 max-w-xl mx-auto mb-8">
              {subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={ctaLink}
                className="btn-primary bg-white text-ink border-white hover:bg-white/90 hover:border-white/90 w-full sm:w-auto"
              >
                {ctaText}
              </Link>
              <Link
                href={secondaryCtaLink}
                className="link-underline text-label text-white w-full sm:w-auto justify-center text-center py-2 sm:py-0"
              >
                {secondaryCtaText}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
