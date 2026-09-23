/**
 * lib/admin/woo/catalog-index.ts — SERVER-ONLY. A lightweight index of every
 * WooCommerce product (id, raw name, slug, image) used to present anything
 * that mentions a product: order lines, notes, stock alerts, top sellers.
 *
 * It is the admin panel's gate for the GLP coding rule (PRODUCT.md): raw live
 * names only ever reach the UI through `code()` / `productName()`, which use
 * the catalog mapper's coding (lib/woo/mapper.ts). Images come straight from
 * WooCommerce, minus any image whose URL carries an expanded name.
 *
 * Cached in memory for an hour and dropped by product webhooks.
 */

import "server-only";
import {
  codeDisplayName,
  containsExpandedGlpName,
  createGlpTextCoder,
} from "@/lib/woo/mapper";
import { memo } from "../memo";
import { wooRequest } from "./client";

interface IndexedProduct {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

export interface CatalogIndex {
  /** Code any free text (notes, names) for display. */
  code: (text: string) => string;
  /** Coded display name for a product id + its raw name. */
  productName: (productId: number, rawName: string) => string;
  /** Best display image for a product, or null. */
  imageFor: (productId: number) => string | null;
  slugFor: (productId: number) => string | null;
}

const PAGE_LIMIT = 5;

async function loadProducts(): Promise<IndexedProduct[]> {
  const products: IndexedProduct[] = [];
  for (let page = 1; page <= PAGE_LIMIT; page++) {
    const res = await wooRequest<{ id: number; name: string; slug: string; images?: { src: string }[] }[]>(
      "/products",
      { query: { per_page: 100, page, status: "any", _fields: "id,name,slug,images" } }
    );
    for (const p of res.data) {
      const remote = p.images?.find((img) => img.src && !containsExpandedGlpName(img.src))?.src ?? null;
      products.push({ id: p.id, name: p.name, slug: p.slug, image: remote });
    }
    if (!res.totalPages || page >= res.totalPages) break;
  }
  return products;
}

const built = new WeakMap<IndexedProduct[], CatalogIndex>();

function buildIndex(products: IndexedProduct[]): CatalogIndex {
  const cached = built.get(products);
  if (cached) return cached;
  const byId = new Map(products.map((p) => [p.id, p]));
  const code = createGlpTextCoder(products);
  const index: CatalogIndex = {
    code,
    productName: (productId, rawName) => code(codeDisplayName(productId, rawName)),
    imageFor: (productId) => byId.get(productId)?.image ?? null,
    slugFor: (productId) => byId.get(productId)?.slug ?? null,
  };
  built.set(products, index);
  return index;
}

export async function getCatalogIndex(): Promise<CatalogIndex> {
  try {
    const { value } = await memo(
      "catalog-index",
      { ttlMs: 60 * 60 * 1000, tags: ["products"] },
      loadProducts
    );
    return buildIndex(value);
  } catch (err) {
    // Without the product list, fall back to id overrides + the token guard,
    // which still never lets an expanded name through.
    console.error("[admin] product index unavailable; using fallback coder", err);
    return buildIndex([]);
  }
}
