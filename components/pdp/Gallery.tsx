"use client";

/**
 * Gallery — the PDP's left column: the product photo as a SPECIMEN PLATE
 * (DESIGN §8 "Left — the specimen plate"): the soft specimen card — 16px
 * radius, lightest hairline, layered soft shadow (crop marks retired in the
 * 2026-07 softening pass).
 *
 * DUOTONE DECISION (visual-polish pass, per DESIGN §8 "Left — the specimen
 * plate: duotone vial, crop-mark frame"): the MAIN plate IS duotoned — the
 * PDP is the system's feature plate and a raw-color photo here is the one
 * place the collection visibly breaks. Legibility (risk #3) is handled by the
 * ramp, which is monotonic in luminance — powder/fill/label detail survives.
 * The thumb strip below stays TRUE COLOR: it is a functional selector and
 * doubles as the buyer's unretouched reference of the actual product photo.
 *
 * Client leaf only because thumb selection needs state; the SpecimenPlate
 * itself stays a plain component.
 */

import { useState } from "react";
import Image from "next/image";
import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  src: string;
  alt: string;
}

export function Gallery({
  images,
  sku,
  name,
}: {
  images: GalleryImage[];
  sku: string;
  name: string;
}) {
  const [index, setIndex] = useState(0);
  const active = images[index] ?? images[0];

  // Zero images: a quiet framed placeholder plate — same plate language.
  if (!active) {
    return (
      <SpecimenPlate
        interactive={false}
        cropColor="amber"
        field={
          <div className="flex flex-col items-center gap-2">
            <span className="micro-label">{sku || name}</span>
            <span className="text-sm text-ink-muted">Image pending</span>
          </div>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main plate — duotoned specimen (see header comment). */}
      <SpecimenPlate
        image={{ src: active.src, alt: active.alt }}
        imageSizes="(min-width: 1024px) 42vw, 100vw"
        imagePriority={index === 0}
        cropColor="amber"
        interactive={false}
      />

      {/* Thumb strip — only when there is a choice to make. Functional
          selectors, true color (not a decorative duotone context). */}
      {images.length > 1 && (
        <div
          role="group"
          aria-label="Product image thumbnails"
          className="flex flex-wrap gap-2"
        >
          {images.map((img, i) => (
            <button
              key={`${img.src}-${i}`}
              type="button"
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "relative size-16 overflow-hidden rounded-lg border bg-surface transition-colors",
                i === index
                  ? "border-green"
                  : "border-hairline hover:border-ink-muted"
              )}
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="64px"
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
