import Hero from "@/components/home/Hero";
import CampaignGrid from "@/components/home/CampaignGrid";
import ProductCarousel from "@/components/home/ProductCarousel";
import EditorialSection from "@/components/home/EditorialSection";
import ServiceSection from "@/components/home/ServiceSection";
import NewsletterBand from "@/components/home/NewsletterBand";

/**
 * Homepage: editorial hero → new-arrivals carousel → campaign tiles →
 * split editorial → services → newsletter. Data sections self-fetch on the
 * client from the existing API routes (resilient when the database is
 * cold/unavailable), so the page prerenders statically.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <ProductCarousel
        eyebrow="Just In"
        title="New Arrivals"
        viewAllHref="/category/new-arrivals"
        priorityFirst
      />
      <CampaignGrid />
      <EditorialSection />
      <EditorialSection
        eyebrow="Ready-To-Wear"
        title="Dressed for every version of you."
        copy="Layer-ready pieces that pair back to the bags you already love — quiet luxury, made for movement."
        ctaText="Shop Ready-To-Wear"
        ctaHref="/category/women-ready-to-wear"
        imageSrc="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop"
        imageSide="right"
      />
      <ServiceSection />
      <NewsletterBand />
    </>
  );
}
