Read the full copy inventory, COA map, taxonomy, and the existing D1 spec in the repo. Here is the direction — committed, complete, zero open taste decisions.

---

# REFERENCE GRADE — Direction Spec for Primetime Research

> Working codename: **D3 · Reference Grade.** Deliberately the third animal in the room — not D1's cool "clinical ledger," not the dark glossy WebGL vial showcase. Where those are, respectively, a cold spec-sheet and a black hero reel, this is a **warm, printed reference-standards catalog** with poster-scale numerals.

---

## 1. Name + thesis

**REFERENCE GRADE.** The store's own copy already tells us what the products literally are — "analytical-grade biochemical reference standards." We build the entire identity on that word: *reference*. The site reads like the house catalog of a serious reagent supplier that also happens to be beautifully art-directed — bottle-green and warm bone paper, a high-contrast editorial serif, and **purity numbers printed the size of a magazine cover.** A skeptical researcher lands here and the first thing bigger than the logo is a verified purity figure. Every product is presented as a framed *specimen plate* — a duotoned vial with a typeset record beneath it and crop-mark corners, so all 28 inconsistently-shot vials become one collection. The thing they describe to a colleague a week later is exact and unmistakable: *"the deep-green one that looks like a real reference catalog, with the giant serif purity number and the vials shot like museum specimens."* Nobody else in this category looks remotely like it — the competitors are all black-and-neon Shopify clones. Memorability and credibility are the same move here: we make the proof (the number, the certificate, the batch) the most designed object on the page.

---

## 2. Palette

> **2026-07 REBRAND (owner directive):** the palette now matches the client's live ptresearch.shop brand — **navy blue + white with a small orange accent**. The entire Reference Grade system (plates, crop marks, bands, trophy numerals, motion) is unchanged; only the color scheme swapped. **Token key NAMES are legacy** (`green`, `green-deep`, `mint`, `amber` — ≈150 utility call sites) — their VALUES are now navy / deep navy / mist blue / orange. Wherever the rest of this spec says "green band" read *navy band*; wherever it says "amber" read *orange*.

Light-primary, cool, **material**. Color logic: paper is the ground; **navy is the brand** — the darker **band navy `#1F3353`** carries the chapter-band backgrounds, and the brighter **brand navy `#2C4D82`** (the live site's primary) carries all interactive/link/data emphasis on light; **orange is the single signal color, reserved for large display + non-text marks on dark-navy bands only** (it fails text contrast on paper by design, so it can never be misused as a link). Dark-navy "chapter bands" are a structural part of the rhythm — a direct inversion of D1's "no dark sections except the footer" rule.

| Token | Hex | Role |
|---|---|---|
| `paper` (bg) | `#F7F8FA` | cool near-white page base — reads like the client's white site, with a hair of tone so grain + plate contrast survive |
| `surface` | `#FFFFFF` | plates/cards — pure white, one step brighter than paper |
| `ink` | `#10151D` | primary text; cool near-black — 17.2:1 on paper ✓ |
| `ink-muted` | `#4E5765` | secondary text, records, micro-labels — 6.9:1 on paper ✓ |
| `hairline` | `#DCE1E9` | 1px rules + plate frames (cool) |
| `band` | `#1F3353` | chapter-band bg — the darker navy; 11.9:1 vs paper |
| `green` (brand/accent) | `#2C4D82` | brand navy — primary buttons, links, all data emphasis on light — 7.9:1 on paper ✓ |
| `green-deep` | `#182438` | hover/pressed; age-gate deep field |
| `mint` | `#C7D4E8` | mist blue — body text + secondary UI on navy bands — 8.5:1 on band ✓ |
| `amber` (signal) | `#F06D22` | ORANGE — large display numerals on navy, crop-mark ticks, marquee — 4.2:1 on band (large/graphic only) ✓ |
| `ok` | `#1E7A4A` | in-stock dot + earned verified mark — 5.0:1 on paper ✓ (paired with text, never text-alone below 18px) |
| `warn-wash` | `#FDEEE2` | faint orange wash behind RUO/compliance lines (ink text on top, 16:1) |
| `error` | `#B3341C` | cool brick red — form errors, decline — 5.8:1 on paper ✓ |

**Hard rules:** no gradients, no glassmorphism, no gradient text, no purple, no emoji. *(Softening pass 2026-07:)* shadows are no longer banned — the sanctioned **layered soft shadow recipe** (§4) is the primary depth cue on cards; it stays airy (never muddy) and never replaces a border doing contrast work. Depth comes from that elevation plus the navy/paper value jump — still no blur-glass, no glow. A **very subtle paper grain** (inline SVG noise, ~3% opacity, data-URI, no external request) sits on paper sections so flat color reads as *printed catalog*, not *web default* — this is load-bearing for the "physical/credible" feel; keep it below the threshold of conscious notice.

**Orange discipline (was "amber misuse"):** orange `#F06D22` is a large-display / graphic / dark-band token ONLY — never text on paper (2.9:1 by design, so it can never pass review as a link or body text). On the band navy it clears 3:1 for display-scale use (4.2:1 measured). The only orange that ever touches paper is decorative marks (crop ticks, batch-tick separators, the 2–3px tick-rules) — never informational text.

---

## 3. Typography

> **2026-07 TYPE RESET (owner directive, Matt):** *"I don't like the font — it needs to be more normal and clean across the site."* The Fraunces serif display was the offender. The system is now **ONE clean modern sans across the entire site — Satoshi Variable** — the same treatment Matt already approved on the sibling v1 build. **Fraunces and General Sans are RETIRED** (their `.woff2` files remain in `app/fonts/` on disk, unwired; do not re-wire them). No serif anywhere.

**The face — Satoshi Variable** (Indian Type Foundry). License: **ITF Free Font License via Fontshare**, self-hosted (`app/fonts/Satoshi-Variable.woff2` + italic cut). Variable `wght 300–900` + italic. Geometric-humanist, true tabular lining figures — clean and confident at poster scale, neutral and legible at body scale. One face carries display, body, UI, and data.

Wired via `next/font/local` in `app/layout.tsx` (`weight "300 900"`, `display: swap`, preloaded) exposing `--font-satoshi`. In `globals.css` **every** role var — `--font-sans`, `--font-mono`, `--font-display`, `--font-heading`, plus defensive aliases `--font-fraunces` / `--font-general` — resolves to the Satoshi stack, so no stray utility or legacy var reference can resurrect a serif or a code font.

**Roles & scale** (sizes/clamps unchanged from the serif system — only face, weight, and tracking changed)

| Role | Face / weight | Size | Tracking |
|---|---|---|---|
| Hero display (`.display-hero`) | Satoshi 700 | `clamp(3rem, 8vw, 6.5rem)` | `-0.028em` |
| **Trophy numeral** (`.trophy-num`, purity) | Satoshi 700, tabular lining | `clamp(4rem, 14vw, 11rem)` | `-0.02em` |
| Section heading (h1–h4 base) | Satoshi 650 | `clamp(1.9rem, 3.4vw, 3rem)` | `-0.025em` |
| Plate/product title | Satoshi 600 (semibold) | `1.25–1.5rem` | `-0.01em` to `-0.015em` |
| Lead / intro | Satoshi ~430 | `19px / 1.55` | 0 |
| Body | Satoshi ~430 | `16px / 1.6` | 0 |
| Inline data (`.data-num`/`.data-mono`, price, mg) | Satoshi 500, `tabular-nums lining-nums` | inherits | `-0.005em` |
| Batch / SKU (`.batch-id`) | Satoshi 520, uppercase, tabular | `12px` | `0.06em`, amber tick separators |
| Micro-label / kicker (`.micro-label`) | Satoshi 500, uppercase | `11px` | `0.08em` |
| Buttons / nav | Satoshi 500 | `14–15px` | default |
| Wordmark (Header / Footer / AgeGate) | Satoshi 700 | `19–20px` | `-0.02em` |

**Numbers without a code font — the core discipline (unchanged).** Two tiers, both proportional-quality typography:
1. **Trophy numbers** (a product's headline purity, the hero figure) are set in **Satoshi 700 at poster scale** — `tabular-nums lining-nums`, the `%` sign optically reduced to ~55% and baseline-raised (`.trophy-pct`). This is the emotional/credibility object. (`.trophy-plus` is now a compat no-op — it existed to fix Fraunces' monoline-thin `+` glyph.)
2. **Functional numbers** (prices, mg sizes, batch IDs, table cells) are **Satoshi 500 with `tabular-nums lining-nums`**, right-aligned in any column context. Batch IDs like `PTR-5946785` are uppercase tracked Satoshi with thin **amber tick** separators — reads precise and machine-verified without a single monospace glyph. Satoshi ships true tabular figures (verified on v1 and in the COA table + price stacks here).

---

## 4. Layout character

> **2026-07 SOFTENING PASS (owner directive, Matt):** *"I don't like the sharp corners — make the website feel softer and more clean, not as rigid."* The identity (palette, trophy numerals — now Satoshi 700 per the §3 type reset — chapter bands, dot leaders, duotone vials, layout + copy) is unchanged; the SURFACE LANGUAGE is now soft. This section documents the current (soft) component language; the square/crop-mark spec it replaces is preserved in the crop-mark retirement note at the end of the section.

**Grid:** 12-col, max content `1240px`, wide gutters, `py-24 md:py-32` section padding. Generous negative space — the catalog should feel curated, not crammed.

**The signature layout move — the Soft Specimen Card.** Every product, category, and certificate is a **16px-radius surface card** carrying the lightest hairline (`hairline` at ~60%) and a **layered soft shadow** — elevation frames the specimen now. Inside: the duotoned vial (§5) sits **inset 4px with a 12px radius** (a soft matte inside the card; `overflow-hidden` lives on the inset WITH the radius so cover images can never pierce the rounded corners); beneath the card a hairline rule, then the **typeset record** — compound name in semibold Satoshi, then a Satoshi tabular data line (`mg · purity · category`). This single component is still the whole system: product card, category tile, certificate card, and hero figure — instantly re-describable, and still the practical fix for 28 mismatched vial photos.

**Radius scale (tokens in `globals.css` `@theme`, inherited by all `ui/*` shadcn components):**

| Surface | Radius | Token / utility |
|---|---|---|
| Cards, plates, images, panels | **16px** | `--radius-xl` / `rounded-xl`, `.plate-field`, `.soft-card`, `.ledger-card` |
| Buttons, inputs, selects, textareas, size tabs, qty steppers | **10px** | `--radius-lg` / `rounded-lg` (shadcn base `--radius`) |
| Small marks (checkbox, thumbnails' frames, wash strips) | **6–8px** | `--radius-xs/sm/md` |
| Chips, badges, verified-mark chip, coupon tags, filter chips | **full pill** | `--radius-4xl` / `rounded-full` |
| Band-inner content containers (age-gate card, drawer edge, band Q&A card) | **20px** | `--radius-2xl` / `rounded-2xl` |
| Full-bleed chapter bands + footer at the viewport edges | **square** | full-bleed sections never round against the viewport; any surface sitting ON a band gets 16px |

**The shadow recipe** (depth now comes from elevation, not boxes of rules):

- Resting card: `0 1px 2px rgba(16,21,29,.04), 0 8px 24px rgba(31,51,83,.07)` (`--shadow-card`)
- Hover: `0 2px 4px rgba(16,21,29,.05), 0 14px 36px rgba(31,51,83,.10)` (`--shadow-card-hover`) + a 2px lift, 200ms ease; reduced-motion = shadow only.
- Shadows never replace a border that was doing CONTRAST work — focus states keep the 2px navy outline (it follows the rounded corners).

**Lattice → breathing cards rule.** The shared-hairline lattice (`gap-px bg-hairline` grids — the old TrustBento / about-badges pattern) is retired: grids now use `gap-4/6` with individually-rounded `.soft-card` cells. **Ledger tables keep their internal row rules** (tables stay tables) but lose their outer box border in favor of `.ledger-card` — a 16px rounded container with the soft shadow and a faint navy header-row wash rounded into the top corners. Dot leaders, hairline section rules, and ruled record rows all stay — *fewer boxes, not fewer records.*

**Rhythm:** paper sections alternate with full-bleed **green chapter bands**. Bands introduce each major movement (Categories, Verified Batches, About, Footer) and carry the amber signal + display type. The paper→green→paper cadence *is* the memorable structure and the sharpest departure from D1's uniform light spec-sheet.

- **Catalog / category browse:** a grid of soft specimen cards, 3-up desktop / 2-up tablet / 1-up mobile. Category filter chips are full pills; search/sort are 10px soft controls.
- **PDP:** two columns — card left, record right (§8).
- **COA / Lab Results library:** a "wall of certificates" — soft specimen cards where the vial slot is replaced by the **trophy purity numeral**; the whole page is a grid of green numbers on paper. This is the destination that closes the sale for a skeptic (§9).

**Crop-mark retirement (2026-07).** The original spec framed every plate as a *square (radius 0) field with crop-mark corner ticks* — registration marks on a print proof — and set cards/inputs to radius 0, buttons to 4px, and grids to hard shared-hairline lattices. Matt's owner feedback called the result rigid; the crop marks were the signature source of that rigidity, so they are **retired entirely**: `CropMarks` renders nowhere (the export survives in `components/plate/SpecimenPlate.tsx` only so legacy call sites compile — do not add new usages). What the ticks used to do (frame the specimen, signal "measured object") the layered shadow + 12px-radius inset matte now do — the plate still reads as a mounted specimen, just a calm one. Everything that made the system credible (trophy numerals, typeset records, duotone, earned marks, dot leaders, grain) is untouched.

---

## 5. Imagery treatment

**Existing vial photos → duotone specimen plates.** Map every product photo to a 2-tone ramp: shadows → `band navy #1F3353`, highlights → near-white `#FCFDFF`, with a slate-blue midtone (monotonic luminance — saturated off-hue mids go muddy). Pre-process to WebP (build-time script or one-time batch) rather than CSS blend, so the effect is deterministic and the source lighting inconsistencies vanish. Center each on `surface` inside the soft specimen card (softening pass: 12px-radius inset matte, no crop marks). Result: 21 vials that were shot on different days under different lights become one cohesive, expensive-looking collection. Duotone (flat, 2D, printed) is also the clean structural difference from the WebGL build's glossy 3D renders — same subject, opposite treatment.

**New imagery to generate (small, deliberate):** one hero atmospheric macro + up to four category-band backdrops. Generate via `gpt-image-2`, then run through the same duotone pipeline so they live in-palette.

*Prompt sketch (hero):* "Extreme macro photograph, a row of small clear glass laboratory vials with pale lyophilized peptide powder and matte crimped aluminum caps, standing in a clean anodized rack, shallow depth of field, soft directional north-window light, matte finish (no glossy reflections, no neon), neutral seamless background, editorial scientific-supply catalog photography, shot on 100mm macro, calm and precise." → duotone to green/bone, ~8% grain.

**No stock lab clichés** (no gloved-hands-in-blue-nitrile, no swirling-molecule renders, no microscope-with-lens-flare). The vials, the numbers, and the paper carry it.

**Local branded vial images + duotone (2026-07-21, DECIDED).** The pipeline for locally generated navy-branded studio vial shots is wired: `content/product-images.json` maps `slug → /product-vials/<slug>.webp` (16/21 slugs as of this date; missing slugs fall back to Woo images automatically), and the Woo mapper prepends any local vial as `images[0]` (cards + PDP primary) with the true-color Woo originals kept behind it in the PDP thumb strip.

**Decision: local `/product-vials/` images are EXEMPT from `#pt-duotone`** (implemented in `SpecimenPlate` — the `.duotone` class is skipped when `image.src` starts with `/product-vials/`). Decided from side-by-side screenshots at real card scale (`.polish/vials-wired/zoom-bpc157-duotone.png` vs `.polish/vials-exempt/zoom-bpc157-exempt.png`):

- Duotoned, the branded label visibly muddies: the navy label ink lifts to mid-slate (contrast drops on the compound name), the navy "10mg" dose pill washes to pale slate, the logo roundel loses all internal detail (reads as a smudge), the small "99% purity / For research use only" lines go soft, and the glass edges melt into the background haze.
- True-color, the branding is the point: crisp near-navy compound name, solid dose pill, legible roundel + wordmark — and the label navy already ties into the site palette.
- The duotone's original job — unifying 28 mismatched Woo photos — does not apply here: the local set is generated from ONE style anchor (same warm-champagne studio look, same label system) and is already cohesive.

The remaining Woo-image products (5 as of this date: BAC Water, Glow Blend, Glutathione, Klow Blend, NAD+) KEEP the duotone — it still masks their mismatched source photography, and the mixed grid reads acceptably (duotoned white-field shots sit quietly beside the warm studio shots). The exemption is asset-scoped, not a palette change: hero figures, certificate facsimiles, and every non-`/product-vials/` image keep the duotone treatment unchanged. As remaining vial assets land, add them to the manifest and they inherit the exemption automatically.

---

## 6. Motion personality

Framer Motion (`motion`), client leaf components only. Calm, editorial, deliberate — a catalog being turned, not a dashboard animating. Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`, durations 400–600ms.

- **Entrances:** fade + rise 14px, 70ms stagger per group.
- **Plate hover** *(softened 2026-07)*: the shadow deepens gently + a 2px lift (200ms ease), and the duotone "develops" — contrast/saturation eases up ~8% as if a print resolving. (The crop-tick extension retired with the crop marks; reduced-motion = shadow deepen only.)
- **Scroll:** quiet parallax on chapter-band display type only (≤12px). No scrubbing, no pinning.
- **THE signature motion moment — the chapter-band ink-wipe.** As a green band scrolls into view, the green fills from the section's bottom hairline **upward** (`clip-path` / `scaleY` from bottom), and its display type + amber ticks rise in behind the fill — like ink flooding a page or a new chapter opening. One unmistakable, ownable beat, used only on band transitions (3–4 times per homepage).
- **Deliberately NOT used:** count-up on numbers and SVG leader-line annotations — those belong to D1; avoiding them keeps this clearly distinct. Purity numerals appear fully-formed and static (more authoritative anyway); their only motion is a single amber tick-underline that draws in.
- **Reduced-motion:** all wipes/parallax/transforms collapse to instant opacity fades; the ink-wipe becomes a plain cross-fade; the marquee (§7) freezes to a static line. No layout shift in either mode.

---

## 7. Homepage blueprint (section order + real content)

0. **Age gate** (first visit, cookie-persisted) — full-screen deep-green admittance card, the concentrated brand impression. Wordmark, heading, the two verbatim checkboxes (age + `"I understand these products are for research use only and are not for human consumption."`), the role `<select>` (`Private Research / Academic Institution / Commercial Laboratory / Clinical Research`), Accept (green) / Decline (text). **Set to 18+** — the brief mandates 18, and Terms §2 + Privacy §9 both say 18; the live homepage's "21" is an internal inconsistency we correct here.
1. **RUO band (top, persistent):** thin band, verbatim `"FOR RESEARCH USE ONLY"` as a slow amber-tick marquee on green (freezes under reduced-motion). Present everywhere; never smothering.
2. **Header:** wordmark "Primetime Research" + micro sub-label; nav `Catalog · Categories · Lab Results · FAQ`; cart count in tabular figures.
3. **Hero:** kicker `HIGHEST QUALITY` → Satoshi 700 heading `Premium-Grade Peptides` → verbatim body. **Signature:** the store's `99%+` claim as a poster-scale Satoshi trophy numeral, with an honest, accurate caption drawn from the real COAs — `"measured 99.19%–99.56% across third-party-tested batches"` — beside a duotone specimen plate. CTAs: `View Catalog` (green) + `View COAs` (ghost). No fabricated figures; the range is real.
4. **Promo chapter band (green):** `Buy One Get One 50% Off` + `AUTO-APPLIED AT CHECKOUT • NO CODE NEEDED` (verbatim). **Recommendation (content call): BOGO is the single homepage promo;** PT25 lives only on `/affiliates`. Running both at once, as the live site does, reads as noise to skeptics.
5. **Trust bento (paper):** the 4 verbatim `trustBadges` (Research Use Only / 3rd Party Tested / Customer Services / Credit Cards Accepted) in **varied cell sizes** — no identical-card monotony.
6. **Categories chapter band (green):** the 9 `taxonomy.ts` categories as an index of specimen-plate tiles — name (semibold Satoshi), verbatim blurb, count, link.
7. **Verified Batches rail (paper):** the ~13 products with real COAs, each plate showing its **actual purity numeral** (99.28% BPC-157, 99.56% GLP1-SM, etc.) and a COA link. This is the trust flex placed high.
8. **Stats band:** the 4 verbatim `stats` (`Thousands` / `50+ States` / `99%` / `12 years`), set modestly in bold Satoshi tabular — *static, no count-up.*
9. **About band (green):** verbatim `aboutCopy` — tagline "Where Innovation Meets Research Excellence," the standards line, the "No exceptions. No shortcuts." assurance. (`"empower"` is on Sentravision's ban list but is verbatim client copy — flagged for optional intake rewrite; kept verbatim by default.)
10. **Lab Results teaser → full library.**
11. **FAQ (paper):** use the **9-item `/faq` set as canonical** (detailed, method-specific) — accordion of record cards; drop the redundant homepage 5-item set.
12. **Newsletter + footer (deep green, generous):** verbatim newsletter block; verbatim `footerCompliance`; support email **`support@ptresearch.shop`** as canonical (resolving the `ptrsearch.shop` typo and the `primetimepeptides.com` privacy-page mismatch).

**Cut / demote:** the auto-rotating "771 Reviews / 6 hours ago" widget. Dated, self-refreshing testimonials read as fabricated to exactly this audience and *undercut* the trust thesis. Omit, or if the client insists, show undated and clearly de-emphasized.

---

## 8. PDP blueprint

Two columns.

**Left — the specimen plate:** duotone vial, crop-mark frame. For the **3 multi-size products**, a segmented size control below the plate (radius 0 tabs); selecting a size updates price and, where available, the plate image.

**Right — the record (top-to-bottom):**
1. Category micro-label (from taxonomy).
2. Compound name in Satoshi — **coded display names respected exactly (`GLP1-SM` / `GLP2-TZ` / `GLP3-RT`); GLP trade names never expanded** (PRODUCT.md hard rule).
3. **Trust block, staged first and biggest:** the **trophy purity numeral** (Satoshi 700, green, e.g. `99.28%`) with amber tick-underline → `Third-party verified · HPLC + Mass Spectrometry` → two buttons, `Purity Certificate (PDF)` + `Endotoxin Certificate (PDF)` → batch id in tabular Satoshi. Purity is resolved above price, on purpose.
4. Price (tabular) + in-stock dot (`ok`).
5. Size selector (multi-size only).
6. `Add to Cart` (green, radius 4px). One calm RUO line directly beneath — the only compliance text in the buy zone.
7. Below the fold, hairline-separated: description, research-application bullets, storage note (`-20°C` etc.), product FAQ — all verbatim per product.

Products **without** a published COA show the trust block honestly in a **"Certificate pending"** state (ink-muted, no fake numeral) — refusing to fabricate is itself a credibility signal to this audience.

---

## 9. Trust architecture (the centerpiece)

The COA/purity data is not a badge tucked in a corner — in Reference Grade it is **the largest designed object in the entire system.**

1. **Numbers as trophies.** Real purity figures (99.19%–99.56%) render at poster scale in Satoshi 700 on the hero, every applicable PDP, and the Lab Results library. Precision is the aesthetic.
2. **The Lab Results library = a wall of certificates.** A grid of specimen plates where the vial slot is the green trophy numeral; each carries compound name, method line (`HPLC + Mass Spectrometry`, verbatim), batch id, and `Purity Certificate (PDF)` + `Endotoxin Certificate (PDF)` buttons. Filterable by category. A skeptic can verify the whole tested catalog in one scroll.
3. **Honesty as a feature.** The ~13 products with COAs get numerals; the rest show "Certificate pending." No blanks are papered over — the contrast between *verified* and *pending* reads as integrity, which is precisely what wins the comparison-shopper.
4. **The Purity Guarantee, surfaced.** Terms §8's real promise — *replacement/refund if valid third-party testing proves a product below its COA spec, within 30 days* — is pulled out as a stated commitment on the library and PDP. Most competitors never put this in writing; stating it is a genuine, defensible differentiator.
5. **Method transparency.** The FAQ's `"minimum purity of 99% … HPLC and Mass Spectrometry"` and third-party-lab language sit adjacent to the certificates, so the claim and its evidence are always co-located.

---

## 10. Risks / what could go wrong

1. **Warm-light vs D1's cool-light confusion.** Both directions are "light." Mitigation is structural, not just hue: the green chapter bands, the poster-scale Satoshi display, the duotone photographic plates, and the soft specimen cards make them different animals — but the build must commit to *generous* green banding and real display scale. Executed timidly (thin green slivers, small headings) it drifts toward D1. Guard the band coverage and the trophy-numeral scale in review.
2. **Orange misuse (token name `amber`).** Orange fails text contrast on paper by design. If a dev uses it for a link or body text on light, it breaks WCAG. Enforce in the theme layer: orange is a large-display/graphic/dark-band token only; brand navy is the sole interactive/data color on light.
3. **Duotone destroying product legibility.** Over-processed vials can lose the powder/fill detail buyers scan for. Tune the ramp to preserve the vial silhouette and label edge; QA all 28 at thumbnail and PDP size.
4. **Paper grain drifting into "texture noise."** Above ~4% opacity it reads as a dirty screen and *lowers* perceived quality. Keep it subliminal; test on OLED and cheap TN panels.
5. **Font performance/FOUT.** One variable font (Satoshi + its italic cut), self-hosted, preloaded, `display: swap` — lighter than the retired two-face system. Confirm the tabular figures render aligned in the size tabs and price columns before shipping.
6. **Content landmines to resolve at intake (all folded into the blueprint, none left to the dev's taste):** 21-vs-18 age gate → **18**; two live promos → **BOGO on homepage, PT25 on affiliates only**; 2-Day vs 2–4-day shipping → **state "2-day shipping" as the promise, "processed within 1 business day" as processing** and drop the softer 2–4-day line; support inbox → **`support@ptresearch.shop`**; the auto-timestamped reviews widget → **cut**; the verbatim `"empower"` → **flag to client, keep verbatim by default**.
7. **Over-artdirection reading as "marketing," not "lab."** The editorial confidence must never outrun the evidence. Rule of thumb for the build: on any screen, the most prominent element is either a verified number or a certificate link — never a lifestyle flourish. If a section can't point at proof, it gets smaller.

---

**Net:** a warm bottle-green printed reference catalog with poster-scale serif purity numerals and duotoned specimen-plate vials — buildable in Next.js 16 + Tailwind v4 + Framer Motion, 2D, two free self-hosted fonts, WCAG-clean, reduced-motion-safe. Clearly not the clinical ledger, clearly not the WebGL showcase, and impossible to confuse with the interchangeable competition — which is the entire point.

---

# JUDGE-PANEL GRAFTS (mandatory additions to the spec above)

Adopted from the losing directions by unanimous panel; treat as part of the spec:

1. **Real COA page-1 thumbnails** as trust imagery on the certificate library (and PDP cert buttons where natural): render page 1 of the 14 real COA PDFs to images. Any generated/re-hosted filename uses coded GLP tokens only.
2. **Earned verified mark**: one "verified" treatment (the ok-green, per the learned-color rule) renders ONLY where a real COA PDF exists — its absence carries meaning. Applies to plates, PDP spec area, cart line items.
3. **"How to read a COA" explainer** section on the certificate library — teach verification (sections of a cert, what HPLC purity means, how to match batch to vial). Plain copy, record-card layout, zero new claims.
4. **Checkout RUO/18+ acknowledgment checkbox** (mirrors Terms — must be checked to submit) + keep the free-shipping-toward-$200 progress meter in cart/drawer.
5. **Dot-leader table of contents** treatment for the 9 categories in the green Categories chapter band (name … count), doubles as navigation.
6. **Falsifiable-guarantee framing**: near the PDP buy zone, present the Terms purity-guarantee clause as a testable promise (verbatim clause, one framing line, link to /terms). No invented terms.
7. **Typeset COA facsimile** on PDP for cert-backed products: small ruled table using ONLY fields we actually have (compound, certificate label/batch, method "HPLC", measured purity %, certificate PDF link, endotoxin PDF link when present). Never fabricate dates/values.
8. **De-emphasize unverifiable stats** ("Thousands", "12 years") relative to verifiable figures; verified purity numbers always outrank them visually.
9. **Table-view toggle** on the certificate library alongside the plate wall (compound / category / purity / certificate links).
10. **Chromatic restraint rule**: at most three chromatic elements per viewport (green band counts as one); amber never as text on paper.
11. **Data-quality caveat**: coa-map _meta.data_quality_flags lists known PDF mislabels on the live store (e.g. AOD-9604 purity file, CJC endotoxin file). Prototype links what the live store publishes — do NOT invent corrections; the flags go to client intake.
12. **Price crossfade** (tabular, ~200ms) when switching vial sizes on the 3 multi-size PDPs.
