/**
 * DuotoneDefs — the single SVG filter that turns every product photo into a
 * navy → slate → white 2-tone specimen (D3 §5). Rendered ONCE in app/layout.tsx
 * so `.duotone` (globals.css) can reference `url(#pt-duotone)` anywhere.
 *
 * Deterministic, no build pipeline: a luminance matrix collapses the source to
 * grayscale, then per-channel `feFuncR/G/B` table transfers remap the grayscale
 * ramp onto four stops — shadows to band navy (#1F3353), a slate-blue low mid,
 * a cool-light high mid, highlights to near-white (#FCFDFF). SSR-safe (pure
 * markup, no client JS). The <svg> itself is visually hidden but must stay in
 * the DOM for the filter reference to resolve.
 *
 * color-interpolation-filters="sRGB" keeps the mapped colors predictable
 * (the default linearRGB would wash them out).
 */
export function DuotoneDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <defs>
        <filter id="pt-duotone" colorInterpolationFilters="sRGB">
          {/* Rec-601 luminance → grayscale */}
          <feColorMatrix
            type="matrix"
            values="0.299 0.587 0.114 0 0
                    0.299 0.587 0.114 0 0
                    0.299 0.587 0.114 0 0
                    0     0     0     1 0"
          />
          {/* 4-stop duotone ramp: band navy #1F3353 (shadow) → slate blue
              #4A6899 (low mid) → cool light #AEC0D8 (high mid) → near-white
              #FCFDFF (highlight). Navy must survive into the mids — saturated
              off-hue mids go muddy and the collection stops reading as the
              navy/white catalog (DESIGN §5). Every channel rises monotonically,
              so luminance order is preserved and powder/fill/label detail
              survives (risk #3): navy vial labels on white map to navy-on-
              near-white and stay legible at card scale. */}
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.122 0.290 0.682 0.988" />
            <feFuncG type="table" tableValues="0.200 0.408 0.753 0.992" />
            <feFuncB type="table" tableValues="0.325 0.600 0.847 1.000" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}
