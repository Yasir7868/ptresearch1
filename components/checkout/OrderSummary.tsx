"use client";

/**
 * OrderSummary — sticky right-column record card on /checkout ("Order
 * summary" / "Edit cart", as on the live checkout).
 *
 * A soft plate card: semibold Satoshi compound names, Satoshi tabular
 * money, the earned verified mark on COA-backed lines (trust graft #2).
 * Reads live items + adapter-canonical totals from useCart(). Money renders
 * through the shared minor-unit formatter; totals through TotalsLedger for
 * exact parity with /cart and the CartDrawer.
 */

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { checkoutPage } from "@/content/site-copy";
import { VerifiedMark } from "@/components/plate/VerifiedMark";
import { formatMinor } from "@/components/checkout/money";
import { TotalsLedger } from "@/components/checkout/TotalsLedger";
import { LineMeta } from "@/components/checkout/LineMeta";
import { hasVerifiedCoa } from "@/components/checkout/coa-lookup";

export function OrderSummary() {
  const { items, totals } = useCart();
  const mu = totals.currencyMinorUnit;

  return (
    <aside
      aria-label={checkoutPage.summaryHeading}
      className="plate lg:sticky lg:top-24"
    >
      <div className="plate-field">
        <div className="hairline-b flex items-baseline justify-between px-5 py-4">
          <h2 className="micro-label">{checkoutPage.summaryHeading}</h2>
          <Link
            href="/cart"
            className="text-[12px] text-green underline-offset-3 transition-colors hover:text-green-deep hover:underline"
          >
            {checkoutPage.editCart}
          </Link>
        </div>

        <ul className="divide-y divide-hairline px-5">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-start justify-between gap-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="font-display flex items-center gap-1.5 text-[15px] leading-tight font-semibold tracking-[-0.01em] text-ink">
                  <span className="truncate">{item.name}</span>
                  {/* Earned mark — must never be clipped by the truncation */}
                  {hasVerifiedCoa(item.productId) && (
                    <VerifiedMark label={false} className="shrink-0" />
                  )}
                </p>
                <p className="micro-label mt-1">{item.dose}</p>
                <LineMeta item={item} />
                <p className="data-num mt-1 text-[11px] text-ink-muted">
                  {item.qty} × {formatMinor(item.price, mu)}
                </p>
              </div>
              <span className="data-num text-sm text-ink">
                {formatMinor(item.price * item.qty, mu)}
              </span>
            </li>
          ))}
        </ul>

        <div className="hairline-t px-5 py-4">
          <TotalsLedger totals={totals} />
        </div>
      </div>
    </aside>
  );
}
