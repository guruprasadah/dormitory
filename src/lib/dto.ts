import type { ComponentSummary, CourseSummary, PendingAssignment, Term, TermSummary } from "fijii";

/**
 * Trimmed, plain-data shapes handed to Client Components. Server-only SDK
 * objects (Dates, raw upstream fields) are normalised here so nothing large or
 * sensitive crosses the RSC boundary.
 */

export interface TermDto {
  id: number;
  name: string;
  active: boolean;
  starts: string;
  ends: string;
}

export interface LessonDto {
  id: number;
  /** e.g. "PRESENT", "ABSENT" — `null` means not yet marked. */
  status: string | null;
  abbreviation: string | null;
  colorCode: string | null;
  /** "2026-11-05 09:00:00" (portal-local, naive) — formatted with `formatLessonTime`. */
  start: string;
  end: string;
}

export interface ComponentDto {
  classId: number;
  componentType: string;
  className: string;
  present: number;
  absent: number;
  doNotConsider: number;
  total: number;
  percentage: number;
  unmarkedLessons: number;
  lessons: LessonDto[];
}

export interface CourseDto {
  courseId: number;
  courseName: string;
  courseCode: string | null;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  components: ComponentDto[];
}

export interface AttendanceDto {
  termId: number;
  termName: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  approvedLeaves: number;
  unapprovedLeaves: number;
  courses: CourseDto[];
}

export interface AssignmentDto {
  id: number;
  name: string;
  classId: number;
  classLabel: string;
  /** ISO instant, or null when the assignment has no due date. */
  dueAt: string | null;
  daysUntilDue: number | null;
  isRejected: boolean;
  submissionType: string;
}

export interface PendingAssignmentsDto {
  assignments: AssignmentDto[];
  /** Classes whose assignments could not be fetched. */
  failedClasses: number;
}

export function toTermDto(term: Term): TermDto {
  return {
    id: term.id,
    name: term.name,
    active: term.active,
    starts: term.starts,
    ends: term.ends,
  };
}

export function toAttendanceDto(summary: TermSummary): AttendanceDto {
  return {
    termId: summary.termId,
    termName: summary.term?.name ?? "Current term",
    present: summary.present,
    absent: summary.absent,
    total: summary.total,
    percentage: summary.percentage,
    approvedLeaves: summary.approvedLeaves,
    unapprovedLeaves: summary.unapprovedLeaves,
    courses: summary.courses.map(toCourseDto),
  };
}

function toCourseDto(course: CourseSummary): CourseDto {
  return {
    courseId: course.courseId,
    courseName: course.courseName,
    courseCode: course.courseCode,
    present: course.present,
    absent: course.absent,
    total: course.total,
    percentage: course.percentage,
    components: course.components.map(toComponentDto),
  };
}

function toComponentDto(component: ComponentSummary): ComponentDto {
  return {
    classId: component.classId,
    componentType: component.componentType,
    className: component.className,
    present: component.present,
    absent: component.absent,
    doNotConsider: component.doNotConsider,
    total: component.total,
    percentage: component.percentage,
    unmarkedLessons: component.unmarkedLessons,
    lessons: component.lessons.map((lesson) => ({
      id: lesson.id,
      status: lesson.status,
      abbreviation: lesson.abbreviation,
      colorCode: lesson.colorCode,
      start: lesson.lessonStartTime,
      end: lesson.lessonEndTime,
    })),
  };
}

export function toAssignmentDto(assignment: PendingAssignment): AssignmentDto {
  return {
    id: assignment.id,
    name: assignment.name,
    classId: assignment.classId,
    classLabel: assignment.classLabel,
    dueAt: assignment.dueAt?.toISOString() ?? null,
    daysUntilDue: assignment.daysUntilDue,
    isRejected: assignment.isRejected === true,
    submissionType: assignment.submissionType,
  };
}

/** Attendance health band used for colour coding across cards and the ring. */
export type AttendanceBand = "good" | "watch" | "risk";

export function attendanceBand(percentage: number): AttendanceBand {
  if (percentage >= 85) return "good";
  if (percentage >= 75) return "watch";
  return "risk";
}
