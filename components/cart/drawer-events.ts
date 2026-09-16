/**
 * drawer-events — tiny window-event seam for opening the cart drawer from
 * anywhere in the client tree (e.g. the PDP BuyPanel after add-to-cart)
 * without threading drawer state through context. The Header owns the
 * drawer's open state and subscribes to this event.
 */

export const CART_DRAWER_OPEN_EVENT = "pt:cart-drawer-open";

/** Ask the Header to open the cart drawer. No-op during SSR. */
export function requestCartDrawerOpen(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_DRAWER_OPEN_EVENT));
}
