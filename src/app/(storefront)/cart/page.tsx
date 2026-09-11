"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";

/**
 * Shopping bag. Presentation only — all state comes from the existing
 * CartContext (localStorage-persisted), and checkout keeps its /checkout route.
 */
export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalItems, subtotal } = useCart();

  return (
    <div className="bg-white">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-12 pt-10 lg:pt-16 pb-20 lg:pb-28">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-muted">
            <li>
              <Link href="/" className="hover:text-ink transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink">Shopping Bag</li>
          </ol>
        </nav>

        {cart.length === 0 ? (
          /* ── Empty bag ─────────────────────────────────────────────── */
          <div className="py-16 lg:py-24 text-center">
            <ShoppingBag
              className="w-8 h-8 mx-auto text-muted mb-6"
              strokeWidth={1.25}
              aria-hidden="true"
            />
            <h1 className="headline-serif text-3xl sm:text-4xl lg:text-5xl text-ink mb-4">
              Your shopping bag is empty.
            </h1>
            <p className="text-sm text-muted mb-10 max-w-md mx-auto leading-relaxed">
              Discover the pieces everyone is talking about — new arrivals land
              every week.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/category/new-arrivals" className="btn-primary w-full sm:w-auto">
                See What&apos;s New
              </Link>
              <Link href="/" className="btn-outline w-full sm:w-auto">
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          /* ── Active bag ────────────────────────────────────────────── */
          <>
            <h1 className="headline-serif text-3xl sm:text-4xl text-ink mb-10 lg:mb-14">
              Shopping Bag{" "}
              <span className="text-muted text-xl sm:text-2xl align-middle">
                ({totalItems} {totalItems === 1 ? "item" : "items"})
              </span>
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              {/* Line items */}
              <ul className="lg:col-span-7 flex flex-col">
                {cart.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-5 sm:gap-7 py-7 border-b border-hairline first:pt-0"
                  >
                    <Link
                      href={`/product/${item.id}`}
                      className="relative w-[96px] sm:w-[112px] aspect-[3/4] bg-canvas overflow-hidden flex-shrink-0"
                    >
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      )}
                    </Link>

                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="text-[14px] font-medium text-ink leading-snug">
                            <Link href={`/product/${item.id}`} className="hover:underline underline-offset-4">
                              {item.name}
                            </Link>
                          </h2>
                          {item.category && (
                            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">
                              {item.category}
                            </p>
                          )}
                        </div>
                        <p className="text-[14px] text-ink flex-shrink-0">{item.priceLabel}</p>
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between">
                        {/* Quantity stepper */}
                        <div className="flex items-center border border-hairline">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="w-9 h-9 flex items-center justify-center hover:bg-canvas transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                          <span className="w-9 text-center text-[13px] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="w-9 h-9 flex items-center justify-center hover:bg-canvas transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-[11px] uppercase tracking-[0.12em] text-muted hover:text-sale transition-colors underline underline-offset-4 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Order summary */}
              <aside className="lg:col-span-5">
                <div className="border border-hairline p-6 sm:p-8 lg:sticky lg:top-32">
                  <h2 className="text-label text-ink mb-6">Order Summary</h2>

                  <div className="space-y-3.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-muted">Subtotal</span>
                      <span className="text-ink">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Express Shipping</span>
                      <span className="uppercase tracking-[0.12em] text-[11px] text-ink font-medium">
                        Complimentary
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Estimated Tax</span>
                      <span className="text-ink">Calculated at payment</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-hairline flex justify-between items-baseline">
                    <span className="text-label">Total</span>
                    <span className="text-lg text-ink">${subtotal.toFixed(2)}</span>
                  </div>

                  <Link
                    href="/checkout"
                    className="btn-primary w-full mt-7 justify-center"
                  >
                    Proceed to Checkout <ArrowRight size={14} />
                  </Link>

                  <Link
                    href="/"
                    className="block text-center text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink transition-colors mt-5"
                  >
                    Continue Shopping
                  </Link>

                  <p className="mt-7 pt-5 border-t border-hairline text-[11.5px] leading-relaxed text-muted">
                    Orders ship with complimentary express delivery and are
                    covered by our 30-day return promise. Payment is arranged
                    personally with our team at checkout.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
