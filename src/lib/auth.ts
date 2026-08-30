import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";
import { AUTH_BASE_URL } from "./authUrl";

// Neon Auth is managed Better Auth; this base URL is public (the server only
// honours redirects to trusted domains registered with `neon neon-auth domain`).
// Neon's own client (rather than plain better-auth) is required here: sessions
// live on the auth domain, so after the OAuth redirect the client must exchange
// the one-time ?neon_auth_session_verifier= for a session — the SDK does that
// on page load and strips the parameter from the URL.
export { AUTH_BASE_URL };

export const authClient = createAuthClient(AUTH_BASE_URL, {
  adapter: BetterAuthReactAdapter(),
});

export async function authHeaders(): Promise<HeadersInit> {
  const { data } = await authClient.getSession();
  const token = data?.session?.token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function signInWithGitHub() {
  return authClient.signIn.social({
    provider: "github",
    callbackURL: window.location.origin,
  });
}
