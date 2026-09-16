/**
 * Shared per-page metadata builder for the supporting/static routes.
 *
 * The root layout (app/layout.tsx) sets the title.template
 * ("%s | Primetime Research"), the robots INDEXABILITY gate
 * (NEXT_PUBLIC_INDEXABLE), and the default OG/Twitter image. Child routes only
 * supply their own title/description here — `robots` is intentionally NOT set
 * so the layout's noindex-by-default gate is inherited on every page.
 *
 * Metadata fields REPLACE (they don't deep-merge), so any route declaring its
 * own openGraph/twitter block must re-reference OG_IMAGE — this helper does.
 */
import type { Metadata } from "next";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { brandConfig } from "@/content/brand-config";

export interface PageMetaInput {
  /** Page title WITHOUT the brand suffix (the layout template appends it). */
  title: string;
  description: string;
  /** Root-relative path, e.g. "/coa". Used for canonical + OG url. */
  path: string;
}

export function pageMetadata({ title, description, path }: PageMetaInput): Metadata {
  const ogTitle = `${title} | ${brandConfig.name}`;
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: brandConfig.name,
      title: ogTitle,
      description,
      url,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [OG_IMAGE.url],
    },
    // robots: inherited from the root layout's NEXT_PUBLIC_INDEXABLE gate.
  };
}
