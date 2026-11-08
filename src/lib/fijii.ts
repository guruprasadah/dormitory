import { Fijii } from "fijii";
import type {
  PendingAssignment,
  PendingAssignmentsOptions,
  TermSummary,
} from "fijii";
import { MockFijii } from "./demo/client";

/**
 * The single-user client. The token and portal origin live only in server
 * env (`DIGII_TOKEN`, `DIGII_BASE_URL`); neither is ever exposed with a
 * `NEXT_PUBLIC_` prefix.
 *
 * The client is built per call: Server Actions and Server Components can run in
 * different request scopes, and the SDK reads the token function on every
 * request anyway.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function getConfig(): { token: string; baseUrl: string } | null {
  const token = process.env.DIGII_TOKEN?.trim();
  const baseUrl = process.env.DIGII_BASE_URL?.trim();
  if (!token || !baseUrl) return null;
  return { token, baseUrl };
}

/**
 * Demo mode swaps the portal for fictional fixtures (see `src/lib/demo/`).
 * It is opt-in via `DEMO_MODE=1` and takes precedence over `DIGII_*`, so a
 * screen-share or screenshot run never mixes real data in.
 */
export function isDemoMode(): boolean {
  const value = process.env.DEMO_MODE?.trim().toLowerCase();
  return value === "1" || value === "true";
}

/**
 * The slice of the SDK the Server Actions use. Both `Fijii` and `MockFijii`
 * satisfy it, which keeps the demo honest: a change to what the actions call
 * fails to compile until the mock implements it too.
 */
export interface PortalClient {
  attendance: Pick<Fijii["attendance"], "terms">;
  classes: Pick<Fijii["classes"], "list" | "resources">;
  attendanceSummary(termId?: number): Promise<TermSummary>;
  pendingAssignments(options?: PendingAssignmentsOptions): Promise<PendingAssignment[]>;
}

export async function makeClient(): Promise<PortalClient> {
  if (isDemoMode()) return MockFijii.create();

  const config = getConfig();
  if (!config) {
    throw new ConfigError(
      "Digiicampus is not configured. Set DIGII_TOKEN and DIGII_BASE_URL in .env.local (see .env.example), or run with DEMO_MODE=1 to use demo data.",
    );
  }
  return new Fijii({
    token: config.token,
    baseUrl: config.baseUrl,
    // Surface rotted/revoked tokens immediately rather than after a retry.
    timeoutMs: 30_000,
  });
}
