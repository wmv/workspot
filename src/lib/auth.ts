import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

// Neon Auth is managed Better Auth; this base URL is public (the server only
// honours redirects to trusted domains registered with `neon neon-auth domain`).
// Neon's own client (rather than plain better-auth) is required here: sessions
// live on the auth domain, so after the OAuth redirect the client must exchange
// the one-time ?neon_auth_session_verifier= for a session — the SDK does that
// on page load and strips the parameter from the URL.
export const AUTH_BASE_URL =
  "https://ep-twilight-leaf-acsmmcnv.neonauth.sa-east-1.aws.neon.tech/neondb/auth";

export const authClient = createAuthClient(AUTH_BASE_URL, {
  adapter: BetterAuthReactAdapter(),
});

export function signInWithGitHub() {
  return authClient.signIn.social({
    provider: "github",
    callbackURL: window.location.origin,
  });
}
