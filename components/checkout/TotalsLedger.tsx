/**
 * TotalsLedger — the ONE totals block shared by /cart, /checkout,
 * /order-received and the CartDrawer, so money formatting and rows never
 * drift between surfaces.
 *
 * Totals are ADAPTER-CANONICAL (see lib/cart.tsx): today the LocalStorage
 * adapter computes BOGO-50% / PT25 / free shipping locally; the future
 * WooCommerce adapter returns server-canonical totals and this component
 * needs zero changes.
 */

import type { CartTotals } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { formatMinor } from "@/components/checkout/money";

/** Shown under the discount row when the auto BOGO promo is in effect. */
export const BOGO_NOTE = "Includes BOGO 50% — auto-applied";

export function TotalsLedger({
  totals,
  unitCount,
  shippingNullLabel = "Calculated at checkout",
  className,
}: {
  totals: CartTotals;
  /**
   * Total units across all lines. The BOGO note only renders when ≥ 2 units
   * are in the order — with a single unit any discount is coupon-only and
   * claiming BOGO would be wrong.
   */
  unitCount: number;
  /** Label for `shipping: null` (not yet determinable). */
  shippingNullLabel?: string;
  className?: string;
}) {
  const mu = totals.currencyMinorUnit;
  const bogoActive = totals.discount > 0 && unitCount >= 2;

  return (
    <dl className={cn("flex flex-col gap-2 text-sm", className)}>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-muted">Subtotal</dt>
        <dd className="data-mono text-ink">
          {formatMinor(totals.itemsSubtotal, mu)}
        </dd>
      </div>

      {totals.discount > 0 && (
        <div className="flex items-start justify-between gap-4">
          <dt className="text-ink-muted">
            Discount
            {totals.appliedCoupons.length > 0 && (
              <span className="micro-label ml-2">
                {totals.appliedCoupons.join(", ")}
              </span>
            )}
            {bogoActive && (
              <span className="data-mono mt-0.5 block text-[11px] text-ink-muted">
                {BOGO_NOTE}
              </span>
            )}
          </dt>
          <dd className="data-mono text-ink">
            −{formatMinor(totals.discount, mu)}
          </dd>
        </div>
      )}

      <div className="flex justify-between gap-4">
        <dt className="text-ink-muted">Shipping</dt>
        <dd className="data-mono text-ink">
          {totals.shipping === null
            ? shippingNullLabel
            : totals.shipping === 0
              ? "Free"
              : formatMinor(totals.shipping, mu)}
        </dd>
      </div>

      <div className="hairline-t mt-1 flex justify-between gap-4 pt-3">
        <dt className="font-medium text-ink">Total</dt>
        {/* Green = the data-emphasis color on light (DESIGN §2). */}
        <dd className="data-num text-[15px] font-medium text-green">
          {formatMinor(totals.total, mu)}
        </dd>
      </div>
    </dl>
  );
}
