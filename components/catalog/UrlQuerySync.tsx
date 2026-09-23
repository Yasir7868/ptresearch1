"use client";

/**
 * UrlQuerySync — hands the `?q=` search param to a page's search box. The
 * header search (→ /catalog?q=…) and the homepage batch lookup (→ /coa?q=…)
 * arrive this way.
 *
 * Render it inside <Suspense fallback={null}>: useSearchParams opts the tree
 * up to the nearest Suspense boundary out of prerendering, and this leaf
 * renders nothing, so the grids around it stay in the static HTML.
 */

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function UrlQuerySync({ onQuery }: { onQuery: (query: string) => void }) {
  const query = useSearchParams().get("q");

  useEffect(() => {
    if (query !== null) onQuery(query);
  }, [query, onQuery]);

  return null;
}
