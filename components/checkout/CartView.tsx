"use client";

/**
 * CartView — the full-page cart ledger (/cart), Reference Grade.
 *
 * Desktop: a warm ruled ledger table in a rounded soft card (rows keep their
 * rules; the outer border is retired — soft pass 2026-07). Mobile: stacked
 * rows matching the CartDrawer. Totals, coupon entry, and the free-shipping
 * progress live in a sticky soft record card. The earned verified mark
 * renders on lines whose product has a real COA (trust graft #2). All money
 * renders through the shared minor-unit formatter.
 */

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart, type CartItem } from "@/lib/cart";
import { compliance } from "@/content/compliance";
import { brandConfig } from "@/content/brand-config";
import { track } from "@/lib/analytics";
import { FadeIn } from "@/components/motion/FadeIn";
import { VerifiedMark } from "@/components/plate/VerifiedMark";
import { formatMinor } from "@/components/checkout/money";
import { TotalsLedger } from "@/components/checkout/TotalsLedger";
import { FreeShippingProgress } from "@/components/checkout/FreeShippingProgress";
import { unitCountOf } from "@/components/checkout/demo-order";
import { useCartReady } from "@/components/checkout/useCartReady";
import { hasVerifiedCoa } from "@/components/checkout/coa-lookup";

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Thumb({ item, size }: { item: CartItem; size: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg border border-hairline/70 bg-surface"
      style={{ width: size, height: size }}
    >
      {item.image ? (
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes={`${size}px`}
          className="duotone object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="micro-label">{item.sku.slice(0, 3)}</span>
        </div>
      )}
    </div>
  );
}

/** Satoshi compound name + earned verified mark (only with a real COA). */
function LineName({ item }: { item: CartItem }) {
  return (
    <p className="font-display text-[15px] leading-tight font-semibold tracking-[-0.01em] text-ink">
      {item.name}
      {hasVerifiedCoa(item.productId) && (
        <VerifiedMark label={false} className="ml-1.5 align-[-0.1em]" />
      )}
    </p>
  );
}

function QtyStepper({ item }: { item: CartItem }) {
  const { updateQty } = useCart();
  return (
    <div className="inline-flex items-center rounded-lg border border-hairline bg-surface">
      <button
        type="button"
        aria-label={`Decrease quantity of ${item.name}`}
        className="flex size-8 items-center justify-center text-ink-muted transition-colors hover:text-ink"
        onClick={() => void updateQty(item.key, item.qty - 1)}
      >
        <MinusIcon className="size-3" />
      </button>
      <span className="data-num w-8 text-center text-sm text-ink">
        {item.qty}
      </span>
      <button
        type="button"
        aria-label={`Increase quantity of ${item.name}`}
        className="flex size-8 items-center justify-center text-ink-muted transition-colors hover:text-ink"
        onClick={() => void updateQty(item.key, item.qty + 1)}
      >
        <PlusIcon className="size-3" />
      </button>
    </div>
  );
}

function RemoveButton({ item }: { item: CartItem }) {
  const { removeItem } = useCart();
  return (
    <button
      type="button"
      aria-label={`Remove ${item.name} from cart`}
      className="text-ink-muted transition-colors hover:text-ink"
      onClick={() => void removeItem(item.key)}
    >
      <XIcon className="size-4" />
    </button>
  );
}

function CouponForm() {
  const { totals, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || applying) return;
    setApplying(true);
    applyCoupon(trimmed)
      .then(() => {
        track("coupon_applied", { code: trimmed.toUpperCase() });
        setCode("");
        setError(null);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "That code could not be applied."
        );
      })
      .finally(() => setApplying(false));
  };

  return (
    <div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor="coupon-code" className="sr-only">
          Coupon code
        </label>
        <Input
          id="coupon-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Coupon code"
          autoComplete="off"
          className="data-num h-9 uppercase placeholder:normal-case"
          aria-invalid={error ? true : undefined}
        />
        <Button
          type="submit"
          variant="outline"
          className="h-9 px-4"
          disabled={applying || code.trim().length === 0}
        >
          Apply
        </Button>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-[13px] text-destructive">
          {error}
        </p>
      )}

      {totals.appliedCoupons.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {totals.appliedCoupons.map((c) => (
            <li
              key={c}
              className="batch-id inline-flex items-center gap-1.5 rounded-full border border-hairline bg-bg px-2.5 py-1 text-ink"
            >
              {c}
              <button
                type="button"
                aria-label={`Remove coupon ${c}`}
                className="text-ink-muted transition-colors hover:text-ink"
                onClick={() => void removeCoupon(c)}
              >
                <XIcon className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CartView
// ---------------------------------------------------------------------------

export function CartView() {
  const { items, count, totals } = useCart();
  const ready = useCartReady();
  const mu = totals.currencyMinorUnit;

  if (!ready) {
    return (
      <div aria-busy="true" className="min-h-[40vh]">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-10 h-24 w-full" />
        <Skeleton className="mt-2 h-24 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <FadeIn className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="micro-label">Your cart is empty</p>
        <p className="max-w-[32ch] text-sm text-ink-muted">
          Research compounds you add will appear here.
        </p>
        {/* Primary (green) — the page's one CTA */}
        <Button asChild className="mt-2 h-10 px-6">
          <Link href="/catalog">Browse the catalog</Link>
        </Button>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      {/* Page header */}
      <div className="hairline-b mb-10 flex flex-wrap items-end justify-between gap-4 pb-6">
        <div>
          <p className="micro-label">Order record</p>
          <h1 className="mt-2 text-[clamp(1.9rem,3.4vw,3rem)]">Cart</h1>
        </div>
        <p className="data-num text-[13px] text-ink-muted">
          {count} {count === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* Line items — warm ruled ledger in a soft rounded card on md+,
            stacked rows below. Rows keep their rules; the outer border is
            replaced by the ledger-card container. */}
        <section aria-label="Cart line items">
          <div className="ledger-card hidden md:block">
            <table className="ledger-table">
              <thead>
              <tr>
                <th>Item</th>
                <th className="num">Unit</th>
                <th>Qty</th>
                <th className="num">Total</th>
                <th className="w-10">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.key}>
                  <td>
                    <div className="flex items-center gap-3.5">
                      <Thumb item={item} size={52} />
                      <div className="min-w-0">
                        <LineName item={item} />
                        <p className="micro-label mt-1">{item.dose}</p>
                      </div>
                    </div>
                  </td>
                  <td className="num text-ink-muted">
                    {formatMinor(item.price, mu)}
                  </td>
                  <td>
                    <QtyStepper item={item} />
                  </td>
                  <td className="num text-ink">
                    {formatMinor(item.price * item.qty, mu)}
                  </td>
                  <td className="text-right">
                    <RemoveButton item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>

          {/* Mobile stacked rows */}
          <ul className="hairline-t divide-y divide-hairline md:hidden">
            {items.map((item) => (
              <li key={item.key} className="flex gap-3 py-4">
                <Thumb item={item} size={56} />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <LineName item={item} />
                    <RemoveButton item={item} />
                  </div>
                  <p className="micro-label">{item.dose}</p>
                  <p className="data-num text-[11px] text-ink-muted">
                    {formatMinor(item.price, mu)} each
                  </p>
                  <div className="flex items-center justify-between">
                    <QtyStepper item={item} />
                    <span className="data-num text-sm text-ink">
                      {formatMinor(item.price * item.qty, mu)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-green transition-colors hover:text-green-deep"
            >
              <ArrowLeftIcon className="size-3.5" />
              Continue browsing
            </Link>
          </div>
        </section>

        {/* Summary — a soft record card */}
        <aside aria-label="Order summary" className="plate lg:sticky lg:top-24">
          <div className="plate-field">
            <div className="hairline-b px-5 py-4">
              <h2 className="micro-label">Order summary</h2>
            </div>

            <div className="flex flex-col gap-6 px-5 py-5">
              <CouponForm />
              <FreeShippingProgress totals={totals} />
              <TotalsLedger totals={totals} unitCount={unitCountOf(items)} />

              <Button asChild className="h-11 w-full text-sm">
                <Link
                  href="/checkout"
                  onClick={() =>
                    track("checkout_initiated", {
                      item_count: count,
                      subtotal_minor: totals.itemsSubtotal,
                      total_minor: totals.total,
                    })
                  }
                >
                  Proceed to checkout
                </Link>
              </Button>

              <p className="micro-label text-center">
                {brandConfig.promos.bogo.label} —{" "}
                {brandConfig.promos.bogo.detail}
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* RUO reminder — faint amber wash, ink text (warn-line) */}
      <div className="mt-16 text-center">
        <p className="warn-line inline-block rounded-md px-3 py-1.5 text-[12px] font-medium text-ink">
          {compliance.ruoBanner}
        </p>
      </div>
    </FadeIn>
  );
}
