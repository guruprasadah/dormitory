import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

/**
 * Dev-only: the origins a phone on the LAN loads the app from. Without these,
 * `next dev` rejects the HMR WebSocket (browsers always send `Origin`), the
 * dev client never finishes booting, and *nothing on the page is interactive* —
 * React never hydrates, so only plain links work.
 *
 * Entries must be **bare hostnames**: Next compares them against the origin's
 * `hostname`, which never includes a port. Deriving the LAN IPs at config-load
 * time keeps this working when DHCP hands out a new address; add extras via
 * DEV_ALLOWED_ORIGINS (comma-separated, hostnames only).
 */
function lanOrigins(): string[] {
  const hosts = (process.env.DEV_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((h) => h.trim().replace(/^https?:\/\//, "").replace(/:.*$/, ""))
    .filter(Boolean);

  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === "IPv4" && !net.internal) hosts.push(net.address);
    }
  }

  return [...new Set(hosts)];
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // `fijii` is vendored as TypeScript sources built into `dist/`. Adding it here
  // makes Next transpile the package for both the server and client bundles.
  transpilePackages: ["fijii"],
  allowedDevOrigins: lanOrigins(),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
