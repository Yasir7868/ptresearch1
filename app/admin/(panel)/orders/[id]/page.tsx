import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requirePermission } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { isWooConfigured, settle } from "@/lib/admin/woo/client";
import {
  gatewaySupportsRefunds,
  getOrder,
  getOrderNotes,
  getOrderRefunds,
  getOrderStatuses,
} from "@/lib/admin/woo/orders";
import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/admin/LocalTime";
import { NotConnected } from "@/components/admin/NotConnected";
import { PageHeader } from "@/components/admin/PageHeader";
import { DetailList, Panel } from "@/components/admin/Panel";
import { ProblemPanel } from "@/components/admin/Feedback";
import { Pill, StatusBadge } from "@/components/admin/StatusBadge";
import { AddressCard } from "@/components/admin/orders/AddressCard";
import { OrderItems } from "@/components/admin/orders/OrderItems";
import { OrderNotes } from "@/components/admin/orders/OrderNotes";
import { OrderStatusForm } from "@/components/admin/orders/OrderStatusForm";
import { RefundPanel } from "@/components/admin/orders/RefundPanel";
import { ResendDetailsButton } from "@/components/admin/orders/ResendDetailsButton";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order #${id}` };
}

const CREATED_VIA: Record<string, string> = {
  checkout: "Website checkout",
  "store-api": "Website checkout",
  admin: "WP admin",
  "rest-api": "API / WooCommerce app",
  "pos-rest-api": "Point of sale",
};

export default async function OrderPage({ params }: Props) {
  const user = await requirePermission("orders.view");
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  if (!isWooConfigured()) {
    return (
      <>
        <PageHeader title={`Order #${id}`} back={{ href: "/admin/orders", label: "Orders" }} />
        <NotConnected canFix={can(user.role, "settings.manage")} />
      </>
    );
  }

  const [order, notes, refunds, statuses] = await Promise.all([
    settle(getOrder(id)),
    settle(getOrderNotes(id)),
    settle(getOrderRefunds(id)),
    settle(getOrderStatuses()),
  ]);

  if (!order.ok) {
    return (
      <>
        <PageHeader title={`Order #${id}`} back={{ href: "/admin/orders", label: "Orders" }} />
        <ProblemPanel problem={order.problem} canFix={can(user.role, "settings.manage")} />
      </>
    );
  }
  if (!order.value) notFound();
  const o = order.value;

  const canUpdate = can(user.role, "orders.update");
  const canRefund = can(user.role, "orders.refund");
  const gatewayRefunds = canRefund && o.paymentMethodId ? await gatewaySupportsRefunds(o.paymentMethodId) : false;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={`Order #${o.number}`}
        meta={
          <>
            <StatusBadge status={o.status} label={statuses.ok ? statuses.value.find((s) => s.slug === o.status)?.name : undefined} />
            <span className="text-[13px] text-ink-muted">
              Placed <LocalTime value={o.createdAt} format="datetime" />
            </span>
            {o.createdVia && <Pill>{CREATED_VIA[o.createdVia] ?? o.createdVia}</Pill>}
            {o.needsPayment && <Pill tone="warning">Awaiting payment</Pill>}
          </>
        }
        actions={
          <>
            {can(user.role, "orders.notify") && <ResendDetailsButton orderId={o.id} email={o.billing.email} />}
            <Button asChild variant="outline" className="h-9 px-3">
              <a href={o.wpAdminUrl} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" /> Open in WP admin
              </a>
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Items" bodyClassName="p-0">
            <OrderItems order={o} />
          </Panel>

          {o.customerNote && (
            <Panel title="Customer's note">
              <p className="text-sm whitespace-pre-wrap text-ink">{o.customerNote}</p>
            </Panel>
          )}

          {(o.totals.refundedMinor > 0 || canRefund) && (
            <Panel title="Refunds">
              {refunds.ok ? (
                <RefundPanel
                  orderId={o.id}
                  refunds={refunds.value}
                  totalMinor={o.totals.totalMinor}
                  refundedMinor={o.totals.refundedMinor}
                  currency={o.currency}
                  paymentMethod={o.paymentMethodTitle}
                  gatewayRefunds={gatewayRefunds}
                  canRefund={canRefund && !["refunded", "failed", "checkout-draft"].includes(o.status)}
                />
              ) : (
                <p className="text-sm text-ink-muted">{refunds.problem.message}</p>
              )}
            </Panel>
          )}

          <Panel title="Order notes" description="Shared with WP admin and the WooCommerce app.">
            {notes.ok ? (
              <OrderNotes
                orderId={o.id}
                notes={notes.value}
                canAdd={canUpdate}
                canNotify={can(user.role, "orders.notify")}
                canDelete={canUpdate}
              />
            ) : (
              <p className="text-sm text-ink-muted">{notes.problem.message}</p>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Status">
            {canUpdate && statuses.ok ? (
              <OrderStatusForm key={o.status} orderId={o.id} current={o.status} statuses={statuses.value} />
            ) : (
              <StatusBadge status={o.status} />
            )}
          </Panel>

          <Panel title="Shipping address">
            <AddressCard orderId={o.id} kind="shipping" address={o.shipping} canEdit={can(user.role, "orders.edit")} />
          </Panel>

          <Panel title="Billing">
            <AddressCard orderId={o.id} kind="billing" address={o.billing} canEdit={can(user.role, "orders.edit")} />
          </Panel>

          <Panel title="Payment">
            <DetailList
              rows={[
                { label: "Method", value: o.paymentMethodTitle || "—" },
                ...(o.transactionId ? [{ label: "Transaction ID", value: <span className="batch-id normal-case">{o.transactionId}</span> }] : []),
                { label: "Paid", value: o.paidAt ? <LocalTime value={o.paidAt} /> : "Not paid yet" },
                ...(o.completedAt ? [{ label: "Completed", value: <LocalTime value={o.completedAt} /> }] : []),
                { label: "Customer", value: o.customerId ? `Registered account #${o.customerId}` : "Guest checkout" },
                ...(can(user.role, "customers.view") && o.customerIp
                  ? [{ label: "IP address", value: o.customerIp }]
                  : []),
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
