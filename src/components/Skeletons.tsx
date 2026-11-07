export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70 ${className}`}
      aria-hidden
    />
  );
}

export function RingSkeleton() {
  return (
    <div className="flex items-center gap-5" aria-busy="true">
      <Skeleton className="size-[148px] rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

export function AssignmentListSkeleton() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex justify-between gap-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/2" />
        </li>
      ))}
    </ul>
  );
}

export function CourseGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <div className="flex justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
