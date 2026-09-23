import type { Metadata } from "next";
import { getCatalog } from "@/lib/woo/catalog";
import { coaPage, heroCopy } from "@/content/site-copy";
import { coaList } from "@/content/coa-list";
import coaMapRaw from "@/content/coa-map.json";
import { pageMetadata } from "@/components/static/page-meta";
import { CoaLibraryView, type CoaItem } from "@/components/static/CoaLibraryView";

export const metadata: Metadata = pageMetadata({
  title: coaPage.title,
  description: heroCopy.trustBody,
  path: "/coa",
});

// coa-map.json mixes certificate records with `_meta`/`_unmatched` keys; every
// real record carries the product id it belongs to.
interface CoaRecord {
  coaUrl?: string;
  label?: string;
  productId?: number;
}

const certByProductId = new Map<number, CoaRecord>();
for (const [key, value] of Object.entries(coaMapRaw as Record<string, unknown>)) {
  if (key.startsWith("_")) continue;
  const rec = value as CoaRecord;
  if (typeof rec.productId === "number") certByProductId.set(rec.productId, rec);
}

// The live /coa/ page: a searchable list of products; Purity / Endotoxin open
// the certificate PDF in a panel with the product's price and Add to Cart.
export default async function CoaPage() {
  const products = await getCatalog();
  const byId = new Map(products.map((p) => [p.productId, p]));

  const items: CoaItem[] = [];
  for (const row of coaList) {
    const cert = certByProductId.get(row.productId);
    const purityUrl = row.purityUrl ?? cert?.coaUrl;
    if (!purityUrl) continue;

    const p = byId.get(row.productId);
    items.push({
      id: row.productId,
      name: row.name,
      batch: cert?.label,
      image: p?.images[0]?.src ?? row.image,
      purityUrl,
      endotoxinUrl: row.endotoxinUrl,
      product: p
        ? {
            productId: p.productId,
            sku: p.sku,
            displayName: p.displayName,
            image: p.images[0]?.src,
            priceMinor: p.priceMinor,
            currencyMinorUnit: p.currencyMinorUnit,
            variations: (p.variations ?? []).map((v) => ({
              variationId: v.variationId,
              size: v.size,
              priceMinor: v.priceMinor,
            })),
            available: p.isPurchasable && p.isInStock,
          }
        : undefined,
    });
  }

  return (
    // The live page's own ground; CoaLibraryView carries its font stack.
    <main className="landing bg-[#f6f6f6] text-[#1a1a1a]">
      <h1 className="sr-only">{coaPage.title}</h1>
      <CoaLibraryView items={items} />
    </main>
  );
}
