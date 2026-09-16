/**
 * gen-theme.mjs — palette codegen: brandConfig → globals.css @theme tokens.
 *
 * brandConfig.palette (content/brand-config.ts) is the SINGLE source of truth
 * for color. This script extracts the palette and rewrites the generated block
 * in app/globals.css (between the @generated-palette markers), so a re-skin is
 * ONE file edit + `npm run gen:theme` (also runs on `npm run build` via the
 * prebuild hook).
 *
 * Output: `--color-<kebab-key>` tokens inside the `@theme inline` block —
 * Tailwind v4 turns each into utilities (bg-bg, text-ink, border-hairline,
 * text-ink-muted, text-accent, text-accent-ink, text-ok, bg-surface…).
 * The spec-named raw vars (--bg, --ink, --hairline, …) are hand-written
 * aliases in :root that point at these tokens — they never drift.
 *
 * Parsing is intentionally line-based (key: "#HEX") rather than a TS import —
 * no loader dependency, and the palette is flat hex by design contract.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandPath = path.join(root, "content", "brand-config.ts");
const cssPath = path.join(root, "app", "globals.css");

const src = fs.readFileSync(brandPath, "utf8");

// isolate the palette object literal
const palMatch = src.match(/palette:\s*\{([\s\S]*?)\n\s*\},/);
if (!palMatch) {
  console.error("gen-theme: could not locate `palette: { … }` in brand-config.ts");
  process.exit(1);
}

// camelCase → kebab-case CSS var suffix (inkMuted → ink-muted)
const kebab = (k) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const entries = [];
const re = /^\s*(\w+):\s*"(#[0-9a-fA-F]{3,8})"/gm;
let m;
while ((m = re.exec(palMatch[1])) !== null) {
  entries.push([kebab(m[1]), m[2]]);
}
if (entries.length === 0) {
  console.error("gen-theme: palette parsed empty — aborting");
  process.exit(1);
}

const width = Math.max(...entries.map(([k]) => k.length));
const lines = entries
  .map(([k, v]) => `  --color-${k}:${" ".repeat(width - k.length + 1)}${v};`)
  .join("\n");

const block =
  `  /* @generated-palette:start — DO NOT EDIT (source: content/brand-config.ts` +
  ` → scripts/gen-theme.mjs) */\n${lines}\n  /* @generated-palette:end */`;

const css = fs.readFileSync(cssPath, "utf8");
const marker =
  /[ \t]*\/\* @generated-palette:start[\s\S]*?@generated-palette:end \*\//;
if (!marker.test(css)) {
  console.error("gen-theme: @generated-palette markers missing in globals.css");
  process.exit(1);
}
const next = css.replace(marker, block);
if (next !== css) {
  fs.writeFileSync(cssPath, next);
  console.log(`gen-theme: wrote ${entries.length} palette tokens → app/globals.css`);
} else {
  console.log("gen-theme: tokens already in sync");
}
