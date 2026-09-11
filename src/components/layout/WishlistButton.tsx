"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { WISHLIST_EVENT, isWishlisted, toggleWishlist, wishlistCount } from "@/lib/nav";

function useWishlistState(productId?: string) {
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => {
      setCount(wishlistCount());
      setActive(productId ? isWishlisted(productId) : false);
    };
    sync();
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id?: string; wishlisted?: boolean } | undefined;
      if (!detail || !productId || detail.id === productId) sync();
      else setCount(wishlistCount());
    };
    window.addEventListener(WISHLIST_EVENT, onUpdate);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, onUpdate);
      window.removeEventListener("storage", sync);
    };
  }, [productId]);

  return { count, active };
}

/** Header heart — navigates to the wishlist page; badge reflects saved count. */
export function WishlistButton() {
  const { count } = useWishlistState();
  return (
    <Link
      href="/wishlist"
      aria-label={count > 0 ? `Wishlist, ${count} saved ${count === 1 ? "item" : "items"}` : "Wishlist"}
      className="relative inline-flex p-1 transition-opacity hover:opacity-60"
    >
      <Heart className="h-[20px] w-[20px]" strokeWidth={1.25} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-0.5 bg-white px-0.5 text-[10px] font-semibold tabular-nums leading-none"
        >
          {count}
        </span>
      )}
    </Link>
  );
}

/** Minimal heart toggle used on product cards and PDP info columns. */
export function WishlistToggle({
  productId,
  productName,
  className = "",
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const { active } = useWishlistState(productId);
  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId)}
      aria-pressed={active}
      aria-label={active ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={`inline-flex cursor-pointer items-center justify-center p-1.5 transition-all hover:scale-110 ${className}`}
    >
      <Heart
        className="h-[18px] w-[18px]"
        strokeWidth={1.25}
        fill={active ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </button>
  );
}
