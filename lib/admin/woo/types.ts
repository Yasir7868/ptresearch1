/**
 * lib/admin/woo/types.ts — raw WooCommerce REST (wc/v3) and Analytics
 * (wc-analytics) response shapes, typed only as far as the admin panel reads
 * them. Money in these shapes is WooCommerce's own format: decimal strings in
 * wc/v3 ("120.00"), plain numbers in wc-analytics. Convert with
 * lib/admin/money.ts before it reaches the UI.
 *
 * Product names inside these shapes are RAW live names and must be passed
 * through the catalog index coder (lib/admin/woo/catalog-index.ts) before they
 * are rendered — see the GLP coding rule in PRODUCT.md.
 */

export interface WooAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface WooMeta {
  id: number;
  key: string;
  value: unknown;
  display_key?: string;
  display_value?: unknown;
}

export interface WooLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  sku: string | null;
  price: number | string;
  image?: { id: number | string; src: string } | null;
  parent_name?: string | null;
  meta_data: WooMeta[];
}

export interface WooShippingLine {
  id: number;
  method_title: string;
  method_id: string;
  total: string;
  total_tax: string;
}

export interface WooFeeLine {
  id: number;
  name: string;
  total: string;
  total_tax: string;
}

export interface WooCouponLine {
  id: number;
  code: string;
  discount: string;
  discount_tax: string;
}

export interface WooTaxLine {
  id: number;
  rate_code: string;
  label: string;
  tax_total: string;
  shipping_tax_total: string;
}

export interface WooOrder {
  id: number;
  parent_id: number;
  number: string;
  created_via: string;
  status: string;
  currency: string;
  date_created: string | null;
  date_created_gmt: string | null;
  date_modified_gmt: string | null;
  date_paid_gmt: string | null;
  date_completed_gmt: string | null;
  discount_total: string;
  shipping_total: string;
  total: string;
  total_tax: string;
  customer_id: number;
  customer_ip_address: string;
  customer_user_agent: string;
  customer_note: string;
  billing: WooAddress;
  shipping: WooAddress;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  line_items: WooLineItem[];
  tax_lines: WooTaxLine[];
  shipping_lines: WooShippingLine[];
  fee_lines: WooFeeLine[];
  coupon_lines: WooCouponLine[];
  refunds: { id: number; reason: string; total: string }[];
  needs_payment?: boolean;
}

export interface WooOrderNote {
  id: number;
  author: string;
  date_created_gmt: string;
  note: string;
  customer_note: boolean;
  added_by_user?: boolean;
}

export interface WooRefund {
  id: number;
  date_created_gmt: string;
  amount: string;
  reason: string;
  refunded_by: number;
  refunded_payment: boolean;
}

export interface WooStatusTotal {
  slug: string;
  name: string;
  total: number;
}

export interface WooOrderStatus {
  slug: string;
  name: string;
}

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: string;
  status: string;
  permalink?: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: string;
  stock_quantity: number | null;
  manage_stock: boolean | "parent";
  low_stock_amount: number | null;
  images: { id: number; src: string; alt?: string }[];
  variations: number[];
  total_sales: number | string;
}

export interface WooVariation {
  id: number;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  status: string;
  stock_status: string;
  stock_quantity: number | null;
  manage_stock: boolean | "parent";
  attributes: { id?: number; name: string; option: string }[];
}

export interface WooRevenueTotals {
  total_sales: number;
  net_revenue: number;
  gross_sales: number;
  orders_count: number;
  num_items_sold: number;
  refunds: number;
  coupons: number;
  shipping: number;
  taxes: number;
}

export interface WooRevenueStats {
  totals: WooRevenueTotals;
  intervals: {
    interval: string;
    date_start: string;
    date_start_gmt: string;
    date_end: string;
    date_end_gmt: string;
    subtotals: WooRevenueTotals;
  }[];
}

export interface WooProductReportRow {
  product_id: number;
  items_sold: number;
  net_revenue: number;
  orders_count: number;
  extended_info?: {
    name?: string;
    sku?: string;
    stock_status?: string;
    stock_quantity?: number | null;
  };
}

export interface WooStockRow {
  id: number;
  parent_id: number;
  name: string;
  sku: string;
  stock_status: string;
  stock_quantity: number | null;
  manage_stock: boolean;
}

export interface WooStockStats {
  totals: {
    products: number;
    lowstock: number;
    instock: number;
    outofstock: number;
    onbackorder: number;
  };
}

export interface WooAnalyticsCustomer {
  id: number;
  user_id: number;
  username: string;
  name: string;
  email: string;
  country: string;
  state: string;
  city: string;
  postcode: string;
  date_registered_gmt: string | null;
  date_last_active_gmt: string | null;
  date_last_order: string | null;
  orders_count: number;
  total_spend: number;
  avg_order_value: number;
}

export interface WooWebhook {
  id: number;
  name: string;
  status: "active" | "paused" | "disabled";
  topic: string;
  delivery_url: string;
  date_created_gmt: string | null;
}

export interface WooPaymentGateway {
  id: string;
  title: string;
  method_title: string;
  method_supports: string[];
}

export interface WooCurrency {
  code: string;
  name: string;
  symbol: string;
}
