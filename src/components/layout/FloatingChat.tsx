"use client";

import { useEffect } from "react";

// ─── Tawk.to type declarations (client-only globals) ─────────────────────────
type TawkApi = {
  onLoad?: () => void;
  onStatusChange?: (status: string) => void;
  [key: string]: unknown;
};

declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

// ─── Official Tawk.to property/widget identifiers (owner-supplied) ──────────
// These credentials come directly from the owner's Tawk.to embed script:
//   Property ID: 6aa17322094d073447a182b4
//   Widget ID:   1k23ajhur
//
// They are PUBLIC embed identifiers — the official embed script URL
// (https://embed.tawk.to/<PROPERTY_ID>/<WIDGET_ID>) is served to every
// visitor, so they are safe in the browser bundle by design.
// NEVER place secret API/signing keys here; those must stay server-side.
//
// The NEXT_PUBLIC_* vars are optional per-environment overrides (e.g. a
// staging widget); when unset, the official owner credentials below are used.
const TAWK_PROPERTY_ID =
  process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || "6aa17322094d073447a182b4";
const TAWK_WIDGET_ID =
  process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || "1k23ajhur";

// Module-level guard: survives React StrictMode double-effects and
// client-side navigation so the widget script is injected exactly once.
let tawkInjected = false;

/**
 * Single global integration point for live chat (rendered from
 * `src/app/layout.tsx`). Replaces the legacy custom WhatsApp floating
 * launcher — Tawk.to now renders and positions its own widget, fully
 * controlled from the Tawk.to dashboard (appearance, position, behavior).
 *
 * Uses the official property/widget credentials supplied by the owner
 * (see constants above) via the same embed URL pattern as the official
 * script: https://embed.tawk.to/<PROPERTY_ID>/<WIDGET_ID>
 *
 * Guarantees:
 * - Client-only: no `window`/`document` access during SSR/prerender.
 * - Exactly one `https://embed.tawk.to/...` script tag app-wide.
 * - Persists across App Router client-side navigation (root layout stays
 *   mounted; the script is never re-injected).
 * - Renders nothing itself, so it cannot overlap checkout or admin UI
 *   with a second floating button.
 */
export default function FloatingChat() {
  useEffect(() => {
    // Redundant runtime guard for non-browser environments.
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // If the embed script already exists (navigation, remount, Fast Refresh),
    // or this module already injected it (StrictMode double-effect), do not
    // inject a second copy.
    if (tawkInjected) {
      return;
    }
    if (document.getElementById("tawk-messenger-script")) {
      tawkInjected = true;
      return;
    }

    // Official Tawk.to embed preamble — must exist before the script loads.
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.id = "tawk-messenger-script";
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
    tawkInjected = true;

    // Intentionally no script removal on unmount: the component lives in the
    // root layout and the Tawk widget must survive client-side navigation.
    // We add no custom event listeners, so there is nothing else to clean up.
    return undefined;
  }, []);

  // Tawk.to injects its own UI — this component renders no DOM.
  return null;
}
