/**
 * Product detail page — /product/[slug] for every catalog product (21 live).
 * D3 "Reference Grade" (DESIGN §8 + judge-panel grafts).
 *
 * Server Component throughout; the only client islands are the Gallery (thumb
 * selection), the BuyPanel (size/qty/add-to-cart + graft-#12 price crossfade),
 * the trophy TickRule, and the FAQ accordion primitives. Statically generated
 * via generateStaticParams from the mapped catalog; unknown slugs 404.
 *
 * The record, top to bottom (purity resolves ABOVE price, on purpose):
 *   breadcrumb → Satoshi compound name + identity line → TrustBlock (trophy
 *   numeral / honest pending / lab-supply record) → BuyPanel → RUO warn-line →
 *   falsifiable purity guarantee (verbatim Terms §8) → typeset COA facsimile
 *   with the real page-1 thumbnail — then applications, usage, FAQ, bulk note,
 *   and related compounds as duotoned mini specimen plates.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog, getProductBySlug } from "@/lib/woo/catalog";
import type { Product } from "@/lib/woo/types";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/jsonld";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { compliance } from "@/content/compliance";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/FadeIn";
import { Gallery } from "@/components/pdp/Gallery";
import { BuyPanel } from "@/components/pdp/BuyPanel";
import { TrustBlock } from "@/components/pdp/TrustBlock";
import { CoaFacsimile } from "@/components/pdp/CoaFacsimile";
import { GuaranteeNote } from "@/components/pdp/GuaranteeNote";
import { ProductFaq } from "@/components/pdp/ProductFaq";
import { RelatedProducts } from "@/components/pdp/RelatedProducts";
import { getCoaRecord, type PdpCoaRecord } from "@/components/pdp/coa-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.map((p) => ({ slug: p.slug }));
}

/** Meta description: first bullet, clamped to a search-snippet length. */
function metaDescription(product: Product): string {
  const raw =
    product.bullets[0] ??
    `${product.displayName} — ${product.categoryName}. ${compliance.ruoBanner}`;
  return raw.length > 160 ? `${raw.slice(0, 157).trimEnd()}…` : raw;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const description = metaDescription(product);
  const image = product.images[0]?.src;
  const url = `${SITE_URL}/product/${product.slug}`;

  return {
    title: product.displayName,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.displayName,
      description,
      type: "website",
      url,
      images: image
        ? [{ url: image, alt: product.displayName }]
        : [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: product.displayName,
      description,
      images: [image ?? OG_IMAGE.url],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Cached per request — dedupes with generateMetadata/generateStaticParams.
  const catalog = await getCatalog();

  // Full certificate record (label / endotoxin PDF / batch ref / page-1
  // thumb). Falls back to the mapper's own enrichment so the trust states can
  // never disagree with the catalog — the earned mark stays gated on a REAL
  // coaUrl either way.
  const coa: PdpCoaRecord | null =
    getCoaRecord(product.productId) ??
    (product.coaUrl && product.purity
      ? {
          label: product.displayName,
          purity: product.purity,
          coaUrl: product.coaUrl,
        }
      : null);

  const isLabSupply = product.categorySlug === "lab-supplies";

  const priceMajor = Number(
    (product.priceMinor / 10 ** product.currencyMinorUnit).toFixed(
      product.currencyMinorUnit
    )
  );

  const productLd = productJsonLd({
    name: product.displayName,
    description: metaDescription(product),
    sku: product.sku,
    image: product.images[0]?.src,
    price: priceMajor,
    availability: product.isInStock ? "InStock" : "OutOfStock",
    url: `${SITE_URL}/product/${product.slug}`,
  });

  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Catalog", href: "/catalog" },
    { name: product.categoryName, href: `/catalog/${product.categorySlug}` },
    { name: product.displayName, href: `/product/${product.slug}` },
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 md:px-6 md:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* ── Specimen plate (left) + the record (right) ──────────────────── */}
      <div className="grid gap-12 py-10 md:py-14 lg:grid-cols-[45fr_55fr] xl:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Gallery
            images={product.images.map((img) => ({
              src: img.src,
              alt: img.alt,
            }))}
            sku={product.sku}
            name={product.displayName}
          />
        </div>

        <div className="flex flex-col gap-7">
          {/* Breadcrumb — doubles as the category micro-label */}
          <nav aria-label="Breadcrumb">
            <ol className="micro-label flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/catalog"
                  className="transition-colors hover:text-ink"
                >
                  Catalog
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/catalog/${product.categorySlug}`}
                  className="transition-colors hover:text-ink"
                >
                  {product.categoryName}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">
                {product.displayName}
              </li>
            </ol>
          </nav>

          {/* Compound name (Satoshi, coded display name) + identity line */}
          <div className="flex flex-col gap-2.5">
            <h1 className="text-[clamp(2rem,3.2vw,2.75rem)] text-ink">
              {product.displayName}
            </h1>
            {product.sku && (
              <p className="batch-id text-ink-muted">
                <span className="sr-only">SKU: </span>
                {product.sku}
                <span className="batch-tick" aria-hidden="true">
                  ·
                </span>
                {product.categoryName}
              </p>
            )}
          </div>

          {/* Trust block — staged first and biggest; purity ABOVE price */}
          <TrustBlock coa={coa} isLabSupply={isLabSupply} />

          {/* Price / size / qty / add-to-cart island */}
          <BuyPanel
            product={{
              productId: product.productId,
              sku: product.sku,
              slug: product.slug,
              displayName: product.displayName,
              kind: product.kind,
              priceMinor: product.priceMinor,
              currencyMinorUnit: product.currencyMinorUnit,
              variations: product.variations,
              isInStock: product.isInStock,
              isPurchasable: product.isPurchasable,
              image: product.images[0]?.src,
            }}
          />

          {/* RUO strip — the ONE compliance line in the buy zone: ink text on
              the faint amber wash (amber lives in the wash, never the text). */}
          <p className="warn-line rounded-lg px-4 py-3 text-[12px] font-[560] tracking-[0.08em] text-ink uppercase">
            {compliance.ruoBanner}
          </p>

          {/* Falsifiable guarantee — verbatim Terms §8 clause (graft #6) */}
          <GuaranteeNote />

          {/* Typeset COA facsimile — cert-backed products only (graft #7) */}
          {coa && <CoaFacsimile coa={coa} compound={product.displayName} />}
        </div>
      </div>

      {/* ── Research applications — warm ruled records ──────────────────── */}
      {product.bullets.length > 0 && (
        <FadeIn>
          <section
            aria-labelledby="pdp-applications"
            className="hairline-t py-12 md:py-16"
          >
            <p className="micro-label mb-3">Laboratory focus</p>
            <h2
              id="pdp-applications"
              className="text-[clamp(1.9rem,3.4vw,3rem)] text-ink"
            >
              Research applications
            </h2>
            <ol className="mt-8 max-w-3xl list-none border-y border-hairline">
              {product.bullets.map((bullet, i) => (
                <li
                  key={i}
                  className="flex gap-5 py-3.5 not-last:border-b not-last:border-hairline"
                >
                  <span className="data-num pt-0.5 text-[12px] text-green">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] leading-relaxed text-ink-muted">
                    {bullet}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </FadeIn>
      )}

      {/* ── Usage (verbatim store documentation) — ruled record rows ────── */}
      {product.usage.length > 0 && (
        <FadeIn>
          <section
            aria-labelledby="pdp-usage"
            className="hairline-t py-12 md:py-16"
          >
            <p className="micro-label mb-3">Documentation</p>
            <h2
              id="pdp-usage"
              className="text-[clamp(1.9rem,3.4vw,3rem)] text-ink"
            >
              Usage
            </h2>
            <div className="mt-8 max-w-3xl divide-y divide-hairline border-y border-hairline">
              {product.usage.map((paragraph, i) => (
                <p
                  key={i}
                  className="py-3.5 text-[15px] leading-relaxed text-ink-muted"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* ── Product FAQ (verbatim) — record card ────────────────────────── */}
      <FadeIn>
        <ProductFaq faq={product.faq} />
      </FadeIn>

      {/* ── Bulk & wholesale note ───────────────────────────────────────── */}
      <FadeIn>
        <div className="hairline-t py-10">
          <div className="soft-card flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="micro-label">Bulk &amp; wholesale inquiries</p>
              <p className="mt-1.5 text-sm text-ink-muted">
                Volume and repeat orders for laboratories are quoted directly.
              </p>
            </div>
            <Button asChild variant="outline" className="h-9 shrink-0 px-4">
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* ── Related compounds — duotoned mini specimen plates ───────────── */}
      <FadeIn>
        <RelatedProducts catalog={catalog} current={product} />
      </FadeIn>
    </main>
  );
}
