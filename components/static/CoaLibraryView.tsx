"use client";

/**
 * CoaLibraryView — the live /coa/ page: a search box over a list of products,
 * each with Purity / Endotoxin buttons. A button opens the certificate PDF in
 * a panel beside the product's price, a dosage picker for sized products,
 * Add to Cart and "Open PDF in New Tab".
 *
 * Measurements, colors and the system font stack are the live widget's own
 * (it does not use the site theme), so the page reads the same as
 * ptresearch.shop/coa/. Prices, sizes and cart lines come from the live
 * catalog; a line added here is the same line the product page adds.
 *
 * `.landing` hands h1–h4 styling back to the utilities (see globals.css).
 */

import { Suspense, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "radix-ui";
import { UrlQuerySync } from "@/components/catalog/UrlQuerySync";
import { coaPage, productPage } from "@/content/site-copy";
import { track } from "@/lib/analytics";
import { useCart } from "@/lib/cart";
import { formatMinor, formatPriceRange } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The live widget's font stack. */
const FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ---------------------------------------------------------------------------
// Row shape (serializable — assembled server-side in app/(store)/coa/page.tsx)
// ---------------------------------------------------------------------------

export interface CoaProduct {
  productId: number;
  sku: string;
  /** Mapper display name — what the cart line shows. */
  displayName: string;
  image?: string;
  priceMinor: number;
  currencyMinorUnit: number;
  /** Empty for a simple product. */
  variations: { variationId: number; size: string; priceMinor: number }[];
  available: boolean;
}

export interface CoaItem {
  id: number;
  name: string;
  /** Certificate lot number, e.g. "PTR-9628420-P" (the homepage lookup sends it). */
  batch?: string;
  image?: string;
  purityUrl: string;
  /** Absent → the row shows only the Purity button, as live. */
  endotoxinUrl?: string;
  /** Absent when the store no longer sells the product. */
  product?: CoaProduct;
}

type DocType = "purity" | "endotoxin";

// ---------------------------------------------------------------------------
// List row
// ---------------------------------------------------------------------------

const badgeClass =
  "cursor-pointer rounded-full px-4 py-2.5 text-xs leading-[18px] font-semibold text-white transition-opacity duration-200 hover:opacity-[0.92] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24335d]";

function CoaRow({
  item,
  onOpen,
}: {
  item: CoaItem;
  onOpen: (doc: DocType) => void;
}) {
  const purityOnly = !item.endotoxinUrl;

  return (
    <div className="mb-3.5 flex items-center justify-between gap-4 rounded-2xl border border-[#e6e6e6] bg-white px-5 py-[18px] max-md:flex-col max-md:items-start">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative size-[54px] shrink-0 overflow-hidden rounded-xl bg-[#f3f3f3]">
          {item.image ? (
            <Image src={item.image} alt="" fill sizes="54px" className="object-cover" />
          ) : null}
        </div>
        <div>
          <div className="mb-1 text-[11px] tracking-[0.5px] text-[#9a9a9a]">
            {coaPage.productNameLabel}
          </div>
          <div className="text-lg leading-[1.2] font-bold text-[#1a1a1a]">{item.name}</div>
        </div>
      </div>

      <div
        className={cn(
          "flex shrink-0 flex-wrap gap-2.5",
          purityOnly ? "w-[180px] justify-center" : "max-md:w-full"
        )}
      >
        <button
          type="button"
          onClick={() => onOpen("purity")}
          className={cn(badgeClass, "bg-[#24335d]", purityOnly && "w-40 text-center")}
        >
          {coaPage.purityButton}
        </button>
        {item.endotoxinUrl ? (
          <button
            type="button"
            onClick={() => onOpen("endotoxin")}
            className={cn(badgeClass, "bg-[#182443]")}
          >
            {coaPage.endotoxinButton}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Certificate panel (modal)
// ---------------------------------------------------------------------------

const cardClass = "rounded-2xl border border-[#e8ebf0] bg-white px-[18px] py-4";
const actionClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-[14px] px-[18px] py-3.5 text-[15px] font-bold transition-colors duration-200 max-md:min-h-[46px] max-md:text-sm";

function CertificateModal({
  item,
  doc,
  onClose,
}: {
  item: CoaItem;
  doc: DocType;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [size, setSize] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "adding" | "added">("idle");

  const product = item.product;
  const sizes = product?.variations ?? [];
  const selected = sizes.find((v) => v.size === size);
  const needsSize = sizes.length > 0 && !selected;

  const pdfUrl = (doc === "endotoxin" && item.endotoxinUrl) || item.purityUrl;
  const docTitle =
    doc === "purity" ? coaPage.purityCertificate : coaPage.endotoxinCertificate;
  const docName = doc === "purity" ? coaPage.purityButton : coaPage.endotoxinButton;

  // A range until a dosage is picked, as live.
  const price = product
    ? selected
      ? formatMinor(selected.priceMinor, product.currencyMinorUnit)
      : formatPriceRange(product)
    : null;

  const addLabel = !product?.available
    ? productPage.outOfStockButton
    : needsSize
      ? coaPage.selectDosage
      : status === "adding"
        ? coaPage.adding
        : status === "added"
          ? coaPage.added
          : coaPage.addToCart;

  const handleAdd = async () => {
    if (!product || needsSize) return;
    const dose = selected?.size ?? "";
    const priceMinor = selected?.priceMinor ?? product.priceMinor;
    setStatus("adding");
    try {
      await addItem({
        sku: product.sku,
        dose,
        name: product.displayName,
        price: priceMinor,
        productId: product.productId,
        variationId: selected?.variationId,
        variation: selected ? [{ attribute: "Size", value: selected.size }] : undefined,
        image: product.image,
      });
      track("add_to_cart", { sku: product.sku, dose, qty: 1, price_cents: priceMinor });
      setStatus("added");
    } catch {
      window.alert(coaPage.addError);
      setStatus("idle");
    }
  };

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="landing fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(17,24,39,0.58)] p-5 leading-normal max-md:items-end max-md:p-2.5"
          style={{ fontFamily: FONT_STACK }}
        >
          <DialogPrimitive.Content
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              closeRef.current?.focus();
            }}
            className={cn(
              "grid h-[min(680px,calc(100dvh-40px))] w-[min(1040px,100%)] grid-cols-[minmax(0,1.65fr)_380px] overflow-hidden rounded-[22px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)] outline-none",
              "md:max-[980px]:h-[min(640px,calc(100dvh-32px))] md:max-[980px]:grid-cols-[1.2fr_340px]",
              "max-md:h-[calc(100dvh-20px)] max-md:w-full max-md:grid-cols-1 max-md:grid-rows-[max(52vh,300px)_minmax(0,1fr)] max-md:rounded-[20px_20px_0_0]"
            )}
          >
            {/* Left: the certificate */}
            <div className="relative h-full min-w-0 bg-[#eef1f6]">
              <iframe
                src={`${pdfUrl}#view=FitH&zoom=page-width`}
                title={`${item.name} — ${docTitle}`}
                className="size-full border-0 bg-[#eef1f6]"
              />
            </div>

            {/* Right: product panel */}
            <div
              className={cn(
                "flex min-w-0 flex-col gap-[18px] overflow-y-auto border-l border-[#edf0f5] bg-white px-7 pt-7 pb-6",
                "md:max-[980px]:p-[22px]",
                "max-md:gap-3.5 max-md:border-t max-md:border-l-0 max-md:px-4 max-md:pt-[18px] max-md:pb-4"
              )}
            >
              <div className="flex items-start justify-between gap-3.5">
                <div className="min-w-0">
                  <DialogPrimitive.Title className="m-0 text-2xl leading-[1.15] font-extrabold break-words text-[#1f2937] max-[980px]:text-[22px]">
                    {item.name}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-1.5 text-base leading-[1.35] text-[#8d97a6] max-md:text-sm">
                    {docTitle}
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close
                  ref={closeRef}
                  aria-label="Close"
                  className="flex size-[38px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#f4f5f7] text-[22px] leading-none text-[#d25b7f] focus-visible:outline-2 focus-visible:outline-[#24335d]"
                >
                  &times;
                </DialogPrimitive.Close>
              </div>

              {sizes.length > 0 ? (
                <div className={cardClass}>
                  <div className="mb-3 text-[11px] font-bold tracking-[0.8px] text-[#8a8f98] uppercase">
                    {coaPage.dosageLabel}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((v) => {
                      const active = v.size === size;
                      return (
                        <button
                          key={v.variationId}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setSize(v.size);
                            setStatus("idle");
                          }}
                          className={cn(
                            "cursor-pointer rounded-full px-[18px] py-2.5 text-[13px] leading-normal font-bold text-white transition-[background-color,transform,box-shadow] duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24335d]",
                            active
                              ? "scale-[1.04] bg-[#24335d] shadow-[0_0_0_3px_rgba(36,51,93,0.25)]"
                              : "bg-[#182443] hover:bg-[#24335d]"
                          )}
                        >
                          {v.size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {price ? (
                <div className={cardClass}>
                  <div className="mb-2.5 text-[13px] text-[#8a8f98]">{coaPage.priceLabel}</div>
                  <div className="text-[22px] leading-none font-extrabold text-[#1f2937] max-md:text-xl">
                    {price}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3.5">
                {product ? (
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!product.available || needsSize || status === "adding"}
                    className={cn(
                      actionClass,
                      "cursor-pointer bg-[#24335d] text-white hover:bg-[#1f2d52] disabled:cursor-not-allowed disabled:opacity-75"
                    )}
                  >
                    {addLabel}
                  </button>
                ) : null}
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener"
                  className={cn(
                    actionClass,
                    "border border-[#d6dff5] bg-[#edf2ff] text-[#24335d] hover:bg-[#e7edff]"
                  )}
                >
                  {coaPage.openPdf}
                </a>
              </div>

              <div className={cardClass}>
                <div className="mb-2.5 text-[13px] text-[#8a8f98]">
                  {coaPage.selectedDocumentLabel}
                </div>
                <div className="text-base font-bold text-[#1f2937]">{docName}</div>
              </div>

              <div className="flex-1" />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// The view
// ---------------------------------------------------------------------------

export function CoaLibraryView({ items }: { items: CoaItem[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<{ item: CoaItem; doc: DocType } | null>(null);

  // Product name, or the batch number the homepage lookup sends (/coa?q=…).
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            Boolean(item.batch?.toLowerCase().includes(q))
        )
      : items;
  }, [items, query]);

  return (
    <div
      className="mx-auto max-w-[1100px] px-6 py-10 leading-normal max-md:px-4 max-md:py-6"
      style={{ fontFamily: FONT_STACK }}
    >
      <Suspense fallback={null}>
        <UrlQuerySync onQuery={setQuery} />
      </Suspense>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={coaPage.searchPlaceholder}
        aria-label={coaPage.searchPlaceholder}
        className="mb-5 block h-[39px] w-full rounded-[3px] border border-[#666] bg-white px-4 py-2 text-sm text-black outline-none placeholder:text-[#757575] focus:border-[#333]"
      />

      <div>
        {visible.map((item) => (
          <CoaRow
            key={item.id}
            item={item}
            onOpen={(doc) => setOpen({ item, doc })}
          />
        ))}
      </div>

      {open ? (
        <CertificateModal
          key={`${open.item.id}-${open.doc}`}
          item={open.item}
          doc={open.doc}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
