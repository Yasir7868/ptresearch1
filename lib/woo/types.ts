/**
 * lib/woo/types.ts — typed shapes for the WooCommerce Store API and our
 * internal Product model.
 *
 * Two layers:
 *   1. `StoreApi*` — the raw JSON returned by
 *      https://ptresearch.shop/wp-json/wc/store/v1/products (and /products/<id>).
 *      Only the fields we actually read are typed; the API returns more.
 *   2. `Product` / `ProductVariation` / `ProductImage` / `FaqItem` — the clean
 *      internal model the site renders from. The mapper (lib/woo/mapper.ts) is
 *      the only bridge between the two.
 *
 * Money: every price is an INTEGER in MINOR UNITS (cents for USD). Never a
 * float, never a formatted string. `currencyMinorUnit` (2 for USD) tells the
 * UI how many decimals to render — same convention as lib/cart.tsx.
 */

// ---------------------------------------------------------------------------
// Store API — raw response shapes (partial; only fields we consume)
// ---------------------------------------------------------------------------

/** WC Store API price block. All amounts are minor-unit strings ("4400"). */
export interface StoreApiPrices {
  price: string;
  regular_price: string;
  sale_price: string;
  price_range: { min_amount: string; max_amount: string } | null;
  currency_code: string;
  currency_minor_unit: number;
  currency_symbol: string;
}

/** WC Store API image object. `alt` is frequently an empty string. */
export interface StoreApiImage {
  id: number;
  src: string;
  thumbnail?: string;
  srcset?: string;
  name?: string;
  alt?: string;
}

/** A single attribute value on a variation reference, e.g. { name:"Size", value:"10mg" }. */
export interface StoreApiAttributeValue {
  name: string;
  value: string;
}

/**
 * A variation reference as it appears inside a PARENT variable product's
 * `variations[]` array: the variation id plus its selected attribute values.
 * (Full price/stock for the variation come from GET /products/<variationId>.)
 */
export interface StoreApiVariationRef {
  id: number;
  attributes: StoreApiAttributeValue[];
}

/** A term within a product attribute (e.g. the "10mg" size term). */
export interface StoreApiAttributeTerm {
  id: number;
  name: string;
  slug: string;
}

/** A product-level attribute definition (e.g. the "Size" attribute). */
export interface StoreApiAttribute {
  id: number;
  name: string;
  has_variations: boolean;
  terms: StoreApiAttributeTerm[];
}

/** A WC Store API category reference on a product. */
export interface StoreApiCategoryRef {
  id: number;
  name: string;
  slug: string;
}

/**
 * A WC Store API product OR variation. `type` discriminates:
 *   - "simple"    — standalone purchasable product
 *   - "variable"  — parent with a non-empty `variations[]` list
 *   - "variation" — a single child (returned by GET /products/<variationId>)
 */
export interface StoreApiProduct {
  id: number;
  type: "simple" | "variable" | "variation" | string;
  name: string;
  slug: string;
  sku: string;
  parent: number;
  permalink?: string;
  short_description: string;
  description: string;
  prices: StoreApiPrices;
  images: StoreApiImage[];
  categories: StoreApiCategoryRef[];
  attributes: StoreApiAttribute[];
  /** Present on variable parents; each entry is a variation reference. */
  variations: StoreApiVariationRef[];
  is_in_stock: boolean;
  is_purchasable: boolean;
  /** On a variation record, the selected attributes as a display string. */
  variation?: string;
}

// ---------------------------------------------------------------------------
// Internal model — what the site renders from
// ---------------------------------------------------------------------------

/** One purchasable size of a variable product. Price in minor units. */
export interface ProductVariation {
  variationId: number;
  /** The size label, e.g. "10mg" (from the parent's Size attribute). */
  size: string;
  /** Unit price in minor units (cents). */
  priceMinor: number;
}

/** A product image, normalized. `alt` falls back to the display name. */
export interface ProductImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

/** A single FAQ entry parsed from the product description. */
export interface FaqItem {
  q: string;
  a: string;
}

/** COA / purity enrichment, keyed externally in content/coa-map.json. */
export interface CoaEntry {
  purity?: string;
  coaUrl?: string;
  /**
   * Woo numeric product id carried on every real record — the most reliable
   * join key when the record's map key is neither the sku nor the slug.
   */
  productId?: number;
}

/**
 * The clean internal product model. Every field the design layer needs, with
 * the GLP display-name coding rule already applied to `displayName`.
 */
export interface Product {
  productId: number;
  sku: string;
  slug: string;
  /** Display name AFTER suffix-stripping + GLP override coding. */
  displayName: string;
  /** Primary category slug (from content/taxonomy.ts). */
  categorySlug: string;
  /** Primary category display name. */
  categoryName: string;
  /** Additional category slugs this product also appears under. */
  secondaryCategories: string[];
  kind: "simple" | "variable";
  /** For variable products, the minimum (starting) price in minor units. */
  priceMinor: number;
  currencyMinorUnit: number;
  /** Present + non-empty only for variable products. */
  variations?: ProductVariation[];
  bullets: string[];
  usage: string[];
  faq: FaqItem[];
  images: ProductImage[];
  isInStock: boolean;
  isPurchasable: boolean;
  purity?: string;
  coaUrl?: string;
}

/**
 * A map of COA/purity enrichment. Tolerant of the key the writer chooses:
 * lookups are attempted by sku, then slug, then stringified product id.
 */
export type CoaMap = Record<string, CoaEntry>;
