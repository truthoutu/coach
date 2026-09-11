import type { Metadata } from "next";
import { Work_Sans, EB_Garamond } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import FloatingChat from "@/components/layout/FloatingChat";
import SecurityGuard from "@/components/layout/SecurityGuard";

// Work Sans — the UI grotesque: navigation, labels, product metadata, buttons.
const workSans = Work_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// EB Garamond — the editorial serif: wordmark and storytelling headlines.
const ebGaramond = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const SITE_NAME = "COACH 1";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Luxury Bags, Shoes & Accessories`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "COACH 1 is an independent online boutique for hand-picked luxury bags, shoes, and accessories. Complimentary express shipping and 30-day returns on every order.",
  themeColor: "#ffffff",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Luxury Bags, Shoes & Accessories`,
    description:
      "Hand-picked luxury bags, shoes, and accessories from an independent boutique.",
    images: [{ url: SITE_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} homepage` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Luxury Bags, Shoes & Accessories`,
    description:
      "Hand-picked luxury bags, shoes, and accessories from an independent boutique.",
    images: [SITE_IMAGE],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${workSans.variable} ${ebGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <CartProvider>{children}</CartProvider>
        <FloatingChat />
        <SecurityGuard />
      </body>
    </html>
  );
}

