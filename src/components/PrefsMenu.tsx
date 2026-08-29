import { useRef, useState } from "react";
import { useI18n } from "../i18n";
import { useDismiss } from "../lib/dismiss";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";

/**
 * On narrow screens the theme and language pills don't fit in the header,
 * so they collapse into this dropdown. CSS decides which form shows.
 */
export function PrefsMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useDismiss(root, open, () => setOpen(false));

  return (
    <div className="account prefs-trigger" ref={root}>
      <button
        className="auth-btn icon"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("prefs")}
        title={t("prefs")}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </g>
          <circle cx="9" cy="7" r="2.6" fill="var(--raised)" stroke="currentColor" strokeWidth="2" />
          <circle cx="15" cy="17" r="2.6" fill="var(--raised)" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {open && (
        <div className="account-menu prefs-menu">
          <div className="prefs-row">
            <span>{t("theme")}</span>
            <ThemeToggle />
          </div>
          <div className="prefs-row">
            <span>{t("language")}</span>
            <LangToggle />
          </div>
        </div>
      )}
    </div>
  );
}
