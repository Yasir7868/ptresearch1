"use client";

/**
 * CartDrawer — right-side cart sheet bound to useCart().
 *
 * Controlled by the Header (open/onOpenChange). Renders line items with qty
 * steppers, adapter-canonical totals, a free-shipping progress bar, and the
 * checkout CTA. Money, totals rows, and the free-shipping progress are the
 * SAME shared components /cart and /checkout use (components/checkout/*), so
 * the drawer and the full-page cart can never drift.
 *
 * NOTE on totals: everything shown here comes from context.totals, which is
 * ADAPTER-CANONICAL. Today the LocalStorage adapter computes BOGO-50% / PT25 /
 * free-shipping locally; the future WooCommerce adapter returns SERVER-
 * canonical totals (WC Store API) and this component needs zero changes.
 */

import Image from "next/image";
import Link from "next/link";
import { MinusIcon, PlusIcon, XIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/lib/cart";
import { brandConfig } from "@/content/brand-config";
import { compliance } from "@/content/compliance";
import { formatMinor } from "@/components/checkout/money";
import { TotalsLedger } from "@/components/checkout/TotalsLedger";
import { FreeShippingProgress } from "@/components/checkout/FreeShippingProgress";
import { unitCountOf } from "@/components/checkout/demo-order";
import { VerifiedMark } from "@/components/plate/VerifiedMark";
import { hasVerifiedCoa } from "@/components/checkout/coa-lookup";

function LineItem({ item }: { item: CartItem }) {
  const { updateQty, removeItem, totals } = useCart();
  const mu = totals.currencyMinorUnit;

  return (
    <li className="flex gap-3 py-4">
      {/* Thumb — a mini specimen field: soft-rounded, hairline frame, duotoned vial */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-hairline/70 bg-surface">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="56px"
            className="duotone object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="micro-label">{item.sku.slice(0, 3)}</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display truncate text-[15px] leading-tight font-semibold tracking-[-0.01em] text-ink">
            {item.name}
          </p>
          <button
            type="button"
            aria-label={`Remove ${item.name} from cart`}
            className="text-ink-muted transition-colors hover:text-ink"
            onClick={() => void removeItem(item.key)}
          >
            <XIcon className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <p className="micro-label">{item.dose}</p>
          {/* Earned verified mark — renders ONLY where a real COA exists
              (D3 trust graft #2: plates, PDP spec area, cart line items). */}
          {hasVerifiedCoa(item.productId) && <VerifiedMark label={false} />}
        </div>

        {item.qty > 1 && (
          <p className="data-mono text-[11px] text-ink-muted">
            {formatMinor(item.price, mu)} each
          </p>
        )}

        <div className="flex items-center justify-between">
          {/* Qty stepper */}
          <div className="flex items-center rounded-lg border border-hairline">
            <button
              type="button"
              aria-label="Decrease quantity"
              className="flex size-7 items-center justify-center text-ink-muted transition-colors hover:text-ink"
              onClick={() => void updateQty(item.key, item.qty - 1)}
            >
              <MinusIcon className="size-3" />
            </button>
            <span className="data-mono w-7 text-center text-xs text-ink">
              {item.qty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              className="flex size-7 items-center justify-center text-ink-muted transition-colors hover:text-ink"
              onClick={() => void updateQty(item.key, item.qty + 1)}
            >
              <PlusIcon className="size-3" />
            </button>
          </div>

          <span className="data-mono text-sm text-ink">
            {formatMinor(item.price * item.qty, mu)}
          </span>
        </div>
      </div>
    </li>
  );
}

export function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { items, count, totals } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* duration-300 smooths the slide/fade vs the 200ms component default;
          rounded-l-2xl = the soft sheet edge (20px, band-inner scale) */}
      <SheetContent
        side="right"
        className="flex flex-col rounded-l-2xl bg-bg duration-300"
      >
        <SheetHeader className="hairline-b">
          <SheetTitle className="flex items-baseline gap-2 text-ink">
            Cart
            <span className="micro-label">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </SheetTitle>
          <SheetDescription className="micro-label pt-1">
            {compliance.ruoBanner}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="micro-label">Your cart is empty</p>
            <p className="max-w-[26ch] text-sm text-ink-muted">
              Research compounds you add will appear here.
            </p>
            {/* Primary (accent) — the drawer's one CTA when empty */}
            <Button asChild className="mt-2">
              <Link href="/catalog" onClick={() => onOpenChange(false)}>
                Browse the catalog
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Free-shipping progress — shared with /cart */}
            <div className="hairline-b px-4 pb-4">
              <FreeShippingProgress totals={totals} />
            </div>

            {/* Line items */}
            <ul className="flex-1 divide-y divide-hairline overflow-y-auto px-4">
              {items.map((item) => (
                <LineItem key={item.key} item={item} />
              ))}
            </ul>

            {/* Totals — shared ledger rows (adapter-canonical) */}
            <div className="hairline-t px-4 py-4">
              <TotalsLedger totals={totals} unitCount={unitCountOf(items)} />

              <Button asChild className="mt-4 h-10 w-full">
                <Link href="/checkout" onClick={() => onOpenChange(false)}>
                  Checkout
                </Link>
              </Button>
              <Button asChild variant="outline" className="mt-2 h-10 w-full">
                <Link href="/cart" onClick={() => onOpenChange(false)}>
                  View full cart
                </Link>
              </Button>
              <p className="micro-label mt-3 text-center">
                {brandConfig.promos.bogo.label} —{" "}
                {brandConfig.promos.bogo.detail}
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
