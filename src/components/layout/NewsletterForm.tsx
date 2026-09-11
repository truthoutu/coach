"use client";

import React, { useState } from "react";

type NewsletterState = "idle" | "loading" | "success" | "error";

interface NewsletterFormProps {
  /** Unique prefix so the form can be embedded on multiple pages without ID collisions. */
  idPrefix: string;
  /** Source tag recorded with the subscription (footer / homepage band / …). */
  source: string;
}

/**
 * Shared newsletter capture. Posts to the existing /api/newsletter route —
 * the payload contract (email, consent, source) is unchanged.
 */
export default function NewsletterForm({ idPrefix, source }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<NewsletterState>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setMessage("");

    if (!consent) {
      setState("error");
      setMessage("Please tick the consent box so we can add you to the mailing list.");
      return;
    }

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: true, source }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("success");
        setMessage("Thank you for subscribing. You're on the list.");
        setEmail("");
        setConsent(false);
      } else {
        setState("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl" noValidate>
      <div className="flex items-center border-b border-ink focus-within:border-ink transition-colors">
        <label htmlFor={`${idPrefix}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${idPrefix}-email`}
          type="email"
          required
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 py-3.5 bg-transparent text-sm tracking-wide outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="text-label text-ink hover:opacity-60 transition-opacity disabled:opacity-40 py-3.5 pl-4 cursor-pointer"
        >
          {state === "loading" ? "Subscribing…" : "Sign Up"}
        </button>
      </div>

      <div className="flex items-start gap-3 mt-4">
        <input
          type="checkbox"
          id={`${idPrefix}-consent`}
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="w-3.5 h-3.5 border border-muted rounded-none cursor-pointer accent-black mt-0.5 flex-shrink-0"
        />
        <label
          htmlFor={`${idPrefix}-consent`}
          className="text-[11px] leading-relaxed text-muted cursor-pointer select-none"
        >
          By signing up, you consent to receive emails about our latest
          collections, offers, and news. You can withdraw your consent at any
          time. See our{" "}
          <a href="/privacy-policy" className="underline underline-offset-2 hover:text-ink">
            Privacy Policy
          </a>{" "}
          for more information.
        </label>
      </div>

      {state === "success" && (
        <p className="mt-3 text-xs text-ink font-medium tracking-wide" role="status">
          {message}
        </p>
      )}
      {state === "error" && (
        <p className="mt-3 text-xs text-sale font-medium tracking-wide" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
