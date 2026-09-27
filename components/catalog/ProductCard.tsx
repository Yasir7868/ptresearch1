"use client";

/**
 * ProductCard — one specimen plate of the catalog grid (D3 "Reference Grade").
 *
 * A thin wrapper around the system SpecimenPlate component (DESIGN §4): the
 * vial on --surface, a hairline rule, then the typeset record —
 * SKU micro-label, compound name in semibold Satoshi, and a Satoshi
 * tabular data line (purity · sizes), with the price line and a buy control
 * beneath it.
 *
 * THE VIAL IS ZOOMED. The WooCommerce photographs are all shot to one studio
 * template with a lot of near-white air around the vial, so a whole-frame
 * `object-contain` rendered the specimen at roughly a fifth of the card width.
 * The plate now frames a MEASURED crop window instead — see
 * components/plate/vial-crop.ts for the measurement and the arithmetic.
 *
 * Trust rules (hard):
 *   - The earned VerifiedMark renders ONLY when a real `coaUrl` exists
 *     (SpecimenPlate `verified` prop) — its absence carries meaning.
 *   - The sale pill and the struck-through list price are drawn ONLY from
 *     WooCommerce's own regular/sale prices (lib/format.ts `priceLine`), never
 *     from an invented "was" figure. No discount, no pill.
 *   - Out-of-stock is a muted, honest state: dimmed vial, muted name, the live
 *     "Out of stock" label in place of the price, and a disabled control.
 *
 * Client component: the in-grid Add to cart talks to useCart() and opens the
 * drawer, exactly as the PDP BuyPanel does. Its parent (FilterGrid) is already
 * a client component, so this costs no extra boundary. Because a button cannot
 * be nested inside the card's link, passing `actions` puts the plate into
 * SpecimenPlate's stretched-link layout.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/woo/types";
import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import {
  VIAL_FIELD_RATIO,
  VIAL_GRID_SIZES,
  VIAL_ZOOM,
} from "@/components/plate/vial-crop";
import { requestCartDrawerOpen } from "@/components/cart/drawer-events";
import { Button } from "@/components/ui/button";
import { catalogPage, productPage } from "@/content/site-copy";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { priceLine } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatPurity } from "./format";

/** How long the "Added to cart" confirmation stays up. Matches the PDP. */
const ADDED_MS = 2000;

/** Quiet ink interpunct between data-line entries. */
function Sep() {
  return (
    <span aria-hidden="true" className="px-1.5 text-ink-muted/50">
      ·
    </span>
  );
}

/**
 * Discount pill — navy fill, mint figure. Green is the only interactive colour
 * on paper and amber is never text here (DESIGN §2), so the pill matches the
 * active category chip rather than shouting in orange.
 */
function SalePill({ percentOff }: { percentOff: number }) {
  return (
    <span className="flex items-center rounded-full bg-green px-2 py-0.5 shadow-[0_1px_2px_rgba(16,21,29,.08)]">
      <span className="sr-only">{catalogPage.saleBadge}</span>
      <span className="data-num text-[10px] font-medium tracking-[0.04em] text-mint">
        {/* U+2212 minus — a figure dash, not a hyphen, beside tabular digits */}
        {"−"}
        {percentOff}%
      </span>
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    []
  );

  const image = product.images[0];
  const outOfStock = !product.isInStock;
  const unavailable = outOfStock || !product.isPurchasable;
  const purity = formatPurity(product.purity);
  const { price, regular, percentOff } = priceLine(product);

  // Variable products need a size chosen, which is the PDP's job — the live
  // store labels that control "Select options".
  const needsOptions = product.kind === "variable";
  const sizes = (product.variations ?? []).map((v) => v.size).filter(Boolean);

  const handleAdd = async () => {
    await addItem({
      sku: product.sku,
      dose: "",
      name: product.displayName,
      price: product.priceMinor,
      productId: product.productId,
      image: image?.src,
      qty: 1,
    });
    track("add_to_cart", {
      sku: product.sku,
      dose: "",
      qty: 1,
      price_cents: product.priceMinor,
    });
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), ADDED_MS);
    // Surface the result immediately — open the cart drawer.
    requestCartDrawerOpen();
  };

  return (
    <SpecimenPlate
      className="flex h-full flex-col"
      href={`/product/${product.slug}`}
      ariaLabel={product.displayName}
      image={
        image
          ? { src: image.src, alt: image.alt || product.displayName }
          : undefined
      }
      field={image ? undefined : <span className="micro-label">No image</span>}
      fieldRatio={VIAL_FIELD_RATIO}
      imageZoom={image ? VIAL_ZOOM : undefined}
      imageSizes={VIAL_GRID_SIZES}
      /* TRUE COLOUR, not #pt-duotone. The duotone existed to reconcile vials
         "shot on different days under different lights" (DESIGN §5) — but the
         store has since re-shot the whole catalog to ONE studio template, so
         there is no mismatch left to mask and the filter only added a blue
         cast over already brand-navy labels. Same exemption Hero, TestingStory
         and About already take, and the same call the redesigned PDP carousel
         makes. See DESIGN §5 (2026-09-21). */
      duotone={false}
      fieldClassName={outOfStock ? "[&_img]:opacity-45" : undefined}
      verified={Boolean(product.coaUrl)}
      badge={
        percentOff !== null && !outOfStock ? (
          <SalePill percentOff={percentOff} />
        ) : undefined
      }
      // No category name on grid cards (owner request 2026-09-27) — SKU only.
      eyebrow={
        product.sku ? (
          <span className="block truncate">{product.sku}</span>
        ) : undefined
      }
      title={
        // The grid is two-up on phones, so the name steps down to fit.
        <span
          className={cn(
            "block max-sm:text-[1rem] max-sm:leading-snug",
            outOfStock && "text-ink-muted"
          )}
        >
          {product.displayName}
        </span>
      }
      record={
        <span className="flex flex-wrap items-baseline">
          {purity && <span className="text-green">{purity}</span>}
          {purity && sizes.length > 0 && <Sep />}
          {sizes.length > 0 && (
            <span className="text-ink-muted">{sizes.join(" / ")}</span>
          )}
        </span>
      }
      footer={
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {outOfStock ? (
            <span className="data-num text-[15px] text-ink-muted">
              {productPage.outOfStockButton}
            </span>
          ) : (
            <>
              <span className="data-num text-[17px] font-medium text-ink">
                {price}
              </span>
              {regular && (
                <s className="data-num text-[13px] text-ink-muted/70 decoration-ink-muted/50">
                  {regular}
                </s>
              )}
            </>
          )}
        </span>
      }
      actions={
        unavailable ? (
          <Button
            type="button"
            disabled
            className="h-10 w-full text-[13px]"
            aria-label={`${product.displayName} — ${productPage.outOfStockButton}`}
          >
            {productPage.outOfStockButton}
          </Button>
        ) : needsOptions ? (
          <Button
            asChild
            variant="outline"
            className="h-10 w-full text-[13px]"
          >
            <Link href={`/product/${product.slug}`}>
              {catalogPage.selectOptions}
              <span className="sr-only"> — {product.displayName}</span>
            </Link>
          </Button>
        ) : (
          <>
            <Button
              type="button"
              onClick={() => void handleAdd()}
              className="h-10 w-full text-[13px]"
              aria-label={`${catalogPage.addToCart} — ${product.displayName}`}
            >
              {added ? "Added to cart" : catalogPage.addToCart}
            </Button>
            <span aria-live="polite" className="sr-only">
              {added ? `${product.displayName} added to cart` : ""}
            </span>
          </>
        )
      }
    />
  );
}
