/**
 * components/giftcard/card-art.ts — the gift card artwork, drawn rather than
 * photographed.
 *
 * The live page does not use the WooCommerce variation images for its stage.
 * Its script builds the card as an inline SVG data URI for whatever figure is
 * selected, which is what lets a CUSTOM amount ($337, say) show a real card
 * instead of falling back to a preset's picture. This is that SVG, geometry
 * for geometry (harvested 2026-09-21).
 *
 * The live gradient reads its top stop from the Elementor global colour
 * `--e-global-color-e5db446`, which resolves to #2c4d82 — the same brand navy
 * this repo calls `green` in content/brand-config.ts. It is hard-coded here
 * rather than read from the theme because the value is baked into a data URI,
 * not a stylesheet, so a CSS variable would never resolve.
 *
 * The vendored PNGs in public/images/gift-card/ are kept for the OG image and
 * JSON-LD, which need a real absolute URL.
 */

/** Brand navy — live's `--e-global-color-e5db446`. */
const CARD_NAVY = "#2c4d82";

/**
 * The amount as the live card prints it: "$25", "$1,000" — grouped, no cents.
 * Also the label on every tick and on the Add to cart button.
 */
export function cardMoney(amountMinor: number): string {
  return `$${Math.round(amountMinor / 100).toLocaleString("en-US")}`;
}

/** The big figure beside the standalone "$": grouped, no symbol, no cents. */
export function cardFigure(amountMinor: number): string {
  return Math.round(amountMinor / 100).toLocaleString("en-US");
}

/**
 * The card for one amount, as an SVG data URI (1200×900).
 *
 * Live drops the figure from 134px to 115px at $1,000 and up, so the four
 * digits still clear the orbit mark — kept, since a custom amount can reach
 * exactly that width.
 */
export function cardArt(amountMinor: number): string {
  const label = cardMoney(amountMinor);
  const size = amountMinor >= 100_000 ? 115 : 134;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">` +
    `<defs>` +
    `<linearGradient id="b" x2="1" y2="1"><stop stop-color="${CARD_NAVY}"/><stop offset="1" stop-color="#152940"/></linearGradient>` +
    `<linearGradient id="r" x2="0" y2="1"><stop stop-color="${CARD_NAVY}" stop-opacity=".22"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>` +
    `<filter id="s" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="16" stdDeviation="15" flood-opacity=".22"/></filter>` +
    `</defs>` +
    // Ground, contact shadow and the reflection fading below the card.
    `<rect width="1200" height="900" fill="white"/>` +
    `<ellipse cx="600" cy="716" rx="459" ry="25" fill="#000" opacity=".08"/>` +
    `<rect x="125" y="726" width="950" height="120" rx="30" fill="url(#r)"/>` +
    `<rect x="125" y="115" width="950" height="590" rx="36" fill="url(#b)" stroke="#738ca9" stroke-width="3" filter="url(#s)"/>` +
    // The orbit mark, ghosted into the card's right side.
    `<g fill="none" stroke="white" opacity=".09" stroke-width="24">` +
    `<circle cx="863" cy="397" r="132"/>` +
    `<ellipse cx="863" cy="397" rx="61" ry="180" transform="rotate(40 863 397)"/>` +
    `<ellipse cx="863" cy="397" rx="61" ry="180" transform="rotate(-40 863 397)"/>` +
    `</g>` +
    `<text x="192" y="204" fill="white" font-family="Arial,sans-serif" font-size="15" letter-spacing="7">DIGITAL GIFT CARD</text>` +
    `<text x="192" y="433" fill="white" font-family="Arial,sans-serif" font-weight="700" font-size="${size}">${label}</text>` +
    `<text x="192" y="609" fill="white" font-family="Georgia,serif" font-size="29">PRIMETIME</text>` +
    `<text x="192" y="642" fill="white" font-family="Georgia,serif" font-size="24" letter-spacing="4">RESEARCH</text>` +
    `</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
