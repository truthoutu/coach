"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { GIFT_CARD_BRANDS } from "@/lib/gift-card-brands";
import OrderTracker from "@/components/checkout/OrderTracker";
import {
 Lock,
 ArrowLeft,
 MessageCircle,
 CheckCircle2,
 Gift,
 Loader2,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
const WHATSAPP_LINK = "https://wa.me/15058006451";

// ─── Payment methods that are genuinely operational ─────────────────────────
// Payment is coordinated through WhatsApp with our team. Gift card payments
// are accepted: the customer submits a card code and our team verifies it
// manually before the order is processed.
type PaymentMethod = "bitcoin" | "zelle" | "chime" | "cashapp" | "gift_card";

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
 { id: "bitcoin", label: "Bitcoin" },
 { id: "zelle", label: "Zelle" },
 { id: "chime", label: "Chime" },
 { id: "cashapp", label: "Cash App" },
 { id: "gift_card", label: "Gift Card" },
];

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

 // Gift card UI state
 const [giftCardData, setGiftCardData] = useState({
  brand: "AMAZON",
  code: "",
  pin: "",
  claimedValue: "",
 });

  const handlePlaceOrder = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");

 if (cart.length === 0) {
 setError("Your shopping bag is empty.");
 return;
 }

 // Gift card details are required up front so the team has everything
 // needed to verify the card as soon as the order lands.
 if (paymentMethod === "gift_card") {
 if (!giftCardData.code.trim()) {
 setError("Please enter your gift card code, or choose a different payment method.");
 return;
 }
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
 ...(paymentMethod === "gift_card"
 ? {
 giftCard: {
 brand: giftCardData.brand,
 code: giftCardData.code,
 pin: giftCardData.pin,
 claimedValue: giftCardData.claimedValue,
 },
 }
 : {}),
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
 } catch (err) {
 console.error(err);
 setError("Could not place your order. Please try again.");
 setIsCreatingOrder(false);
 }
 };

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
 : method === "chime"
 ? "🟢 I'd like to pay with Chime."
 : method === "cashapp"
 ? "💚 I'd like to pay with Cash App."
 : "🎁 I'd like to pay with a gift card.";

 return (
 `Hi COACH 1! 🛍️\n\n` +
 `${methodLine}\n\n` +
 `📦 *Order ${orderNumber}*\n` +
 `Items:\n${itemLines}\n\n` +
 `💰 *Total:* $${subtotal.toFixed(2)}\n\n` +
 (method === "gift_card"
 ? `🎁 *Gift card:* ${GIFT_CARD_BRANDS.find((b) => b.id === giftCardData.brand)?.label ?? giftCardData.brand}\n` +
 `🔑 *Code:* ${giftCardData.code.trim()}\n` +
 (giftCardData.pin.trim() ? `🔐 *PIN:* ${giftCardData.pin.trim()}\n` : "") +
 (giftCardData.claimedValue.trim() ? `💵 *Claimed balance:* $${giftCardData.claimedValue.trim()}\n` : "") +
 `\n` : "") +
 `📍 *Ship to:* ${addr}\n` +
 `📧 *Email:* ${formData.email}\n` +
 (formData.phone ? `📱 *Phone:* ${formData.phone}\n` : "") +
 `\nPlease confirm and arrange payment. Thank you!`
 );
 };

 // ── Live payment tracker (order status, admin thread, I-have-paid) ────────
 if (phase === "payment") {
  const handleDone = () => {
   clearCart();
   setPhase("form");
   setOrderNumber("");
   router.push("/");
  };

  return (
   <OrderTracker
    orderNumber={orderNumber}
    orderTotal={orderTotal || subtotal}
    paymentMethod={paymentMethod}
    email={formData.email}
    giftCardBrandLabel={
     GIFT_CARD_BRANDS.find((b) => b.id === giftCardData.brand)?.label ?? giftCardData.brand
    }
    giftCardLast4={giftCardData.code.trim().slice(-4).toUpperCase()}
    whatsappHref={buildWhatsAppUrl(buildOrderMessage(paymentMethod))}
    onDone={handleDone}
   />
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

 <div className="grid grid-cols-3 gap-2 sm:gap-3 sm:grid-cols-5">
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

 {paymentMethod === "gift_card" && (
 <div className="bg-canvas border border-hairline p-4 sm:p-5 space-y-3">
 <p className="text-sm font-bold flex items-center gap-2">
 <Gift size={14} /> Gift Card Details
 </p>
 <p className="text-[12px] text-muted leading-relaxed">
 We accept Amazon, Visa/Mastercard prepaid, Steam, Apple, Google Play and more. Your code is
 stored securely and verified by our team on WhatsApp — your order ships once it checks out.
 Never share your code anywhere else.
 </p>
 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">
 Card Brand *
 </label>
 <select
 value={giftCardData.brand}
 onChange={(e) => setGiftCardData({ ...giftCardData, brand: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white"
 >
 {GIFT_CARD_BRANDS.map((brand) => (
 <option key={brand.id} value={brand.id}>{brand.label}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">
 Gift Card Code *
 </label>
 <input
 type="text"
 required
 autoComplete="off"
 placeholder="e.g. A1B2C3D4E5F6G7H8"
 value={giftCardData.code}
 onChange={(e) => setGiftCardData({ ...giftCardData, code: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white font-mono"
 />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">
 PIN (if any)
 </label>
 <input
 type="text"
 autoComplete="off"
 placeholder="1234"
 value={giftCardData.pin}
 onChange={(e) => setGiftCardData({ ...giftCardData, pin: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white font-mono"
 />
 </div>
 <div>
 <label className="block text-xs uppercase tracking-wider font-bold text-ink-soft mb-1">
 Claimed Balance ($)
 </label>
 <input
 type="number"
 min="0"
 step="0.01"
 placeholder="100.00"
 value={giftCardData.claimedValue}
 onChange={(e) => setGiftCardData({ ...giftCardData, claimedValue: e.target.value })}
 className="w-full px-4 py-3 border border-hairline text-sm outline-none focus:border-ink transition-colors bg-white font-mono"
 />
 </div>
 </div>
 </div>
 )}

 <p className="text-[13px] text-muted leading-relaxed">
 Payment is completed directly with our team. Gift card codes are verified by our team before
 your order is processed — we never ask for your card PIN anywhere else.
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

 <div className="bg-canvas p-4 border border-hairline space-y-2 text-[11px] text-muted">
 <div className="flex items-center gap-2 text-black font-semibold">
 <CheckCircle2 size={16} /> How payment works
 </div>
 <p>
 1. Your order is saved with a reference number.
 <br />
 2. We&apos;ll arrange payment with you on WhatsApp.
 <br />
 3. Your order begins processing once payment is confirmed.
 </p>
 </div>

 <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
 className="flex items-center justify-center gap-2 w-full py-3 border border-hairline text-ink hover:bg-canvas text-label transition-colors">
 <MessageCircle size={14} />
 Questions? Chat with us on WhatsApp
 </a>
 </div>
 </div>
 </form>
 </main>
 </div>
 );
}
