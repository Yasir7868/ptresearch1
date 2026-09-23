/**
 * lib/admin/order-status.ts — WooCommerce order statuses as the admin panel
 * presents them. Client-safe.
 *
 * Labels come from the store at runtime (GET /wc/v3/orders/statuses), so a
 * status added by a plugin shows up with its own name; this file only adds
 * the presentation for the core statuses and a neutral fallback for others.
 */

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "muted";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
  /** What the status means, in WooCommerce's terms. */
  description: string;
}

export const CORE_STATUSES: Record<string, StatusMeta> = {
  pending: {
    label: "Pending payment",
    tone: "neutral",
    description: "Order received, no payment yet.",
  },
  processing: {
    label: "Processing",
    tone: "success",
    description: "Paid and stock reduced. Ready to pack and ship.",
  },
  "on-hold": {
    label: "On hold",
    tone: "warning",
    description: "Awaiting payment confirmation. Stock is reduced.",
  },
  completed: {
    label: "Completed",
    tone: "info",
    description: "Fulfilled. No further action needed.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "muted",
    description: "Cancelled by staff or the customer. Stock was restored.",
  },
  refunded: {
    label: "Refunded",
    tone: "muted",
    description: "Fully refunded.",
  },
  failed: {
    label: "Failed",
    tone: "danger",
    description: "Payment failed or was declined.",
  },
  "checkout-draft": {
    label: "Draft",
    tone: "muted",
    description: "A checkout that was started but not placed.",
  },
};

/** Statuses excluded from "All", matching WooCommerce's own orders screen. */
export const HIDDEN_FROM_ALL = new Set(["checkout-draft", "trash", "auto-draft"]);

/** The order WooCommerce lists its status views in. */
export const STATUS_ORDER = [
  "pending",
  "processing",
  "on-hold",
  "completed",
  "cancelled",
  "refunded",
  "failed",
  "checkout-draft",
];

/** Statuses offered for bulk changes (the same set WP admin offers). */
export const BULK_STATUSES = ["processing", "on-hold", "completed", "cancelled"] as const;

export function statusMeta(slug: string, name?: string): StatusMeta {
  const core = CORE_STATUSES[slug];
  if (core) return name ? { ...core, label: name } : core;
  return {
    label: name ?? slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
    tone: "neutral",
    description: "A custom status added by a WooCommerce extension.",
  };
}

/** Changing to these statuses usually emails the customer (WooCommerce emails). */
export const CUSTOMER_EMAIL_STATUSES = new Set(["processing", "completed", "on-hold", "refunded", "cancelled"]);
