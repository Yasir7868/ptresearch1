# Primetime Research — Product Brief

Production Next.js storefront for **Primetime Research** (research-peptide
e-commerce, live store: `ptresearch.shop`). This repo is the front-end rebuild;
product imagery + canonical copy come from the live WooCommerce store.

## Audience & register

- **Audience:** researchers buying peptides and peptide blends for laboratory
  use. They compare purity numbers, COAs, and prices. They distrust hype.
- **Register:** PRODUCT / clinical — restrained, precise, trust-first. The
  site reads like a beautifully typeset lab document, not a supplement shop.
- **Copy style:** short sentences, concrete details, zero marketing fluff.
  Banned words: unleash, elevate, streamline, leverage, cutting-edge,
  game-changing, revolutionize, empower, delve, foster, spearhead, robust,
  seamless. No emoji anywhere.

## Verbatim client copy (do not rewrite)

- Hero headline: **"Premium-Grade Peptides"**
- Hero subhead: **"At Primetime Research, we're committed to providing
  researchers with the highest quality peptides and peptide blends in the
  industry."**
- Tagline: **"Where Innovation Meets Research Excellence"**

Promos (live offers, display verbatim; constants in `content/brand-config.ts`):

- "Buy One Get One 50% Off — auto-applied at checkout"
- "Code PT25 — 25% off"
- "Free shipping over $200"
- "2-Day Shipping"

## Compliance framing (prominent, not fine print)

RUO framing is a first-class trust element. Strings live in
`content/compliance.ts`:

- Banner: **"FOR RESEARCH USE ONLY. Not for human or veterinary use."**
- FDA disclaimer + footer note included there — pull verbatim.

## HARD RULES (violations = rework)

1. **GLP coding discipline.** GLP-compound trade names are NEVER written
   expanded anywhere in this repo — no file, no comment, no fixture, no
   commit message. The product whose live name starts "Sema" is ALWAYS
   displayed and stored as **"GLP1-SM"**. "GLP-2-TZ" → display **"GLP2-TZ"**.
   "GLP3-RT" stays **"GLP3-RT"**. A `DISPLAY_NAME_OVERRIDES` map keyed by
   product id/sku in the catalog mapper enforces this — raw harvested names
   must pass through the mapper before they touch UI, cart, JSON-LD, or
   fixtures.
2. **No real client contacts anywhere.** Any placeholder email in UI copy
   must be the site's own support address string as it appears in the live
   store copy (harvest it — never invent one). Test data uses a
   developer-owned mailbox only, never a customer address.
3. **Attribution.** If company attribution is ever needed client-facing, it
   is "Sentravision" (never with LLC/Inc) — but this site itself carries NO
   Sentravision branding.
4. **Indexability.** `lib/seo.ts` gates robots on `NEXT_PUBLIC_INDEXABLE`.
   Preview/staging deployments must never set it to "true".

## Architecture seams

- **Cart:** `lib/cart.tsx` — `CartAdapter` interface; the shipped
  `LocalStorageCartAdapter` computes totals locally (BOGO 50%, PT25, free
  shipping ≥ $200). The future WooCommerce adapter (WC Store API) returns
  server-canonical totals with zero component changes. `CartItem`/
  `AddItemInput` already carry `productId`/`variationId`/`variation` for the
  swap. All money = integer minor units (cents).
- **Analytics:** `lib/analytics.ts` — console stub; PostHog swaps in via
  `setAnalyticsAdapter`.
- **SEO / structured data:** `lib/seo.ts` + `lib/jsonld.ts` (Product,
  Breadcrumb, Organization). JSON-LD uses mapper DISPLAY names only.
- **Theme:** `content/brand-config.ts` palette → `scripts/gen-theme.mjs` →
  generated token block in `app/globals.css` (prebuild hook). Never hand-edit
  the generated block.

## Design system — D3 "Reference Grade"

Full spec: `DESIGN.md`. Navy-and-white printed reference catalog (2026-07
rebrand to the client's live ptresearch.shop palette — navy + white, small
orange accent); the proof (purity number, certificate) is the most-designed
object on every screen.

> **2026-07 softening pass (owner feedback, Matt):** the surface language is
> now SOFT — crop marks retired, plates are 16px-radius soft specimen cards
> with a layered shadow, buttons/inputs 10px, chips full pills, hairline
> lattices replaced by breathing card grids (DESIGN.md §4). Identity —
> palette, type, trophy numerals, chapter bands, duotone, copy — unchanged.

- **Palette (brand-config.ts → tokens; legacy KEY NAMES kept, values swapped):**
  `paper #F7F8FA` cool near-white ground, `surface #FFFFFF` plates, `ink
  #10151D` / `ink-muted #4E5765` text, `hairline #DCE1E9` rules, `band #1F3353`
  chapter-band bg (darker navy), `green #2C4D82` (BRAND NAVY — buttons, links,
  ALL data emphasis on light) / `green-deep #182438` hover, `mint #C7D4E8`
  mist-blue text on navy bands, `amber #F06D22` (ORANGE signal — large display
  + graphic marks on navy bands ONLY, never text on paper), `ok #1E7A4A`
  in-stock + earned verified mark, `warn-wash #FDEEE2`, `error #B3341C`.
  `accent`/`accent-ink` are ALIASES of green/green-deep (legacy
  `text-accent`/`bg-accent` call sites stay on-palette). Orange failing
  text-contrast on paper is BY DESIGN.
- **Type (2026-07 reset, owner directive Matt: "more normal and clean"):**
  ONE face site-wide — Satoshi Variable (ITF FFL via Fontshare, self-hosted,
  `--font-satoshi`). Fraunces + General Sans are RETIRED (files on disk,
  unwired); every font var (`--font-sans`/`-mono`/`-display`/`-heading` +
  legacy aliases) resolves to Satoshi. No code font, no serif. Body 16px/1.6
  ~430. Numbers: `.trophy-num` (Satoshi 700 poster numeral, purity/hero) vs
  `.data-num`/`.data-mono` (Satoshi 500 `tabular-nums lining-nums`,
  prices/mg/cells). `%` on a trophy numeral = `.trophy-pct` span. Full spec:
  DESIGN.md §3.
- **System component:** `components/plate/SpecimenPlate.tsx` (+ `CropMarks`,
  `VerifiedMark`) — square hairline field, crop-mark corner ticks, duotoned
  image, typeset record. Used for product card, category tile, certificate
  card, hero figure. Server-safe (CSS hover, no "use client").
- **Duotone:** `.duotone` references the `#pt-duotone` SVG filter defined once
  in `app/layout.tsx` (navy→slate→white ramp). SSR-safe, no build pipeline.
- **Utilities:** `.band-green` / `.band-green-fg` (navy chapter-band color
  contract — legacy class name), `.paper-grain` (3.5% SVG-noise print grain),
  `.micro-label` / `.micro-label-dark`, `.batch-id` + `.batch-tick` (orange),
  `.warn-line`, `.ledger-table` (ruled). Radius: square (0) everywhere;
  buttons 4px.
- **Motion:** `components/motion/InkWipe.tsx` — the signature navy-band
  bottom-up ink flood (reduced-motion → crossfade). `FadeIn`/`CountUp` retained
  (do NOT count-up purity numerals — they are static by spec).
- **COA thumbs:** `npm run coa:thumbs` renders page 1 of each real purity PDF
  to `public/coa-thumbs/<coded-key>.webp`; manifest `content/coa-thumbs.json`.
  GLP-coded URLs 404 on the live store (expanded filenames) and are skipped —
  never map back to an expanded name.
