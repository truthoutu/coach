import Link from "next/link";

/**
 * The COACH 1 wordmark. Rendered with the editorial serif at generous
 * tracking to read as a luxury house mark. The trailing-tracking offset in
 * the `.wordmark` class keeps it optically centered.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="COACH 1 — Home"
      className={`wordmark inline-block text-ink ${className}`}
    >
      Coach&nbsp;1
    </Link>
  );
}
