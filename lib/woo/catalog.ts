/**
 * lib/woo/catalog.ts — SERVER-ONLY. The one place the site asks for products.
 *
 * getCatalog()        -> every product, mapped, categorized, variation-priced,
 *                        sorted (category order, then name).
 * getProductBySlug()  -> a single product via the same mapping path.
 *
 * Both are wrapped in React `cache()` so repeated calls within one request/
 * render dedupe to a single upstream fetch batch.
 *
 * Variable products (the 3 GLP compounds) carry only variation ids + size
 * attributes on the parent; per-size prices come from one getVariations() list call
 * calls, keyed back onto each variation here.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import type { CoaMap, Product, StoreApiProduct, VariationPrice } from "./types";
import { getProduct, getProducts, getVariations, StoreApiError } from "./store-api";
import { mapProduct } from "./mapper";
import { CATEGORIES, categoryForSlug } from "@/content/taxonomy";

// ---------------------------------------------------------------------------
// COA / purity enrichment (optional; written by another agent)
// ---------------------------------------------------------------------------

let coaCache: CoaMap | null = null;

/**
 * Load content/coa-map.json if it exists. Graceful: a missing or malformed
 * file yields an empty map (no purity/COA enrichment) rather than an error.
 */
function loadCoaMap(): CoaMap {
  if (coaCache) return coaCache;
  try {
    const path = join(process.cwd(), "content", "coa-map.json");
    coaCache = JSON.parse(readFileSync(path, "utf8")) as CoaMap;
  } catch {
    coaCache = {};
  }
  return coaCache;
}

// ---------------------------------------------------------------------------
// Variation pricing
// ---------------------------------------------------------------------------

/**
 * Products the storefront lists. The live store carries entries that are not
 * research compounds or are not finished being set up (a gift card, an unpriced
 * SKU): anything not purchasable with no price is left out rather than shown
 * at $0.00. Direct /product/<slug> access still resolves them.
 */
function isListable(p: StoreApiProduct): boolean {
  const minor = parseInt(p.prices?.price ?? "", 10);
  return Boolean(p.is_purchasable) || (Number.isFinite(minor) && minor > 0);
}

/** Collect every variation id referenced by the given products. */
function variationIdsOf(products: StoreApiProduct[]): number[] {
  const ids: number[] = [];
  for (const p of products) {
    if (p.type === "variable" && Array.isArray(p.variations)) {
      for (const v of p.variations) ids.push(v.id);
    }
  }
  return ids;
}

/**
 * Fetch all given variations in one list request and build a
 * variationId -> { priceMinor, regularPriceMinor } map. The regular price is
 * what makes a per-size discount visible on the card and the PDP.
 */
async function fetchVariationPrices(
  ids: number[]
): Promise<Record<number, VariationPrice>> {
  if (ids.length === 0) return {};
  const results = await getVariations(ids);
  const prices: Record<number, VariationPrice> = {};
  for (const v of results) {
    const minor = parseInt(v.prices?.price ?? "", 10);
    if (!Number.isFinite(minor)) continue;
    const regular = parseInt(v.prices?.regular_price ?? "", 10);
    prices[v.id] = {
      priceMinor: minor,
      regularPriceMinor: Number.isFinite(regular) && regular > minor ? regular : minor,
    };
  }
  return prices;
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

const CATEGORY_ORDER = new Map(CATEGORIES.map((c, i) => [c.slug, i]));

function byCategoryThenName(a: Product, b: Product): number {
  const ai = CATEGORY_ORDER.get(a.categorySlug) ?? CATEGORIES.length;
  const bi = CATEGORY_ORDER.get(b.categorySlug) ?? CATEGORIES.length;
  if (ai !== bi) return ai - bi;
  return a.displayName.localeCompare(b.displayName);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * The full mapped, categorized, variation-priced catalog, sorted by category
 * order then display name. Memoized per request via React cache().
 */
export const getCatalog = cache(async (): Promise<Product[]> => {
  const raw = (await getProducts()).filter(isListable);
  const variationPrices = await fetchVariationPrices(variationIdsOf(raw));
  const coaMap = loadCoaMap();

  const products = raw.map((p) =>
    mapProduct(p, {
      variationPrices,
      coaMap,
      category: categoryForSlug(p.slug),
    })
  );

  products.sort(byCategoryThenName);
  return products;
});

/**
 * A single product by slug, via the same mapping path (variation prices + COA
 * enrichment + taxonomy). Returns null when the slug resolves to nothing.
 */
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  let raw: StoreApiProduct;
  try {
    raw = await getProduct(slug);
  } catch (err) {
    if (err instanceof StoreApiError && err.status === 404) return null;
    throw err;
  }

  const variationPrices =
    raw.type === "variable" && Array.isArray(raw.variations)
      ? await fetchVariationPrices(raw.variations.map((v) => v.id))
      : {};

  return mapProduct(raw, {
    variationPrices,
    coaMap: loadCoaMap(),
    category: categoryForSlug(raw.slug),
  });
});
