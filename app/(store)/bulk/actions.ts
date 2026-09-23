"use server";

/**
 * Bulk quote request — the /bulk form's server action.
 *
 * Deliberately transport-agnostic. The storefront has no mail dependency
 * (package.json carries none) and the admin panel's SQLite is staff-only, so
 * this action validates the request and hands it to whichever sink is
 * configured, in order:
 *
 *   1. BULK_QUOTE_WEBHOOK_URL — POST the JSON payload. Works with a
 *      WooCommerce/WordPress endpoint, Zapier, Make, n8n, a Slack incoming
 *      webhook, or an email relay. This is the intended production path.
 *   2. Nothing configured — the request is logged server-side and the action
 *      still succeeds, so a preview deploy never shows a false failure to a
 *      real researcher. Configure the webhook before launch.
 *
 * Validation is zod (already a dependency). Errors come back as a field map
 * the form renders inline; nothing is thrown at the client.
 *
 * PRODUCT.md rule 2: no real client contact address is written here. The
 * reply-to shown to the buyer is contactInfo.email from the harvested live
 * copy, and the destination lives entirely in the webhook's own config.
 */

import { z } from "zod";
import { bulkCopy } from "@/content/bulk";
import type { QuoteState } from "@/components/bulk/quote-state";

const copy = bulkCopy.quote;

const QuoteSchema = z.object({
  name: z.string().trim().min(1, copy.required).max(120),
  email: z.string().trim().min(1, copy.required).email(copy.invalidEmail).max(200),
  organization: z.string().trim().min(1, copy.required).max(160),
  orgType: z.string().trim().min(1, copy.required).max(80),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  compounds: z.string().trim().min(1, copy.required).max(4000),
  cadence: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  // The builder's current order, serialized — optional context, not trusted.
  orderSummary: z.string().trim().max(4000).optional().or(z.literal("")),
  consent: z
    .string()
    .refine((v) => v === "on" || v === "true", copy.consentRequired),
});

export async function submitBulkQuote(
  _prev: QuoteState,
  formData: FormData
): Promise<QuoteState> {
  // Honeypot: a bot that fills every field trips this and gets a silent 200.
  if (String(formData.get("website") ?? "").length > 0) {
    return { ok: true, errors: {} };
  }

  const parsed = QuoteSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    organization: formData.get("organization") ?? "",
    orgType: formData.get("orgType") ?? "",
    phone: formData.get("phone") ?? "",
    compounds: formData.get("compounds") ?? "",
    cadence: formData.get("cadence") ?? "",
    notes: formData.get("notes") ?? "",
    orderSummary: formData.get("orderSummary") ?? "",
    consent: formData.get("consent") ?? "",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }

  const payload = {
    type: "bulk_quote_request",
    receivedAt: new Date().toISOString(),
    ...parsed.data,
    consent: true,
  };

  const endpoint = process.env.BULK_QUOTE_WEBHOOK_URL;
  if (!endpoint) {
    // No sink configured — record it and succeed rather than fail a real lead.
    console.info("[bulk-quote] no BULK_QUOTE_WEBHOOK_URL set; payload:", payload);
    return { ok: true, errors: {} };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.BULK_QUOTE_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.BULK_QUOTE_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[bulk-quote] webhook rejected", res.status);
      return { ok: false, errors: {}, formError: copy.genericError };
    }
  } catch (error) {
    console.error("[bulk-quote] webhook failed", error);
    return { ok: false, errors: {}, formError: copy.genericError };
  }

  return { ok: true, errors: {} };
}
