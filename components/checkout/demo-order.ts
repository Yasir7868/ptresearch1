/**
 * Demo-order plumbing for the prototype checkout.
 *
 * The demo checkout does NOT transmit anything: on submit it writes the order
 * to sessionStorage, clears the cart, and /order-received reads it back.
 * When the store backend (WooCommerce) is connected, this module is replaced
 * by a real order submission — nothing here touches the network.
 */

import type { CartItem, CartTotals } from "@/lib/cart";
import { checkoutPage } from "@/content/site-copy";

// ---------------------------------------------------------------------------
// Payment methods — the live checkout offers one card gateway ("Pay securely")
// ---------------------------------------------------------------------------

export type PaymentMethodId = "card";

export const PAYMENT_METHOD_IDS = ["card"] as const;

export interface PaymentMethodInfo {
  id: PaymentMethodId;
  label: string;
  /** Description shown on the checkout radio card. */
  note: string;
  /** What happens after the order is placed. */
  instructions: string;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: "card",
    label: checkoutPage.paymentMethod.label,
    note: checkoutPage.paymentMethod.description,
    instructions: checkoutPage.paymentMethod.afterOrder,
  },
];

export function paymentMethodInfo(id: PaymentMethodId): PaymentMethodInfo {
  // PAYMENT_METHODS covers every PaymentMethodId — the fallback never fires,
  // it only satisfies the type system.
  return PAYMENT_METHODS.find((m) => m.id === id) ?? PAYMENT_METHODS[0]!;
}

// ---------------------------------------------------------------------------
// Demo order shape + sessionStorage persistence
// ---------------------------------------------------------------------------

export interface DemoOrderAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface DemoOrder {
  /** "PT-DEMO-" + 4 random digits. */
  orderNumber: string;
  /** ISO-8601 timestamp of the demo submission. */
  createdAt: string;
  email: string;
  method: PaymentMethodId;
  shipTo: DemoOrderAddress;
  notes?: string;
  /** Cart lines captured at submit time (before the cart is cleared). */
  items: CartItem[];
  /** Adapter-canonical totals captured at submit time. */
  totals: CartTotals;
  /**
   * The gateway's Checkout Session id, when the order was paid through the
   * embedded card surface. The confirmation page reconciles against it
   * (/api/payment/reconcile). Absent on an order placed while no payment
   * gateway is configured.
   */
  gatewaySessionId?: string;
  /** The stable checkout id the payment was created under. */
  checkoutId?: string;
}

export const DEMO_ORDER_KEY = "ptresearch__demo_order_v1";

export function createDemoOrderNumber(): string {
  const digits = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `PT-DEMO-${digits}`;
}

export function writeDemoOrder(order: DemoOrder): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DEMO_ORDER_KEY, JSON.stringify(order));
  } catch {
    // Storage unavailable — /order-received shows its empty state.
  }
}

export function readDemoOrder(): DemoOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DEMO_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoOrder;
    // Minimal shape check — anything malformed renders the empty state.
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.orderNumber !== "string" ||
      !Array.isArray(parsed.items) ||
      typeof parsed.totals !== "object"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
