import React from "react";
import Link from "next/link";
import { Truck, RotateCcw, Gift, MessageCircle } from "lucide-react";

interface Service {
  icon: React.ReactNode;
  title: string;
  blurb: string;
  href: string;
}

const SERVICES: Service[] = [
  {
    icon: <Truck className="w-5 h-5" strokeWidth={1.25} aria-hidden="true" />,
    title: "Complimentary Shipping",
    blurb: "Express delivery on every order, on us.",
    href: "/shipping",
  },
  {
    icon: <RotateCcw className="w-5 h-5" strokeWidth={1.25} aria-hidden="true" />,
    title: "Easy Returns",
    blurb: "30 days to change your mind.",
    href: "/returns",
  },
  {
    icon: <Gift className="w-5 h-5" strokeWidth={1.25} aria-hidden="true" />,
    title: "Gifting",
    blurb: "Pieces chosen to be remembered.",
    href: "/category/gifts",
  },
  {
    icon: <MessageCircle className="w-5 h-5" strokeWidth={1.25} aria-hidden="true" />,
    title: "Personal Service",
    blurb: "A real person, seven days a week.",
    href: "/customer-care",
  },
];

/**
 * Service strip mirroring the reference storefront's house-services row:
 * quiet icons, tracked labels, hairline dividers.
 */
export default function ServiceSection() {
  return (
    <section className="border-y border-hairline">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <ul className="grid grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, idx) => (
            <li
              key={service.title}
              className={`py-10 lg:py-12 px-2 sm:px-8 text-center ${
                idx % 2 === 1 ? "border-l border-hairline" : ""
              } ${idx >= 2 ? "border-t lg:border-t-0 border-hairline" : ""} ${
                idx === 2 ? "lg:border-l" : ""
              }`}
            >
              <Link href={service.href} className="group flex flex-col items-center gap-3">
                <span className="text-ink group-hover:opacity-60 transition-opacity">
                  {service.icon}
                </span>
                <span className="text-label">{service.title}</span>
                <span className="text-[12px] text-muted leading-relaxed max-w-[180px]">
                  {service.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
