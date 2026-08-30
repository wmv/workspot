import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ORIGIN } from "../../src/lib/geo.ts";
import type { Category, LivePulse, Locale } from "../../src/lib/types.ts";
import { bearer, resolveUser, type AuthUser } from "./auth.ts";
import { makeDb, type Db, type Hyperdrive } from "./db.ts";
import { loadVenue, loadVenues, parseChips, rankedPayload } from "./load.ts";
import { pulses, signals, venueSuggestions } from "./schema.ts";
import { isVerifier } from "./verifiers.ts";

type Env = { HYPERDRIVE?: Hyperdrive; ADMIN_TOKEN?: string; VERIFIER_USER_IDS?: string };
type Vars = { db: Db; user?: AuthUser };

const ATTRS = ["plugs", "noise", "crowd", "calls", "group4"] as const;
const CATEGORIES: ReadonlySet<string> = new Set(["cafe", "library", "cowork", "other"]);
const SUGGESTIONS_PER_DAY = 5;

function adminToken(env?: Env): string | undefined {
  return env?.ADMIN_TOKEN ?? process.env.ADMIN_TOKEN;
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseBbox(raw: string | undefined): [number, number, number, number] | undefined {
  if (!raw) return undefined;
  const n = raw.split(",").map(Number);
  if (n.length !== 4 || n.some((x) => Number.isNaN(x))) return undefined;
  return [n[0], n[1], n[2], n[3]];
}

export const app = new Hono<{ Bindings: Env; Variables: Vars }>();

async function requireUser(c: { req: { header: (n: string) => string | undefined }; set: (k: "user", v: AuthUser) => void; json: (body: unknown, status?: number) => Response }) {
  const user = await resolveUser(bearer(c as never));
  if (!user) return c.json({ error: "unauthorized" }, 401);
  c.set("user", user);
  return null;
}

async function requireVerifier(c: {
  env: Env;
  var: Vars;
  req: { header: (n: string) => string | undefined };
  set: (k: "user", v: AuthUser) => void;
  json: (body: unknown, status?: number) => Response;
}) {
  const token = bearer(c as never)?.replace(/^Bearer\s+/i, "").trim();
  const expected = adminToken(c.env);
  if (expected && token === expected) return null;

  const user = await resolveUser(bearer(c as never));
  if (!user) return c.json({ error: "unauthorized" }, 401);
  c.set("user", user);
  if (!(await isVerifier(c.var.db, user.id, c.env))) {
    return c.json({ error: "forbidden" }, 403);
  }
  return null;
}

app.use("/api/*", cors({ origin: "*" }));

app.use("/api/*", async (c, next) => {
  const { db, close } = makeDb(c.env);
  c.set("db", db);
  try {
    await next();
  } finally {
    if (close) {
      const ctx = (() => {
        try {
          return c.executionCtx;
        } catch {
          return undefined; // not running on Workers; close inline
        }
      })();
      if (ctx) ctx.waitUntil(close());
      else await close();
    }
  }
});

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/venues", async (c) => {
  const lat = Number(c.req.query("lat") ?? ORIGIN.lat);
  const lng = Number(c.req.query("lng") ?? ORIGIN.lng);
  const chips = parseChips(c.req.query("chips"));
  const bbox = parseBbox(c.req.query("bbox"));
  const db = c.var.db;
  const venues = await loadVenues(db, { lat, lng, bbox });
  return c.json(rankedPayload(venues, chips, lat, lng));
});

app.get("/api/venues/:id", async (c) => {
  const db = c.var.db;
  const venue = await loadVenue(db, c.req.param("id"));
  if (!venue) return c.json({ error: "not_found" }, 404);
  return c.json({ venue });
});

app.post("/api/venues/:id/pulses", async (c) => {
  const id = c.req.param("id");
  const db = c.var.db;
  const venue = await loadVenue(db, id);
  if (!venue) return c.json({ error: "not_found" }, 404);

  const body = (await c.req.json()) as Partial<LivePulse> & {
    lat?: number;
    lng?: number;
  };
  if (!body.plugs || !body.noise || !body.crowd || !body.calls || !body.group4) {
    return c.json({ error: "incomplete" }, 400);
  }

  const pulseId = crypto.randomUUID();
  const at = body.at ? new Date(body.at) : new Date();
  const confidence = body.confidence === "on-site" ? "on-site" : "remote";

  await db.insert(pulses).values({
    id: pulseId,
    venueId: id,
    at,
    confidence,
    note: body.note?.trim() || null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
  });

  await db.insert(signals).values(
    ATTRS.map((attribute) => ({
      id: crypto.randomUUID(),
      pulseId,
      venueId: id,
      attribute,
      value: String(body[attribute]),
      at,
    })),
  );

  const next = await loadVenue(db, id);
  return c.json({ venue: next }, 201);
});

app.get("/api/me", async (c) => {
  const user = await resolveUser(bearer(c));
  if (!user) return c.json({ user: null, isVerifier: false });
  const verifier = await isVerifier(c.var.db, user.id, c.env);
  return c.json({
    user: { id: user.id, email: user.email, name: user.name ?? null },
    isVerifier: verifier,
  });
});

app.get("/api/suggestions/mine", async (c) => {
  const denied = await requireUser(c);
  if (denied) return denied;
  const user = c.var.user!;
  const rows = await c.var.db
    .select({
      id: venueSuggestions.id,
      name: venueSuggestions.name,
      category: venueSuggestions.category,
      lat: venueSuggestions.lat,
      lng: venueSuggestions.lng,
      status: venueSuggestions.status,
      createdAt: venueSuggestions.createdAt,
    })
    .from(venueSuggestions)
    .where(
      and(
        eq(venueSuggestions.submittedBy, user.id),
        eq(venueSuggestions.status, "pending"),
      ),
    )
    .orderBy(venueSuggestions.createdAt);
  return c.json({ suggestions: rows });
});

app.post("/api/suggestions", async (c) => {
  const denied = await requireUser(c);
  if (denied) return denied;
  const user = c.var.user!;

  const body = (await c.req.json().catch(() => ({}))) as {
    name?: string;
    category?: string;
    lat?: number;
    lng?: number;
    note?: string;
    locale?: string;
  };

  const name = String(body.name ?? "").trim();
  if (name.length < 2 || name.length > 80) return c.json({ error: "invalid_name" }, 400);
  if (!CATEGORIES.has(String(body.category))) return c.json({ error: "invalid_category" }, 400);
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return c.json({ error: "invalid_location" }, 400);
  }
  const note = String(body.note ?? "").trim().slice(0, 200) || null;
  const locale: Locale = body.locale === "en" ? "en" : "pt";

  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  const ipHash = await hashIp(ip);

  const db = c.var.db;
  const id = crypto.randomUUID();
  // Transaction so the rate-limit count is never served stale from
  // Hyperdrive's query cache (reads inside transactions bypass it).
  const accepted = await db.transaction(async (tx) => {
    const recent = await tx.execute(sql`
      SELECT count(*)::int AS n FROM venue_suggestions
      WHERE submitted_by = ${user.id} AND created_at > now() - interval '1 day'
    `);
    if ((recent.rows[0] as { n: number }).n >= SUGGESTIONS_PER_DAY) return false;
    await tx.insert(venueSuggestions).values({
      id,
      name,
      category: body.category as Category,
      lat,
      lng,
      note,
      locale,
      ipHash,
      submittedBy: user.id,
      submittedByEmail: user.email,
    });
    return true;
  });
  if (!accepted) return c.json({ error: "rate_limited" }, 429);
  return c.json({ ok: true, id }, 201);
});

// --- Review queue: verifier accounts (or legacy ADMIN_TOKEN bearer) ---

app.use("/api/admin/*", async (c, next) => {
  const denied = await requireVerifier(c);
  if (denied) return denied;
  await next();
});

app.get("/api/admin/suggestions", async (c) => {
  const status = c.req.query("status") ?? "pending";
  const db = c.var.db;
  const rows = await db
    .select()
    .from(venueSuggestions)
    .where(eq(venueSuggestions.status, status))
    .orderBy(venueSuggestions.createdAt);
  return c.json({ suggestions: rows });
});

app.post("/api/admin/suggestions/:id/approve", async (c) => {
  const db = c.var.db;
  const reviewer = c.var.user?.id ?? "admin-token";
  const venueId = await db.transaction(async (tx) => {
    const res = await tx.execute(sql`
      UPDATE venue_suggestions
      SET status = 'approved', reviewed_by = ${reviewer}, reviewed_at = now()
      WHERE id = ${c.req.param("id")} AND status = 'pending'
      RETURNING id, name, category, lat, lng, note, locale
    `);
    const suggestion = res.rows[0] as
      | { name: string; category: string; lat: number; lng: number; note: string | null; locale: string }
      | undefined;
    if (!suggestion) return null;

    const base = slugify(suggestion.name) || "spot";
    for (let n = 1; n <= 50; n++) {
      const id = n === 1 ? base : `${base}-${n}`;
      const inserted = await tx.execute(sql`
        INSERT INTO venues (id, name, category, lat, lng, geom, hours)
        VALUES (
          ${id}, ${suggestion.name}, ${suggestion.category},
          ${suggestion.lat}, ${suggestion.lng},
          ST_SetSRID(ST_MakePoint(${suggestion.lng}, ${suggestion.lat}), 4326)::geography,
          '[]'::jsonb
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `);
      if (inserted.rows.length === 0) continue;
      await tx.execute(sql`
        INSERT INTO amenities (venue_id, plugs, wifi, parking, groups, calls)
        VALUES (${id}, 'unknown', 'unknown', 'unknown', 'unknown', 'unknown')
      `);
      if (suggestion.note) {
        await tx.execute(sql`
          INSERT INTO tips (venue_id, body, locale)
          VALUES (${id}, ${suggestion.note}, ${suggestion.locale})
        `);
      }
      return id;
    }
    throw new Error("could not find a free venue id");
  });
  if (!venueId) return c.json({ error: "not_pending" }, 409);
  return c.json({ ok: true, venueId }, 201);
});

app.post("/api/admin/suggestions/:id/reject", async (c) => {
  const db = c.var.db;
  const reviewer = c.var.user?.id ?? "admin-token";
  const res = await db.execute(sql`
    UPDATE venue_suggestions
    SET status = 'rejected', reviewed_by = ${reviewer}, reviewed_at = now()
    WHERE id = ${c.req.param("id")} AND status = 'pending'
    RETURNING id
  `);
  if (!res.rows[0]) return c.json({ error: "not_pending" }, 409);
  return c.json({ ok: true });
});
