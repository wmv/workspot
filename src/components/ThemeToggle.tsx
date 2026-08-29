import type { ReactNode } from "react";
import { useI18n } from "../i18n";
import { useTheme, type ThemePref } from "../lib/theme";

// Inline SVGs render identically everywhere; unicode glyphs (☀ ◐ ☾) fall
// back to emoji or hairline fonts depending on the platform.
const ICONS: { pref: ThemePref; icon: ReactNode }[] = [
  {
    pref: "light",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.6" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="1.5" x2="12" y2="4.5" />
          <line x1="12" y1="19.5" x2="12" y2="22.5" />
          <line x1="1.5" y1="12" x2="4.5" y2="12" />
          <line x1="19.5" y1="12" x2="22.5" y2="12" />
          <line x1="4.6" y1="4.6" x2="6.7" y2="6.7" />
          <line x1="17.3" y1="17.3" x2="19.4" y2="19.4" />
          <line x1="4.6" y1="19.4" x2="6.7" y2="17.3" />
          <line x1="17.3" y1="6.7" x2="19.4" y2="4.6" />
        </g>
      </svg>
    ),
  },
  {
    pref: "auto",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="8.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M12 3.5 A8.5 8.5 0 0 1 12 20.5 Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    pref: "dark",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20.2 14.5A8.8 8.8 0 0 1 9.5 3.8 8.8 8.8 0 1 0 20.2 14.5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

export function ThemeToggle() {
  const { t } = useI18n();
  const { pref, setPref } = useTheme();
  return (
    <div className="lang theme" role="group" aria-label={t("theme")}>
      {ICONS.map((opt) => (
        <button
          key={opt.pref}
          type="button"
          aria-pressed={pref === opt.pref}
          aria-label={t(`theme.${opt.pref}`)}
          title={t(`theme.${opt.pref}`)}
          onClick={() => setPref(opt.pref)}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
