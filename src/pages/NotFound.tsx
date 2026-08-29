import { Link } from "react-router-dom";
import { Shell } from "../components/Shell";
import { useI18n } from "../i18n";

export function NotFound() {
  const { t } = useI18n();
  return (
    <Shell>
      <div className="page">
        <p className="empty">{t("notFound")}</p>
        <Link className="cta" to="/">
          {t("home")}
        </Link>
      </div>
    </Shell>
  );
}
