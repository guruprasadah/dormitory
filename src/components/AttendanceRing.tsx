import { attendanceBand, type AttendanceBand } from "@/lib/dto";
import { bandStroke, bandText, formatPercent } from "@/lib/format";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AttendanceRing({
  percentage,
  label,
  sublabel,
  size = 148,
}: {
  percentage: number;
  label?: string;
  sublabel?: string;
  size?: number;
}) {
  const band = attendanceBand(percentage);
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" className="-rotate-90" width={size} height={size} aria-hidden>
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            className="stroke-zinc-200 dark:stroke-zinc-800"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={bandStroke[band]}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-semibold tabular-nums ${bandText[band]}`}>
            {formatPercent(percentage)}
          </span>
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">attendance</span>
        </div>
      </div>
      {(label || sublabel) && (
        <div className="min-w-0">
          {label && <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>}
          {sublabel && <p className="mt-1 text-sm text-zinc-500">{sublabel}</p>}
        </div>
      )}
    </div>
  );
}

export function AttendanceBar({ percentage }: { percentage: number }) {
  const band: AttendanceBand = attendanceBand(percentage);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className={`h-full rounded-full ${
          band === "good" ? "bg-emerald-500" : band === "watch" ? "bg-amber-500" : "bg-rose-500"
        }`}
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      />
    </div>
  );
}
