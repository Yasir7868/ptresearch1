/**
 * FreeShippingProgress — hairline progress toward the free-shipping
 * threshold. Shared by /cart and the CartDrawer for exact visual parity.
 *
 * The threshold applies to the POST-discount merchandise total — mirrors the
 * LocalStorage adapter's rule; the future Woo adapter keeps it in sync
 * server-side.
 */

import type { CartTotals } from "@/lib/cart";
import { brandConfig } from "@/content/brand-config";
import { formatMinor } from "@/components/checkout/money";

export function FreeShippingProgress({ totals }: { totals: CartTotals }) {
  const threshold = brandConfig.promos.freeShipping.thresholdMinor;
  const mu = totals.currencyMinorUnit;
  const merchandise = totals.itemsSubtotal - totals.discount;
  // A bulk tier can earn free shipping below the spend threshold, so the
  // adapter's own verdict wins over the arithmetic (lib/cart.tsx).
  const earned = totals.shipping === 0;
  const remaining = earned ? 0 : Math.max(0, threshold - merchandise);
  const progress = earned
    ? 1
    : threshold > 0
      ? Math.min(1, merchandise / threshold)
      : 1;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="micro-label inline-flex items-center gap-1.5">
          {/* ok dot + label — earned state, never ok text alone */}
          {remaining === 0 && (
            <span
              aria-hidden="true"
              className="inline-block size-1.5 rounded-full bg-ok"
            />
          )}
          {remaining === 0
            ? "Free shipping applied"
            : `${formatMinor(remaining, mu)} to free shipping`}
        </span>
        <span className="data-num text-[11px] text-ink-muted">
          {formatMinor(threshold, mu)}
        </span>
      </div>
      <div
        className="mt-2 h-1 w-full overflow-hidden rounded-full bg-hairline"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={threshold}
        aria-valuenow={Math.min(merchandise, threshold)}
        aria-label="Progress toward free shipping"
      >
        <div
          className="h-full rounded-full bg-green transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
