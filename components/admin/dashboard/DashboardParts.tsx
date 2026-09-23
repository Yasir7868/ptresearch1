/**
 * Dashboard building blocks (server components): the "needs attention"
 * status tiles, sales stat tiles, range tabs, top products, recent orders and
 * stock alerts.
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Package, ShoppingBag } from "lucide-react";
import { formatCount, formatMoney } from "@/lib/admin/money";
import { statusMeta } from "@/lib/admin/order-status";
import type { SalesRange, SalesSummary, StockOverview, TopProduct } from "@/lib/admin/woo/analytics";
import type { OrderRow } from "@/lib/admin/woo/orders";
import { cn } from "@/lib/utils";
import { EmptyState } from "../Feedback";
import { LocalTime } from "../LocalTime";
import { StatusBadge } from "../StatusBadge";

// ---------------------------------------------------------------------------
// Needs attention
// ---------------------------------------------------------------------------

const ATTENTION = [
  { status: "processing", note: "Paid, ready to pack and ship" },
  { status: "on-hold", note: "Waiting for payment confirmation" },
  { status: "pending", note: "Order placed, not paid yet" },
  { status: "failed", note: "Payment failed or declined" },
] as const;

export function AttentionTiles({ counts }: { counts: Record<string, number> }) {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {ATTENTION.map(({ status, note }) => {
        const count = counts[status] ?? 0;
        return (
          <li key={status}>
            <Link
              href={`/admin/orders?status=${status}`}
              className="soft-card group flex h-full flex-col gap-2 p-4 transition-shadow hover:shadow-[var(--shadow-card-hover)] md:p-5"
            >
              <span className="flex items-center justify-between gap-2">
                <StatusBadge status={status} />
                <ArrowRight aria-hidden="true" className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className={cn("text-[34px] leading-none font-semibold tracking-[-0.02em]", count ? "text-ink" : "text-ink-muted")}>
                {formatCount(count)}
                <span className="sr-only"> {statusMeta(status).label} orders</span>
              </span>
              <span className="text-[13px] leading-snug text-ink-muted">{note}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

export const RANGE_LABEL: Record<SalesRange, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

const PREVIOUS_LABEL: Record<SalesRange, string> = {
  today: "yesterday",
  "7d": "prior 7 days",
  "30d": "prior 30 days",
};

export function RangeTabs({ range }: { range: SalesRange }) {
  return (
    <nav aria-label="Sales period" className="inline-flex rounded-lg bg-secondary p-[3px]">
      {(Object.keys(RANGE_LABEL) as SalesRange[]).map((key) => {
        const current = key === range;
        return (
          <Link
            key={key}
            href={key === "7d" ? "/admin" : `/admin?range=${key}`}
            scroll={false}
            aria-current={current ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              current ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"
            )}
          >
            {RANGE_LABEL[key]}
          </Link>
        );
      })}
    </nav>
  );
}

function Delta({ current, previous, range }: { current: number; previous: number; range: SalesRange }) {
  if (current === 0 && previous === 0) {
    return <span className="text-[13px] text-ink-muted">No change</span>;
  }
  if (previous === 0) {
    return <span className="text-[13px] text-ink-muted">Nothing {PREVIOUS_LABEL[range]}</span>;
  }
  const change = (current - previous) / previous;
  const pct = Math.round(Math.abs(change) * 100);
  if (pct === 0) {
    return (
      <span className="flex items-center gap-1 text-[13px] text-ink-muted">
        <Minus aria-hidden="true" className="size-3.5 shrink-0" /> Same as {PREVIOUS_LABEL[range]}
      </span>
    );
  }
  const up = change > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 text-[13px] leading-snug">
      <span className={cn("inline-flex items-center gap-0.5 font-semibold", up ? "text-ok" : "text-error")}>
        <Icon aria-hidden="true" className="size-3.5" />
        <span className="sr-only">{up ? "Up" : "Down"} </span>
        {pct}%
      </span>
      <span className="text-ink-muted">vs {PREVIOUS_LABEL[range]}</span>
    </span>
  );
}

export function SalesTiles({ sales }: { sales: SalesSummary }) {
  const { current, previous, currency, range } = sales;
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-5">
      <div className="col-span-2">
        <p className="text-[13px] font-medium text-ink-muted">Revenue</p>
        <p className="mt-1 text-[clamp(2.25rem,4.6vw,3rem)] leading-none font-semibold tracking-[-0.03em] text-ink">
          {formatMoney(current.salesMinor, currency)}
        </p>
        <div className="mt-2">
          <Delta current={current.salesMinor} previous={previous.salesMinor} range={range} />
        </div>
        <p className="mt-1 text-[12.5px] text-ink-muted">Net sales {formatMoney(current.netMinor, currency)}</p>
      </div>
      <StatTile label="Orders" value={formatCount(current.orders)}>
        <Delta current={current.orders} previous={previous.orders} range={range} />
      </StatTile>
      <StatTile label="Average order" value={formatMoney(current.averageMinor, currency)}>
        <Delta current={current.averageMinor} previous={previous.averageMinor} range={range} />
      </StatTile>
      <StatTile label="Items sold" value={formatCount(current.items)}>
        <Delta current={current.items} previous={previous.items} range={range} />
      </StatTile>
    </div>
  );
}

function StatTile({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="md:border-l md:border-hairline/80 md:pl-6">
      <p className="text-[13px] font-medium text-ink-muted">{label}</p>
      <p className="mt-1 text-[28px] leading-tight font-semibold tracking-[-0.02em] text-ink">{value}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function TopProductsList({ products, currency }: { products: TopProduct[]; currency: string }) {
  if (products.length === 0) {
    return (
      <EmptyState icon={Package} title="No products sold in this period" className="py-8" />
    );
  }
  const most = Math.max(...products.map((p) => p.itemsSold));
  return (
    <ol className="flex flex-col gap-3.5">
      {products.map((p, i) => (
        <li key={p.productId} className="flex items-center gap-3">
          <span className="data-num w-4 shrink-0 text-right text-[13px] text-ink-muted">{i + 1}</span>
          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-paper">
            {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-ink">{p.name}</span>
              <span className="data-num shrink-0 text-sm text-ink">{formatCount(p.itemsSold)} sold</span>
            </span>
            {/* Meter: share of the top seller, same-ramp track. */}
            <span aria-hidden="true" className="mt-1.5 block h-1.5 rounded-full bg-[color-mix(in_oklab,var(--green)_12%,white)]">
              <span className="block h-full rounded-full bg-green" style={{ width: `${Math.max(4, (p.itemsSold / most) * 100)}%` }} />
            </span>
            <span className="mt-1 block text-[12px] text-ink-muted">
              {formatMoney(p.netMinor, currency)} net · {formatCount(p.orders)} order{p.orders === 1 ? "" : "s"}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

export function RecentOrdersTable({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return <EmptyState icon={ShoppingBag} title="No orders yet">New orders appear here as soon as they are placed.</EmptyState>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="ledger-table min-w-[560px]">
        <thead>
          <tr>
            <th scope="col">Order</th>
            <th scope="col">Placed</th>
            <th scope="col">Status</th>
            <th scope="col" className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="transition-colors hover:bg-[color-mix(in_oklab,var(--band)_3%,white)]">
              <td>
                <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink underline-offset-4 hover:text-green hover:underline">
                  #{o.number} {o.customerName}
                </Link>
                <span className="block truncate text-[12.5px] text-ink-muted">{o.itemsSummary}</span>
              </td>
              <td className="text-ink-muted">
                <LocalTime value={o.createdAt} format="relative" />
              </td>
              <td>
                <StatusBadge status={o.status} />
              </td>
              <td className="num">{formatMoney(o.totalMinor, o.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StockAlertsList({ stock }: { stock: StockOverview }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Out of stock", value: stock.outCount, href: "/admin/products?stock=outofstock" },
          { label: "Low stock", value: stock.lowCount, href: "/admin/products?stock=lowstock" },
          { label: "Backorder", value: stock.backorderCount, href: "/admin/products?stock=onbackorder" },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="rounded-xl bg-paper px-2 py-3 transition-colors hover:bg-secondary">
            <span className={cn("block text-[22px] leading-none font-semibold", item.value ? "text-ink" : "text-ink-muted")}>
              {formatCount(item.value)}
            </span>
            <span className="mt-1 block text-[12px] text-ink-muted">{item.label}</span>
          </Link>
        ))}
      </div>
      {stock.alerts.length > 0 ? (
        <ul className="divide-y divide-hairline/70">
          {stock.alerts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">{a.name}</span>
                {a.sku && <span className="batch-id text-ink-muted">{a.sku}</span>}
              </span>
              <span className={cn("data-num shrink-0 text-[13px]", a.status === "outofstock" ? "text-error" : "text-ink")}>
                {a.status === "outofstock" ? "Out of stock" : `${formatCount(a.quantity ?? 0)} left`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">Everything is in stock.</p>
      )}
    </div>
  );
}
