/**
 * /catalog — the full product index (D3 "Reference Grade").
 *
 * Server Component: fetches the mapped catalog once (React-cached) and hands
 * plain data to the client FilterGrid (category chips + search + sort).
 * Header carries the live /catalog/ page copy: "Home / Catalog" breadcrumb +
 * the "Catalog" title, on grained paper.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/woo/catalog";
import { brandConfig } from "@/content/brand-config";
import { catalogPage, footerCopy } from "@/content/site-copy";
import { OG_IMAGE } from "@/lib/seo";
import { FadeIn, FadeInStagger } from "@/components/motion/FadeIn";
import { FilterGrid } from "@/components/catalog/FilterGrid";

// The live /catalog/ meta description is the footer tagline, verbatim.
const DESCRIPTION = footerCopy.tagline;

export const metadata: Metadata = {
  title: catalogPage.title,
  description: DESCRIPTION,
  openGraph: {
    title: `${catalogPage.title} - ${brandConfig.name}`,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default async function CatalogPage() {
  const products = await getCatalog();

  return (
    <main>
      {/* ── Title movement ─────────────────────────────────────────────── */}
      <section className="paper-grain">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 md:px-6 md:pt-24 md:pb-16">
          <FadeInStagger>
            <FadeIn>
              <nav aria-label="Breadcrumb">
                <ol className="micro-label flex items-center gap-2">
                  <li>
                    <Link href="/" className="transition-colors hover:text-ink">
                      {catalogPage.breadcrumbHome}
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page">{catalogPage.title}</li>
                </ol>
              </nav>
            </FadeIn>
            <FadeIn>
              <h1 className="display-hero mt-5 max-w-3xl text-[clamp(2.75rem,6.5vw,4.75rem)] text-ink">
                {catalogPage.title}
              </h1>
            </FadeIn>
          </FadeInStagger>
        </div>
      </section>

      {/* ── Sticky filter bar + specimen-plate grid (client) ───────────── */}
      <FilterGrid products={products} showCategoryFilter />
    </main>
  );
}
