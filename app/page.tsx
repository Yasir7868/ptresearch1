/**
 * Home — the D3 "Reference Grade" homepage for Primetime Research
 * (DESIGN.md §7 blueprint order + judge-panel grafts).
 *
 * Server component: every data-driven figure (the measured purity range, the
 * category counts, the featured plates, the verified-batch rows) is derived
 * here from the LIVE catalog + COA map, then handed to section components.
 * Motion lives in client leaf components (InkWipe / FadeIn / TickRule).
 *
 * Section order (§7): Hero → Promo band (green) → Trust bento → Categories
 * band (green, dot-leader TOC) → Featured plates → Verified Batches rail →
 * Stats row (de-emphasized) → Testing/About band (green) → FAQ teaser →
 * Newsletter (green) → footer (chrome).
 */

import type { Metadata } from "next";
import type { Product } from "@/lib/woo/types";
import { getCatalog } from "@/lib/woo/catalog";
import { CATEGORIES } from "@/content/taxonomy";
import { brandConfig } from "@/content/brand-config";
import { organizationJsonLd } from "@/lib/jsonld";
import coaThumbs from "@/content/coa-thumbs.json";
import { Hero } from "@/components/home/Hero";
import { PromoBand } from "@/components/home/PromoBand";
import { TrustBento } from "@/components/home/TrustBento";
import { CategoryIndex, type CategoryRow } from "@/components/home/CategoryIndex";
import { FeaturedCompounds } from "@/components/home/FeaturedCompounds";
import { VerifiedBatches, type BatchRow } from "@/components/home/VerifiedBatches";
import { StatsRow } from "@/components/home/StatsRow";
import { TestingStory } from "@/components/home/TestingStory";
import { FaqTeaser } from "@/components/home/FaqTeaser";
import { Newsletter } from "@/components/home/Newsletter";

export const metadata: Metadata = {
  title: { absolute: "Primetime Research — Premium-Grade Research Peptides" },
  description: brandConfig.hero.subhead,
};

// Product slugs (verified against content/taxonomy.ts). Slug-keyed in
// content/coa-map.json, so catalog COA enrichment is reliable for these.
const BPC157 = "bpc-157-premium-research-peptide-lab-grade-peptide";
const GLP1 = "sema-glp-1-analog-research-grade-premium-research-peptide";
const GHKCU = "ghk-cu-premium-research-peptide";
const IPAMORELIN = "ipamorelin-premium-research-peptide-lab-grade";
const SEMAX = "semax-premium-research-peptide-lab-grade-peptide";
const NAD = "nad-premium-research-compound-lab-grade";

// Featured plate grid — 6 compounds (3-up × 2 rows), spread across categories,
// all with published purity values.
const FEATURED_SLUGS = [BPC157, GLP1, GHKCU, IPAMORELIN, SEMAX, NAD];
const FEATURED_COUNT = 6;

/** coa-thumbs manifest — keyed by coa-map key (the product slug for every
 *  rendered thumb; the 3 GLP certificates have no thumb — see PRODUCT.md). */
const thumbs: Record<string, string> = coaThumbs;

export default async function Home() {
  const catalog = await getCatalog();
  const bySlug = new Map(catalog.map((p) => [p.slug, p]));

  // ── Honest measured purity range for the hero caption (real COA values;
  //    spec-quoted fallbacks only if the live fetch yields nothing). ──
  const withPurity = catalog
    .filter((p): p is Product & { purity: string } => Boolean(p.purity))
    .map((p) => ({ purity: p.purity, value: Number.parseFloat(p.purity) }))
    .filter((p) => Number.isFinite(p.value))
    .sort((a, b) => a.value - b.value);
  const purityFloor = withPurity[0]?.purity ?? "99.19%";
  const purityCeil = withPurity[withPurity.length - 1]?.purity ?? "99.56%";

  // ── Category index counts — SAME membership rule as /catalog/[category]
  // (primary OR secondary), so the home index always matches the listings. ──
  const categoryRows: CategoryRow[] = CATEGORIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    blurb: c.blurb,
    count: catalog.filter(
      (p) =>
        p.categorySlug === c.slug || p.secondaryCategories.includes(c.slug)
    ).length,
  }));

  // ── Featured plates (preferred order, backfilled to 6) ──
  const seen = new Set<number>();
  const featured: Product[] = [];
  const take = (p: Product | undefined) => {
    if (p && !seen.has(p.productId) && featured.length < FEATURED_COUNT) {
      featured.push(p);
      seen.add(p.productId);
    }
  };
  for (const slug of FEATURED_SLUGS) take(bySlug.get(slug));
  for (const p of catalog) {
    if (featured.length >= FEATURED_COUNT) break;
    if (p.purity) take(p);
  }
  for (const p of catalog) {
    if (featured.length >= FEATURED_COUNT) break;
    take(p);
  }

  // ── Verified batches — every product with a REAL published COA, best
  //    measured purity first. Batch ids come from the live PDF filenames. ──
  const batches: BatchRow[] = catalog
    .filter(
      (p): p is Product & { purity: string; coaUrl: string } =>
        Boolean(p.coaUrl && p.purity)
    )
    .map((p) => ({
      slug: p.slug,
      name: p.displayName,
      purity: p.purity,
      coaUrl: p.coaUrl,
      thumb: thumbs[p.slug],
      batchId: p.coaUrl.match(/PTR-\d+/)?.[0],
      category: p.categoryName,
    }))
    .sort(
      (a, b) => Number.parseFloat(b.purity) - Number.parseFloat(a.purity)
    );

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd()),
        }}
      />

      <Hero purityFloor={purityFloor} purityCeil={purityCeil} />

      <PromoBand />

      <TrustBento />

      <CategoryIndex categories={categoryRows} />

      <FeaturedCompounds products={featured} />

      <VerifiedBatches batches={batches} />

      <StatsRow />

      <TestingStory />

      <FaqTeaser />

      <Newsletter />
    </main>
  );
}
