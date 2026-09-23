import type { Metadata } from "next";
import { Download, ExternalLink } from "lucide-react";
import { requirePermission } from "@/lib/admin/auth";
import { wpOrigin } from "@/lib/admin/config";
import { listParams, parseOrderFilters } from "@/lib/admin/order-filters";
import type { SearchParams } from "@/lib/admin/params";
import { can } from "@/lib/admin/permissions";
import { isWooConfigured, settle } from "@/lib/admin/woo/client";
import { getOrderStatuses, getStatusCounts, listOrders } from "@/lib/admin/woo/orders";
import { Button } from "@/components/ui/button";
import { NotConnected } from "@/components/admin/NotConnected";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination, hrefWith } from "@/components/admin/Pagination";
import { ProblemPanel } from "@/components/admin/Feedback";
import { OrderStatusTabs } from "@/components/admin/orders/OrderStatusTabs";
import { OrdersFilters } from "@/components/admin/orders/OrdersFilters";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requirePermission("orders.view");
  const canFix = can(user.role, "settings.manage");

  if (!isWooConfigured()) {
    return (
      <>
        <PageHeader title="Orders" />
        <NotConnected canFix={canFix} />
      </>
    );
  }

  const { filters, ui } = await parseOrderFilters(await searchParams);
  const params = listParams(ui);

  const [statuses, counts, list] = await Promise.all([
    settle(getOrderStatuses()),
    settle(getStatusCounts()),
    settle(listOrders(filters)),
  ]);

  const filtered = Boolean(ui.q || ui.range);

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every WooCommerce order: from the website, WP admin and the WooCommerce app."
        actions={
          <>
            {can(user.role, "orders.export") && (
              <Button asChild variant="outline" className="h-9 px-3">
                <a href={hrefWith("/api/admin/orders/export", params)}>
                  <Download aria-hidden="true" /> Export CSV
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="h-9 px-3">
              <a href={`${wpOrigin()}/wp-admin/admin.php?page=wc-orders`} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" /> WP admin
              </a>
            </Button>
          </>
        }
      />

      <div className="soft-card overflow-hidden">
        <div className="px-4 pt-1 md:px-5">
          <OrderStatusTabs
            statuses={statuses.ok ? statuses.value : []}
            counts={counts.ok ? counts.value : null}
            current={ui.status}
            params={params}
          />
        </div>
        <div className="border-b border-hairline/70 px-4 py-3 md:px-5">
          <OrdersFilters status={ui.status} q={ui.q} range={ui.range} from={ui.from} to={ui.to} perPage={ui.perPage} />
        </div>

        {list.ok ? (
          <>
            <OrdersTable
              key={`${ui.status}|${ui.q}|${ui.range}|${ui.from}|${ui.to}|${ui.page}`}
              rows={list.value.rows}
              canUpdate={can(user.role, "orders.update")}
              emptyTitle={filtered ? "No orders match these filters" : "No orders with this status"}
            />
            <Pagination
              path="/admin/orders"
              params={params}
              page={ui.page}
              perPage={ui.perPage}
              total={list.value.total}
              totalPages={list.value.totalPages}
              noun="orders"
            />
          </>
        ) : (
          <div className="p-5">
            <ProblemPanel problem={list.problem} canFix={canFix} />
          </div>
        )}
      </div>
    </>
  );
}
