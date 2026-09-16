/**
 * ProductCard — one specimen plate of the catalog grid (D3 "Reference Grade").
 *
 * A thin wrapper around the system SpecimenPlate component (DESIGN §4):
 * duotoned vial on --surface with crop-mark corner ticks, hairline rule, then
 * the typeset record — category micro-label + SKU, compound name in semibold
 * Satoshi, and a Satoshi tabular data line (sizes · purity · price).
 *
 * Trust rules (hard):
 *   - The earned VerifiedMark renders ONLY when a real `coaUrl` exists
 *     (SpecimenPlate `verified` prop) — its absence carries meaning.
 *   - Out-of-stock is a muted, honest state: dimmed vial, muted name,
 *     "Out of stock" in place of the price. Nothing is papered over.
 *
 * Rendered inside FilterGrid (client), so this compiles into the client
 * bundle — it holds no state of its own; all hover behaviour is the plate's
 * CSS (lift, crop-tick extend, duotone develop), reduced-motion-safe.
 */

import type { Product } from "@/lib/woo/types";
import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import { cn } from "@/lib/utils";
import { formatMinorPrice, formatPurity } from "./format";

/** Quiet ink interpunct between data-line entries. */
function Sep() {
  return (
    <span aria-hidden="true" className="px-1.5 text-ink-muted/50">
      ·
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const outOfStock = !product.isInStock;
  const purity = formatPurity(product.purity);
  const price = formatMinorPrice(product.priceMinor, product.currencyMinorUnit);
  /** Real size count for the variable products; simple products carry no
      per-size data in the model — nothing is invented for them. */
  const sizeCount =
    product.kind === "variable" ? (product.variations?.length ?? 0) : 0;

  return (
    <SpecimenPlate
      href={`/product/${product.slug}`}
      image={
        image
          ? { src: image.src, alt: image.alt || product.displayName }
          : undefined
      }
      field={
        image ? undefined : <span className="micro-label">No image</span>
      }
      imageSizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
      fieldClassName={outOfStock ? "[&_img]:opacity-45" : undefined}
      verified={Boolean(product.coaUrl)}
      eyebrow={
        <span className="flex min-w-0 items-baseline justify-between gap-3">
          {/* truncate (not wrap): two-line micro-labels break the row rhythm */}
          <span className="min-w-0 truncate">{product.categoryName}</span>
          {product.sku && (
            <span className="hidden shrink-0 sm:inline">{product.sku}</span>
          )}
        </span>
      }
      title={
        <span className={cn(outOfStock && "text-ink-muted")}>
          {product.displayName}
        </span>
      }
      record={
        <span className="flex flex-wrap items-baseline">
          {sizeCount > 0 && (
            <>
              <span>
                {sizeCount} {sizeCount === 1 ? "size" : "sizes"}
              </span>
              <Sep />
            </>
          )}
          {purity && (
            <>
              <span className="text-green">{purity}</span>
              <Sep />
            </>
          )}
          {outOfStock ? (
            <span>Out of stock</span>
          ) : (
            <span className="text-ink">
              {product.kind === "variable" && (
                <span className="font-normal text-ink-muted">from </span>
              )}
              {price}
            </span>
          )}
        </span>
      }
    />
  );
}
