import React from "react";
import NewsletterForm from "@/components/layout/NewsletterForm";

/**
 * Premium newsletter band rendered above the footer on the homepage.
 * Uses the shared NewsletterForm (same /api/newsletter contract) with a
 * distinct id prefix so it can coexist with the footer form.
 */
export default function NewsletterBand() {
  return (
    <section className="bg-canvas">
      <div className="max-w-2xl mx-auto px-6 py-16 lg:py-20 text-center">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-muted mb-4">
          Mailing List
        </p>
        <h2 className="headline-serif text-3xl sm:text-4xl text-ink mb-4">
          Join the world of COACH 1
        </h2>
        <p className="text-sm text-ink-soft leading-relaxed mb-9 max-w-lg mx-auto">
          New arrivals, private previews, and stories from the studio — a
          considered email, never more than once a week.
        </p>
        <div className="text-left max-w-md mx-auto">
          <NewsletterForm idPrefix="homepage" source="homepage" />
        </div>
      </div>
    </section>
  );
}
