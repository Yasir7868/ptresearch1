import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getCatalog } from "@/lib/woo/catalog";
import { CATEGORIES } from "@/content/taxonomy";

/**
 * Sitemap — static routes + every catalog category (/catalog/[category]) +
 * every product PDP (/product/[slug]) from getCatalog().
 *
 * This is generated regardless of indexability; it only matters once the
 * production deployment sets NEXT_PUBLIC_INDEXABLE=true (see app/robots.ts).
 * The product fetch is wrapped so an unreachable upstream store at build time
 * still yields a valid static + category sitemap.
 */
const STATIC_ROUTES = [
  "",
  "/catalog",
  "/coa",
  "/faq",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/shipping",
  "/affiliates",
  "/track-order",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  for (const category of CATEGORIES) {
    entries.push({
      url: `${SITE_URL}/catalog/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  try {
    const products = await getCatalog();
    for (const product of products) {
      entries.push({
        url: `${SITE_URL}/product/${product.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Upstream store unreachable at build — ship static + category routes only.
  }

  return entries;
}
