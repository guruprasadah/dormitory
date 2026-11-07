import type { DigiiErrorBody } from "./types.js";

/**
 * Discriminated causes of failure, derived from the backend's real behaviour:
 *
 * - `unauthorized`     — 401, token expired/revoked. Re-login and refresh the token.
 * - `forbidden`        — 403 *with* a JSON body, or 403 with an empty body
 *                        (Spring role gate — e.g. student hitting a faculty route).
 * - `not-permitted`    — 400/4xx with an app error code such as
 *                        `CLASS_FACULTY_PRIVILEGE_REQUIRED`.
 * - `not-found`        — 404, route does not exist.
 * - `spa-fallback`     — 200 returning the SPA HTML (a route that does not exist).
 * - `http`             — any other non-2xx.
 * - `network`          — transport-level failure.
 * - `parse`            — response was not valid JSON.
 */
export type DigiiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "not-permitted"
  | "not-found"
  | "spa-fallback"
  | "http"
  | "network"
  | "parse";

export class DigiiError extends Error {
  readonly kind: DigiiErrorKind;
  readonly status?: number;
  /** Application error code, e.g. `CLASS_FACULTY_PRIVILEGE_REQUIRED`. */
  readonly code?: string;
  readonly path?: string;
  readonly body?: unknown;
  /** The request that failed, useful for debugging. */
  readonly method?: string;
  readonly url?: string;

  constructor(
    kind: DigiiErrorKind,
    message: string,
    opts: {
      status?: number;
      code?: string;
      path?: string;
      body?: unknown;
      method?: string;
      url?: string;
      cause?: unknown;
    } = {},
  ) {
    super(message, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = "DigiiError";
    this.kind = kind;
    this.status = opts.status;
    this.code = opts.code;
    this.path = opts.path;
    this.body = opts.body;
    this.method = opts.method;
    this.url = opts.url;
  }

  /** True when the token needs replacing. */
  get isAuthError(): boolean {
    return this.kind === "unauthorized";
  }

  /** True when the caller simply lacks the role/capability. */
  get isPermissionError(): boolean {
    return this.kind === "forbidden" || this.kind === "not-permitted";
  }

  /** Best-effort human-readable detail, preferring the app message over Spring's. */
  get detail(): string {
    const b = this.body as DigiiErrorBody | undefined;
    return b?.message || b?.error || this.message;
  }
}

/** Raised when a response is JSON but the shape is not what the SDK expects. */
export class DigiiParseError extends DigiiError {
  constructor(message: string, path: string, body: unknown) {
    super("parse", message, { path, body });
    this.name = "DigiiParseError";
  }
}
