import Link from "next/link";
import { User } from "lucide-react";

/** Header account icon — routes to the existing customer-care sign-in area. */
export default function AccountButton() {
  return (
    <Link
      href="/customer-care"
      aria-label="Account"
      className="inline-flex p-1 transition-opacity hover:opacity-60"
    >
      <User className="h-[20px] w-[20px]" strokeWidth={1.25} />
    </Link>
  );
}
