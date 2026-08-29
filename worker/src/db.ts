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

const pools = new Map<string, pg.Pool>();

export function getDb(env?: { HYPERDRIVE?: Hyperdrive }): Db {
  const url = databaseUrl(env);
  let pool = pools.get(url);
  if (!pool) {
    pool = new pg.Pool({ connectionString: url, max: 4 });
    pools.set(url, pool);
  }
  return drizzle(pool, { schema });
}
