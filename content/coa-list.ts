/**
 * content/coa-list.ts — the product list on the live /coa/ page, in live
 * order, as its widget publishes it (re-harvested 2026-09-19).
 *
 * - `name` is the label the live page prints. The three GLP rows use the coded
 *   display names (PRODUCT.md hard rule #1) instead of the live "GLP-n".
 * - The purity PDF is the product's certificate in coa-map.json unless
 *   `purityUrl` is given (rows the official set does not cover).
 * - A row without `endotoxinUrl` shows only the Purity button, as live.
 * - `image` is only needed for a row the catalog does not sell.
 *
 * Every PDF is self-hosted under /coas/ and byte-identical to the file the
 * live page links (GLP files renamed to coded form). Known mislabels are kept
 * exactly as published and noted inline for client intake. Prices, sizes and
 * cart ids come from the live catalog, not from here.
 */

export interface CoaListEntry {
  name: string;
  /** WooCommerce product id (joins the catalog and coa-map.json). */
  productId: number;
  purityUrl?: string;
  endotoxinUrl?: string;
  image?: string;
}

export const coaList: CoaListEntry[] = [
  { name: "GLP3-RT", productId: 630, endotoxinUrl: "/coas/PTR-4311595-GLP3-RT-Endotoxin.pdf" },
  { name: "GLP1-SM", productId: 1022, endotoxinUrl: "/coas/PTR-4193082-GLP1-SM-Endotoxin.pdf" },
  { name: "GLP2-TZ", productId: 638, endotoxinUrl: "/coas/PTR-2715732-GLP2-TZ-Endotoxin.pdf" },
  { name: "BPC-157", productId: 654, endotoxinUrl: "/coas/PTR-3664990-BPC-157-Endotoxin.pdf" },
  { name: "TB-500", productId: 655, endotoxinUrl: "/coas/PTR-4131262-TB-500-Endotoxin.pdf" },
  {
    // Not in the official 2026-07 set; the live page links this older cert.
    name: "BPC-157 + TB-500 Blend",
    productId: 653,
    purityUrl: "/coas/BPC-157-TB-500-Purity.pdf",
    endotoxinUrl: "/coas/PTR-3250919-BPC-157-TB-500-Endotoxin.pdf",
  },
  { name: "Ipamorelin", productId: 652, endotoxinUrl: "/coas/PTR-6410665-Ipamorelin-Endotoxin.pdf" },
  {
    // Live mislabel: the endotoxin file is a Cagrilintide certificate.
    name: "CJC-1295 (no DAC)",
    productId: 651,
    endotoxinUrl: "/coas/PTR-1457978-Cagrilintide-Endotoxin.pdf",
  },
  { name: "GHK-Cu", productId: 656, endotoxinUrl: "/coas/PTR-4999451-GHK-Cu-Endotoxin.pdf" },
  {
    // Live mislabel: the endotoxin file is the GHK-Cu certificate.
    name: "Glutathione",
    productId: 659,
    endotoxinUrl: "/coas/PTR-4999451-GHK-Cu-Endotoxin.pdf",
  },
  { name: "MOTS-c", productId: 644, endotoxinUrl: "/coas/PTR-8553761-MOTS-c-Endotoxin.pdf" },
  { name: "NAD+", productId: 648, endotoxinUrl: "/coas/PTR-2176797-NAD-Endotoxin.pdf" },
  {
    // Live mislabel: the purity file is a Hexarelin certificate. Product 635
    // is not in the Store API (404), so the row shows certificates only.
    name: "AOD-9604",
    productId: 635,
    purityUrl: "/coas/PTR-7132129-Hexarelin-Purity.pdf",
    endotoxinUrl: "/coas/PTR-8934777-AOD-9604-Endotoxin.pdf",
    image: "https://ptresearch.shop/wp-content/uploads/2026/04/AOD-9604.png",
  },
  { name: "Melanotan II", productId: 629 },
  { name: "DSIP", productId: 647 },
  { name: "KPV BPC-157 TB-500 GHK-CU", productId: 658 },
  { name: "BPC-157 TB-500 GHK-CU", productId: 1849 },
  { name: "Tesamorelin", productId: 3323 },
  { name: "Semax", productId: 642, endotoxinUrl: "/coas/PTR-8837484-Semax-Endotoxin.pdf" },
  { name: "Selank", productId: 643, endotoxinUrl: "/coas/PTR-9715345-Selank-Endotoxin.pdf" },
];
