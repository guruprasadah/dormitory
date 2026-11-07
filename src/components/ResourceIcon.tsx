import type { ResourceKind } from "@/lib/dto";

const ICON_TONE: Record<ResourceKind, string> = {
  pdf: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  document: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  slides: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
  sheet: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  image: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  video: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
  audio: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  archive: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  link: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300",
  file: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const ICON_LABEL: Record<ResourceKind, string> = {
  pdf: "PDF",
  document: "DOC",
  slides: "PPT",
  sheet: "XLS",
  image: "IMG",
  video: "VID",
  audio: "AUD",
  archive: "ZIP",
  link: "WEB",
  file: "FILE",
};

export function ResourceIcon({ kind }: { kind: ResourceKind }) {
  return (
    <span
      className={`grid size-8 shrink-0 place-items-center rounded-md text-[10px] font-semibold ${ICON_TONE[kind]}`}
      aria-hidden
    >
      {ICON_LABEL[kind]}
    </span>
  );
}

export function OpenIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-3.5 shrink-0 stroke-zinc-400" aria-hidden>
      <path d="M8 5h7v7M15 5L5 15" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
