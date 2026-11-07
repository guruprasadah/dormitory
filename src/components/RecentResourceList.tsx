import type { RecentResourceDto } from "@/lib/dto";
import { formatRelativeUpdate } from "@/lib/format";
import { OpenIcon, ResourceIcon } from "./ResourceIcon";

export function RecentResourceList({ resources }: { resources: RecentResourceDto[] }) {
  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No recently updated resources.
      </div>
    );
  }

  return (
    <ul className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => (
        <li key={`${resource.courseId}:${resource.mediaId}`} className="min-w-0">
          <RecentResourceCard resource={resource} />
        </li>
      ))}
    </ul>
  );
}

function RecentResourceCard({ resource }: { resource: RecentResourceDto }) {
  return (
    <a
      href={resource.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full min-w-0 touch-manipulation flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 active:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-2">
        <ResourceIcon kind={resource.kind} />
        <OpenIcon />
      </div>

      <div className="min-w-0">
        <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-zinc-50">
          {resource.name}
        </p>
        <p className="mt-1 break-words text-xs text-zinc-600 dark:text-zinc-400">
          {resource.courseName}
        </p>
      </div>

      <div className="mt-auto flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
        <span className="shrink-0">{formatRelativeUpdate(resource.updatedAt)}</span>
        {resource.componentType && (
          <>
            <span aria-hidden>·</span>
            <span className="min-w-0 break-words">{resource.componentType}</span>
          </>
        )}
      </div>
    </a>
  );
}
