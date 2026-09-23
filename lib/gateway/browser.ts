/**
 * Browser half of the gateway SDK — loads Stripe.js and mounts embedded Checkout.
 *
 * VENDORED from the merchant SDK "payment-gateway-checkout" v1.3.0
 * (payment-gateway-custom-site-sdk.zip, supplied by the processor). Kept as
 * source rather than an npm dependency so the server and browser halves stay
 * in separate modules — importing the package barrel would pull merchant-token
 * code into the client bundle. Only the relative import extensions were
 * changed. Re-vendor from src/ on an SDK upgrade; do not hand-edit.
 */

import type {
  BrowserCheckoutRequest,
  BrowserEmbeddedCheckoutRequest,
  GatewayCheckoutResponse,
  GatewayEmbeddedCheckoutMount,
  GatewayEmbeddedCheckoutOptions,
  GatewayEmbeddedCheckoutResponse,
} from "./types";

type StripeConstructor = (publishableKey: string, options?: Record<string, unknown>) => StripeClient | null;
type StripeClient = {
  initEmbeddedCheckout: (options: {
    fetchClientSecret: () => Promise<string> | string;
    onComplete?: () => void;
  }) => Promise<StripeEmbeddedCheckout>;
};
type StripeEmbeddedCheckout = {
  mount: (selectorOrElement: string | HTMLElement) => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    Stripe?: StripeConstructor;
  }
}

let stripeJsPromise: Promise<StripeConstructor> | undefined;

export async function redirectToGatewayCheckout(request: BrowserCheckoutRequest): Promise<void> {
  const response = await fetch(request.endpoint || '/api/payment-checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      order: request.order,
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      checkout_id: request.checkoutId,
      idempotency_key: request.idempotencyKey,
      source: request.source || 'custom_site',
      company_name: request.companyName,
      buyer_company: request.buyerCompany,
      compliance: request.compliance,
    }),
  });

  const body = (await response.json()) as Partial<GatewayCheckoutResponse> & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error || `Payment Gateway checkout failed: HTTP ${response.status}`);
  }

  if (!body.checkout_url) {
    throw new Error('Payment Gateway checkout response did not include checkout_url');
  }

  window.location.assign(body.checkout_url);
}

export async function fetchGatewayEmbeddedCheckoutSession(
  request: BrowserEmbeddedCheckoutRequest,
): Promise<GatewayEmbeddedCheckoutResponse> {
  const response = await fetch(request.endpoint || '/api/embedded-checkout-session', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      order: request.order,
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      return_url: request.returnUrl,
      redirect_on_completion: request.redirectOnCompletion || 'if_required',
      callback_url: request.callbackUrl,
      checkout_id: request.checkoutId,
      idempotency_key: request.idempotencyKey || request.checkoutId,
      source: request.source || 'custom_site',
      company_name: request.companyName,
      buyer_company: request.buyerCompany,
      compliance: request.compliance,
    }),
  });

  const body = (await response.json()) as Partial<GatewayEmbeddedCheckoutResponse> & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error || `Payment Gateway embedded Checkout failed: HTTP ${response.status}`);
  }

  if (!body.client_secret || !body.publishable_key || !body.checkout_session_id) {
    throw new Error('Payment Gateway embedded Checkout response is missing Stripe client fields');
  }

  return body as GatewayEmbeddedCheckoutResponse;
}

export async function mountGatewayEmbeddedCheckout(
  options: GatewayEmbeddedCheckoutOptions,
): Promise<GatewayEmbeddedCheckoutMount> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('mountGatewayEmbeddedCheckout must run in a browser');
  }

  const checkoutTarget = resolveElement(options.checkoutSelector);
  if (!checkoutTarget) {
    throw new Error('Embedded Checkout mount target was not found');
  }

  const Stripe = await loadStripeJs();
  const stripe = Stripe(
    options.publishableKey,
    options.connectedAccountId ? { stripeAccount: options.connectedAccountId } : undefined,
  );
  if (!stripe) {
    throw new Error('Stripe.js failed to initialize');
  }
  const stripeClient = stripe;

  const checkout = await stripeClient.initEmbeddedCheckout({
    fetchClientSecret: () => options.clientSecret,
    onComplete: options.onComplete,
  });
  checkout.mount(checkoutTarget);
  options.onReady?.();

  return {
    stripe,
    checkout,
    destroy() {
      checkout.destroy?.();
    },
  };
}

async function loadStripeJs(): Promise<StripeConstructor> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Stripe.js can only be loaded in a browser');
  }

  if (window.Stripe) {
    return window.Stripe;
  }

  stripeJsPromise ||= new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://js.stripe.com/v3/"]');
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.Stripe) {
          resolve(window.Stripe);
        } else {
          reject(new Error('Stripe.js loaded without exposing window.Stripe'));
        }
      });
      existing.addEventListener('error', () => reject(new Error('Stripe.js failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.addEventListener('load', () => {
      if (window.Stripe) {
        resolve(window.Stripe);
      } else {
        reject(new Error('Stripe.js loaded without exposing window.Stripe'));
      }
    });
    script.addEventListener('error', () => reject(new Error('Stripe.js failed to load')));
    document.head.appendChild(script);
  });

  return stripeJsPromise;
}

function resolveElement(selectorOrElement?: string | HTMLElement): HTMLElement | null {
  if (!selectorOrElement) {
    return null;
  }

  if (typeof selectorOrElement === 'string') {
    return document.querySelector<HTMLElement>(selectorOrElement);
  }

  return selectorOrElement;
}
