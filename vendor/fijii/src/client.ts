import { HttpClient, type HttpClientConfig } from "./http.js";
import { DigiiError } from "./errors.js";
import { AuthResource, InstitutionResource, decodeJwt } from "./resources/institution.js";
import { ClassesResource } from "./resources/classes.js";
import { GradebookResource, QuizzesResource } from "./resources/quizzes.js";
import { AttendanceResource, type TermSummary } from "./resources/attendance.js";
import { DiscussionsResource } from "./resources/discussions.js";
import { daysUntil, isPast, parseDigiiDate } from "./dates.js";
import type { Assignment, Classroom, JwtClaims } from "./types.js";

export interface FijiiConfig {
  /**
   * Institution origin, e.g. `https://<your-institute>.digiicampus.com`.
   *
   * Optional only when `token` is a static JWT string — the origin is then read
   * from the token's `instituteUrl` claim. There is no default: if the origin
   * cannot be determined, the constructor throws.
   */
  baseUrl?: string;
  /**
   * JWT — a string, or a function returning the current token (recommended,
   * so re-login/rotation is picked up). Falls back to `DIGII_TOKEN` / `AUTH_TOKEN`.
   */
  token?: string | (() => string | Promise<string>);
  /** Skip the profile lookup before attendance calls when already known. */
  college?: { programmeId?: number; batchYear?: number };
  /** IANA timezone for naive dates. Defaults to the college timezone, then `Asia/Kolkata`. */
  timeZone?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  /** Optional request logger. */
  onRequest?: (info: { method: string; url: string }) => void;
}

export interface PendingAssignment extends Assignment {
  classId: number;
  /** Human-readable class label (course name + class name). */
  classLabel: string;
  /** Timezone-correct absolute due instant, or null. */
  dueAt: Date | null;
  /** Whole days until due (negative = overdue). */
  daysUntilDue: number | null;
}

export interface PendingAssignmentsOptions {
  classIds?: number[];
  dueWithinDays?: number;
  /** Include assignments past their due date but still unsubmitted. Default true. */
  includeOverdue?: boolean;
  /** Include rejected submissions that need rework. Default true. */
  includeRejected?: boolean;
  /** Handle per-class fetch failures instead of rejecting the whole call. */
  onError?: (classId: number, error: unknown) => void;
}

/** A student-facing SDK for the Digiicampus portal. */
export class Fijii {
  readonly http: HttpClient;
  readonly auth: AuthResource;
  readonly institution: InstitutionResource;
  readonly classes: ClassesResource;
  readonly quizzes: QuizzesResource;
  readonly gradebook: GradebookResource;
  readonly attendance: AttendanceResource;
  readonly discussions: DiscussionsResource;

  private readonly tokenProvider: () => string | Promise<string>;
  private readonly collegeHint?: { programmeId?: number; batchYear?: number };
  private timeZone: string;
  private cachedClaims?: JwtClaims;
  private cachedProfile?: { programmeId: number; batchYear: number };

  constructor(config: FijiiConfig = {}) {
    this.tokenProvider = normalizeTokenProvider(config.token);
    this.collegeHint = config.college;
    this.timeZone = config.timeZone ?? "Asia/Kolkata";

    const baseUrl = resolveBaseUrl(config);

    const httpConfig: HttpClientConfig = {
      baseUrl,
      getToken: () => this.token(),
      ...(config.timeoutMs !== undefined ? { timeoutMs: config.timeoutMs } : {}),
      ...(config.fetch ? { fetch: config.fetch } : {}),
      ...(config.onRequest ? { onRequest: config.onRequest } : {}),
    };
    this.http = new HttpClient(httpConfig);

    const ukid = () => this.ukid();

    this.auth = new AuthResource(this.http);
    this.institution = new InstitutionResource(this.http);
    this.classes = new ClassesResource(this.http, ukid);
    this.quizzes = new QuizzesResource(this.http, ukid);
    this.gradebook = new GradebookResource(this.http);
    this.discussions = new DiscussionsResource(this.http);
    this.attendance = new AttendanceResource(this.http, ukid, () => this.profile());
  }

  /** The token currently in use. */
  token(): Promise<string> {
    return Promise.resolve(this.tokenProvider());
  }

  /** Decoded JWT claims (re-read when the token's `jti` changes). */
  async claims(): Promise<JwtClaims> {
    const token = await this.token();
    const jti = safeJti(token);
    const cached = this.cachedClaims;
    if (cached && (!jti || cached.jti === jti)) return cached;
    const claims = decodeJwt(token);
    this.cachedClaims = claims;
    return claims;
  }

  /** The signed-in user's ukid. */
  async ukid(): Promise<number> {
    return (await this.claims()).ukid;
  }

  /** College timezone (used to interpret naive timestamps). */
  get collegeTimeZone(): string {
    return this.timeZone;
  }

  /** Parse a digii timestamp using the configured timezone. */
  parseDate(value: string | number | null | undefined): Date | null {
    return parseDigiiDate(value, this.timeZone);
  }

  /** Programme + batch — required for term/attendance lookups. */
  async profile(): Promise<{ programmeId: number; batchYear: number }> {
    if (this.cachedProfile) return this.cachedProfile;
    if (this.collegeHint?.programmeId && this.collegeHint.batchYear) {
      this.cachedProfile = {
        programmeId: this.collegeHint.programmeId,
        batchYear: this.collegeHint.batchYear,
      };
      return this.cachedProfile;
    }
    const user = await this.auth.me();
    if (!user.programmeId || !user.batchYear) {
      throw new Error("fijii: profile is missing programmeId/batchYear");
    }
    this.cachedProfile = { programmeId: user.programmeId, batchYear: user.batchYear };
    return this.cachedProfile;
  }

  /**
   * Adopt the college timezone from the server (best-effort, once).
   * Safe to call manually; also invoked by {@link attendanceSummary}.
   */
  async syncTimeZone(): Promise<string> {
    try {
      const t = await this.institution.collegeTime();
      if (t?.timeZone) this.timeZone = t.timeZone;
    } catch {
      /* keep the default */
    }
    return this.timeZone;
  }

  // ---------------------------------------------------------------------- //
  // High-level helpers
  // ---------------------------------------------------------------------- //

  /**
   * Pending assignments across every class, sorted by due date.
   *
   * "Pending" = in the upcoming bucket, not submitted, and either upcoming or
   * (by default) overdue-but-still-open. Rejected submissions are included by
   * default because they require resubmission.
   */
  async pendingAssignments(options: PendingAssignmentsOptions = {}): Promise<PendingAssignment[]> {
    const classes = await this.classes.list();
    const wanted = options.classIds ? new Set(options.classIds) : null;
    const targets = classes.filter((c) => !wanted || wanted.has(c.id));
    const includeOverdue = options.includeOverdue ?? true;
    const includeRejected = options.includeRejected ?? true;

    const settled = await Promise.allSettled(
      targets.map(async (cls) => ({ cls, buckets: await this.classes.allAssignments(cls.id) })),
    );

    const out: PendingAssignment[] = [];
    for (const [index, outcome] of settled.entries()) {
      const cls = targets[index]!;
      if (outcome.status === "rejected") {
        if (options.onError) {
          options.onError(cls.id, outcome.reason);
          continue;
        }
        throw outcome.reason;
      }
      for (const a of outcome.value.buckets.upcoming) {
        if (!isPending(a, { includeOverdue, includeRejected })) continue;
        const dueAt = parseDigiiDate(a.dueDate, this.timeZone);
        const daysUntilDue = daysUntil(a.dueDate, new Date(), this.timeZone);
        if (options.dueWithinDays !== undefined && daysUntilDue !== null && daysUntilDue > options.dueWithinDays) {
          continue;
        }
        out.push({ ...a, classId: cls.id, classLabel: labelClass(cls), dueAt, daysUntilDue });
      }
    }

    out.sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return a.classLabel.localeCompare(b.classLabel);
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt.getTime() - b.dueAt.getTime();
    });
    return out;
  }

  /** Current-term (or specified-term) attendance summary. */
  async attendanceSummary(termId?: number): Promise<TermSummary> {
    if (this.timeZone === "Asia/Kolkata") await this.syncTimeZone();
    return this.attendance.summary(termId);
  }
}

// ------------------------------------------------------------------------- //
// internals
// ------------------------------------------------------------------------- //

function env(key: string): string | undefined {
  return typeof process !== "undefined" ? process.env[key] : undefined;
}

/**
 * Determine the portal origin. There is intentionally **no built-in default** —
 * callers must target their own institution.
 *
 * Order: explicit `baseUrl` → token's `instituteUrl` claim (static tokens only)
 * → `DIGII_BASE_URL`. Throws when none yields a value.
 */
function resolveBaseUrl(config: FijiiConfig): string {
  const explicit = config.baseUrl?.trim();
  if (explicit) return explicit;

  if (config.token && typeof config.token === "string") {
    const fromToken = safeInstituteUrl(config.token);
    if (fromToken) return fromToken;
  }

  const fromEnv = env("DIGII_BASE_URL")?.trim();
  if (fromEnv) return fromEnv;

  throw new Error(
    "fijii: no base URL configured. Pass `baseUrl` (e.g. https://<institute>.digiicampus.com), " +
      "pass a static JWT string with an `instituteUrl` claim, or set DIGII_BASE_URL.",
  );
}

function normalizeTokenProvider(token: FijiiConfig["token"]): () => string | Promise<string> {
  if (typeof token === "function") return token;
  if (typeof token === "string") return () => token;
  return () => {
    const t = env("DIGII_TOKEN") ?? env("AUTH_TOKEN");
    if (!t) throw new DigiiError("unauthorized", "fijii: no token provided. Pass `token` or set DIGII_TOKEN.");
    return t;
  };
}

function safeInstituteUrl(token: string): string | undefined {
  try {
    return decodeJwt(token).instituteUrl;
  } catch {
    return undefined;
  }
}

function safeJti(token: string): string | undefined {
  try {
    return decodeJwt(token).jti;
  } catch {
    return undefined;
  }
}

function isPending(a: Assignment, opts: { includeOverdue: boolean; includeRejected: boolean }): boolean {
  if (a.isSubmitted === true) return false;
  const rejected = a.isRejected === true;
  if (rejected && !opts.includeRejected) return false;
  const past = a.dueDatePassed === true || isPast(a.dueDate);
  if (past && !opts.includeOverdue && !rejected) return false;
  return true;
}

function labelClass(cls: Classroom): string {
  const name = (cls.courseName ?? "").replace(/\s+/g, " ").trim();
  const code = (cls.className ?? "").trim();
  return code ? `${name} (${code})` : name;
}
