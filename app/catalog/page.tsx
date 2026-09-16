/**
 * /catalog — the full compound index (D3 "Reference Grade").
 *
 * Server Component: fetches the mapped catalog once (React-cached) and hands
 * plain data to the client FilterGrid (category chips + search + sort).
 * Header is a Satoshi display-title movement on grained paper — micro-label kicker,
 * poster-scale display heading, then a tabular data line whose figures are
 * real: total compound count + the count of third-party-verified products
 * (a product counts as verified ONLY when a real COA PDF exists — the same
 * gate as the earned VerifiedMark).
 */

import type { Metadata } from "next";
import { getCatalog } from "@/lib/woo/catalog";
import { brandConfig } from "@/content/brand-config";
import { OG_IMAGE } from "@/lib/seo";
import { FadeIn, FadeInStagger } from "@/components/motion/FadeIn";
import { FilterGrid } from "@/components/catalog/FilterGrid";

const TITLE = "Catalog";
const DESCRIPTION = `The complete ${brandConfig.name} catalog — research peptides, blends, and lab supplies with published certificates of analysis and HPLC purity data.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: `${TITLE} | ${brandConfig.name}`,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default async function CatalogPage() {
  const products = await getCatalog();
  const verifiedCount = products.filter((p) => p.coaUrl).length;

  return (
    <main>
      {/* ── Title movement ─────────────────────────────────────────────── */}
      <section className="paper-grain">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 md:px-6 md:pt-24 md:pb-16">
          <FadeInStagger>
            <FadeIn>
              <p className="micro-label">Catalog</p>
            </FadeIn>
            <FadeIn>
              <h1 className="display-hero mt-5 max-w-3xl text-[clamp(2.75rem,6.5vw,4.75rem)] text-ink">
                Research Compounds
              </h1>
            </FadeIn>
            <FadeIn>
              <p className="data-num mt-6 text-[13px] text-ink-muted">
                <span className="text-green">{products.length}</span>
                {" compounds"}
                <span aria-hidden="true" className="px-2 text-ink-muted/50">
                  ·
                </span>
                <span className="text-green">{verifiedCount}</span>
                {" third-party verified"}
              </p>
            </FadeIn>
          </FadeInStagger>
        </div>
      </section>

      {/* ── Sticky filter bar + specimen-plate grid (client) ───────────── */}
      <FilterGrid products={products} showCategoryFilter />
    </main>
  );
}
