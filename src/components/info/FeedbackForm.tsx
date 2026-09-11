"use client";

import React, { useState } from "react";

type FeedbackState = "idle" | "loading" | "success" | "error";

export default function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<FeedbackState>("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("success");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setState("error");
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setState("error");
      setError("Something went wrong. Please try again.");
    }
  };

  if (state === "success") {
    return (
      <div className="mt-8 bg-canvas border border-hairline p-8 text-center">
        <h3 className="headline-serif text-xl text-ink mb-2">Thank you!</h3>
        <p className="text-sm text-ink-soft">
          Your feedback has been received. We read every message.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 border border-hairline p-8 space-y-5">
      <h3 className="headline-serif text-xl text-ink">Send Us Your Feedback</h3>
      <div>
        <label htmlFor="feedback-name" className="block text-label text-muted mb-2">
          Full Name
        </label>
        <input
          id="feedback-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors placeholder:text-muted"
        />
      </div>
      <div>
        <label htmlFor="feedback-email" className="block text-label text-muted mb-2">
          Email Address
        </label>
        <input
          id="feedback-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors placeholder:text-muted"
        />
      </div>
      <div>
        <label htmlFor="feedback-message" className="block text-label text-muted mb-2">
          Your Experience / Message
        </label>
        <textarea
          id="feedback-message"
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your experience..."
          className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors placeholder:text-muted resize-y"
        />
      </div>
      {state === "error" && (
        <p className="text-sm text-sale font-medium" role="alert">{error}</p>
      )}
      <button
        type="submit"
        disabled={state === "loading"}
        className="btn-primary disabled:opacity-60"
      >
        {state === "loading" ? "Submitting…" : "Submit Feedback"}
      </button>
    </form>
  );
}