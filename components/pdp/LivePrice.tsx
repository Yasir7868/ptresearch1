/**
 * LivePrice — WooCommerce's price markup as the live product template prints
 * it: "$129.00 $114.00" with the list price struck and the sale price
 * underlined, one plain price, or a "$14.00 – $24.00" range. Plain component
 * (no hooks), shared by the buy panel, the sticky bar and related cards.
 */

import { formatMinor, formatPriceRange } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PricedVariation {
  priceMinor: number;
  regularPriceMinor: number;
}

export interface PricedItem {
  priceMinor: number;
  regularPriceMinor: number;
  currencyMinorUnit: number;
  variations?: readonly PricedVariation[];
}

export type PriceView =
  | { kind: "single"; price: string; regular: string | null }
  | { kind: "range"; text: string };

/**
 * What to print for an item, or for one of its sizes once picked. With no size
 * picked, a variable item prints its range, struck only when every size shares
 * one price and one list price (WooCommerce's rule).
 */
export function priceView(item: PricedItem, selected?: PricedVariation): PriceView {
  const mu = item.currencyMinorUnit;
  const single = (pay: number, list: number): PriceView => ({
    kind: "single",
    price: formatMinor(pay, mu),
    regular: list > pay ? formatMinor(list, mu) : null,
  });

  if (selected) return single(selected.priceMinor, selected.regularPriceMinor);

  const variations = item.variations ?? [];
  if (variations.length === 0) return single(item.priceMinor, item.regularPriceMinor);

  const pays = new Set(variations.map((v) => v.priceMinor));
  const lists = new Set(variations.map((v) => v.regularPriceMinor));
  if (pays.size === 1 && lists.size === 1) {
    return single(variations[0].priceMinor, variations[0].regularPriceMinor);
  }
  return { kind: "range", text: formatPriceRange(item) };
}

export function LivePrice({
  view,
  className,
  delClassName,
  insClassName,
}: {
  view: PriceView;
  className: string;
  delClassName?: string;
  insClassName?: string;
}) {
  if (view.kind === "range") return <p className={className}>{view.text}</p>;
  if (!view.regular) return <p className={className}>{view.price}</p>;
  return (
    <p className={className}>
      <del aria-hidden="true" className={cn("line-through", delClassName)}>
        {view.regular}
      </del>{" "}
      <span className="sr-only">
        Original price was: {view.regular}. Current price is: {view.price}.
      </span>
      <ins aria-hidden="true" className={cn("underline", insClassName)}>
        {view.price}
      </ins>
    </p>
  );
}
