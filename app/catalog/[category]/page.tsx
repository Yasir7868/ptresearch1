/**
 * /catalog/[category] — one taxonomy section of the compound index
 * (D3 "Reference Grade").
 *
 * - generateStaticParams from the 8 CATEGORIES (content/taxonomy.ts);
 *   anything else (including the all-compounds drift bucket) → notFound().
 * - Header: a green CHAPTER BAND opened with the signature InkWipe (the green
 *   floods up from the bottom hairline; reduced-motion → cross-fade).
 *   Breadcrumb in mint micro-labels, the chapter number as an amber Satoshi
 *   display numeral (amber is display-scale-on-green ONLY — never text on
 *   paper), category name in Satoshi, verbatim taxonomy blurb, then a
 *   tabular data line with the real compound + verified counts.
 * - Grid: same FilterGrid (search + sort; no category chips) over products
 *   whose PRIMARY or SECONDARY category matches.
 * - JSON-LD BreadcrumbList + a dot-leader sibling index (graft #5 treatment:
 *   name … count) cross-linking the other chapters, on paper.
 *
 * Next 16: `params` is a Promise — always awaited.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES } from "@/content/taxonomy";
import { getCatalog } from "@/lib/woo/catalog";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { OG_IMAGE } from "@/lib/seo";
import { brandConfig } from "@/content/brand-config";
import type { Product } from "@/lib/woo/types";
import { FadeIn } from "@/components/motion/FadeIn";
import { InkWipe } from "@/components/motion/InkWipe";
import { FilterGrid } from "@/components/catalog/FilterGrid";

interface Params {
  category: string;
}

export function generateStaticParams(): Params[] {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) return { title: "Category not found" };

  return {
    title: cat.name,
    description: cat.blurb,
    openGraph: {
      title: `${cat.name} | ${brandConfig.name}`,
      description: cat.blurb,
      images: [OG_IMAGE],
    },
  };
}

/** Same membership rule as FilterGrid: primary OR secondary category. */
function inCategory(p: Product, categorySlug: string): boolean {
  return (
    p.categorySlug === categorySlug ||
    p.secondaryCategories.includes(categorySlug)
  );
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category } = await params;
  const index = CATEGORIES.findIndex((c) => c.slug === category);
  if (index === -1) notFound();
  const cat = CATEGORIES[index];
  const num = String(index + 1).padStart(2, "0");

  const all = await getCatalog();
  const products = all.filter((p) => inCategory(p, cat.slug));
  const verifiedCount = products.filter((p) => p.coaUrl).length;

  const breadcrumb = breadcrumbJsonLd([
    { name: "Catalog", href: "/catalog" },
    { name: cat.name, href: `/catalog/${cat.slug}` },
  ]);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* ── Chapter band — green ink-wipe header ────────────────────────── */}
      <InkWipe>
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link
                  href="/catalog"
                  className="micro-label-dark transition-colors hover:text-mint"
                >
                  Catalog
                </Link>
              </li>
              <li aria-hidden="true" className="text-[11px] text-mint/50">
                /
              </li>
              <li aria-current="page">
                <span className="micro-label-dark !text-[var(--mint-bright)]">
                  {cat.name}
                </span>
              </li>
            </ol>
          </nav>

          <div className="mt-8 flex flex-wrap items-baseline gap-x-5 gap-y-2 md:gap-x-7">
            {/* Chapter numeral — amber Satoshi at display scale (on green
                only; 3.5:1 is display/graphic-permitted, never body text). */}
            <span
              aria-hidden="true"
              className="amber-display display-hero text-[clamp(2.5rem,6vw,4.25rem)]"
            >
              {num}
            </span>
            <h1 className="display-hero text-[clamp(2.5rem,6vw,4.25rem)]">
              {cat.name}
            </h1>
          </div>

          <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-mint">
            {cat.blurb}
          </p>

          <p className="data-num mt-7 text-[13px] text-mint/80">
            {products.length}{" "}
            {products.length === 1 ? "compound" : "compounds"}
            {verifiedCount > 0 && (
              <>
                <span aria-hidden="true" className="px-2 text-mint/40">
                  ·
                </span>
                {verifiedCount} third-party verified
              </>
            )}
          </p>
        </div>
      </InkWipe>

      {/* ── Sticky search/sort bar + specimen-plate grid (client) ───────── */}
      <FilterGrid products={products} />

      {/* ── Sibling chapters — dot-leader index (name … count) ──────────── */}
      <section className="hairline-t paper-grain">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <FadeIn>
            <p className="micro-label">Browse Categories</p>
            <ol className="mt-8 grid grid-cols-1 gap-x-16 gap-y-4 sm:grid-cols-2">
              {CATEGORIES.map((c, i) => {
                const n = String(i + 1).padStart(2, "0");
                const count = all.filter((p) => inCategory(p, c.slug)).length;
                const current = c.slug === cat.slug;
                return (
                  <li key={c.slug}>
                    {current ? (
                      <span
                        aria-current="page"
                        className="flex items-baseline gap-3"
                      >
                        <span className="data-num text-[11px] text-ink-muted">
                          {n}
                        </span>
                        <span className="text-[15px] font-medium text-ink-muted">
                          {c.name}
                        </span>
                        <span
                          aria-hidden="true"
                          className="mb-[4px] flex-1 border-b border-dotted border-hairline"
                        />
                        <span className="data-num text-[13px] text-ink-muted">
                          {count}
                        </span>
                      </span>
                    ) : (
                      <Link
                        href={`/catalog/${c.slug}`}
                        className="group flex items-baseline gap-3"
                      >
                        <span className="data-num text-[11px] text-green">
                          {n}
                        </span>
                        <span className="text-[15px] font-medium text-ink transition-colors group-hover:text-green">
                          {c.name}
                        </span>
                        <span
                          aria-hidden="true"
                          className="mb-[4px] flex-1 border-b border-dotted border-hairline transition-colors group-hover:border-green/40"
                        />
                        <span className="data-num text-[13px] text-ink-muted">
                          {count}
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
