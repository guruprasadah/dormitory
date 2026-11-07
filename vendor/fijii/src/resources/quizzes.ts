import type { HttpClient } from "../http.js";
import { DigiiError } from "../errors.js";
import type {
  AssessmentResult,
  QuizAttemptQuestions,
  QuizListResponse,
  QuizResultOverview,
  QuizStatus,
  QuizSummary,
} from "../types.js";

export interface QuizListOptions {
  status?: QuizStatus;
  search?: string;
  /** Quick filters, joined into `quickFilters=a,b`. */
  quickFilters?: string[];
  page?: number;
  perPage?: number;
}

/**
 * Classroom quizzes (V2 "quizQuestionnaire" schema).
 *
 * Important: the list lives at
 *   `/api/classroomV2/quizQuestionnaire/student/{classId}/list`
 * NOT `/api/classroomV2/quiz/list/{classId}` (that route 400s with
 * "requires the latest version of the app"). Quiz V1 (`/rest/classroom/quizzes/v1`)
 * is retired (`UNSUPPORTED_QUIZ_V1`).
 */
export class QuizzesResource {
  private readonly base = "/api/classroomV2/quizQuestionnaire/student";

  constructor(
    private readonly http: HttpClient,
    private readonly ukidProvider: () => number | Promise<number>,
  ) {}

  private async ukid(): Promise<number> {
    return this.ukidProvider();
  }

  list(classId: number, options: QuizListOptions = {}) {
    return this.http.get<QuizListResponse>(`${this.base}/${classId}/list`, {
      query: {
        status: options.status,
        search: options.search,
        quickFilters: options.quickFilters?.length ? options.quickFilters.join(",") : undefined,
        page: options.page ?? 1,
        perPage: options.perPage ?? 15,
      },
    });
  }

  /** All quizzes for a class, paging until `totalCount` is reached. */
  async all(classId: number, options: QuizListOptions = {}): Promise<QuizSummary[]> {
    const perPage = options.perPage ?? 15;
    const out: QuizSummary[] = [];
    let page = 1;
    for (;;) {
      const data = await this.list(classId, { ...options, page, perPage });
      const batch = data.quizzes ?? [];
      out.push(...batch);
      if (out.length >= (data.totalCount ?? 0) || batch.length === 0) break;
      page += 1;
      if (page > 100) break;
    }
    return out;
  }

  details(quizId: number) {
    return this.http.get<QuizSummary>(`${this.base}/${quizId}/details`);
  }

  /** Attempt in progress, or `null` when none (backend returns 404). */
  async currentAttempt(quizId: number) {
    try {
      return await this.http.get<unknown>(`${this.base}/${quizId}/attempt/current`);
    } catch (err) {
      if (err instanceof DigiiError && err.status === 404) return null;
      throw err;
    }
  }

  attemptHistory(quizId: number) {
    return this.http.get<unknown>(`${this.base}/${quizId}/attempt/history`);
  }

  startAttempt(quizId: number) {
    return this.http.post<unknown>(`${this.base}/${quizId}/attempt/start`);
  }

  attemptQuestions(quizId: number, attemptNo: number) {
    return this.http.get<QuizAttemptQuestions>(`${this.base}/${quizId}/attempt/${attemptNo}/questions`);
  }

  saveResponse(quizId: number, attemptNo: number, body: unknown) {
    return this.http.post<unknown>(`${this.base}/${quizId}/attempt/${attemptNo}/responses`, { body });
  }

  accessCode(quizId: number) {
    return this.http.get<unknown>(`/api/classroomV2/quiz/accessCode/student/${quizId}`);
  }

  async verifyAccessCode(quizId: number, code: string) {
    return this.http.get<boolean>(`/api/classroomV2/quiz/accessCode/student/${quizId}/verifyAccessCode`, {
      query: { accessCodeByStudent: code },
    });
  }

  resultOverview(quizId: number) {
    return this.ukid().then((ukid) =>
      this.http.get<QuizResultOverview>(`${this.base}/result/${quizId}/${ukid}/overview`),
    );
  }

  resultAttempt(quizId: number, attemptNo: number) {
    return this.ukid().then((ukid) =>
      this.http.get<unknown>(`${this.base}/result/${quizId}/${ukid}/attempt/${attemptNo}`),
    );
  }
}

export class GradebookResource {
  constructor(private readonly http: HttpClient) {}

  /** The student's own assessment result row for a class. */
  assessmentResult(classId: number) {
    return this.http.get<AssessmentResult>("/rest/gradebook/v2/assessmentResult", {
      query: { classId },
    });
  }
}
