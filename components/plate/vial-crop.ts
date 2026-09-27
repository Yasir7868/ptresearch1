/**
 * vial-crop — how far to zoom the WooCommerce vial photographs inside a plate.
 *
 * WHY THIS EXISTS
 * Every product shot on the live store is made to the same studio template: a
 * 1024x1536 (2:3) frame holding one vial, lit on a near-white sweep, with a
 * soft reflection under it. Measured across all 22 catalog images the framing
 * is strikingly consistent:
 *
 *     the bottle        x 30.7% .. 69.0%    y 24.8% .. 71.5%   (averages)
 *     its vertical centre           48.1%   (spread only +/-1.5% image to image)
 *     its reflection    fades out by ~84%
 *
 * Measuring those edges takes two different signals, because they do not look
 * alike: the crimped cap is light-on-light, so it is found by COUNTING pixels
 * that differ at all from the sweep (contrast misses it entirely and reports
 * the bottle starting several points too low), while the base is a dark glass
 * ring above a pale mirror, so it is found by CONTRAST (a pixel count cannot
 * tell a strong reflection from the bottle itself).
 *
 * So roughly three quarters of every frame is empty sweep. Dropped whole into
 * a SQUARE plate with `object-contain` (plus the old 28px pad) the vial came
 * out about a fifth of the card width — a postage stamp adrift in white, which
 * is exactly what the catalog looked like. Nothing was wrong with the
 * photographs; the plate was framing the backdrop instead of the specimen.
 *
 * THE FIX
 * Keep `object-contain` — never distort a specimen — and scale the image so a
 * measured CROP WINDOW rather than the whole frame fills the plate.

 * THE WINDOW IS CENTRED ON THE BOTTLE, NOT ON THE BOTTLE PLUS ITS REFLECTION.
 * That distinction is the whole of `centerY`. Counting the reflection drags the
 * window down, which lifts the bottle in the plate and leaves a dead band
 * beneath it — visibly top-heavy in a grid. Centring on the glass instead gives
 * equal air above the cap and below the base, and lets the faint tail of the
 * reflection run off the bottom edge, which reads as a surface continuing past
 * the frame rather than as a cropped object.
 *
 * Because the vials' own centres agree to within +/-1.5%, one global window
 * centres all 22 — no per-product crop manifest to drift out of date.
 *
 * DRIFT SAFETY
 * The zoom is opt-in per call site (`imageZoom` on SpecimenPlate) and used only
 * where these uniform studio shots are rendered. An off-template photograph is
 * never silently cropped — it simply renders unzoomed, exactly as before.
 */

/**
 * The window kept from each frame, as fractions of the frame.
 * `height` is what fills the plate; `centerY` is where that window sits.
 *
 * `centerY` is the measured centre of the bottle (48.1%), which is ABOVE the
 * frame's own centre — hence the small positive `offsetY`, nudging the image
 * down so the bottle lands in the middle of the plate.
 *
 * `height` 0.63 puts the average bottle at ~74% of the plate with ~13% air
 * above and below. Across the whole catalog the tightest case still keeps ~7%
 * clear at the top and ~10% at the bottom, so no cap or base ever touches an
 * edge. Tightening much further starts to crowd the taller 10ml vials.
 */
export const VIAL_CROP = {
  height: 0.63,
  centerY: 0.4812,
} as const;

/**
 * Plate field aspect ratio for a vial. Portrait suits a tall subject, and
 * because `object-contain` sizes the image by height, a taller field also
 * renders the vial WIDER — a square plate would show a smaller specimen.
 */
export const VIAL_FIELD_RATIO = "4 / 5";

/**
 * What `.plate-zoom` consumes.
 *
 * `scale` = 1 / crop height — the factor that makes the crop window exactly as
 * tall as the plate. `offsetY` = (0.5 - centerY) as a percentage of the image
 * box, which re-centres the window; it is independent of `scale` because the
 * CSS applies `translateY` before `scale`.
 */
export const VIAL_ZOOM = {
  scale: Number((1 / VIAL_CROP.height).toFixed(3)),
  offsetY: Number(((0.5 - VIAL_CROP.centerY) * 100).toFixed(2)),
} as const;

/**
 * `sizes` for a vial in a 3-up grid (2-up below 1024px, phones included).
 * Deliberately wider than the card: the zoom renders the image box larger
 * than the plate it is cropped to, and asking for the card width alone would
 * fetch a source that upscales.
 */
export const VIAL_GRID_SIZES = "(min-width: 1024px) 520px, 58vw";
