import { DigiiError } from "fijii";
import { ConfigError } from "./fijii";

export type ErrorKind =
  | "auth"
  | "forbidden"
  | "not-found"
  | "network"
  | "upstream"
  | "config"
  | "unknown";

export interface ActionError {
  kind: ErrorKind;
  message: string;
}

/**
 * A Server Action result that never throws across the RSC boundary. Thrown
 * errors are stripped in production, so errors are returned as values.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: ActionError): ActionResult<never> {
  return { ok: false, error };
}

/**
 * Map a thrown error to a safe, user-facing shape. Never returns the token,
 * upstream URL, or raw response body — those stay in server logs only.
 */
export function toActionError(error: unknown): ActionError {
  if (error instanceof ConfigError) {
    return { kind: "config", message: error.message };
  }

  if (error instanceof DigiiError) {
    switch (error.kind) {
      case "unauthorized":
        return {
          kind: "auth",
          message:
            "The Digiicampus token was rejected (expired or revoked). Refresh DIGII_TOKEN in .env.local with a fresh `user` cookie and reload.",
        };
      case "forbidden":
      case "not-permitted":
        return {
          kind: "forbidden",
          message: "This portal refused the request for your account (permission denied).",
        };
      case "not-found":
        return { kind: "not-found", message: "The portal returned not-found for this request." };
      case "network":
        return {
          kind: "network",
          message: "Could not reach the portal. Check DIGII_BASE_URL and your connection, then try again.",
        };
      default:
        return {
          kind: "upstream",
          message: `The portal returned an unexpected response (${error.status ?? "error"}). Try again shortly.`,
        };
    }
  }

  console.error("[dormitory] unexpected error", error);
  return { kind: "unknown", message: "Something went wrong while talking to the portal." };
}
