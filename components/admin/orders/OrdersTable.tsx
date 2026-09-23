"use client";

/**
 * The orders list: a ledger table on desktop, stacked cards on phones.
 * People who can update orders can tick rows and change their status in one
 * go (the same bulk actions as WP admin), after confirming.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { bulkUpdateStatus } from "@/app/admin/(panel)/orders/actions";
import { formatMoney } from "@/lib/admin/money";
import { BULK_STATUSES, CUSTOMER_EMAIL_STATUSES, statusMeta } from "@/lib/admin/order-status";
import type { OrderRow } from "@/lib/admin/woo/orders";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EmptyState } from "../Feedback";
import { LocalTime } from "../LocalTime";
import { StatusBadge } from "../StatusBadge";
import { useToast } from "../Toaster";

export function OrdersTable({
  rows,
  canUpdate,
  emptyTitle,
}: {
  rows: OrderRow[];
  canUpdate: boolean;
  emptyTitle: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  // Keep only selections still on this page after navigation.
  const visibleSelected = rows.filter((r) => selected.has(r.id)).map((r) => r.id);
  const allSelected = rows.length > 0 && visibleSelected.length === rows.length;

  const toggle = (id: number, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const apply = () =>
    startTransition(async () => {
      const result = await bulkUpdateStatus(visibleSelected, bulkStatus);
      setConfirming(false);
      if (result.status === "success") {
        toast({ title: result.message, tone: "success" });
        setSelected(new Set());
        setBulkStatus("");
      } else if (result.status === "error") {
        toast({ title: "Some orders weren't updated", description: result.message, tone: "error", durationMs: 12_000 });
      }
    });

  if (rows.length === 0) {
    return (
      <EmptyState icon={ShoppingBag} title={emptyTitle}>
        Try another status, a different date range, or clear the search.
      </EmptyState>
    );
  }

  const target = bulkStatus ? statusMeta(bulkStatus) : null;

  return (
    <>
      {canUpdate && visibleSelected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline/70 bg-[color-mix(in_oklab,var(--green)_6%,white)] px-4 py-2.5">
          <span className="text-sm font-medium text-ink">{visibleSelected.length} selected</span>
          <select
            aria-label="Change status to"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="h-8 rounded-lg border border-input bg-surface px-2 text-sm"
          >
            <option value="">Change status to…</option>
            {BULK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusMeta(s).label}
              </option>
            ))}
          </select>
          <Button type="button" className="h-8" disabled={!bulkStatus} onClick={() => setConfirming(true)}>
            Apply
          </Button>
          <Button type="button" variant="ghost" className="h-8" onClick={() => setSelected(new Set())}>
            Clear selection
          </Button>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="ledger-table">
          <thead>
            <tr>
              {canUpdate && (
                <th scope="col" className="w-10">
                  <Checkbox
                    className="border-[color-mix(in_oklab,var(--ink-muted)_60%,white)]"
                    checked={allSelected ? true : visibleSelected.length ? "indeterminate" : false}
                    onCheckedChange={(v) => setSelected(v === true ? new Set(rows.map((r) => r.id)) : new Set())}
                    aria-label="Select all orders on this page"
                  />
                </th>
              )}
              <th scope="col">Order</th>
              <th scope="col">Date</th>
              <th scope="col">Status</th>
              <th scope="col">Ship to</th>
              <th scope="col">Payment</th>
              <th scope="col" className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr
                key={o.id}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a,button,[role=checkbox]")) return;
                  router.push(`/admin/orders/${o.id}`);
                }}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-[color-mix(in_oklab,var(--band)_3%,white)]",
                  selected.has(o.id) && "bg-[color-mix(in_oklab,var(--green)_5%,white)]"
                )}
              >
                {canUpdate && (
                  <td>
                    <Checkbox
                      className="border-[color-mix(in_oklab,var(--ink-muted)_60%,white)]"
                      checked={selected.has(o.id)}
                      onCheckedChange={(v) => toggle(o.id, v === true)}
                      aria-label={`Select order ${o.number}`}
                    />
                  </td>
                )}
                <td className="max-w-[320px]">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink underline-offset-4 hover:text-green hover:underline">
                    #{o.number} {o.customerName}
                  </Link>
                  <span className="block truncate text-[12.5px] text-ink-muted">{o.itemsSummary}</span>
                </td>
                <td className="whitespace-nowrap text-ink-muted">
                  <LocalTime value={o.createdAt} format="relative" />
                </td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="text-ink-muted">{o.shipTo || "—"}</td>
                <td className="max-w-[160px] truncate text-ink-muted">{o.paymentMethod || "—"}</td>
                <td className="num whitespace-nowrap">{formatMoney(o.totalMinor, o.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones */}
      <ul className="divide-y divide-hairline/70 md:hidden">
        {rows.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`} className="flex flex-col gap-1.5 px-4 py-3.5 active:bg-secondary">
              <span className="flex items-center justify-between gap-3">
                <span className="truncate font-medium text-ink">
                  #{o.number} {o.customerName}
                </span>
                <span className="data-num shrink-0 font-medium text-ink">{formatMoney(o.totalMinor, o.currency)}</span>
              </span>
              <span className="flex items-center justify-between gap-3">
                <StatusBadge status={o.status} />
                <LocalTime value={o.createdAt} format="relative" className="text-[13px] text-ink-muted" />
              </span>
              <span className="truncate text-[13px] text-ink-muted">{o.itemsSummary}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Dialog open={confirming} onOpenChange={(open) => !pending && setConfirming(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Mark {visibleSelected.length} order{visibleSelected.length === 1 ? "" : "s"} {target?.label}?
            </DialogTitle>
            <DialogDescription>
              {target?.description}{" "}
              {bulkStatus && CUSTOMER_EMAIL_STATUSES.has(bulkStatus) &&
                "WooCommerce may email each customer about the change, depending on your email settings."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={apply}>
              {pending ? "Updating…" : `Mark ${target?.label}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
