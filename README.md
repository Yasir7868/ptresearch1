# Primetime Research storefront

Next.js 16 storefront for ptresearch.shop. It renders the catalog from the
existing WooCommerce store's public Store API; WooCommerce stays the system
of record for products, prices, stock and orders.

## Status (September 2026)

Design-complete preview. Live at
https://primetime-redesign-production.up.railway.app (noindexed).

What works today:

- Home, catalog, category pages, one page per live product, COA library (19 purity
  certificates self-hosted under `public/coas/`), FAQ, terms, privacy,
  shipping, contact, affiliates, track-order.
- Catalog, prices, variations and stock read live from
  `https://ptresearch.shop/wp-json/wc/store/v1` at build time and revalidate.
- Age gate (crawler-safe client overlay, cookie-persisted).
- Cart drawer and cart page.

What is a demo, not wired to WooCommerce yet:

- **Cart and checkout.** `lib/cart.tsx` is an adapter seam. The shipped
  adapter is `LocalStorageCartAdapter`: totals, the BOGO and `PT25` coupon
  math and free-shipping threshold are computed locally for demonstration.
  `/checkout` and `/order-received` do not create a WooCommerce order.
  The intended production path is a `WooCommerceCartAdapter` over the Store
  API cart endpoints (Cart-Token plus Nonce headers) behind `/api/cart/*`
  proxy routes, with offline Zelle/Venmo gateways as WooCommerce plugins.
- Contact form posts nowhere.
- Product images under `public/product-vials/` are generated renders from the
  client's branded sample vial, not photographs.

## Open content questions

`content/site-copy.ts` carries verbatim copy from the WordPress site with
`TODO_INTAKE` markers where the live site contradicts itself (age gate 21 vs
terms 18, shipping speed, support address, two overlapping promos, old domain
in the privacy policy). Products the store lists as not purchasable with no
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
| `WP_ORIGIN` | `https://ptresearch.shop` | WooCommerce origin the Store API is read from |
| `NEXT_PUBLIC_SITE_URL` | `https://<brand-config domain>` | Canonical URL for metadata, sitemap, JSON-LD |
| `NEXT_PUBLIC_INDEXABLE` | unset | Set to `true` only on the production apex. Anything else emits noindex/nofollow. |

No secrets are required. Nothing in this repo authenticates to WordPress.

## Layout

- `app/` routes (App Router). `robots.ts` and `sitemap.ts` honor `NEXT_PUBLIC_INDEXABLE`.
- `lib/woo/store-api.ts` typed Store API client and product mapper.
- `lib/cart.tsx` cart context and adapter seam.
- `lib/seo.ts`, `lib/jsonld.ts`, `lib/analytics.ts`.
- `content/` brand config, verbatim site copy, category map, COA map, product image map, compliance strings.
- `scripts/gen-theme.mjs` writes CSS tokens from `content/brand-config.ts`; `coa-thumbs.mjs` regenerates COA thumbnails; `data-check.mjs` reconciles the catalog against the live store.
- `DESIGN.md`, `PRODUCT.md`, `AGENTS.md` design and product notes kept from the build, including Next.js 16 gotchas.

## Deploying

Railway: Nixpacks or Node builder, build `npm run build`, start `npm run start`.
Set the three variables above per environment. Keep `NEXT_PUBLIC_INDEXABLE`
unset on any preview host.

## Production cutover notes

1. Build the WooCommerce cart adapter (above) before pointing the apex here.
2. Exclude `/wp-json/wc/store/*` from every cache layer in front of WordPress
   (LiteSpeed, Jetpack Boost, Cloudflare) or carts cross-contaminate.
3. Pin the WooCommerce and plugin versions; the Store API checkout fields are
   still marked experimental upstream.
4. Move WordPress to a `wp.` subdomain and point the apex at this app.
