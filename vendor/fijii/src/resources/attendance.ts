import type { HttpClient } from "../http.js";
import type {
  AttendanceExceptionRequest,
  AttendanceRecord,
  AttendanceSettings,
  AttendanceStatus,
  AttendanceComponent,
  CourseAttendance,
  Term,
  TermAttendance,
  TermListResponse,
} from "../types.js";

/** Aggregated attendance for one class component (a course × Lecture/Practical). */
export interface ComponentSummary {
  classId: number;
  courseId: number;
  courseName: string;
  courseCode: string | null;
  componentType: string;
  className: string;
  present: number;
  absent: number;
  doNotConsider: number;
  total: number;
  percentage: number;
  unmarkedLessons: number;
  lessons: AttendanceRecord[];
}

export interface CourseSummary {
  courseId: number;
  courseName: string;
  courseCode: string | null;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  components: ComponentSummary[];
}

export interface TermSummary {
  termId: number;
  term: Term | null;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  approvedLeaves: number;
  unapprovedLeaves: number;
  courses: CourseSummary[];
}

/**
 * Student attendance.
 *
 * The student view is NOT under /classroom — it lives on the profile card
 * (`/users/{ukid}/profileCard/academics`). Flow:
 *   1. authenticationDetails → programmeId + batchYear
 *   2. /api/terms/programmeBatchTerms → terms
 *   3. /api/attendance/student/{ukid}/term/{termId} → everything
 *
 * The classroom attendance routes (`/api/attendance/student/class/*`,
 * `/lessonClass`) are faculty/console-only and return an empty-body 403.
 */
export class AttendanceResource {
  constructor(
    private readonly http: HttpClient,
    private readonly ukidProvider: () => number | Promise<number>,
    /** Supplies programmeId/batchYear; wired from the SDK, overridable. */
    private readonly profile: () => Promise<{ programmeId: number; batchYear: number }>,
  ) {}

  private async ukid(): Promise<number> {
    return this.ukidProvider();
  }

  /** Term list for the student's programme + batch. */
  async terms(): Promise<Term[]> {
    const { programmeId, batchYear } = await this.profile();
    const data = await this.http.get<TermListResponse>("/api/terms/programmeBatchTerms", {
      query: { batch: batchYear, programme: programmeId },
    });
    return data.terms ?? [];
  }

  /** The currently active term, or the first one. */
  async currentTerm(): Promise<Term | null> {
    const terms = await this.terms();
    if (!terms.length) return null;
    return terms.find((t) => t.active) ?? terms.find((t) => !t.past && !t.future) ?? terms[0]!;
  }

  /** Raw per-term attendance payload. */
  async termAttendance(termId: number) {
    const ukid = await this.ukid();
    return this.http.get<TermAttendance>(`/api/attendance/student/${ukid}/term/${termId}`);
  }

  /** Status catalogue (PRESENT / ABSENT / MEDICAL LEAVE / …). */
  statuses() {
    return this.http.get<AttendanceStatus[]>("/api/attendance/status");
  }

  attendanceSettings() {
    return this.http.get<AttendanceSettings>("/api/attendance/settings");
  }

  /** Whether the college enables student attendance-exception requests. */
  canRaiseException() {
    return this.http.get<boolean>("/api/chc/middleware/service", {
      query: { action: "ACADEMICS_STUDENT_ATTENDANCE_EXCEPTION" },
    });
  }

  /**
   * Submit an attendance correction. Only valid when {@link canRaiseException}
   * is true; the college routes it through the CHC approval middleware.
   */
  raiseException(body: AttendanceExceptionRequest) {
    return this.http.post<unknown>("/api/chc/middleware/create", {
      body: { ...body, commonAttachment: null },
    });
  }

  // ---------------------------------------------------------------------- //
  // Summaries
  // ---------------------------------------------------------------------- //

  /**
   * Normalised summary for a term, with the counting rule applied:
   * `total = present + absent` (unmarked and "do not consider" lessons excluded).
   */
  async summary(termId?: number): Promise<TermSummary> {
    const terms = await this.terms();
    let term: Term | null;
    if (termId === undefined) {
      term = terms.find((t) => t.active) ?? terms.find((t) => !t.past && !t.future) ?? terms[0] ?? null;
    } else {
      term = terms.find((t) => t.id === termId) ?? null;
      if (!term) throw new Error(`fijii: term ${termId} not found for this student`);
    }
    if (!term) throw new Error("fijii: no term available for this student");
    const data = await this.termAttendance(term.id);
    return buildTermSummary(term, data);
  }
}

// ------------------------------------------------------------------------- //
// Pure transforms (exported for testing)
// ------------------------------------------------------------------------- //

/** Normalise a raw term payload into a typed summary. */
export function buildTermSummary(term: Term | null, data: TermAttendance): TermSummary {
  return {
    termId: data.termId ?? term?.id ?? 0,
    term,
    present: data.totalPresent ?? 0,
    absent: data.totalAbsent ?? 0,
    total: data.totalClasses ?? 0,
    percentage: round2(data.percentage ?? 0),
    approvedLeaves: data.approvedLeaves ?? 0,
    unapprovedLeaves: data.unapprovedLeaves ?? 0,
    courses: (data.courseAttendance ?? []).map(buildCourseSummary),
  };
}

export function buildCourseSummary(course: CourseAttendance): CourseSummary {
  return {
    courseId: course.courseId,
    courseName: (course.courseName ?? "").replace(/\s+/g, " ").trim(),
    courseCode: course.courseCode?.trim() || null,
    present: course.totalPresent ?? 0,
    absent: course.totalAbsent ?? 0,
    total: course.totalClasses ?? 0,
    percentage: round2(course.percentage ?? 0),
    components: (course.components ?? []).map((c) => buildComponentSummary(course, c)),
  };
}

export function buildComponentSummary(
  course: CourseAttendance,
  component: AttendanceComponent,
): ComponentSummary {
  const lessons = component.attendance ?? [];
  return {
    classId: component.classId,
    courseId: component.courseId ?? course.courseId,
    courseName: (component.courseName ?? course.courseName ?? "").replace(/\s+/g, " ").trim(),
    courseCode: component.courseCode?.trim() || null,
    componentType: (component.courseComponentTypeName ?? "").trim(),
    className: (component.className ?? "").trim(),
    present: component.totalPresent ?? 0,
    absent: component.totalAbsent ?? 0,
    doNotConsider: component.totalDoNotConsiderForAttendance ?? 0,
    total: component.totalClasses ?? 0,
    percentage: round2(component.percentage ?? 0),
    unmarkedLessons: lessons.filter((l) => l.status === null).length,
    lessons: [...lessons].sort((a, b) => a.lessonStartTime.localeCompare(b.lessonStartTime)),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
