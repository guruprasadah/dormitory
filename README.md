# Dormitory

A small Next.js dashboard for your Digiicampus portal: **attendance** (overall + per course and
per component) and **pending assignments** (aggregated across all classes, earliest deadline first).

Data comes from the [`fijii`](https://github.com/guruprasadah/fijii) SDK, which talks to the same
private API the Digiicampus web app uses.

## Setup

1. Install dependencies (this also compiles the vendored SDK):

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in both values:

   | Variable | What it is |
   | --- | --- |
   | `DIGII_TOKEN` | The `user` cookie from the logged-in portal (DevTools → Application → Cookies → `user`). It is a JWT and expires after about 7 days. |
   | `DIGII_BASE_URL` | Your portal origin, e.g. `https://<your-institute>.digiicampus.com`. |

3. Run it:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

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

## The vendored SDK

`fijii` is not published to npm, and a plain git install ships only `README.md` +
`package.json` (its `src/` and `dist/` are excluded). So the SDK is **vendored** at
`vendor/fijii` in source form and installed as a `file:` dependency.

`npm install` runs the `postinstall` script, which compiles `vendor/fijii` with the app's
TypeScript (`dist/` is gitignored). `next.config.ts` adds it to `transpilePackages`.

To update the SDK, replace `vendor/fijii/src` (and `tsconfig.json`) from the upstream repo and
re-run `npm run postinstall`.
