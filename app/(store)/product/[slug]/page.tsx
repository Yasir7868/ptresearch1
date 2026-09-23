/**
 * Product detail page — /product/[slug] for every catalog product. A copy of
 * the live ptresearch.shop single-product template (owner request,
 * 2026-09-19; DESIGN.md §0): its layout, colors, faces and behavior, filled
 * from the catalog.
 *
 * Top to bottom:
 *   grey band with the live page's soft blue glow, two columns (stacked on
 *   phones):
 *     left  — image slider with thumbnails + "Sale!" badge (Gallery), then
 *             the "Questions about …? Email us:" card
 *     right — card 1: stock pill, name, "Category:", then BuyPanel (dosage
 *             pills, price box, quantity + Add to cart, and the sticky
 *             add-to-cart bar); card 2: Description, Usage, FAQ and the
 *             disclaimer (ProductDetails)
 *   navy "Need Help?" band, then the Related Products carousel.
 *
 * Deliberate differences from live: names are the mapper's display names
 * (GLP coding, PRODUCT.md), "Category:" shows this site's category and links
 * to it (live prints WooCommerce's placeholder category "simple"), and there
 * is no side-cart bubble (the header cart opens the drawer).
 *
 * Server Component; the client islands are Gallery, BuyPanel and the related
 * carousel. Statically generated via generateStaticParams; unknown slugs 404.
 * Roboto + Poppins load here only (like the homepage's serif).
 */

import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog, getProductBySlug } from "@/lib/woo/catalog";
import type { Product } from "@/lib/woo/types";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/jsonld";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { compliance } from "@/content/compliance";
import { catalogPage, contactInfo, productPage } from "@/content/site-copy";
import { Gallery } from "@/components/pdp/Gallery";
import { BuyPanel } from "@/components/pdp/BuyPanel";
import { ProductDetails } from "@/components/pdp/ProductDetails";
import { NeedHelpBand } from "@/components/pdp/NeedHelpBand";
import { RelatedProducts } from "@/components/pdp/RelatedProducts";
import { LIVE_FONT_STACK, PANEL, PANEL_RAISED } from "@/components/pdp/live-style";

const roboto = localFont({
  src: "../../../fonts/Roboto-Variable-latin.woff2",
  weight: "400 800",
  style: "normal",
  variable: "--font-roboto-face",
  display: "swap",
  preload: true,
  fallback: ["Arial", "sans-serif"],
});

const poppins = localFont({
  src: "../../../fonts/Poppins-SemiBold-latin.woff2",
  weight: "600",
  style: "normal",
  variable: "--font-poppins-face",
  display: "swap",
  preload: false,
  fallback: ["Arial", "sans-serif"],
});

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.map((p) => ({ slug: p.slug }));
}

/** Meta description: the first description paragraph, clamped to a search-snippet length. */
function metaDescription(product: Product): string {
  const raw = product.bullets[0] ?? compliance.productRuoLine;
  return raw.length > 160 ? `${raw.slice(0, 157).trimEnd()}…` : raw;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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
      images: image ? [{ url: image, alt: product.displayName }] : [OG_IMAGE],
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

  const priceMajor = Number(
    (product.priceMinor / 10 ** product.currencyMinorUnit).toFixed(product.currencyMinorUnit)
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
    { name: catalogPage.title, href: "/catalog" },
    { name: product.categoryName, href: `/catalog/${product.categorySlug}` },
    { name: product.displayName, href: `/product/${product.slug}` },
  ]);

  return (
    <main
      className={cn("landing bg-white text-[#333] leading-normal", roboto.variable, poppins.variable)}
      style={{ fontFamily: LIVE_FONT_STACK }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="relative bg-[#f8f8f9]">
        {/* The live page's top glow: two faint blue radials in a 300px band. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(circle_at_15%_20%,rgba(1,126,255,0.08),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(16,176,255,0.08),transparent_42%)]"
        />

        <div className="relative mx-auto grid max-w-[1140px] gap-5 px-3 pt-5 pb-20 md:grid-cols-[42fr_58fr] md:items-start">
          {/* Left: images + contact card */}
          <div className="flex min-w-0 flex-col gap-5">
            <div className={cn(PANEL, "p-3.5")}>
              <Gallery
                images={product.images.map((img) => ({
                  src: img.src,
                  alt: img.alt,
                  thumbnail: img.thumbnail,
                }))}
                name={product.displayName}
                onSale={product.onSale}
              />
            </div>

            <div className="rounded-[14px] border border-[#d6d7e3] bg-[#f8f8f9] px-4 py-3.5 text-[13px]">
              <p className="mb-1 leading-[1.4] font-semibold text-[#14214d]">
                {productPage.questionsPrefix} {product.displayName}?
              </p>
              <p className="text-[#606884]">
                {contactInfo.emailUsLabel}{" "}
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="font-bold text-[#14214d] hover:underline"
                >
                  {contactInfo.email}
                </a>
              </p>
            </div>
          </div>

          {/* Right: the buy card, then the details card */}
          <div className="flex min-w-0 flex-col gap-5">
            <div className={cn(PANEL_RAISED, "flex flex-col gap-[15px] p-2.5")}>
              <div>
                <span className="inline-flex items-center gap-[7px] rounded-full bg-[#ececf4] px-2.5 py-[5px] text-xs leading-normal font-medium text-[#292e4c]">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      product.isInStock ? "bg-[#22c55e]" : "bg-[#ef4444]"
                    )}
                  />
                  {product.isInStock ? productPage.inStock : productPage.outOfStock}
                </span>
              </div>

              <h1 className="font-roboto text-[32px] leading-none font-medium text-[#14214d]">
                {product.displayName}
              </h1>

              <p className="text-[13px] leading-[1.3] text-[#606884]">
                {productPage.categoryLabel}{" "}
                <Link href={`/catalog/${product.categorySlug}`} className="hover:underline">
                  {product.categoryName}
                </Link>
              </p>

              <BuyPanel
                product={{
                  productId: product.productId,
                  sku: product.sku,
                  slug: product.slug,
                  displayName: product.displayName,
                  kind: product.kind,
                  priceMinor: product.priceMinor,
                  regularPriceMinor: product.regularPriceMinor,
                  currencyMinorUnit: product.currencyMinorUnit,
                  size: product.size,
                  variations: product.variations,
                  isInStock: product.isInStock,
                  isPurchasable: product.isPurchasable,
                  image: product.images[0]?.src,
                }}
              />
            </div>

            <ProductDetails summary={product.summary} usage={product.usage} faq={product.faq} />
          </div>
        </div>
      </div>

      <NeedHelpBand />
      <RelatedProducts catalog={catalog} current={product} />
    </main>
  );
}
