/**
 * coa-thumbs.mjs — render page 1 of each real COA purity PDF to a WebP thumb.
 *
 * D3 "Reference Grade" uses REAL certificate page-1 images as trust imagery on
 * the Lab Results library + PDP cert buttons (judge-panel graft #1). This
 * script downloads the purity PDFs referenced by content/coa-map.json (browser
 * UA), renders page 1 to a ~640px-wide WebP, and writes a manifest.
 *
 * Pipeline (NO new npm deps): pdftoppm (poppler) → PNG → cwebp → WebP.
 *   - Output filename = the coa-map KEY (already GLP-coded — never expanded).
 *   - Output dir: public/coa-thumbs/ (NEVER node_modules).
 *   - Manifest: content/coa-thumbs.json  { key: "/coa-thumbs/<key>.webp" }.
 *
 * GLP HARD RULE: coa-map.json's GLP purity URLs are stored in CODED form, but
 * the LIVE store serves those PDFs under expanded trade-name filenames — so the
 * coded URL 404s. This script fetches ONLY what coa-map.json publishes; a 404
 * is noted and skipped. We never map back to (or write) an expanded GLP name.
 *
 * Usage: node scripts/coa-thumbs.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mapPath = path.join(root, "content", "coa-map.json");
const outDir = path.join(root, "public", "coa-thumbs");
const manifestPath = path.join(root, "content", "coa-thumbs.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const WIDTH = 640;
const QUALITY = 80;

function have(bin) {
  try {
    execFileSync("bash", ["-lc", `command -v ${bin}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!have("pdftoppm") || !have("cwebp")) {
    console.error(
      "coa-thumbs: missing pdftoppm (poppler) and/or cwebp (webp). Install them, then re-run."
    );
    process.exit(1);
  }

  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  fs.mkdirSync(outDir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "coa-thumbs-"));

  const entries = Object.entries(map).filter(
    ([k, v]) => !k.startsWith("_") && v && typeof v === "object" && v.coaUrl
  );

  const manifest = {};
  const notes = [];
  let ok = 0;

  for (const [key, entry] of entries) {
    const url = entry.coaUrl;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !ct.includes("pdf")) {
        notes.push(`SKIP ${key}: ${res.status} ${ct || "no content-type"} (${url})`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const pdfPath = path.join(tmp, `${sanitize(key)}.pdf`);
      const pngPrefix = path.join(tmp, sanitize(key));
      fs.writeFileSync(pdfPath, buf);

      // Render page 1 only → <prefix>.png, scaled to WIDTH px wide (keep ratio).
      execFileSync(
        "pdftoppm",
        [
          "-png",
          "-singlefile",
          "-scale-to-x",
          String(WIDTH),
          "-scale-to-y",
          "-1",
          pdfPath,
          pngPrefix,
        ],
        { stdio: "ignore" }
      );
      const pngPath = `${pngPrefix}.png`;
      if (!fs.existsSync(pngPath)) {
        notes.push(`SKIP ${key}: pdftoppm produced no page-1 image (${url})`);
        continue;
      }

      const webpPath = path.join(outDir, `${key}.webp`);
      execFileSync("cwebp", ["-quiet", "-q", String(QUALITY), pngPath, "-o", webpPath], {
        stdio: "ignore",
      });

      manifest[key] = `/coa-thumbs/${key}.webp`;
      ok += 1;
      console.log(`  ✓ ${key} → coa-thumbs/${key}.webp`);
    } catch (err) {
      notes.push(`SKIP ${key}: ${err.message} (${url})`);
    }
  }

  // Deterministic key order in the manifest.
  const sorted = Object.fromEntries(
    Object.keys(manifest)
      .sort()
      .map((k) => [k, manifest[k]])
  );
  fs.writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + "\n");
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log(
    `\ncoa-thumbs: ${ok}/${entries.length} rendered → public/coa-thumbs/ ; manifest → content/coa-thumbs.json`
  );
  if (notes.length) {
    console.log("\nnotes:");
    for (const n of notes) console.log(`  - ${n}`);
  }
}

/** Filesystem-safe temp basename (output webp keeps the raw coded key). */
function sanitize(key) {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_");
}

main().catch((e) => {
  console.error("coa-thumbs: fatal", e);
  process.exit(1);
});
