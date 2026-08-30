import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = `
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  geom geography(Point, 4326) NOT NULL,
  hours JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS amenities (
  venue_id TEXT PRIMARY KEY REFERENCES venues(id) ON DELETE CASCADE,
  plugs TEXT NOT NULL,
  wifi TEXT NOT NULL,
  parking TEXT NOT NULL,
  groups TEXT NOT NULL,
  calls TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tips (
  id SERIAL PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  locale TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pulses (
  id UUID PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  at TIMESTAMPTZ NOT NULL,
  confidence TEXT NOT NULL,
  note TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY,
  pulse_id UUID NOT NULL REFERENCES pulses(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL,
  value TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS venue_suggestions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  note TEXT,
  locale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS venues_geom_gix ON venues USING GIST (geom);
CREATE INDEX IF NOT EXISTS signals_venue_at ON signals (venue_id, at DESC);
CREATE INDEX IF NOT EXISTS suggestions_status ON venue_suggestions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS suggestions_ip ON venue_suggestions (ip_hash, created_at DESC);

ALTER TABLE venue_suggestions ADD COLUMN IF NOT EXISTS submitted_by TEXT;
ALTER TABLE venue_suggestions ADD COLUMN IF NOT EXISTS submitted_by_email TEXT;
ALTER TABLE venue_suggestions ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE venue_suggestions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS verifiers (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS suggestions_submitted_by
  ON venue_suggestions (submitted_by, created_at DESC);
`;

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(sql);
await client.end();
console.log("migrated");
