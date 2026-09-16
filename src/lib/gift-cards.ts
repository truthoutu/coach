import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { findGiftCardBrand } from "./gift-card-brands";

/**
 * Server-side helpers for gift card payment submissions.
 *
 * SECURITY MODEL
 * - Gift card codes are sensitive: they are encrypted at rest with
 *   AES-256-GCM using the GIFT_CARD_ENC_KEY env var (64 hex chars = 32 bytes).
 * - A deterministic dev key is derived in non-production so local development
 *   works without extra setup; production refuses to run without a real key.
 * - Only the last 4 characters are ever returned to clients by default.
 *   The full plaintext code is revealed ONLY through the explicit admin
 *   "reveal" endpoint action.
 */

const VERSION = "v1";

/** Dev fallback key (scrypt-derived). ONLY used outside production. */
const DEV_KEY_SEED = "coach1-gift-card-dev-key-do-not-use-in-production";

function getKey(): Buffer {
  const raw = process.env.GIFT_CARD_ENC_KEY;
  if (raw && raw.length > 0) {
    const key = Buffer.from(raw, "hex");
    if (key.length !== 32) {
      throw new Error("GIFT_CARD_ENC_KEY must be 64 hex characters (32 bytes).");
    }
    return key;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("GIFT_CARD_ENC_KEY is required in production (64 hex chars).");
  }
  console.warn("[gift-cards] GIFT_CARD_ENC_KEY not set — using derived DEV key (dev only).");
  return scryptSync(DEV_KEY_SEED, "coach1-gift-card", 32);
}

/** Encrypt plaintext into "v1:<ivHex>:<tagHex>:<cipherHex>" format. */
export function encryptGiftCardSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

/** Decrypt a payload produced by encryptGiftCardSecret. Throws on tampering. */
export function decryptGiftCardSecret(payload: string): string {
  const parts = String(payload).split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Invalid encrypted gift card payload.");
  }
  const [, ivHex, tagHex, cipherHex] = parts;
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(cipherHex, "hex")), decipher.final()]).toString("utf8");
}

/** Normalize a code for storage/comparison: trim, uppercase, collapse inner whitespace. */
export function normalizeGiftCardCode(code: string): string {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

/** Last 4 characters (or fewer), for display. */
export function last4OfCode(code: string): string {
  const normalized = normalizeGiftCardCode(code);
  return normalized.slice(-4) || "0000";
}

/** Masked representation, e.g. "•••• 7X2K". */
export function maskGiftCardCode(code: string): string {
  const normalized = normalizeGiftCardCode(code);
  return `•••• ${normalized.slice(-4)}`;
}

/**
 * Validate and normalize a submission. Returns either a ready-to-persist
 * object or an error message for the API to return.
 */
export function validateGiftCardSubmission(input: {
  brand?: unknown;
  code?: unknown;
  pin?: unknown;
  claimedValue?: unknown;
}): { ok: true; brand: string; code: string; pin: string | null; claimedValue: number | null } | { ok: false; error: string } {
  const brand = findGiftCardBrand(String(input.brand ?? ""));
  if (!brand) {
    return { ok: false, error: "Please choose a valid gift card brand." };
  }

  const code = normalizeGiftCardCode(String(input.code ?? ""));
  const compact = code.replace(/[\s-]/g, "");
  if (compact.length < brand.minCodeLength || compact.length > brand.maxCodeLength) {
    return {
      ok: false,
      error: `${brand.label} gift card codes must be ${brand.minCodeLength}–${brand.maxCodeLength} characters.`,
    };
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9\s-]*$/.test(code)) {
    return { ok: false, error: "Gift card codes may only contain letters, numbers, spaces and dashes." };
  }

  let pin: string | null = null;
  if (input.pin !== undefined && input.pin !== null && String(input.pin).trim() !== "") {
    const normalizedPin = normalizeGiftCardCode(String(input.pin));
    if (!/^[A-Za-z0-9-]{1,12}$/.test(normalizedPin.replace(/\s/g, ""))) {
      return { ok: false, error: "PIN may only contain letters and numbers (max 12)." };
    }
    pin = normalizedPin;
  }

  let claimedValue: number | null = null;
  if (input.claimedValue !== undefined && input.claimedValue !== null && String(input.claimedValue).trim() !== "") {
    const value = Number(input.claimedValue);
    if (!Number.isFinite(value) || value <= 0 || value > 10000) {
      return { ok: false, error: "Claimed balance must be between $0.01 and $10,000." };
    }
    claimedValue = Math.round(value * 100) / 100;
  }

  return { ok: true, brand: brand.id, code, pin, claimedValue };
}
