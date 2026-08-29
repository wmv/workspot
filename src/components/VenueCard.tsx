import { Link } from "react-router-dom";
import { formatRecency, useI18n } from "../i18n";
import type { CardModel } from "../lib/venues";

export function VenueCard({
  card,
  selected,
  showFit,
  onHighlight,
}: {
  card: CardModel;
  selected?: boolean;
  showFit?: boolean;
  onHighlight?: (id: string | null) => void;
}) {
  const { t } = useI18n();
  return (
    <Link
      className={`card ${card.state} ${selected ? "is-selected" : ""}`}
      to={`/v/${card.venue.id}`}
      onMouseEnter={() => onHighlight?.(card.venue.id)}
      onMouseLeave={() => onHighlight?.(null)}
      onFocus={() => onHighlight?.(card.venue.id)}
      onBlur={() => onHighlight?.(null)}
    >
      <div className="card-top">
        <div className="name">{card.venue.name}</div>
        <div className={`badge ${card.open === "closed" ? "shut" : card.open === "unknown" ? "unk" : ""}`}>
          {t(card.open === "open" ? "open" : card.open === "closed" ? "shut" : "openUnknown")}
        </div>
      </div>
      <div className="meta">
        <span className="cat">{t(`cat.${card.venue.category}`)}</span>
        <span>{card.distance}</span>
      </div>
      <div className="recency">{formatRecency(t, card.hoursAgo)}</div>
      <div className="signals">
        {card.signals.map((s) => (
          <span key={s} className="sig">
            {s}
          </span>
        ))}
      </div>
      {showFit && <span className="fit">{t("fit")}</span>}
    </Link>
  );
}
