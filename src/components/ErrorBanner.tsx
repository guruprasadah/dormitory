import type { ActionError } from "@/lib/errors";

const tones: Record<ActionError["kind"], string> = {
  auth: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  config: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  forbidden:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  "not-found":
    "border-zinc-300 bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
  network:
    "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  upstream:
    "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  unknown:
    "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
};

export function ErrorBanner({ error }: { error: ActionError }) {
  return (
    <div className={`rounded-xl border p-4 text-sm ${tones[error.kind]}`} role="alert">
      <p className="font-medium">Couldn’t load data from the portal</p>
      <p className="mt-1 opacity-90">{error.message}</p>
      {error.kind === "config" && (
        <p className="mt-2 font-mono text-xs opacity-80">
          cp .env.example .env.local → fill DIGII_TOKEN + DIGII_BASE_URL → restart the dev server
        </p>
      )}
    </div>
  );
}
