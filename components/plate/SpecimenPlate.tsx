/**
 * SpecimenPlate — THE system component of D3 "Reference Grade" (DESIGN §4).
 *
 * SOFTENED (2026-07 owner pass): the plate is now a SOFT SPECIMEN CARD — a
 * 16px-radius surface card with the lightest hairline and a layered soft
 * shadow, a 12px-radius inset image field, then a hairline rule and the
 * typeset record (semibold Satoshi name + Satoshi tabular data line). The
 * crop-mark corner ticks are RETIRED — elevation frames the specimen now.
 * ONE component still covers every use: product card, category tile,
 * certificate card, and hero figure.
 *
 * Server-safe by design — NO "use client". The hover behaviour (gentle shadow
 * deepen + 2px lift, duotone develop) is pure CSS driven by
 * `.plate-interactive` (see globals.css), and it collapses to shadow-only
 * under prefers-reduced-motion. That lets catalog grids stay server-rendered.
 *
 * Flexible field content:
 *   - `image` → a duotoned next/image (the catalog vials).
 *   - `field` → arbitrary node that REPLACES the image (e.g. the trophy purity
 *     numeral for the COA "wall of certificates", or a category glyph).
 *   - `imageZoom` → frames the SPECIMEN rather than the backdrop, for the
 *     uniformly-shot vial photographs (components/plate/vial-crop.ts).
 *   - `badge` → a corner marker in the field opposite the verified mark.
 *
 * Everything below the field (`eyebrow`, `title`, `record`, `footer`) is
 * optional; omit them for a bare framed figure (hero).
 *
 * `actions` adds real controls (an add-to-cart button) to a plate that is also
 * a link. A button nested inside an anchor is invalid HTML and untappable, so
 * supplying `actions` with `href` switches the plate from "link wrapping
 * everything" to a STRETCHED LINK: the anchor becomes an overlay covering the
 * card, and the actions sit above it. The whole card stays one click target,
 * the button stays its own control, and both keep their own focus ring.
 */
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VerifiedMark } from "@/components/plate/VerifiedMark";

export type CropColor = "ink" | "amber";

/**
 * RETIRED (2026-07 softening pass) — the crop-mark registration ticks are no
 * longer part of the plate language; the export is kept only so legacy call
 * sites compile. Do not add new usages.
 */
export function CropMarks({ color = "ink" }: { color?: CropColor }) {
  return (
    <div
      aria-hidden="true"
      className={color === "amber" ? "crop-amber" : "crop-ink"}
    >
      <span className="crop crop-tl" />
      <span className="crop crop-tr" />
      <span className="crop crop-bl" />
      <span className="crop crop-br" />
    </div>
  );
}

export interface SpecimenPlateImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface SpecimenPlateProps {
  /** Duotoned product photo. Ignored if `field` is provided. */
  image?: SpecimenPlateImage;
  /** next/image `sizes`. Default assumes a ~3-up grid. */
  imageSizes?: string;
  /** LCP hint for a hero/above-the-fold plate. */
  imagePriority?: boolean;
  /** How the image sits in the square field. Default "contain" (whole vial). */
  imageFit?: "contain" | "cover";
  /** Extra classes on the <Image> itself (e.g. `object-right` to bias a cover crop). */
  imageClassName?: string;
  /** Apply the #pt-duotone treatment to the image. Default true. */
  duotone?: boolean;
  /**
   * Zoom the image to a measured crop window instead of showing the whole
   * frame — for the uniform studio vial shots. Pass VIAL_ZOOM
   * (components/plate/vial-crop.ts); omit for any off-template photo.
   */
  imageZoom?: { scale: number; offsetY: number };
  /** Replaces the image entirely (trophy numeral, glyph, custom figure). */
  field?: ReactNode;
  /** CSS aspect-ratio for the field. Default "1 / 1" (square). */
  fieldRatio?: string;
  /** Extra classes on the field element. */
  fieldClassName?: string;

  /** Micro-label above the title (e.g. category). */
  eyebrow?: ReactNode;
  /** The record heading — compound / category / certificate name (Satoshi semibold). */
  title?: ReactNode;
  /** Data line under the title — e.g. `10mg · 99.28% · Healing`. */
  record?: ReactNode;
  /** Optional extra row (price, CTA, batch id). */
  footer?: ReactNode;

  /** Earned verified mark — pass true ONLY where a real COA exists. */
  verified?: boolean;
  /** Corner marker in the field (e.g. a sale pill), opposite the verified mark. */
  badge?: ReactNode;
  /**
   * Controls rendered under the record, OUTSIDE the card link. Supplying this
   * with `href` switches the plate to a stretched-link layout (see above).
   */
  actions?: ReactNode;

  /** RETIRED (softening pass) — accepted for compatibility, no longer drawn. */
  cropColor?: CropColor;
  /** Enable the hover lift / crop-extend / duotone-develop. Default true. */
  interactive?: boolean;
  /** Wrap the whole plate in a link. */
  href?: string;
  /**
   * Accessible label when the plate is a link and the title is decorative.
   * REQUIRED alongside `actions`: in that layout the anchor is an empty
   * overlay, so this is the only thing naming it.
   */
  ariaLabel?: string;
  className?: string;
}

export function SpecimenPlate({
  image,
  imageSizes = "(min-width: 1024px) 380px, (min-width: 768px) 45vw, 90vw",
  imagePriority = false,
  imageFit = "contain",
  imageClassName,
  duotone = true,
  imageZoom,
  field,
  fieldRatio = "1 / 1",
  fieldClassName,
  eyebrow,
  title,
  record,
  footer,
  verified = false,
  badge,
  actions,
  interactive = true,
  href,
  ariaLabel,
  className,
}: SpecimenPlateProps) {
  const hasRecord = Boolean(eyebrow || title || record || footer);

  // Product shots come from WooCommerce and take the duotone treatment
  // (DESIGN §5). Callers that supply a photograph whose roundel the treatment
  // would smudge — the About lab scene — pass duotone={false}.
  const applyDuotone = duotone;

  const inner = (
    <>
      <div
        className={cn("plate-field", fieldClassName)}
        style={{ aspectRatio: fieldRatio }}
      >
        {/* The image/figure sits INSET (4px) with a 12px radius — a soft
            matte inside the 16px card. overflow-hidden lives here WITH the
            radius so cover images can never pierce the rounded corners. */}
        <div className="absolute inset-1 flex items-center justify-center overflow-hidden rounded-[12px]">
          {field ? (
            field
          ) : image ? (
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width ?? 640}
              height={image.height ?? 640}
              sizes={imageSizes}
              priority={imagePriority}
              /* The zoom supplies its own breathing room via the crop window,
                 so it replaces the contain pad rather than fighting it. */
              style={
                imageZoom
                  ? ({
                      "--plate-zoom": imageZoom.scale,
                      "--plate-zoom-y": `${imageZoom.offsetY}%`,
                    } as CSSProperties)
                  : undefined
              }
              className={cn(
                "h-full w-full",
                imageFit === "cover"
                  ? "object-cover"
                  : cn("object-contain", !imageZoom && "p-7"),
                imageZoom && "plate-zoom",
                applyDuotone && "duotone",
                imageClassName
              )}
            />
          ) : null}
        </div>

        {badge && <div className="absolute top-2.5 left-2.5">{badge}</div>}

        {verified && (
          <div className="absolute top-2.5 right-2.5 rounded-full border border-hairline/70 bg-surface/90 px-2 py-0.5">
            <VerifiedMark />
          </div>
        )}
      </div>

      {hasRecord && (
        <div className="mt-4">
          <div className="hairline-rule" />
          <div className="pt-3">
            {eyebrow && <div className="micro-label mb-1.5">{eyebrow}</div>}
            {title && (
              <div className="font-display text-[1.35rem] leading-tight font-semibold tracking-[-0.015em] text-ink">
                {title}
              </div>
            )}
            {record && (
              <div className="data-num mt-1.5 text-[13px] text-ink-muted">
                {record}
              </div>
            )}
            {footer && <div className="mt-3">{footer}</div>}
          </div>
        </div>
      )}

      {/* Above the stretched link so the control stays clickable. mt-auto
          pins it to the bottom of a flex-column plate, so buy controls line up
          across a grid row whose titles wrap to different heights. */}
      {actions && <div className="relative z-[2] mt-auto pt-4">{actions}</div>}
    </>
  );

  const cls = cn("plate", interactive && "plate-interactive", className);

  // Stretched link: the card carries its own controls, so the anchor cannot
  // wrap them. It becomes an overlay instead — same full-card click target,
  // but `actions` stays a real, focusable, tappable control above it.
  if (href && actions) {
    return (
      <article className={cn(cls, "rounded-xl")}>
        {/* Empty by design — `ariaLabel` is its entire accessible name. */}
        <Link
          href={href}
          aria-label={ariaLabel}
          className="absolute inset-0 z-[1] rounded-xl"
        />
        {inner}
      </article>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={cn(
          cls,
          // Rounded so the global green focus-visible outline (base layer)
          // hugs the soft card — a11y: the ring must stay clearly visible now
          // that card borders are whisper-light.
          "block rounded-xl"
        )}
      >
        {inner}
      </Link>
    );
  }

  return <article className={cls}>{inner}</article>;
}
