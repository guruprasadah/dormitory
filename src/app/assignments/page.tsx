import { Suspense } from "react";
import { getPendingAssignmentsAction } from "@/actions/assignments";
import { AssignmentList } from "@/components/AssignmentCard";
import { AssignmentFilters, type AssignmentFiltersState } from "@/components/AssignmentFilters";
import { ErrorBanner } from "@/components/ErrorBanner";
import { AssignmentListSkeleton } from "@/components/Skeletons";

export default function AssignmentsPage({ searchParams }: PageProps<"/assignments">) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pending assignments</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Everything unsubmitted across all your classes, earliest deadline first.
        </p>
      </div>

      <Suspense fallback={<AssignmentListSkeleton />}>
        <PendingContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PendingContent({ searchParams }: Pick<PageProps<"/assignments">, "searchParams">) {
  const params = await searchParams;
  const filters: AssignmentFiltersState = {
    includeOverdue: params.overdue !== "0",
    dueWithinDays: parseWithin(params.within),
  };

  const result = await getPendingAssignmentsAction({
    includeOverdue: filters.includeOverdue,
    dueWithinDays: filters.dueWithinDays ?? undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <AssignmentFilters state={filters} />

      {!result.ok ? (
        <ErrorBanner error={result.error} />
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            {result.data.assignments.length} pending
            {filters.dueWithinDays ? ` within ${filters.dueWithinDays} days` : ""}
            {!filters.includeOverdue ? " (overdue hidden)" : ""}
          </p>
          <AssignmentList assignments={result.data.assignments} />
          {result.data.failedClasses > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {result.data.failedClasses} class
              {result.data.failedClasses === 1 ? "'s" : "es'"} assignments couldn’t be loaded and
              are missing from this list.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function parseWithin(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
