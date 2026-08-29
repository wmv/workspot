import { useI18n } from "../i18n";

export function LangToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="lang" role="group" aria-label="Idioma">
      <button
        type="button"
        aria-pressed={locale === "pt"}
        onClick={() => setLocale("pt")}
      >
        PT
      </button>
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}
