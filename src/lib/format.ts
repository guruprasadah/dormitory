import type { AttendanceBand } from "./dto";

/** Relative due date from fractional `daysUntilDue`, e.g. "due in 3.4 days". */
export function formatDue(daysUntilDue: number | null): string {
  if (daysUntilDue === null || !Number.isFinite(daysUntilDue)) return "No due date";
  const value = Math.round(daysUntilDue * 10) / 10;
  if (value < 0) {
    const overdue = Math.abs(value);
    return overdue === 1 ? "overdue by 1 day" : `overdue by ${overdue} days`;
  }
  if (value < 1 / 24) return "due within the hour";
  if (value === 1) return "due in 1 day";
  return `due in ${value} days`;
}

export type Urgency = "overdue" | "soon" | "upcoming" | "later";

export function urgencyOf(daysUntilDue: number | null): Urgency {
  if (daysUntilDue === null) return "later";
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue < 2) return "soon";
  if (daysUntilDue <= 7) return "upcoming";
  return "later";
}

/** Absolute date in the portal's timezone (naive timestamps are IST). */
export function formatInstant(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "2026-11-05 09:00:00" (naive, portal-local) → "5 Nov 2026". */
export function formatLessonDay(naive: string): string {
  const day = naive.slice(0, 10);
  const parsed = new Date(`${day}T00:00:00+05:30`);
  if (Number.isNaN(parsed.getTime())) return naive;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

/** "2026-11-05 09:00:00" → "09:00". */
export function formatLessonTime(naive: string): string {
  return naive.slice(11, 16);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

export const bandText: Record<AttendanceBand, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  watch: "text-amber-600 dark:text-amber-400",
  risk: "text-rose-600 dark:text-rose-400",
};

export const bandBar: Record<AttendanceBand, string> = {
  good: "bg-emerald-500",
  watch: "bg-amber-500",
  risk: "bg-rose-500",
};

export const bandStroke: Record<AttendanceBand, string> = {
  good: "stroke-emerald-500",
  watch: "stroke-amber-500",
  risk: "stroke-rose-500",
};

export const urgencyChip: Record<Urgency, string> = {
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  soon: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  upcoming: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  later: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};
