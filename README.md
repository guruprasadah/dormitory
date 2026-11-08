# Dormitory

A small Next.js dashboard for your Digiicampus portal: **attendance** (overall + per course and
per component) and **pending assignments** (aggregated across all classes, earliest deadline first).

Data comes from the [`fijii`](https://github.com/guruprasadah/fijii) SDK, which talks to the same
private API the Digiicampus web app uses.

## Setup

1. Install dependencies (this also compiles the vendored SDK):

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env.local` and fill in both values:

   | Variable | What it is |
   | --- | --- |
   | `DIGII_TOKEN` | The `user` cookie from the logged-in portal (DevTools → Application → Cookies → `user`). It is a JWT and expires after about 7 days. |
   | `DIGII_BASE_URL` | Your portal origin, e.g. `https://<your-institute>.digiicampus.com`. |

3. Run it:

   ```bash
   pnpm dev
   ```

   Open <http://localhost:3000>.

## Demo mode

Run the dashboard on fictional data — no token, no portal — for screenshots or
sharing:

```bash
DEMO_MODE=1 pnpm dev
```

A yellow **DEMO DATA** strip and a `DEMO` badge in the header mark it. Data
served in demo mode is defined in `src/lib/demo/` (Semester 5 B.Tech CSE
courses, attendance, assignments and resources). It is opt-in via `DEMO_MODE=1`
and overrides `DIGII_TOKEN` / `DIGII_BASE_URL`; the real client path is
unchanged when the flag is absent.

Demo dates are generated relative to "now" (see `src/lib/demo/timeline.ts`), so
screenshots always show upcoming deadlines rather than stale ones. `makeClient()`
in `src/lib/fijii.ts` is the only switch between the two.

To capture LinkedIn-ready stills:

```bash
DEMO_MODE=1 pnpm dev          # in one terminal
node scripts/stills.mjs       # light + dark PNGs → ./stills/<theme>/
```

## How it works
- The token and portal URL stay **server-side only** — there are no `NEXT_PUBLIC_` variables.
- Reads go through **Server Actions** in `src/actions/`; there are no API routes and nothing calls
  the portal from the browser (the portal's CORS allow-list forbids it anyway).
- Actions return a discriminated `ActionResult` (`ok` / `error`) rather than throwing, so failures
  render as friendly banners. Upstream error bodies and the token are never sent to the client.
- If the token is rejected (expired or revoked), the UI asks you to refresh `DIGII_TOKEN` and
  reload. A class whose assignments fail to load is skipped rather than breaking the whole list.

## Routes

| Path | Contents |
| --- | --- |
| `/` | Term attendance ring, a few key stats, and the four nearest pending assignments |
| `/attendance` | Term switcher and one card per course: overall % plus per-component rows with expandable per-lesson status |
| `/assignments` | All pending assignments with "due within" and "include overdue" filters |
| `/resources` | One expandable row per course revealing its files and links, grouped by lecture/practical |

## The vendored SDK

`fijii` is not published to npm, and a plain git install ships only `README.md` +
`package.json` (its `src/` and `dist/` are excluded). So the SDK is **vendored as a git
submodule** at `vendor/fijii` and installed as a `file:` dependency.

The submodule tracks upstream exactly — no local edits — pinned to a specific commit so builds
are reproducible. `dist/` is compiled at install time into the submodule (upstream gitignores it,
so the submodule stays clean).

`pnpm install` runs the `postinstall` script (`scripts/build-fijii.mjs`), which compiles
`vendor/fijii` with the app's TypeScript and copies the output into the location pnpm links.
pnpm hard-links a *copy* of a `file:` dependency rather than symlinking it (npm symlinks), so the
build can't rely on writing to `vendor/fijii` alone. `next.config.ts` adds the package to
`transpilePackages`.

A fresh clone needs the submodule:

```bash
git clone --recurse-submodules <repo>
# or, if already cloned:
git submodule update --init --recursive
```

To update the SDK, move the submodule to a new upstream commit:

```bash
git submodule update --remote vendor/fijii
pnpm postinstall
```
