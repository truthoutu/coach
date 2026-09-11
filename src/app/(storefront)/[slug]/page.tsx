import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Mail, Phone, MapPin, CheckCircle, HelpCircle } from "lucide-react";
import FeedbackForm from "@/components/info/FeedbackForm";

interface InfoPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface PageData {
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: { heading: string; content: string }[];
  isFeedbackForm?: boolean;
  isCustomerCare?: boolean;
  isSitemap?: boolean;
  isFaq?: boolean;
}

const INFO_PAGES_DATA: Record<string, PageData> = {
  terms: {
    title: "Terms of Use",
    subtitle: "Terms and conditions governing your use of the COACH 1 website and services.",
    updatedAt: "September 2026",
    sections: [
      {
        heading: "1. Agreement to Terms",
        content:
          "By accessing or using our website, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree, please refrain from using our services.",
      },
      {
        heading: "2. Intellectual Property",
        content:
          "All content on this site — including design, text, and graphics — belongs to and is the property of COACH 1. You may not reproduce or distribute it without written consent. All third-party trademarks remain the property of their respective owners and are referenced only for product identification.",
      },
      {
        heading: "3. Product Orders & Pricing",
        content:
          "We reserve the right to limit order quantities or refuse service to any customer. Prices and availability of items are subject to change without prior notice. In the event of a pricing error, we reserve the right to cancel affected orders.",
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    subtitle: "How COACH 1 collects, uses, and safeguards your personal information.",
    updatedAt: "September 2026",
    sections: [
      {
        heading: "1. Information We Collect",
        content:
          "We collect personal information you provide when placing orders or subscribing to our newsletter, including your name, email, and shipping address.",
      },
      {
        heading: "2. How We Use Information",
        content:
          "Your data is used to process transactions, arrange deliveries, respond to inquiries, and communicate about products or services you have asked to hear about. We do not sell your personal information.",
      },
      {
        heading: "3. Your Privacy Rights",
        content:
          "Depending on your residence (e.g. California CCPA or EU GDPR), you have the right to request access to, deletion of, or opt-out of the sale of your personal data at any time.",
      },
      {
        heading: "4. Payment Security",
        content:
          "We never collect or store full card numbers or security codes on this site. Payments are arranged directly with our team and coordinated over WhatsApp.",
      },
    ],
  },
  shipping: {
    title: "Shipping & Delivery",
    subtitle: "How and when your order reaches you.",
    updatedAt: "September 2026",
    sections: [
      {
        heading: "Complimentary Express Shipping",
        content:
          "Every order ships with complimentary express delivery. Best-effort delivery windows are 2–3 business days within the United States once your order enters processing.",
      },
      {
        heading: "Order Processing",
        content:
          "Orders begin processing after payment is confirmed. Your order status moves from Payment Pending to Processing to Shipped, and we confirm each step with you over WhatsApp.",
      },
      {
        heading: "International Delivery",
        content:
          "We ship to a limited number of international destinations. Contact us before ordering if you are outside the United States so we can confirm availability and delivery times.",
      },
    ],
  },
  returns: {
    title: "Returns & Exchanges",
    subtitle: "Our 30-day return promise.",
    updatedAt: "September 2026",
    sections: [
      {
        heading: "30-Day Returns",
        content:
          "Items may be returned within 30 days of delivery provided they are unused, in original condition, and with all packaging and tags intact.",
      },
      {
        heading: "How to Start a Return",
        content:
          "Message us on WhatsApp with your order number and the item you'd like to return. We'll arrange return instructions before the return window closes.",
      },
      {
        heading: "Refunds",
        content:
          "Approved returns are refunded to the original payment method once the returned item is received and inspected. Exchange requests are processed as new orders where applicable.",
      },
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Quick answers to the questions we hear most.",
    updatedAt: "September 2026",
    isFaq: true,
    sections: [
      {
        heading: "How do I place an order?",
        content:
          "Add items to your bag, checkout with your shipping details, then choose a payment method. We'll save your order, arrange payment with you on WhatsApp, and process it once payment is confirmed.",
      },
      {
        heading: "Which payment methods do you accept?",
        content:
          "Bitcoin, Zelle, and Chime. We do not currently process card or gift-card payments, and we never ask for card numbers or security codes.",
      },
      {
        heading: "How is my payment arranged?",
        content:
          "After you place an order, our team contacts you over WhatsApp with payment details for your chosen method. Your order begins processing only after payment is confirmed.",
      },
      {
        heading: "Can I return an item?",
        content:
          "Yes — items can be returned within 30 days of delivery in original condition. See our Returns page for details.",
      },
    ],
  },
  "about-us": {
    title: "About COACH 1",
    subtitle: "Independent luxury bags & accessories.",
    updatedAt: "September 2026",
    sections: [
      {
        heading: "Who We Are",
        content:
          "COACH 1 is an independent online boutique offering hand-picked luxury bags, shoes, and accessories. We are not affiliated with, endorsed by, or an official storefront of Coach IP Holdings LLC or any Coach-brand trademark owner.",
      },
      {
        heading: "What We Stand For",
        content:
          "Carefully curated pieces, honest service, and a shopping experience with a human touch — every order is handled by a real person who is available to help you over WhatsApp or live chat.",
      },
    ],
  },
  feedback: {
    title: "Feedback",
    subtitle: "Tell us how we're doing — we read every message.",
    updatedAt: "September 2026",
    isFeedbackForm: true,
    sections: [],
  },
  "customer-care": {
    title: "Customer Care",
    subtitle: "A real person, available seven days a week.",
    updatedAt: "September 2026",
    isCustomerCare: true,
    sections: [
      {
        heading: "How We Can Help",
        content:
          "Questions about an order, a product, shipping, or returns — reach out through WhatsApp or the live chat widget on any page. Our hours are Monday to Sunday, 9am to 9pm.",
      },
    ],
  },
  cookies: {
    title: "Manage Cookies",
    subtitle: "How cookies are used on COACH 1, and the choices available to you.",
    updatedAt: "September 2026",
    sections: [
      {
        heading: "Essential Cookies",
        content:
          "A small number of essential cookies keep your shopping bag working between visits and keep the site secure. These cannot be switched off because the storefront cannot function without them.",
      },
      {
        heading: "Managing Cookies in Your Browser",
        content:
          "You can clear or block cookies at any time through your browser settings. Blocking essential cookies will prevent your shopping bag from being saved between visits.",
      },
    ],
  },
  sitemap: {
    title: "Site Map",
    subtitle: "Every page and category on COACH 1.",
    updatedAt: "September 2026",
    isSitemap: true,
    sections: [],
  },
};

export async function generateMetadata({
  params,
}: InfoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = INFO_PAGES_DATA[slug];
  if (!pageData) return {};
  return {
    title: pageData.title,
    description: pageData.subtitle,
    alternates: { canonical: `/${slug}` },
  };
}

export default async function InfoPage({ params }: InfoPageProps) {
  const { slug } = await params;
  const pageData = INFO_PAGES_DATA[slug];

  if (!pageData) {
    return notFound();
  }

  return (
    <div className="bg-white">
      {/* Editorial header */}
      <header className="text-center px-6 pt-14 lg:pt-20 pb-12 lg:pb-16 border-b border-hairline">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-muted mb-4">
            COACH 1
          </p>
          <h1 className="headline-serif text-4xl sm:text-5xl text-ink mb-4">
            {pageData.title}
          </h1>
          <p className="text-[15px] text-ink-soft leading-relaxed">
            {pageData.subtitle}
          </p>
          <p className="text-[11px] text-muted tracking-wide mt-5 uppercase">
            Last updated: {pageData.updatedAt}
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-14 lg:py-16">
        {pageData.sections.length > 0 && (
          <div className="space-y-9">
            {pageData.sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="headline-serif text-xl sm:text-2xl text-ink mb-3">
                  {section.heading}
                </h2>
                <p className="text-[13.5px] md:text-sm text-ink-soft leading-relaxed">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        )}

        {/* Customer care contact block */}
        {pageData.isCustomerCare && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-px bg-hairline border border-hairline">
            <div className="bg-white flex flex-col items-center gap-2 py-9 text-center px-4">
              <Phone className="w-5 h-5 text-ink" strokeWidth={1.25} aria-hidden="true" />
              <h3 className="text-label">WhatsApp Support</h3>
              <a
                href="https://wa.me/15058006924"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-muted underline underline-offset-4 hover:text-ink transition-colors"
              >
                +1 505 800 6451
              </a>
            </div>
            <div className="bg-white flex flex-col items-center gap-2 py-9 text-center px-4">
              <Mail className="w-5 h-5 text-ink" strokeWidth={1.25} aria-hidden="true" />
              <h3 className="text-label">Live Chat</h3>
              <p className="text-[13px] text-muted">Use the chat widget on any page</p>
            </div>
            <div className="bg-white flex flex-col items-center gap-2 py-9 text-center px-4">
              <MapPin className="w-5 h-5 text-ink" strokeWidth={1.25} aria-hidden="true" />
              <h3 className="text-label">Hours</h3>
              <p className="text-[13px] text-muted">Mon – Sun, 9am – 9pm</p>
            </div>
          </div>
        )}

        {/* FAQ quick links */}
        {pageData.isFaq && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/shipping" className="btn-primary">
              <HelpCircle size={14} /> Shipping Details
            </Link>
            <Link href="/returns" className="btn-outline">
              <CheckCircle size={14} /> Returns
            </Link>
          </div>
        )}

        {/* Feedback form */}
        {pageData.isFeedbackForm && <FeedbackForm />}

        {/* Site map directory */}
        {pageData.isSitemap && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-label mb-5 border-b border-ink pb-2.5">Storefront</h3>
              <ul className="space-y-2.5 text-[13px] text-ink-soft">
                <li><Link href="/" className="hover:underline underline-offset-4">Home</Link></li>
                <li><Link href="/category/new-arrivals" className="hover:underline underline-offset-4">New Arrivals</Link></li>
                <li><Link href="/category/tabby-collection" className="hover:underline underline-offset-4">Tabby Collection</Link></li>
                <li><Link href="/category/sale" className="hover:underline underline-offset-4">Sale &amp; Special Offers</Link></li>
                <li><Link href="/category/season-edit" className="hover:underline underline-offset-4">Season Edit</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-label mb-5 border-b border-ink pb-2.5">Categories</h3>
              <ul className="space-y-2.5 text-[13px] text-ink-soft">
                <li><Link href="/category/women" className="hover:underline underline-offset-4">Women&apos;s Collection</Link></li>
                <li><Link href="/category/women-bags" className="hover:underline underline-offset-4">Women&apos;s Bags</Link></li>
                <li><Link href="/category/women-shoes" className="hover:underline underline-offset-4">Women&apos;s Shoes</Link></li>
                <li><Link href="/category/men" className="hover:underline underline-offset-4">Men&apos;s Collection</Link></li>
                <li><Link href="/category/men-bags" className="hover:underline underline-offset-4">Men&apos;s Bags</Link></li>
                <li><Link href="/category/shoes" className="hover:underline underline-offset-4">All Shoes</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-label mb-5 border-b border-ink pb-2.5">Help &amp; Info</h3>
              <ul className="space-y-2.5 text-[13px] text-ink-soft">
                <li><Link href="/customer-care" className="hover:underline underline-offset-4">Customer Care</Link></li>
                <li><Link href="/faq" className="hover:underline underline-offset-4">FAQs</Link></li>
                <li><Link href="/shipping" className="hover:underline underline-offset-4">Shipping &amp; Delivery</Link></li>
                <li><Link href="/returns" className="hover:underline underline-offset-4">Returns &amp; Exchanges</Link></li>
                <li><Link href="/privacy-policy" className="hover:underline underline-offset-4">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:underline underline-offset-4">Terms of Use</Link></li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
