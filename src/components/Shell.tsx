import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
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
          {t("brand")}
        </Link>
        <div className="top-controls">
          <ThemeToggle />
          <LangToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
