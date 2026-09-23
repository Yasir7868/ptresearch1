/**
 * /admin/site-orders — orders taken on THIS storefront.
 *
 * Distinct from /admin/orders, which reads WooCommerce. These are the orders
 * this Next.js site priced and charged through the embedded payment gateway
 * and stored in the admin database (lib/orders/store.ts). Until a paid order
 * is also written into WooCommerce, this list is the only place it exists —
 * which is exactly why it has a page rather than living in a log.
 *
 * Reuses the `orders.view` permission: same job, different source.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { listOrders, type OrderStatus } from "@/lib/orders/store";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination, hrefWith } from "@/components/admin/Pagination";
import { formatMinor } from "@/components/checkout/money";
import { LocalTime } from "@/components/admin/LocalTime";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Storefront orders" };

const PER_PAGE = 25;

const STATUS_TABS: { label: string; value: OrderStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Paid", value: "processing" },
  { label: "Awaiting payment", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

/** Payment state drives the pill — it is what staff are actually scanning for. */
function paymentTone(status: string): string {
  if (status === "paid") return "border-ok/30 bg-ok/10 text-ok";
  if (status === "failed") return "border-error/30 bg-error/10 text-error";
  return "border-hairline bg-paper text-ink-muted";
}

export default async function SiteOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  await requirePermission("orders.view");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = STATUS_TABS.some((t) => t.value === params.status)
    ? (params.status as OrderStatus | "")
    : "";

  const { orders, total } = listOrders({
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
    ...(status ? { status } : {}),
  });

  return (
    <>
      <PageHeader
        title="Storefront orders"
        description="Orders placed on this site and charged through the payment gateway. WooCommerce orders are listed separately under Orders."
      />

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter by status">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={hrefWith("/admin/site-orders", {
              ...(tab.value ? { status: tab.value } : {}),
            })}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              status === tab.value
                ? "border-green bg-green/5 text-green"
                : "border-hairline text-ink-muted hover:border-ink-muted/40"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">
          No storefront orders yet.
        </p>
      ) : (
        <div className="ledger-card mt-6 overflow-x-auto">
          <table className="ledger-table w-full">
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                <th>Customer</th>
                <th>Payment</th>
                <th className="num">Items</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="batch-id text-green">
                      {order.orderNumber}
                    </span>
                    <span className="mt-1 block text-[12px] text-ink-muted">
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "line" : "lines"}
                    </span>
                  </td>
                  <td className="text-ink-muted">
                    <LocalTime value={order.createdAt} />
                  </td>
                  <td>
                    <span className="block text-ink">
                      {order.buyer.firstName} {order.buyer.lastName}
                    </span>
                    <span className="block text-[12px] text-ink-muted">
                      {order.buyer.email}
                    </span>
                    <span className="block text-[12px] text-ink-muted">
                      {order.buyer.city}, {order.buyer.state}
                    </span>
                  </td>
                  <td>
                    <span
                      className={cn(
                        "inline-block rounded-full border px-2.5 py-1 text-[12px] font-medium",
                        paymentTone(order.paymentStatus)
                      )}
                    >
                      {order.paymentStatus}
                    </span>
                    {order.bulkTier ? (
                      <span className="mt-1 block text-[12px] text-ink-muted">
                        {order.bulkTier} · {order.bulkUnits} units
                      </span>
                    ) : null}
                  </td>
                  <td className="num text-ink">
                    {order.items.reduce((n, i) => n + i.qty, 0)}
                  </td>
                  <td className="num text-ink">
                    {formatMinor(order.totalMinor, order.currencyMinorUnit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        path="/admin/site-orders"
        params={status ? { status } : {}}
        page={page}
        perPage={PER_PAGE}
        total={total}
        totalPages={Math.max(1, Math.ceil(total / PER_PAGE))}
        noun="orders"
      />
    </>
  );
}
