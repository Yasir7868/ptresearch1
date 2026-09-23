/**
 * Gift card page — /gift-card, the live store's /digtal-gift-card/ (product
 * /product/pt-research-digital-gift-card/). Both live URLs redirect here
 * (next.config.ts).
 *
 * Thin by design: the live page is one self-contained custom UI, so this
 * route supplies only the metadata, the structured data and the page ground,
 * and GiftCardProduct draws everything visible — the sticky artwork stage, the
 * slider form, the assurances, the claim card and the fixed bottom bar.
 *
 * Nothing is fetched. The gift card never reaches the Store API usably
 * (content/gift-card.ts explains why), and live hides the related-products row
 * this page would otherwise have borrowed from the catalog, so there is no
 * upstream call left to make — the route is fully static.
 *
 * Roboto + Poppins load here only, as on the PDP.
 */

import type { Metadata } from "next";
import localFont from "next/font/local";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/jsonld";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { giftCardCopy } from "@/content/site-copy";
import { giftCard } from "@/content/gift-card";
import { GiftCardProduct } from "@/components/giftcard/GiftCardProduct";

const roboto = localFont({
  src: "../../fonts/Roboto-Variable-latin.woff2",
  weight: "400 800",
  style: "normal",
  variable: "--font-roboto-face",
  display: "swap",
  preload: true,
  fallback: ["Arial", "sans-serif"],
});

const poppins = localFont({
  src: "../../fonts/Poppins-SemiBold-latin.woff2",
  weight: "600",
  style: "normal",
  variable: "--font-poppins-face",
  display: "swap",
  preload: false,
  fallback: ["Arial", "sans-serif"],
});

const PAGE_URL = `${SITE_URL}/gift-card`;

export const metadata: Metadata = {
  title: giftCardCopy.metaTitle,
  description: giftCardCopy.description,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: giftCardCopy.metaTitle,
    description: giftCardCopy.description,
    type: "website",
    url: PAGE_URL,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: giftCardCopy.metaTitle,
    description: giftCardCopy.description,
    images: [OG_IMAGE.url],
  },
};

export default function GiftCardPage() {
  const entryTier = giftCard.tiers[0]!;

  // The stage draws its cards as inline SVG, which a crawler cannot fetch, so
  // the structured data points at the store's own PNG of the entry tier.
  const productLd = productJsonLd({
    name: giftCard.name,
    description: giftCardCopy.description,
    sku: giftCard.sku,
    image: `${SITE_URL}${entryTier.image}`,
    price: entryTier.amountMinor / 100,
    availability: "InStock",
    url: PAGE_URL,
  });

  const breadcrumbLd = breadcrumbJsonLd([
    { name: giftCardCopy.metaTitle, href: "/gift-card" },
  ]);

  return (
    <main className={cn("bg-bg", roboto.variable, poppins.variable)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <GiftCardProduct />
    </main>
  );
}
