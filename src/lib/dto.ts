import { parseDigiiDate } from "fijii";
import type {
  ClassResource,
  Classroom,
  ComponentSummary,
  CourseSummary,
  PendingAssignment,
  Term,
  TermSummary,
} from "fijii";

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

export type ResourceKind = "pdf" | "document" | "slides" | "sheet" | "image" | "video" | "audio" | "archive" | "link" | "file";

export interface ResourceItemDto {
  id: number;
  mediaId: number;
  name: string;
  kind: ResourceKind;
  /** Signed URL — valid for roughly an hour. */
  href: string;
  /** Bytes, or null when unknown. */
  size: number | null;
  /** Module / session context, e.g. "UNIT II · Session 4". */
  meta: string | null;
  /** ISO instant from the portal's `createdTimestamp`, or null when unparseable. */
  createdAt: string | null;
}

export interface ComponentResourcesDto {
  classId: number;
  componentType: string;
  className: string;
  items: ResourceItemDto[];
}

export interface CourseResourcesDto {
  courseId: number;
  courseName: string;
  courseCode: string | null;
  resourceCount: number;
  components: ComponentResourcesDto[];
}

export interface ResourcesDto {
  courses: CourseResourcesDto[];
  /** Classes whose resources could not be fetched. */
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

const KIND_BY_EXTENSION: Record<string, ResourceKind> = {
  pdf: "pdf",
  doc: "document",
  docx: "document",
  odt: "document",
  rtf: "document",
  txt: "document",
  ppt: "slides",
  pptx: "slides",
  odp: "slides",
  key: "slides",
  xls: "sheet",
  xlsx: "sheet",
  csv: "sheet",
  ods: "sheet",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  heic: "image",
  mp4: "video",
  mov: "video",
  mkv: "video",
  webm: "video",
  avi: "video",
  mp3: "audio",
  m4a: "audio",
  wav: "audio",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
};

/**
 * Classify a resource for its icon. `mediaType` is not enumerated upstream, so
 * fall back to the file extension and then to a generic file.
 */
export function resourceKind(mediaType: string | null | undefined, name: string, weblink: string | null): ResourceKind {
  if (weblink) return "link";
  const type = (mediaType ?? "").toLowerCase();
  if (/video/.test(type)) return "video";
  if (/audio/.test(type)) return "audio";
  if (/image|picture|photo/.test(type)) return "image";
  if (/link|url|embed/.test(type)) return "link";

  const extension = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return KIND_BY_EXTENSION[extension] ?? "file";
}

function resourceMeta(moduleTitle: string | null, sessionName: string | null): string | null {
  const parts = [moduleTitle?.trim(), sessionName?.trim()].filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Newest first. Resources without a parsable `createdTimestamp` sink to the end
 * rather than sorting as epoch 0, and ties fall back to a stable ordering so
 * the list doesn't shuffle between requests.
 */
function compareChronologically(
  aDate: Date | null,
  bDate: Date | null,
  a: ClassResource,
  b: ClassResource,
): number {
  if (aDate && bDate) {
    const diff = bDate.getTime() - aDate.getTime();
    if (diff !== 0) return diff;
  } else if (aDate) {
    return -1;
  } else if (bDate) {
    return 1;
  }
  return a.mediaName.localeCompare(b.mediaName) || a.id - b.id;
}

/**
 * Group class resources into courses. A course can be taught as several classes
 * (Lecture / Practical / Tutorial), each with its own resource list, so
 * resources are fetched per class and merged by `courseId` here.
 */
export function buildResourcesDto(
  classes: Classroom[],
  resourcesByClass: Map<number, ClassResource[]>,
): CourseResourcesDto[] {
  const byCourse = new Map<number, CourseResourcesDto>();

  for (const cls of classes) {
    const resources = resourcesByClass.get(cls.id);
    if (!resources) continue;

    let course = byCourse.get(cls.courseId);
    if (!course) {
      course = {
        courseId: cls.courseId,
        courseName: cls.courseName,
        courseCode: cls.courseCode?.trim() || null,
        resourceCount: 0,
        components: [],
      };
      byCourse.set(cls.courseId, course);
    }

    const items = resources
      .map((resource) => ({
        resource,
        // Naive portal timestamps ("2026-11-05 09:00:00", no zone) must go
        // through the SDK parser; `new Date()` would shift them off IST.
        createdAt: parseDigiiDate(resource.createdTimestamp),
      }))
      .sort((a, b) => compareChronologically(a.createdAt, b.createdAt, a.resource, b.resource))
      .map<ResourceItemDto>(({ resource, createdAt }) => ({
        id: resource.id,
        mediaId: resource.mediaId,
        name: resource.mediaName || resource.urlName || "Untitled resource",
        kind: resourceKind(resource.mediaType, resource.mediaName ?? "", resource.weblink),
        href: resource.weblink || resource.mediaUrl,
        size: typeof resource.size === "number" && resource.size > 0 ? resource.size : null,
        meta: resourceMeta(resource.moduleTitle, resource.sessionName),
        createdAt: createdAt?.toISOString() ?? null,
      }));

    if (items.length === 0) continue;

    course.resourceCount += items.length;
    course.components.push({
      classId: cls.id,
      componentType: cls.courseComponentTypeName ?? "",
      className: cls.className ?? "",
      items,
    });
  }

  const courses = [...byCourse.values()].sort((a, b) => a.courseName.localeCompare(b.courseName));
  return courses;
}
