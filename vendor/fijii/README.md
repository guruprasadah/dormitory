<div align="center">

# fijii

**A typed TypeScript client for the Digiicampus student portal.**

Classes · Assignments · Quizzes · Course work · Resources · Gradebook · Attendance · Discussions

[![typescript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](#)
[![node](https://img.shields.io/badge/Node-18%2B-339933?logo=nodedotjs&logoColor=white)](#)
[![dependencies](https://img.shields.io/badge/runtime%20deps-0-brightgreen)](#)
[![tests](https://img.shields.io/badge/tests-37%20passing-brightgreen)](#)
[![docs](https://img.shields.io/badge/docs-read%20the%20guide-blueviolet)](./docs/README.md)

</div>

---

`fijii` talks to the same private HTTP API the Digiicampus web app uses, so you don't have to
reverse-engineer it yourself. It turns the portal's inconsistent payloads, four different error
shapes and naive timestamps into one typed, promise-based API.

> Not affiliated with Digiicampus or CollPoll. See [limitations](./docs/limitations.md).

## What you get

| | |
|---|---|
| **Classrooms** | Every class and course component (lecture, practical, tutorial) you're enrolled in |
| **Assignments** | Full detail, submissions, rubrics — plus `pendingAssignments()` across *all* classes, sorted by due date |
| **Course work** | Modules, sessions, course planner with attendance flags |
| **Resources** | Files and videos with signed-URL handling built in |
| **Quizzes** | Quiz V2: lists, attempts, access codes, results |
| **Gradebook** | The student's own assessment result |
| **Attendance** | Term totals plus per-course and per-component breakdowns |
| **Discussions** | Class forum threads, comments, upvotes |

## Install

```bash
npm install fijii
```

Node 18+ · zero runtime dependencies · ships with TypeScript types.

## Use it

Set your token — it's the `user` cookie from the logged-in portal
(DevTools → Application → Cookies → **`user`**) — and your institution's portal URL:

```bash
export DIGII_TOKEN='eyJhbGciOiJSUzI1NiJ9...'
export DIGII_BASE_URL='https://<your-institute>.digiicampus.com'
```

Then:

```ts
import { Fijii } from "fijii";

const fijii = new Fijii({
  token: () => process.env.DIGII_TOKEN!,
  baseUrl: process.env.DIGII_BASE_URL!,
});

// Everything still open, across every class, earliest deadline first
const pending = await fijii.pendingAssignments();

for (const a of pending) {
  const days = a.daysUntilDue?.toFixed(1) ?? "?";
  console.log(`${a.name}  —  ${a.classLabel}  (due in ${days} days)`);
}

// Term attendance, already aggregated per course
const attendance = await fijii.attendanceSummary();
console.log(`${attendance.present}/${attendance.total} = ${attendance.percentage}%`);
```

Real output from a live account (class labels shortened here; the SDK returns the full name):

```text
Sed command  —  Unix Scripting Environment  (due in 3.4 days)
A7: Arrays and Pointers in Functions  —  Problem Solving and Programming in C  (due in 8.5 days)
Mini Project Review – Presentation Guidelines  —  Engineering Physics Lab  (due in 10.1 days)

156/170 = 91.76%
```

That's the whole setup — one dependency, one token, typed results.

## Why it's not just thin HTTP

The portal is genuinely awkward, and `fijii` absorbs that:

- **Real instants from naive timestamps** — `"2026-11-10 23:00:00"` has no timezone.
  `parseDigiiDate()` gives you a correct `Date`; `new Date()` would silently shift it on any non-IST machine.
- **Errors you can branch on** — a `DigiiError` with a `kind` of `unauthorized`, `forbidden`,
  `not-permitted`, `not-found`, `spa-fallback`, `http`, `network` or `parse`.
- **Correct routes** — the obvious-looking endpoints are often dead (quiz V1 is retired, students get
  `404` from the plain assignment route, an unmatched `/api/*` GET returns HTML with `200`). The SDK
  only uses the ones that actually work.
- **Sane attendance maths** — `total = present + absent`; unmarked and "do not consider" lessons are
  excluded, and `unmarkedLessons` tells you what's still pending.

## Documentation

**Everything else lives in the docs → [`docs/`](./docs/README.md)**

- [Getting started](./docs/getting-started.md) — install, auth, first calls
- [Configuration](./docs/configuration.md) — token rotation, timeouts, timezones, custom fetch
- [Authentication](./docs/authentication.md) — how tokens work and what to do when they're revoked
- [API reference](./docs/api-reference.md) — every resource and method
- [Data model](./docs/data-model.md) — every payload, field by field
- [Errors & resilience](./docs/errors.md) — failure modes, retries, rate limiting
- [Dates & timezones](./docs/dates.md) — the timestamp trap explained
- [Recipes](./docs/recipes.md) — dashboards, notifications, ICS export, downloads, and more
- [Browser usage](./docs/browser.md) — proxies, Workers, Deno, Bun
- [Limitations](./docs/limitations.md) — what it can't do, what's stable, legal notes

## Status

Verified live against a real student account on a production Digiicampus tenant. Read paths (classes,
assignments, course work, resources, attendance, gradebook) are stable; quiz and discussion writes are
routed and typed but untested. The
[limitations doc](./docs/limitations.md#what-is-stable-vs-experimental) is the authoritative list.

## License

MIT.
