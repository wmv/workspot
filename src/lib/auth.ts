import { createAuthClient } from "better-auth/react";

// Neon Auth is managed Better Auth; this base URL is public (the server only
// honours redirects to trusted domains registered with `neon neon-auth domain`).
export const AUTH_BASE_URL =
  "https://ep-twilight-leaf-acsmmcnv.neonauth.sa-east-1.aws.neon.tech/neondb/auth";

export const authClient = createAuthClient({ baseURL: AUTH_BASE_URL });

export function signInWithGitHub() {
  return authClient.signIn.social({
    provider: "github",
    callbackURL: window.location.origin,
  });
}
