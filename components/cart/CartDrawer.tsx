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
 * Copy follows the live side cart ("Your Cart", "View Cart", "Continue
 * Shopping", "Shipping, taxes, and discounts calculated at checkout.").
 *
 * NOTE on totals: everything shown here comes from context.totals, which is
 * ADAPTER-CANONICAL. Today the LocalStorage adapter computes PT25 /
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
import { sideCartCopy } from "@/content/site-copy";
import { formatMinor } from "@/components/checkout/money";
import { TotalsLedger } from "@/components/checkout/TotalsLedger";
import { LineMeta } from "@/components/checkout/LineMeta";
import { FreeShippingProgress } from "@/components/checkout/FreeShippingProgress";
import { VerifiedMark } from "@/components/plate/VerifiedMark";
import { hasVerifiedCoa } from "@/components/checkout/coa-lookup";

function LineItem({ item }: { item: CartItem }) {
  const { updateQty, removeItem, totals } = useCart();
  const mu = totals.currencyMinorUnit;

  return (
    <li className="flex gap-3 py-4">
      {/* Thumb — a mini specimen field: soft-rounded, hairline frame, true-colour
          vial (matches the catalog card it was added from; DESIGN §5). */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-hairline/70 bg-surface">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="56px"
            className="object-cover"
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

        <LineMeta item={item} />

        {item.qty > 1 && (
          <p className="data-mono text-[11px] text-ink-muted">
            {formatMinor(item.price, mu)} each
          </p>
        )}

        <div className="flex items-center justify-between">
          {/* Qty stepper — retired on a sold-individually line (a gift card),
              which is always exactly one. */}
          {item.soldIndividually ? (
            <span className="data-mono rounded-lg border border-hairline px-2 py-1 text-xs text-ink-muted">
              {item.qty}
            </span>
          ) : (
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
          )}

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
            {sideCartCopy.title}
            <span className="micro-label">{count}</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            {items.length === 0 ? sideCartCopy.empty : sideCartCopy.note}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="micro-label">{sideCartCopy.empty}</p>
            <div className="mt-2 flex flex-col gap-2">
              <Button asChild>
                <Link href="/catalog" onClick={() => onOpenChange(false)}>
                  {sideCartCopy.returnToShop}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/catalog" onClick={() => onOpenChange(false)}>
                  {sideCartCopy.continueShopping}
                </Link>
              </Button>
            </div>
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
              <TotalsLedger totals={totals} />
              <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
                {sideCartCopy.note}
              </p>

              <Button asChild variant="outline" className="mt-4 h-10 w-full">
                <Link href="/cart" onClick={() => onOpenChange(false)}>
                  {sideCartCopy.viewCart}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="mt-2 h-10 w-full">
                <Link href="/catalog" onClick={() => onOpenChange(false)}>
                  {sideCartCopy.continueShopping}
                </Link>
              </Button>
              <Button asChild className="mt-2 h-10 w-full">
                <Link href="/checkout" onClick={() => onOpenChange(false)}>
                  {sideCartCopy.checkout}
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
