/**
 * JSON-LD structured-data helpers.
 *
 * Usage on a PDP (Server Component):
 *
 *   import { productJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
 *
 *   export default function ProductPage() {
 *     const ld = productJsonLd({ name: '...', sku: '...', ... });
 *     const bc = breadcrumbJsonLd([
 *       { name: 'Shop', href: '/shop' },
 *       { name: 'GLP1-SM', href: '/shop/glp1-sm' },
 *     ]);
 *     return (
 *       <>
 *         <script
 *           type="application/ld+json"
 *           dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
 *         />
 *         <script
 *           type="application/ld+json"
 *           dangerouslySetInnerHTML={{ __html: JSON.stringify(bc) }}
 *         />
 *         ...
 *       </>
 *     );
 *   }
 *
 * NAMING DISCIPLINE: `name` must be the mapper's DISPLAY name (coded GLP
 * names included) — structured data is public output, same rules as UI copy.
 */
import { SITE_URL } from '@/lib/seo';
import { brandConfig } from '@/content/brand-config';

// ── Input types ───────────────────────────────────────────────────────────────

export interface JsonLdProduct {
  /** DISPLAY name from the catalog mapper, e.g. "GLP1-SM 5mg" */
  name: string;
  /** Short description / meta description text */
  description: string;
  /** Product SKU / catalog code */
  sku: string;
  /** Absolute URL to the primary product image */
  image?: string;
  /** Numeric price in the given currency (major units, e.g. 89.99) */
  price: number;
  /** ISO 4217 currency code; defaults to "USD" */
  currency?: string;
  /** Schema.org availability value; defaults to InStock */
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued';
  /** Canonical PDP URL; defaults to ${SITE_URL}/shop/${sku.toLowerCase()} */
  url?: string;
}

export interface BreadcrumbItem {
  /** Human-readable label for this crumb */
  name: string;
  /** Root-relative path, e.g. "/shop/glp1-sm" */
  href: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Schema.org Organization — embed once on the homepage or in the root layout. */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brandConfig.name,
    url: SITE_URL,
    description: brandConfig.tagline,
  };
}

/**
 * Schema.org Product + Offer — embed on every PDP.
 * Passes Google Rich Results validation out of the box.
 */
export function productJsonLd(product: JsonLdProduct): Record<string, unknown> {
  const pdpUrl =
    product.url ??
    `${SITE_URL}/shop/${product.sku.toLowerCase().replace(/\s+/g, '-')}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    ...(product.image ? { image: [product.image] } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: product.currency ?? 'USD',
      price: product.price,
      availability: `https://schema.org/${product.availability ?? 'InStock'}`,
      url: pdpUrl,
      seller: {
        '@type': 'Organization',
        name: brandConfig.name,
      },
    },
  };
}

/**
 * Schema.org BreadcrumbList — embed alongside productJsonLd on PDPs.
 * Items are ordered; pass them root-first.
 */
export function breadcrumbJsonLd(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}
