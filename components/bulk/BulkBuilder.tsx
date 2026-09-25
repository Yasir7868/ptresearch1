"use client";

/**
 * BulkBuilder — the product grid and order rail on /bulk.
 *
 * Built to the reference bulk page the owner supplied (2026-09-25): category
 * pills, a card per compound with its strengths as selectable rows, a
 * per-unit bulk price against the struck list price, and one "Add N units"
 * action. The order rail on the right keeps a running count, the tier chips
 * and the totals.
 *
 * Structure and behaviour follow the reference; the palette is this site's
 * (DESIGN.md §0) — navy where the reference uses black — so the page belongs
 * to the storefront rather than looking borrowed.
 *
 * THE PRICING RULE, which the whole UI exists to make obvious: a tier is
 * earned PER PRODUCT, counted across that product's strengths. Ten vials of
 * one compound qualify however they are split between 10mg and 30mg; one vial
 * each of ten compounds does not. Cards show the bulk unit price they would
 * reach, the rail shows what has actually been earned, and a product still
 * short of the minimum is named rather than silently charged full price.
 *
 * All arithmetic comes from lib/bulk.ts, the same module the cart and the
 * server's order pricing use, so nothing here can quote a discount checkout
 * will not honour. Money is integer minor units throughout.
 */

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  VIAL_FIELD_RATIO,
  VIAL_GRID_SIZES,
  VIAL_ZOOM,
} from "@/components/plate/vial-crop";
import type { Product, ProductVariation } from "@/lib/woo/types";
import { bulkCategoryLabels, bulkCopy, bulkMinUnits } from "@/content/bulk";
import { brandConfig } from "@/content/brand-config";
import {
  bulkDiscountMinor,
  bulkGroups,
  bulkLadder,
  earnsFreeShipping,
  tierForUnits,
  unitsToNextTier,
  type BulkLine,
} from "@/lib/bulk";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { formatMinor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CONTAINER } from "@/components/landing/parts";

const copy = bulkCopy.builder;
const rail = bulkCopy.rail;

/** The first rung — what a card advertises before anything is in the order. */
const ENTRY_TIER = bulkLadder()[0]!;

/** What `.plate-zoom` reads (components/plate/vial-crop.ts). */
const VIAL_FRAME = {
  "--plate-zoom": VIAL_ZOOM.scale,
  "--plate-zoom-y": `${VIAL_ZOOM.offsetY}%`,
} as CSSProperties;

/** One selectable strength of a product. */
interface Strength {
  /** Undefined on a simple product, which has no variation to reference. */
  variationId?: number;
  label: string;
  priceMinor: number;
  regularPriceMinor: number;
}

/** A line the buyer has put in the order, keyed by product + strength. */
interface OrderLine {
  key: string;
  product: Product;
  strength: Strength;
  qty: number;
}

function strengthsOf(product: Product): Strength[] {
  const variations = product.variations ?? [];
  if (product.kind === "variable" && variations.length > 0) {
    return variations.map((v: ProductVariation) => ({
      variationId: v.variationId,
      label: v.size,
      priceMinor: v.priceMinor,
      regularPriceMinor: v.regularPriceMinor,
    }));
  }
  return [
    {
      label: product.size ?? "",
      priceMinor: product.priceMinor,
      regularPriceMinor: product.regularPriceMinor,
    },
  ];
}

/** The unit price once `percentOff` is applied. Floor, as the cart does. */
function discountedUnit(priceMinor: number, percentOff: number): number {
  return priceMinor - Math.floor((priceMinor * percentOff) / 100);
}

function lineKey(productId: number, strength: Strength): string {
  return `${productId}__${strength.variationId ?? strength.label}`;
}

export function BulkBuilder({ products }: { products: Product[] }) {
  const { addItem } = useCart();

  const [category, setCategory] = useState("");
  const [picked, setPicked] = useState<Record<number, string>>({});
  const [order, setOrder] = useState<Record<string, OrderLine>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      seen.set(p.categorySlug, bulkCategoryLabels[p.categorySlug] ?? p.categoryName);
    }
    return [...seen].map(([slug, label]) => ({ slug, label }));
  }, [products]);

  const visible = useMemo(
    () => (category ? products.filter((p) => p.categorySlug === category) : products),
    [products, category]
  );

  // ── The order, priced ────────────────────────────────────────────────────
  const lines: OrderLine[] = useMemo(() => Object.values(order), [order]);

  const summary = useMemo(() => {
    const bulkLines: BulkLine[] = lines.map((l) => ({
      productId: l.product.productId,
      price: l.strength.priceMinor,
      qty: l.qty,
    }));

    const subtotal = lines.reduce(
      (sum, l) => sum + l.strength.priceMinor * l.qty,
      0
    );
    const discount = bulkDiscountMinor(bulkLines);
    const groups = bulkGroups(bulkLines);
    const units = lines.reduce((sum, l) => sum + l.qty, 0);
    const freeShipping =
      earnsFreeShipping(bulkLines) ||
      subtotal - discount >= brandConfig.promos.freeShipping.thresholdMinor;

    return { bulkLines, subtotal, discount, groups, units, freeShipping };
  }, [lines]);

  /** Units already in the order for one product, across its strengths. */
  const unitsForProduct = (productId: number): number =>
    lines.reduce(
      (sum, l) => (l.product.productId === productId ? sum + l.qty : sum),
      0
    );

  const addUnits = (product: Product, strength: Strength, qty: number) => {
    const key = lineKey(product.productId, strength);
    setOrder((prev) => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: existing
          ? { ...existing, qty: existing.qty + qty }
          : { key, product, strength, qty },
      };
    });
    setStatus(copy.added(product.displayName, qty));
  };

  const removeProductLine = (key: string) =>
    setOrder((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const handleAddAll = async () => {
    if (lines.length === 0 || busy) return;
    setBusy(true);
    try {
      for (const line of lines) {
        await addItem({
          sku: line.product.sku,
          dose: line.strength.label,
          name: line.product.displayName,
          price: line.strength.priceMinor,
          productId: line.product.productId,
          ...(line.strength.variationId !== undefined
            ? { variationId: line.strength.variationId }
            : {}),
          ...(line.strength.variationId !== undefined
            ? { variation: [{ attribute: "Size", value: line.strength.label }] }
            : {}),
          image: line.product.images[0]?.src,
          qty: line.qty,
        });
        track("add_to_cart", {
          sku: line.product.sku,
          dose: line.strength.label,
          qty: line.qty,
          price_cents: line.strength.priceMinor,
        });
      }
      setStatus(rail.units(summary.units) + " added to cart");
      setOrder({});
    } finally {
      setBusy(false);
    }
  };

  /** Products in the order that have not reached the per-product minimum. */
  const shortfalls = summary.groups
    .filter((g) => g.tier === null)
    .map((g) => {
      const product = lines.find((l) => l.product.productId === g.productId)?.product;
      return {
        name: product?.displayName ?? "",
        needed: bulkMinUnits - g.units,
      };
    })
    .filter((s) => s.name && s.needed > 0);

  const anyQualifies = summary.groups.some((g) => g.tier !== null);

  return (
    <section className={cn(CONTAINER, "py-10")}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          {/* ── Category pills ─────────────────────────────────────────── */}
          <nav aria-label={copy.searchLabel} className="mb-6 flex flex-wrap gap-2.5">
            <FilterPill
              active={category === ""}
              onClick={() => setCategory("")}
              label={copy.filterAll}
            />
            {categories.map((c) => (
              <FilterPill
                key={c.slug}
                active={category === c.slug}
                onClick={() => setCategory(c.slug)}
                label={c.label}
              />
            ))}
          </nav>

          {/* ── Product grid ───────────────────────────────────────────── */}
          {visible.length === 0 ? (
            <p className="rounded-[14px] border border-rule bg-white px-5 py-10 text-center text-[15px] text-steel">
              {copy.empty}
            </p>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-5">
              {visible.map((product) => (
                <li key={product.productId}>
                  <BulkCard
                    product={product}
                    pickedLabel={picked[product.productId]}
                    onPick={(label) =>
                      setPicked((p) => ({ ...p, [product.productId]: label }))
                    }
                    inOrder={unitsForProduct(product.productId)}
                    onAdd={(strength) => addUnits(product, strength, bulkMinUnits)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Order rail ───────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[18px] border border-rule bg-white p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[18px] font-extrabold text-navy-ink">
                {rail.heading}
              </h2>
              <span className="text-[14px] text-steel tabular-nums">
                {rail.units(summary.units)}
              </span>
            </div>

            {lines.length === 0 ? (
              <div className="mt-4 rounded-[14px] border border-dashed border-rule px-5 py-7 text-center">
                <p className="text-[14px] leading-[1.6] text-steel-ink">
                  {rail.emptyLine1}
                </p>
                <p className="text-[14px] leading-[1.6] text-steel-ink">
                  {rail.emptyLine2}
                </p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-rule border-y border-rule">
                {lines.map((line) => {
                  const group = summary.groups.find(
                    (g) => g.productId === line.product.productId
                  );
                  const tier = group?.tier ?? null;
                  const unit = tier
                    ? discountedUnit(line.strength.priceMinor, tier.percentOff)
                    : line.strength.priceMinor;
                  return (
                    <li key={line.key} className="flex gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-navy-ink">
                          {line.product.displayName}
                        </p>
                        <p className="text-[13px] text-steel tabular-nums">
                          {line.strength.label} · {line.qty} ×{" "}
                          {formatMinor(unit)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-navy-ink tabular-nums">
                          {formatMinor(unit * line.qty)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeProductLine(line.key)}
                          className="cursor-pointer text-[12px] text-steel underline-offset-2 hover:text-navy hover:underline"
                        >
                          {copy.remove}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Tier chips — the offer, always visible. */}
            <div className="mt-4 flex flex-wrap gap-2">
              {bulkLadder().map((tier, index) => {
                const earned = summary.groups.some(
                  (g) => g.tier && g.tier.minUnits >= tier.minUnits
                );
                return (
                  <span
                    key={tier.code}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-[13px] font-bold tabular-nums",
                      index === 0
                        ? "bg-navy text-white"
                        : "bg-ok/12 text-ok",
                      earned && "ring-2 ring-cobalt ring-offset-1"
                    )}
                  >
                    {tier.chip}
                  </span>
                );
              })}
            </div>

            <p className="mt-3 text-[12px] leading-[1.5] text-steel">
              {rail.finePrint}
            </p>

            {/* Anything in the order still short of its own minimum. */}
            {shortfalls.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {shortfalls.map((s) => (
                  <li
                    key={s.name}
                    className="rounded-lg bg-mist px-3 py-2 text-[12px] leading-[1.45] font-semibold text-navy"
                  >
                    {rail.belowMinimum(s.name, s.needed)}
                  </li>
                ))}
              </ul>
            )}

            {lines.length > 0 && (
              <dl className="mt-4 space-y-2 border-t border-rule pt-4 text-[14px]">
                <Row label={rail.subtotal} value={formatMinor(summary.subtotal)} />
                {summary.discount > 0 && (
                  <Row
                    label={rail.discount}
                    value={`−${formatMinor(summary.discount)}`}
                    accent
                  />
                )}
                <Row
                  label={rail.shipping}
                  value={
                    summary.freeShipping
                      ? rail.shippingFree
                      : rail.shippingAtCheckout
                  }
                />
                <div className="flex items-baseline justify-between border-t border-rule pt-2.5">
                  <dt className="font-extrabold text-navy-ink">{rail.total}</dt>
                  <dd className="text-[20px] font-extrabold text-navy-ink tabular-nums">
                    {formatMinor(summary.subtotal - summary.discount)}
                  </dd>
                </div>
              </dl>
            )}

            <button
              type="button"
              onClick={() => void handleAddAll()}
              disabled={!anyQualifies || busy}
              className="mt-5 h-[52px] w-full cursor-pointer rounded-[12px] bg-navy text-[15px] font-bold text-white transition-colors hover:bg-navy-ink disabled:cursor-not-allowed disabled:bg-rule disabled:text-steel"
            >
              {busy ? rail.ctaBusy : anyQualifies ? rail.cta : rail.ctaEmpty}
            </button>

            {lines.length > 0 && (
              <button
                type="button"
                onClick={() => setOrder({})}
                className="mt-2 h-[36px] w-full cursor-pointer text-[13px] font-semibold text-steel transition-colors hover:text-navy"
              >
                {rail.clear}
              </button>
            )}

            <p className="mt-4 text-[12px] leading-[1.5] text-steel">
              {rail.estimateNote}
            </p>
            <p className="mt-2 text-[12px] leading-[1.5] text-steel">
              {rail.couponNote(brandConfig.promos.coupon.code)}
            </p>
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {status}
          </p>
        </aside>
      </div>
    </section>
  );
}

function Row({
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

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "cursor-pointer rounded-full border px-4.5 py-2 text-[14px] font-semibold transition-colors",
        active
          ? "border-navy-ink bg-navy-ink text-white"
          : "border-rule bg-white text-navy-ink hover:border-navy"
      )}
    >
      {label}
    </button>
  );
}

function BulkCard({
  product,
  pickedLabel,
  onPick,
  inOrder,
  onAdd,
}: {
  product: Product;
  pickedLabel: string | undefined;
  onPick: (label: string) => void;
  inOrder: number;
  onAdd: (strength: Strength) => void;
}) {
  const strengths = strengthsOf(product);
  const selected =
    strengths.find((s) => s.label === pickedLabel) ?? strengths[0]!;
  const image = product.images[0];
  const unavailable = !product.isInStock || !product.isPurchasable;

  // What this card advertises: the price at the entry rung. The rail and the
  // cart recompute from the real order, so this is a quote, not the charge.
  const bulkUnit = discountedUnit(selected.priceMinor, ENTRY_TIER.percentOff);
  const nextUnits = inOrder > 0 ? unitsToNextTier(inOrder) : null;
  const earned = tierForUnits(inOrder);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-rule bg-white">
      {/*
        The vial, framed rather than fitted. Every studio shot is a 2:3 frame
        that is roughly three quarters empty sweep, so a plain `object-contain`
        renders the specimen at about a fifth of the card width. `.plate-zoom`
        scales a measured crop window to fill the field instead — the same
        treatment the catalog plates use, from one documented source
        (components/plate/vial-crop.ts). The field is portrait because
        `object-contain` sizes by height: a taller field renders the vial WIDER.
      */}
      <div
        // overflow-hidden is load-bearing: the zoom scales the image past the
        // field, and without clipping here it would run over the card's text.
        className="relative overflow-hidden bg-frost"
        style={{ aspectRatio: VIAL_FIELD_RATIO }}
      >
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || product.displayName}
            fill
            sizes={VIAL_GRID_SIZES}
            className={cn("plate-zoom object-contain", unavailable && "opacity-45")}
            style={VIAL_FRAME}
          />
        ) : null}

        {/* Purity + COA, as the reference shows it: a chip on the image. */}
        {product.purity && product.coaUrl ? (
          <Link
            href={product.coaUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-rule bg-white px-2.5 py-1.5 text-[12px] font-bold text-navy-ink shadow-[0_1px_3px_rgba(11,27,51,.08)] hover:border-cobalt"
          >
            <span aria-hidden="true" className="text-ok">
              ✓
            </span>
            {product.purity}
            <span className="underline underline-offset-2">{copy.coaChip}</span>
            <span aria-hidden="true" className="text-steel">
              ›
            </span>
          </Link>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-[16px] leading-tight font-extrabold text-navy-ink">
            <Link href={`/product/${product.slug}`} className="text-navy-ink hover:text-cobalt">
              {product.displayName}
            </Link>
          </h3>
          <p className="mt-0.5 text-[13px] text-steel">
            {bulkCategoryLabels[product.categorySlug] ?? product.categoryName}
          </p>
        </div>

        {/* Strength rows — the selected one is filled, as in the reference. */}
        <ul className="flex flex-col gap-2">
          {strengths.map((s) => {
            const active = s.label === selected.label;
            return (
              <li key={s.variationId ?? s.label}>
                <button
                  type="button"
                  onClick={() => onPick(s.label)}
                  aria-pressed={active}
                  disabled={unavailable}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-3 rounded-[10px] border px-3.5 py-2.5 text-[14px] font-bold transition-colors disabled:cursor-not-allowed",
                    active
                      ? "border-navy-ink bg-navy-ink text-white"
                      : "border-rule bg-white text-navy-ink hover:border-navy"
                  )}
                >
                  <span>{s.label}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      active ? "text-white" : "text-steel"
                    )}
                  >
                    {formatMinor(
                      discountedUnit(s.priceMinor, ENTRY_TIER.percentOff)
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Price line: bulk unit price, list price struck, the discount named. */}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[20px] font-extrabold text-navy-ink tabular-nums">
            {formatMinor(bulkUnit)}
          </span>
          <span className="text-[13px] text-steel">{copy.perUnit}</span>
          <s className="text-[13px] text-steel tabular-nums">
            {formatMinor(selected.regularPriceMinor || selected.priceMinor)}
          </s>
          <span className="text-[13px] text-steel">
            {copy.atDiscount(ENTRY_TIER.percentOff)}
          </span>
        </p>

        {unavailable ? (
          <button
            type="button"
            disabled
            className="h-[46px] rounded-[10px] bg-rule text-[15px] font-bold text-steel"
          >
            {copy.outOfStock}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(selected)}
            className="flex h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-navy-ink text-[15px] font-bold text-white transition-colors hover:bg-navy"
          >
            <span aria-hidden="true">+</span>
            {inOrder > 0 ? copy.addMore(bulkMinUnits) : copy.addUnits(bulkMinUnits)}
            <span className="sr-only"> — {product.displayName} {selected.label}</span>
          </button>
        )}

        {inOrder > 0 ? (
          <p className="text-center text-[12px] font-semibold text-steel tabular-nums">
            {copy.inOrder(inOrder)}
            {earned ? ` · ${earned.percentOff}% off` : null}
            {!earned && nextUnits !== null
              ? ` · ${nextUnits} more for ${ENTRY_TIER.percentOff}%`
              : null}
          </p>
        ) : null}
      </div>
    </article>
  );
}
