import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";

/**
 * Centered desktop category nav. Hover and keyboard focus reveal a restrained
 * dropdown of subcategory links (CSS-only state — accessible via
 * :focus-within, no JS state to keep in sync).
 */
export default function DesktopNav() {
  return (
    <nav aria-label="Primary" className="hidden lg:block">
      <ul className="flex items-center justify-center gap-8 px-8 xl:gap-9">
        {NAV_ITEMS.map((item) => (
          <li key={item.label} className="group relative">
            <Link
              href={item.href}
              className={`link-underline block py-3 text-[11px] font-medium uppercase tracking-[0.14em] ${
                item.highlight ? "text-sale" : "text-ink"
              }`}
            >
              {item.label}
            </Link>

            {item.children && item.children.length > 0 && (
              <div
                className="invisible opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 absolute left-1/2 -translate-x-1/2 top-full z-50"
              >
                <div className="bg-white border border-hairline px-10 py-6 min-w-[240px] shadow-[0_18px_30px_-12px_rgba(0,0,0,0.12)]">
                  <ul className="flex flex-col gap-3">
                    {item.children.map((child, idx) => (
                      <li key={`${child.href}-${idx}`}>
                        <Link
                          href={child.href}
                          className="text-[13px] text-ink-soft hover:text-ink hover:underline underline-offset-4 whitespace-nowrap transition-colors"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
