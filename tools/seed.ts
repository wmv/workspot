import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";
import type { Venue } from "../src/lib/types.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const raw = await readFile(
  resolve(import.meta.dirname, "../src/data/venues.json"),
  "utf8",
);
const list = JSON.parse(raw) as Venue[];
const client = new pg.Client({ connectionString: url });
await client.connect();

for (const venue of list) {
  await client.query(
    `INSERT INTO venues (id, name, category, lat, lng, geom, hours)
     VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography, $6::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       category = EXCLUDED.category,
       lat = EXCLUDED.lat,
       lng = EXCLUDED.lng,
       geom = EXCLUDED.geom,
       hours = EXCLUDED.hours`,
    [
      venue.id,
      venue.name,
      venue.category,
      venue.lat,
      venue.lng,
      JSON.stringify(venue.hours),
    ],
  );

  await client.query(
    `INSERT INTO amenities (venue_id, plugs, wifi, parking, groups, calls)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (venue_id) DO UPDATE SET
       plugs = EXCLUDED.plugs,
       wifi = EXCLUDED.wifi,
       parking = EXCLUDED.parking,
       groups = EXCLUDED.groups,
       calls = EXCLUDED.calls`,
    [
      venue.id,
      venue.facts.plugs,
      venue.facts.wifi,
      venue.facts.parking,
      venue.facts.groups,
      venue.facts.calls,
    ],
  );

  await client.query("DELETE FROM tips WHERE venue_id = $1", [venue.id]);
  for (const tip of venue.tips) {
    await client.query(
      "INSERT INTO tips (venue_id, body, locale) VALUES ($1, $2, $3)",
      [venue.id, tip.text, tip.locale],
    );
  }

  const { rows } = await client.query(
    "SELECT count(*)::int AS n FROM pulses WHERE venue_id = $1",
    [venue.id],
  );
  if (rows[0].n > 0) continue;

  for (const pulse of venue.pulses) {
    const pulseId = crypto.randomUUID();
    const at = new Date(Date.now() - pulse.hoursAgo * 3_600_000);
    await client.query(
      `INSERT INTO pulses (id, venue_id, at, confidence, note)
       VALUES ($1, $2, $3, 'on-site', NULL)`,
      [pulseId, venue.id, at],
    );
    const attrs = [
      ["plugs", pulse.plugs],
      ["noise", pulse.noise],
      ["crowd", pulse.crowd],
      ["calls", pulse.calls],
      ["group4", pulse.group4],
    ] as const;
    for (const [attribute, value] of attrs) {
      await client.query(
        `INSERT INTO signals (id, pulse_id, venue_id, attribute, value, at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), pulseId, venue.id, attribute, value, at],
      );
    }
  }
}

await client.end();
console.log(`seeded ${list.length} venues`);
