import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FeedbackTab from "@/components/layout/FeedbackTab";

/**
 * Shared storefront chrome. Admin (`/admin`) and checkout stay outside this
 * group and keep their own layouts, exactly as before.
 */
export default function StorefrontLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <FeedbackTab />
    </>
  );
}
