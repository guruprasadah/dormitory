"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TermDto } from "@/lib/dto";

/**
 * Term selector for `/attendance`. Keeps the selected term in the URL so the
 * page re-renders on the server (where the Server Action runs) and the choice
 * survives reloads.
 */
export function TermSwitcher({
  terms,
  selected,
}: {
  terms: TermDto[];
  selected: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (terms.length <= 1) return null;

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const termId = Number(event.target.value);
    const next = new URLSearchParams(searchParams.toString());
    next.set("term", String(termId));
    startTransition(() => {
      router.push(`/attendance?${next.toString()}`);
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="sr-only">Term</span>
      <select
        value={selected}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {terms.map((term) => (
          <option key={term.id} value={term.id}>
            {term.name}
            {term.active ? " (active)" : ""}
          </option>
        ))}
      </select>
      {isPending && <span className="text-xs text-zinc-500">loading…</span>}
    </label>
  );
}
