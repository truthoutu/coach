/**
 * Shared, client-safe gift card brand catalog.
 *
 * This file must stay free of Node-only imports (crypto, etc.) because it is
 * imported by the checkout UI (`src/app/checkout/page.tsx`) as well as the
 * server-side helpers in `gift-cards.ts`.
 *
 * `minCodeLength` / `maxCodeLength` are soft format guards only — the
 * authoritative check is the manual verification done by the team.
 */
export interface GiftCardBrand {
  id: string;
  label: string;
  minCodeLength: number;
  maxCodeLength: number;
}

export const GIFT_CARD_BRANDS: GiftCardBrand[] = [
  { id: "AMAZON", label: "Amazon", minCodeLength: 8, maxCodeLength: 20 },
  { id: "VISA", label: "Visa Prepaid", minCodeLength: 12, maxCodeLength: 25 },
  { id: "MASTERCARD", label: "Mastercard Prepaid", minCodeLength: 12, maxCodeLength: 25 },
  { id: "STEAM", label: "Steam", minCodeLength: 10, maxCodeLength: 25 },
  { id: "APPLE", label: "Apple / iTunes", minCodeLength: 12, maxCodeLength: 20 },
  { id: "GOOGLE_PLAY", label: "Google Play", minCodeLength: 12, maxCodeLength: 25 },
  { id: "SEPHORA", label: "Sephora", minCodeLength: 8, maxCodeLength: 25 },
  { id: "OTHER", label: "Other", minCodeLength: 4, maxCodeLength: 60 },
];

/** Server-side allowlist of brand ids (mirrors GIFT_CARD_BRANDS). */
export const GIFT_CARD_BRAND_IDS = GIFT_CARD_BRANDS.map((b) => b.id);

/** Look up a brand by id (case-insensitive); null when unknown. */
export function findGiftCardBrand(brandId: string): GiftCardBrand | null {
  const normalized = String(brandId || "").trim().toUpperCase();
  return GIFT_CARD_BRANDS.find((b) => b.id === normalized) ?? null;
}
