import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { AuthButton } from "./AuthButton";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";

export function Shell({
  children,
  wide,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className={wide ? "app wide" : "app"}>
      <header className="top">
        <Link to="/" className="wordmark">
          <svg className="mark" viewBox="0 0 44 44" aria-hidden="true">
            <path
              d="M6 15 L14 37 L22 21 L30 37 L38 15"
              fill="none"
              stroke="currentColor"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="22" cy="8.5" r="4.5" fill="var(--laterite)" />
          </svg>
          <span className="wordmark-text">{t("brand")}</span>
        </Link>
        <div className="top-controls">
          <ThemeToggle />
          <LangToggle />
          <AuthButton />
        </div>
      </header>
      {children}
    </div>
  );
}
