import type { DigiiDate, DigiiDateTime } from "./types.js";

/**
 * Digiicampus timestamps are naive local strings in the college timezone,
 * e.g. `"2026-11-10 23:00:00"` — no `Z`, no offset. Parsing them with
 * `new Date(...)` in a non-IST process silently shifts them.
 *
 * This module converts them to real `Date` objects using an explicit offset.
 */

const NAIVE_DATETIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,6}))?$/;
const NAIVE_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Minutes east of UTC for a zone at a given instant (e.g. IST = 330). */
function offsetMinutes(zone: string, at: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = fmt.formatToParts(at).reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    return Math.round((asUtc - at.getTime()) / 60_000);
  } catch {
    return 330; // fall back to IST
  }
}

/**
 * Parse a naive Digiicampus datetime into a `Date`, interpreting it in `timeZone`
 * (default `Asia/Kolkata`). Already-Zoned strings (ending `Z` or `±HH:MM`) and
 * epoch numbers are handled too.
 *
 * Returns `null` for null/undefined/unparseable input.
 */
export function parseDigiiDate(
  value: DigiiDateTime | DigiiDate | number | null | undefined,
  timeZone = "Asia/Kolkata",
): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return new Date(value > 1e12 ? value : value * 1000);
  }
  const text = String(value).trim();
  if (!text) return null;

  // Already has a timezone designator.
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)) {
    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const m = NAIVE_DATETIME.exec(text);
  if (m) {
    const [, y, mo, d, h, mi, s = "0", frac = "0"] = m;
    const localAsUtc = Date.UTC(+y!, +mo! - 1, +d!, +h!, +mi!, +s, Math.round(Number(`0.${frac}`) * 1000));
    // Two-pass to handle DST edges correctly.
    let offset = offsetMinutes(timeZone, new Date(localAsUtc));
    offset = offsetMinutes(timeZone, new Date(localAsUtc - offset * 60_000));
    return new Date(localAsUtc - offset * 60_000);
  }

  const dm = NAIVE_DATE.exec(text);
  if (dm) {
    const [, y, mo, d] = dm;
    const localAsUtc = Date.UTC(+y!, +mo! - 1, +d!);
    const offset = offsetMinutes(timeZone, new Date(localAsUtc));
    return new Date(localAsUtc - offset * 60_000);
  }

  const fallback = new Date(text);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** Format a `Date` as a naive Digiicampus datetime in `timeZone`. */
export function formatDigiiDate(date: Date | number, timeZone = "Asia/Kolkata"): DigiiDateTime {
  const d = typeof date === "number" ? new Date(date) : date;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = fmt.formatToParts(d).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

/** True when a due date is in the past relative to `now` (default: actual now). */
export function isPast(value: DigiiDateTime | null | undefined, now: Date = new Date(), timeZone = "Asia/Kolkata"): boolean {
  const d = parseDigiiDate(value, timeZone);
  return d !== null && d.getTime() < now.getTime();
}

/** Whole days until `value` (negative when overdue). `null` when no date. */
export function daysUntil(value: DigiiDateTime | null | undefined, now: Date = new Date(), timeZone = "Asia/Kolkata"): number | null {
  const d = parseDigiiDate(value, timeZone);
  if (d === null) return null;
  return (d.getTime() - now.getTime()) / 86_400_000;
}
