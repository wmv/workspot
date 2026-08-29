import { sql } from "drizzle-orm";
import { ORIGIN } from "../../src/lib/geo.ts";
import { NEIGHBORHOOD_M } from "../../src/lib/location.ts";
import type { ChipId, Facts, HourBlock, Pulse, Tip, Venue } from "../../src/lib/types.ts";
import { DEFAULT_CHIPS } from "../../src/lib/types.ts";
import { rankVenues } from "../../src/lib/venues.ts";
import type { Db } from "./db.ts";

type PulseRow = {
  at: string;
  confidence?: "on-site" | "remote";
  note?: string | null;
  signals: { attribute: string; value: string }[] | null;
};

type VenueRow = {
  id: string;
  name: string;
  category: Venue["category"];
  lat: number;
  lng: number;
  hours: HourBlock[];
  plugs: Facts["plugs"];
  wifi: Facts["wifi"];
  parking: Facts["parking"];
  groups: Facts["groups"];
  calls: Facts["calls"];
  tips: Tip[] | null;
  pulses: PulseRow[] | null;
};

function hoursAgo(at: string): number {
  return Math.max(0, (Date.now() - Date.parse(at)) / 3_600_000);
}

function toPulse(row: PulseRow): Pulse {
  const map = Object.fromEntries(
    (row.signals ?? []).map((s) => [s.attribute, s.value]),
  );
  return {
    hoursAgo: hoursAgo(row.at),
    at: row.at,
    plugs: (map.plugs ?? "no") as Pulse["plugs"],
    noise: (map.noise ?? "medium") as Pulse["noise"],
    crowd: (map.crowd ?? "open") as Pulse["crowd"],
    calls: (map.calls ?? "maybe") as Pulse["calls"],
    group4: (map.group4 ?? "maybe") as Pulse["group4"],
    confidence: row.confidence,
    note: row.note ?? undefined,
  };
}

function toVenue(row: VenueRow): Venue {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    lat: row.lat,
    lng: row.lng,
    hours: row.hours,
    facts: {
      plugs: row.plugs,
      wifi: row.wifi,
      parking: row.parking,
      groups: row.groups,
      calls: row.calls,
    },
    tips: row.tips ?? [],
    pulses: (row.pulses ?? []).map(toPulse),
  };
}

export function parseChips(raw: string | undefined): Record<ChipId, boolean> {
  if (!raw) return { ...DEFAULT_CHIPS };
  const on = new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
  return {
    open: on.has("open"),
    plugs: on.has("plugs"),
    quiet: on.has("quiet"),
    calls: on.has("calls"),
    wifi: on.has("wifi"),
    park: on.has("park"),
    group: on.has("group"),
  };
}

export async function loadVenues(
  db: Db,
  opts: {
    lat?: number;
    lng?: number;
    bbox?: [number, number, number, number];
    radiusM?: number;
  },
): Promise<Venue[]> {
  const lat = opts.lat ?? ORIGIN.lat;
  const lng = opts.lng ?? ORIGIN.lng;
  const radius = opts.radiusM ?? NEIGHBORHOOD_M;

  const bboxClause = opts.bbox
    ? sql`AND ST_Intersects(
        v.geom::geometry,
        ST_MakeEnvelope(${opts.bbox[0]}, ${opts.bbox[1]}, ${opts.bbox[2]}, ${opts.bbox[3]}, 4326)
      )`
    : sql``;

  const result = await db.execute(sql`
    SELECT
      v.id, v.name, v.category, v.lat, v.lng, v.hours,
      a.plugs, a.wifi, a.parking, a.groups, a.calls,
      (
        SELECT COALESCE(json_agg(json_build_object('text', t.body, 'locale', t.locale)), '[]'::json)
        FROM tips t WHERE t.venue_id = v.id
      ) AS tips,
      (
        SELECT COALESCE(json_agg(json_build_object(
          'at', p.at,
          'confidence', p.confidence,
          'note', p.note,
          'signals', (
            SELECT json_agg(json_build_object('attribute', s.attribute, 'value', s.value))
            FROM signals s WHERE s.pulse_id = p.id
          )
        ) ORDER BY p.at DESC), '[]'::json)
        FROM pulses p WHERE p.venue_id = v.id
      ) AS pulses
    FROM venues v
    JOIN amenities a ON a.venue_id = v.id
    WHERE ST_DWithin(
      v.geom,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${radius}
    )
    ${bboxClause}
  `);

  return (result.rows as VenueRow[]).map(toVenue);
}

export async function loadVenue(db: Db, id: string): Promise<Venue | undefined> {
  const all = await loadVenues(db, { radiusM: 20_000_000 });
  return all.find((v) => v.id === id);
}

export function rankedPayload(
  list: Venue[],
  chips: Record<ChipId, boolean>,
  lat: number,
  lng: number,
) {
  const ranked = rankVenues(list, chips, "pt", { lat, lng });
  return {
    venues: list,
    ranked: ranked.map((c) => c.venue.id),
  };
}
