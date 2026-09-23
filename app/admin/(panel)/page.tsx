import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { SALES_RANGES, getSalesSummary, getStockOverview, getTopProducts, type SalesRange } from "@/lib/admin/woo/analytics";
import { isWooConfigured, settle } from "@/lib/admin/woo/client";
import { getLatestOrders, getStatusCounts } from "@/lib/admin/woo/orders";
import { Button } from "@/components/ui/button";
import { NotConnected } from "@/components/admin/NotConnected";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { ProblemPanel } from "@/components/admin/Feedback";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import {
  AttentionTiles,
  RANGE_LABEL,
  RangeTabs,
  RecentOrdersTable,
  SalesTiles,
  StockAlertsList,
  TopProductsList,
} from "@/components/admin/dashboard/DashboardParts";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const user = await requirePermission("dashboard.view");
  const rawRange = (await searchParams).range;
  const range: SalesRange = SALES_RANGES.includes(rawRange as SalesRange) ? (rawRange as SalesRange) : "7d";

  const canSales = can(user.role, "reports.view");
  const canOrders = can(user.role, "orders.view");
  const canStock = can(user.role, "products.view");
  const canFix = can(user.role, "settings.manage");

  const header = (
    <PageHeader
      title="Dashboard"
      description="Live from WooCommerce: the same orders and figures as WP admin and the WooCommerce app."
      actions={
        <>
          <RefreshButton />
          {canOrders && (
            <Button asChild className="h-9 px-3.5">
              <Link href="/admin/orders?status=processing">Orders to fulfill</Link>
            </Button>
          )}
        </>
      }
    />
  );

  if (!isWooConfigured()) {
    return (
      <>
        {header}
        <NotConnected canFix={canFix} />
      </>
    );
  }

  const [counts, sales, top, latest, stock] = await Promise.all([
    settle(getStatusCounts()),
    canSales ? settle(getSalesSummary(range)) : null,
    canSales ? settle(getTopProducts(range)) : null,
    canOrders ? settle(getLatestOrders(8)) : null,
    canStock ? settle(getStockOverview()) : null,
  ]);

  return (
    <>
      {header}

      <section aria-labelledby="attention-heading" className="mb-8">
        <h2 id="attention-heading" className="micro-label mb-3">
          Needs attention
        </h2>
        {counts.ok ? <AttentionTiles counts={counts.value} /> : <ProblemPanel problem={counts.problem} canFix={canFix} />}
      </section>

      {sales && (
        <section aria-labelledby="sales-heading" className="mb-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="sales-heading" className="micro-label">
              Sales · {RANGE_LABEL[range]}
            </h2>
            <RangeTabs range={range} />
          </div>

          {sales.ok ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="soft-card flex min-w-0 flex-col gap-6 p-5 md:p-6">
                <SalesTiles sales={sales.value} />
                <div className="border-t border-hairline/70 pt-5">
                  <RevenueChart
                    title={range === "today" ? "Revenue: today and the 6 days before" : `Revenue by day, ${RANGE_LABEL[range].toLowerCase()}`}
                    days={sales.value.series}
                    currency={sales.value.currency}
                    emphasizeLast={range === "today"}
                  />
                </div>
              </div>
              <Panel title="Top products" description={`By items sold, ${RANGE_LABEL[range].toLowerCase()}`}>
                {top?.ok ? (
                  <TopProductsList products={top.value} currency={sales.value.currency} />
                ) : top && !top.ok ? (
                  <p className="text-sm text-ink-muted">{top.problem.message}</p>
                ) : null}
              </Panel>
            </div>
          ) : (
            <ProblemPanel
              problem={sales.problem}
              canFix={canFix}
              title="Sales figures are unavailable"
            />
          )}
        </section>
      )}

      {(latest || stock) && (
        <section aria-labelledby="ops-heading">
          <h2 id="ops-heading" className="micro-label mb-3">
            Latest activity
          </h2>
          <div className={stock && latest ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" : ""}>
            {latest && (
              <Panel
                title="Recent orders"
                action={
                  <Link href="/admin/orders" className="text-[13px] font-medium text-green underline-offset-4 hover:underline">
                    All orders
                  </Link>
                }
                bodyClassName="p-0"
              >
                {latest.ok ? (
                  <RecentOrdersTable orders={latest.value} />
                ) : (
                  <div className="p-5">
                    <ProblemPanel problem={latest.problem} canFix={canFix} />
                  </div>
                )}
              </Panel>
            )}
            {stock && (
              <Panel
                title="Stock"
                action={
                  <Link href="/admin/products" className="text-[13px] font-medium text-green underline-offset-4 hover:underline">
                    Products
                  </Link>
                }
              >
                {stock.ok ? <StockAlertsList stock={stock.value} /> : <p className="text-sm text-ink-muted">{stock.problem.message}</p>}
              </Panel>
            )}
          </div>
        </section>
      )}
    </>
  );
}
