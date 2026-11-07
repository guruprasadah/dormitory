"use client";

import { useState } from "react";
import type { ComponentDto, CourseDto } from "@/lib/dto";
import { formatLessonDay, formatLessonTime, formatPercent } from "@/lib/format";
import { AttendanceBar } from "./AttendanceRing";

export function CourseCard({ course }: { course: CourseDto }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {course.courseName}
          </h3>
          {course.courseCode && (
            <p className="mt-0.5 font-mono text-xs text-zinc-500">{course.courseCode}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatPercent(course.percentage)}
          </p>
          <p className="text-xs text-zinc-500">
            {course.present}/{course.total} attended
          </p>
        </div>
      </header>

      <AttendanceBar percentage={course.percentage} />

      <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {course.components.map((component) => (
          <ComponentRow key={component.classId} component={component} />
        ))}
      </div>
    </article>
  );
}

function ComponentRow({ component }: { component: ComponentDto }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ChevronIcon open={open} />
          <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {component.componentType || "Class"}
          </span>
          {component.className && (
            <span className="hidden truncate text-xs text-zinc-500 sm:inline">
              {component.className}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {component.unmarkedLessons > 0 && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {component.unmarkedLessons} unmarked
            </span>
          )}
          <span className="text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
            {component.present}/{component.total}
          </span>
          <span className="w-16 text-right text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatPercent(component.percentage)}
          </span>
        </span>
      </button>

      <div className="mt-2 pl-6">
        <AttendanceBar percentage={component.percentage} />
      </div>

      {open && (
        <ul className="mt-3 flex flex-col gap-1 pl-6">
          {component.lessons.length === 0 && (
            <li className="text-xs text-zinc-500">No lessons recorded yet.</li>
          )}
          {component.lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-xs odd:bg-zinc-50 dark:odd:bg-zinc-800/50"
            >
              <span className="text-zinc-600 dark:text-zinc-400">
                {formatLessonDay(lesson.start)} · {formatLessonTime(lesson.start)}–
                {formatLessonTime(lesson.end)}
              </span>
              <LessonStatus lesson={lesson} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LessonStatus({ lesson }: { lesson: ComponentDto["lessons"][number] }) {
  const dot = lesson.colorCode ?? "#a1a1aa";
  const text = lesson.abbreviation || lesson.status;
  return (
    <span className="flex shrink-0 items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
      <span
        className="inline-block size-2 rounded-full"
        style={{ backgroundColor: text ? dot : "transparent", borderColor: dot }}
      />
      {text ?? "not marked"}
    </span>
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
