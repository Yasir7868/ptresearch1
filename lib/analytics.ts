/**
 * lib/analytics.ts — Stubbed analytics adapter.
 *
 * Mirrors the CartAdapter pattern: a clean interface with a swappable
 * implementation so the design layer never couples to a tracking vendor.
 *
 * Current stub: logs to the console in development, silent in production.
 * To connect PostHog, implement AnalyticsAdapter and call
 * setAnalyticsAdapter() once at app bootstrap.
 *
 * PostHog swap (reference):
 *   import posthog from 'posthog-js'
 *   import { setAnalyticsAdapter, type AnalyticsAdapter } from '@/lib/analytics'
 *
 *   const postHogAdapter: AnalyticsAdapter = {
 *     track:    (event, props) => posthog.capture(event, props),
 *     identify: (userId, traits) => posthog.identify(userId, traits),
 *     page:     (name, props)   => posthog.capture('$pageview', { ...props, name }),
 *   }
 *
 *   setAnalyticsAdapter(postHogAdapter)  // call once in root layout
 *
 * Usage (anywhere, server or client):
 *   import { track, page, identify } from '@/lib/analytics'
 *
 *   track('product_viewed', { sku: 'PT-XXXX', dose: '5mg' })
 *   track('add_to_cart',    { sku, dose, price_cents: 4999 })
 *   track('checkout_initiated', { item_count: 3, subtotal_cents: 14997 })
 *   page('/shop')
 */

// ---------------------------------------------------------------------------
// AnalyticsAdapter interface — the swappable seam
// ---------------------------------------------------------------------------

export interface AnalyticsAdapter {
  /**
   * Track a discrete event with optional properties.
   *
   * Canonical event names use snake_case. Properties follow the same
   * convention so PostHog / Segment ingest them without transformation.
   *
   * Common events:
   *   page_viewed, product_viewed, add_to_cart, remove_from_cart,
   *   coupon_applied, checkout_initiated, purchase_completed, search_performed
   */
  track(event: string, props?: Record<string, unknown>): void;

  /**
   * Associate subsequent events with an identified user.
   * Call after login / session recovery.
   */
  identify(userId: string, traits?: Record<string, unknown>): void;

  /**
   * Log a page / route change.
   * Next.js App Router: call on route transitions via usePathname() effect.
   */
  page(name?: string, props?: Record<string, unknown>): void;
}

// ---------------------------------------------------------------------------
// ConsoleAnalyticsAdapter — stub
// ---------------------------------------------------------------------------

const isDev = process.env.NODE_ENV !== "production";

/**
 * Stub adapter: console.log in development, no-op in production.
 */
class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
  track(event: string, props?: Record<string, unknown>): void {
    if (isDev) {
      console.log("[analytics] track", event, props ?? {});
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (isDev) {
      console.log("[analytics] identify", userId, traits ?? {});
    }
  }

  page(name?: string, props?: Record<string, unknown>): void {
    if (isDev) {
      console.log("[analytics] page", name ?? "(route)", props ?? {});
    }
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton
// ---------------------------------------------------------------------------

let _adapter: AnalyticsAdapter = new ConsoleAnalyticsAdapter();

/**
 * Swap the active adapter at app bootstrap (before any track/page calls).
 * Idempotent — safe to call multiple times, last write wins.
 */
export function setAnalyticsAdapter(adapter: AnalyticsAdapter): void {
  _adapter = adapter;
}

/** Direct access to the active adapter (for DI / testing). */
export function getAnalyticsAdapter(): AnalyticsAdapter {
  return _adapter;
}

// ---------------------------------------------------------------------------
// Convenience functions — the primary call-site API
// ---------------------------------------------------------------------------

export const track = (
  event: string,
  props?: Record<string, unknown>
): void => {
  _adapter.track(event, props);
};

export const identify = (
  userId: string,
  traits?: Record<string, unknown>
): void => {
  _adapter.identify(userId, traits);
};

export const page = (
  name?: string,
  props?: Record<string, unknown>
): void => {
  _adapter.page(name, props);
};
