/**
 * Type contract for the payment gateway's custom-site checkout API.
 *
 * VENDORED from the merchant SDK "payment-gateway-checkout" v1.3.0
 * (payment-gateway-custom-site-sdk.zip, supplied by the processor). Kept as
 * source rather than an npm dependency so the server and browser halves stay
 * in separate modules — importing the package barrel would pull merchant-token
 * code into the client bundle. Only the relative import extensions were
 * changed. Re-vendor from src/ on an SDK upgrade; do not hand-edit.
 */

export type GatewayLineItem = {
  name: string;
  product_id?: string;
  quantity: number;
  subtotal?: string | number;
  total: string | number;
  tax?: string | number;
};

export type GatewayCustomer = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
};

export type GatewayAddress = {
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

export type GatewayOrder = {
  id: string;
  key: string;
  number?: string;
  currency: string;
  subtotal?: string | number;
  shipping?: string | number;
  discount?: string | number;
  tax?: string | number;
  fees?: string | number;
  total: string | number;
  items: GatewayLineItem[];
  customer?: GatewayCustomer;
  billing?: GatewayAddress;
  shipping_to?: GatewayAddress & {
    first_name?: string;
    last_name?: string;
  };
  site?: {
    url?: string;
    name?: string;
  };
  company_name?: string;
  buyer_company?: string;
  compliance?: GatewayBusinessContext;
};

export type GatewayBusinessContext = {
  company_name?: string;
  buyer_company?: string;
  buyer_type?: 'business_or_lab' | 'consumer' | string;
  use_case?: 'in_vitro_research' | string;
  product_category?: 'ruo_reference_materials' | string;
  site_acknowledgment?: 'research_use_only' | string;
  not_for_consumption_acknowledged?: boolean | string;
  coa_available?: boolean | string;
  shipping_contains?: 'research_materials' | string;
};

export type GatewayCheckoutRequest = {
  order: GatewayOrder;
  success_url: string;
  cancel_url: string;
  callback_url?: string;
  checkout_id?: string;
  idempotency_key?: string;
  source?: 'custom_site' | 'woocommerce' | string;
  company_name?: string;
  buyer_company?: string;
  compliance?: GatewayBusinessContext;
};

export type GatewayCheckoutResponse = {
  checkout_url: string;
  session_id: string;
};

export type StableGatewayCheckoutKey =
  | {
      checkout_id: string;
      idempotency_key?: string;
    }
  | {
      checkout_id?: string;
      idempotency_key: string;
    };

export type GatewayEmbeddedCheckoutRequest = GatewayCheckoutRequest &
  StableGatewayCheckoutKey & {
    return_url: string;
    redirect_on_completion?: 'always' | 'if_required' | 'never';
  };

export type GatewayEmbeddedCheckoutResponse = {
  checkout_session_id: string;
  session_id: string;
  client_secret: string;
  publishable_key: string;
  connected_account_id?: string;
  amount: number;
  currency: string;
};

export type GatewayCheckoutSessionReconcileRequest = {
  checkout_session_id?: string;
  session_id?: string;
  order_id?: string;
  order_key?: string;
  woo_order_id?: string;
  woo_order_key?: string;
};

export type GatewayCheckoutSessionReconcileResponse = {
  ok: boolean;
  session_id: string;
  payment_status: string;
  status: string;
  order_id?: string;
  order_key?: string;
  payment_id?: string;
};

export type GatewayConnectionCheck = {
  id: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
};

export type GatewayConnectionTestResponse = {
  ok: boolean;
  merchant?: {
    id: string;
    status: string;
    business_name?: string;
    connected_account_id?: string;
  };
  processor?: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  } | null;
  checks: GatewayConnectionCheck[];
};

export type GatewayPaymentMethodDomainRequest = {
  domain?: string;
  domain_name?: string;
  site_url?: string;
  include_www?: boolean;
};

export type GatewayPaymentMethodDomainResponse = {
  ok: boolean;
  domains: Array<{
    domain: string;
    status: 'registered' | 'already_registered' | 'failed';
    id?: string;
    livemode?: boolean;
    message?: string;
  }>;
};

export type GatewayServerConfig = {
  apiBaseUrl: string;
  merchantToken: string;
};

export type BrowserCheckoutRequest = {
  endpoint?: string;
  order: GatewayOrder;
  successUrl: string;
  cancelUrl: string;
  checkoutId?: string;
  idempotencyKey?: string;
  source?: 'custom_site' | 'woocommerce' | string;
  companyName?: string;
  buyerCompany?: string;
  compliance?: GatewayBusinessContext;
};

export type StableBrowserCheckoutKey =
  | {
      checkoutId: string;
      idempotencyKey?: string;
    }
  | {
      checkoutId?: string;
      idempotencyKey: string;
    };

export type BrowserEmbeddedCheckoutRequest = BrowserCheckoutRequest &
  StableBrowserCheckoutKey & {
    callbackUrl?: string;
    returnUrl: string;
    redirectOnCompletion?: 'always' | 'if_required' | 'never';
  };

export type GatewayEmbeddedCheckoutOptions = {
  clientSecret: string;
  publishableKey: string;
  connectedAccountId?: string;
  checkoutSelector: string | HTMLElement;
  onReady?: () => void;
  onComplete?: () => void;
};

export type GatewayEmbeddedCheckoutMount = {
  stripe: unknown;
  checkout: unknown;
  destroy: () => void;
};
