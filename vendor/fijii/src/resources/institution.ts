import type { HttpClient } from "../http.js";
import type {
  AuthenticationDetails,
  CollegeConfig,
  CollegeTime,
  CourseComponentType,
  Feature,
  JwtClaims,
} from "../types.js";

/** Decode a JWT payload (no signature verification). */
export function decodeJwt(token: string): JwtClaims {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) throw new Error("fijii: not a JWT");
  const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const json =
    typeof Buffer !== "undefined"
      ? Buffer.from(padded, "base64").toString("utf8")
      : atob(padded);
  return JSON.parse(json) as JwtClaims;
}

/** Decode and throw if expired (allowing `skewSeconds`). */
export function assertValidToken(token: string, skewSeconds = 60): JwtClaims {
  const claims = decodeJwt(token);
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp + skewSeconds < now) {
    throw new Error(`fijii: token expired at ${new Date(claims.exp * 1000).toISOString()}`);
  }
  return claims;
}

export class InstitutionResource {
  constructor(private readonly http: HttpClient) {}

  /** Public college metadata (branding, currency, timezone). */
  collegeConfig(url?: string) {
    return this.http.get<CollegeConfig>("/rest/service/collegeConfig", {
      query: { url: url ?? new URL(this.http.baseUrl).host },
    });
  }

  /** Server clock in the college timezone — prefer over the local clock. */
  collegeTime() {
    return this.http.get<CollegeTime>("/rest/structure/v1/collegeTime");
  }

  /** Enabled feature flags — gate UI on these (CLASSROOM, GRADEBOOK, …). */
  features() {
    return this.http.get<{ res: Feature[] }>("/rest/service/features");
  }

  courseComponentTypes() {
    return this.http.get<CourseComponentType[]>("/api/structure/courseComponentType/");
  }
}

export class AuthResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Full session snapshot: current token, user (incl. `programmeId`/`batchYear`
   * needed for term lookups) and flags.
   */
  authenticationDetails() {
    return this.http.get<{ res: AuthenticationDetails }>("/rest/service/authenticationDetails");
  }

  /** The logged-in user, unwrapped. */
  async me() {
    return (await this.authenticationDetails()).res.user;
  }
}
