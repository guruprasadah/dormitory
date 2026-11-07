import { Fijii } from "fijii";

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

export function makeClient(): Fijii {
  const config = getConfig();
  if (!config) {
    throw new ConfigError(
      "Digiicampus is not configured. Set DIGII_TOKEN and DIGII_BASE_URL in .env.local (see .env.example).",
    );
  }
  return new Fijii({
    token: config.token,
    baseUrl: config.baseUrl,
    // Surface rotted/revoked tokens immediately rather than after a retry.
    timeoutMs: 30_000,
  });
}
