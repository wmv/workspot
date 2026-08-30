import { useI18n } from "../i18n";
import type { PendingSuggestion } from "../lib/pendingSuggestions";

export function PendingCard({ suggestion }: { suggestion: PendingSuggestion }) {
  const { t } = useI18n();
  return (
    <div className="card is-pending" aria-label={suggestion.name}>
      <div className="card-top">
        <div className="name">{suggestion.name}</div>
        <div className="badge pending">{t("pendingBadge")}</div>
      </div>
      <div className="meta">
        <span className="cat">{t(`cat.${suggestion.category}`)}</span>
      </div>
      <p className="pending-note">{t("pendingNote")}</p>
    </div>
  );
}
