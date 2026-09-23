import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

/**
 * This repo is frequently checked out as a git WORKTREE whose `node_modules` is
 * a RELATIVE symlink into a sibling checkout (a single shared install — same
 * deps, no duplicate). Turbopack refuses symlinks that escape the project root
 * ("Symlink node_modules is invalid, it points out of the filesystem root"), so
 * when that symlink is present we raise the Turbopack workspace root to the
 * shared parent directory, which contains both checkouts. Production (a real
 * node_modules directory) keeps Turbopack's default root — this branch never
 * fires there.
 */
function sharedWorkspaceRoot(): string | undefined {
  try {
    const nm = path.join(process.cwd(), "node_modules");
    if (fs.lstatSync(nm).isSymbolicLink()) {
      return path.resolve(process.cwd(), "..");
    }
  } catch {
    // node_modules missing/unreadable — leave the default root.
  }
  return undefined;
}

const turbopackRoot = sharedWorkspaceRoot();

const nextConfig: NextConfig = {
  ...(turbopackRoot ? { turbopack: { root: turbopackRoot } } : {}),
  // The catalog is prerendered from the live WooCommerce Store API on shared
  // hosting, which returns sporadic 500s under bursts. Keep static generation
  // to few workers AND few pages in flight per worker; the Store API client
  // also retries transient 5xx with backoff.
  experimental: { cpus: 2, staticGenerationMaxConcurrency: 2 },
  images: {
    // Product/category imagery is served from the live WooCommerce store.
    // Next 16: `images.domains` is deprecated — remotePatterns only.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ptresearch.shop",
        pathname: "/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "ptresearch.shop",
        pathname: "/**",
      },
    ],
  },
  /**
   * The gift card lives at /gift-card here. Both live URLs for it are kept
   * alive: the header link (/digtal-gift-card/ — the live nav's own spelling)
   * and the WooCommerce product permalink. The product route would otherwise
   * try to render it from the catalog, where it is a zero-price,
   * unpurchasable record (content/gift-card.ts).
   */
  async redirects() {
    return [
      { source: "/digtal-gift-card", destination: "/gift-card", permanent: true },
      {
        source: "/product/pt-research-digital-gift-card",
        destination: "/gift-card",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
