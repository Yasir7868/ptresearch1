import type { MetadataRoute } from "next";
import { INDEXABLE, SITE_URL } from "@/lib/seo";

/**
 * robots.txt — gated on NEXT_PUBLIC_INDEXABLE (same gate as lib/seo defaults).
 * Preview/staging deployments (flag unset) disallow ALL crawling; only the
 * production deployment with the flag set to "true" is crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    // The admin panel also sends X-Robots-Tag: noindex (proxy.ts).
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
