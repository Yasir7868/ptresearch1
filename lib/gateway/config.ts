/**
 * lib/gateway/config.ts — SERVER-ONLY. Environment for the payment gateway.
 *
 * The merchant token is the one credential that must never reach the browser.
 * It is read here and nowhere else, and this module is `server-only` so an
 * accidental client import fails the build rather than shipping the secret.
 *
 * The site is deployable without these set: `gatewayConfigured()` is false,
 * the checkout says payment is not configured, and no route pretends to take
 * money. That keeps preview deploys honest.
 */

import "server-only";
import { createGatewayServerClient } from "./server";
import { SITE_URL } from "@/lib/seo";

/** True when both gateway credentials are present. */
export function gatewayConfigured(): boolean {
  return Boolean(
    process.env.PAYMENT_GATEWAY_API_BASE_URL &&
      process.env.PAYMENT_GATEWAY_MERCHANT_TOKEN
  );
}

/**
 * The merchant's own origin, as the gateway should see it. Falls back to the
 * canonical site URL so callback and return URLs are never relative.
 */
export function gatewaySiteUrl(): string {
  return (process.env.SITE_URL || SITE_URL).replace(/\/+$/, "");
}

/** Where the processor POSTs signed payment events. */
export function gatewayCallbackUrl(): string {
  return `${gatewaySiteUrl()}/api/payment/callback`;
}

/**
 * The configured server client. Throws when credentials are missing — call
 * `gatewayConfigured()` first and return a 503 rather than letting this throw
 * into a request handler.
 */
export function gateway() {
  const apiBaseUrl = process.env.PAYMENT_GATEWAY_API_BASE_URL;
  const merchantToken = process.env.PAYMENT_GATEWAY_MERCHANT_TOKEN;

  if (!apiBaseUrl || !merchantToken) {
    throw new Error(
      "Payment gateway is not configured: set PAYMENT_GATEWAY_API_BASE_URL and PAYMENT_GATEWAY_MERCHANT_TOKEN"
    );
  }

  return createGatewayServerClient({ apiBaseUrl, merchantToken });
}

/** The merchant token, for callback signature verification only. */
export function gatewayMerchantToken(): string {
  const token = process.env.PAYMENT_GATEWAY_MERCHANT_TOKEN;
  if (!token) throw new Error("PAYMENT_GATEWAY_MERCHANT_TOKEN is not set");
  return token;
}
