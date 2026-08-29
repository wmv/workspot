import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

export type Db = NodePgDatabase<typeof schema>;

export type Hyperdrive = { connectionString: string };

export function databaseUrl(env?: { HYPERDRIVE?: Hyperdrive }): string {
  const fromDrive = env?.HYPERDRIVE?.connectionString;
  if (fromDrive) return fromDrive;
  const fromEnv = process.env.DATABASE_URL;
  if (!fromEnv) throw new Error("DATABASE_URL or HYPERDRIVE is required");
  return fromEnv;
}

const nodePools = new Map<string, pg.Pool>();

// Workers forbid reusing a TCP socket opened during one request from another
// request, so behind Hyperdrive each request gets a fresh pool the caller must
// close (Hyperdrive holds the real server-side pool, so this is cheap). The
// long-lived node dev server keeps a normal cached pool instead.
export function makeDb(env?: { HYPERDRIVE?: Hyperdrive }): {
  db: Db;
  close?: () => Promise<void>;
} {
  const url = databaseUrl(env);
  if (env?.HYPERDRIVE?.connectionString) {
    const pool = new pg.Pool({ connectionString: url, max: 2 });
    return { db: drizzle(pool, { schema }), close: () => pool.end() };
  }
  let pool = nodePools.get(url);
  if (!pool) {
    pool = new pg.Pool({ connectionString: url, max: 4 });
    nodePools.set(url, pool);
  }
  return { db: drizzle(pool, { schema }) };
}
