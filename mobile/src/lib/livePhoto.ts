/**
 * Helpers for proving a found-report photo was shot live.
 *
 * The picker returns EXIF on Android and iOS. A photo saved from the web has
 * either no EXIF at all or a capture time from long before the report, so we
 * forward these fields for the server to verify.
 */

const EXIF_KEYS = [
  "Make",
  "Model",
  "Software",
  "DateTime",
  "DateTimeOriginal",
  "DateTimeDigitized",
] as const;

export const LIVE_PHOTO_MAX_AGE_MINUTES = 30;

/** Subset of EXIF worth sending — the raw object can be very large. */
export function pickExifFields(
  exif?: Record<string, unknown> | null,
): Record<string, string> {
  if (!exif) return {};
  const picked: Record<string, string> = {};
  for (const key of EXIF_KEYS) {
    const value = exif[key];
    if (typeof value === "string" && value.trim()) picked[key] = value.trim();
  }
  return picked;
}

/** EXIF stamps look like "2026:07:25 21:14:03" (device-local, no zone). */
function parseExifDate(value?: string): Date | null {
  if (!value) return null;
  const match = value
    .trim()
    .match(/^(\d{4})[:-](\d{2})[:-](\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second ?? "0"),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function exifCaptureDate(exif: Record<string, string>): Date | null {
  return (
    parseExifDate(exif.DateTimeOriginal) ??
    parseExifDate(exif.DateTimeDigitized) ??
    parseExifDate(exif.DateTime)
  );
}

/**
 * Reason the photo fails the live check, or null when it passes.
 * Returns null when the platform gives us no EXIF — the server decides then.
 */
export function liveCaptureProblem(
  exif: Record<string, string>,
  maxAgeMinutes = LIVE_PHOTO_MAX_AGE_MINUTES,
): string | null {
  if (Object.keys(exif).length === 0) return null;

  if (!exif.Make && !exif.Model) {
    return "No camera details in this photo — downloaded images are not allowed. Take a fresh photo of the item.";
  }

  const captured = exifCaptureDate(exif);
  if (!captured) return null;

  const ageMinutes = (Date.now() - captured.getTime()) / 60000;
  if (ageMinutes > maxAgeMinutes) {
    return `This photo was taken on ${captured.toLocaleString()}, not just now. Found reports need a live photo of the item in front of you.`;
  }
  return null;
}

/** Device-local timestamp so the server can age EXIF in the same time zone. */
export function deviceTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
