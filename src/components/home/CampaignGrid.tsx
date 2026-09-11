"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SectionHeading from "./SectionHeading";

interface Campaign {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
}

const FALLBACK_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    title: "Shoulder Bags",
    subtitle: "Iconic silhouettes built for daily luxury",
    image: "/shoulder-bags.png",
    link: "/category/women-bags",
  },
  {
    id: "2",
    title: "New Shoes",
    subtitle: "Step into modern elegance",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop",
    link: "/category/shoes",
  },
];

/** Replaceable editorial tile used to complete the two-up grid. */
const STATIC_TILE = {
  id: "static-wallets-tile",
  title: "Wallets & Wristlets",
  subtitle: "Small leather goods, considered to the last stitch",
  image:
    "https://images.unsplash.com/photo-1606503153255-34cc92499e0a?q=80&w=1974&auto=format&fit=crop",
  link: "/category/wallets",
};

function resolveLink(link: string | undefined): string {
  if (!link || link === "#" || link === "") return "/category/women-bags";
  return link;
}

/**
 * Editorial campaign section. Campaigns still load from /api/campaigns
 * (admin-managed) with the original fallback set; the "accessories" filter
 * from the previous implementation is preserved.
 */
export default function CampaignGrid() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(FALLBACK_CAMPAIGNS);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await fetch("/api/campaigns");
        if (res.ok) {
          const data = await res.json();
          const filtered = data.filter(
            (item: Campaign) => item.title.toLowerCase() !== "accessories"
          );
          if (filtered && filtered.length > 0) {
            setCampaigns(filtered);
          }
        }
      } catch (err) {
        console.error("Failed to load campaigns from database:", err);
      }
    }
    loadCampaigns();
  }, []);

  const featureCampaign = campaigns[0] ?? FALLBACK_CAMPAIGNS[0];
  const secondaryCampaign = campaigns[1] ?? FALLBACK_CAMPAIGNS[1];

  return (
    <section className="py-14 lg:py-20">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Editorial"
          title="For all your adventures."
          ctaText="Shop the Collection"
          ctaHref="/category/women-bags"
        />
      </div>

      {/* Full-bleed feature campaign */}
      <div className="px-5 sm:px-8 lg:px-12 max-w-[1600px] mx-auto">
        <CampaignTile campaign={featureCampaign} tall />

        {/* Two-up: secondary campaign + static category tile */}
        <div className="grid md:grid-cols-2 gap-4 lg:gap-5 mt-4 lg:mt-5">
          {secondaryCampaign && <CampaignTile campaign={secondaryCampaign} />}
          <CampaignTile campaign={STATIC_TILE} />
        </div>
      </div>
    </section>
  );
}

function CampaignTile({
  campaign,
  tall = false,
}: {
  campaign: Campaign;
  tall?: boolean;
}) {
  return (
    <Link
      href={resolveLink(campaign.link)}
      className="group relative block w-full overflow-hidden bg-canvas"
    >
      <div className={`relative ${tall ? "h-[70vh] min-h-[480px] lg:h-[78vh]" : "aspect-[4/5]"}`}>
        <Image
          src={campaign.image}
          alt={campaign.title}
          fill
          sizes={tall ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white">
          <h3 className="headline-serif text-3xl sm:text-4xl lg:text-5xl mb-2.5">
            {campaign.title}
          </h3>
          {campaign.subtitle && (
            <p className="text-[13px] sm:text-sm text-white/85 mb-5 max-w-md leading-relaxed">
              {campaign.subtitle}
            </p>
          )}
          <span className="link-underline text-label">Shop Now</span>
        </div>
      </div>
    </Link>
  );
}
