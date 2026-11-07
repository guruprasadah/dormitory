import { Suspense } from "react";
import { getAttendanceAction, getTermsAction } from "@/actions/attendance";
import type { AttendanceDto, TermDto } from "@/lib/dto";
import { AttendanceRing } from "@/components/AttendanceRing";
import { CourseCard } from "@/components/CourseCard";
import { ErrorBanner } from "@/components/ErrorBanner";
import { CourseGridSkeleton } from "@/components/Skeletons";
import { TermSwitcher } from "@/components/TermSwitcher";

export default function AttendancePage({ searchParams }: PageProps<"/attendance">) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Course totals with per-component breakdowns. Statuses MC / OD / DC don’t count toward the
          total.
        </p>
      </div>

      <Suspense fallback={<CourseGridSkeleton />}>
        <AttendanceContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AttendanceContent({ searchParams }: Pick<PageProps<"/attendance">, "searchParams">) {
  const params = await searchParams;
  const requested = parseTermId(params.term);

  const [termsResult, attendanceResult] = await Promise.all([
    getTermsAction(),
    getAttendanceAction(requested ?? undefined),
  ]);

  if (!attendanceResult.ok) return <ErrorBanner error={attendanceResult.error} />;

  const terms: TermDto[] = termsResult.ok ? termsResult.data : [];
  const summary: AttendanceDto = attendanceResult.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TermSwitcher terms={terms} selected={summary.termId} />
        {!termsResult.ok && (
          <p className="text-xs text-zinc-500">Term list unavailable; showing the current term.</p>
        )}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <AttendanceRing
          percentage={summary.percentage}
          label={summary.termName}
          sublabel={`${summary.present} present · ${summary.absent} absent of ${summary.total} classes`}
        />
      </section>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Courses ({summary.courses.length})
        </h2>
        {summary.courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No courses with attendance in this term.
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {summary.courses.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function parseTermId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
