import { Hono } from "hono";
import { cors } from "hono/cors";
import { ORIGIN } from "../../src/lib/geo.ts";
import type { LivePulse } from "../../src/lib/types.ts";
import { getDb, type Hyperdrive } from "./db.ts";
import { loadVenue, loadVenues, parseChips, rankedPayload } from "./load.ts";
import { pulses, signals } from "./schema.ts";

type Env = { HYPERDRIVE?: Hyperdrive };

const ATTRS = ["plugs", "noise", "crowd", "calls", "group4"] as const;

function parseBbox(raw: string | undefined): [number, number, number, number] | undefined {
  if (!raw) return undefined;
  const n = raw.split(",").map(Number);
  if (n.length !== 4 || n.some((x) => Number.isNaN(x))) return undefined;
  return [n[0], n[1], n[2], n[3]];
}

export const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors({ origin: "*" }));

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/venues", async (c) => {
  const lat = Number(c.req.query("lat") ?? ORIGIN.lat);
  const lng = Number(c.req.query("lng") ?? ORIGIN.lng);
  const chips = parseChips(c.req.query("chips"));
  const bbox = parseBbox(c.req.query("bbox"));
  const db = getDb(c.env);
  const venues = await loadVenues(db, { lat, lng, bbox });
  return c.json(rankedPayload(venues, chips, lat, lng));
});

app.get("/api/venues/:id", async (c) => {
  const db = getDb(c.env);
  const venue = await loadVenue(db, c.req.param("id"));
  if (!venue) return c.json({ error: "not_found" }, 404);
  return c.json({ venue });
});

app.post("/api/venues/:id/pulses", async (c) => {
  const id = c.req.param("id");
  const db = getDb(c.env);
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
