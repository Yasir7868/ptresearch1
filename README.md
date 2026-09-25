# Primetime Research storefront

Next.js 16 storefront and admin panel for ptresearch.shop. The storefront
renders the catalog from the existing WooCommerce store's public Store API;
the admin panel at `/admin` manages orders, stock and staff access through the
WooCommerce REST API. WooCommerce stays the system of record for products,
prices, stock and orders.

## Status (September 2026)

Design-complete preview. Live at
https://primetime-redesign-production.up.railway.app (noindexed).

What works today:

- Home, catalog, category pages, one page per live product, COA page (a copy of
  the live /coa/ list and PDF panel; purity and endotoxin certificates
  self-hosted under `public/coas/`, rows in `content/coa-list.ts`), FAQ, terms, privacy,
  shipping, contact, affiliates, track-order.
- Digital gift card (`/gift-card`): a rebuild of the live `/digtal-gift-card/`
  page, which ships its own UI from an Elementor HTML widget rather than the
  Advanced Gift Cards plugin's form. Amount is a six-stop **slider** ($25 →
  $1,000) with clickable ticks, plus "or enter an exact amount" for any figure
  in $1 steps; then a "Send as a gift" / "This one's for me" switch, recipient
  name, From, email with a confirm-match field, a 250-character counted
  message and an optional send-on date. The card artwork is **drawn as inline
  SVG** for whatever figure is selected (so a custom amount gets a real card),
  sits in a sticky left column, and is echoed in a fixed bottom bar with the
  quick amounts and a second Add to cart. Tiers, ids and validation rules are
  local (`content/gift-card.ts`) because the Store API reports the gift card as
  unpurchasable at $0 with no variations. The live URLs `/digtal-gift-card` and
  `/product/pt-research-digital-gift-card` redirect here.
  Live hides WooCommerce's gallery, tabs, related row and the plugin's own
  redeem section on this page, so none are built; redemption is the claim card,
  which links to the store's `/my-account/gift-cards/`.
- Catalog, prices, variations and stock read live from
  `https://ptresearch.shop/wp-json/wc/store/v1` at build time and revalidate.
- Age gate (crawler-safe client overlay, cookie-persisted).
- Cart drawer and cart page.

What is a demo, not wired to WooCommerce yet:

- **Cart totals and the WooCommerce order.** `lib/cart.tsx` is an adapter seam.
  The shipped adapter is `LocalStorageCartAdapter`: totals, the `PT25` coupon
  math, the bulk ladder and the free-shipping threshold are computed locally.
  Those local totals now only drive the CART display — **the server re-prices
  every order from the live catalog before charging** (see "Order database").
  **Card payment is real** and **orders are stored**: `/checkout` embeds the
  processor's Checkout Session (see "Payment gateway"), the order is written to
  SQLite before payment, and a verified callback settles it. What is still
  missing is the WooCommerce order: nothing here creates one, so a paid order
  does not decrement Woo stock or appear in `/admin/orders`.
  Gift card lines carry their recipient details through the cart, checkout and
  receipt, are capped at one each, and are excluded from `PT25` — **the same
  exclusion has to be set on the PT25 coupon in WooCommerce**, or the server
  totals will disagree once the Woo adapter replaces the local math.
- **Gift card delivery and redemption.** Emailing the card, its code, balance
  and expiry are the plugin's server side; nothing here sends mail. Redemption
  needs a customer account, which this storefront does not have, so the claim
  card links out to the live store's `/my-account/gift-cards/` exactly as the
  live page does — repoint `CLAIM_URL` in `GiftCardProduct.tsx` once accounts
  exist here.
  The intended production path is a `WooCommerceCartAdapter` over the Store
  API cart endpoints (Cart-Token plus Nonce headers) behind `/api/cart/*`
  proxy routes, with offline Zelle/Venmo gateways as WooCommerce plugins.
- Track-order lookup and the affiliate dashboard are placeholders.

Card payment on this Next.js site is live and every order is stored in the
admin database (`/admin/site-orders`), but nothing is written to WooCommerce
yet. Orders placed on the live WordPress site do reach WooCommerce, and those
are what `/admin/orders` and the WooCommerce app show.
- Product images under `public/product-vials/` are generated renders from the
  client's branded sample vial, not photographs.

## Open content questions

`content/site-copy.ts` carries the live WordPress site's copy verbatim
(re-harvested 2026-09-17), with a notes block listing where the live site
contradicts itself (age gate 21 vs terms 18, "2-Day Shipping" vs 2-4 business
days, two contact addresses, the old "PrimeTime Peptides" name and domain in
the legal pages, typos such as "Digtal Gift Card"). Products the store lists as not purchasable with no
price (currently the digital gift card and 5-Amino-1MQ) are hidden from the
catalog until they are priced. `npm run data:check` reconciles this repo's
category and image maps against the live store; run it after any catalog
change in WooCommerce.

## Running it

```
node >= 22.12
npm install
npm run dev        # http://localhost:3000
npm run build      # runs scripts/gen-theme.mjs first, then next build
npm run lint
npm run typecheck
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `WP_ORIGIN` | `https://ptresearch.shop` | WooCommerce origin (Store API for the shop, REST API for the admin) |
| `NEXT_PUBLIC_SITE_URL` | `https://<brand-config domain>` | Canonical URL for metadata, sitemap, JSON-LD |
| `NEXT_PUBLIC_INDEXABLE` | unset | Set to `true` only on the production apex. Anything else emits noindex/nofollow. |
| `WOO_CONSUMER_KEY` | unset | Admin: WooCommerce REST API key (Read/Write) |
| `WOO_CONSUMER_SECRET` | unset | Admin: WooCommerce REST API secret |
| `WOO_AUTH_MODE` | `header` | Admin: `query` if the host strips the Authorization header |
| `WOO_WEBHOOK_SECRET` | unset | Admin: secret WooCommerce signs webhooks with |
| `ADMIN_DB_PATH` | `.data/admin.sqlite` in dev | Admin: SQLite file for staff accounts. Required in production, on a persistent volume |
| `ADMIN_SETUP_TOKEN` | unset | Admin: one-time token to create the first owner (16+ characters) |
| `PAYMENT_GATEWAY_API_BASE_URL` | unset | Payment: processor API origin. Unset = checkout shows "payment not available" |
| `PAYMENT_GATEWAY_MERCHANT_TOKEN` | unset | Payment: merchant token. Server-only; authorizes charges and signs callbacks |
| `SITE_URL` | `NEXT_PUBLIC_SITE_URL` | Payment: public origin for callback + return URLs and wallet domain registration |
| `BULK_QUOTE_WEBHOOK_URL` | unset | Bulk: where `/bulk` quote requests are POSTed. Unset = logged server-side only |
| `BULK_QUOTE_WEBHOOK_TOKEN` | unset | Bulk: optional bearer token sent with that POST |

`.env.example` lists them all. The storefront needs no secrets; the admin
secrets are server-only (never `NEXT_PUBLIC_`).

## Payment gateway (embedded checkout)

Card payment on `/checkout` is the processor's **embedded Checkout Session**,
mounted inline. The customer never leaves the site, and card number / CVC /
expiry are entered inside the processor's own iframe — this site's DOM never
sees them, which is the point of the embedded surface over hand-rolled fields.

The SDK is `payment-gateway-checkout` v1.3.0, supplied as
`payment-gateway-custom-site-sdk.zip`.

### Layout

- **`lib/gateway/{types,server,signature,browser}.ts`** — the SDK, **vendored
  as source**, not installed as a package. The published entry point re-exports
  the server half (merchant token) and the browser half from one barrel;
  importing that barrel from a client component would pull charge-authorizing
  code into the browser bundle. Split modules make that impossible. Only the
  relative import extensions were changed — re-vendor from the zip's `src/` on
  an upgrade, don't hand-edit.
- **`lib/gateway/config.ts`** — server-only env access. The merchant token is
  read here and nowhere else.
- **`lib/gateway/order.ts`** — cart → gateway order, and the money-unit guard.
- **`app/api/payment/embedded-session`** — creates the Checkout Session.
- **`app/api/payment/callback`** — receives signed payment events.
- **`app/api/payment/reconcile`** — confirms a session for the success page.
- **`components/checkout/GatewayPayment.tsx`** — mounts the embedded surface.
- **`components/checkout/PaymentStatus.tsx`** — confirmation-page banner.
- **`lib/admin/payments.ts`** + migration 2 — the `payment_events` table.

### Flow — one page, no redirect

The card is entered in checkout **section 04, in place**. There is no second
step, no hosted page, and no submit button of our own — the processor's frame
carries its own pay button.

1. Sections 01–03 collect contact, shipping and notes.
2. The moment the whole form validates (terms checkbox included), the card
   surface mounts in section 04. Arming happens in the field-change handler,
   not an effect. Nothing is created until the customer has deliberately
   accepted the terms.
3. Sections 01–03 then lock behind a disabled `fieldset`. The order exists and
   the processor holds a session for it by that point; letting the address
   drift underneath would ship the parcel somewhere the order does not say.
   "Edit order details" tears the session down and unlocks them — re-arming
   **resumes the same order** and updates its buyer rather than creating a
   second one.
4. The **checkout id** is a fingerprint of the cart: same cart → same id,
   changed cart → new id, so the gateway's idempotency can never return a
   session priced for a stale basket.
5. On completion the cart clears and the browser lands on
   `/order-received?order=…`.
6. `PaymentStatus` calls `/api/payment/reconcile`, which answers from the
   verified callback if one has arrived and otherwise asks the gateway.

### Money units

This repo counts in integer minor units (cents). The gateway's order shape
mirrors WooCommerce's, whose totals are decimal strings (`"44.00"`), so
`lib/gateway/order.ts` converts on the way out. The Checkout Session comes back
with `amount` in Stripe's minor units, and `assertSessionAmount` refuses to
mount a payment surface whose amount disagrees with the cart. **Do not remove
that check** — a unit misread would otherwise charge 100× silently.

### Callback security

Events are signed `hmac_sha256(raw_json_body, sha256(merchantToken))` in the
`x-platform-signature` header. The route reads the body as **raw text**,
verifies, and only then parses — parsing first and re-serializing changes the
bytes and fails every verification. An unverified body is an attacker claiming
an order was paid, so it gets a 401 and is never recorded.

Callbacks are re-delivered and can arrive out of order, so writes upsert on
`session_id` and a later non-terminal event never downgrades a confirmed
`succeeded`. Verified end-to-end: good signature → 200 + recorded; tampered
body → 401; missing header → 401; late `checkout.session.expired` after
`payment.succeeded` → still paid.

### Setup

1. Put `PAYMENT_GATEWAY_API_BASE_URL` and `PAYMENT_GATEWAY_MERCHANT_TOKEN` in
   the server environment. Without them `/checkout` renders the form with
   payment disabled and an honest notice — it never takes an order it cannot
   charge.
2. Set `SITE_URL` to the public origin (or rely on `NEXT_PUBLIC_SITE_URL`).
   The callback URL is always built server-side as
   `${SITE_URL}/api/payment/callback` — a client-supplied one is ignored.
3. Give the processor that callback URL if their dashboard needs it registered.
4. `ADMIN_DB_PATH` must be on a persistent volume in production. Payment events
   live in that SQLite file; losing it loses the payment record.
5. **Apple Pay / Google Pay** need the checkout domain registered once, from a
   server-only context:
   `gateway().registerPaymentMethodDomain({ site_url: process.env.SITE_URL!, include_www: true })`.
   Not wired to a route — run it once from a server context when you want
   wallets enabled.
6. **Before going live**, run `gateway().testConnection({ callback_url, site_url })`
   from a server context and check every entry in `checks` passes.

Mastercard is blocked by the platform when creating Checkout Sessions, which
matches the live store's own copy ("Mastercard is not accepted").

### Known limits

- **No WooCommerce order is created yet.** The order is complete and durable in
  this app's own database, but WooCommerce does not learn about it — stock is
  not decremented there. See "Order database → Still missing".
- **No email is sent** on a successful order.

(The earlier limitation "the order payload is built in the browser" is fixed:
the server re-prices every order from the live catalog. See "Order database".)

## Order database

Every order taken on this storefront is written to the admin SQLite database
(`ADMIN_DB_PATH`) **before** the customer is charged, so a payment can never
exist without an order to attach it to.

- **`lib/orders/price.ts`** — re-prices a submitted cart from the live catalog.
- **`lib/orders/store.ts`** — create / read / settle orders.
- **`lib/totals.ts`** — the pricing arithmetic, shared with the browser cart.
- **Migration 3** (`lib/admin/db.ts`) — the `orders` and `order_items` tables.
- **`/admin/site-orders`** — the staff list. Separate from `/admin/orders`,
  which reads WooCommerce.
- **`/order-received?order=<orderKey>`** — the customer's copy, rendered from
  the order row rather than from browser storage, so it survives a reload, a
  different device, or being opened next week.

### The browser does not set prices

This is the rule the whole design hangs on. The checkout sends buyer details
and **product references only** — ids and quantities. The server looks each one
up in the live catalog, prices it, recomputes the totals with the same
arithmetic the cart used, and stores that. A customer editing the request
changes what they receive, never what they pay.

Gift cards are the one line carrying a buyer-chosen amount, and it is
re-validated against the published tier rules (`content/gift-card.ts`) rather
than accepted.

Two consequences worth knowing:

- If the catalog price changed while someone was checking out, the server total
  differs from the cart's. The customer is **shown the server figure before
  paying** (`checkoutPayment.repriced`), because that is the number being
  charged.
- A line whose product can no longer be priced rejects the whole order with a
  409 and a customer-safe message, rather than quietly dropping it.

### Order lifecycle

| Stage | `status` | `payment_status` |
|---|---|---|
| Created, before payment | `pending` | `unpaid` |
| Verified `payment.succeeded` callback | `processing` | `paid` |
| Verified failure | `failed` | `failed` |
| Verified expiry | `cancelled` | `expired` |

`order_key` is an unguessable random token and the idempotency handle
end-to-end: it is the gateway's `checkout_id`, the confirmation page's URL
parameter, and what a retry resubmits to resume an order instead of creating a
second one. A paid order refuses to be charged again (409), and a late
non-terminal callback never downgrades a paid order.

### Verified end-to-end

Against a live catalog and a stand-in processor API:

- Two-line order priced server-side to $257.00; gateway amount matched.
- Client claiming `amountMinor: 1` on catalog lines — **still charged $257.00**.
- Resubmitting the same `order_key` — no duplicate order (still `PT-1001`).
- Unknown product — 409, customer-safe message.
- Signed `payment.succeeded` → `processing` / `paid`, `amount_paid` recorded,
  confirmation page flips to "Payment confirmed".
- Late `checkout.session.expired` after paid — order unchanged.
- Re-charging a paid order — 409.

### Still missing

- **WooCommerce does not learn about these orders.** They are complete and
  durable here, but stock is not decremented in Woo and the order does not
  appear in `/admin/orders`. That is the next piece of work: on a verified
  `payment.succeeded`, create the WooCommerce order and store its id in
  `orders.woo_order_id` (the column exists and is unused).
- **No email is sent** — not the receipt, not the staff notification.
- **Stock is not reserved** between order creation and payment, so two people
  can pay for the last vial. Woo order creation is where that gets resolved.

## Bulk ordering (`/bulk` + homepage section)

Volume pricing. One ladder, four surfaces, one source of truth.

- **`content/bulk.ts`** — the tier ladder (`bulkTiers`) and every string. This
  is the only file to edit when pricing changes.
- **`lib/bulk.ts`** — the math (`bulkGroups`, `bulkDiscountMinor`,
  `tierForUnits`). Pure, isomorphic, no I/O.
- **`components/landing/BulkOrder.tsx`** — the homepage section (after the COA
  section, `#bulk`).
- **`app/(store)/bulk/page.tsx`** + **`components/bulk/*`** — the page: tier
  cards, the product grid + order rail, why-bulk, FAQ, quote form (`#quote`).
- **`lib/totals.ts`** — applies the tiers; shared by the cart and the server's
  order pricing so both charge the same number.

### Per product, not per order

Owner directive, 2026-09-25, from the reference bulk page. **The tiers are
earned by one product's unit count, not the order's.**

| Units of ONE product | Discount on that product |
|---|---|
| 10+ | 40% |
| 50+ | 50% |

A **unit** is one vial, whatever its strength. Units are counted **per
compound across its strengths**, so five 10mg plus five 30mg vials of the same
compound are 10 units of it and qualify — the buyer mixes strengths freely.
Each product earns its own tier independently: a 50-unit compound sits on the
top rung while a 10-unit compound on the same order sits on the first, and a
compound below 10 units is simply charged full price without blocking the
others. Gift cards are outside the count and the discount.

This replaced an order-wide ladder, which let someone reach a deep discount
with one vial of ten different compounds — not what volume pricing is for.

**The percentages come from the reference page, not from this store's margins.
Confirm them before launch.** They live in `bulkTiers` and every surface
follows.

Verified against the live catalog through `/api/payment/embedded-session`
(the server prices every order, so these are the numbers that get charged):

| Order | Result |
|---|---|
| 1 unit each of two products | no discount |
| 10 units of one product | 40% off it |
| 5 + 5 of two strengths of one product | **40% off — strengths counted together** |
| 10 of product X + 1 of product Y | 40% off X only |
| 50 units of one product | 50% off it |

### Promo codes do not apply to bulk orders

Owner rule, 2026-09-22. Once an order earns a tier, bulk pricing **is** the
pricing — `PT25` is not applied, whether or not it would have been worth more.

- Entering a code on a cart that already qualifies is **refused**, with a
  reason (`bulkCopy.cart.couponBlocked`), rather than accepted and silently
  ignored.
- A code applied *before* the cart crossed the first rung goes **dormant**: it
  stays in `appliedCoupons`, is listed on `blockedCoupons`, earns nothing, and
  starts counting again if the order drops back under the threshold. The
  totals ledger names it so the zero is never mysterious.

Every rung must stay `>= brandConfig.promos.coupon.percentOff` for as long as
that coupon runs — otherwise, since the two can never combine, the 10th vial
would cost a buyer *more* than the 9th. At 40 / 50 against `PT25`'s 25 there
is plenty of headroom.

### What to do in WooCommerce

The storefront currently computes totals locally (`LocalStorageCartAdapter`).
Once the WooCommerce cart adapter lands, totals become server-canonical — so
WooCommerce has to hold the same ladder or the site will quote a price
checkout does not honour.

**1. Create one coupon per tier** (Marketing → Coupons). Codes must match
`bulkTiers[].code` in `content/bulk.ts`:

| Code | Type | Amount | Minimum quantity **of one product** |
|---|---|---|---|
| `BULK40` | Percentage discount | 40 | 10 |
| `BULK50` | Percentage discount | 50 | 50 |

**The per-product rule is the hard part in WooCommerce.** Core coupons count
the whole cart, so a plain "minimum quantity 10" coupon would fire on ten
different single-vial lines — the exact thing this model exists to prevent,
and it would discount the entire cart rather than the one compound that
earned it. Both behaviours need the plugin route below (Advanced Coupons calls
these *product quantity* conditions plus a *products* restriction), or a
`woocommerce_before_calculate_totals` snippet that groups cart items by
`get_product_id()` — summing variations into their parent — and applies a
per-line discount to each group that reaches the threshold. Mirror
`lib/bulk.ts` `bulkGroups()`; it is the reference implementation.

For each coupon, under **Usage restriction**:

- Tick **Individual use only**. This is what enforces "promo codes do not
  apply to bulk orders" — WooCommerce will refuse `PT25` alongside any of
  these, and drop it if it is already in the cart.
- **Exclude products:** the digital gift card (it is excluded from coupons on
  this site already, and discounting a gift card sells store credit below par).
- Leave **Usage limit per user** empty; these are standing offers.
- Set no expiry.

Core WooCommerce coupons have **no minimum-quantity field** — only minimum
spend. Two ways to get the quantity rule:

- **Plugin route (simplest):** *Advanced Coupons* or *WooCommerce Extended
  Coupon Features* add per-product quantity conditions and auto-apply. Turn
  **auto-apply** on for both so the buyer never types a code.
- **Code route (no plugin):** a `woocommerce_before_calculate_totals` snippet
  that groups cart items by parent product id, sums their quantities, and
  discounts each qualifying group's lines. Thresholds are the `minUnits`
  column above.

**2. Cap `PT25` so it cannot reach a bulk order.** *Individual use only* on the
bulk coupons stops the two being applied together, but it does not stop a
buyer who applies `PT25` *first* from keeping it on a 30-unit order that never
auto-applied a bulk coupon. Close that by editing the `PT25` coupon and
setting a **maximum quantity** of one below the first rung (9, with the
default ladder). That field is a plugin feature — the same *Advanced Coupons*
/ *Extended Coupon Features* plugin from step 1 provides it. Without a plugin,
the `woocommerce_before_calculate_totals` snippet must call
`WC()->cart->remove_coupon( 'PT25' )` whenever the item count reaches the
first rung.

**3. Free shipping on any bulk order.** Once any product reaches its minimum
the order ships free regardless of total (`earnsFreeShipping` in
`lib/bulk.ts`), which is more generous than the standing "$200+" rule.
In WooCommerce: Settings → Shipping → your zone → add a **Free shipping**
method with *A minimum order amount OR a coupon*, then tick *Allow free
shipping* on `BULK40` and `BULK50`. Keep the existing $200 free-shipping
method in place alongside it.

**4. Confirm the margins.** The ladder ships at 40 / 50, taken from the
reference bulk page rather than from your margins. Set your real numbers in
`content/bulk.ts` and mirror them in the coupons above. Whatever you choose,
keep the first rung at or above `PT25`'s 25% while that coupon runs.

**5. Point the quote form somewhere.** Set `BULK_QUOTE_WEBHOOK_URL` (and
optionally `BULK_QUOTE_WEBHOOK_TOKEN`) to an endpoint that delivers the
request — a WordPress REST endpoint, an email relay, Zapier/Make/n8n, or a
Slack incoming webhook. The action POSTs JSON:

```json
{
  "type": "bulk_quote_request",
  "receivedAt": "2026-09-22T14:02:11.000Z",
  "name": "...", "email": "...", "organization": "...",
  "orgType": "Commercial Laboratory", "phone": "",
  "compounds": "BPC-157 10mg x 50, TB-500 10mg x 25",
  "cadence": "Quarterly", "notes": "", "consent": true
}
```

With nothing configured the action logs the payload server-side and still
returns success, so a preview deploy never shows a real researcher an error.
**Configure it before launch** or quote requests go nowhere.

**6. Optional — a bulk customer role.** If institutions get standing contract
pricing rather than the public ladder, create a WooCommerce customer role and
use *Wholesale Suite* or role-based pricing rather than coupons, and gate
`/bulk` pricing behind login. Not built here; the current page is public.

## Admin panel (`/admin`)

A staff back office for the WooCommerce store, in the same app.

- **Same orders as WP admin and the WooCommerce app.** Everything is read and
  written through the WooCommerce REST API, so an order or status change made
  in any of the three shows in the other two. Dashboard figures come from
  WooCommerce Analytics, the source the mobile app uses.
- **Dashboard:** orders needing attention (processing, on hold, pending,
  failed), revenue/orders/average order/items for today, 7 or 30 days with the
  previous period for comparison, revenue by day, top products, recent orders,
  stock alerts.
- **Orders:** status tabs with counts (like WP admin), search, date filters,
  bulk status changes, CSV export. Order page: items and totals, status
  changes, private notes and notes to the customer, address edits, refunds
  (manual, or through the gateway when it supports it), resend order details.
- **Products:** stock by product and size, low/out-of-stock views, stock edits.
- **Customers:** everyone who ordered (guests included) with spend and history.
- **Team:** invite people with a role (Owner, Manager, Fulfillment, Viewer;
  the matrix is on the Team page), change roles, disable, remove, create
  password reset links. **Activity** logs every change with who made it.
- **Live updates:** WooCommerce webhooks notify the app of changes; open admin
  tabs check for new orders every 30 seconds and can raise desktop alerts.

### Setting it up

1. **API keys.** WordPress → WooCommerce → Settings → Advanced → REST API →
   Add key. User: an Administrator (or Shop manager). Permissions: Read/Write.
   Set `WOO_CONSUMER_KEY` and `WOO_CONSUMER_SECRET`.
2. **Database.** On Railway, add a volume to the service (for example mounted
   at `/data`) and set `ADMIN_DB_PATH=/data/admin.sqlite`. Without a volume
   every deploy would erase staff accounts, so in production the admin panel
   shows a configuration message until this is set (Railway's
   `RAILWAY_VOLUME_MOUNT_PATH` is picked up automatically when a volume exists).
3. **Secrets.** Set `WOO_WEBHOOK_SECRET` and `ADMIN_SETUP_TOKEN` to long random
   strings (`openssl rand -hex 32`). Deploy.
4. **First owner.** Open `/admin`, enter the setup token, create your account.
   You can remove `ADMIN_SETUP_TOKEN` afterwards.
5. **Webhooks.** Admin → Settings → Test connection, then "Connect webhooks
   automatically". This creates the WooCommerce webhooks pointing at
   `https://<your domain>/api/webhooks/woocommerce`. It must be done from the
   deployed https site, not localhost.
6. **Team.** Admin → Team → Invite someone. The panel shows a one-time link to
   send them (no email is sent automatically).

People who also want the WooCommerce mobile app sign in to the app with a
WordPress account (Shop manager role); panel access is separate from WordPress
logins.

### Security notes

- Sessions are random tokens in an httpOnly cookie (`__Host-` prefixed in
  production), checked against the database on every request, so disabling a
  person signs them out immediately. 30-day maximum, 7 days idle.
- Passwords use scrypt. 5 wrong passwords lock an account for 15 minutes;
  sign-in, setup and link pages are rate limited per IP.
- Every page, Server Action and API route checks the role on the server
  (`lib/admin/auth.ts`); `proxy.ts` only adds a fast redirect and noindex headers.
- Order changes are also written to the WooCommerce order notes with the
  person's name, because all changes share one API key.
- Webhooks are verified with HMAC-SHA256 against `WOO_WEBHOOK_SECRET`.
- Order data is not stored by the panel; a few minutes of counts and figures
  are cached in memory only.
- The SQLite database means a single app instance. Back up the volume.

### Locked out?

From a shell on the server (Railway: `railway ssh`):

```
node scripts/admin-user.mjs list
node scripts/admin-user.mjs reset-link you@example.com --origin https://your-domain
node scripts/admin-user.mjs make-owner you@example.com
node scripts/admin-user.mjs invite-owner you@example.com "Your Name" --origin https://your-domain
```

## Layout

- `app/` routes (App Router). Storefront pages live in the `app/(store)` route
  group (shop chrome in `components/chrome/StoreShell.tsx`); the admin panel is
  `app/admin` (`(auth)` sign-in pages, `(panel)` signed-in pages) with API routes
  in `app/api/admin` and the webhook receiver in `app/api/webhooks/woocommerce`.
  `robots.ts` and `sitemap.ts` honor `NEXT_PUBLIC_INDEXABLE`.
- `lib/admin/` admin panel: auth, sessions, roles (`permissions.ts`), SQLite
  (`db.ts`), activity log, and `woo/` (REST client, orders, analytics,
  products, customers, webhooks).
- `proxy.ts` (Next 16's middleware) guards `/admin` and `/api/admin`.
- `lib/woo/store-api.ts` typed Store API client and product mapper.
- `lib/cart.tsx` cart context and adapter seam.
- `lib/seo.ts`, `lib/jsonld.ts`, `lib/analytics.ts`.
- `content/` brand config, verbatim site copy, category map, COA map, product image map, compliance strings.
- `scripts/gen-theme.mjs` writes CSS tokens from `content/brand-config.ts`; `coa-thumbs.mjs` regenerates COA thumbnails; `data-check.mjs` reconciles the catalog against the live store.
- `DESIGN.md`, `PRODUCT.md`, `AGENTS.md` design and product notes kept from the build, including Next.js 16 gotchas.

## Deploying

Railway: Nixpacks or Node builder, build `npm run build`, start `npm run start`.
Set the variables above per environment. Keep `NEXT_PUBLIC_INDEXABLE` unset on
any preview host. The admin panel needs a volume for `ADMIN_DB_PATH` and runs
as a single instance.

## Production cutover notes

1. Build the WooCommerce cart adapter (above) before pointing the apex here.
2. Exclude `/wp-json/wc/store/*` from every cache layer in front of WordPress
   (LiteSpeed, Jetpack Boost, Cloudflare) or carts cross-contaminate.
3. Pin the WooCommerce and plugin versions; the Store API checkout fields are
   still marked experimental upstream.
4. Move WordPress to a `wp.` subdomain and point the apex at this app.
