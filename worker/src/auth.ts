import type { Context } from "hono";
import { AUTH_BASE_URL } from "../../src/lib/authUrl.ts";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export async function resolveUser(
  authorization: string | undefined,
): Promise<AuthUser | null> {
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  try {
    const res = await fetch(`${AUTH_BASE_URL}/get-session`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      user?: { id: string; email: string; name?: string | null };
      session?: unknown;
    } | null;
    if (!body?.user?.id || !body.session) return null;
    return {
      id: body.user.id,
      email: body.user.email,
      name: body.user.name,
    };
  } catch {
    return null;
  }
}

export function bearer(c: Context): string | undefined {
  return c.req.header("authorization") ?? undefined;
}
