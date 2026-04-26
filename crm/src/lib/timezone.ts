/**
 * Argentina timezone utilities.
 *
 * Argentina is always UTC-3 (no DST). All appointment times entered by users
 * are in ART. On Vercel (UTC runtime), we must explicitly handle the offset
 * when storing and displaying dates.
 */

const ART_TIMEZONE = "America/Argentina/Buenos_Aires";
const ART_OFFSET = "-03:00";

/**
 * Parses a datetime-local string (e.g. "2026-04-04T14:00") as Argentina time.
 *
 * The datetime-local input does not include timezone info. On a UTC server
 * (Vercel), `new Date("2026-04-04T14:00")` would be interpreted as 14:00 UTC
 * instead of 14:00 ART. This function appends the -03:00 offset so the Date
 * object correctly represents the intended ART moment.
 */
export function parseDateTimeAsART(datetimeLocal: string): Date {
  // datetime-local format: "YYYY-MM-DDTHH:MM" — no timezone
  // Append Argentina offset to make it unambiguous
  return new Date(`${datetimeLocal}:00${ART_OFFSET}`);
}

/**
 * Returns the start of today in Argentina time (00:00:00 ART).
 */
export function todayStartART(): Date {
  const now = new Date();
  const artStr = now.toLocaleDateString("en-CA", { timeZone: ART_TIMEZONE });
  // artStr is "YYYY-MM-DD" in Argentina timezone
  return new Date(`${artStr}T00:00:00${ART_OFFSET}`);
}

/**
 * Returns the end of today in Argentina time (23:59:59.999 ART).
 */
export function todayEndART(): Date {
  const now = new Date();
  const artStr = now.toLocaleDateString("en-CA", { timeZone: ART_TIMEZONE });
  return new Date(`${artStr}T23:59:59.999${ART_OFFSET}`);
}

/**
 * Converts a YYYY-MM-DD date string to start-of-day in ART.
 */
export function dateToStartART(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00${ART_OFFSET}`);
}

/**
 * Converts a YYYY-MM-DD date string to end-of-day in ART.
 */
export function dateToEndART(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999${ART_OFFSET}`);
}

/**
 * Formats a Date as a localized string in Argentina timezone.
 * Always uses ART regardless of the server/client runtime timezone.
 */
export function formatART(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("es-AR", { timeZone: ART_TIMEZONE, ...options });
}

/**
 * Formats a Date as a localized date string (no time) in Argentina timezone.
 */
export function formatDateART(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-AR", { timeZone: ART_TIMEZONE, ...options });
}

/**
 * Formats a Date as a localized time string (no date) in Argentina timezone.
 */
export function formatTimeART(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-AR", { timeZone: ART_TIMEZONE, ...options });
}

/**
 * Returns the number of minutes since ART midnight for a given Date.
 *
 * Use this when comparing a stored UTC Date against ART-local slot strings
 * (e.g. "09:30") — never compare `getUTCHours()` directly against ART
 * strings, that's silently 3h off.
 *
 * Returns a value in [0, 1440).
 */
export function dateToMinutesART(date: Date): number {
  // en-CA gives ISO-style "HH:MM" reliably across runtimes.
  const timeStr = date.toLocaleTimeString("en-CA", {
    timeZone: ART_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
