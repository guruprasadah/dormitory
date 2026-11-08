import type { Term } from "fijii";
import { DEMO_COURSES, DEMO_LEAVES, DEMO_PAST_TERMS, DEMO_TERM, type DemoComponent } from "./data";

/**
 * Turns the hand-written fixtures in `data.ts` into the values the app
 * consumes. Everything derives from a single `now`, so:
 *
 * - the same request sees consistent dates;
 * - screenshots taken on any day of the year look current;
 * - re-capturing later doesn't reshuffle the pages.
 */

/** The demo college runs on India Standard Time, like the portal does. */
export const DEMO_TIME_ZONE = "Asia/Kolkata";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const IST_OFFSET = 330 * 60_000;

/** "Now", rounded down to the hour — stable data, correct relative labels. */
export function demoNow(): Date {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now;
}

/** The wall-clock fields of an instant in IST, read back with the UTC getters. */
function toIst(date: Date): Date {
  return new Date(date.getTime() + IST_OFFSET);
}

/** The inverse of `toIst`: a wall-clock time meant as IST, as a real instant. */
function fromIst(wall: Date): Date {
  return new Date(wall.getTime() - IST_OFFSET);
}

/**
 * Naive portal timestamp — `YYYY-MM-DD HH:mm:ss` on the IST wall clock. The
 * portal never sends a zone, so neither do we.
 */
export function digiiAt(date: Date): string {
  const local = toIst(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())} ` +
    `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`
  );
}

function digiiDay(now: Date, daysAgo: number): string {
  return digiiAt(new Date(now.getTime() - daysAgo * DAY)).slice(0, 10);
}

/** Midnight (IST) of the Monday on or before `now`. */
function startOfWeek(now: Date): Date {
  const local = toIst(now);
  const monday = (local.getUTCDay() + 6) % 7;
  return fromIst(new Date(local.getTime() - monday * DAY));
}

// ------------------------------------------------------------------------- //
// Terms
// ------------------------------------------------------------------------- //

export function demoTerm(now: Date): Term {
  return {
    id: DEMO_TERM.id,
    name: DEMO_TERM.name,
    starts: digiiDay(now, DEMO_TERM.startsDaysAgo),
    ends: digiiDay(now, -DEMO_TERM.endsInDays),
    classesTill: digiiDay(now, -(DEMO_TERM.endsInDays - 2)),
    sequence: 5,
    academicYearStart: 2026,
    academicYearEnd: 2027,
    allProgrammes: false,
    programmes: null,
    nextTermName: null,
    nextTermId: null,
    previousTermName: DEMO_PAST_TERMS[0].name,
    previousTermId: DEMO_PAST_TERMS[0].id,
    collegeId: 0,
    active: true,
    past: false,
    future: false,
  };
}

/** Current term first, then past terms newest first. */
export function demoTerms(now: Date): Term[] {
  const current = demoTerm(now);
  const past = DEMO_PAST_TERMS.map((term, index): Term => {
    const next = index === 0 ? current : DEMO_PAST_TERMS[index - 1]!;
    const previous = DEMO_PAST_TERMS[index + 1];
    return {
      ...current,
      id: term.id,
      name: term.name,
      starts: digiiDay(now, term.startsDaysAgo),
      ends: digiiDay(now, term.endsDaysAgo),
      classesTill: null,
      sequence: term.id,
      active: false,
      past: true,
      future: false,
      nextTermName: next.name,
      nextTermId: next.id,
      previousTermName: previous?.name ?? null,
      previousTermId: previous?.id ?? null,
    };
  });
  return [current, ...past];
}

// ------------------------------------------------------------------------- //
// Lessons
// ------------------------------------------------------------------------- //

export interface DemoLesson {
  start: string;
  end: string;
  status: "PRESENT" | "ABSENT" | "MEDICAL" | null;
}

const STATUS: Record<string, DemoLesson["status"]> = {
  P: "PRESENT",
  A: "ABSENT",
  M: "MEDICAL",
};

/** Weekly slot for a class: a weekday (Mon–Fri) and a start hour. */
export function demoSlot(component: DemoComponent): { weekday: number; hour: number } {
  return {
    weekday: component.classId % 5,
    hour: 9 + (component.classId % 4) * 2, // 09:00, 11:00, 13:00, 15:00
  };
}

/**
 * One session per week on the class's fixed slot, walking the term oldest →
 * newest. `history` supplies each session's status in that order; a `null`
 * there means the session was never marked.
 *
 * Past terms truncate to the oldest classes of the term, which keeps the term
 * switcher meaningful without a second fixture.
 */
export function demoLessons(
  now: Date,
  component: DemoComponent,
  pastTerm = false,
): DemoLesson[] {
  const history = pastTerm ? component.history.slice(0, Math.max(4, component.history.length - 5)) : component.history;
  const { weekday, hour } = demoSlot(component);
  const monday = startOfWeek(now);
  const weeks = history.length;

  return history.map((mark, index) => {
    const weeksAgo = weeks - 1 - index;
    const wall = toIst(new Date(monday.getTime() - weeksAgo * 7 * DAY));
    wall.setUTCDate(wall.getUTCDate() + weekday);
    wall.setUTCHours(hour, 0, 0, 0);
    const start = fromIst(wall);
    return {
      start: digiiAt(start),
      end: digiiAt(new Date(start.getTime() + HOUR)),
      status: mark === null ? null : STATUS[mark] ?? null,
    };
  });
}

export { DEMO_COURSES, DEMO_LEAVES };
