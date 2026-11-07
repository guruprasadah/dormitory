#!/usr/bin/env node
/**
 * fijii is vendored at `vendor/fijii` (sources only — upstream ships neither
 * `src/` nor a built `dist/` to npm or git). This script compiles it so
 * `import { Fijii } from "fijii"` resolves after install.
 *
 * The package managers differ in how they expose the linked package:
 *   npm  symlinks node_modules/fijii -> vendor/fijii, so building in vendor is enough.
 *   pnpm links a *copy* built from the `files` field (src/ and tsconfig excluded),
 *        so the compiled dist/ has to be copied into that copy.
 *
 * Build in vendor/, then mirror dist/ into whatever node_modules/fijii resolves to.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, realpathSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vendor = join(root, "vendor", "fijii");
const linked = join(root, "node_modules", "fijii");

if (!existsSync(join(vendor, "tsconfig.json"))) {
  console.error("[fijii] vendored sources missing from vendor/fijii");
  process.exit(1);
}

const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");

console.log("[fijii] compiling vendor/fijii");
execFileSync(process.execPath, [tsc, "-p", join(vendor, "tsconfig.json")], {
  stdio: "inherit",
  cwd: vendor,
});

const built = join(vendor, "dist");
if (!existsSync(join(built, "index.js"))) {
  console.error("[fijii] build did not produce dist/index.js");
  process.exit(1);
}

if (existsSync(linked)) {
  const target = realpathSync(linked);
  if (target !== realpathSync(vendor)) {
    // pnpm: the linked package is a filtered copy; replace its (absent) dist.
    console.log(`[fijii] copying dist/ into ${target}`);
    rmSync(join(target, "dist"), { recursive: true, force: true });
    cpSync(built, join(target, "dist"), { recursive: true });
  }
}
