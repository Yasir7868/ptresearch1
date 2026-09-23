"use client";

/**
 * BulkQuoteForm — the contract-pricing request on /bulk#quote.
 *
 * A progressively-enhanced form: it posts through `useActionState` to the
 * server action in app/(store)/bulk/actions.ts, so it still submits with
 * JavaScript disabled and field errors render inline from the action's
 * result. `useFormStatus` drives the pending label from inside the form, the
 * only place React exposes it.
 *
 * The research-use checkbox is required, matching the age gate's own
 * confirmation — this form asks for volume, which is exactly where RUO
 * framing has to be explicit rather than fine print.
 *
 * All labels come from content/bulk.ts.
 */

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { bulkCopy } from "@/content/bulk";
import { compliance } from "@/content/compliance";
import { contactInfo } from "@/content/site-copy";
import { submitBulkQuote } from "@/app/(store)/bulk/actions";
import { emptyQuoteState, type QuoteState } from "./quote-state";
import { CONTAINER, Kicker, SERIF } from "@/components/landing/parts";
import { cn } from "@/lib/utils";

const copy = bulkCopy.quote;

const FIELD =
  "h-[46px] w-full rounded-lg border border-rule bg-white px-3.5 text-[15px] text-navy-ink placeholder:text-steel focus-visible:border-cobalt focus-visible:ring-2 focus-visible:ring-cobalt/30 focus-visible:outline-none";
const LABEL = "mb-1.5 block text-[14px] font-semibold text-navy-ink";

function Err({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-[13px] font-semibold text-error">{message}</p>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-[52px] cursor-pointer rounded-lg bg-cobalt px-8 text-[16px] font-bold text-white transition-colors hover:bg-cobalt-bright disabled:cursor-not-allowed disabled:bg-rule disabled:text-steel"
    >
      {pending ? copy.submitting : copy.submit}
    </button>
  );
}

export function BulkQuoteForm() {
  const [state, formAction] = useActionState<QuoteState, FormData>(
    submitBulkQuote,
    emptyQuoteState
  );
  const id = useId();
  const e = state.errors;

  return (
    <section id="quote" className="scroll-mt-24 bg-white">
      <div className={cn(CONTAINER, "py-16")}>
        <div className="mx-auto max-w-[760px]">
          <Kicker>{copy.eyebrow}</Kicker>
          <h2
            className={cn(
              SERIF,
              "mt-2 mb-3 text-[clamp(26px,3.5vw,36px)] tracking-[-0.01em] text-navy-ink"
            )}
          >
            {copy.heading}
          </h2>
          <p className="mb-8 text-[16px] leading-[1.65] text-steel-ink">
            {copy.body}
          </p>

          {state.ok ? (
            <div className="rounded-[14px] border border-ok/30 bg-ok/10 p-6">
              <h3 className="mb-1.5 text-[18px] font-extrabold text-navy-ink">
                {copy.successHeading}
              </h3>
              <p className="text-[15px] leading-[1.6] text-steel-ink">
                {copy.successBody}
              </p>
            </div>
          ) : (
            <form action={formAction} className="grid gap-5">
              {state.formError ? (
                <p className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-[14px] font-semibold text-error">
                  {copy.errorHeading} — {state.formError}
                </p>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${id}-name`} className={LABEL}>
                    {copy.nameLabel}
                  </label>
                  <input
                    id={`${id}-name`}
                    name="name"
                    required
                    autoComplete="name"
                    className={FIELD}
                    aria-invalid={Boolean(e.name)}
                  />
                  <Err message={e.name} />
                </div>
                <div>
                  <label htmlFor={`${id}-email`} className={LABEL}>
                    {copy.emailLabel}
                  </label>
                  <input
                    id={`${id}-email`}
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={FIELD}
                    aria-invalid={Boolean(e.email)}
                  />
                  <Err message={e.email} />
                </div>
                <div>
                  <label htmlFor={`${id}-org`} className={LABEL}>
                    {copy.orgLabel}
                  </label>
                  <input
                    id={`${id}-org`}
                    name="organization"
                    required
                    autoComplete="organization"
                    className={FIELD}
                    aria-invalid={Boolean(e.organization)}
                  />
                  <Err message={e.organization} />
                </div>
                <div>
                  <label htmlFor={`${id}-orgtype`} className={LABEL}>
                    {copy.orgTypeLabel}
                  </label>
                  <select
                    id={`${id}-orgtype`}
                    name="orgType"
                    required
                    defaultValue={copy.orgTypes[0]}
                    className={FIELD}
                    aria-invalid={Boolean(e.orgType)}
                  >
                    {copy.orgTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <Err message={e.orgType} />
                </div>
                <div>
                  <label htmlFor={`${id}-phone`} className={LABEL}>
                    {copy.phoneLabel}
                  </label>
                  <input
                    id={`${id}-phone`}
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor={`${id}-cadence`} className={LABEL}>
                    {copy.cadenceLabel}
                  </label>
                  <select
                    id={`${id}-cadence`}
                    name="cadence"
                    defaultValue={copy.cadenceOptions[0]}
                    className={FIELD}
                  >
                    {copy.cadenceOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor={`${id}-compounds`} className={LABEL}>
                  {copy.compoundsLabel}
                </label>
                <textarea
                  id={`${id}-compounds`}
                  name="compounds"
                  required
                  rows={4}
                  placeholder={copy.compoundsPlaceholder}
                  className={cn(FIELD, "h-auto py-3 leading-[1.55]")}
                  aria-invalid={Boolean(e.compounds)}
                />
                <Err message={e.compounds} />
              </div>

              <div>
                <label htmlFor={`${id}-notes`} className={LABEL}>
                  {copy.notesLabel}
                </label>
                <textarea
                  id={`${id}-notes`}
                  name="notes"
                  rows={3}
                  placeholder={copy.notesPlaceholder}
                  className={cn(FIELD, "h-auto py-3 leading-[1.55]")}
                />
              </div>

              {/* Honeypot — off-screen, not hidden from the form payload. */}
              <div aria-hidden="true" className="absolute left-[-9999px]">
                <label htmlFor={`${id}-website`}>Website</label>
                <input
                  id={`${id}-website`}
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-rule bg-mist px-4 py-3.5">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 accent-cobalt"
                  aria-invalid={Boolean(e.consent)}
                />
                <span className="text-[14px] leading-[1.5] text-steel-ink">
                  {copy.consentLabel}
                </span>
              </label>
              <Err message={e.consent} />

              <div className="flex flex-wrap items-center gap-4">
                <SubmitButton />
                <p className="text-[13px] text-steel">
                  {contactInfo.emailUsLabel}{" "}
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-cobalt hover:underline"
                  >
                    {contactInfo.email}
                  </a>
                </p>
              </div>

              <p className="text-[12px] leading-[1.5] text-steel">
                {compliance.productRuoLine}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
