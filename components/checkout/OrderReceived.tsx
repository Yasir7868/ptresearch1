"use client";

/**
 * OrderReceived — demo confirmation (/order-received), Reference Grade.
 *
 * Reads the demo order back from sessionStorage (written by CheckoutForm).
 * No order in the session → styled empty state linking home. The payment-
 * instructions panel is a soft feature card carrying HONEST
 * placeholder copy — handles/addresses appear once the store backend is
 * connected. Order numbers render in the batch-id treatment (uppercase
 * tracked Satoshi tabular) and stay EXACT — they are the payment
 * reference a customer copies.
 */

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { compliance } from "@/content/compliance";
import { brandConfig } from "@/content/brand-config";
import { shippingPolicy } from "@/content/site-copy";
import { FadeIn } from "@/components/motion/FadeIn";
import { VerifiedMark } from "@/components/plate/VerifiedMark";
import { formatMinor } from "@/components/checkout/money";
import { TotalsLedger } from "@/components/checkout/TotalsLedger";
import { hasVerifiedCoa } from "@/components/checkout/coa-lookup";
import {
  DEMO_ORDER_KEY,
  paymentMethodInfo,
  readDemoOrder,
  unitCountOf,
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
        <p className="micro-label">No order found</p>
        <p className="max-w-[40ch] text-sm text-ink-muted">
          There is no demo order in this browser session. Orders placed
          through the demo checkout appear here.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/">Back to home</Link>
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
        month: "short",
        day: "numeric",
      });

  return (
    <FadeIn className="flex flex-col gap-12">
      {/* Header */}
      <header className="hairline-b pb-8">
        <p className="micro-label">Order confirmed (demo)</p>
        <h1 className="mt-3 text-[clamp(1.9rem,3.4vw,3rem)]">
          Order received
        </h1>

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          <div>
            <dt className="micro-label">Order no.</dt>
            <dd className="batch-id mt-1.5 text-green">
              {order.orderNumber}
            </dd>
          </div>
          <div>
            <dt className="micro-label">Placed</dt>
            <dd className="data-num mt-1.5 text-sm text-ink">{placedLabel}</dd>
          </div>
          <div>
            <dt className="micro-label">Payment</dt>
            <dd className="mt-1.5 text-sm text-ink">{method.label}</dd>
          </div>
          <div>
            <dt className="micro-label">Confirmation to</dt>
            <dd className="mt-1.5 truncate text-sm text-ink">{order.email}</dd>
          </div>
        </dl>
      </header>

      {/* Items ledger */}
      <section aria-label="Order items">
        <h2 className="micro-label">Items</h2>
        <div className="ledger-card mt-4">
          <table className="ledger-table">
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">Qty</th>
              <th className="num hidden sm:table-cell">Unit</th>
              <th className="num">Total</th>
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
          unitCount={unitCountOf(order.items)}
          shippingNullLabel="To be confirmed"
          className="mt-6 sm:ml-auto sm:max-w-sm"
        />
      </section>

      {/* Payment instructions — the page's feature card (soft) */}
      <section aria-label="Payment instructions">
        <div className="plate">
          <div className="plate-field">
            <div className="hairline-b px-5 py-4">
              <h2 className="micro-label">
                Payment instructions — {method.label}
              </h2>
            </div>
            <div className="flex flex-col gap-5 px-5 py-5">
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="micro-label">Order total</dt>
                  <dd className="data-num mt-1.5 text-xl text-green">
                    {formatMinor(order.totals.total, mu)}
                  </dd>
                </div>
                <div>
                  <dt className="micro-label">Payment reference</dt>
                  <dd className="batch-id mt-2 !text-[15px] text-green">
                    {order.orderNumber}
                  </dd>
                </div>
              </dl>

              <p className="text-sm leading-relaxed text-ink-muted">
                {method.instructions}
              </p>

              <p className="micro-label">
                Prototype — no payment is collected and no email was sent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What happens next */}
      <section aria-label="What happens next">
        <h2 className="micro-label">What happens next</h2>
        <ol className="hairline-y mt-4 divide-y divide-hairline">
          <li className="flex gap-5 py-5">
            <span className="data-num text-sm text-green">01</span>
            <div>
              <p className="text-sm font-medium text-ink">Payment</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                Send the order total by {method.label} and include{" "}
                <span className="data-num">{order.orderNumber}</span> as the
                payment reference.
              </p>
            </div>
          </li>
          <li className="flex gap-5 py-5">
            <span className="data-num text-sm text-green">02</span>
            <div>
              <p className="text-sm font-medium text-ink">Verification</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                Your order is confirmed once payment is received.{" "}
                {shippingPolicy.processingTime}.
              </p>
            </div>
          </li>
          <li className="flex gap-5 py-5">
            <span className="data-num text-sm text-green">03</span>
            <div>
              <p className="text-sm font-medium text-ink">Shipping</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {brandConfig.promos.shippingSpeed.label} — tracking
                information is sent when your order ships.
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* RUO warn-line + back to catalog */}
      <div className="text-center">
        <p className="warn-line inline-block rounded-md px-3 py-1.5 text-[12px] font-medium text-ink">
          {compliance.ruoBanner}
        </p>
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link href="/catalog">Back to catalog</Link>
          </Button>
        </div>
      </div>
    </FadeIn>
  );
}
