import { useI18n } from "../i18n";
import { useTheme, type ThemePref } from "../lib/theme";

const OPTIONS: { pref: ThemePref; glyph: string }[] = [
  { pref: "light", glyph: "☀" },
  { pref: "auto", glyph: "◐" },
  { pref: "dark", glyph: "☾" },
];

export function ThemeToggle() {
  const { t } = useI18n();
  const { pref, setPref } = useTheme();
  return (
    <div className="lang" role="group" aria-label={t("theme")}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.pref}
          type="button"
          aria-pressed={pref === opt.pref}
          aria-label={t(`theme.${opt.pref}`)}
          title={t(`theme.${opt.pref}`)}
          onClick={() => setPref(opt.pref)}
        >
          {opt.glyph}
        </button>
      ))}
    </div>
  );
}
