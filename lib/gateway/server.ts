/**
 * Server half of the gateway SDK — holds the merchant token. Never import
 * this from a client component.
 *
 * VENDORED from the merchant SDK "payment-gateway-checkout" v1.3.0
 * (payment-gateway-custom-site-sdk.zip, supplied by the processor). Kept as
 * source rather than an npm dependency so the server and browser halves stay
 * in separate modules — importing the package barrel would pull merchant-token
 * code into the client bundle. Only the relative import extensions were
 * changed. Re-vendor from src/ on an SDK upgrade; do not hand-edit.
 */

import "server-only";

import type {
  GatewayConnectionTestResponse,
  GatewayCheckoutRequest,
  GatewayCheckoutResponse,
  GatewayEmbeddedCheckoutRequest,
  GatewayEmbeddedCheckoutResponse,
  GatewayCheckoutSessionReconcileRequest,
  GatewayCheckoutSessionReconcileResponse,
  GatewayPaymentMethodDomainRequest,
  GatewayPaymentMethodDomainResponse,
  GatewayServerConfig,
} from "./types";

export class GatewayApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'GatewayApiError';
    this.status = status;
    this.body = body;
  }
}

export function createGatewayServerClient(config: GatewayServerConfig) {
  const apiBaseUrl = config.apiBaseUrl.replace(/\/+$/, '');

  if (!apiBaseUrl) {
    throw new Error('Payment Gateway apiBaseUrl is required');
  }
  if (!config.merchantToken) {
    throw new Error('Payment Gateway merchantToken is required');
  }

  return {
    async createCheckoutSession(
      request: GatewayCheckoutRequest,
    ): Promise<GatewayCheckoutResponse> {
      const body = await postJson({
        apiBaseUrl,
        merchantToken: config.merchantToken,
        path: '/checkout/sessions',
        payload: request,
      });

      if (!isCheckoutResponse(body)) {
        throw new GatewayApiError('Payment Gateway API returned an invalid checkout response', 200, body);
      }

      return body;
    },

    async createEmbeddedCheckoutSession(
      request: GatewayEmbeddedCheckoutRequest,
    ): Promise<GatewayEmbeddedCheckoutResponse> {
      const body = await postJson({
        apiBaseUrl,
        merchantToken: config.merchantToken,
        path: '/checkout/sessions/embedded',
        payload: request,
      });

      if (!isEmbeddedCheckoutResponse(body)) {
        throw new GatewayApiError('Payment Gateway API returned an invalid embedded Checkout response', 200, body);
      }

      return body;
    },

    async reconcileCheckoutSession(
      request: GatewayCheckoutSessionReconcileRequest,
    ): Promise<GatewayCheckoutSessionReconcileResponse> {
      if (!request.checkout_session_id && !request.session_id) {
        throw new Error('checkout_session_id is required');
      }

      const sessionId = request.checkout_session_id || request.session_id || '';
      const body = await postJson({
        apiBaseUrl,
        merchantToken: config.merchantToken,
        path: `/checkout/sessions/${encodeURIComponent(sessionId)}/reconcile`,
        payload: {
          order_id: request.order_id,
          order_key: request.order_key,
          woo_order_id: request.woo_order_id,
          woo_order_key: request.woo_order_key,
        },
      });

      if (!isCheckoutSessionReconcileResponse(body)) {
        throw new GatewayApiError('Payment Gateway API returned an invalid Checkout Session reconcile response', 200, body);
      }

      return body;
    },

    async testConnection(input: { callback_url?: string; site_url?: string } = {}): Promise<GatewayConnectionTestResponse> {
      const body = await postJson({
        apiBaseUrl,
        merchantToken: config.merchantToken,
        path: '/merchant/test-connection',
        payload: input,
        allowHttpError: true,
      });

      if (!isConnectionTestResponse(body)) {
        throw new GatewayApiError('Payment Gateway API returned an invalid connection-test response', 200, body);
      }

      return body;
    },

    async registerPaymentMethodDomain(
      request: GatewayPaymentMethodDomainRequest,
    ): Promise<GatewayPaymentMethodDomainResponse> {
      const body = await postJson({
        apiBaseUrl,
        merchantToken: config.merchantToken,
        path: '/merchant/payment-method-domain',
        payload: request,
      });

      if (!isPaymentMethodDomainResponse(body)) {
        throw new GatewayApiError('Payment Gateway API returned an invalid payment-method-domain response', 200, body);
      }

      return body;
    },
  };
}

async function postJson(input: {
  apiBaseUrl: string;
  merchantToken: string;
  path: string;
  payload: unknown;
  allowHttpError?: boolean;
}): Promise<unknown> {
  const response = await fetch(`${input.apiBaseUrl}${input.path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${input.merchantToken}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(input.payload),
  });

  const text = await response.text();
  const body = parseJson(text);

  if (!response.ok && !input.allowHttpError) {
    const message =
      typeof body === 'object' && body && 'error' in body
        ? String(body.error)
        : `Payment Gateway API error: HTTP ${response.status}`;
    throw new GatewayApiError(message, response.status, body);
  }

  return body;
}

function parseJson(text: string): unknown {
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isCheckoutResponse(value: unknown): value is GatewayCheckoutResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'checkout_url' in value &&
    typeof value.checkout_url === 'string' &&
    'session_id' in value &&
    typeof value.session_id === 'string'
  );
}

function isEmbeddedCheckoutResponse(value: unknown): value is GatewayEmbeddedCheckoutResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'checkout_session_id' in value &&
    typeof value.checkout_session_id === 'string' &&
    'client_secret' in value &&
    typeof value.client_secret === 'string' &&
    'publishable_key' in value &&
    typeof value.publishable_key === 'string' &&
    'amount' in value &&
    typeof value.amount === 'number' &&
    'currency' in value &&
    typeof value.currency === 'string'
  );
}

function isCheckoutSessionReconcileResponse(value: unknown): value is GatewayCheckoutSessionReconcileResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof value.ok === 'boolean' &&
    'session_id' in value &&
    typeof value.session_id === 'string' &&
    'payment_status' in value &&
    typeof value.payment_status === 'string' &&
    'status' in value &&
    typeof value.status === 'string'
  );
}

function isConnectionTestResponse(value: unknown): value is GatewayConnectionTestResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof value.ok === 'boolean' &&
    'checks' in value &&
    Array.isArray(value.checks)
  );
}

function isPaymentMethodDomainResponse(value: unknown): value is GatewayPaymentMethodDomainResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof value.ok === 'boolean' &&
    'domains' in value &&
    Array.isArray(value.domains)
  );
}
