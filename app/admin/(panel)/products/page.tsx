import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { requirePermission } from "@/lib/admin/auth";
import { wpOrigin } from "@/lib/admin/config";
import { oneOf, pageParam, perPageParam, searchParam, type SearchParams } from "@/lib/admin/params";
import { can } from "@/lib/admin/permissions";
import { isWooConfigured, settle } from "@/lib/admin/woo/client";
import { getStoreCurrency } from "@/lib/admin/woo/orders";
import { listProducts, type StockFilter } from "@/lib/admin/woo/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotConnected } from "@/components/admin/NotConnected";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination, hrefWith } from "@/components/admin/Pagination";
import { ProblemPanel } from "@/components/admin/Feedback";
import { ProductsTable } from "@/components/admin/products/ProductsTable";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

const STOCK_TABS: { value: StockFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "instock", label: "In stock" },
  { value: "lowstock", label: "Low stock" },
  { value: "outofstock", label: "Out of stock" },
  { value: "onbackorder", label: "On backorder" },
];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requirePermission("products.view");
  const canFix = can(user.role, "settings.manage");

  if (!isWooConfigured()) {
    return (
      <>
        <PageHeader title="Products" />
        <NotConnected canFix={canFix} />
      </>
    );
  }

  const sp = await searchParams;
  const stock = oneOf(sp, "stock", STOCK_TABS.map((t) => t.value), "all");
  const q = stock === "lowstock" ? "" : searchParam(sp);
  const page = pageParam(sp);
  const perPage = perPageParam(sp, 50);
  const params = { stock: stock === "all" ? undefined : stock, q: q || undefined, per_page: perPage === 50 ? undefined : String(perPage) };

  const [list, currency] = await Promise.all([
    settle(listProducts({ search: q || undefined, stock, page, perPage })),
    getStoreCurrency(),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        description="Stock levels for every product and size. Prices, descriptions and images are edited in WP admin."
        actions={
          <Button asChild variant="outline" className="h-9 px-3">
            <a href={`${wpOrigin()}/wp-admin/edit.php?post_type=product`} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" /> Products in WP admin
            </a>
          </Button>
        }
      />

      <div className="soft-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-hairline/70 px-4 pt-1 pb-3 md:px-5">
          <nav aria-label="Stock status" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <ul className="flex min-w-max gap-1 border-b border-hairline">
              {STOCK_TABS.map((tab) => {
                const active = tab.value === stock;
                return (
                  <li key={tab.value}>
                    <Link
                      href={hrefWith("/admin/products", { ...params, stock: tab.value === "all" ? undefined : tab.value, page: undefined })}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "-mb-px block border-b-2 px-3 py-2.5 text-[14px] font-medium whitespace-nowrap transition-colors",
                        active ? "border-green text-ink" : "border-transparent text-ink-muted hover:text-ink"
                      )}
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {stock !== "lowstock" ? (
            <Form action="/admin/products" replace scroll={false} className="flex max-w-md gap-2">
              {stock !== "all" && <input type="hidden" name="stock" value={stock} />}
              <div className="relative flex-1">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-muted" />
                <Input name="q" type="search" defaultValue={q} placeholder="Product name or SKU" aria-label="Search products" className="h-9 bg-surface pl-8" />
              </div>
              <Button type="submit" variant="outline" className="h-9 px-3">
                Search
              </Button>
            </Form>
          ) : (
            <p className="text-[13px] text-ink-muted">
              Products and sizes at or below their low stock threshold (set per product in WooCommerce).
            </p>
          )}
        </div>

        {list.ok ? (
          <>
            <ProductsTable
              rows={list.value.rows}
              currency={currency}
              canEdit={can(user.role, "products.edit")}
              emptyTitle={q ? `No products match “${q}”` : "No products here"}
            />
            <Pagination
              path="/admin/products"
              params={params}
              page={page}
              perPage={perPage}
              total={list.value.total}
              totalPages={list.value.totalPages}
              noun="products"
            />
          </>
        ) : (
          <div className="p-5">
            <ProblemPanel problem={list.problem} canFix={canFix} />
          </div>
        )}
      </div>
    </>
  );
}
