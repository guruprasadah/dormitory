import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // `fijii` is vendored as TypeScript sources built into `dist/`. Adding it here
  // makes Next transpile the package for both the server and client bundles.
  transpilePackages: ["fijii"],
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
