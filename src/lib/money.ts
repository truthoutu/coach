export const DEFAULT_CURRENCY = "USD";

const CURRENCY_LABELS: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  NGN: "₦",
};

export function formatPrice(amount: number | string, currency = DEFAULT_CURRENCY): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const safe = Number.isFinite(value) ? value : 0;
  return `${CURRENCY_LABELS[currency] ?? "$"}${safe.toFixed(2)}`;
}

export function toNumber(value: number | string): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}