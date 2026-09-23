/**
 * TotalsLedger — the ONE totals block shared by /cart, /checkout,
 * /order-received and the CartDrawer, so money formatting and rows never
 * drift between surfaces. Row labels follow the live checkout (Subtotal /
 * Shipping / Total).
 *
 * Totals are ADAPTER-CANONICAL (see lib/cart.tsx): today the LocalStorage
 * adapter computes the PT25 coupon / free shipping locally; the future
 * WooCommerce adapter returns server-canonical totals and this component
 * needs zero changes.
 */

import type { CartTotals } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { formatMinor } from "@/components/checkout/money";
import { checkoutPage } from "@/content/site-copy";
import { bulkCopy } from "@/content/bulk";

export function TotalsLedger({
  totals,
  shippingNullLabel = "Calculated at checkout",
  className,
}: {
  totals: CartTotals;
  /** Label for `shipping: null` (not yet determinable). */
  shippingNullLabel?: string;
  className?: string;
}) {
  const mu = totals.currencyMinorUnit;

  return (
    <dl className={cn("flex flex-col gap-2 text-sm", className)}>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-muted">{checkoutPage.subtotal}</dt>
        <dd className="data-mono text-ink">
          {formatMinor(totals.itemsSubtotal, mu)}
        </dd>
      </div>

      {totals.discount > 0 && (
        <div className="flex items-start justify-between gap-4">
          <dt className="text-ink-muted">
            Discount
            {/*
              Name the discount actually charged. Promo codes do not apply to
              bulk orders (lib/cart.tsx), so once a tier is earned the row is
              labelled with the tier — a code may still sit in the cart,
              dormant, and it is named below rather than here.
            */}
            {totals.bulkTier ? (
              <span className="micro-label ml-2">
                {totals.bulkTier.code} · {bulkCopy.cart.tierLabel(totals.bulkUnits)}
              </span>
            ) : (
              totals.appliedCoupons.length > 0 && (
                <span className="micro-label ml-2">
                  {totals.appliedCoupons.join(", ")}
                </span>
              )
            )}
          </dt>
          <dd className="data-mono text-ink">
            −{formatMinor(totals.discount, mu)}
          </dd>
        </div>
      )}

      {/* A code the buyer already entered that bulk pricing has displaced. */}
      {totals.blockedCoupons.length > 0 && (
        <p className="text-xs text-ink-muted">
          {bulkCopy.cart.couponDormant(totals.blockedCoupons.join(", "))}
        </p>
      )}

      <div className="flex justify-between gap-4">
        <dt className="text-ink-muted">{checkoutPage.shipping}</dt>
        <dd className="data-mono text-ink">
          {totals.shipping === null
            ? shippingNullLabel
            : totals.shipping === 0
              ? "Free"
              : formatMinor(totals.shipping, mu)}
        </dd>
      </div>

      <div className="hairline-t mt-1 flex justify-between gap-4 pt-3">
        <dt className="font-medium text-ink">{checkoutPage.total}</dt>
        {/* Green = the data-emphasis color on light (DESIGN §2). */}
        <dd className="data-num text-[15px] font-medium text-green">
          {formatMinor(totals.total, mu)}
        </dd>
      </div>
    </dl>
  );
}
