import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useMatch, useNavigate } from "react-router-dom";
import { ExploreMap } from "../components/ExploreMap";
import { Shell } from "../components/Shell";
import { VenueCard } from "../components/VenueCard";
import { useI18n } from "../i18n";
import { inSeedNeighborhood, useGeo } from "../lib/location";
import type { ChipId } from "../lib/types";
import { CHIP_ORDER, DEFAULT_CHIPS } from "../lib/types";
import { useVenues } from "../lib/venueStore";
import { toolbarArrowFocus } from "../lib/keys";
import { rankVenues } from "../lib/venues";
import { useWide } from "../lib/wide";

export function Explore() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const wide = useWide();
  const [chips, setChips] = useState(DEFAULT_CHIPS);
  const [view, setView] = useState<"list" | "map">("list");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [ficha, setFicha] = useState(false);
  const [offline, setOffline] = useState(() =>
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const geo = useGeo();
  const { venues } = useVenues();
  const detailMatch = useMatch("/v/:id");
  const pulseMatch = useMatch("/v/:id/pulse");
  const selectedId = detailMatch?.params.id ?? pulseMatch?.params.id;

  const nearby = inSeedNeighborhood(geo.origin, venues);
  const cards = useMemo(
    () => rankVenues(venues, chips, locale, geo.origin),
    [chips, locale, geo.origin, venues],
  );
  const selectedCard = cards.find((c) => c.venue.id === selectedId);

  const extraOn = CHIP_ORDER.some((id) => id !== "open" && chips[id]);
  const showList = geo.status === "granted" && nearby && cards.length > 0;
  const showDenied = geo.status === "denied";
  const showPending = geo.status === "pending";
  const showBbox = geo.status === "granted" && !nearby;
  const showTight =
    (geo.status === "granted" && nearby && cards.length === 0) ||
    (geo.status === "unavailable" && cards.length === 0);
  const showFallbackList = geo.status === "unavailable" && cards.length > 0;
  const canShowCards = showList || showFallbackList;

  const showFullDetail =
    Boolean(selectedId) && (wide ? ficha : view === "list");

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!selectedId) setFicha(false);
  }, [selectedId]);

  function toggle(id: ChipId) {
    setChips((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const locLabel =
    geo.status === "granted" ? t("locNear") : t("locFallback");

  return (
    <Shell wide>
      <div
        className={`explore-body ${view === "map" ? "is-map" : ""} ${selectedId ? "is-detail" : ""} ${showFullDetail ? "is-ficha" : ""}`}
      >
        <div className="explore-col">
          <button className="loc" type="button" onClick={geo.request}>
            <svg viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
            </svg>
            {locLabel}
          </button>

          <section className="hero">
            <p className="eyebrow">
              <span className="dot" aria-hidden="true" />
              {t("now")}
            </p>
            <h1>{t("hero")}</h1>
            <p className="count">
              {canShowCards
                ? t("count", { n: venues.length, m: cards.length })
                : showTight
                  ? t("countNone")
                  : "\u00a0"}
            </p>
          </section>

          <div
            className="chips"
            role="toolbar"
            aria-label="Filtros"
            onKeyDown={toolbarArrowFocus}
          >
            {CHIP_ORDER.map((id) => (
              <button
                key={id}
                className="chip"
                type="button"
                aria-pressed={chips[id]}
                onClick={() => toggle(id)}
              >
                {t(`chip.${id}`)}
              </button>
            ))}
            {extraOn && (
              <button
                className="chip clear"
                type="button"
                onClick={() => setChips(DEFAULT_CHIPS)}
              >
                {t("clear")}
              </button>
            )}
          </div>

          <div className="toolbar">
            <div
              className="seg"
              role="group"
              aria-label={t("map")}
              onKeyDown={toolbarArrowFocus}
            >
              <button
                type="button"
                aria-pressed={view === "map"}
                onClick={() => setView("map")}
              >
                {t("map")}
              </button>
              <button
                type="button"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                {t("list")}
              </button>
            </div>
          </div>

          {offline && <div className="banner">{t("offline")}</div>}

          <main className="list">
            {showPending && <p className="empty">{t("locPending")}</p>}

            {showDenied && (
              <div className="empty-block">
                <p>{t("locDenied")}</p>
                <button className="cta inline" type="button" onClick={geo.request}>
                  {t("locAllow")}
                </button>
              </div>
            )}

            {showBbox && (
              <div className="empty-block">
                <p>{t("emptyBbox")}</p>
              </div>
            )}

            {showTight && (
              <div className="empty-block">
                <p>{t("emptyFilters")}</p>
                <button
                  className="cta inline"
                  type="button"
                  onClick={() => setChips(DEFAULT_CHIPS)}
                >
                  {t("clear")}
                </button>
              </div>
            )}

            {canShowCards &&
              cards.map((card) => (
                <VenueCard
                  key={card.venue.id}
                  card={card}
                  selected={selectedId === card.venue.id}
                  showFit={extraOn}
                  onHighlight={setHoverId}
                />
              ))}

            <Link className="suggest-entry" to="/suggest">
              + {t("suggestEntry")}
            </Link>
          </main>

          <nav className="dock" aria-label="Navegação">
            <span>
              <i />
              {t("tab")}
            </span>
          </nav>
        </div>

        <aside className="detail-pane">
          <div className="map-stack">
            <ExploreMap
              cards={canShowCards ? cards : []}
              selectedId={selectedId}
              hoverId={hoverId}
              user={geo.status === "granted" ? geo.origin : null}
              onSelect={(id) => navigate(`/v/${id}`)}
              visible={wide || view === "map"}
            />
            {selectedCard && !showFullDetail && !pulseMatch && (
              <div className="map-sheet">
                <VenueCard
                  card={selectedCard}
                  selected
                  showFit={extraOn}
                />
                <div className="sheet-actions">
                  {wide ? (
                    <button
                      className="cta inline"
                      type="button"
                      onClick={() => setFicha(true)}
                    >
                      {t("viewPlace")}
                    </button>
                  ) : (
                    <button
                      className="cta inline"
                      type="button"
                      onClick={() => setView("list")}
                    >
                      {t("viewPlace")}
                    </button>
                  )}
                  <a
                    className="ghost"
                    href={`geo:${selectedCard.venue.lat},${selectedCard.venue.lng}`}
                  >
                    {t("directions")}
                  </a>
                </div>
              </div>
            )}
          </div>
          {(showFullDetail || pulseMatch) && (
            <div className={`detail-layer ${showFullDetail ? "is-open" : "is-host"}`}>
              <Outlet context={{ origin: geo.origin }} />
            </div>
          )}
        </aside>
      </div>
    </Shell>
  );
}
