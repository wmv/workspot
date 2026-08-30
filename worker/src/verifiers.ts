import { sql } from "drizzle-orm";
import type { Db } from "./db.ts";

type EnvLike = { VERIFIER_USER_IDS?: string };

export async function isVerifier(
  db: Db,
  userId: string,
  env?: EnvLike,
): Promise<boolean> {
  const fromEnv = (env?.VERIFIER_USER_IDS ?? process.env.VERIFIER_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv.includes(userId)) return true;

  const row = await db.execute(
    sql`SELECT 1 FROM verifiers WHERE user_id = ${userId} LIMIT 1`,
  );
  return row.rows.length > 0;
}
