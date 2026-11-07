import type { AssignmentDto } from "@/lib/dto";
import { formatDue, formatInstant, urgencyChip, urgencyOf } from "@/lib/format";

export function AssignmentCard({ assignment }: { assignment: AssignmentDto }) {
  const urgency = urgencyOf(assignment.daysUntilDue);

  return (
    <article className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
          {assignment.name}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${urgencyChip[urgency]}`}
        >
          {formatDue(assignment.daysUntilDue)}
        </span>
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-400">{assignment.classLabel}</p>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
        <span>{formatInstant(assignment.dueAt)}</span>
        {assignment.isRejected && (
          <span className="rounded bg-rose-100 px-1.5 py-0.5 font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            rejected — resubmit
          </span>
        )}
      </div>
    </article>
  );
}

export function AssignmentList({ assignments }: { assignments: AssignmentDto[] }) {
  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nothing pending 🎉</p>
        <p className="mt-1 text-xs text-zinc-500">Every assignment you can see is submitted or graded.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {assignments.map((assignment) => (
        <li key={`${assignment.classId}:${assignment.id}`}>
          <AssignmentCard assignment={assignment} />
        </li>
      ))}
    </ul>
  );
}
