/**
 * fijii — a TypeScript SDK for the Digiicampus (CollPoll) student portal.
 *
 * ```ts
 * import { Fijii } from "fijii";
 *
 * const fijii = new Fijii({ token: () => process.env.DIGII_TOKEN! });
 * const classes = await fijii.classes.list();
 * const pending = await fijii.pendingAssignments();
 * const attendance = await fijii.attendanceSummary();
 * ```
 */

export { Fijii } from "./client.js";
export type { FijiiConfig, PendingAssignment, PendingAssignmentsOptions } from "./client.js";

export { HttpClient } from "./http.js";
export type { HttpClientConfig, RequestOptions, QueryParams, QueryValue } from "./http.js";

export { DigiiError, DigiiParseError } from "./errors.js";
export type { DigiiErrorKind } from "./errors.js";

export { parseDigiiDate, formatDigiiDate, isPast, daysUntil } from "./dates.js";

export { AuthResource, InstitutionResource, decodeJwt, assertValidToken } from "./resources/institution.js";
export { ClassesResource } from "./resources/classes.js";
export type { AssignmentBuckets, AssignmentListOptions } from "./resources/classes.js";
export { QuizzesResource, GradebookResource } from "./resources/quizzes.js";
export type { QuizListOptions } from "./resources/quizzes.js";
export {
  AttendanceResource,
  buildTermSummary,
  buildCourseSummary,
  buildComponentSummary,
} from "./resources/attendance.js";
export type { TermSummary, CourseSummary, ComponentSummary } from "./resources/attendance.js";
export { DiscussionsResource } from "./resources/discussions.js";

export * from "./types.js";
