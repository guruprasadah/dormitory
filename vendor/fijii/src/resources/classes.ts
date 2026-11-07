import type { HttpClient } from "../http.js";
import type {
  Assignment,
  AssignmentListResponse,
  ClassPermission,
  Classroom,
  CoursePlanner,
} from "../types.js";

export interface AssignmentListOptions {
  page?: number;
  perPage?: number;
  /** Filter by assignment type (maps to the `type` query param). */
  type?: string;
}

export interface AssignmentBuckets {
  upcoming: Assignment[];
  previous: Assignment[];
  draft: Assignment[];
  totals: { upcoming: number; previous: number; draft: number };
}

export class ClassesResource {
  constructor(
    private readonly http: HttpClient,
    private readonly ukidProvider: () => number | Promise<number>,
  ) {}

  private async ukid(): Promise<number> {
    return this.ukidProvider();
  }

  /**
   * Every class the signed-in user belongs to.
   * `GET /rest/classes/v1/classroom` — returns a bare array.
   */
  list(termId?: number) {
    return this.http.get<Classroom[]>("/rest/classes/v1/classroom", {
      query: { termId },
    });
  }

  /** Per-class access gate. Use before navigating to a class sub-page. */
  async permission(classId: number) {
    const r = await this.http.get<ClassPermission>(`/rest/classes/classPermission/${classId}`);
    return r.res === "SUCCESS";
  }

  // ---------------------------------------------------------------------- //
  // Assignments
  // ---------------------------------------------------------------------- //

  /**
   * Paginated assignments for one class. The backend splits into
   * upcoming / previous / draft buckets.
   */
  assignments(classId: number, options: AssignmentListOptions = {}) {
    return this.ukid().then((ukid) =>
      this.http.get<AssignmentListResponse>(
        `/rest/classes/${classId}/users/${ukid}/assignments`,
        { query: { page: options.page ?? 1, perPage: options.perPage ?? 50, type: options.type } },
      ),
    );
  }

  /** Fetch all assignment pages for a class and merge the buckets. */
  async allAssignments(
    classId: number,
    options: { perPage?: number; type?: string } = {},
  ): Promise<AssignmentBuckets> {
    const perPage = options.perPage ?? 50;
    const merged: AssignmentBuckets = {
      upcoming: [],
      previous: [],
      draft: [],
      totals: { upcoming: 0, previous: 0, draft: 0 },
    };
    let page = 1;
    for (;;) {
      const data = await this.assignments(classId, { page, perPage, type: options.type });
      const res = data.res;
      if (!res) break;
      merged.upcoming.push(...(res.upcomingAssignments ?? []));
      merged.previous.push(...(res.previousAssignments ?? []));
      merged.draft.push(...(res.draftAssignments ?? []));
      merged.totals = {
        upcoming: res.totalUpcomingCount ?? 0,
        previous: res.totalPreviousCount ?? 0,
        draft: res.totalDraftCount ?? 0,
      };
      const more = merged.upcoming.length < merged.totals.upcoming;
      if (!more || !(res.upcomingAssignments?.length ?? 0)) break;
      page += 1;
      if (page > 100) break;
    }
    return merged;
  }

  /**
   * Detail for one assignment, from the student's perspective (includes
   * resources, submissions, rubric).
   *
   * Note: `GET /rest/assignments/v1/{id}` 404s for students — this uses the
   * `getStudentAssignmentDetails` form instead.
   */
  assignment(assignmentId: number, classId: number) {
    return this.http.get<Assignment>("/rest/assignments/v1/getStudentAssignmentDetails", {
      query: { assignmentId, classId },
    });
  }

  // ---------------------------------------------------------------------- //
  // Course work
  // ---------------------------------------------------------------------- //

  /** Modules with their sessions for a class. */
  modules(classId: number) {
    return this.http.get<import("../types.js").ModuleWithComponents[]>(
      `/rest/classroomV2/class/${classId}/module`,
    );
  }

  /** Paged session list for a class. */
  sessions(classId: number, pageOffSet = 0, perPage = 20) {
    return this.http.get<import("../types.js").SessionListResponse>(
      `/rest/classroomV2/class/${classId}/sessions`,
      { query: { pageOffSet, perPage } },
    );
  }

  /** Single session with resources (signed URLs). */
  session(classId: number, sessionId: number) {
    return this.http.get<import("../types.js").SessionDetail>(
      `/rest/classroomV2/class/${classId}/sessions/${sessionId}`,
    );
  }

  /** Course planner: every session with dates, attendance flags and resources. */
  coursePlanner(classId: number) {
    return this.http.get<CoursePlanner>(`/rest/classroomV2/class/${classId}/coursePlanner`);
  }

  /** All resources for a class, flattened across modules/sessions. */
  resources(classId: number) {
    return this.http.get<import("../types.js").ClassResource[]>("/rest/classroomV2/resources", {
      query: { classId },
    });
  }

  /**
   * Generate a fresh signed preview URL for a resource.
   * Signed URLs expire (~1h) — call this right before opening a file.
   */
  signedResourceUrl(classId: number, mediaId: number) {
    return this.http.get<unknown>("/rest/classroomV2/resources/generateGetSignedUrlForPreview", {
      query: { classId, mediaId },
    });
  }

  /** Lessons for a class (previous + upcoming), from the timetable. */
  lessons(classId: number) {
    return this.ukid().then((ukid) =>
      this.http.get<{ res: unknown }>(`/rest/classes/${classId}/users/${ukid}/lessons`),
    );
  }
}
