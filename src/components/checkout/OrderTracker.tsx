"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Banknote,
  Check,
  CheckCircle2,
  Copy,
  Gift,
  Loader2,
  MessageCircle,
  Send,
  XCircle,
} from "lucide-react";
import { GIFT_CARD_BRANDS } from "@/lib/gift-card-brands";

// ─── Constants ───────────────────────────────────────────────────────────────
const BITCOIN_ADDRESS = "bc1qjs86eudh7t00de2f9e94zy6p8pcznjhyqqh3w8";

/**
 * Clipboard write with a legacy `execCommand` fallback for browsers where the
 * async Clipboard API is unavailable or the page is not a secure context.
 */
function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
    return;
  }
  legacyCopy(text);
}

function legacyCopy(text: string) {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  } catch {
    /* silent — the customer can still select the text manually */
  }
}

const HOLD_LINES = [
  "Please hold while we check…",
  "Still holding — our team has been notified…",
  "Almost there, staying on the line…",
];

const METHOD_LABELS: Record<string, string> = {
  bitcoin: "Bitcoin",
  zelle: "Zelle",
  chime: "Chime",
  cashapp: "Cash App",
  gift_card: "Gift Card",
};

interface LiveMessage {
  id: string;
  senderRole: "CUSTOMER" | "ADMIN";
  body: string;
  createdAt: string;
}

interface LiveState {
  order: {
    number: string;
    status: string;
    paymentMethod: string;
    total: number;
    /** Payment details the admin typed for this order, if already sent. */
    paymentDetails: string | null;
    /** Set once the customer taps "I have paid" — persists across refreshes. */
    customerPaidAt: string | null;
  };
  giftCard: {
    brand: string;
    codeLast4: string;
    claimedValue: number | null;
    status: string;
    reviewNotes: string | null;
  } | null;
  messages: LiveMessage[];
}

export interface OrderTrackerProps {
  orderNumber: string;
  orderTotal: number;
  paymentMethod: "bitcoin" | "zelle" | "chime" | "cashapp" | "gift_card";
  email: string;
  giftCardBrandLabel: string;
  giftCardLast4: string;
  whatsappHref: string;
  onDone: () => void;
}

type Stage = "waiting_details" | "details_ready" | "checking" | "verifying" | "confirmed" | "declined" | "error";

// ─── Component ───────────────────────────────────────────────────────────────
export default function OrderTracker({
  orderNumber,
  orderTotal,
  paymentMethod,
  email,
  giftCardBrandLabel,
  giftCardLast4,
  whatsappHref,
  onDone,
}: OrderTrackerProps) {
  const [live, setLive] = useState<LiveState | null>(null);
  const [paidClicked, setPaidClicked] = useState(false);
  const [holdLineIndex, setHoldLineIndex] = useState(0);
  const [msgInput, setMsgInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [btcCopied, setBtcCopied] = useState(false);

  // Gift card retry form
  const [retryBrand, setRetryBrand] = useState("AMAZON");
  const [retryCode, setRetryCode] = useState("");
  const [retryPin, setRetryPin] = useState("");
  const [retryValue, setRetryValue] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  const threadRef = useRef<HTMLDivElement>(null);

  // ── Poll live state every 4s ───────────────────────────────────────────────
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/live`);
      if (res.ok) {
        const data = await res.json();
        setLive(data);
        // Hydrate local paid flag from server so refresh doesn't lose the CTA state
        if (data?.order?.customerPaidAt) {
          setPaidClicked(true);
        }
      } else {
        console.error("Poll error:", res.status, await res.text().catch(() => "Unknown error"));
      }
    } catch (err) {
      console.error("Poll network error:", err);
      /* transient network errors are fine — the next tick retries */
    }
  }, [orderNumber]);

     // Keep the tracker in sync while the customer waits.
  useEffect(() => {
    const id = setInterval(poll, 4000);
    // Initial call deferred to avoid a synchronous setState in the effect body
    setTimeout(() => {
      void poll();
    }, 0);
    return () => clearInterval(id);
  }, [poll]);

  // ── Rotating "hold" line while spinning ────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setHoldLineIndex((i) => (i + 1) % HOLD_LINES.length), 2500);
    return () => clearInterval(id);
  }, []);

  // ── Derive the customer-visible stage ──────────────────────────────────────
  const orderStatus = live?.order?.status ?? "PENDING_PAYMENT";
  const giftCard = live?.giftCard ?? null;
  const giftRejected = giftCard?.status === "REJECTED";
  const messages = live?.messages ?? [];

  // Payment details can come from Order.paymentNote OR the latest admin message
  // (admin currently sends details as a chat message; we also persist paymentNote).
  const paymentDetailsFromNote = (live?.order?.paymentDetails || "").trim();
  const latestAdminMsg = [...messages].reverse().find((m) => m.senderRole === "ADMIN");
  const paymentDetailsText = paymentDetailsFromNote || (latestAdminMsg?.body?.trim() ?? "");
  const hasPaymentDetails = paymentMethod !== "bitcoin" && paymentMethod !== "gift_card" && !!paymentDetailsText;

  // Persist paid state across refresh once the server has customerPaidAt
  const serverPaid = !!live?.order?.customerPaidAt;
  const effectivelyPaid = paidClicked || serverPaid;

  let stage: Stage;
  if (!live) stage = paymentMethod === "gift_card" ? "checking" : "waiting_details";
  else if (["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(orderStatus)) stage = "confirmed";
  else if (orderStatus === "CANCELLED") stage = "declined";
  else if (paymentMethod === "gift_card" && giftRejected && !effectivelyPaid) stage = "declined";
  else if (effectivelyPaid) stage = "verifying";
  else if (paymentMethod === "gift_card") stage = "checking";
  else if (hasPaymentDetails) stage = "details_ready";
  else stage = "waiting_details";

  // ── Actions ────────────────────────────────────────────────────────────────
  const sendMessage = async (body: string, markPaid = false) => {
    setSendingMsg(true);
    try {
      await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, paid: markPaid }),
      });
      if (markPaid) setPaidClicked(true);
      void poll();
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCopyBtc = () => {
    const copyText = (text: string) => {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      try {
        document.execCommand("copy");
      } catch {
        /* silent */
      }
      document.body.removeChild(el);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(BITCOIN_ADDRESS).catch(() => copyText(BITCOIN_ADDRESS));
    } else {
      copyText(BITCOIN_ADDRESS);
    }
    setBtcCopied(true);
    setTimeout(() => setBtcCopied(false), 2500);
  };

  const handleRetryGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setRetryError("");
    if (!retryCode.trim()) {
      setRetryError("Please enter the new gift card code.");
      return;
    }
    setRetrying(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/gift-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          giftCard: { brand: retryBrand, code: retryCode, pin: retryPin, claimedValue: retryValue },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRetryError(data.error || "Could not submit the new code. Please try again.");
      } else {
        setRetryCode("");
        setRetryPin("");
        setRetryValue("");
        setPaidClicked(false);
        setHoldLineIndex(0);
        poll();
      }
    } catch {
      setRetryError("Could not submit the new code. Please try again.");
    } finally {
      setRetrying(false);
    }
  };

  // Auto-scroll the thread
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [live?.messages?.length]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Header */}
      <header className="bg-white border-b border-hairline px-4 sm:px-8 py-3.5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <span className="text-label text-muted">Order {orderNumber}</span>
          <span className="wordmark text-[19px] sm:text-[21px] text-ink">COACH 1</span>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {stage === "confirmed" && (
          <div className="bg-white p-8 md:p-10 border border-hairline text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="headline-serif text-3xl md:text-4xl">Payment Confirmed ✅</h1>
            <p className="text-sm text-ink-soft leading-relaxed">
              Thank you! Your payment for <strong>${orderTotal.toFixed(2)}</strong> has been confirmed
              and order <strong>{orderNumber}</strong> is now being prepared. We&apos;ll email you tracking
              as soon as it ships.
            </p>
            <button type="button" onClick={onDone} className="btn-primary w-full mt-2">
              Continue Shopping
            </button>
          </div>
        )}
        {stage === "declined" && (
          <div className="bg-white p-8 md:p-10 border border-hairline space-y-5">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                <XCircle size={28} />
              </div>
              <h1 className="headline-serif text-3xl">Payment Declined</h1>
              <p className="text-sm text-ink-soft leading-relaxed">
                {orderStatus === "CANCELLED"
                  ? "This order has been cancelled by our team. If you believe this is a mistake, message us on WhatsApp."
                  : `Your ${giftCardBrandLabel} gift card (•••• ${giftCardLast4}) could not be verified${live?.giftCard?.reviewNotes ? ` — ${live.giftCard.reviewNotes}` : ""}. You can submit a different code below.`}
              </p>
            </div>

            {paymentMethod === "gift_card" && orderStatus !== "CANCELLED" && (
              <form onSubmit={handleRetryGiftCard} className="bg-canvas border border-hairline p-5 space-y-3">
                <p className="text-sm font-bold flex items-center gap-2">
                  <Gift size={14} /> Try Another Gift Card
                </p>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">Card Brand *</label>
                  <select
                    value={retryBrand}
                    onChange={(e) => setRetryBrand(e.target.value)}
                    className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white"
                  >
                    {GIFT_CARD_BRANDS.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.label}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Gift card code *"
                  value={retryCode}
                  onChange={(e) => setRetryCode(e.target.value)}
                  className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white font-mono"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="PIN (if any)"
                    value={retryPin}
                    onChange={(e) => setRetryPin(e.target.value)}
                    className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white font-mono"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Claimed balance"
                    value={retryValue}
                    onChange={(e) => setRetryValue(e.target.value)}
                    className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white font-mono"
                  />
                </div>
                {retryError && <p className="text-sm text-alert font-medium">{retryError}</p>}
                <button type="submit" disabled={retrying} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
                  {retrying ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Submit New Code
                </button>
              </form>
            )}

            <div className="flex gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-hairline text-ink hover:bg-canvas text-label transition-colors"
              >
                <MessageCircle size={14} /> Ask on WhatsApp
              </a>
              <button type="button" onClick={onDone} className="flex-1 btn-outline">
                Return to Home
              </button>
            </div>
          </div>
        )}
        {(stage === "waiting_details" || stage === "details_ready" || stage === "checking" || stage === "verifying") && (
          <div className="bg-white p-6 sm:p-8 border border-hairline space-y-6">
            {/* Header: spinner while waiting, subtle live pulse once details are ready */}
            <div className="text-center space-y-3 py-2">
              {stage === "details_ready" ? (
                <>
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <Banknote size={22} className="text-emerald-700" />
                  </div>
                  <p className="text-sm font-medium text-ink">Payment details ready</p>
                  <p className="text-xs text-muted">
                    Send exactly <strong>${orderTotal.toFixed(2)}</strong> using the details below, then tap &ldquo;I have paid&rdquo;.
                  </p>
                </>
              ) : (
                <>
                  <Loader2 size={32} className="animate-spin mx-auto text-ink" />
                  <p className="text-sm font-medium text-ink">{HOLD_LINES[holdLineIndex]}</p>
                  <p className="text-xs text-muted">
                    {stage === "checking" && "Our team is checking your gift card right now."}
                    {stage === "verifying" && "Verifying your payment — this page updates automatically."}
                    {stage === "waiting_details" && `We just notified our team about your ${METHOD_LABELS[paymentMethod]} payment.`}
                  </p>
                </>
              )}
            </div>

            {/* Gift card checking */}
            {paymentMethod === "gift_card" && stage === "checking" && (
              <div className="bg-canvas border border-hairline p-4 text-[13px] space-y-1">
                <p className="text-sm font-bold flex items-center gap-2 mb-1">
                  <Gift size={14} /> Checking your gift card
                </p>
                <p><span className="text-muted">Brand:</span> <span className="font-medium">{giftCardBrandLabel}</span></p>
                <p><span className="text-muted">Code:</span> <span className="font-mono">•••• {giftCardLast4}</span></p>
                <p className="text-xs text-muted pt-1">
                  The moment our team verifies it, this page turns green — no refresh needed.
                </p>
              </div>
            )}

            {stage === "verifying" && (
              <div className="bg-canvas border border-hairline p-4 text-[13px]">
                <p className="font-medium">
                  Payment received — our team is confirming it now.
                </p>
                <p className="text-xs text-muted mt-1">
                  You&apos;ll see the confirmation here automatically the moment it checks out.
                </p>
              </div>
            )}

            {/* Waiting for details (no admin reply yet) */}
            {stage === "waiting_details" && paymentMethod !== "bitcoin" && (
              <div className="bg-canvas border border-hairline p-4 text-[13px] space-y-1">
                <p className="font-medium">
                  Sit tight — our team will send your {METHOD_LABELS[paymentMethod]} payment details
                  right here within minutes.
                </p>
                <p className="text-xs text-muted mt-1">
                  Total due: <strong>${orderTotal.toFixed(2)}</strong>. You&apos;ll pay with the details
                  they send, then tap &ldquo;I have paid&rdquo;.
                </p>
              </div>
            )}

            {/* ★ DETAILS READY — admin just sent Zelle/Chime/CashApp instructions */}
            {stage === "details_ready" && (
              <div className="space-y-4">
                <div className="bg-canvas border border-hairline p-4 sm:p-5 space-y-3">
                  <p className="text-xs uppercase tracking-wider font-bold text-ink-soft flex items-center gap-2">
                    <Banknote size={14} />
                    {METHOD_LABELS[paymentMethod]} instructions
                  </p>
                  <p className="text-[15px] leading-relaxed text-ink whitespace-pre-wrap break-words font-medium">
                    {paymentDetailsText}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      copyToClipboard(paymentDetailsText);
                      setBtcCopied(true);
                      setTimeout(() => setBtcCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
                  >
                    {btcCopied ? <Check size={12} /> : <Copy size={12} />}
                    {btcCopied ? "Copied" : "Copy details"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    sendMessage(
                      `💸 I have paid via ${METHOD_LABELS[paymentMethod]} — please verify.`,
                      true
                    )
                  }
                  disabled={sendingMsg || effectivelyPaid}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {effectivelyPaid
                    ? "✅ Paid — waiting for confirmation…"
                    : `✅ I Have Paid (${METHOD_LABELS[paymentMethod]})`}
                </button>
              </div>
            )}

            {/* Bitcoin path (details are static) */}
            {stage === "waiting_details" && paymentMethod === "bitcoin" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold">₿ Pay with Bitcoin</p>
                  <div className="bg-canvas border border-hairline p-4 text-center mt-2">
                    <p className="text-label text-ink-soft mb-1">Send exactly</p>
                    <p className="text-2xl font-medium text-ink">${orderTotal.toFixed(2)}</p>
                    <p className="text-[13px] text-muted mt-1">worth of Bitcoin (BTC)</p>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-wider font-bold text-ink-soft mb-2">
                      To this Bitcoin address:
                    </p>
                    <div className="flex items-center gap-2 bg-canvas border border-hairline p-3 font-mono text-sm break-all">
                      <span className="flex-1 text-ink tracking-wide leading-relaxed">
                        {BITCOIN_ADDRESS}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyBtc}
                        className={`flex-shrink-0 p-2 transition-colors ${
                          btcCopied ? "bg-ink text-white" : "bg-canvas hover:bg-hairline text-ink-soft"
                        }`}
                      >
                        {btcCopied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    sendMessage("💸 I have paid with Bitcoin — receipt coming via WhatsApp.", true)
                  }
                  disabled={sendingMsg || effectivelyPaid}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {effectivelyPaid ? "✅ Paid — waiting for confirmation…" : "✅ I've Paid"}
                </button>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bb5a] text-white py-3 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <MessageCircle size={14} /> Send Transaction Receipt on WhatsApp
                </a>
              </div>
            )}

            {/* Fallback I-have-paid only while still waiting (no details yet) — rare */}
            {stage === "waiting_details" && paymentMethod !== "bitcoin" && (
              <button
                type="button"
                onClick={() =>
                  sendMessage(
                    `💸 I have paid via ${METHOD_LABELS[paymentMethod]} — please verify.`,
                    true
                  )
                }
                disabled={sendingMsg || effectivelyPaid}
                className="btn-primary w-full disabled:opacity-60"
              >
                {effectivelyPaid
                  ? "✅ Paid — waiting for confirmation…"
                  : `✅ I Have Paid (${METHOD_LABELS[paymentMethod]})`}
              </button>
            )}
          </div>
        )}
        <div className="bg-white border border-hairline">
          <div className="px-5 py-3.5 border-b border-hairline flex items-center justify-between">
            <p className="text-sm font-bold">Live thread with our team</p>
            <span className="text-[10px] uppercase tracking-wider text-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <div ref={threadRef} className="px-5 py-4 space-y-3 max-h-72 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-[13px] text-muted py-2">
                No messages yet — our team has been notified and will reply here shortly.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    m.senderRole === "ADMIN"
                      ? "bg-canvas border border-hairline text-ink"
                      : "bg-ink text-white ml-auto"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${m.senderRole === "ADMIN" ? "text-muted" : "text-white/60"}`}>
                    {m.senderRole === "ADMIN" ? "COACH 1 Team" : "You"} ·{" "}
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = msgInput.trim();
              if (!text) return;
              setMsgInput("");
              sendMessage(text);
            }}
            className="px-5 py-3.5 border-t border-hairline flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Write a message…"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              maxLength={1000}
              className="flex-1 px-3 py-2.5 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white"
            />
            <button
              type="submit"
              disabled={sendingMsg || !msgInput.trim()}
              className="p-2.5 bg-ink text-white hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Send message"
            >
              {sendingMsg ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 border border-hairline text-ink hover:bg-canvas text-label transition-colors"
        >
          <MessageCircle size={14} />
          Continue this conversation on WhatsApp
        </a>
      </main>
    </div>
  );
}
