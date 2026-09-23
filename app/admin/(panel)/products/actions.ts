"use server";

import { refresh } from "next/cache";
import { fail, ok, type ActionState } from "@/lib/admin/action-state";
import { actionError, formString } from "@/lib/admin/actions";
import { recordActivity } from "@/lib/admin/activity";
import { authorize } from "@/lib/admin/auth";
import { listVariations, updateStock, type VariationRow } from "@/lib/admin/woo/products";

const STOCK_STATUSES = ["instock", "outofstock", "onbackorder"] as const;
type StockStatus = (typeof STOCK_STATUSES)[number];

export async function updateStockAction(
  target: { productId: number; variationId: number | null; name: string },
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await authorize("products.edit");
    const productId = Number(target.productId);
    const variationId = target.variationId ? Number(target.variationId) : null;
    if (!Number.isInteger(productId) || productId <= 0) return fail("Unknown product.");

    const manageStock = formString(formData, "manage") === "on";
    const rawQuantity = formString(formData, "quantity").trim();
    const quantity = Number(rawQuantity);
    const stockStatus = formString(formData, "stockStatus") as StockStatus;

    if (manageStock && (!/^-?\d+$/.test(rawQuantity) || Math.abs(quantity) > 1_000_000)) {
      return fail("Enter a whole number for the quantity.", { quantity: "Whole numbers only." });
    }
    if (!manageStock && !STOCK_STATUSES.includes(stockStatus)) {
      return fail("Choose a stock status.", { stockStatus: "Required." });
    }

    await updateStock({ productId, variationId, manageStock, quantity: manageStock ? quantity : null, stockStatus });
    const label = target.name.slice(0, 120);
    await recordActivity({
      actor: user,
      action: "product.stock_updated",
      target: { type: "product", id: variationId ?? productId },
      summary: manageStock
        ? `Set stock for ${label} to ${quantity}`
        : `Marked ${label} ${stockStatus === "instock" ? "in stock" : stockStatus === "outofstock" ? "out of stock" : "on backorder"}`,
    });
    refresh();
    return ok("Stock updated in WooCommerce.");
  } catch (err) {
    return actionError(err);
  }
}

export async function loadVariations(
  productId: number
): Promise<{ ok: true; rows: VariationRow[] } | { ok: false; message: string }> {
  try {
    await authorize("products.view");
    return { ok: true, rows: await listVariations(Number(productId)) };
  } catch (err) {
    const state = actionError(err);
    return { ok: false, message: state.status === "error" ? state.message : "Couldn't load variations." };
  }
}
