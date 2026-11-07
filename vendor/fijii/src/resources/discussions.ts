import type { HttpClient } from "../http.js";
import type { Discussion, DiscussionListResponse } from "../types.js";

/**
 * Classroom discussion forum.
 *
 * Gotcha: `perPage` is mandatory — omitting it yields
 * `500 "Invalid per Page Count"`.
 */
export class DiscussionsResource {
  constructor(private readonly http: HttpClient) {}

  list(classId: number, page = 1, perPage = 20) {
    return this.http.get<DiscussionListResponse>("/rest/classroomDiscussions", {
      query: { classId, page, perPage },
    });
  }

  detail(discussionId: number) {
    return this.http.get<Discussion>(`/rest/classroomDiscussions/discussion/${discussionId}`);
  }

  create(body: { classId: number; title: string; description: string }) {
    return this.http.post<Discussion>("/rest/classroomDiscussions/discussion", { body });
  }

  comment(discussionId: number, body: { comment: string; replyToCommentId?: number }) {
    return this.http.post<unknown>("/rest/classroomDiscussions/discussion/comment", {
      body: { discussionId, ...body },
    });
  }

  upvoteDiscussion(discussionId: number) {
    return this.http.put<unknown>("/rest/classroomDiscussions/discussion/upvote", { body: { discussionId } });
  }

  upvoteComment(commentId: number) {
    return this.http.put<unknown>("/rest/classroomDiscussions/discussion/comment/upvote", {
      body: { commentId },
    });
  }
}
