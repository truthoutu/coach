import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function ShoppingBagButton({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      aria-label={`Shopping bag, ${count} ${count === 1 ? "item" : "items"}`}
      className="relative inline-flex p-1 transition-opacity hover:opacity-60"
    >
      <ShoppingBag className="h-[20px] w-[20px]" strokeWidth={1.25} />
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
