/**
 * Site-level SEO constants and default metadata.
 *
 * Integration (layout.tsx):
 *   import { defaultMetadata } from '@/lib/seo';
 *   export const metadata: Metadata = defaultMetadata;
 *
 * `metadataBase` makes relative OG image URLs resolve correctly.
 * `title.template` produces "Page | Primetime Research" on child routes.
 *
 * INDEXABILITY GATE: robots defaults to noindex,nofollow unless the env var
 * NEXT_PUBLIC_INDEXABLE === "true". Preview/staging URLs (Railway *.up.railway.app)
 * must NEVER index — only set the flag on the production deployment once the
 * real domain is live.
 */
import type { Metadata } from 'next';
import { brandConfig } from '@/content/brand-config';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? `https://${brandConfig.domain}`;

/** True only when the deployment is explicitly flagged as indexable. */
export const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === 'true';

/**
 * Sitewide social-share image (1200×630). Every route that declares its own
 * openGraph/twitter block must re-reference this (or a per-page image):
 * Metadata fields replace, they don't merge.
 * The asset is a 1200×630 crop of the client's branded hero photograph
 * (public/og/default-og.jpg, derived from the same source as /images/hero.webp).
 */
export const OG_IMAGE = {
  url: '/og/default-og.jpg',
  width: 1200,
  height: 630,
  alt: `${brandConfig.name} — ${brandConfig.tagline}`,
} as const;

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: brandConfig.name,
    template: `%s | ${brandConfig.name}`,
  },
  description: brandConfig.hero.subhead,

  openGraph: {
    siteName: brandConfig.name,
    title: brandConfig.name,
    description: brandConfig.hero.subhead,
    type: 'website',
    url: SITE_URL,
    images: [OG_IMAGE],
  },

  twitter: {
    card: 'summary_large_image',
    title: brandConfig.name,
    description: brandConfig.hero.subhead,
    images: [OG_IMAGE.url],
  },

  robots: INDEXABLE
    ? {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
      }
    : {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
};
