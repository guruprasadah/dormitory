import { Suspense } from "react";
import { getResourcesAction } from "@/actions/resources";
import { CourseResourceList } from "@/components/CourseResourceList";
import { ErrorBanner } from "@/components/ErrorBanner";
import { CourseGridSkeleton } from "@/components/Skeletons";

export default function ResourcesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resources</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Files and links shared in your courses. Expand a course to see them.
        </p>
      </div>

      <Suspense fallback={<CourseGridSkeleton />}>
        <ResourcesContent />
      </Suspense>
    </div>
  );
}

async function ResourcesContent() {
  const result = await getResourcesAction();
  if (!result.ok) return <ErrorBanner error={result.error} />;

  const { courses, failedClasses } = result.data;
  const total = courses.reduce((sum, course) => sum + course.resourceCount, 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        {courses.length === 0
          ? "No resources have been shared yet."
          : `${total} resources across ${courses.length} ${courses.length === 1 ? "course" : "courses"}`}
      </p>

      {courses.length > 0 && <CourseResourceList courses={courses} />}

      {failedClasses > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {failedClasses} class{failedClasses === 1 ? "'s" : "es'"} resources couldn’t be loaded and
          are missing from this list.
        </p>
      )}

      <p className="text-xs text-zinc-400">
        Links are signed and expire after about an hour — reload the page if one stops working.
      </p>
    </div>
  );
}
