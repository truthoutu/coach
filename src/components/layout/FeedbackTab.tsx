"use client";

import React from "react";
import Link from "next/link";

/**
 * Fixed vertical Feedback tab on the right viewport edge (desktop only).
 * Links to the existing /feedback info page.
 */
export default function FeedbackTab() {
  return (
    <Link
      href="/feedback"
      aria-label="Give feedback"
      className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 bg-ink px-2 py-5 text-white transition-colors hover:bg-black md:block"
      style={{ writingMode: "vertical-rl" }}
    >
      <span className="text-[10.5px] font-medium uppercase tracking-[0.22em]">Feedback</span>
    </Link>
  );
}
