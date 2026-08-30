<p align="center">
  <img src="public/favicon.svg" width="88" alt="WorkSpot logo" />
</p>

# WorkSpot

Created at the **[Cursor hackathon in Luanda](https://cursor.com)**.

**Find places you can actually work from — fast.**

A mobile-first app that answers one question better than anything else:
**"Where can I get work done right now, alone or with a small group?"**

**Hackathon brief (PT first, then EN):** [`HACKATHON.md`](HACKATHON.md)

## Status

**Live: [workspot.wmv.workers.dev](https://workspot.wmv.workers.dev)**.

**Suggest a spot:** signed-in users only. Submissions show as **pending** on
the map until a **verifier** approves them via the API — no admin UI. Audit
trail records who submitted and who reviewed.

**Stack:** React + Vite PWA, Hono API, Drizzle, Postgres + PostGIS, Neon Auth.
Production runs on Cloudflare Workers with Neon Postgres via Hyperdrive;
local development needs no cloud account at all (see below).

Where help is most wanted right now:
[open issues](https://github.com/wmv/workspot/issues) — including
[good first issues](https://github.com/wmv/workspot/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
that need no coding at all (verifying venue hours on the ground).

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

## How new places get on the map

Signed-in users can propose a venue from the app ("Sugerir um sítio": name,
category, pin on the map, optional note). Each suggestion is stored with the
submitter's account id and email for audit. It appears on the map as **pending**
until a **verifier** approves it — only then does it join the ranked list and
suggestion engine.

Verifiers are privileged accounts, not a separate admin UI. Grant the role by
inserting into the `verifiers` table (or set `VERIFIER_USER_IDS` on the Worker
for bootstrap):

```sql
INSERT INTO verifiers (user_id, email) VALUES ('<neon-auth-user-id>', 'you@example.com');
```

Review the queue and approve/reject via the API (Bearer session JWT for
verifiers, or legacy `ADMIN_TOKEN`):

```bash
# Verifier: session token from the browser console after sign-in:
# (await authClient.getSession()).data.session.token
TOKEN="<paste-session-token>"
curl -H "Authorization: Bearer $TOKEN" \
  https://workspot.wmv.workers.dev/api/admin/suggestions          # pending queue
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://workspot.wmv.workers.dev/api/admin/suggestions/<id>/approve
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://workspot.wmv.workers.dev/api/admin/suggestions/<id>/reject
```

Approval creates the venue with every amenity `unknown` — facts get filled in
by people.

## Contributing

Contributions are welcome — the project is young and early collaborators
shape it most. Grab an [open issue](https://github.com/wmv/workspot/issues)
(the `good first issue` label marks gentle entry points, including non-coding
ones) or open a new one. Three ground rules from the start: every user-facing string lands in both `pt` and `en`
catalogs in the same PR; no dummy data — every venue in the seed is a real
place someone can walk into, and unverified facts stay `unknown` rather
than invented; and the local Docker setup above is the supported dev path
(no cloud accounts needed). Agent skills for working with Neon live in
`.agents/skills/`.
