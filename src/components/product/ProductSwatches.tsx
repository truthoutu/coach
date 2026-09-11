"use client";

import React from "react";

export interface Swatch {
  label: string;
  hex: string;
}

const COLOR_KEYWORDS: { match: RegExp; label: string; hex: string }[] = [
  { match: /black|noir|midnight/i, label: "Black", hex: "#1a1a1a" },
  { match: /white|chalk|ivory|optic/i, label: "White", hex: "#f4f1ea" },
  { match: /beige|sand|ecru|oat|taupe|stone/i, label: "Beige", hex: "#d9cbb8" },
  { match: /brown|saddle|tan|cognac|espresso|walnut|mahogany|oak/i, label: "Brown", hex: "#6b4a2f" },
  { match: /gold|brass|khaki|mustard/i, label: "Gold", hex: "#b08d3e" },
  { match: /silver|platinum|chrome|pewter/i, label: "Silver", hex: "#c9ccd1" },
  { match: /red|crimson|scarlet|cherry|burgundy|oxblood|wine/i, label: "Red", hex: "#8e2f32" },
  { match: /pink|blush|rose|fuchsia|magenta/i, label: "Pink", hex: "#e3a7b4" },
  { match: /orange|terracotta|rust|amber|coral/i, label: "Orange", hex: "#c96f3b" },
  { match: /yellow|lemon|saffron/i, label: "Yellow", hex: "#d9b64a" },
  { match: /green|sage|olive|forest|emerald|mint|moss/i, label: "Green", hex: "#4a5d43" },
  { match: /blue|navy|denim|indigo|sky|cobalt|teal/i, label: "Blue", hex: "#2e4a68" },
  { match: /purple|violet|lavender|plum|lilac/i, label: "Purple", hex: "#6d5a7e" },
  { match: /grey|gray|charcoal|slate|smoke|ash/i, label: "Grey", hex: "#8a8d90" },
  { match: /multi|print|floral|signature|canvas|jacquard/i, label: "Patterned", hex: "#b9a88f" },
];

/**
 * Derives up to 4 tiny color swatches from the product name + description.
 * Purely presentational — data still comes from the product row.
 */
export function deriveSwatches(name: string, description?: string | null): Swatch[] {
  const haystack = `${name} ${description ?? ""}`;
  const found: Swatch[] = [];
  for (const entry of COLOR_KEYWORDS) {
    if (entry.match.test(haystack)) {
      if (!found.some((s) => s.label === entry.label)) {
        found.push({ label: entry.label, hex: entry.hex });
      }
    }
    if (found.length >= 4) break;
  }
  if (found.length === 0) {
    found.push({ label: "Natural", hex: "#cbbfae" });
  }
  return found;
}

export default function ProductSwatches({
  name,
  description,
  selected = 0,
  onSelect,
  compact = false,
  className = "",
}: {
  name: string;
  description?: string | null;
  selected?: number;
  onSelect?: (index: number) => void;
  compact?: boolean;
  className?: string;
}) {
  const swatches = deriveSwatches(name, description);
  const size = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={`flex items-center gap-1.5 ${className}`} role="group" aria-label={`Available colours for ${name}`}>
      {swatches.map((swatch, idx) => {
        const isActive = idx === selected;
        const inner = (
          <span
            aria-hidden="true"
            className={`${size} block rounded-full border border-black/15`}
            style={{ backgroundColor: swatch.hex }}
          />
        );
        return onSelect ? (
          <button
            key={swatch.label}
            type="button"
            onClick={() => onSelect(idx)}
            aria-pressed={isActive}
            aria-label={swatch.label}
            title={swatch.label}
            className={`cursor-pointer rounded-full p-[3px] transition-all ${
              isActive ? "ring-1 ring-ink ring-offset-2" : "hover:ring-1 hover:ring-muted hover:ring-offset-2"
            }`}
          >
            {inner}
          </button>
        ) : (
          <span
            key={swatch.label}
            title={swatch.label}
            aria-label={swatch.label}
            className={`rounded-full p-[3px] ${isActive ? "ring-1 ring-ink ring-offset-2" : ""}`}
          >
            {inner}
          </span>
        );
      })}
    </div>
  );
}
