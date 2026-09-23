"use client";

/**
 * CheckoutForm — /checkout, Reference Grade, with the live WooCommerce
 * checkout's labels and sections (content/site-copy.ts → checkoutPage).
 *
 * ONE PAGE. The card is entered in section 04, in place — no second step and
 * no redirect. Hand-rolled controlled fields validated with zod safeParse
 * (react-hook-form is not installed; shadcn's Field primitives are
 * presentation-only and dependency-free).
 *
 * The flow:
 *   - Sections 01–03 collect contact, shipping and notes.
 *   - The moment the whole form validates — terms checkbox included — the
 *     processor's embedded card surface mounts in section 04 (GatewayPayment).
 *     Card data is entered inside the processor's own frame; this site never
 *     sees a card number, and the frame carries its own pay button, so this
 *     form has no submit button of its own.
 *   - While that surface is live, 01–03 are locked behind a disabled fieldset.
 *     The order has been created and priced by then and the processor holds a
 *     session for it; letting the address drift underneath would ship the
 *     parcel somewhere the order does not say. "Edit order details" tears the
 *     session down and unlocks them.
 *
 * The checkout id handed to the gateway is derived from a fingerprint of the
 * cart (lib/gateway/order.ts). Same cart, same id — so unlocking, editing and
 * re-arming resumes the same order (the route updates its buyer) rather than
 * creating a second one — and a changed cart mints a new id, so the gateway's
 * idempotency can never return a session priced for a stale basket.
 *
 * Payment is only reached when the deployment has gateway credentials
 * (`paymentEnabled`). Without them the page says so rather than taking an
 * order it cannot charge.
 *
 * Trust graft #4: the live terms checkbox ("I have read and agree to the
 * website terms and conditions") is zod-required — the order cannot be
 * placed unchecked.
 */

import {
  useCallback,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { cartPage, checkoutPage, checkoutPayment } from "@/content/site-copy";
import {
  GatewayPayment,
  type CheckoutBuyerPayload,
  type SubmittedLinePayload,
} from "@/components/checkout/GatewayPayment";
import { cartFingerprint } from "@/lib/gateway/order";

import { formatMinor } from "@/components/checkout/money";
import { FadeIn } from "@/components/motion/FadeIn";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { US_STATES } from "@/components/checkout/us-states";
import { useCartReady } from "@/components/checkout/useCartReady";
import {
  PAYMENT_METHOD_IDS,
  PAYMENT_METHODS,
  createDemoOrderNumber,
  writeDemoOrder,
  type DemoOrder,
  type PaymentMethodId,
} from "@/components/checkout/demo-order";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const checkoutSchema = z.object({
  email: z.email("Enter a valid email address."),
  firstName: z.string().trim().min(1, "Enter a first name."),
  lastName: z.string().trim().min(1, "Enter a last name."),
  address1: z.string().trim().min(4, "Enter a street address."),
  address2: z.string().trim().max(120, "Keep this line under 120 characters."),
  city: z.string().trim().min(2, "Enter a town / city."),
  state: z.string().min(2, "Select a state."),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP Code (12345 or 12345-6789)."),
  notes: z.string().trim().max(500, "Keep order notes under 500 characters."),
  method: z.enum(PAYMENT_METHOD_IDS, "Select a payment method."),
  // Trust graft #4 — the order cannot be placed without accepting the terms.
  terms: z.literal(true, checkoutPage.termsRequired),
});

type TextField =
  | "email"
  | "firstName"
  | "lastName"
  | "address1"
  | "address2"
  | "city"
  | "state"
  | "zip"
  | "notes";
type ErrorKey = TextField | "method" | "terms";

interface FormValues {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  method: PaymentMethodId | "";
  terms: boolean;
}

const INITIAL_VALUES: FormValues = {
  email: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  notes: "",
  // The live checkout pre-selects its only gateway.
  method: PAYMENT_METHODS[0]?.id ?? "",
  terms: false,
};

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

/** Numbered Satoshi section head — the record's chapter mark. */
function SectionHead({
  index,
  children,
}: {
  index: string;
  children: ReactNode;
}) {
  return (
    <h2 className="flex items-baseline gap-3">
      <span className="data-num text-[13px] text-green">{index}</span>
      <span className="text-[1.4rem]">{children}</span>
    </h2>
  );
}

// ---------------------------------------------------------------------------
// CheckoutForm
// ---------------------------------------------------------------------------

/**
 * What step 2 needs. Note what is NOT here: prices. The server re-prices the
 * order from the catalog (lib/orders/price.ts); the browser only names what it
 * wants. `receipt` is a local copy for the confirmation page's benefit, not a
 * source of truth — the order row is.
 */
interface PendingCheckout {
  checkoutId: string;
  fingerprint: string;
  buyer: CheckoutBuyerPayload;
  lines: SubmittedLinePayload[];
  orderNumber: string;
  receipt: DemoOrder;
}

export function CheckoutForm({
  paymentEnabled,
}: {
  /** True when the deployment has gateway credentials. */
  paymentEnabled: boolean;
}) {
  const { items, count, totals, clear } = useCart();
  const ready = useCartReady();
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [placing, setPlacing] = useState(false);
  const [pending, setPending] = useState<PendingCheckout | null>(null);
  /** Set when the server priced the order differently from the cart. */
  const [repriced, setRepriced] = useState<number | null>(null);
  /** Details are read-only while the processor holds a session for them. */
  const locked = pending !== null;
  /** All details valid — the card can mount (or re-mount after an unlock). */
  const formComplete = checkoutSchema.safeParse(values).success;
  /** Survives going back to step 1, so the same cart keeps its session. */
  const lastCheckout = useRef<{ id: string; number: string; fingerprint: string } | null>(
    null
  );

  /**
   * Apply a field change and, if that completes the form, arm the card.
   *
   * Arming happens HERE rather than in an effect: it is a direct consequence
   * of the edit the customer just made, and running it in an effect would be a
   * cascading render (and is what `react-hooks/set-state-in-effect` objects
   * to). Validation includes the terms checkbox, so no order row and no
   * processor session are created until the customer has deliberately
   * accepted them.
   */
  const apply = (next: FormValues, cleared: ErrorKey) => {
    setValues(next);
    setErrors((e) => (e[cleared] ? { ...e, [cleared]: undefined } : e));

    if (!paymentEnabled || placing || pending || items.length === 0) return;
    const result = checkoutSchema.safeParse(next);
    if (!result.success) return;

    setErrors({});
    const armed = buildPending(result.data);
    track("checkout_payment_step", {
      order_number: armed.orderNumber,
      item_count: count,
      total_minor: totals.total,
    });
    setPending(armed);
  };

  const setText = (field: TextField, value: string) =>
    apply({ ...values, [field]: value }, field);

  const setMethod = (method: PaymentMethodId) =>
    apply({ ...values, method }, "method");

  const setTerms = (terms: boolean) => apply({ ...values, terms }, "terms");

  /**
   * Build the payment payload from validated details.
   *
   * `lastCheckout` is keyed on a fingerprint of the cart, so unlocking the
   * details, editing them and re-arming resumes the SAME order rather than
   * creating a second one (the route updates the buyer on resume). A changed
   * cart mints a new id, because it is a genuinely different purchase.
   */
  const buildPending = (
    data: z.infer<typeof checkoutSchema>
  ): PendingCheckout => {
    // Same cart, same checkout id — editing the address must not create a
    // second Checkout Session. A changed cart mints a new one.
    const fingerprint = cartFingerprint(items, totals);
    const reuse =
      lastCheckout.current?.fingerprint === fingerprint ? lastCheckout.current : null;
    const orderNumber = reuse?.number ?? createDemoOrderNumber();
    const checkoutId = reuse?.id ?? `${orderNumber}-${Date.now().toString(36)}`;
    lastCheckout.current = { id: checkoutId, number: orderNumber, fingerprint };

    const receipt: DemoOrder = {
      orderNumber,
      createdAt: new Date().toISOString(),
      email: data.email,
      method: data.method,
      shipTo: {
        name: `${data.firstName} ${data.lastName}`,
        address1: data.address1,
        ...(data.address2 ? { address2: data.address2 } : {}),
        city: data.city,
        state: data.state,
        zip: data.zip,
      },
      ...(data.notes ? { notes: data.notes } : {}),
      // Capture the snapshot BEFORE the cart is cleared.
      items,
      totals,
      checkoutId,
    };

    const buyer: CheckoutBuyerPayload = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      address1: data.address1,
      ...(data.address2 ? { address2: data.address2 } : {}),
      city: data.city,
      state: data.state,
      postcode: data.zip,
      ...(data.notes ? { notes: data.notes } : {}),
    };

    // References only — the server decides what each of these costs. A line
    // with no productId cannot be re-priced, so it is not sent; pricing then
    // rejects the order rather than quietly charging for less than the cart.
    const lines: SubmittedLinePayload[] = items
      .filter((i) => i.productId !== undefined)
      .map((i) => ({
        productId: i.productId!,
        ...(i.variationId !== undefined ? { variationId: i.variationId } : {}),
        qty: i.qty,
        // Gift cards carry a buyer-chosen face value; the server re-validates
        // it against the published rules.
        ...(i.excludedFromCoupons ? { amountMinor: i.price } : {}),
        ...(i.meta ? { meta: i.meta } : {}),
      }));

    return { checkoutId, fingerprint, buyer, lines, orderNumber, receipt };
  };

  /** Re-arm after "Edit order details" when nothing actually changed. */
  const rearm = () => apply(values, "terms");

  /**
   * Submitting the form is only reachable by pressing Enter in a field — there
   * is no submit button, because the processor's surface carries its own. It
   * surfaces validation errors for whatever is still missing.
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (placing || pending) return;

    const result = checkoutSchema.safeParse(values);
    if (result.success) {
      setErrors({});
      return;
    }
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    const next: Partial<Record<ErrorKey, string>> = {};
    for (const key of Object.keys(fieldErrors) as ErrorKey[]) {
      const message = fieldErrors[key]?.[0];
      if (message) next[key] = message;
    }
    setErrors(next);
  };

  /** Payment completed inside the processor's frame. */
  const handlePaid = useCallback(
    (result: { sessionId: string; orderKey: string; orderNumber: string }) => {
      if (!pending) return;
      const paid: DemoOrder = {
        ...pending.receipt,
        // The server assigned the real order number when it created the row.
        orderNumber: result.orderNumber,
        gatewaySessionId: result.sessionId,
        checkoutId: result.orderKey,
      };
      writeDemoOrder(paid);
      track("purchase_completed", {
        order_number: paid.orderNumber,
        method: paid.method,
        item_count: paid.items.reduce((n, i) => n + i.qty, 0),
        total_minor: paid.totals.total,
      });

      setPlacing(true);
      void (async () => {
        try {
          await clear();
        } catch {
          // Best-effort — the confirmation page reads the order by key.
        }
        // `order` is the handle the confirmation page loads the real order by.
        router.push(
          `/order-received?order=${encodeURIComponent(result.orderKey)}&session_id=${encodeURIComponent(result.sessionId)}`
        );
      })();
    },
    [pending, clear, router]
  );

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!ready) {
    return (
      <div
        aria-busy="true"
        className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]"
      >
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (items.length === 0 && !placing) {
    // The live /checkout/ redirects an empty cart to the cart page's notice.
    return (
      <FadeIn className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-[15px] text-ink-muted">{cartPage.empty}</p>
        {/* Primary (green) — the page's one CTA */}
        <Button asChild className="mt-2 h-10 px-6">
          <Link href="/catalog">{cartPage.returnToShop}</Link>
        </Button>
      </FadeIn>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  const { privacyNotice, termsCheckbox } = checkoutPage;

  return (
    <FadeIn>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col">
          {/*
            Sections 01–03 lock once the card surface is live. The order has
            been created and priced by then, and the processor is holding a
            session for it — letting the address drift underneath that would
            ship the parcel somewhere the order does not say. "Edit details"
            tears the session down and unlocks them again.
            `display: contents` keeps the fieldset out of the layout; native
            disabling still reaches every control inside it.
          */}
          <fieldset disabled={locked} className="contents">
          {/* 01 — Contact */}
          <section className="flex flex-col gap-5 pb-10">
            <SectionHead index="01">{checkoutPage.contactHeading}</SectionHead>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="checkout-email">
                {checkoutPage.emailLabel}
              </FieldLabel>
              <Input
                id="checkout-email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => setText("email", e.target.value)}
                aria-invalid={errors.email ? true : undefined}
                className="h-10"
              />
              <FieldDescription>{checkoutPage.emailHelp}</FieldDescription>
              <FieldError>{errors.email}</FieldError>
            </Field>
          </section>

          {/* 02 — Shipping address */}
          <section className="hairline-t flex flex-col gap-5 py-10">
            <SectionHead index="02">{checkoutPage.shippingHeading}</SectionHead>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.firstName}>
                <FieldLabel htmlFor="checkout-first-name">
                  {checkoutPage.firstNameLabel}
                </FieldLabel>
                <Input
                  id="checkout-first-name"
                  autoComplete="given-name"
                  value={values.firstName}
                  onChange={(e) => setText("firstName", e.target.value)}
                  aria-invalid={errors.firstName ? true : undefined}
                  className="h-10"
                />
                <FieldError>{errors.firstName}</FieldError>
              </Field>

              <Field data-invalid={!!errors.lastName}>
                <FieldLabel htmlFor="checkout-last-name">
                  {checkoutPage.lastNameLabel}
                </FieldLabel>
                <Input
                  id="checkout-last-name"
                  autoComplete="family-name"
                  value={values.lastName}
                  onChange={(e) => setText("lastName", e.target.value)}
                  aria-invalid={errors.lastName ? true : undefined}
                  className="h-10"
                />
                <FieldError>{errors.lastName}</FieldError>
              </Field>
            </div>

            <Field data-invalid={!!errors.address1}>
              <FieldLabel htmlFor="checkout-address1">
                {checkoutPage.streetLabel}
              </FieldLabel>
              <Input
                id="checkout-address1"
                autoComplete="address-line1"
                placeholder={checkoutPage.streetHelp}
                value={values.address1}
                onChange={(e) => setText("address1", e.target.value)}
                aria-invalid={errors.address1 ? true : undefined}
                className="h-10"
              />
              <FieldError>{errors.address1}</FieldError>
            </Field>

            <Field data-invalid={!!errors.address2}>
              <FieldLabel htmlFor="checkout-address2">
                {checkoutPage.apartmentLabel}
              </FieldLabel>
              <Input
                id="checkout-address2"
                autoComplete="address-line2"
                placeholder={checkoutPage.apartmentPlaceholder}
                value={values.address2}
                onChange={(e) => setText("address2", e.target.value)}
                aria-invalid={errors.address2 ? true : undefined}
                className="h-10"
              />
              <FieldError>{errors.address2}</FieldError>
            </Field>

            <div className="grid gap-5 sm:grid-cols-[2fr_1.2fr_1fr]">
              <Field data-invalid={!!errors.city}>
                <FieldLabel htmlFor="checkout-city">
                  {checkoutPage.cityLabel}
                </FieldLabel>
                <Input
                  id="checkout-city"
                  autoComplete="address-level2"
                  value={values.city}
                  onChange={(e) => setText("city", e.target.value)}
                  aria-invalid={errors.city ? true : undefined}
                  className="h-10"
                />
                <FieldError>{errors.city}</FieldError>
              </Field>

              <Field data-invalid={!!errors.state}>
                <FieldLabel htmlFor="checkout-state">
                  {checkoutPage.stateLabel}
                </FieldLabel>
                <Select
                  value={values.state}
                  onValueChange={(v) => setText("state", v)}
                >
                  <SelectTrigger
                    id="checkout-state"
                    className="h-10 w-full"
                    aria-invalid={errors.state ? true : undefined}
                  >
                    <SelectValue placeholder={checkoutPage.statePlaceholder} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72">
                    {US_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{errors.state}</FieldError>
              </Field>

              <Field data-invalid={!!errors.zip}>
                <FieldLabel htmlFor="checkout-zip">
                  {checkoutPage.zipLabel}
                </FieldLabel>
                <Input
                  id="checkout-zip"
                  autoComplete="postal-code"
                  maxLength={10}
                  value={values.zip}
                  onChange={(e) => setText("zip", e.target.value)}
                  aria-invalid={errors.zip ? true : undefined}
                  className="data-num h-10"
                />
                <FieldError>{errors.zip}</FieldError>
              </Field>
            </div>
          </section>

          {/* 03 — Additional notes */}
          <section className="hairline-t flex flex-col gap-5 py-10">
            <SectionHead index="03">{checkoutPage.notesHeading}</SectionHead>

            <Field data-invalid={!!errors.notes}>
              <FieldLabel htmlFor="checkout-notes">
                {checkoutPage.notesLabel}
              </FieldLabel>
              <Textarea
                id="checkout-notes"
                rows={3}
                placeholder={checkoutPage.notesPlaceholder}
                value={values.notes}
                onChange={(e) => setText("notes", e.target.value)}
                aria-invalid={errors.notes ? true : undefined}
              />
              <FieldError>{errors.notes}</FieldError>
            </Field>
          </section>
          </fieldset>

          {/* 04 — Payment method */}
          <section className="hairline-t flex flex-col gap-5 py-10">
            <SectionHead index="04">{checkoutPage.paymentHeading}</SectionHead>

            <RadioGroup
              value={values.method}
              onValueChange={(v) => setMethod(v as PaymentMethodId)}
              aria-invalid={errors.method ? true : undefined}
              className="gap-3"
            >
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.id}
                  htmlFor={`checkout-pay-${m.id}`}
                  // Soft payment card — 16px radius, quiet navy border when
                  // selected (glow-free), faint navy wash for the fill.
                  className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-hairline bg-surface p-4 transition-colors hover:border-ink-muted/40 has-data-[state=checked]:border-green has-data-[state=checked]:bg-green/[0.03]"
                >
                  <RadioGroupItem
                    id={`checkout-pay-${m.id}`}
                    value={m.id}
                    className="mt-1"
                  />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-display text-[17px] leading-tight font-semibold tracking-[-0.01em] text-ink">
                      {m.label}
                    </span>
                    <span className="text-[13px] leading-snug text-ink-muted">
                      {m.note}
                    </span>
                    <span className="text-[13px] leading-snug text-ink-muted">
                      {m.instructions}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
            <FieldError className="-mt-2">{errors.method}</FieldError>

            <p className="text-[13px] leading-relaxed text-ink-muted">
              {privacyNotice.before}
              <Link
                href="/privacy"
                className="font-medium text-green underline underline-offset-2 transition-colors hover:text-green-deep"
              >
                {privacyNotice.link}
              </Link>
              {privacyNotice.after}
            </p>

            {/* Trust graft #4 — the live terms checkbox, required */}
            <Field data-invalid={!!errors.terms}>
              <label
                htmlFor="checkout-terms"
                className="flex cursor-pointer items-start gap-3"
              >
                <Checkbox
                  id="checkout-terms"
                  checked={values.terms}
                  onCheckedChange={(checked) => setTerms(checked === true)}
                  aria-invalid={errors.terms ? true : undefined}
                  className="mt-0.5 bg-surface"
                />
                <span className="text-sm leading-relaxed text-ink">
                  {termsCheckbox.before}
                  <Link
                    href="/terms"
                    className="font-medium text-green underline underline-offset-2 transition-colors hover:text-green-deep"
                  >
                    {termsCheckbox.link}
                  </Link>
                  {termsCheckbox.after}
                </span>
              </label>
              <FieldError>{errors.terms}</FieldError>
            </Field>

            {/*
              The card itself, in place. No second page and no redirect: the
              processor's embedded surface mounts here once the details above
              are complete, and it carries its own pay button, so this form has
              no submit of its own.
            */}
            {!paymentEnabled ? (
              <div role="status" className="soft-card px-4 py-4">
                <p className="text-[15px] font-medium text-ink">
                  {checkoutPayment.unavailableHeading}
                </p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">
                  {checkoutPayment.unavailableBody}
                </p>
              </div>
            ) : pending ? (
              <div className="hairline-t flex flex-col gap-5 pt-8">
                <p className="text-[13px] text-ink-muted">
                  {checkoutPayment.payingTotal}{" "}
                  <span className="data-num text-ink">
                    {formatMinor(totals.total, totals.currencyMinorUnit)}
                  </span>
                </p>

                {repriced !== null && repriced !== totals.total ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-hairline bg-warn-wash px-4 py-3 text-[14px] leading-relaxed text-ink"
                  >
                    {checkoutPayment.repriced(
                      formatMinor(repriced, totals.currencyMinorUnit)
                    )}
                  </p>
                ) : null}

                <GatewayPayment
                  checkoutId={pending.checkoutId}
                  buyer={pending.buyer}
                  lines={pending.lines}
                  coupons={totals.appliedCoupons}
                  expectedTotalMinor={totals.total}
                  onPaid={handlePaid}
                  onRepriced={setRepriced}
                />

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setPending(null);
                      setRepriced(null);
                    }}
                    disabled={placing}
                    className="cursor-pointer text-[14px] font-medium text-green underline underline-offset-2 transition-colors hover:text-green-deep disabled:cursor-not-allowed disabled:text-ink-muted"
                  >
                    {checkoutPayment.backToDetails}
                  </button>
                </div>
              </div>
            ) : formComplete ? (
              // Only reachable by unlocking the details and changing nothing:
              // an edit would have re-armed the card on its own.
              <div className="hairline-t pt-8">
                <Button
                  type="button"
                  onClick={rearm}
                  className="h-11 w-full text-sm sm:w-auto sm:px-10"
                >
                  {checkoutPayment.resumePayment}
                </Button>
              </div>
            ) : (
              <div
                role="status"
                className="hairline-t pt-8 text-[14px] leading-relaxed text-ink-muted"
              >
                {checkoutPayment.awaitingDetails}
              </div>
            )}
          </section>
        </form>

        <OrderSummary />
      </div>
    </FadeIn>
  );
}
