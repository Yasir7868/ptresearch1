/**
 * OrderConfirmation — /order-received rendered from the ORDER ROW.
 *
 * Server component. Where the older sessionStorage receipt showed whatever the
 * browser had stashed, this reads the order the server priced and stored, so a
 * customer who reloads, switches device, or opens the link later sees the same
 * thing staff see. The order key in the URL is an unguessable token
 * (lib/orders/store.ts), which is what makes the page shareable-by-link
 * without an account system.
 *
 * Payment state comes from the order's own `payment_status`, set by the
 * verified callback. PaymentStatus still runs for an order that has not been
 * settled yet, so a customer who lands here before the callback does gets a
 * live answer rather than a stale "unpaid".
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cartPage, orderReceivedPage } from "@/content/site-copy";
import { FadeIn } from "@/components/motion/FadeIn";
import { VerifiedMark } from "@/components/plate/VerifiedMark";
import { formatMinor } from "@/components/checkout/money";
import { TotalsLedger } from "@/components/checkout/TotalsLedger";
import { hasVerifiedCoa } from "@/components/checkout/coa-lookup";
import { PaymentStatus } from "@/components/checkout/PaymentStatus";
import { paymentMethodInfo } from "@/components/checkout/demo-order";
import type { OrderRecord } from "@/lib/orders/store";
import type { CartTotals } from "@/lib/cart";

/** The stored order's money, in the shape TotalsLedger already renders. */
function ledgerTotals(order: OrderRecord): CartTotals {
  return {
    itemsSubtotal: order.subtotalMinor,
    discount: order.discountMinor,
    shipping: order.shippingMinor,
    total: order.totalMinor,
    currencyMinorUnit: order.currencyMinorUnit,
    appliedCoupons: order.coupons,
    blockedCoupons: [],
    bulkUnits: order.bulkUnits,
    bulkTier: order.bulkTier
      ? { code: order.bulkTier, percentOff: 0 }
      : null,
  };
}

export function OrderConfirmation({ order }: { order: OrderRecord }) {
  const mu = order.currencyMinorUnit;
  const method = paymentMethodInfo("card");
  const placed = new Date(order.createdAt);
  const placedLabel = placed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const settled = order.paymentStatus === "paid";

  return (
    <FadeIn className="flex flex-col gap-12">
      <header className="hairline-b pb-8">
        <h1 className="text-[clamp(1.9rem,3.4vw,3rem)]">
          {orderReceivedPage.heading}
        </h1>

        {settled ? (
          <p className="soft-card mt-5 flex items-center gap-2 px-4 py-3 text-[14px] text-ink">
            <span
              aria-hidden="true"
              className="inline-block size-1.5 rounded-full bg-ok"
            />
            Payment confirmed ·{" "}
            <span className="data-num">
              {formatMinor(order.amountPaidMinor ?? order.totalMinor, mu)}
            </span>
          </p>
        ) : order.checkoutSessionId ? (
          // Not settled in our records yet — ask the gateway directly.
          <div className="mt-5">
            <PaymentStatus
              sessionId={order.checkoutSessionId}
              orderId={order.id}
              orderKey={order.orderKey}
            />
          </div>
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          <div>
            <dt className="micro-label">{orderReceivedPage.orderNumberLabel}</dt>
            <dd className="batch-id mt-1.5 text-green">{order.orderNumber}</dd>
          </div>
          <div>
            <dt className="micro-label">{orderReceivedPage.dateLabel}</dt>
            <dd className="data-num mt-1.5 text-sm text-ink">{placedLabel}</dd>
          </div>
          <div>
            <dt className="micro-label">{orderReceivedPage.emailLabel}</dt>
            <dd className="mt-1.5 truncate text-sm text-ink">
              {order.buyer.email}
            </dd>
          </div>
          <div>
            <dt className="micro-label">{orderReceivedPage.totalLabel}</dt>
            <dd className="data-num mt-1.5 text-sm text-ink">
              {formatMinor(order.totalMinor, mu)}
            </dd>
          </div>
        </dl>
      </header>

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
                <tr key={item.lineKey}>
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
                    {item.dose ? (
                      <p className="micro-label mt-1">{item.dose}</p>
                    ) : null}
                    {item.meta?.length ? (
                      <dl className="mt-1.5 flex flex-col gap-0.5">
                        {item.meta.map((m) => (
                          <div key={m.label} className="flex gap-1.5 text-[12px]">
                            <dt className="text-ink-muted">{m.label}:</dt>
                            <dd className="text-ink">{m.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </td>
                  <td className="num text-ink">{item.qty}</td>
                  <td className="num hidden text-ink-muted sm:table-cell">
                    {formatMinor(item.unitPriceMinor, mu)}
                  </td>
                  <td className="num text-ink">
                    {formatMinor(item.lineTotalMinor, mu)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TotalsLedger
          totals={ledgerTotals(order)}
          className="mt-6 sm:ml-auto sm:max-w-sm"
        />
      </section>

      <section aria-label="Shipping address">
        <h2 className="micro-label">Shipping to</h2>
        <address className="mt-3 text-sm leading-relaxed text-ink not-italic">
          {order.buyer.firstName} {order.buyer.lastName}
          <br />
          {order.buyer.address1}
          {order.buyer.address2 ? (
            <>
              <br />
              {order.buyer.address2}
            </>
          ) : null}
          <br />
          {order.buyer.city}, {order.buyer.state} {order.buyer.postcode}
        </address>
      </section>

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
