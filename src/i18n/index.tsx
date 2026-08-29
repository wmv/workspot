import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "./en.json";
import pt from "./pt.json";
import type { Locale } from "../lib/types";

const catalogs = { pt, en } as const;
const COOKIE = "ws_lang";

function readLocale(): Locale {
  const fromCookie = document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${COOKIE}=`))
    ?.split("=")[1];
  if (fromCookie === "en" || fromCookie === "pt") return fromCookie;
  return "pt";
}

function writeLocale(locale: Locale) {
  document.cookie = `${COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = locale;
}

type Ctx = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const initial = readLocale();
    document.documentElement.lang = initial;
    return initial;
  });

  const setLocale = useCallback((next: Locale) => {
    writeLocale(next);
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const table = catalogs[locale] as Record<string, string>;
      const fallback = catalogs.pt as Record<string, string>;
      let s = table[key] ?? fallback[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replaceAll(`{${k}}`, String(v));
        }
      }
      return s;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n outside LocaleProvider");
  return ctx;
}

export function formatRecency(
  t: Ctx["t"],
  hoursAgo: number | null,
): string {
  if (hoursAgo === null) return t("recency.none");
  if (hoursAgo < 2 / 60) return t("recency.now");
  if (hoursAgo < 1) {
    const mins = Math.max(1, Math.round(hoursAgo * 60));
    return t("recency.fresh", { n: t("time.m", { n: mins }) });
  }
  if (hoursAgo < 24) {
    const n = Math.round(hoursAgo);
    return t("recency.fresh", { n: t("time.h", { n }) });
  }
  const n = Math.round(hoursAgo / 24);
  return t("recency.stale", { n: t("time.d", { n }) });
}
