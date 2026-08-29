import { useRef, useState } from "react";
import { useI18n } from "../i18n";
import { authClient, signInWithGitHub } from "../lib/auth";
import { useDismiss } from "../lib/dismiss";
import { useVenues } from "../lib/venueStore";

export function AuthButton() {
  const { t } = useI18n();
  const { setToast } = useVenues();
  const { data: session, isPending } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useDismiss(root, open, () => setOpen(false));

  if (isPending) return null;

  if (!session) {
    return (
      <button
        className="auth-btn icon"
        type="button"
        disabled={busy}
        aria-label={t("signIn")}
        title={t("signIn")}
        onClick={async () => {
          setBusy(true);
          try {
            const res = await signInWithGitHub();
            if (res.error) setToast(t("signInFail"));
          } catch {
            setToast(t("signInFail"));
          } finally {
            setBusy(false);
          }
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle
            cx="12"
            cy="8.2"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M4.5 20.5c1.2-3.4 4.1-5.3 7.5-5.3s6.3 1.9 7.5 5.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    );
  }

  const user = session.user;
  return (
    <div className="account" ref={root}>
      <button
        className="auth-btn signed"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user.name ?? user.email}
        onClick={() => setOpen((v) => !v)}
      >
        {user.image ? (
          <img className="avatar" src={user.image} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar fallback">
            {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <div className="account-id">
            <strong>{user.name ?? user.email}</strong>
            {user.name && user.email && <span>{user.email}</span>}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              authClient.signOut();
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M14 5H7a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 7 19h7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M11 12h8.5m-3-3.5 3.5 3.5-3.5 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
