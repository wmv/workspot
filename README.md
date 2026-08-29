# WorkSpot (working codename)

Created at the **[Cursor hackathon in Luanda](https://cursor.com)** — building in the open from day one.

**Find places you can actually work from — fast.**

A mobile-first app that answers one question better than anything else:
**"Where can I get work done right now, alone or with a small group?"**

Not Yelp for coffee shops. Not a social network. A **decision engine** built on
structured workability data (plugs, Wi‑Fi, noise, seating, group tolerance) and
fast, 10-second community pulses — optimized for decision speed, workability,
and group coordination.

> Codename note: "WorkSpot" is a placeholder. Final name should not trap us in
> coffee shops — prefer roots like *plug / spot / session / work / meet*.

**Hackathon brief (PT first, then EN):** [`HACKATHON.md`](HACKATHON.md)

## Status

**Live: [workspot.wmv.workers.dev](https://workspot.wmv.workers.dev)** —
Explore (map + ranked list), venue detail, and 10-second pulses run end to
end in production, in `pt` and `en`.

**Stack:** React + Vite PWA, Hono API, Drizzle, Postgres + PostGIS.
Production runs on Cloudflare Workers with Neon Postgres via Hyperdrive;
local development needs no cloud account at all (see below).

## Getting started (no cloud account needed)

Prerequisites: Node 22+, Docker.

```bash
npm install
cp .env.example .env
npm run db:up        # PostGIS in Docker on port 5434
npm run db:migrate
npm run db:seed      # seed venues
npm run api          # Hono API on port 8840
npm run dev          # Vite on port 5173, proxies /api to the API
```

Open http://localhost:5173. `npm run build` typechecks and builds the client.

## Deployment

Production is a single Cloudflare Worker serving both the PWA (static assets)
and the Hono API, with Neon Postgres + PostGIS reached through Hyperdrive.
Contributors never need Cloudflare or Neon access:

- **Every PR** runs CI (typecheck + build) — no secrets required, works from forks.
- **PRs from branches on this repo** also get a preview URL per push
  (`wrangler versions upload`), commented on the PR.
- **Merges to `main`** deploy to production via `wrangler deploy`, authenticated
  with a maintainer-owned `CLOUDFLARE_API_TOKEN` repo secret. Fork PRs can't
  read secrets, so deploys are maintainer-only by construction.

Maintainers can also deploy from a machine: `npm run deploy` (requires
`CLOUDFLARE_API_TOKEN` in the environment or `wrangler login`). Database
access for maintainers goes through the Neon CLI: `neon link` pins the
project in a git-ignored `.neon` file and pulls the branch's connection
strings into `.env`. Schema changes run against the direct (unpooled) URL
via `npm run db:migrate`.

## The one-liner

> An app that helps people find genuinely work-friendly venues and coordinate
> group work sessions using fast, community-powered signals like plug access,
> noise, seating, and suitability.

## Core bets

1. **Workability intelligence beats generic reviews.** A situational score
   ("good for calls before noon") beats "4.3 stars".
2. **Contribution must take ≤10 seconds.** Tap-based pulses, not essays.
   If contributing feels slow, the data dies.
3. **Solo "find me a spot now" is the daily habit; group planning is the
   expansion story.** Build the habit first.
4. **Launch in one dense neighborhood, seeded by hand.** Cold start is the
   biggest risk; density beats coverage.
5. **`pt` and `en` ship together.** The launch neighborhood defaults to `pt`.

## Contributing

Contributions are welcome — the project is young and early collaborators
shape it most. Open an issue or pull request to get started. Three ground
rules from the start: every user-facing string lands in both `pt` and `en`
catalogs in the same PR; no dummy data — every venue in the seed is a real
place someone can walk into, and unverified facts stay `unknown` rather
than invented; and the local Docker setup above is the supported dev path
(no cloud accounts needed). Agent skills for working with Neon live in
`.agents/skills/`.
