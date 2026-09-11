"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { BITCOIN_ADDRESS, SITE_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_LINK } from "@/lib/site";
import {
 Lock,
 ArrowLeft,
 MessageCircle,
 Copy,
 Check,
 CheckCircle2,
 Clock,
 Loader2,
} from "lucide-react";

// ─── Payment methods that are genuinely operational ─────────────────────────
// Payment is coordinated through WhatsApp with our team; card and gift-card
// processing are not available yet and are intentionally NOT offered.
type PaymentMethod = "bitcoin" | "zelle" | "chime" | "cashapp" | "apple_pay";

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
 { id: "apple_pay", label: "Apple Pay" },
 { id: "cashapp", label: "Cash App" },
 { id: "zelle", label: "Zelle" },
 { id: "chime", label: "Chime" },
 { id: "bitcoin", label: "Bitcoin" },
];

function methodLabel(m: string) {
  if (m === "apple_pay" || m === "APPLE_PAY") return "Apple Pay";
  if (m === "cashapp" || m === "CASHAPP") return "Cash App";
  if (m === "zelle" || m === "ZELLE") return "Zelle";
  if (m === "chime" || m === "CHIME") return "Chime";
  return "Bitcoin";
}

// ─── Countries ────────────────────────────────────────────────────────────────
const COUNTRIES = [
 "United States", "United Kingdom", "Canada", "Australia", "Afghanistan",
 "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
 "Armenia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh",
 "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
 "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
 "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
 "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
 "Congo (DRC)", "Congo (Republic)", "Costa Rica", "Croatia", "Cuba", "Cyprus",
 "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
 "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
 "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia",
 "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
 "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India",
 "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan",
 "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos",
 "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
 "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives",
 "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
 "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
 "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
 "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
 "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
 "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
 "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
 "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
 "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
 "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
 "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
 "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
 "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
 "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
 "United Arab Emirates", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
 "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildWhatsAppUrl(message: string) {
 return `${WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;
}

type Phase = "form" | "payment";

// ─── Component ────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
 const router = useRouter();
 const { cart, subtotal, clearCart } = useCart();

 const [formData, setFormData] = useState({
 email: "",
 firstName: "",
 lastName: "",
 phone: "",
 address: "",
 city: "",
 postalCode: "",
 country: "United States",
 });

 const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bitcoin");

 // Order state
 const [phase, setPhase] = useState<Phase>("form");
 const [orderNumber, setOrderNumber] = useState("");
 const [orderTotal, setOrderTotal] = useState(0);
 const [isCreatingOrder, setIsCreatingOrder] = useState(false);
 const [error, setError] = useState("");

 // Bitcoin UI state
 const [payLive, setPayLive] = useState<{
   detailsReady: boolean;
   paymentImage: string | null;
   paymentNote: string | null;
   customerPaidAt: string | null;
   confirmed: boolean;
 } | null>(null);

 // WhatsApp popup support (avoid popup blockers after async work)
 const openWhatsAppAfter = (url: string) => {
 const win = window.open("", "_blank");
 if (win) {
 win.opener = null;
 win.location.href = url;
 } else {
 window.location.href = url;
 }
 };

 const handlePlaceOrder = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");

 if (cart.length === 0) {
 setError("Your shopping bag is empty.");
 return;
 }

 setIsCreatingOrder(true);
 try {
 const res = await fetch("/api/orders", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 email: formData.email,
 firstName: formData.firstName,
 lastName: formData.lastName,
 phone: formData.phone,
 address: formData.address,
 city: formData.city,
 postalCode: formData.postalCode,
 country: formData.country,
 paymentMethod: paymentMethod.toUpperCase(),
 items: cart.map((i) => ({
 productId: i.id,
 name: i.name,
 price: i.price,
 quantity: i.quantity,
 image: i.image,
 })),
 }),
 });

 const data = await res.json();
 if (!res.ok || !data.order) {
 setError(data.error || "Could not place your order. Please try again.");
 setIsCreatingOrder(false);
 return;
 }

 setOrderNumber(data.order.number);
 setOrderTotal(data.order.total);
 setPhase("payment");
 setPayLive({
 detailsReady: false,
 paymentImage: null,
 paymentNote: null,
 customerPaidAt: null,
 confirmed: false,
 });
 } catch (err) {
 console.error(err);
 setError("Could not place your order. Please try again.");
 setIsCreatingOrder(false);
 }
 };

 useEffect(() => {
   if (phase !== "payment" || !orderNumber) return;
   let stop = false;
   const tick = async () => {
     try {
       const res = await fetch(`/api/orders/pay?number=${encodeURIComponent(orderNumber)}`);
       const data = await res.json();
       if (!stop && data.order) setPayLive(data.order);
     } catch {
       /* retry */
     }
   };
   tick();
   const t = setInterval(tick, 3000);
   return () => {
     stop = true;
     clearInterval(t);
   };
 }, [phase, orderNumber]);

 // ── Build order message for a given payment method ────────────────────────
 const buildOrderMessage = (method: PaymentMethod) => {
 const itemLines = cart
 .map((i) => ` • ${i.name} x${i.quantity} — ${i.priceLabel}`)
 .join("\n");
 const addr = `${formData.firstName} ${formData.lastName}, ${formData.address}, ${formData.city} ${formData.postalCode}, ${formData.country}`;
 const methodLine =
 method === "bitcoin"
 ? "I'd like to pay with Bitcoin."
 : method === "zelle"
 ? "💜 I'd like to pay with Zelle."
 : "🟢 I'd like to pay with Chime.";

 return (
 `Hi COACH 1! 🛍️\n\n` +
 `${methodLine}\n\n` +
 `📦 *Order ${orderNumber}*\n` +
 `Items:\n${itemLines}\n\n` +
 `💰 *Total:* $${subtotal.toFixed(2)}\n\n` +
 `📍 *Ship to:* ${addr}\n` +
 `📧 *Email:* ${formData.email}\n` +
 (formData.phone ? `📱 *Phone:* ${formData.phone}\n` : "") +
 `\nPlease confirm and arrange payment. Thank you!`
 );
 };

 // ────────────────────────────────────────────────────────────────────────────
 if (phase === "payment") {
 const handleDone = () => {
 clearCart();
 setPhase("form");
 setPayLive(null);
 setOrderNumber("");
 router.push("/");
 };

 const waitingDetails = !payLive?.detailsReady && !payLive?.confirmed;
 const waitingAdmin = Boolean(payLive?.customerPaidAt) && !payLive?.confirmed;
 const canConfirm = Boolean(payLive?.detailsReady) && !payLive?.customerPaidAt && !payLive?.confirmed;

 const markPaid = async () => {
 const res = await fetch("/api/orders/pay", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ number: orderNumber }),
 });
 const data = await res.json();
 if (data.order) setPayLive(data.order);
 };

 return (
 <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-ink">
 <div className="bg-white p-8 md:p-12 border border-hairline max-w-xl w-full space-y-6">
 <div className="text-center space-y-3">
 <div className="w-14 h-14 bg-canvas text-ink border border-hairline flex items-center justify-center mx-auto">
 {waitingAdmin || payLive?.confirmed ? <Loader2 size={28} className={payLive?.confirmed ? "" : "animate-spin"} /> : <Clock size={28} />}
 </div>
 <h1 className="headline-serif text-3xl">{payLive?.confirmed ? "Payment confirmed" : "Complete payment"}</h1>
 <p className="text-sm text-muted">Order <span className="font-bold text-black">{orderNumber}</span> · {methodLabel(paymentMethod)} · ${orderTotal.toFixed(2)}</p>
 </div>

 {waitingDetails && (
 <div className="bg-canvas border border-hairline p-5 text-center space-y-3">
 <Loader2 className="animate-spin mx-auto" size={28} />
 <p className="text-sm font-medium">Waiting for payment details</p>
 <p className="text-[13px] text-muted">Our team was just notified. Stay on this page — the {methodLabel(paymentMethod)} QR or extra note will appear here when sent.</p>
 {paymentMethod === "bitcoin" ? (
 <p className="text-[13px] break-all font-mono pt-2">{BITCOIN_ADDRESS}</p>
 ) : null}
 </div>
 )}

 {payLive?.detailsReady && !payLive?.confirmed && (
 <div className="space-y-4">
 {payLive.paymentImage ? (
 <div className="border border-hairline p-3 bg-canvas">
 <img src={payLive.paymentImage} alt="Payment details" className="w-full max-h-80 object-contain mx-auto" />
 </div>
 ) : null}
 {payLive.paymentNote ? <p className="text-sm whitespace-pre-wrap border border-hairline p-4">{payLive.paymentNote}</p> : null}
 {!waitingAdmin ? (
 <button type="button" onClick={markPaid} className="btn-primary w-full">Confirm payment</button>
 ) : (
 <div className="text-center space-y-3 py-4">
 <Loader2 className="animate-spin mx-auto" size={36} />
 <p className="text-sm font-medium">Verifying your payment</p>
 <p className="text-[13px] text-muted">Keep this page open. This spinner stops when our team confirms the transfer.</p>
 </div>
 )}
 </div>
 )}

 {payLive?.confirmed && (
 <p className="text-sm text-center">Thank you. Your order is now being prepared.</p>
 )}

 <button type="button" onClick={handleDone} className="btn-outline w-full">Return to store</button>
 </div>
 </div>
 );
 }

 // ─── Main checkout form ─────────────────────────────────────────────────────
 return (
 <div className="min-h-screen bg-paper text-ink">
 {/* Header */}
 <header className="bg-white border-b border-hairline px-4 sm:px-8 py-3.5 sticky top-0 z-30">
 <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
 <Link href="/cart" className="flex items-center gap-1.5 text-label text-muted hover:text-ink transition-colors">
 <ArrowLeft size={14} /> Return to Bag
 </Link>
 <Link href="/" className="wordmark text-[19px] sm:text-[21px] text-ink text-center">
 COACH 1
 </Link>
 <div className="w-20 sm:w-28" />
 </div>
 </header>

 <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
 <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
 {/* ── LEFT COLUMN ── */}
 <div className="lg:col-span-7 space-y-8">
 {/* STEP 1: Contact & SHIPPING */}
 <div className="bg-white p-5 sm:p-8 border border-hairline space-y-4">
 <h2 className="headline-serif text-lg sm:text-xl border-b border-hairline pb-3">
 1. Contact &amp; Shipping Address
 </h2>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">Email Address *</label>
 <input type="email" required placeholder="john@example.com" value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white" />
 </div>
 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">Phone (WhatsApp) *</label>
 <input type="tel" required placeholder="+1 505 800 6451" value={formData.phone}
 onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white" />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">First Name *</label>
 <input type="text" required placeholder="John" value={formData.firstName}
 onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white" />
 </div>
 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">Last Name *</label>
 <input type="text" required placeholder="Doe" value={formData.lastName}
 onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white" />
 </div>
 </div>

 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">Street Address *</label>
 <input type="text" required placeholder="123 Luxury Way, Apt 4B" value={formData.address}
 onChange={(e) => setFormData({ ...formData, address: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white" />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">City *</label>
 <input type="text" required placeholder="New York" value={formData.city}
 onChange={(e) => setFormData({ ...formData, city: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white" />
 </div>
 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">Zip / Postal *</label>
 <input type="text" required placeholder="10001" value={formData.postalCode}
 onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white" />
 </div>
 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">Country *</label>
 <select
 value={formData.country}
 onChange={(e) => setFormData({ ...formData, country: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white bg-white"
 >
 {COUNTRIES.map((c) => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>
 </div>
 </div>

 {/* STEP 2: DELIVERY */}
 <div className="bg-white p-5 sm:p-8 border border-hairline space-y-4">
 <h2 className="headline-serif text-lg sm:text-xl border-b border-hairline pb-3">
 2. Delivery Option
 </h2>
 <div className="p-4 border border-ink flex items-center justify-between bg-canvas">
 <div>
 <p className="text-sm font-bold">Complimentary Express Shipping</p>
 <p className="text-xs text-muted mt-0.5">Ships in signature packaging once payment is confirmed</p>
 </div>
 <span className="text-[11px] tracking-[0.12em] font-medium text-ink uppercase flex-shrink-0 ml-2">FREE</span>
 </div>
 </div>

 {/* STEP 3: PAYMENT */}
 <div className="bg-white p-5 sm:p-8 border border-hairline space-y-4">
 <h2 className="headline-serif text-lg sm:text-xl border-b border-hairline pb-3">
 3. Payment Method
 </h2>

 <div className="grid grid-cols-3 gap-2 sm:gap-3">
 {PAYMENT_METHODS.map((method) => (
 <button
 key={method.id}
 type="button"
 onClick={() => {
 setPaymentMethod(method.id);
 }}
 className={`py-3 px-2 text-[11px] sm:text-xs font-medium tracking-wide border transition-colors flex flex-col items-center justify-center gap-1.5 min-h-[64px] ${
 paymentMethod === method.id
 ? "border-black bg-black text-white"
 : "border-hairline text-ink-soft hover:border-ink bg-white"
 }`}
 >
 <span className="text-center leading-tight">{method.label}</span>
 </button>
 ))}
 </div>

 <p className="text-[13px] text-muted leading-relaxed">
 Payment is completed directly with our team. Card and gift-card processing
 are not currently offered — we never ask for card numbers or codes.
 </p>

 <button
 type="submit"
 disabled={isCreatingOrder}
 className="btn-primary w-full mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
 >
 {isCreatingOrder ? (
 <>
 <Loader2 size={16} className="animate-spin" /> Creating Order…
 </>
 ) : (
 <>
 <Lock size={16} /> Place Order (${subtotal.toFixed(2)})
 </>
 )}
 </button>

 {error && (
 <p className="text-sm text-alert font-medium" role="alert">
 {error}
 </p>
 )}
 </div>
 </div>

 {/* ── RIGHT COLUMN: Order Summary ── */}
 <div className="lg:col-span-5">
 <div className="bg-white p-5 sm:p-8 border border-hairline sticky top-24 space-y-6">
 <h2 className="headline-serif text-lg sm:text-xl border-b border-hairline pb-3">
 Order Items ({cart.length})
 </h2>

 {cart.length === 0 ? (
 <p className="text-[13px] text-muted py-4">No items in bag.</p>
 ) : (
 <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
 {cart.map((item) => (
 <div key={item.id} className="flex gap-4 items-center">
 <div className="w-16 h-20 bg-canvas overflow-hidden flex-shrink-0">
 <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
 </div>
 <div className="flex-1">
 <h4 className="text-[13px] font-medium line-clamp-1">{item.name}</h4>
 <span className="text-[11px] text-muted">Qty: {item.quantity}</span>
 </div>
 <span className="text-[13px] font-medium">{item.priceLabel}</span>
 </div>
 ))}
 </div>
 )}

 <div className="border-t border-hairline pt-4 space-y-2 text-[13px]">
 <div className="flex justify-between text-muted">
 <span>Subtotal</span>
 <span className="font-medium text-ink">${subtotal.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-muted">
 <span>Express Shipping</span>
 <span className="text-ink font-medium uppercase tracking-[0.12em] text-[11px]">FREE</span>
 </div>
 <div className="flex justify-between text-muted">
 <span>Estimated Tax</span>
 <span className="font-medium text-ink">$0.00</span>
 </div>
 <div className="border-t border-hairline pt-3 flex justify-between text-sm font-medium">
 <span>Total</span>
 <span className="text-base">${subtotal.toFixed(2)}</span>
 </div>
 </div>

 <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
 className="flex items-center justify-center gap-2 w-full py-3 border border-hairline text-ink hover:bg-canvas text-label transition-colors">
 <MessageCircle size={14} />
 WhatsApp {WHATSAPP_DISPLAY}
 </a>
 <a href={`mailto:${SITE_EMAIL}`}
 className="flex items-center justify-center w-full py-3 border border-hairline text-ink hover:bg-canvas text-label transition-colors">
 {SITE_EMAIL}
 </a>
 </div>
 </div>
 </form>
 </main>
 </div>
 );
}