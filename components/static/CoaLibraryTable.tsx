/**
 * CoaLibraryTable — the table view of the certificate library (judge-panel
 * graft #9): compound / category / purity / certificate links for the FULL
 * catalog.
 *
 * Presentational server-safe component (also rendered inside the client
 * CoaLibraryView toggle). Purity + certificate links are REAL data from
 * content/coa-map.json — products without a published certificate render an
 * honest "Pending publication" instead of a fake number. Links point at
 * exactly what the live store publishes; known mislabels are tracked in
 * coa-map.json `_meta.data_quality_flags` for client intake and are NOT
 * "corrected" here (graft #11).
 */
import Link from "next/link";

export interface CoaRow {
  slug: string;
  displayName: string;
  categoryName: string;
  /** Real measured purity from the certificate, e.g. "99.28%". */
  purity?: string;
  /** External URL of the batch purity certificate PDF. */
  coaUrl?: string;
  /** External URL of the batch endotoxin certificate PDF. */
  endotoxinUrl?: string;
}

const pdfLinkClass =
  "text-green underline decoration-hairline underline-offset-4 transition-colors hover:text-green-deep hover:decoration-green";

export function CoaLibraryTable({ rows }: { rows: CoaRow[] }) {
  return (
    <div className="ledger-card">
      {/* Category + endotoxin hide below md so the data that matters — purity
          + the purity certificate link — stays on-screen without horizontal
          scrolling (the wrapper still allows it as a fallback). */}
      <table className="ledger-table md:min-w-[720px]">
        <thead>
          <tr>
            <th scope="col">Compound</th>
            <th scope="col" className="hidden md:table-cell">
              Category
            </th>
            <th scope="col" className="num">
              Purity
            </th>
            <th scope="col" className="num">
              Certificate
            </th>
            <th scope="col" className="num hidden md:table-cell">
              Endotoxin
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slug}>
              <td>
                <Link
                  href={`/product/${row.slug}`}
                  className="font-display text-[15.5px] leading-snug font-semibold tracking-[-0.01em] text-ink transition-colors hover:text-green"
                >
                  {row.displayName}
                </Link>
              </td>
              <td className="hidden md:table-cell">
                <span className="micro-label">{row.categoryName}</span>
              </td>
              <td className="num">
                {row.purity ? (
                  <span className="text-green">{row.purity}</span>
                ) : (
                  <span aria-label="No published purity value" className="text-ink-muted">
                    —
                  </span>
                )}
              </td>
              <td className="num">
                {row.coaUrl ? (
                  <a
                    href={row.coaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={pdfLinkClass}
                  >
                    Purity (PDF)
                  </a>
                ) : (
                  <span className="text-[13px] text-ink-muted">
                    Pending publication
                  </span>
                )}
              </td>
              <td className="num hidden md:table-cell">
                {row.endotoxinUrl ? (
                  <a
                    href={row.endotoxinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={pdfLinkClass}
                  >
                    Endotoxin (PDF)
                  </a>
                ) : (
                  <span aria-label="No published endotoxin certificate" className="text-ink-muted">
                    —
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
