import { Suspense } from "react";
import Link from "next/link";
import { getAttendanceAction } from "@/actions/attendance";
import { getPendingAssignmentsAction } from "@/actions/assignments";
import { AttendanceRing } from "@/components/AttendanceRing";
import { AssignmentList } from "@/components/AssignmentCard";
import { ErrorBanner } from "@/components/ErrorBanner";
import { AssignmentListSkeleton, RingSkeleton } from "@/components/Skeletons";
import { formatDue } from "@/lib/format";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">Your current term at a glance.</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Attendance</h2>
          <Link href="/attendance" className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-400">
            Per-course detail →
          </Link>
        </div>
        <Suspense fallback={<RingSkeleton />}>
          <AttendanceOverview />
        </Suspense>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Due soon</h2>
          <Link href="/assignments" className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-400">
            All pending →
          </Link>
        </div>
        <Suspense fallback={<AssignmentListSkeleton />}>
          <UpcomingAssignments />
        </Suspense>
      </section>
    </div>
  );
}

async function AttendanceOverview() {
  const result = await getAttendanceAction();
  if (!result.ok) return <ErrorBanner error={result.error} />;

  const summary = result.data;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <AttendanceRing
        percentage={summary.percentage}
        label={summary.termName}
        sublabel={`${summary.present} present · ${summary.absent} absent of ${summary.total} classes`}
      />
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:text-right">
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Courses</dt>
          <dd className="font-medium tabular-nums">{summary.courses.length}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Approved leaves</dt>
          <dd className="font-medium tabular-nums">{summary.approvedLeaves}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Unapproved leaves</dt>
          <dd className="font-medium tabular-nums">{summary.unapprovedLeaves}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Below 75%</dt>
          <dd className="font-medium tabular-nums">
            {summary.courses.filter((c) => c.percentage < 75).length}
          </dd>
        </div>
      </dl>
    </div>
  );
}

async function UpcomingAssignments() {
  const result = await getPendingAssignmentsAction({ includeOverdue: true });
  if (!result.ok) return <ErrorBanner error={result.error} />;

  const all = result.data.assignments;
  const nearest = all.slice(0, 4);
  const first = all[0];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-500">
        {first
          ? `${all.length} pending · next one ${formatDue(first.daysUntilDue)}`
          : "You have no pending assignments."}
      </p>
      <AssignmentList assignments={nearest} />
    </div>
  );
}
