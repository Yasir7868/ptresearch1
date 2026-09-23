"use client";

/**
 * GiftCardProduct — the live /digtal-gift-card/ page, rebuilt.
 *
 * The live page replaces the WooCommerce product template wholesale from an
 * Elementor HTML widget. Its layout, harvested 2026-09-21:
 *
 *   a two-column grid, equal halves, 1280px wide, gap clamp(48px, 5vw, 80px)
 *   LEFT   .ptgc-stage — STICKY (top: 110px), a rounded hairline card holding
 *          the artwork for the running amount, cross-faded, over the caption
 *          "Digital · delivered by email". It goes static below 940px.
 *   RIGHT  the eyebrow, the product title, the short description, the buy form
 *          (GiftCardPanel), the assurance row, and the claim card.
 *   FIXED  .ptgc-sticky — a bottom bar carrying the selected card, its figure,
 *          the six quick amounts and a second Add to cart. The quick amounts
 *          drop below 940px.
 *
 * The live page also hides WooCommerce's own gallery, its "Additional
 * information" and "Reviews" tabs, the related-products row, the product meta
 * line and the plugin's #ptgc-redeem section — so none of them are built here
 * either. The claim card is what carries redemption.
 *
 * A Client Component: the amount drives both columns and the bottom bar, and
 * nothing on the page needs server data (content/gift-card.ts explains why the
 * gift card never usefully reaches the Store API).
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { giftCardCopy } from "@/content/site-copy";
import { brandConfig } from "@/content/brand-config";
import { giftCard } from "@/content/gift-card";
import { cardArt, cardMoney } from "./card-art";
import { AmountTicks, DEFAULT_MINOR, GiftCardPanel } from "./GiftCardPanel";

/** Where live's claim link goes. */
const CLAIM_URL = `https://${brandConfig.domain}/my-account/gift-cards/`;

export function GiftCardProduct() {
  const [amountMinor, setAmountMinor] = useState(DEFAULT_MINOR);
  const [custom, setCustom] = useState(false);

  const art = cardArt(amountMinor);
  const money = cardMoney(amountMinor);

  return (
    <>
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-start gap-[clamp(48px,5vw,80px)] px-6 pt-[58px] pb-[110px] min-[940px]:grid-cols-2">
        {/* LEFT — the sticky stage. `top` clears the 68px header plus a gap
            (live uses 110px against its own taller chrome). */}
        <aside className="mx-auto mt-6 w-full max-w-[680px] min-w-0 overflow-hidden rounded-3xl border border-hairline bg-surface p-3 min-[940px]:sticky min-[940px]:top-[88px] min-[940px]:max-w-none">
          <div className="relative aspect-4/3">
            {/* Cross-fade, as live: every card is stacked and only the running
                one is opaque. A custom figure gets its own drawn card. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={art}
              src={art}
              alt={`${giftCard.name}, ${money}`}
              width={1200}
              height={900}
              className="absolute inset-0 size-full object-contain motion-safe:animate-in motion-safe:fade-in motion-safe:duration-[400ms]"
            />
          </div>
          <p className="px-0 pt-1 pb-[18px] text-center text-[10px] tracking-[0.18em] text-green uppercase opacity-65">
            {giftCardCopy.stageNote}
          </p>
        </aside>

        {/* RIGHT — the summary */}
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.24em] text-green uppercase">
            {giftCardCopy.eyebrow}
          </p>

          <h1 className="mt-[15px] mb-6 text-[clamp(36px,3.3vw,50px)] leading-[1.08] font-extrabold tracking-[-0.025em] text-ink">
            {giftCard.name}
          </h1>

          <p className="mb-9 max-w-[610px] text-[19px] leading-[1.65] text-ink-muted">
            {giftCardCopy.description}
          </p>

          <GiftCardPanel
            amountMinor={amountMinor}
            onAmountChange={setAmountMinor}
            custom={custom}
            onCustomChange={setCustom}
          />

          <ul className="flex flex-wrap gap-6 pt-[23px] pb-[25px] text-[13px] text-ink-muted">
            {giftCardCopy.assurances.map((item) => (
              <li key={item}>
                <span aria-hidden="true" className="mr-2 font-extrabold text-ok">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* The claim card — live's replacement for the plugin's redeem block */}
          <aside className="rounded-2xl border border-hairline bg-green/[0.04] px-[23px] py-[22px] text-sm text-ink-muted">
            <strong className="mb-[7px] block text-ink">{giftCardCopy.claimHeading}</strong>
            <a href={CLAIM_URL} className="text-green underline underline-offset-2">
              {giftCardCopy.claimLink}
            </a>
            <p className="mt-3 text-xs">{giftCardCopy.claimNote}</p>
          </aside>
        </div>
      </div>

      {/* FIXED — the bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-2.5 border-t border-hairline bg-surface px-4 py-2.5 shadow-[0_-5px_30px_rgba(0,0,0,0.03)] min-[940px]:justify-start min-[940px]:gap-5 min-[940px]:px-[max(24px,calc((100vw-1232px)/2))] min-[940px]:py-3">
        <div className="flex min-w-0 items-center gap-1.5 text-green min-[940px]:min-w-[150px] min-[940px]:gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={art}
            alt=""
            width={120}
            height={90}
            loading="lazy"
            className="w-[54px] rounded-md min-[940px]:w-[70px]"
          />
          <div>
            <small className="block text-xs text-ink-muted">{giftCardCopy.stickyLabel}</small>
            <strong className="data-num text-[22px]">{money}</strong>
          </div>
        </div>

        <AmountTicks
          amountMinor={amountMinor}
          onPick={(minor) => {
            setCustom(false);
            setAmountMinor(minor);
          }}
          groupLabel={giftCardCopy.stickyTicksLabel}
          className={cn(
            "hidden flex-1 rounded-[40px] border border-hairline bg-green/[0.04] p-1",
            "min-[940px]:grid min-[940px]:grid-cols-6"
          )}
          buttonClassName="rounded-[30px] border border-transparent"
          activeClassName="border-hairline bg-surface shadow-[0_2px_5px_rgba(0,0,0,0.03)]"
        />

        <button
          type="submit"
          form={giftCard.formId}
          className="min-h-12 shrink-0 cursor-pointer rounded-[40px] border border-green bg-green px-5 py-3 text-[15px] leading-[1.4] font-semibold text-white transition-colors hover:bg-green-deep min-[940px]:min-h-14 min-[940px]:px-[22px] min-[940px]:py-4"
        >
          {giftCardCopy.stickyAdd}
        </button>
      </div>
    </>
  );
}
