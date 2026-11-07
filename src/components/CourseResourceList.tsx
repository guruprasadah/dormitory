"use client";

import { useState } from "react";
import type { ComponentResourcesDto, CourseResourcesDto, ResourceItemDto } from "@/lib/dto";
import { formatBytes } from "@/lib/format";
import { OpenIcon, ResourceIcon } from "./ResourceIcon";

type SortDirection = "newest" | "oldest";

/**
 * Order by `createdAt`. Items the server couldn't date always sort last,
 * whichever direction is active, so they never jump to the top.
 */
function sortByCreated(items: ResourceItemDto[], direction: SortDirection): ResourceItemDto[] {
  const sign = direction === "newest" ? -1 : 1;
  return [...items].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      const diff = sign * (Date.parse(a.createdAt) - Date.parse(b.createdAt));
      if (diff !== 0) return diff;
    } else if (a.createdAt) {
      return -1;
    } else if (b.createdAt) {
      return 1;
    }
    return a.name.localeCompare(b.name) || a.id - b.id;
  });
}

export function CourseResourceList({ courses }: { courses: CourseResourcesDto[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {courses.map((course) => (
        <li key={course.courseId}>
          <CourseResourcesRow course={course} />
        </li>
      ))}
    </ul>
  );
}

function CourseResourcesRow({ course }: { course: CourseResourcesDto }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
      >
        <ChevronIcon open={open} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {course.courseName}
          </span>
          {course.courseCode && (
            <span className="mt-0.5 block truncate font-mono text-xs text-zinc-500">
              {course.courseCode}
            </span>
          )}
        </span>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {course.resourceCount} {course.resourceCount === 1 ? "resource" : "resources"}
        </span>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-4 pb-4 sm:px-5 dark:border-zinc-800">
          {course.components.map((component) => (
            <ResourceComponentSection key={component.classId} component={component} />
          ))}
        </div>
      )}
    </article>
  );
}

function ResourceComponentSection({ component }: { component: ComponentResourcesDto }) {
  const [direction, setDirection] = useState<SortDirection>("newest");

  const items = sortByCreated(component.items, direction);

  return (
    <section className="pt-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {component.componentType || "Class"}
          {component.className && (
            <span className="ml-2 font-normal normal-case tracking-normal text-zinc-400">
              {component.className}
            </span>
          )}
        </h4>
        <button
          type="button"
          onClick={() => setDirection((d) => (d === "newest" ? "oldest" : "newest"))}
          aria-label={
            direction === "newest" ? "Sort resources oldest first" : "Sort resources newest first"
          }
          title={
            direction === "newest" ? "Newest first — click for oldest first" : "Oldest first — click for newest first"
          }
          className="grid size-7 shrink-0 place-items-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <SortIcon direction={direction} />
        </button>
      </div>

      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={`${component.classId}:${item.id}`}>
            <ResourceRow item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResourceRow({ item }: { item: ResourceItemDto }) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
    >
      <ResourceIcon kind={item.kind} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-zinc-800 group-hover:text-zinc-950 dark:text-zinc-200 dark:group-hover:text-zinc-50">
          {item.name}
        </span>
        {(item.meta || item.size !== null) && (
          <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
            {[item.meta, item.size !== null ? formatBytes(item.size) : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
      </span>
      <OpenIcon />
    </a>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`size-4 shrink-0 stroke-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      aria-hidden
    >
      <path d="M7 5l6 5-6 5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Down arrow = newest first, up arrow = oldest first. */
function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`size-4 stroke-current transition-transform ${direction === "oldest" ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M10 4v11M6 11l4 4 4-4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
