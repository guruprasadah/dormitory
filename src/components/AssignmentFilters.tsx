"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface AssignmentFiltersState {
  includeOverdue: boolean;
  dueWithinDays: number | null;
}

const WINDOWS = [
  { label: "Any time", value: null },
  { label: "Next 7 days", value: 7 },
  { label: "Next 14 days", value: 14 },
  { label: "Next 30 days", value: 30 },
] as const;

/**
 * Filters for `/assignments`. State lives in the URL so the Server Action can
 * read it via `searchParams` on the server.
 */
export function AssignmentFilters({ state }: { state: AssignmentFiltersState }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function apply(next: AssignmentFiltersState) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("overdue", next.includeOverdue ? "1" : "0");
    if (next.dueWithinDays === null) params.delete("within");
    else params.set("within", String(next.dueWithinDays));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-zinc-500">Due within</span>
        <div className="flex overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
          {WINDOWS.map((window) => {
            const active = state.dueWithinDays === window.value;
            return (
              <button
                key={window.label}
                type="button"
                disabled={isPending}
                onClick={() => apply({ ...state, dueWithinDays: window.value })}
                aria-pressed={active}
                className={`px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {window.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={state.includeOverdue}
          disabled={isPending}
          onChange={(e) => apply({ ...state, includeOverdue: e.target.checked })}
          className="size-4 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-600"
        />
        Include overdue
      </label>
    </div>
  );
}
