/**
 * Domain types for the Digiicampus (CollPoll) student portal.
 *
 * These mirror payloads verified live against a production Digiicampus tenant.
 * Fields observed as `null`/`0` inconsistently are typed as optional + nullable
 * on purpose — the backend is not clean.
 *
 * Dates are naive local strings in the college timezone (Asia/Kolkata),
 * formatted `YYYY-MM-DD HH:mm:ss` (see {@link parseDigiiDate}).
 */

/** Naive local datetime string, e.g. `"2026-11-10 23:00:00"`. */
export type DigiiDateTime = string;
/** Naive local date string, e.g. `"2026-08-19"`. */
export type DigiiDate = string;

// --------------------------------------------------------------------------- //
// Auth
// --------------------------------------------------------------------------- //

export interface JwtClaims {
  iss: string;
  sub: string;
  ukid: number;
  userType: string;
  integrationRoles: string[];
  integrationFeatureFlags: string[];
  hubName: string;
  tenantName: string;
  instituteUrl: string;
  collegeId: number;
  jti: string;
  iat: number;
  exp: number;
}

// --------------------------------------------------------------------------- //
// Institution
// --------------------------------------------------------------------------- //

export interface CollegeConfig {
  id: number;
  name: string;
  photo: string | null;
  photoMediaId: number | null;
  address: string | null;
  tabTitle: string | null;
  backgroundColor: string | null;
  fontColor: string | null;
  themeColor: string | null;
  fontSize: string | null;
  collegeLogo: string | null;
  collegeLogoMediaId: number | null;
  logoPosition: string | null;
  collegeUrl: string;
  currency: string;
  timezone: string;
  showLogo: boolean;
  showCollegeName: boolean;
  collegeInitials: string;
  currencyCode: string | null;
  countryCode: string | null;
  captchaEnabled: boolean;
  analyticsId: string | null;
  collegeUrlWithoutProtocol: string;
}

export interface CollegeTime {
  timeZone: string;
  id: number;
  currentTime: DigiiDateTime;
  name: string;
}

export interface Feature {
  feature: string;
  enabled: boolean;
  defaultName: string;
  featureCustomName: string;
}

export interface AuthenticatedUser {
  ukid: number;
  name: string;
  registrationId: string;
  email: string;
  userType: string;
  collegeId: number;
  collegeName: string;
  collegeInitials: string;
  programmeId: number;
  programmeName: string;
  departmentId: number;
  departmentName: string;
  batchYear: number;
  year: number;
  sectionId: number;
  sectionName: string;
  status: string;
  gender: string | null;
  photo: string | null;
  personalPhoto: string | null;
  officialPhotoUrl: string | null;
  phone: string | null;
  active: boolean;
  mfaEnabled: boolean;
  timeZone: string | null;
  [key: string]: unknown;
}

export interface AuthenticationDetails {
  token: string;
  user: AuthenticatedUser;
  expTime: number;
  featureFlags: unknown[];
  mfaEnabled: boolean;
  blocked: boolean;
  firstLogin: boolean;
  [key: string]: unknown;
}

// --------------------------------------------------------------------------- //
// Classes
// --------------------------------------------------------------------------- //

/** `courseComponentTypeName` — from /api/structure/courseComponentType. */
export type ComponentTypeName =
  | "Lecture"
  | "Practical"
  | "Tutorial"
  | "Project"
  | "Workshop"
  | "Studio"
  | "DOAP"
  | "Clinical Posting"
  | "Self Directed Learning"
  | "Internship"
  | "Experiential Learning"
  | (string & {});

export interface ClassroomSyncRule {
  version: number;
  cmsSyncRule: string;
}

/** Item from `GET /rest/classes/v1/classroom`. */
export interface Classroom {
  id: number;
  courseId: number;
  courseVersionId: number;
  version: number;
  courseName: string;
  courseCode: string;
  courseCredits: number | null;
  description: string | null;
  departmentId: number | null;
  departmentName: string | null;
  termId: number | null;
  sessionId: number | null;
  className: string;
  referenceId: string | null;
  sectionId: number | null;
  batch: string;
  faculty: string | null;
  facultyUkid: number | null;
  courseComponentTypeId: number;
  courseComponentTypeName: ComponentTypeName;
  isSubstitute: boolean;
  classroomSyncRule: ClassroomSyncRule | null;
  isSyncedWithExternalProvider: boolean;
  externalProviderSyncedTimestamp: string | null;
  termCourseId: number | null;
}

export interface ClassPermission {
  res: "SUCCESS" | "FAILURE";
}

export interface CourseComponentType {
  id: number;
  name: ComponentTypeName;
  description: string | null;
  isDeleted: boolean;
  isFixedComponent: boolean;
  isNormalizationEnabled: boolean;
}

// --------------------------------------------------------------------------- //
// Assignments
// --------------------------------------------------------------------------- //

export type SubmissionType = "upload" | "physical" | (string & {});
export type AssignmentType = "CLASS" | "GROUP" | "INDIVIDUAL" | (string & {});

export interface RubricLevel {
  id?: number;
  name?: string;
  description?: string | null;
  marks?: number | null;
  [key: string]: unknown;
}

export interface RubricCriteria {
  id?: number;
  name?: string;
  description?: string | null;
  levels?: RubricLevel[];
  [key: string]: unknown;
}

export interface AssignmentGroup {
  id?: number | null;
  title: string | null;
  description: string | null;
  submissionType: SubmissionType | null;
  groupSubmission: AssignmentSubmission[];
  [key: string]: unknown;
}

export interface AssignmentSubmission {
  id: number;
  mediaId: number | null;
  turnitinId: number | null;
  isSubmitted: boolean;
  isDraft: boolean;
  isRejected: boolean;
  submissionStatus: string | null;
  similarityReportStatus: string | null;
  [key: string]: unknown;
}

export interface Assignment {
  id: number;
  name: string;
  description: string | null;
  startDate: DigiiDateTime | null;
  dueDate: DigiiDateTime | null;
  groupDueDate: DigiiDateTime | null;
  classId: number;
  moduleId: number | null;
  lessonId: number | null;
  creatorUkid: number | null;
  createdTimestamp: DigiiDateTime | null;
  modifiedTimestamp: DigiiDateTime | null;
  publishDatetime: DigiiDateTime | null;
  publisherUkid: number | null;
  gradePublishTimestamp: DigiiDateTime | null;
  submissionType: SubmissionType;
  type: AssignmentType;
  sourceType: string | null;
  isSubmitted: boolean;
  dueDatePassed: boolean;
  submittedOn: DigiiDateTime | null;
  isGraded: boolean;
  isAssignmentGraded: boolean;
  isRejected: boolean | null;
  rejectionLog: { updatedDeadline?: string | null; [key: string]: unknown } | null;
  hasFacultyEvaluated: boolean | null;
  showGrade: boolean;
  grade: number | string | null;
  remark: string | null;
  submissions: AssignmentSubmission[] | null;
  resources: AssignmentResource[] | null;
  resourceCount: number | null;
  submissionCount: number | null;
  submissionSummary: unknown;
  submissionDetails: unknown;
  rubricGrading: boolean;
  rubricLevels: RubricLevel[] | null;
  rubricCriterias: RubricCriteria[] | null;
  minimumMarks: number | null;
  maximumMarks: number | null;
  assignmentMarks: number | null;
  assignmentCourseOutcomeList: unknown[] | null;
  assignmentCourseOutcome: unknown;
  topicLevelOutcomesList: unknown[] | null;
  groups: AssignmentGroup[] | null;
  turnitinEnabled: boolean;
  totalTurnitinSubmissions: number | null;
  questionnaireId: number | null;
  parentAssignmentId: number | null;
  order: number | null;
  draft: boolean;
  deleted: boolean;
  className: string | null;
  sectionName: string | null;
  programmeName: string | null;
  semester: string | null;
  relatedClass: unknown;
  assessmentId: number | null;
  limitSubmissionsCount: number | null;
  unMappedStudentCount: number | null;
}

/** Resource attached to an assignment/session/lesson. */
export interface AssignmentResource {
  id: number;
  lessonId: number | null;
  classId: number | null;
  sessionId: number | null;
  assignmentId: number | null;
  mediaId: number;
  mediaName: string;
  mediaType: string;
  /** Signed CloudFront URL — expires (~1h). Re-fetch rather than cache. */
  mediaUrl: string;
  mediaDownloadUrl: string | null;
  streamingLocation: string | null;
  videoThumbnail: string | null;
  canStream: boolean;
  questionId: number | null;
  urlId: number | null;
  urlName: string | null;
  weblink: string | null;
  createdTimestamp: string | null;
  modifiedTimestamp: string | null;
  documentId: number | null;
  mediaError: string | null;
  [key: string]: unknown;
}

export interface AssignmentListResponse {
  res: {
    className: string;
    sectionName: string | null;
    programmeName: string | null;
    semester: string | null;
    upcomingAssignments: Assignment[];
    previousAssignments: Assignment[];
    draftAssignments: Assignment[];
    totalUpcomingCount: number;
    totalPreviousCount: number;
    totalDraftCount: number;
  };
  totalUpcomingAssignments: number;
  totalPreviousAssignments: number;
  totalDraftAssignments: number;
  totalPagesUpcoming: number;
  totalPagesPrevious: number;
  totalPagesDraft: number;
  page: number;
  pageSize: number;
}

// --------------------------------------------------------------------------- //
// Modules / sessions / course work
// --------------------------------------------------------------------------- //

export interface Module {
  id: number;
  classId: number;
  module: string;
  title: string;
  description: string | null;
  courseSyllabusId: number | null;
  order: number;
  default: boolean;
}

export interface Session {
  id: number;
  classId: number;
  moduleId: number;
  title: string;
  description: string | null;
  resourceCount: number | null;
  type: string;
  slotList: SessionSlot[] | null;
  sessionOrder: number | null;
  lessonId: number | null;
  isCompleted: boolean | null;
}

export interface SessionSlot {
  id: number;
  start: DigiiDateTime;
  end: DigiiDateTime;
  cancelled: boolean;
  online: boolean;
  onlineService: string | null;
  onlineClassUrl: string | null;
  onlineClassDetails: unknown;
  timetableLessonSettingId: number | null;
  registrationId: string | null;
  attendanceTaken: boolean | null;
}

export interface ModuleWithComponents {
  module: Module;
  componentsList: Array<
    | { componentType: "SESSION"; componentObject: Session }
    | { componentType: string; componentObject: unknown }
  >;
}

export interface SessionListResponse {
  sessions: Session[];
  listCount: number;
}

export interface SessionDetail extends Omit<Session, "slotList" | "resourceCount"> {
  module: Module | null;
  facultyId: number;
  slotId: number | null;
  start: DigiiDateTime | null;
  end: DigiiDateTime | null;
  completed: boolean | null;
  requiresAttendance: boolean;
  attendanceTaken: boolean;
  resources: AssignmentResource[];
  online: boolean;
  onlineService: string | null;
  onlineClassUrl: string | null;
  onlineClassDetails: unknown;
  onlineClassId: number | null;
  lessonTimings: unknown;
  videoMediaId: number | null;
  videoMedia: AssignmentResource;
  videoLink: string | null;
  createdBy: number | null;
  createdTimestamp: string | null;
  isSubstitute: boolean | null;
  [key: string]: unknown;
}

export interface ClassResource {
  id: number;
  moduleId: number | null;
  moduleOrder: number | null;
  moduleTitle: string | null;
  moduleName: string | null;
  sessionId: number | null;
  sessionOrder: number | null;
  sessionName: string | null;
  mediaId: number;
  mediaName: string;
  mediaUrl: string;
  mediaDownloadUrl: string | null;
  videoThumbnail: string | null;
  streamingLocation: string | null;
  canStream: boolean;
  size: number;
  mediaType: string;
  urlId: number | null;
  urlName: string | null;
  weblink: string | null;
  createdTimestamp: string | null;
  modifiedTimestamp: string | null;
  mediaError: string | null;
}

export interface CoursePlannerSession
  extends Omit<
    SessionDetail,
    "module" | "resources" | "resourceCount" | "slotList" | "type" | "lessonId" | "isCompleted"
  > {
  module: string | null;
  resources: AssignmentResource[];
  type: string;
  completed: boolean;
  sessionOrder: number;
  [key: string]: unknown;
}

export interface CoursePlanner {
  classId: number;
  courseId: number;
  courseName: string;
  sessions: CoursePlannerSession[];
}

// --------------------------------------------------------------------------- //
// Quizzes (V2 — quizQuestionnaire)
// --------------------------------------------------------------------------- //

/** From the student quiz list `status` param. */
export type QuizStatus = "ONGOING" | "SCHEDULED" | "CLOSED";

export interface QuizSummary {
  id: number;
  title: string;
  description: string | null;
  maxMarks: number | null;
  status?: string;
  quizStartTime?: DigiiDateTime | null;
  quizEndTime?: DigiiDateTime | null;
  quizDuration?: string | null;
  hasQuestionnaire?: boolean;
  attemptsCount?: number | null;
  [key: string]: unknown;
}

export interface QuizListResponse {
  quizzes: QuizSummary[];
  totalCount: number;
  page: number;
  perPage: number;
  ongoingCount?: number;
  scheduledCount?: number;
  closedCount?: number;
}

export interface QuizQuestion {
  id: number;
  questionType: string;
  question: string;
  marks: number | null;
  options: Array<{ id: number; option: string; [key: string]: unknown }> | null;
  [key: string]: unknown;
}

export interface QuizAttemptQuestions {
  quiz: QuizSummary;
  attemptNo: number;
  questions: QuizQuestion[];
  [key: string]: unknown;
}

export interface QuizResultOverview {
  attempts: Array<{
    attemptNo: number;
    startedAt?: DigiiDateTime | null;
    submittedAt?: DigiiDateTime | null;
    score?: number | null;
    maxMarks?: number | null;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

// --------------------------------------------------------------------------- //
// Gradebook
// --------------------------------------------------------------------------- //

export interface GradebookStudent {
  ukid: number;
  name: string;
  photo: string | null;
  userType: string;
  salutation: string | null;
  registrationId: string;
  programmeName: string;
  departmentName: string;
  sectionName: string;
  yearName: string;
  rollNo: string | null;
  email: string;
  studentCourseType: string | null;
  officialPhotoUrl: string | null;
}

export interface AssessmentResult {
  name: string;
  registrationId: string;
  email: string;
  rollNumber: string | null;
  intRollNumber: string | null;
  sectionName: string;
  student: GradebookStudent;
  grades: unknown[];
  assessmentComponentResults: unknown[];
  result: {
    value: number;
    publishMarks: boolean;
    [key: string]: unknown;
  };
}

// --------------------------------------------------------------------------- //
// Attendance
// --------------------------------------------------------------------------- //

export interface Term {
  id: number;
  name: string;
  starts: DigiiDate;
  ends: DigiiDate;
  classesTill: DigiiDate | null;
  sequence: number | null;
  academicYearStart: number | null;
  academicYearEnd: number | null;
  allProgrammes: boolean;
  programmes: unknown;
  nextTermName: string | null;
  nextTermId: number | null;
  previousTermName: string | null;
  previousTermId: number | null;
  collegeId: number;
  active: boolean;
  past: boolean;
  future: boolean;
}

export interface TermListResponse {
  terms: Term[];
  count: number;
}

export interface AttendanceStatus {
  id: number;
  status: string;
  colorCode: string;
  description: string | null;
  collegeId: number | null;
  onlyForConsole: boolean;
  abbreviation: string | null;
  doNotConsiderForAttendance: boolean;
  throughConsole: boolean | null;
  finalStatus: string | null;
  approvalStatus: string | null;
  deleted: boolean;
  present: boolean;
  count?: number;
}

export interface AttendanceSettings {
  id: number;
  editAfterSubmission: boolean;
  revokeAfterSubmission: boolean;
  considerOnlineClassParticipation: boolean;
  minimumOnlineClassParticipationPercentage: number;
  collegeId: number;
  considerAttendanceFrom: string;
  lateAttendanceEnabled: boolean;
  lateAttendanceSetting: string;
  lateAttendanceTimeMinutes: number | null;
  lateAttendanceHours: number;
  lateAttendanceMinutes: number;
  biometricLessonActivation: boolean;
  lessonBiometricPunchConsiderationPercentage: number;
  defaultAttendanceStatusId: number;
  slotFacultyControl: boolean;
  bulkMarkStatus: boolean;
  defaultAttendanceStatus: AttendanceStatus | null;
}

/** One per-lesson attendance record. `status === null` means NOT YET MARKED. */
export interface AttendanceRecord {
  id: number;
  status: string | null;
  colorCode: string | null;
  description: string | null;
  collegeId: number | null;
  onlyForConsole: boolean;
  abbreviation: string | null;
  doNotConsiderForAttendance: boolean;
  throughConsole: boolean | null;
  finalStatus: string | null;
  approvalStatus: string | null;
  deleted: boolean;
  classAttendanceId: number | null;
  ukid: number;
  lessonId: number;
  classId: number;
  courseId: number;
  statusId: number | null;
  createdTimestamp: DigiiDateTime | null;
  updatedTimestamp: DigiiDateTime | null;
  attendanceTimestamp: DigiiDateTime | null;
  throughBiometric: boolean;
  biometricPunchLogId: number | null;
  attendanceMarkedFrom: string | null;
  lessonStartTime: DigiiDateTime;
  lessonEndTime: DigiiDateTime;
  appliedExceptionLogId: number | null;
  firstTimeAttendance: boolean;
  rollNumber: string | null;
  present: boolean;
}

export interface AttendanceTotals {
  totalPresent: number;
  totalAbsent: number;
  totalDoNotConsiderForAttendance: number;
  totalClasses: number;
  percentage: number;
  approvedLeaves: number;
  unapprovedLeaves: number;
  sessionsBeforeJoiningClassGroup: number;
}

export interface AttendanceComponent extends AttendanceTotals {
  courseId: number;
  courseName: string;
  courseComponentTypeId: number;
  courseComponentTypeName: ComponentTypeName;
  courseCode: string | null;
  classId: number;
  className: string;
  startDate: DigiiDate | null;
  endDate: DigiiDate | null;
  studentDateOfJoining: string | null;
  user: unknown;
  statusCounts: AttendanceStatus[];
  attendance: AttendanceRecord[];
}

export interface CourseAttendance extends AttendanceTotals {
  courseId: number;
  courseName: string;
  courseVersionId: number;
  version: number;
  courseCode: string | null;
  courseCredits: number | null;
  departmentId: number | null;
  departmentName: string | null;
  sessionId: number | null;
  components: AttendanceComponent[];
}

export interface TermAttendance extends AttendanceTotals {
  termId: number;
  courseAttendance: CourseAttendance[];
}

/** Body for an attendance-correction (exception) request. */
export interface AttendanceExceptionRequest {
  termId: number;
  ukids: number[];
  performedByUkid: number;
  statusId: number;
  startDate: DigiiDate;
  endDate: DigiiDate;
  isEntireDay: boolean;
  startTime: DigiiTime;
  endTime: DigiiTime;
  remark: string;
  attachments: Array<{ mediaId: number; ukid: number }>;
}

/** `HH:mm:ss`, e.g. `"09:00:00"`. */
export type DigiiTime = string;

// --------------------------------------------------------------------------- //
// Discussion forum
// --------------------------------------------------------------------------- //

export interface Discussion {
  id: number;
  title: string;
  description: string | null;
  classId: number;
  creatorUkid: number | null;
  createdTimestamp: DigiiDateTime | null;
  commentCount?: number | null;
  upvoteCount?: number | null;
  [key: string]: unknown;
}

export interface DiscussionListResponse {
  discussions: Discussion[];
  count: number;
  currentTime: DigiiDateTime;
  canUserCreateDiscussionForum: boolean;
}

// --------------------------------------------------------------------------- //
// Errors
// --------------------------------------------------------------------------- //

/** Standard Spring error body returned by Digiicampus for non-2xx responses. */
export interface DigiiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  object?: unknown;
}
