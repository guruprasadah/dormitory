/**
 * Fictional fixture data for demo mode (`DEMO_MODE=1`).
 *
 * Everything here is made up: no real institution, no real student, no real
 * syllabus. Dates are expressed as offsets from "now" (`timeline.ts` turns
 * them into portal-style timestamps) so screenshots always look current.
 *
 * Shape notes:
 * - `courseId` groups classes (Lecture / Practical / Tutorial) into a course.
 * - `classId` mirrors the portal: every component (course × type) has its own
 *   class id, which is what assignments and resources hang off.
 */

export const DEMO_TERM = {
  id: 5,
  /** Days back to the first class day of the term. Tuesday of week 1. */
  startsDaysAgo: 96,
  /** Days forward to the last class day of the term. */
  endsInDays: 32,
  name: "Semester 5 · 2026-27",
} as const;

export interface DemoComponent {
  classId: number;
  type: "Lecture" | "Practical" | "Tutorial";
  /**
   * Portal `className`. Lectures are whole-section; practicals and tutorials
   * are half-sections, which is why their resource lists can differ.
   */
  className: string;
  /**
   * One character per weekly session, oldest first: "P" present, "A" absent,
   * "M" medical leave (doesn't count), null not yet marked. A `null` is almost
   * always the most recent session — marking lags behind attendance.
   */
  history: Array<"P" | "A" | "M" | null>;
}

const SECTION = "B.Tech CSE '24 · Section A";

export interface DemoCourse {
  courseId: number;
  courseName: string;
  courseCode: string;
  components: DemoComponent[];
}

/**
 * Attendance is deliberately varied: one course in the amber "watch" band, one
 * in the rose "risk" band, the rest comfortably green. The most recent session
 * of two courses is unmarked so the "N unmarked" badge appears.
 */
export const DEMO_COURSES: DemoCourse[] = [
  {
    courseId: 501,
    courseName: "Operating Systems",
    courseCode: "CSE301",
    components: [
      {
        classId: 9501,
        type: "Lecture",
        className: SECTION,
        history: ["P", "P", "P", "P", "A", "P", "P", "P", "P", "P", "P", "P", "P", "M", "P", "P", "P", "P", "P", "P"],
      },
      {
        classId: 9502,
        type: "Practical",
        className: "B.Tech CSE '24 · Section A · Group 1",
        history: ["P", "P", "P", "P", "P", "P", "A", "P", "P", "P"],
      },
    ],
  },
  {
    courseId: 502,
    courseName: "Computer Networks",
    courseCode: "CSE302",
    components: [
      {
        classId: 9503,
        type: "Lecture",
        className: SECTION,
        history: ["P", "P", "A", "P", "P", "P", "P", "P", "P", "A", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
      },
      {
        classId: 9504,
        type: "Practical",
        className: "B.Tech CSE '24 · Section A · Group 1",
        history: ["P", "P", "P", "P", "A", "P", "P", "P", "P", null],
      },
    ],
  },
  {
    courseId: 503,
    courseName: "Database Management Systems",
    courseCode: "CSE303",
    components: [
      {
        classId: 9505,
        type: "Lecture",
        className: SECTION,
        history: ["P", "A", "P", "A", "A", "P", "P", "A", "P", "P", "P", "A", "P", "P", "P", "P", "P", "A", "P", "P"],
      },
      {
        classId: 9506,
        type: "Practical",
        className: "B.Tech CSE '24 · Section A · Group 1",
        history: ["P", "P", "P", "P", "P", "A", "P", "P", "P", "P"],
      },
    ],
  },
  {
    courseId: 504,
    courseName: "Compiler Design",
    courseCode: "CSE304",
    components: [
      {
        classId: 9507,
        type: "Lecture",
        className: SECTION,
        history: ["A", "P", "A", "A", "P", "A", "P", "A", "M", "A", "P", "P", "A", "P", "A", "P"],
      },
      {
        classId: 9508,
        type: "Tutorial",
        className: "B.Tech CSE '24 · Section A · Group 2",
        history: ["P", "A", "A", "P", "A", "P", null],
      },
    ],
  },
  {
    courseId: 505,
    courseName: "Design & Analysis of Algorithms",
    courseCode: "CSE305",
    components: [
      {
        classId: 9509,
        type: "Lecture",
        className: SECTION,
        history: ["P", "P", "P", "A", "P", "P", "P", "P", "A", "P", "P", "P", "P", "P", "P", "M", "P", "P", "P"],
      },
      {
        classId: 9512,
        type: "Tutorial",
        className: "B.Tech CSE '24 · Section A · Group 1",
        history: ["P", "P", "P", "A", "P", "P", "P", "P", null],
      },
    ],
  },
  {
    courseId: 506,
    courseName: "Software Engineering",
    courseCode: "CSE306",
    components: [
      {
        classId: 9510,
        type: "Lecture",
        className: SECTION,
        history: ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "A", "P"],
      },
      {
        classId: 9511,
        type: "Tutorial",
        className: "B.Tech CSE '24 · Section A · Group 2",
        history: ["P", "P", "P", "P", "P", "P"],
      },
    ],
  },
];

export interface DemoAssignment {
  id: number;
  classId: number;
  name: string;
  /** Hours from now (negative = overdue). Only the day is used unless it is overdue. */
  dueInHours: number;
  submissionType: "upload" | "physical";
  isRejected?: boolean;
}

export const DEMO_ASSIGNMENTS: DemoAssignment[] = [
  {
    id: 7001,
    classId: 9502,
    name: "OS Lab — Report on process scheduling",
    dueInHours: 30,
    submissionType: "upload",
  },
  {
    id: 7002,
    classId: 9503,
    name: "Tutorial 4 — TCP congestion control problems",
    dueInHours: 60,
    submissionType: "upload",
  },
  {
    id: 7003,
    classId: 9505,
    name: "Assignment 2 — Query optimisation on PostgreSQL",
    dueInHours: 108,
    submissionType: "upload",
  },
  {
    id: 7004,
    classId: 9507,
    name: "Parser construction — LL(1) table worksheet",
    dueInHours: -20,
    submissionType: "physical",
    isRejected: true,
  },
  {
    id: 7005,
    classId: 9501,
    name: "Case study — Deadlock detection in Linux",
    dueInHours: 180,
    submissionType: "upload",
  },
  {
    id: 7006,
    classId: 9506,
    name: "DBMS Lab — Normalisation audit of a sample schema",
    dueInHours: 228,
    submissionType: "upload",
  },
  {
    id: 7007,
    classId: 9509,
    name: "Problem set 5 — Dynamic programming",
    dueInHours: 300,
    submissionType: "upload",
  },
  {
    id: 7008,
    classId: 9510,
    name: "Sprint 2 — Requirements document v1",
    dueInHours: 396,
    submissionType: "upload",
  },
  {
    id: 7009,
    classId: 9504,
    name: "Wireshark lab — Analysing a DNS handshake",
    dueInHours: 492,
    submissionType: "upload",
  },
  {
    id: 7010,
    classId: 9511,
    name: "Tutorial 3 — UML case study review",
    dueInHours: 612,
    submissionType: "physical",
  },
];

export interface DemoResource {
  id: number;
  classId: number;
  name: string;
  mediaType: string;
  /** Bytes. `null` for links. */
  size: number | null;
  /** Web links store a `urlName` and `weblink` instead of a file. */
  weblink?: true;
  /** Module / session context shown under the name. */
  module: string;
  session: string;
  /** Hours ago the portal last saw it change (`modifiedTimestamp`). */
  updatedHoursAgo: number;
}

export const DEMO_RESOURCES: DemoResource[] = [
  // Operating Systems
  { id: 8001, classId: 9501, name: "UNIT III — Virtual memory & paging.pdf", mediaType: "application/pdf", size: 2_412_902, module: "UNIT III", session: "Session 4", updatedHoursAgo: 2 },
  { id: 8002, classId: 9501, name: "Process synchronisation slides.pptx", mediaType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", size: 5_140_480, module: "UNIT II", session: "Session 2", updatedHoursAgo: 27 },
  { id: 8003, classId: 9501, name: "Lab manual — Scheduling algorithms.pdf", mediaType: "application/pdf", size: 1_884_160, module: "UNIT II", session: "Session 1", updatedHoursAgo: 96 },
  { id: 8004, classId: 9502, name: "xv6 — adding a system call.mp4", mediaType: "video/mp4", size: 84_934_656, module: "UNIT II", session: "Lab 3", updatedHoursAgo: 74 },
  { id: 8005, classId: 9502, name: "OS lab reference material", mediaType: "link", size: null, weblink: true, module: "Reference", session: "Suggested reading", updatedHoursAgo: 190 },

  // Computer Networks
  { id: 8006, classId: 9503, name: "UNIT II — Routing protocols.pdf", mediaType: "application/pdf", size: 3_204_608, module: "UNIT II", session: "Session 3", updatedHoursAgo: 9 },
  { id: 8007, classId: 9503, name: "Subnetting worksheet.docx", mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 412_160, module: "UNIT II", session: "Session 3", updatedHoursAgo: 30 },
  { id: 8008, classId: 9503, name: "Mid-sem question paper — 2025.pdf", mediaType: "application/pdf", size: 1_142_784, module: "Assessment", session: "Past paper", updatedHoursAgo: 210 },
  { id: 8009, classId: 9504, name: "Wireshark capture — lab 2.pcapng", mediaType: "application/octet-stream", size: 892_928, module: "UNIT I", session: "Lab 2", updatedHoursAgo: 121 },

  // DBMS
  { id: 8010, classId: 9505, name: "UNIT II — Normalisation & functional dependencies.pdf", mediaType: "application/pdf", size: 2_002_944, module: "UNIT II", session: "Session 4", updatedHoursAgo: 5 },
  { id: 8011, classId: 9505, name: "Transactions & concurrency control.pptx", mediaType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", size: 3_774_464, module: "UNIT III", session: "Session 1", updatedHoursAgo: 52 },
  { id: 8012, classId: 9505, name: "ER modelling recap.pdf", mediaType: "application/pdf", size: 1_468_416, module: "UNIT I", session: "Session 6", updatedHoursAgo: 300 },
  { id: 8013, classId: 9506, name: "Sample schema — Library system.sql", mediaType: "application/sql", size: 64_512, module: "UNIT I", session: "Lab 1", updatedHoursAgo: 360 },
  { id: 8014, classId: 9506, name: "PostgreSQL indexing playground", mediaType: "link", size: null, weblink: true, module: "Reference", session: "Practice", updatedHoursAgo: 430 },

  // Compiler Design
  { id: 8015, classId: 9507, name: "UNIT I — Lexical analysis.pdf", mediaType: "application/pdf", size: 2_883_584, module: "UNIT I", session: "Session 2", updatedHoursAgo: 15 },
  { id: 8016, classId: 9507, name: "Grammar left-recursion elimination — worked examples.pdf", mediaType: "application/pdf", size: 738_304, module: "UNIT II", session: "Session 1", updatedHoursAgo: 140 },
  { id: 8017, classId: 9508, name: "Tutorial 2 — FIRST and FOLLOW sets.docx", mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 186_368, module: "UNIT II", session: "Tutorial 2", updatedHoursAgo: 260 },

  // DAA
  { id: 8018, classId: 9509, name: "UNIT III — Greedy vs dynamic programming.pdf", mediaType: "application/pdf", size: 2_140_160, module: "UNIT III", session: "Session 3", updatedHoursAgo: 40 },
  { id: 8019, classId: 9509, name: "Complexity cheat-sheet.pdf", mediaType: "application/pdf", size: 509_952, module: "Reference", session: "Cheat sheet", updatedHoursAgo: 480 },

  // Software Engineering
  { id: 8020, classId: 9510, name: "UNIT II — Agile & scrum notes.docx", mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 337_920, module: "UNIT II", session: "Session 2", updatedHoursAgo: 22 },
  { id: 8021, classId: 9510, name: "Sprint planning template.xlsx", mediaType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 118_784, module: "UNIT II", session: "Session 3", updatedHoursAgo: 150 },
  { id: 8022, classId: 9511, name: "UML case study — hospital management.pdf", mediaType: "application/pdf", size: 1_724_416, module: "UNIT I", session: "Tutorial 3", updatedHoursAgo: 330 },
];

/** Approved / unapproved leave counts shown on the overview. */
export const DEMO_LEAVES = { approved: 2, unapproved: 1 } as const;

/**
 * Earlier semesters, shown in the term switcher. Attendance for them is scaled
 * from the current term, so there is no second fixture to keep in sync.
 */
export const DEMO_PAST_TERMS = [
  { id: 4, name: "Semester 4 · 2025-26", startsDaysAgo: 260, endsDaysAgo: 150 },
  { id: 3, name: "Semester 3 · 2025-26", startsDaysAgo: 420, endsDaysAgo: 290 },
] as const;
