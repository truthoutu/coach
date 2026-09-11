import React from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  ctaText?: string;
  ctaHref?: string;
  align?: "center" | "left";
}

/**
 * Shared section header: optional tracked eyebrow, editorial serif title,
 * and an underline-on-hover CTA link.
 */
export default function SectionHeading({
  eyebrow,
  title,
  ctaText,
  ctaHref,
  align = "center",
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={`flex flex-col ${
        centered ? "items-center text-center" : "items-start"
      } mb-10 lg:mb-12`}
    >
      {eyebrow && (
        <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-muted mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="headline-serif text-3xl sm:text-4xl lg:text-[44px] text-ink">
        {title}
      </h2>
      {ctaText && ctaHref && (
        <a href={ctaHref} className="link-underline text-label mt-5">
          {ctaText}
        </a>
      )}
    </div>
  );
}
