"use client";

/**
 * CheckoutForm — DEMO checkout (/checkout), Reference Grade.
 *
 * Hand-rolled controlled form validated with zod safeParse on submit
 * (react-hook-form is not installed; shadcn's Field primitives are
 * presentation-only and dependency-free). On success the order is written to
 * sessionStorage, the cart is cleared, and the router moves to
 * /order-received. NOTHING is transmitted — the page carries a prototype
 * notice, and payment methods only promise instructions on the confirmation
 * page.
 *
 * Trust graft #4: the RUO/18+ acknowledgment checkbox mirrors the verbatim
 * Terms clauses (§2 Age & Eligibility, §3 Research Use Only — Mandatory
 * Acknowledgment) and is zod-required — the order cannot be placed unchecked.
 */

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
import { ageGate } from "@/content/site-copy";
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
  name: z.string().trim().min(2, "Enter the recipient's full name."),
  address1: z.string().trim().min(4, "Enter a street address."),
  address2: z.string().trim().max(120, "Keep this line under 120 characters."),
  city: z.string().trim().min(2, "Enter a city."),
  state: z.string().min(2, "Select a state."),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code (12345 or 12345-6789)."),
  notes: z.string().trim().max(500, "Keep order notes under 500 characters."),
  method: z.enum(PAYMENT_METHOD_IDS, "Select a payment method."),
  // Trust graft #4 — the order cannot be placed without the acknowledgment.
  ack: z.literal(
    true,
    "Confirm the age and research-use acknowledgment to place your order."
  ),
});

type TextField =
  | "email"
  | "name"
  | "address1"
  | "address2"
  | "city"
  | "state"
  | "zip"
  | "notes";
type ErrorKey = TextField | "method" | "ack";

interface FormValues {
  email: string;
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  method: PaymentMethodId | "";
  ack: boolean;
}

const INITIAL_VALUES: FormValues = {
  email: "",
  name: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  notes: "",
  method: "",
  ack: false,
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

export function CheckoutForm() {
  const { items, count, totals, clear } = useCart();
  const ready = useCartReady();
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [placing, setPlacing] = useState(false);

  const setText = (field: TextField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  };

  const setMethod = (method: PaymentMethodId) => {
    setValues((v) => ({ ...v, method }));
    setErrors((e) => (e.method ? { ...e, method: undefined } : e));
  };

  const setAck = (ack: boolean) => {
    setValues((v) => ({ ...v, ack }));
    setErrors((e) => (e.ack ? { ...e, ack: undefined } : e));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (placing) return;

    const result = checkoutSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      const next: Partial<Record<ErrorKey, string>> = {};
      for (const key of Object.keys(fieldErrors) as ErrorKey[]) {
        const message = fieldErrors[key]?.[0];
        if (message) next[key] = message;
      }
      setErrors(next);
      return;
    }
    setErrors({});

    const data = result.data;
    const order: DemoOrder = {
      orderNumber: createDemoOrderNumber(),
      createdAt: new Date().toISOString(),
      email: data.email,
      method: data.method,
      shipTo: {
        name: data.name,
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
    };

    writeDemoOrder(order);
    track("purchase_completed", {
      demo: true,
      order_number: order.orderNumber,
      method: data.method,
      item_count: count,
      total_minor: totals.total,
    });

    setPlacing(true);
    void (async () => {
      try {
        await clear();
      } catch {
        // Best-effort — the confirmation page reads from sessionStorage.
      }
      router.push("/order-received");
    })();
  };

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
    return (
      <FadeIn className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="micro-label">Your cart is empty</p>
        <p className="max-w-[32ch] text-sm text-ink-muted">
          Add research compounds before checking out.
        </p>
        {/* Primary (green) — the page's one CTA */}
        <Button asChild className="mt-2 h-10 px-6">
          <Link href="/catalog">Browse the catalog</Link>
        </Button>
      </FadeIn>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <FadeIn>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col">
          {/* 01 — Contact */}
          <section className="flex flex-col gap-5 pb-10">
            <SectionHead index="01">Contact</SectionHead>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="checkout-email">Email</FieldLabel>
              <Input
                id="checkout-email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => setText("email", e.target.value)}
                aria-invalid={errors.email ? true : undefined}
                className="h-10"
              />
              <FieldError>{errors.email}</FieldError>
            </Field>
          </section>

          {/* 02 — Shipping address */}
          <section className="hairline-t flex flex-col gap-5 py-10">
            <SectionHead index="02">Shipping address</SectionHead>

            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="checkout-name">Full name</FieldLabel>
              <Input
                id="checkout-name"
                autoComplete="name"
                value={values.name}
                onChange={(e) => setText("name", e.target.value)}
                aria-invalid={errors.name ? true : undefined}
                className="h-10"
              />
              <FieldError>{errors.name}</FieldError>
            </Field>

            <Field data-invalid={!!errors.address1}>
              <FieldLabel htmlFor="checkout-address1">Address</FieldLabel>
              <Input
                id="checkout-address1"
                autoComplete="address-line1"
                value={values.address1}
                onChange={(e) => setText("address1", e.target.value)}
                aria-invalid={errors.address1 ? true : undefined}
                className="h-10"
              />
              <FieldError>{errors.address1}</FieldError>
            </Field>

            <Field data-invalid={!!errors.address2}>
              <FieldLabel htmlFor="checkout-address2">
                Apartment, suite, etc.{" "}
                <span className="font-normal text-ink-muted">(optional)</span>
              </FieldLabel>
              <Input
                id="checkout-address2"
                autoComplete="address-line2"
                value={values.address2}
                onChange={(e) => setText("address2", e.target.value)}
                aria-invalid={errors.address2 ? true : undefined}
                className="h-10"
              />
              <FieldError>{errors.address2}</FieldError>
            </Field>

            <div className="grid gap-5 sm:grid-cols-[2fr_1.2fr_1fr]">
              <Field data-invalid={!!errors.city}>
                <FieldLabel htmlFor="checkout-city">City</FieldLabel>
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
                <FieldLabel htmlFor="checkout-state">State</FieldLabel>
                <Select
                  value={values.state}
                  onValueChange={(v) => setText("state", v)}
                >
                  <SelectTrigger
                    id="checkout-state"
                    className="h-10 w-full"
                    aria-invalid={errors.state ? true : undefined}
                  >
                    <SelectValue placeholder="Select" />
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
                <FieldLabel htmlFor="checkout-zip">ZIP</FieldLabel>
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

          {/* 03 — Order notes */}
          <section className="hairline-t flex flex-col gap-5 py-10">
            <SectionHead index="03">Order notes</SectionHead>

            <Field data-invalid={!!errors.notes}>
              <FieldLabel htmlFor="checkout-notes">
                Notes{" "}
                <span className="font-normal text-ink-muted">(optional)</span>
              </FieldLabel>
              <Textarea
                id="checkout-notes"
                rows={3}
                value={values.notes}
                onChange={(e) => setText("notes", e.target.value)}
                aria-invalid={errors.notes ? true : undefined}
              />
              <FieldError>{errors.notes}</FieldError>
            </Field>
          </section>

          {/* 04 — Payment method */}
          <section className="hairline-t flex flex-col gap-5 py-10">
            <SectionHead index="04">Payment method</SectionHead>

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
                  </span>
                </label>
              ))}
            </RadioGroup>
            <FieldError className="-mt-2">{errors.method}</FieldError>
          </section>

          {/* 05 — Acknowledgment (trust graft #4 — mirrors Terms §2 + §3) */}
          <section className="hairline-t flex flex-col gap-5 py-10">
            <SectionHead index="05">Acknowledgment</SectionHead>

            <Field data-invalid={!!errors.ack}>
              <div className="warn-line rounded-xl p-4">
                <label
                  htmlFor="checkout-ack"
                  className="flex cursor-pointer items-start gap-3"
                >
                  <Checkbox
                    id="checkout-ack"
                    checked={values.ack}
                    onCheckedChange={(checked) => setAck(checked === true)}
                    aria-invalid={errors.ack ? true : undefined}
                    className="mt-0.5 bg-surface"
                  />
                  <span className="text-sm leading-relaxed text-ink">
                    I am at least 18 years of age. {ageGate.confirmUse}
                  </span>
                </label>
                <p className="mt-3 pl-7 text-[13px] leading-relaxed text-ink-muted">
                  Required by the{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-green underline underline-offset-2 transition-colors hover:text-green-deep"
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  — Age &amp; Eligibility and Research Use Only — Mandatory
                  Acknowledgment.
                </p>
              </div>
              <FieldError>{errors.ack}</FieldError>
            </Field>
          </section>

          {/* Submit */}
          <div className="hairline-t pt-8">
            <Button
              type="submit"
              disabled={placing}
              className="h-11 w-full text-sm sm:w-auto sm:px-10"
            >
              {placing ? "Placing order…" : "Place order"}
            </Button>
            <p className="micro-label mt-4">
              Demo checkout — no payment is processed and no order is
              transmitted.
            </p>
          </div>
        </form>

        <OrderSummary />
      </div>
    </FadeIn>
  );
}
