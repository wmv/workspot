import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { LangToggle } from "./LangToggle";

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
        <LangToggle />
      </header>
      {children}
    </div>
  );
}
