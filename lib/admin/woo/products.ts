/**
 * lib/admin/woo/products.ts — SERVER-ONLY. Products and stock levels.
 *
 * The panel manages stock (the daily job); prices, descriptions and images
 * stay in WP admin, which the product rows link to. A stock change here also
 * marks the storefront's cached catalog stale, so the shop's in-stock state
 * catches up on the next visit.
 */

import "server-only";
import { revalidateTag } from "next/cache";
import { invalidate } from "../memo";
import { toMinor } from "../money";
import { wpOrigin } from "../config";
import { getCatalogIndex } from "./catalog-index";
import { woo, wooRequest } from "./client";
import type { WooProduct, WooStockRow, WooVariation } from "./types";

export type StockFilter = "all" | "instock" | "lowstock" | "outofstock" | "onbackorder";

export interface ProductRow {
  id: number;
  /** Set for variations listed on their own (the low stock view). */
  parentId: number | null;
  name: string;
  slug: string | null;
  sku: string;
  type: string;
  status: string;
  priceMinor: number | null;
  stockStatus: string;
  stockQuantity: number | null;
  manageStock: boolean | "parent";
  variationCount: number;
  totalSales: number;
  image: string | null;
  wpAdminUrl: string;
}

export interface VariationRow {
  id: number;
  productId: number;
  label: string;
  sku: string;
  priceMinor: number | null;
  status: string;
  stockStatus: string;
  stockQuantity: number | null;
  manageStock: boolean | "parent";
}

const PRODUCT_FIELDS =
  "id,name,slug,sku,type,status,price,stock_status,stock_quantity,manage_stock,images,variations,total_sales";

function editUrl(productId: number): string {
  return `${wpOrigin()}/wp-admin/post.php?post=${productId}&action=edit`;
}

function price(value: string | undefined): number | null {
  return value === undefined || value === "" ? null : toMinor(value);
}

export async function listProducts(filter: {
  search?: string;
  stock: StockFilter;
  page: number;
  perPage: number;
}): Promise<{ rows: ProductRow[]; total: number; totalPages: number }> {
  const index = await getCatalogIndex();

  if (filter.stock === "lowstock") {
    // Low stock is an Analytics view (it honours each product's threshold).
    const res = await wooRequest<WooStockRow[]>("/reports/stock", {
      namespace: "wc-analytics",
      query: { type: "lowstock", page: filter.page, per_page: filter.perPage, orderby: "stock_quantity", order: "asc" },
    });
    return {
      rows: res.data.map((row) => ({
        id: row.id,
        parentId: row.parent_id || null,
        name: row.parent_id ? index.code(row.name) : index.productName(row.id, row.name),
        slug: index.slugFor(row.parent_id || row.id),
        sku: row.sku ?? "",
        type: row.parent_id ? "variation" : "simple",
        status: "publish",
        priceMinor: null,
        stockStatus: row.stock_status,
        stockQuantity: row.stock_quantity,
        manageStock: row.manage_stock,
        variationCount: 0,
        totalSales: 0,
        image: index.imageFor(row.parent_id || row.id),
        wpAdminUrl: editUrl(row.parent_id || row.id),
      })),
      total: res.total ?? res.data.length,
      totalPages: res.totalPages ?? 1,
    };
  }

  const res = await wooRequest<WooProduct[]>("/products", {
    query: {
      search: filter.search,
      stock_status: filter.stock === "all" ? undefined : filter.stock,
      page: filter.page,
      per_page: filter.perPage,
      orderby: "title",
      order: "asc",
      status: "any",
      _fields: PRODUCT_FIELDS,
    },
  });
  return {
    rows: res.data.map((p) => ({
      id: p.id,
      parentId: null,
      name: index.productName(p.id, p.name),
      slug: p.slug,
      sku: p.sku ?? "",
      type: p.type,
      status: p.status,
      priceMinor: price(p.price),
      stockStatus: p.stock_status,
      stockQuantity: p.stock_quantity,
      manageStock: p.manage_stock,
      variationCount: p.variations?.length ?? 0,
      totalSales: Number(p.total_sales) || 0,
      image: index.imageFor(p.id),
      wpAdminUrl: editUrl(p.id),
    })),
    total: res.total ?? res.data.length,
    totalPages: res.totalPages ?? 1,
  };
}

export async function listVariations(productId: number): Promise<VariationRow[]> {
  const index = await getCatalogIndex();
  const variations = await woo<WooVariation[]>(`/products/${productId}/variations`, {
    query: {
      per_page: 100,
      _fields: "id,sku,price,status,stock_status,stock_quantity,manage_stock,attributes",
    },
  });
  return variations.map((v) => ({
    id: v.id,
    productId,
    label: index.code(v.attributes?.map((a) => a.option).filter(Boolean).join(" · ") || `Variation #${v.id}`),
    sku: v.sku ?? "",
    priceMinor: price(v.price),
    status: v.status,
    stockStatus: v.stock_status,
    stockQuantity: v.stock_quantity,
    manageStock: v.manage_stock,
  }));
}

export interface StockUpdate {
  productId: number;
  variationId: number | null;
  manageStock: boolean;
  quantity: number | null;
  stockStatus: "instock" | "outofstock" | "onbackorder";
}

export async function updateStock(update: StockUpdate): Promise<{ slug: string | null }> {
  const body: Record<string, unknown> = { manage_stock: update.manageStock };
  if (update.manageStock) body.stock_quantity = update.quantity ?? 0;
  else body.stock_status = update.stockStatus;

  const path = update.variationId
    ? `/products/${update.productId}/variations/${update.variationId}`
    : `/products/${update.productId}`;
  await woo(path, { method: "PUT", body, query: { _fields: "id" } });

  invalidate("products");
  const slug = (await getCatalogIndex()).slugFor(update.productId);
  refreshStorefrontProduct(update.productId, slug);
  return { slug };
}

/** Mark the storefront's cached catalog + product page stale (SWR). */
export function refreshStorefrontProduct(productId: number | null, slug: string | null): void {
  try {
    revalidateTag("catalog", "max");
    if (productId) revalidateTag(`product:${productId}`, "max");
    if (slug) revalidateTag(`product:${slug}`, "max");
  } catch (err) {
    console.error("[admin] storefront revalidation failed", err);
  }
}
