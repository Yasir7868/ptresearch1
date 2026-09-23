"use client";

/**
 * BulkBuilder — the order builder on /bulk.
 *
 * A filterable table of every purchasable compound with a quantity stepper
 * per row, and a sticky summary rail that recomputes the earned tier on every
 * keystroke. "Add order to cart" pushes each non-zero row through the normal
 * `useCart().addItem` path, so a bulk order is an ordinary cart — the tier is
 * then re-derived by the cart's own math (lib/cart.tsx), never carried over
 * from here. The two agree because both call lib/bulk.ts.
 *
 * Variable products (the GLP compounds) pick a size per row; the row's price
 * and its cart line follow that selection, including its `variationId`, so
 * the future WooCommerce adapter has everything it needs.
 *
 * Money is integer minor units end to end; only `formatMinor` ever produces a
 * string. Every label comes from content/bulk.ts.
 */

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product, ProductVariation } from "@/lib/woo/types";
import { bulkCopy } from "@/content/bulk";
import { brandConfig } from "@/content/brand-config";
import {
  bulkDiscountMinor,
  earnsFreeShipping,
  needsQuote,
  nextTier,
  tierForUnits,
  unitsToNextTier,
} from "@/lib/bulk";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { formatMinor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CONTAINER, Kicker, SERIF } from "@/components/landing/parts";

const copy = bulkCopy.builder;
const summaryCopy = bulkCopy.summary;

/** Largest quantity a single row accepts — a guard, not a stock check. */
const MAX_ROW_QTY = 999;

/** One buildable line: a product plus, for variable products, a chosen size. */
interface Row {
  product: Product;
  variation: ProductVariation | null;
  /** Stable key across re-renders and size changes. */
  key: string;
  size: string;
  priceMinor: number;
}

function rowFor(product: Product, sizeChoice: string | undefined): Row {
  const variations = product.variations ?? [];
  const variation =
    product.kind === "variable" && variations.length > 0
      ? (variations.find((v) => v.size === sizeChoice) ?? variations[0])
      : null;
  return {
    product,
    variation,
    key: String(product.productId),
    size: variation?.size ?? product.size ?? "",
    priceMinor: variation?.priceMinor ?? product.priceMinor,
  };
}

export function BulkBuilder({ products }: { products: Product[] }) {
  const { addItem } = useCart();

  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState("");
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) seen.set(p.categorySlug, p.categoryName);
    return [...seen].map(([slug, name]) => ({ slug, name }));
  }, [products]);

  const rows = useMemo(
    () => products.map((p) => rowFor(p, sizes[String(p.productId)])),
    [products, sizes]
  );

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return rows.filter((row) => {
      if (category && row.product.categorySlug !== category) return false;
      if (!needle) return true;
      return (
        row.product.displayName.toLowerCase().includes(needle) ||
        row.product.categoryName.toLowerCase().includes(needle)
      );
    });
  }, [rows, filter, category]);

  // ── Live order math ──────────────────────────────────────────────────────
  // Derived from every row with a quantity, not just the visible ones: a
  // filter must never silently change what the buyer is about to pay for.
  const order = useMemo(() => {
    const lines = rows.filter((row) => (qty[row.key] ?? 0) > 0);
    const units = lines.reduce((sum, row) => sum + (qty[row.key] ?? 0), 0);
    const subtotal = lines.reduce(
      (sum, row) => sum + row.priceMinor * (qty[row.key] ?? 0),
      0
    );
    const discount = bulkDiscountMinor(subtotal, units);
    return {
      lines,
      units,
      subtotal,
      discount,
      tier: tierForUnits(units),
      total: subtotal - discount,
      freeShipping:
        earnsFreeShipping(units) ||
        subtotal - discount >= brandConfig.promos.freeShipping.thresholdMinor,
    };
  }, [rows, qty]);

  const setRowQty = (key: string, value: number) =>
    setQty((prev) => {
      const next = { ...prev };
      const clamped = Math.min(MAX_ROW_QTY, Math.max(0, Math.trunc(value)));
      if (clamped === 0) delete next[key];
      else next[key] = clamped;
      return next;
    });

  const handleAddAll = async () => {
    if (order.lines.length === 0 || busy) return;
    setBusy(true);
    setStatus("");
    try {
      for (const row of order.lines) {
        const count = qty[row.key] ?? 0;
        await addItem({
          sku: row.product.sku,
          dose: row.size,
          name: row.product.displayName,
          price: row.priceMinor,
          productId: row.product.productId,
          variationId: row.variation?.variationId,
          variation: row.variation
            ? [{ attribute: "Size", value: row.variation.size }]
            : undefined,
          image: row.product.images[0]?.src,
          qty: count,
        });
        track("add_to_cart", {
          sku: row.product.sku,
          dose: row.size,
          qty: count,
          price_cents: row.priceMinor,
        });
      }
      setStatus(copy.added(order.units));
      setQty({});
    } finally {
      setBusy(false);
    }
  };

  const toNext = unitsToNextTier(order.units);
  const upcoming = nextTier(order.units);

  return (
    <section className={cn(CONTAINER, "py-14")}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        {/* ── The table ─────────────────────────────────────────────────── */}
        <div>
          <Kicker>{bulkCopy.page.eyebrow}</Kicker>
          <h2
            className={cn(
              SERIF,
              "mt-1.5 mb-5 text-[clamp(24px,3vw,32px)] tracking-[-0.01em] text-navy-ink"
            )}
          >
            {copy.heading}
          </h2>

          <div className="mb-4 flex flex-wrap gap-3">
            <label className="flex-1 basis-[240px]">
              <span className="sr-only">{copy.searchLabel}</span>
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="h-[46px] w-full rounded-lg border border-rule bg-white px-4 text-[15px] text-navy-ink placeholder:text-steel focus-visible:border-cobalt focus-visible:ring-2 focus-visible:ring-cobalt/30 focus-visible:outline-none"
              />
            </label>
            <label>
              <span className="sr-only">{copy.categoryAll}</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-[46px] rounded-lg border border-rule bg-white px-3 text-[15px] text-navy-ink focus-visible:border-cobalt focus-visible:ring-2 focus-visible:ring-cobalt/30 focus-visible:outline-none"
              >
                <option value="">{copy.categoryAll}</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-rule bg-white">
            {visible.length === 0 ? (
              <p className="px-5 py-10 text-center text-[15px] text-steel">
                {copy.empty}
              </p>
            ) : (
              <ul className="divide-y divide-rule">
                {visible.map((row) => (
                  <BuilderRow
                    key={row.key}
                    row={row}
                    qty={qty[row.key] ?? 0}
                    onQty={(value) => setRowQty(row.key, value)}
                    onSize={(size) =>
                      setSizes((prev) => ({
                        ...prev,
                        [String(row.product.productId)]: size,
                      }))
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── The summary rail ──────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[14px] border border-rule bg-white p-5">
            <h3 className="mb-4 text-[13px] font-extrabold tracking-[0.08em] text-navy uppercase">
              {summaryCopy.heading}
            </h3>

            {order.units === 0 ? (
              <p className="text-[14px] leading-[1.55] text-steel">
                {copy.noSelection}
              </p>
            ) : (
              <dl className="space-y-2.5 text-[15px]">
                <Line label={summaryCopy.units} value={String(order.units)} />
                <Line
                  label={summaryCopy.subtotal}
                  value={formatMinor(order.subtotal)}
                />
                <Line
                  label={summaryCopy.tier}
                  value={
                    order.tier
                      ? `${order.tier.label} · ${order.tier.percentOff}%`
                      : summaryCopy.noTier
                  }
                />
                {order.discount > 0 && order.tier ? (
                  <Line
                    label={summaryCopy.discount(order.tier.percentOff)}
                    value={`−${formatMinor(order.discount)}`}
                    accent
                  />
                ) : null}
                <Line
                  label={summaryCopy.shipping}
                  value={
                    order.freeShipping
                      ? summaryCopy.shippingFree
                      : summaryCopy.shippingAtCheckout
                  }
                />
                <div className="mt-3 flex items-baseline justify-between border-t border-rule pt-3">
                  <dt className="text-[15px] font-extrabold text-navy-ink">
                    {summaryCopy.total}
                  </dt>
                  <dd className="text-[22px] font-extrabold text-navy-ink tabular-nums">
                    {formatMinor(order.total)}
                  </dd>
                </div>
                <p className="text-right text-[13px] text-steel tabular-nums">
                  {summaryCopy.perUnit(
                    formatMinor(Math.round(order.total / order.units))
                  )}
                </p>
              </dl>
            )}

            {/* Progress toward the next rung — the reason to add one more. */}
            {order.units > 0 && toNext !== null && upcoming ? (
              <p className="mt-4 rounded-lg bg-mist px-3.5 py-2.5 text-[13px] font-semibold text-navy">
                {summaryCopy.toNextTier(toNext, upcoming.percentOff)}
              </p>
            ) : null}

            {needsQuote(order.units) ? (
              <p className="mt-4 rounded-lg bg-mist px-3.5 py-2.5 text-[13px] font-semibold text-navy">
                <Link href="#quote" className="text-cobalt hover:underline">
                  {summaryCopy.atTop}
                </Link>
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleAddAll()}
              disabled={order.units === 0 || busy}
              className="mt-5 h-[50px] w-full cursor-pointer rounded-lg bg-cobalt text-[15px] font-bold text-white transition-colors hover:bg-cobalt-bright disabled:cursor-not-allowed disabled:bg-rule disabled:text-steel"
            >
              {busy ? copy.adding : copy.addAll}
            </button>

            {order.units > 0 ? (
              <button
                type="button"
                onClick={() => setQty({})}
                className="mt-2 h-[38px] w-full cursor-pointer rounded-lg text-[14px] font-semibold text-steel transition-colors hover:text-navy"
              >
                {copy.clearAll}
              </button>
            ) : null}

            <p className="mt-4 text-[12px] leading-[1.5] text-steel">
              {summaryCopy.estimateNote}
            </p>
            <p className="mt-2 text-[12px] leading-[1.5] text-steel">
              {summaryCopy.couponNote(brandConfig.promos.coupon.code)}
            </p>
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {status}
          </p>
          {status ? (
            <p className="mt-3 rounded-lg border border-ok/30 bg-ok/10 px-3.5 py-2.5 text-[14px] font-semibold text-ok">
              {status}
            </p>
          ) : null}
        </aside>
      </div>

      <p className="mt-6 text-[13px] text-steel">{bulkCopy.home.note}</p>
    </section>
  );
}

function Line({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-steel-ink">{label}</dt>
      <dd
        className={cn(
          "font-semibold tabular-nums",
          accent ? "text-ok" : "text-navy-ink"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function BuilderRow({
  row,
  qty,
  onQty,
  onSize,
}: {
  row: Row;
  qty: number;
  onQty: (value: number) => void;
  onSize: (size: string) => void;
}) {
  const { product } = row;
  const image = product.images[0];
  const variations = product.variations ?? [];
  const unavailable = !product.isInStock || !product.isPurchasable;
  const qtyId = `bulk-qty-${row.key}`;

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-4 px-4 py-3.5",
        qty > 0 && "bg-frost"
      )}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-frost">
        {image ? (
          <Image
            src={image.src}
            alt=""
            fill
            sizes="56px"
            className={cn("object-cover", unavailable && "opacity-45")}
          />
        ) : null}
      </div>

      <div className="min-w-[180px] flex-1">
        <Link
          href={`/product/${product.slug}`}
          className="text-[15px] font-extrabold text-navy-ink hover:text-cobalt"
        >
          {product.displayName}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-steel">
          <span>{product.categoryName}</span>
          {product.coaUrl ? (
            <span className="rounded-xs border border-rule bg-white px-1.5 py-px text-[11px] font-bold text-navy">
              {copy.coaChip} <span aria-hidden="true">✓</span>
            </span>
          ) : null}
          <span className={unavailable ? "text-steel" : "text-ok font-bold"}>
            {unavailable ? copy.outOfStock : copy.inStock}
          </span>
        </p>
      </div>

      {variations.length > 0 ? (
        <label className="shrink-0">
          <span className="sr-only">
            {copy.sizeLabel} — {product.displayName}
          </span>
          <select
            value={row.size}
            onChange={(e) => onSize(e.target.value)}
            className="h-[40px] rounded-lg border border-rule bg-white px-2.5 text-[14px] text-navy-ink focus-visible:border-cobalt focus-visible:ring-2 focus-visible:ring-cobalt/30 focus-visible:outline-none"
          >
            {variations.map((v) => (
              <option key={v.variationId} value={v.size}>
                {v.size}
              </option>
            ))}
          </select>
        </label>
      ) : row.size ? (
        <span className="w-[64px] shrink-0 text-[14px] text-steel tabular-nums">
          {row.size}
        </span>
      ) : null}

      <span className="w-[86px] shrink-0 text-right text-[15px] font-semibold text-navy-ink tabular-nums">
        {formatMinor(row.priceMinor)}
      </span>

      <div className="flex shrink-0 items-center gap-1.5">
        <label htmlFor={qtyId} className="sr-only">
          {copy.qtyLabel} — {product.displayName}
        </label>
        <button
          type="button"
          onClick={() => onQty(qty - 1)}
          disabled={qty === 0 || unavailable}
          aria-label={`−1 ${product.displayName}`}
          className="h-[40px] w-[36px] cursor-pointer rounded-lg border border-rule text-[18px] leading-none font-bold text-navy transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-not-allowed disabled:text-steel disabled:hover:border-rule"
        >
          −
        </button>
        <input
          id={qtyId}
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_ROW_QTY}
          value={qty === 0 ? "" : qty}
          placeholder="0"
          disabled={unavailable}
          onChange={(e) => onQty(Number(e.target.value))}
          className="h-[40px] w-[62px] rounded-lg border border-rule bg-white text-center text-[15px] font-semibold text-navy-ink tabular-nums focus-visible:border-cobalt focus-visible:ring-2 focus-visible:ring-cobalt/30 focus-visible:outline-none disabled:bg-mist"
        />
        <button
          type="button"
          onClick={() => onQty(qty + 1)}
          disabled={unavailable}
          aria-label={`+1 ${product.displayName}`}
          className="h-[40px] w-[36px] cursor-pointer rounded-lg border border-rule text-[18px] leading-none font-bold text-navy transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-not-allowed disabled:text-steel disabled:hover:border-rule"
        >
          +
        </button>
      </div>

      <span className="w-[92px] shrink-0 text-right text-[15px] font-extrabold text-navy-ink tabular-nums">
        {qty > 0 ? formatMinor(row.priceMinor * qty) : "—"}
      </span>
    </li>
  );
}
