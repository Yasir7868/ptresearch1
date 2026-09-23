"use client";

/**
 * Products with their stock. Variable products expand to their variations
 * (loaded on demand). People with products.edit can change stock from here;
 * everything else about a product is edited in WP admin.
 */

import Image from "next/image";
import { Fragment, useActionState, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Package, Pencil } from "lucide-react";
import { loadVariations, updateStockAction } from "@/app/admin/(panel)/products/actions";
import { IDLE, type ActionState } from "@/lib/admin/action-state";
import { formatCount, formatMoney } from "@/lib/admin/money";
import type { ProductRow, VariationRow } from "@/lib/admin/woo/products";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "../Feedback";
import { FieldRow, FormMessage, SubmitButton, errorOf, fieldAria } from "../FormBits";
import { Pill } from "../StatusBadge";

const STOCK_LABEL: Record<string, string> = {
  instock: "In stock",
  outofstock: "Out of stock",
  onbackorder: "On backorder",
};

function StockCell({ status, quantity, manage }: { status: string; quantity: number | null; manage: boolean | "parent" }) {
  const tone = status === "outofstock" ? "danger" : status === "onbackorder" ? "warning" : "success";
  return (
    <span className="flex flex-col items-start gap-0.5">
      <Pill tone={tone}>{STOCK_LABEL[status] ?? status}</Pill>
      {manage === true && quantity !== null && <span className="data-num text-[12.5px] text-ink-muted">{formatCount(quantity)} in stock</span>}
      {manage === "parent" && <span className="text-[12px] text-ink-muted">Stock managed on product</span>}
    </span>
  );
}

interface EditTarget {
  productId: number;
  variationId: number | null;
  name: string;
  manage: boolean;
  quantity: number | null;
  status: string;
}

export function ProductsTable({
  rows,
  currency,
  canEdit,
  emptyTitle,
}: {
  rows: ProductRow[];
  currency: string;
  canEdit: boolean;
  emptyTitle: string;
}) {
  const [expanded, setExpanded] = useState<Record<number, VariationRow[] | "loading" | string>>({});
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [, startTransition] = useTransition();

  const toggleVariations = (productId: number) => {
    if (expanded[productId] !== undefined) {
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      return;
    }
    setExpanded((prev) => ({ ...prev, [productId]: "loading" }));
    startTransition(async () => {
      const result = await loadVariations(productId);
      setExpanded((prev) => ({ ...prev, [productId]: result.ok ? result.rows : result.message }));
    });
  };

  if (rows.length === 0) {
    return <EmptyState icon={Package} title={emptyTitle} />;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="ledger-table min-w-[760px]">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Stock</th>
              <th scope="col" className="num">Price</th>
              <th scope="col" className="num">Sold</th>
              <th scope="col" className="w-[1%]">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const variations = expanded[p.id];
              const isVariable = p.type === "variable" && p.variationCount > 0;
              return (
                <Fragment key={p.id}>
                  <tr>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-paper">
                          {p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-ink">{p.name}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-2">
                            {p.sku && <span className="batch-id text-ink-muted">{p.sku}</span>}
                            {p.status !== "publish" && <Pill tone="muted">{p.status}</Pill>}
                            {isVariable && (
                              <button
                                type="button"
                                onClick={() => toggleVariations(p.id)}
                                aria-expanded={variations !== undefined}
                                className="inline-flex items-center gap-0.5 text-[12.5px] font-medium text-green hover:underline"
                              >
                                {variations !== undefined ? <ChevronDown className="size-3.5" aria-hidden="true" /> : <ChevronRight className="size-3.5" aria-hidden="true" />}
                                {p.variationCount} variations
                              </button>
                            )}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <StockCell status={p.stockStatus} quantity={p.stockQuantity} manage={p.manageStock} />
                    </td>
                    <td className="num">{p.priceMinor !== null ? formatMoney(p.priceMinor, currency) : "—"}</td>
                    <td className="num">{p.parentId ? "—" : formatCount(p.totalSales)}</td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        {canEdit && !isVariable && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-2.5"
                            onClick={() =>
                              setEditing({
                                productId: p.parentId ?? p.id,
                                variationId: p.parentId ? p.id : null,
                                name: p.name,
                                manage: p.manageStock === true,
                                quantity: p.stockQuantity,
                                status: p.stockStatus,
                              })
                            }
                          >
                            <Pencil aria-hidden="true" /> Stock
                          </Button>
                        )}
                        <Button asChild variant="ghost" className="h-8 px-2">
                          <a href={p.wpAdminUrl} target="_blank" rel="noreferrer" title="Edit in WP admin">
                            <ExternalLink aria-hidden="true" />
                            <span className="sr-only">Edit {p.name} in WP admin</span>
                          </a>
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {variations === "loading" && (
                    <tr>
                      <td colSpan={5} className="bg-paper text-sm text-ink-muted">
                        Loading variations…
                      </td>
                    </tr>
                  )}
                  {typeof variations === "string" && variations !== "loading" && (
                    <tr>
                      <td colSpan={5} className="bg-paper text-sm text-error">
                        {variations}
                      </td>
                    </tr>
                  )}
                  {Array.isArray(variations) &&
                    variations.map((v) => (
                      <tr key={v.id} className="bg-paper">
                        <td>
                          <span className="block pl-14 text-sm text-ink">{v.label}</span>
                          {v.sku && <span className="batch-id block pl-14 text-ink-muted">{v.sku}</span>}
                        </td>
                        <td>
                          <StockCell status={v.stockStatus} quantity={v.stockQuantity} manage={v.manageStock} />
                        </td>
                        <td className="num">{v.priceMinor !== null ? formatMoney(v.priceMinor, currency) : "—"}</td>
                        <td className="num">—</td>
                        <td>
                          {canEdit && v.manageStock !== "parent" && (
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 px-2.5"
                                onClick={() =>
                                  setEditing({
                                    productId: p.id,
                                    variationId: v.id,
                                    name: `${p.name} · ${v.label}`,
                                    manage: v.manageStock === true,
                                    quantity: v.stockQuantity,
                                    status: v.stockStatus,
                                  })
                                }
                              >
                                <Pencil aria-hidden="true" /> Stock
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <StockDialog
          key={`${editing.productId}-${editing.variationId}`}
          target={editing}
          onClose={() => setEditing(null)}
          onSaved={() =>
            setExpanded((prev) => {
              const next = { ...prev };
              delete next[editing.productId];
              return next;
            })
          }
        />
      )}
    </>
  );
}

function StockDialog({ target, onClose, onSaved }: { target: EditTarget; onClose: () => void; onSaved: () => void }) {
  const [manage, setManage] = useState(target.manage);
  const [state, action] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await updateStockAction(
      { productId: target.productId, variationId: target.variationId, name: target.name },
      prev,
      formData
    );
    if (result.status === "success") {
      onSaved();
      onClose();
    }
    return result;
  }, IDLE);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Stock: {target.name}</DialogTitle>
          <DialogDescription>Saved straight to WooCommerce. The storefront picks it up on its next refresh.</DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="manage"
              checked={manage}
              onChange={(e) => setManage(e.target.checked)}
              className="size-4 accent-[var(--green)]"
            />
            Track stock quantity
          </label>
          {manage ? (
            <FieldRow id="stock-quantity" label="Quantity in stock" error={errorOf(state, "quantity")}>
              <Input
                {...fieldAria("stock-quantity", errorOf(state, "quantity"))}
                name="quantity"
                type="number"
                step={1}
                defaultValue={target.quantity ?? 0}
                className="h-10 bg-surface"
                autoFocus
              />
            </FieldRow>
          ) : (
            <FieldRow id="stock-status" label="Stock status" error={errorOf(state, "stockStatus")}>
              <select
                id="stock-status"
                name="stockStatus"
                defaultValue={target.status}
                className={cn("h-10 rounded-lg border border-input bg-surface px-3 text-sm")}
              >
                <option value="instock">In stock</option>
                <option value="outofstock">Out of stock</option>
                <option value="onbackorder">On backorder</option>
              </select>
            </FieldRow>
          )}
          <FormMessage state={state} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="h-9" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Saving…">Save stock</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
