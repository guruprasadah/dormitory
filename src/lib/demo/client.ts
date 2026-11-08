import { connection } from "next/server";
import type {
  Assignment,
  AttendanceRecord,
  ClassResource,
  Classroom,
  ComponentSummary,
  CourseSummary,
  PendingAssignment,
  PendingAssignmentsOptions,
  Term,
  TermSummary,
} from "fijii";
import {
  DEMO_ASSIGNMENTS,
  DEMO_COURSES,
  DEMO_LEAVES,
  DEMO_RESOURCES,
  type DemoCourse,
  type DemoResource,
} from "./data";
import { demoLessons, demoNow, demoTerm, demoTerms, digiiAt } from "./timeline";

/**
 * A stand-in for `Fijii` that answers from fixtures instead of the portal.
 *
 * It mirrors the SDK's *behaviour*, not its transport: the pending-assignment
 * filter, the "total = present + absent" attendance rule and the per-class
 * resource fan-out are all reimplemented here so the pages render exactly as
 * they would against real data.
 *
 * Only the methods `src/actions/` calls are present. A new action that needs
 * data will fail to type-check until it is added here — the demo can never
 * silently fall back to `undefined`.
 */

const DAY = 86_400_000;
const HOUR = 3_600_000;

const STATUS_COLOUR: Record<string, string> = {
  PRESENT: "#22c55e",
  ABSENT: "#ef4444",
  MEDICAL: "#a855f7",
};
const STATUS_ABBREVIATION: Record<string, string> = {
  PRESENT: "P",
  ABSENT: "A",
  MEDICAL: "ML",
};

export class MockFijii {
  readonly attendance: {
    terms: () => Promise<Term[]>;
  };
  readonly classes: {
    list: () => Promise<Classroom[]>;
    resources: (classId: number) => Promise<ClassResource[]>;
  };

  constructor(private readonly now: Date = demoNow()) {
    this.attendance = { terms: async () => demoTerms(this.now) };
    this.classes = {
      list: async () => this.classrooms(),
      resources: async (classId: number) => this.resources(classId),
    };
  }

  /**
   * The fixtures are date-derived — "now" plus offsets. This app's Cache
   * Components config treats clock reads as dynamic, and prerendering one
   * instant to hydrate against another is wrong, so open a request scope
   * before the constructor reads the clock.
   */
  static async create(): Promise<MockFijii> {
    await connection();
    return new MockFijii();
  }

  // ---------------------------------------------------------------------- //
  // Attendance
  // ---------------------------------------------------------------------- //

  async attendanceSummary(termId?: number): Promise<TermSummary> {
    const terms = demoTerms(this.now);
    const current = terms[0]!;
    const term = (termId !== undefined ? terms.find((t) => t.id === termId) : undefined) ?? current;

    const courses = this.courseSummaries(term.id !== current.id);
    const present = sum(courses, (c) => c.present);
    const absent = sum(courses, (c) => c.absent);
    const total = present + absent;

    return {
      termId: term.id,
      term,
      present,
      absent,
      total,
      percentage: percent(present, total),
      approvedLeaves: term.id === current.id ? DEMO_LEAVES.approved : 0,
      unapprovedLeaves: term.id === current.id ? DEMO_LEAVES.unapproved : 0,
      courses,
    };
  }

  private courseSummaries(isPastTerm: boolean): CourseSummary[] {    return DEMO_COURSES.map((course) => {
      const components = course.components.map((component) =>
        this.componentSummary(course, component, isPastTerm),
      );
      const present = sum(components, (c) => c.present);
      const absent = sum(components, (c) => c.absent);
      return {
        courseId: course.courseId,
        courseName: course.courseName,
        courseCode: course.courseCode,
        present,
        absent,
        total: present + absent,
        percentage: percent(present, present + absent),
        components,
      };
    });
  }

  private componentSummary(
    course: DemoCourse,
    component: DemoCourse["components"][number],
    isPastTerm: boolean,
  ): ComponentSummary {
    const lessons = demoLessons(this.now, component, isPastTerm).map((lesson, index) => {
      const status = lesson.status;
      const lessonId = component.classId * 100 + index;
      return {
        id: lessonId,
        lessonId,
        status,
        colorCode: status ? STATUS_COLOUR[status] ?? null : null,
        abbreviation: status ? STATUS_ABBREVIATION[status] ?? status : null,
        lessonStartTime: lesson.start,
        lessonEndTime: lesson.end,
        ukid: 0,
        classId: component.classId,
        courseId: course.courseId,
        description: null,
        collegeId: null,
        onlyForConsole: false,
        doNotConsiderForAttendance:
          status !== null && status !== "PRESENT" && status !== "ABSENT",
        throughConsole: null,
        finalStatus: null,
        approvalStatus: null,
        deleted: false,
        classAttendanceId: null,
        statusId: null,
        createdTimestamp: null,
        updatedTimestamp: null,
        attendanceTimestamp: null,
        throughBiometric: false,
        biometricPunchLogId: null,
        attendanceMarkedFrom: null,
        appliedExceptionLogId: null,
        firstTimeAttendance: false,
        rollNumber: null,
        present: status === "PRESENT",
      } satisfies AttendanceRecord;
    });

    // Portal rule: unmarked lessons and "don't consider" statuses stay out of
    // the denominator, which is why the counts are derived rather than stored.
    const counted = lessons.filter(
      (lesson) => lesson.status === "PRESENT" || lesson.status === "ABSENT",
    );
    const present = counted.filter((lesson) => lesson.present).length;
    const absent = counted.length - present;

    return {
      classId: component.classId,
      courseId: course.courseId,
      courseName: course.courseName,
      courseCode: course.courseCode,
      componentType: component.type,
      className: component.className,
      present,
      absent,
      doNotConsider: lessons.length - counted.length - lessons.filter((l) => l.status === null).length,
      total: present + absent,
      percentage: percent(present, present + absent),
      unmarkedLessons: lessons.filter((lesson) => lesson.status === null).length,
      lessons,
    };
  }

  // ---------------------------------------------------------------------- //
  // Assignments — mirrors `Fijii.pendingAssignments`
  // ---------------------------------------------------------------------- //

  async pendingAssignments(options: PendingAssignmentsOptions = {}): Promise<PendingAssignment[]> {
    const includeOverdue = options.includeOverdue ?? true;
    const includeRejected = options.includeRejected ?? true;
    const wanted = options.classIds ? new Set(options.classIds) : null;
    const classes = new Map(this.classrooms().map((cls) => [cls.id, cls]));

    const out: PendingAssignment[] = [];
    for (const fixture of DEMO_ASSIGNMENTS) {
      if (wanted && !wanted.has(fixture.classId)) continue;
      const rejected = fixture.isRejected === true;
      if (rejected && !includeRejected) continue;

      const dueAt = this.dueInstant(fixture.dueInHours);
      const overdue = dueAt.getTime() < this.now.getTime();
      if (overdue && !includeOverdue && !rejected) continue;

      const daysUntilDue = (dueAt.getTime() - this.now.getTime()) / DAY;
      if (options.dueWithinDays !== undefined && daysUntilDue > options.dueWithinDays) continue;

      const cls = classes.get(fixture.classId)!;
      out.push({
        ...blankAssignment(),
        id: fixture.id,
        name: fixture.name,
        classId: fixture.classId,
        classLabel: labelClass(cls),
        dueDate: digiiAt(dueAt),
        dueDatePassed: overdue,
        submissionType: fixture.submissionType,
        isRejected: rejected,
        dueAt,
        daysUntilDue,
      });
    }

    out.sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return a.classLabel.localeCompare(b.classLabel);
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt.getTime() - b.dueAt.getTime();
    });
    return out;
  }

  /**
   * Due times look like faculty-entered deadlines: future ones land at 23:59
   * on a calendar day a few days out; an overdue one lands in the past.
   */
  private dueInstant(dueInHours: number): Date {
    const target = new Date(this.now.getTime() + dueInHours * HOUR);
    const wall = new Date(target.getTime());
    if (dueInHours >= 0) wall.setHours(23, 59, 0, 0);
    else wall.setHours(17, 0, 0, 0);
    return wall;
  }

  // ---------------------------------------------------------------------- //
  // Classes & resources
  // ---------------------------------------------------------------------- //

  private classrooms(): Classroom[] {
    return DEMO_COURSES.flatMap((course) =>
      course.components.map((component) => this.classroomOf(course, component)),
    );
  }

  private classroomOf(course: DemoCourse, component: DemoCourse["components"][number]): Classroom {
    return {
      id: component.classId,
      courseId: course.courseId,
      courseVersionId: course.courseId * 10,
      version: 1,
      courseName: course.courseName,
      courseCode: course.courseCode,
      courseCredits: 3,
      description: null,
      departmentId: 1,
      departmentName: "Computer Science & Engineering",
      termId: demoTerm(this.now).id,
      sessionId: 2026,
      className: component.className,
      referenceId: null,
      sectionId: component.type === "Lecture" ? 1 : 2,
      batch: "2024",
      faculty: null,
      facultyUkid: null,
      courseComponentTypeId: { Lecture: 1, Practical: 2, Tutorial: 3 }[component.type],
      courseComponentTypeName: component.type,
      isSubstitute: false,
      classroomSyncRule: null,
      isSyncedWithExternalProvider: false,
      externalProviderSyncedTimestamp: null,
      termCourseId: null,
    };
  }

  private resources(classId: number): ClassResource[] {
    return DEMO_RESOURCES.filter((resource) => resource.classId === classId).map((resource) =>
      this.resourceOf(resource),
    );
  }

  private resourceOf(resource: DemoResource): ClassResource {
    const updated = new Date(this.now.getTime() - resource.updatedHoursAgo * HOUR);
    // A hashtag, so clicking a demo card never leaves the app.
    const href = "#demo-resource";
    return {
      id: resource.id,
      moduleId: null,
      moduleOrder: null,
      moduleTitle: resource.module,
      moduleName: resource.module,
      sessionId: null,
      sessionOrder: null,
      sessionName: resource.session,
      mediaId: resource.id * 10,
      mediaName: resource.weblink ? "" : resource.name,
      mediaUrl: href,
      mediaDownloadUrl: resource.weblink ? null : href,
      videoThumbnail: null,
      streamingLocation: null,
      canStream: false,
      size: resource.size ?? 0,
      mediaType: resource.mediaType,
      urlId: resource.weblink ? resource.id : null,
      urlName: resource.weblink ? resource.name : null,
      weblink: resource.weblink ? href : null,
      createdTimestamp: digiiAt(new Date(updated.getTime() - 2 * HOUR)),
      modifiedTimestamp: digiiAt(updated),
      mediaError: null,
    };
  }
}

// ------------------------------------------------------------------------- //
// helpers
// ------------------------------------------------------------------------- //

function sum<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}

/** Matches the portal's rounding: two decimals, 0 (not NaN) for no lessons. */
function percent(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 10_000) / 100;
}

function labelClass(cls: Classroom): string {
  const name = (cls.courseName ?? "").replace(/\s+/g, " ").trim();
  const code = (cls.className ?? "").trim();
  return code ? `${name} (${code})` : name;
}

/**
 * `Assignment` has ~60 required fields; the list reads four of them. Start from
 * a shape-valid blank so the fixture stays readable.
 */
function blankAssignment(): Assignment {
  return {
    id: 0,
    name: "",
    description: null,
    startDate: null,
    dueDate: null,
    groupDueDate: null,
    classId: 0,
    moduleId: null,
    lessonId: null,
    creatorUkid: null,
    createdTimestamp: null,
    modifiedTimestamp: null,
    publishDatetime: null,
    publisherUkid: null,
    gradePublishTimestamp: null,
    submissionType: "upload",
    type: "INDIVIDUAL",
    sourceType: null,
    isSubmitted: false,
    dueDatePassed: false,
    submittedOn: null,
    isGraded: false,
    isAssignmentGraded: false,
    isRejected: null,
    rejectionLog: null,
    hasFacultyEvaluated: null,
    showGrade: false,
    grade: null,
    remark: null,
    submissions: null,
    resources: null,
    resourceCount: null,
    submissionCount: null,
    submissionSummary: null,
    submissionDetails: null,
    rubricGrading: false,
    rubricLevels: null,
    rubricCriterias: null,
    minimumMarks: null,
    maximumMarks: null,
    assignmentMarks: null,
    assignmentCourseOutcomeList: null,
    assignmentCourseOutcome: null,
    topicLevelOutcomesList: null,
    groups: null,
    turnitinEnabled: false,
    totalTurnitinSubmissions: null,
    questionnaireId: null,
    parentAssignmentId: null,
    order: null,
    draft: false,
    deleted: false,
    className: null,
    sectionName: null,
    programmeName: null,
    semester: null,
    relatedClass: null,
    assessmentId: null,
    limitSubmissionsCount: null,
    unMappedStudentCount: null,
  };
}
