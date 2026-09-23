import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail } from "lucide-react";
import { requirePermission } from "@/lib/admin/auth";
import { formatCount, formatMoney } from "@/lib/admin/money";
import { pageParam, type SearchParams } from "@/lib/admin/params";
import { can } from "@/lib/admin/permissions";
import { isWooConfigured, settle } from "@/lib/admin/woo/client";
import { getCustomer, listCustomerOrders } from "@/lib/admin/woo/customers";
import { Button } from "@/components/ui/button";
import { ProblemPanel } from "@/components/admin/Feedback";
import { LocalTime } from "@/components/admin/LocalTime";
import { NotConnected } from "@/components/admin/NotConnected";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";
import { DetailList, Panel } from "@/components/admin/Panel";
import { Pill } from "@/components/admin/StatusBadge";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission("customers.view");
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const back = { href: "/admin/customers", label: "Customers" };

  if (!isWooConfigured()) {
    return (
      <>
        <PageHeader title="Customer" back={back} />
        <NotConnected canFix={can(user.role, "settings.manage")} />
      </>
    );
  }

  const customer = await settle(getCustomer(id));
  if (!customer.ok) {
    return (
      <>
        <PageHeader title="Customer" back={back} />
        <ProblemPanel problem={customer.problem} canFix={can(user.role, "settings.manage")} />
      </>
    );
  }
  if (!customer.value) notFound();
  const c = customer.value;

  const page = pageParam(await searchParams);
  const orders = can(user.role, "orders.view") ? await settle(listCustomerOrders(c, page)) : null;

  return (
    <>
      <PageHeader
        back={back}
        title={c.name}
        meta={
          <>
            {c.userId ? <Pill tone="info">Registered account</Pill> : <Pill tone="muted">Guest checkout</Pill>}
            {c.location && <span className="text-[13px] text-ink-muted">{c.location}</span>}
          </>
        }
        actions={
          c.email ? (
            <Button asChild variant="outline" className="h-9 px-3">
              <a href={`mailto:${c.email}`}>
                <Mail aria-hidden="true" /> Email
              </a>
            </Button>
          ) : null
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Orders" bodyClassName="p-0" className="order-2 lg:order-1">
          {!orders ? (
            <p className="p-5 text-sm text-ink-muted">Your role doesn&apos;t include viewing orders.</p>
          ) : orders.ok ? (
            <>
              <OrdersTable rows={orders.value.rows} canUpdate={false} emptyTitle="No orders found for this customer" />
              <Pagination
                path={`/admin/customers/${c.id}`}
                params={{}}
                page={page}
                perPage={20}
                total={orders.value.total}
                totalPages={orders.value.totalPages}
                noun="orders"
              />
            </>
          ) : (
            <div className="p-5">
              <ProblemPanel problem={orders.problem} />
            </div>
          )}
        </Panel>

        <Panel title="Summary" className="order-1 lg:order-2">
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-paper p-3">
              <p className="text-[12px] text-ink-muted">Total spend</p>
              <p className="mt-0.5 text-[20px] font-semibold text-ink">{formatMoney(c.totalSpendMinor, c.currency)}</p>
            </div>
            <div className="rounded-xl bg-paper p-3">
              <p className="text-[12px] text-ink-muted">Orders</p>
              <p className="mt-0.5 text-[20px] font-semibold text-ink">{formatCount(c.ordersCount)}</p>
            </div>
          </div>
          <DetailList
            rows={[
              { label: "Email", value: c.email ? <a href={`mailto:${c.email}`} className="break-all text-green underline-offset-4 hover:underline">{c.email}</a> : "—" },
              ...(c.username ? [{ label: "Username", value: c.username }] : []),
              { label: "Average order", value: formatMoney(c.averageMinor, c.currency) },
              { label: "Last order", value: c.lastOrderAt ? <LocalTime value={`${c.lastOrderAt}T12:00:00Z`} format="date" /> : "—" },
              { label: "Last active", value: <LocalTime value={c.lastActiveAt} format="datetime" /> },
              ...(c.registeredAt ? [{ label: "Registered", value: <LocalTime value={c.registeredAt} format="date" /> }] : []),
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
