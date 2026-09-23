/**
 * Home — the 2026-09 CRO redesign of the Primetime Research homepage, built
 * from the Claude Design file "Primetime Research.dc.html" (DESIGN.md §0).
 *
 * Server component: the catalog is fetched once here (React-cached) and
 * handed to the sections that need it. Client leaves: BestSellers
 * (add-to-cart + toast) and HomeFaq (accordion).
 *
 * Section order (the design): hero → trust strip → marquee → best sellers
 * → COA / testing (#coa) → bulk (#bulk) → why us → FAQ (#faq) → closing CTA
 * band. Bulk sits after the certificate proof and before the supplier pitch:
 * volume pricing only lands once purity is established.
 *
 * The category grid that sat in the marquee's slot was dropped (owner request
 * 2026-09-24); categories are still browsable from the catalog's filter chips.
 *
 * The redesign's serif (Source Serif 4, SIL OFL) is loaded here rather than
 * in the root layout so only the homepage downloads it; its variable is set
 * on <main>. `.landing` hands heading styles back to utilities (globals.css).
 */

import type { Metadata } from "next";
import localFont from "next/font/local";
import type { Product } from "@/lib/woo/types";
import { getCatalog } from "@/lib/woo/catalog";
import { brandConfig } from "@/content/brand-config";
import { organizationJsonLd } from "@/lib/jsonld";
import { cn } from "@/lib/utils";
import { Hero } from "@/components/landing/Hero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { Marquee } from "@/components/landing/Marquee";
import { BestSellers } from "@/components/landing/BestSellers";
import { CoaSection } from "@/components/landing/CoaSection";
import { BulkOrder } from "@/components/landing/BulkOrder";
import { WhyUs } from "@/components/landing/WhyUs";
import { HomeFaq } from "@/components/landing/HomeFaq";
import { CtaBand } from "@/components/landing/CtaBand";

const sourceSerif = localFont({
  src: "../fonts/SourceSerif4-SemiBold-latin.woff2",
  weight: "600",
  style: "normal",
  variable: "--font-source-serif-face",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  // Live <title>: "Home - Primetime Research".
  title: { absolute: `Home - ${brandConfig.name}` },
  description: brandConfig.hero.subhead,
};

// The live homepage product carousel, in live order (verified against
// content/taxonomy.ts slugs). Best sellers shows the first four of these
// that have a published certificate — the section promises "batch COA".
const FEATURED_SLUGS = [
  "glow-blend-premium-research-peptides", // Glow Blend
  "klow-blend-premium-research-compound-lab-grade", // Klow Blend
  "dsip-premium-research-peptide-lab-grade-peptide", // DSIP
  "vip-premium-research-peptide-lab-grade-peptide", // VIP
  "semax-premium-research-peptide-lab-grade-peptide", // Semax
  "tr-2", // GLP2-TZ
  "rt", // GLP3-RT
  "melanotan-1-premium-research-peptide-lab-grade-peptide", // Melanotan II
];
const FEATURED_COUNT = 4;

/** Live carousel order first, backfilled from the catalog if one drops out. */
function pickFeatured(catalog: Product[]): Product[] {
  const bySlug = new Map(catalog.map((p) => [p.slug, p]));
  const candidates = [
    ...FEATURED_SLUGS.map((slug) => bySlug.get(slug)),
    ...catalog,
  ].filter((p): p is Product => Boolean(p?.coaUrl) && Boolean(p?.isInStock));
  const seen = new Set<number>();
  const featured: Product[] = [];
  for (const p of candidates) {
    if (featured.length >= FEATURED_COUNT) break;
    if (seen.has(p.productId)) continue;
    seen.add(p.productId);
    featured.push(p);
  }
  return featured;
}

export default async function Home() {
  const catalog = await getCatalog();

  return (
    <main
      className={cn(
        sourceSerif.variable,
        "landing flex flex-col bg-mist font-manrope leading-[normal] text-navy-ink"
      )}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd()),
        }}
      />

      <Hero />
      <TrustStrip />
      <Marquee />
      <BestSellers products={pickFeatured(catalog)} />
      <CoaSection products={catalog} />
      <BulkOrder />
      <WhyUs />
      <HomeFaq />
      <CtaBand />
    </main>
  );
}
