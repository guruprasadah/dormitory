import { DigiiError, DigiiParseError } from "./errors.js";
import type { DigiiErrorBody } from "./types.js";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  query?: QueryParams;
  body?: unknown;
  /** Override/add headers for this request. */
  headers?: Record<string, string>;
  /** Abort signal. */
  signal?: AbortSignal;
}

export interface HttpClientConfig {
  /** Portal origin, e.g. `https://<your-institute>.digiicampus.com`. Required. */
  baseUrl: string;
  /**
   * Return the current JWT. Called on every request so rotated tokens are
   * picked up automatically.
   */
  getToken: () => string | Promise<string>;
  /** Extra headers added to every request (e.g. `x-data-version`). */
  defaultHeaders?: Record<string, string>;
  /** Per-request timeout in ms. Default 40_000. */
  timeoutMs?: number;
  /** Injectable fetch (for tests / non-Node runtimes). */
  fetch?: typeof fetch;
  /** Called on every request, e.g. for logging. */
  onRequest?: (info: { method: string; url: string }) => void;
}

export class HttpClient {
  readonly baseUrl: string;
  private readonly getToken: () => string | Promise<string>;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly onRequest?: (info: { method: string; url: string }) => void;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.getToken = config.getToken;
    this.defaultHeaders = config.defaultHeaders ?? {};
    this.timeoutMs = config.timeoutMs ?? 40_000;
    this.fetchImpl = config.fetch ?? globalThis.fetch;
    if (typeof this.fetchImpl !== "function") {
      throw new Error("fijii: no global fetch available; pass `fetch` explicitly (Node >= 18).");
    }
    this.onRequest = config.onRequest;
  }

  /** Build a fully-qualified URL with query params. Arrays are repeated. */
  buildUrl(path: string, query?: QueryParams): string {
    const url = new URL(path.startsWith("http") ? path : this.baseUrl + ensureLeadingSlash(path));
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        for (const v of Array.isArray(value) ? value : [value]) {
          if (v === undefined || v === null) continue;
          url.searchParams.append(key, String(v));
        }
      }
    }
    return url.toString();
  }

  /** Perform a request and return the parsed JSON body (or `undefined` for empty). */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const method = options.method ?? "GET";
    const url = this.buildUrl(path, options.query);
    const token = await this.getToken();
    if (!token) throw new DigiiError("unauthorized", "No auth token available", { path, method, url });

    const headers: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
      "Auth-Token": token,
      Referer: `${this.baseUrl}/`,
      ...this.defaultHeaders,
      ...options.headers,
    };
    const hasBody = options.body !== undefined;
    if (hasBody) headers["Content-Type"] = "application/json";

    this.onRequest?.({ method, url });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    if (options.signal) {
      if (options.signal.aborted) controller.abort();
      else options.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers,
        body: hasBody ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
        redirect: "follow",
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      throw new DigiiError("network", `Network error: ${message}`, { path, method, url, cause });
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    const body = parseBody(text, path, method, url);

    if (!response.ok) {
      throw toHttpError(response.status, body, path, method, url);
    }

    // Some unmatched /api routes return the SPA HTML with a 200.
    if (looksLikeHtml(text)) {
      throw new DigiiError("spa-fallback", `Route returned SPA HTML instead of JSON: ${path}`, {
        status: response.status,
        path,
        method,
        url,
        body: text.slice(0, 200),
      });
    }

    return body as T;
  }

  get<T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, options: Omit<RequestOptions, "method"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST" });
  }

  put<T>(path: string, options: Omit<RequestOptions, "method"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT" });
  }

  delete<T>(path: string, options: Omit<RequestOptions, "method"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

function ensureLeadingSlash(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function looksLikeHtml(text: string): boolean {
  const head = text.trimStart().slice(0, 64).toLowerCase();
  return head.startsWith("<!doctype html") || head.startsWith("<html");
}

function parseBody(text: string, path: string, method: string, url: string): unknown {
  if (!text.trim()) return undefined;
  if (looksLikeHtml(text)) return text;
  try {
    return JSON.parse(text);
  } catch (cause) {
    // A non-JSON 2xx body will be reported as spa-fallback by the caller;
    // a non-JSON error body is surfaced as HTTP with raw text.
    const preview = text.slice(0, 200);
    return { __raw: preview };
  }
}

function toHttpError(status: number, body: unknown, path: string, method: string, url: string): DigiiError {
  const b = (body ?? {}) as DigiiErrorBody & { __raw?: string };
  const isEmptyBody = body === undefined || (typeof b.__raw === "string" && b.__raw.trim() === "");

  if (status === 401) {
    return new DigiiError("unauthorized", "401 Unauthorized — token expired or revoked; re-login.", {
      status,
      path,
      method,
      url,
      body,
    });
  }

  if (status === 403) {
    const msg = isEmptyBody
      ? "403 Forbidden — empty body indicates a role-based access gate (faculty/console only endpoint)."
      : `403 Forbidden — ${b.message || b.error || "access denied"}`;
    return new DigiiError("forbidden", msg, { status, path, method, url, body });
  }

  if (status === 404) {
    return new DigiiError("not-found", `404 Not Found: ${path}`, { status, path, method, url, body });
  }

  // e.g. 400 { error: "CLASS_FACULTY_PRIVILEGE_REQUIRED" }
  if (b.error && /PRIVILEGE_REQUIRED|NOT_ALLOWED|FORBIDDEN/i.test(b.error)) {
    return new DigiiError("not-permitted", `${b.error}${b.message ? ` — ${b.message}` : ""}`, {
      status,
      code: b.error,
      path,
      method,
      url,
      body,
    });
  }

  const msg = b.message || b.error || `HTTP ${status}`;
  return new DigiiError("http", msg, { status, code: b.error, path, method, url, body });
}

export { DigiiParseError };
