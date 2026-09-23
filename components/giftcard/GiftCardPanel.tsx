"use client";

/**
 * GiftCardPanel — the gift card buy form as the LIVE page builds it.
 *
 * The live page does not ship the Advanced Gift Cards plugin's form. An
 * Elementor HTML widget's script tears it down and rebuilds it, and this is
 * that rebuilt UI (harvested 2026-09-21):
 *
 *   Amount       a big navy figure with a "balance" caption, driven by a
 *                six-stop RANGE SLIDER over $25 / $50 / $100 / $250 / $500 /
 *                $1,000 with a clickable tick under each. $100 is the opening
 *                value. There is no <select> and no "Choose an option".
 *   Custom       "or enter an exact amount" reveals the plugin's manual-amount
 *                box, relabelled "Custom amount ($25–$1,000)". Live keys that
 *                box to the $25 tier — the only variation the plugin allows a
 *                manual amount on — so the cart line's variation is 6501 while
 *                the price is whatever was typed.
 *   Who for      a two-button pill switch, "Send as a gift" / "This one's for
 *                me". Choosing "me" hides the recipient fields.
 *   Recipient    Recipient's Name, From, Recipient's Email, Confirm their
 *                email (must match), Message (250 chars, counted) and Send on
 *                — a DATE, not a datetime, from today to a year out.
 *   Add          the button retitles itself "Add gift card to cart · $100".
 *
 * On submit live folds the sender into the message as a trailing "From: …"
 * line, then restores the textarea; the same line rides onto the cart meta
 * here, since that is what the recipient ends up reading.
 *
 * DELIBERATE DIFFERENCES FROM LIVE
 *   - The custom amount is validated before the line is added (the plugin's
 *     own messages, in its own order). Live prints the message but still lets
 *     the form post, leaving the server to reject it.
 *   - Live's script leaves the plugin's hidden radios and <select> in the DOM
 *     and drives them by synthetic clicks; there is no form to post to here,
 *     so the state is held directly.
 */

import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import { requestCartDrawerOpen } from "@/components/cart/drawer-events";
import { useCart, type CartItemMeta } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { formatMinor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { giftCardCopy } from "@/content/site-copy";
import {
  giftCard,
  parseAmountToMinor,
  validateManualAmount,
  type ManualAmountError,
} from "@/content/gift-card";
import { cardFigure, cardMoney } from "./card-art";

// ---------------------------------------------------------------------------
// Faces
// ---------------------------------------------------------------------------

/** Live: 14px, 600, muted, 9px below. */
const LABEL = "mb-[9px] block text-sm leading-[1.5] font-semibold text-ink-muted";

/** Live: 1px hairline, 11px radius, 16/17 padding, 58px tall, 16px text. */
const INPUT =
  "block w-full rounded-[11px] border border-hairline bg-surface px-[17px] py-4 text-base leading-[1.45] text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus-visible:border-green disabled:cursor-not-allowed disabled:opacity-45";

const HINT = "mt-2 text-xs leading-[1.55] text-ink-muted";

const FIELD_ERROR = "mt-2 text-xs leading-[1.55] text-destructive";

// ---------------------------------------------------------------------------
// Client-only reads
// ---------------------------------------------------------------------------

const subscribeNever = () => () => {};

/**
 * False through SSR and first paint, true after. The "Send on" bounds and the
 * viewer's time zone are clock- and locale-dependent: reading them on the
 * server would bake in the build machine's and mismatch on hydration.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

/** Live sets the date field's min to today and max to a year out. */
function dateBounds(): { min: string; max: string } {
  const day = 86_400_000;
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  const now = Date.now();
  return { min: iso(now), max: iso(now + giftCard.maxDeliveryDays * day) };
}

function viewerTimeZone(): string {
  try {
    // Live falls back to "UTC" when the runtime will not name a zone.
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// ---------------------------------------------------------------------------
// Validation messages
// ---------------------------------------------------------------------------

function amountErrorMessage(error: ManualAmountError): string {
  const { amountErrors } = giftCardCopy;
  switch (error.kind) {
    case "empty":
      return amountErrors.empty;
    case "nonNumeric":
      return amountErrors.nonNumeric;
    case "belowMin":
      return amountErrors.belowMin(error.bound);
    case "aboveMax":
      return amountErrors.aboveMax(error.bound);
    case "offStep":
      return amountErrors.offStep(error.bound);
  }
}

// ---------------------------------------------------------------------------
// Ticks — shared by the slider and the fixed bottom bar
// ---------------------------------------------------------------------------

export function AmountTicks({
  amountMinor,
  onPick,
  groupLabel,
  className,
  buttonClassName,
  activeClassName,
}: {
  amountMinor: number;
  onPick: (minor: number) => void;
  groupLabel: string;
  className?: string;
  buttonClassName?: string;
  activeClassName?: string;
}) {
  return (
    <div role="group" aria-label={groupLabel} className={className}>
      {giftCard.tiers.map((tier) => {
        const active = tier.amountMinor === amountMinor;
        const label = cardMoney(tier.amountMinor);
        return (
          <button
            key={tier.variationId}
            type="button"
            aria-pressed={active}
            aria-label={giftCardCopy.tickLabel(label)}
            onClick={() => onPick(tier.amountMinor)}
            className={cn(
              "min-h-11 cursor-pointer rounded-lg px-[7px] py-2 text-xs font-medium text-ink-muted transition-colors",
              buttonClassName,
              active && cn("font-extrabold text-green", activeClassName)
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The panel
// ---------------------------------------------------------------------------

/** The $25 tier — the only one the plugin allows a manual amount on. */
const CUSTOM_TIER = giftCard.tiers.find((t) => t.manualAmount)!;
const CUSTOM_RULE = CUSTOM_TIER.manualAmount!;

/** The opening figure, as live ($100). */
export const DEFAULT_MINOR = giftCard.tiers.find(
  (t) => t.value === giftCard.defaultTierValue
)!.amountMinor;

export interface GiftCardPanelProps {
  /** The running amount in minor units — owned by GiftCardProduct. */
  amountMinor: number;
  onAmountChange: (minor: number) => void;
  /** True while the custom-amount box is open. */
  custom: boolean;
  onCustomChange: (custom: boolean) => void;
}

export function GiftCardPanel({
  amountMinor,
  onAmountChange,
  custom,
  onCustomChange,
}: GiftCardPanelProps) {
  const { addItem } = useCart();
  const ids = useId();
  const hydrated = useHydrated();

  const [manual, setManual] = useState<string>(
    String(CUSTOM_RULE.defaultMinor / 100)
  );
  const [mode, setMode] = useState<"friend" | "me">("friend");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [sendOn, setSendOn] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const bounds = hydrated ? dateBounds() : null;
  const isGift = mode === "friend";

  const amountError = custom ? validateManualAmount(manual, CUSTOM_RULE) : null;
  const emailsMatch =
    !isGift ||
    recipientEmail.trim().toLowerCase() === confirmEmail.trim().toLowerCase();

  /** Slider index for the running amount; -1 while a custom figure is set. */
  const tickIndex = giftCard.tiers.findIndex((t) => t.amountMinor === amountMinor);

  const pickPreset = (minor: number) => {
    onCustomChange(false);
    onAmountChange(minor);
  };

  const toggleCustom = () => {
    const next = !custom;
    onCustomChange(next);
    if (next) {
      // Live seeds the box from the running figure, then focuses it.
      setManual(String(Math.round(amountMinor / 100)));
      return;
    }
    // Closing it keeps the figure when it is one of the six, and otherwise
    // falls back to the opening tier. Live keeps the custom figure either way
    // and leaves its <select> with no valid option — a dead end we skip.
    if (tickIndex < 0) onAmountChange(DEFAULT_MINOR);
  };

  const editManual = (text: string) => {
    setManual(text);
    const minor = parseAmountToMinor(text);
    // Live repaints the figure and the card on every keystroke.
    if (minor !== null && !validateManualAmount(text, CUSTOM_RULE)) {
      onAmountChange(minor);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (amountError || !emailsMatch) return;

    const priceMinor = custom ? parseAmountToMinor(manual) : amountMinor;
    if (priceMinor === null) return;

    // Live's variation: the typed tier, or $25 whenever a custom figure is set.
    const tier = custom
      ? CUSTOM_TIER
      : (giftCard.tiers.find((t) => t.amountMinor === priceMinor) ?? CUSTOM_TIER);

    // Live folds the sender into the message as a trailing "From: …" line.
    const body = message.trim();
    const from = sender.trim();
    const fullMessage =
      isGift && from
        ? `${body}${body ? "\n\n" : ""}${giftCardCopy.messageFromPrefix}${from}`
        : body;

    const meta: CartItemMeta[] = isGift
      ? [
          { label: giftCardCopy.recipientNameLabel, value: recipientName.trim() },
          { label: giftCardCopy.recipientEmailLabel, value: recipientEmail.trim() },
          ...(fullMessage
            ? [{ label: giftCardCopy.messageLabel, value: fullMessage }]
            : []),
          ...(sendOn
            ? [
                {
                  label: giftCardCopy.sendOnLabel,
                  value: `${sendOn} (${viewerTimeZone()})`,
                },
              ]
            : []),
        ]
      : [];

    await addItem({
      sku: giftCard.sku,
      dose: formatMinor(priceMinor),
      name: giftCard.name,
      price: priceMinor,
      productId: giftCard.productId,
      variationId: tier.variationId,
      variation: [{ attribute: "Amount", value: tier.value }],
      image: tier.image,
      meta,
      soldIndividually: giftCard.soldIndividually,
      excludedFromCoupons: giftCard.excludedFromCoupons,
    });

    track("add_to_cart", {
      sku: giftCard.sku,
      dose: tier.value,
      qty: 1,
      price_cents: priceMinor,
    });
    requestCartDrawerOpen();
  };

  const amountErrorId = `${ids}-amount-error`;
  const confirmErrorId = `${ids}-confirm-error`;

  return (
    <form id={giftCard.formId} onSubmit={(e) => void handleSubmit(e)} noValidate>
      {/* The figure and its caption */}
      <div className="mb-[38px] flex items-baseline gap-4">
        <p
          aria-live="polite"
          className="data-num text-[clamp(48px,5vw,68px)] leading-[1.1] font-extrabold tracking-[-0.04em] text-green"
        >
          <span className="align-[0.45em] text-[0.48em] tracking-normal">$</span>
          {cardFigure(amountMinor)}
        </p>
        <span className="text-sm text-ink-muted">{giftCardCopy.balance}</span>
      </div>

      {/* Slider + ticks + the custom-amount toggle */}
      <div className="mb-[42px]">
        <input
          type="range"
          min={0}
          max={giftCard.tiers.length - 1}
          step={1}
          // While a custom figure is set the thumb parks on the $25 stop,
          // as live does (its select is pinned there too).
          value={tickIndex >= 0 ? tickIndex : 0}
          aria-label={giftCardCopy.rangeLabel}
          aria-valuetext={cardMoney(amountMinor)}
          onChange={(e) => pickPreset(giftCard.tiers[Number(e.target.value)]!.amountMinor)}
          className="ptgc-range block h-11 w-full cursor-pointer appearance-none border-0 bg-transparent p-0"
        />

        <AmountTicks
          amountMinor={amountMinor}
          onPick={pickPreset}
          groupLabel={giftCardCopy.ticksLabel}
          className="-mx-[7px] mt-2.5 mb-[22px] flex justify-between gap-0.5"
        />

        <button
          type="button"
          aria-expanded={custom}
          aria-controls={`${ids}-manual`}
          onClick={toggleCustom}
          className="min-h-9 cursor-pointer text-sm text-ink underline underline-offset-2"
        >
          {giftCardCopy.customToggle}
        </button>
      </div>

      {/* Custom amount — hidden until the toggle opens it, as live */}
      {custom ? (
        <div className="mb-7">
          <label htmlFor={`${ids}-manual`} className={LABEL}>
            {giftCardCopy.customAmountLabel}
          </label>
          <input
            id={`${ids}-manual`}
            name="agcfw_manual_amount"
            type="number"
            inputMode="decimal"
            autoFocus
            min={CUSTOM_RULE.minMinor / 100}
            max={CUSTOM_RULE.maxMinor / 100}
            step={CUSTOM_RULE.stepMinor / 100}
            value={manual}
            onChange={(e) => editManual(e.target.value)}
            aria-invalid={showErrors && amountError ? true : undefined}
            aria-describedby={showErrors && amountError ? amountErrorId : undefined}
            className={cn(
              INPUT,
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              showErrors && amountError && "border-destructive"
            )}
          />
          {showErrors && amountError ? (
            <p id={amountErrorId} role="alert" className={FIELD_ERROR}>
              {amountErrorMessage(amountError)}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Who is this for */}
      <div
        role="group"
        aria-label={giftCardCopy.modesLabel}
        className="mb-[30px] grid grid-cols-2 gap-1 rounded-[40px] border border-hairline bg-green/[0.04] p-[5px]"
      >
        {(
          [
            ["friend", giftCardCopy.sendAsGift],
            ["me", giftCardCopy.forMe],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "min-h-[54px] cursor-pointer rounded-[30px] border border-transparent px-3 py-[15px] text-base leading-[1.4] text-ink-muted transition-colors",
              mode === value &&
                "border-hairline bg-surface text-green shadow-[0_2px_5px_rgba(0,0,0,0.03)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Recipient fields — two columns, the message and date spanning both */}
      <div className="grid grid-cols-1 gap-[22px_20px] sm:grid-cols-2">
        {isGift ? (
          <>
            <div className="min-w-0">
              <label htmlFor={`${ids}-name`} className={LABEL}>
                {giftCardCopy.recipientNameLabel}
              </label>
              <input
                id={`${ids}-name`}
                name="recipient_name"
                type="text"
                required
                autoComplete="name"
                placeholder={giftCardCopy.recipientNamePlaceholder}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className={INPUT}
              />
            </div>

            <div className="min-w-0">
              <label htmlFor={`${ids}-sender`} className={LABEL}>
                {giftCardCopy.fromLabel}
              </label>
              <input
                id={`${ids}-sender`}
                name="ptgc_sender"
                type="text"
                maxLength={80}
                autoComplete="name"
                placeholder={giftCardCopy.fromPlaceholder}
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className={INPUT}
              />
            </div>

            <div className="min-w-0">
              <label htmlFor={`${ids}-email`} className={LABEL}>
                {giftCardCopy.recipientEmailLabel}
              </label>
              <input
                id={`${ids}-email`}
                name="recipient_email"
                type="email"
                required
                autoComplete="email"
                placeholder={giftCardCopy.recipientEmailPlaceholder}
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className={INPUT}
              />
            </div>

            <div className="min-w-0">
              <label htmlFor={`${ids}-confirm`} className={LABEL}>
                {giftCardCopy.confirmEmailLabel}
              </label>
              <input
                id={`${ids}-confirm`}
                name="ptgc_email_confirm"
                type="email"
                required
                autoComplete="off"
                placeholder={giftCardCopy.recipientEmailPlaceholder}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                aria-invalid={showErrors && !emailsMatch ? true : undefined}
                aria-describedby={showErrors && !emailsMatch ? confirmErrorId : undefined}
                className={cn(INPUT, showErrors && !emailsMatch && "border-destructive")}
              />
              {showErrors && !emailsMatch ? (
                <p id={confirmErrorId} role="alert" className={FIELD_ERROR}>
                  {giftCardCopy.emailMismatch}
                </p>
              ) : (
                <p className={HINT}>{giftCardCopy.confirmEmailHint}</p>
              )}
            </div>
          </>
        ) : null}

        <div className="min-w-0 sm:col-span-2">
          <label htmlFor={`${ids}-message`} className={LABEL}>
            {giftCardCopy.messageLabel}
          </label>
          <textarea
            id={`${ids}-message`}
            name="short_message"
            maxLength={250}
            placeholder={giftCardCopy.messagePlaceholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={cn(INPUT, "min-h-[118px] resize-y leading-[1.5]")}
          />
          <p className={HINT}>
            <span>{message.length}</span>/250
          </p>
        </div>

        <div className="min-w-0 sm:col-span-2">
          <label htmlFor={`${ids}-send-on`} className={LABEL}>
            {giftCardCopy.sendOnLabel}
          </label>
          <input
            id={`${ids}-send-on`}
            name="delivery_date"
            type="date"
            value={sendOn}
            min={bounds?.min}
            max={bounds?.max}
            onChange={(e) => setSendOn(e.target.value)}
            className={INPUT}
          />
          <p className={HINT}>{giftCardCopy.sendOnHint}</p>
        </div>
      </div>

      <div className="mt-[30px]">
        <button
          type="submit"
          className="min-h-14 w-full cursor-pointer rounded-[40px] border border-green bg-green px-[22px] py-4 text-[15px] leading-[1.4] font-semibold text-white transition-colors hover:bg-green-deep"
        >
          {giftCardCopy.addToCart(cardMoney(amountMinor))}
        </button>
      </div>
    </form>
  );
}
