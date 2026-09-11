"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LOCALES } from "@/lib/nav";

const STORAGE_KEY = "coach1:locale";

/**
 * Compact locale selector: flag + code + chevron. Opens a small menu;
 * the choice persists to localStorage (presentation-only).
 */
export default function LocaleSelector({ variant = "header" }: { variant?: "header" | "footer" }) {
  const [code, setCode] = useState("US");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && LOCALES.some((l) => l.code === saved)) setCode(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const active = LOCALES.find((l) => l.code === code) ?? LOCALES[0];

  const pick = (next: string) => {
    setCode(next);
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country and language: ${active.label}. Change country.`}
        className={`inline-flex items-center gap-1.5 transition-opacity hover:opacity-60 ${
          variant === "footer" ? "text-[11px] tracking-wide text-muted" : "text-ink"
        }`}
      >
        <span aria-hidden="true" className="text-[13px] leading-none">
          {active.flag}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em]">{active.code}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Choose a country"
          className="absolute left-0 top-full z-50 mt-2 min-w-[220px] border border-hairline bg-white py-1.5 shadow-[0_18px_30px_-12px_rgba(0,0,0,0.18)]"
        >
          {LOCALES.map((locale) => (
            <li key={locale.code} role="option" aria-selected={locale.code === code}>
              <button
                type="button"
                onClick={() => pick(locale.code)}
                className={`flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-[12.5px] transition-colors hover:bg-canvas ${
                  locale.code === code ? "font-medium text-ink" : "text-ink-soft"
                }`}
              >
                <span aria-hidden="true" className="text-[14px] leading-none">
                  {locale.flag}
                </span>
                <span className="flex-1">{locale.label}</span>
                {locale.code === code && <span aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
