import React from "react";
import Link from "next/link";
import Image from "next/image";

interface EditorialSectionProps {
  eyebrow?: string;
  title?: string;
  copy?: string;
  ctaText?: string;
  ctaHref?: string;
  imageSrc?: string;
  /** Which side the image sits on at desktop widths. */
  imageSide?: "left" | "right";
}

/**
 * Split editorial block: large image against a quiet text column with a
 * single outline CTA — the restrained storytelling pattern used by the
 * reference storefront between product sections.
 */
export default function EditorialSection({
  eyebrow = "The Tabby Edit",
  title = "An icon, reimagined.",
  copy = "First introduced in the 1970s and revived for the way we dress today — soft, structured, and finished with our signature hardware.",
  ctaText = "Shop Tabby",
  ctaHref = "/category/tabby-collection",
  imageSrc = "/hero-tabby-street.png",
  imageSide = "left",
}: EditorialSectionProps) {
  const image = (
    <div className="relative aspect-[4/5] sm:aspect-[5/5] lg:aspect-auto lg:min-h-[560px] overflow-hidden bg-canvas">
      <Image
        src={imageSrc}
        alt={title}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );

  const copyBlock = (
    <div className="flex flex-col items-center justify-center text-center px-8 sm:px-14 py-16 lg:py-0">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-muted mb-4">
        {eyebrow}
      </p>
      <h2 className="headline-serif text-3xl sm:text-4xl lg:text-[42px] text-ink mb-5 max-w-md">
        {title}
      </h2>
      <p className="text-sm leading-relaxed text-ink-soft max-w-md mb-8">{copy}</p>
      <Link href={ctaHref} className="btn-outline">
        {ctaText}
      </Link>
    </div>
  );

  return (
    <section className="grid lg:grid-cols-2">
      {imageSide === "left" ? (
        <>
          {image}
          {copyBlock}
        </>
      ) : (
        <>
          {copyBlock}
          {image}
        </>
      )}
    </section>
  );
}
