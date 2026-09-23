"use client";

/**
 * OrderReceived — order confirmation (/order-received), Reference Grade.
 *
 * Reads the order receipt back from sessionStorage (written by CheckoutForm
 * once the processor reports payment complete), then confirms the payment
 * itself against the gateway via PaymentStatus — the receipt proves what was
 * ordered, not that it was paid for.
 * No order in the session → the live "No order found." state. Copy follows
 * WooCommerce's standard thank-you page (content/site-copy.ts →
 * orderReceivedPage) and the live card gateway's after-order line. Order
 * numbers render in the batch-id treatment (uppercase tracked Satoshi
 * tabular) and stay EXACT.
 */

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cartPage, orderReceivedPage } from "@/content/site-copy";
import { FadeIn } from "@/components/motion/FadeIn";
import { VerifiedMark } from "@/components/plate/VerifiedMark";
import { formatMinor } from "@/components/checkout/money";
import { TotalsLedger } from "@/components/checkout/TotalsLedger";
import { LineMeta } from "@/components/checkout/LineMeta";
import { hasVerifiedCoa } from "@/components/checkout/coa-lookup";
import { PaymentStatus } from "@/components/checkout/PaymentStatus";
import {
  DEMO_ORDER_KEY,
  paymentMethodInfo,
  readDemoOrder,
  type DemoOrder,
} from "@/components/checkout/demo-order";

/* sessionStorage never mutates while this page is mounted (the order is
   written before navigation), so the "store" needs no real subscription —
   useSyncExternalStore is used purely for its hydration-safe read: the
   server/hydration render sees null, then React swaps in the client snapshot
   pre-paint (no flash, no setState-in-effect). */
const emptySubscribe = () => () => {};

// getSnapshot must return a REFERENTIALLY STABLE value — cache the parsed
// order keyed by the raw string so re-renders don't loop.
let cachedRaw: string | null = null;
let cachedOrder: DemoOrder | null = null;
let cachePrimed = false;

function getClientSnapshot(): DemoOrder | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(DEMO_ORDER_KEY);
  } catch {
    raw = null;
  }
  if (!cachePrimed || raw !== cachedRaw) {
    cachePrimed = true;
    cachedRaw = raw;
    cachedOrder = readDemoOrder();
  }
  return cachedOrder;
}

function getServerSnapshot(): DemoOrder | null {
  return null;
}

export function OrderReceived() {
  const order = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (order === null) {
    return (
      <FadeIn className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-[15px] text-ink-muted">{orderReceivedPage.notFound}</p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/catalog">{cartPage.returnToShop}</Link>
        </Button>
      </FadeIn>
    );
  }

  const mu = order.totals.currencyMinorUnit;
  const method = paymentMethodInfo(order.method);
  const placed = new Date(order.createdAt);
  const placedLabel = Number.isNaN(placed.getTime())
    ? "—"
    : placed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <FadeIn className="flex flex-col gap-12">
      {/* Header */}
      <header className="hairline-b pb-8">
        <h1 className="text-[clamp(1.9rem,3.4vw,3rem)]">
          {orderReceivedPage.heading}
        </h1>

        {/* Payment is confirmed against the gateway, not assumed from the
            redirect (components/checkout/PaymentStatus.tsx). */}
        {order.gatewaySessionId ? (
          <div className="mt-5">
            <PaymentStatus
              sessionId={order.gatewaySessionId}
              orderId={order.checkoutId}
              orderKey={order.checkoutId}
            />
          </div>
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          <div>
            <dt className="micro-label">{orderReceivedPage.orderNumberLabel}</dt>
            <dd className="batch-id mt-1.5 text-green">
              {order.orderNumber}
            </dd>
          </div>
          <div>
            <dt className="micro-label">{orderReceivedPage.dateLabel}</dt>
            <dd className="data-num mt-1.5 text-sm text-ink">{placedLabel}</dd>
          </div>
          <div>
            <dt className="micro-label">{orderReceivedPage.emailLabel}</dt>
            <dd className="mt-1.5 truncate text-sm text-ink">{order.email}</dd>
          </div>
          <div>
            <dt className="micro-label">{orderReceivedPage.totalLabel}</dt>
            <dd className="data-num mt-1.5 text-sm text-ink">
              {formatMinor(order.totals.total, mu)}
            </dd>
          </div>
        </dl>
      </header>

      {/* Order details */}
      <section aria-label={orderReceivedPage.detailsHeading}>
        <h2 className="micro-label">{orderReceivedPage.detailsHeading}</h2>
        <div className="ledger-card mt-4">
          <table className="ledger-table">
          <thead>
            <tr>
              <th>{cartPage.columns.product}</th>
              <th className="num">{cartPage.columns.quantity}</th>
              <th className="num hidden sm:table-cell">
                {cartPage.columns.price}
              </th>
              <th className="num">{cartPage.columns.subtotal}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.key}>
                <td>
                  <p className="font-display text-[15px] leading-tight font-semibold tracking-[-0.01em] text-ink">
                    {item.name}
                    {hasVerifiedCoa(item.productId) && (
                      <VerifiedMark
                        label={false}
                        className="ml-1.5 align-[-0.1em]"
                      />
                    )}
                  </p>
                  <p className="micro-label mt-1">{item.dose}</p>
                  <LineMeta item={item} />
                </td>
                <td className="num text-ink">{item.qty}</td>
                <td className="num hidden text-ink-muted sm:table-cell">
                  {formatMinor(item.price, mu)}
                </td>
                <td className="num text-ink">
                  {formatMinor(item.price * item.qty, mu)}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        <TotalsLedger
          totals={order.totals}
          className="mt-6 sm:ml-auto sm:max-w-sm"
        />
      </section>

      {/* Payment method — the page's feature card (soft) */}
      <section aria-label={orderReceivedPage.paymentMethodLabel}>
        <div className="plate">
          <div className="plate-field">
            <div className="hairline-b px-5 py-4">
              <h2 className="micro-label">
                {orderReceivedPage.paymentMethodLabel} {method.label}
              </h2>
            </div>
            <div className="flex flex-col gap-5 px-5 py-5">
              <p className="text-sm leading-relaxed text-ink-muted">
                {method.instructions}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="text-center">
        <Button asChild variant="outline">
          <Link href="/catalog">{cartPage.continueShopping}</Link>
        </Button>
      </div>
    </FadeIn>
  );
}
