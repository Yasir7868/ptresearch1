"use client";

/**
 * CoaLibraryView — the heart of the Lab Results library (D3 §9 + judge-panel
 * grafts #1/#2/#9): the certificate WALL of specimen plates with a table-view
 * toggle.
 *
 *   - Wall mode: one SpecimenPlate per published certificate. Where a real
 *     page-1 thumbnail of the certificate PDF exists (content/coa-thumbs.json)
 *     the plate field shows the duotoned document; otherwise the field is a
 *     typeset record card — the trophy purity numeral on surface. Every plate
 *     carries the earned VerifiedMark (real coaUrl only), the verbatim method
 *     line, the batch id parsed from the certificate filename, and the
 *     Purity / Endotoxin PDF buttons. Below the wall, the honest "Pending
 *     publication" index lists every compound without a published certificate.
 *   - Table mode (graft #9): the full-catalog ledger — compound / category /
 *     purity / certificate links — via CoaLibraryTable.
 *
 * All purity figures, URLs, and batch ids are REAL data from coa-map.json.
 * Links point at exactly what the live store publishes — known mislabels live
 * in `_meta.data_quality_flags` for client intake and are never "corrected"
 * here (graft #11). No certificate → no number.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";
import {
  CoaLibraryTable,
  type CoaRow,
} from "@/components/static/CoaLibraryTable";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Row shapes (serializable — assembled server-side in app/coa/page.tsx)
// ---------------------------------------------------------------------------

export interface CertCard {
  slug: string;
  displayName: string;
  categoryName: string;
  /** Real measured purity from the certificate, e.g. "99.28%". */
  purity: string;
  coaUrl: string;
  endotoxinUrl?: string;
  /** Batch id parsed from the certificate filename, e.g. "PTR-3664990". */
  batchId?: string;
  /** Local page-1 thumbnail of the purity certificate, when rendered. */
  thumbSrc?: string;
}

export interface PendingRow {
  slug: string;
  displayName: string;
  categoryName: string;
}

// ---------------------------------------------------------------------------
// Bits
// ---------------------------------------------------------------------------

/** "99.28%" → { value: "99.28", unit: "%" } for the trophy-pct treatment. */
function purityParts(purity: string): { value: string; unit: string } {
  const m = purity.match(/^([\d.]+)(.*)$/);
  return m
    ? { value: m[1], unit: m[2] || "%" }
    : { value: purity, unit: "" };
}

/** The verbatim method line that sits beside every purity figure (DESIGN §9). */
const METHOD_LINE = "HPLC + Mass Spectrometry";

function TrophyPurity({
  purity,
  className,
}: {
  purity: string;
  className?: string;
}) {
  const { value, unit } = purityParts(purity);
  return (
    <span className={cn("trophy-num", className)}>
      {value}
      {unit ? <span className="trophy-pct">{unit}</span> : null}
    </span>
  );
}

function CertPlate({ cert }: { cert: CertCard }) {
  const field = cert.thumbSrc ? (
    // Real page 1 of the purity certificate (graft #1), duotoned into the
    // green/bone ramp so every document reads as one printed collection.
    <Image
      src={cert.thumbSrc}
      alt={`First page of the ${cert.displayName} purity certificate`}
      width={640}
      height={905}
      sizes="(min-width: 1024px) 370px, (min-width: 640px) 46vw, 92vw"
      className="duotone h-full w-full object-cover object-top"
    />
  ) : (
    // No rendered thumbnail — the typeset record card: the trophy purity
    // numeral IS the figure (DESIGN §4). The certificate itself is one click
    // below.
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
      <TrophyPurity
        purity={cert.purity}
        className="text-[clamp(3rem,8vw,4.25rem)]"
      />
      <span className="micro-label">Measured purity</span>
    </div>
  );

  return (
    <SpecimenPlate
      verified
      fieldRatio="1 / 1.25"
      field={field}
      eyebrow={cert.categoryName}
      title={
        <Link
          href={`/product/${cert.slug}`}
          className="transition-colors hover:text-green"
        >
          {cert.displayName}
        </Link>
      }
      record={
        <div>
          {cert.thumbSrc ? (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <TrophyPurity purity={cert.purity} className="text-[2.4rem]" />
              <span>{METHOD_LINE}</span>
            </div>
          ) : (
            <span>{METHOD_LINE}</span>
          )}
          {cert.batchId ? (
            <p className="batch-id mt-2 text-ink-muted">
              Batch
              <span aria-hidden="true" className="batch-tick">
                ·
              </span>
              {cert.batchId}
            </p>
          ) : null}
        </div>
      }
      footer={
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <a
              href={cert.coaUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Purity Certificate (PDF)
            </a>
          </Button>
          {cert.endotoxinUrl ? (
            <Button asChild size="sm" variant="outline">
              <a
                href={cert.endotoxinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Endotoxin Certificate (PDF)
              </a>
            </Button>
          ) : null}
        </div>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// The view (wall ⇄ table)
// ---------------------------------------------------------------------------

type ViewMode = "wall" | "table";

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "border-b-2 pb-1 text-[13px] font-medium tracking-[0.01em] transition-colors",
        active
          ? "border-green text-green"
          : "border-transparent text-ink-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

export function CoaLibraryView({
  certs,
  pending,
  tableRows,
}: {
  certs: CertCard[];
  pending: PendingRow[];
  tableRows: CoaRow[];
}) {
  const [view, setView] = useState<ViewMode>("wall");

  return (
    <div>
      {/* Section head + the view toggle (graft #9) */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <p className="micro-label">Verified batches</p>
          <h2 className="mt-3 text-[clamp(1.9rem,3.4vw,3rem)]">
            Every published certificate
          </h2>
        </div>
        <div
          role="group"
          aria-label="Library view"
          className="flex items-baseline gap-6"
        >
          <ToggleButton active={view === "wall"} onClick={() => setView("wall")}>
            Certificate wall
          </ToggleButton>
          <ToggleButton
            active={view === "table"}
            onClick={() => setView("table")}
          >
            Table view
          </ToggleButton>
        </div>
      </div>

      {view === "wall" ? (
        <>
          {/* The wall of certificates */}
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {certs.map((cert) => (
              <FadeIn key={cert.slug}>
                <CertPlate cert={cert} />
              </FadeIn>
            ))}
          </div>

          {/* Pending publication — honesty as a feature (DESIGN §9.3) */}
          <div className="mt-24">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <p className="micro-label">Pending publication</p>
              <span className="data-num text-[13px] text-ink-muted">
                {pending.length} compounds
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
              The compounds below do not have a certificate published on the
              store yet. No purity number is shown until a certificate is.
            </p>
            <ul className="hairline-t mt-6">
              {pending.map((row) => (
                <li key={row.slug} className="hairline-b">
                  <Link
                    href={`/product/${row.slug}`}
                    className="group flex items-baseline gap-4 py-3.5"
                  >
                    <span className="font-display text-[17px] leading-snug font-semibold tracking-[-0.01em] text-ink transition-colors group-hover:text-green">
                      {row.displayName}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mb-[5px] min-w-6 flex-1 border-b border-dotted border-hairline transition-colors group-hover:border-ink-muted"
                    />
                    <span className="micro-label hidden sm:inline">
                      {row.categoryName}
                    </span>
                    <span className="data-num shrink-0 text-[13px] text-ink-muted">
                      Certificate pending
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="mt-12">
          <CoaLibraryTable rows={tableRows} />
          <p className="mt-4 max-w-3xl text-[13px] leading-relaxed text-ink-muted">
            The full catalog, one row per compound. Certificates are
            batch-specific — the batch number is printed on each certificate.
          </p>
        </div>
      )}
    </div>
  );
}
