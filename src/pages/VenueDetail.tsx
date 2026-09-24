import { Link, Outlet, useOutletContext, useParams } from "react-router-dom";
import { formatRecency, useI18n } from "../i18n";
import { formatDistance, haversineMeters, ORIGIN } from "../lib/geo";
import { hoursLabel, isOpenNow } from "../lib/hours";
import { useVenues } from "../lib/venueStore";
import { latestPulse } from "../lib/venues";

export type DetailContext = {
  origin: { lat: number; lng: number };
};

export function VenueDetail() {
  const { id } = useParams();
  const { t, locale } = useI18n();
  const ctx = useOutletContext<DetailContext | null>();
  const { getVenue, setToast } = useVenues();
  const origin = ctx?.origin ?? ORIGIN;
  const venue = id ? getVenue(id) : undefined;

  if (!venue) {
    return (
      <div className="detail">
        <p className="empty">{t("notFound")}</p>
        <Link className="cta inline" to="/">
          {t("home")}
        </Link>
      </div>
    );
  }

  const open = isOpenNow(venue.hours);
  const meters = haversineMeters(origin, venue);
  const pulse = latestPulse(venue);
  const pulseN = venue.pulses.length;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`;

  async function handleShare() {
    if (!venue) return;
    const url = window.location.href;
    const shareText = t("shareMessage", { name: venue.name, url });

    if (navigator.share) {
      try {
        await navigator.share({
          title: venue.name,
          text: shareText,
          url,
        });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");

    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url).then(() => {
        setToast(t("shareCopied"));
      });
    }
  }

  const liveLine = pulse
    ? [
        t(`val.pulse.noise.${pulse.noise}`),
        t(`val.pulse.plugs.${pulse.plugs}`),
        t(`val.pulse.crowd.${pulse.crowd}`),
      ].join(" · ")
    : null;

  return (
    <div className={`detail ${open ? "" : "is-closed-venue"}`}>
      <div className="detail-scroll">
        <Link className="back" to="/">
          ← {t("back")}
        </Link>
        <header className="detail-head">
          <h1>{venue.name}</h1>
          <p className="detail-sub">
            {t(`cat.${venue.category}`)} · {formatDistance(meters, locale)}
          </p>
          <p className="detail-hours">
            <span className={`badge ${open ? "" : "shut"}`}>
              {open ? t("open") : t("shut")}
            </span>
            <span>{hoursLabel(venue.hours, locale)}</span>
          </p>
          {liveLine && <p className="detail-live">{liveLine}</p>}
        </header>

        <section className="panel panel-now">
          <h2>{t("nowTitle")}</h2>
          {pulse ? (
            <>
              <dl>
                <div>
                  <dt>{t("row.plugs")}</dt>
                  <dd>{t(`val.pulse.plugs.${pulse.plugs}`)}</dd>
                </div>
                <div>
                  <dt>{t("row.noise")}</dt>
                  <dd>{t(`val.pulse.noise.${pulse.noise}`)}</dd>
                </div>
                <div>
                  <dt>{t("row.crowd")}</dt>
                  <dd>{t(`val.pulse.crowd.${pulse.crowd}`)}</dd>
                </div>
                <div>
                  <dt>{t("row.calls")}</dt>
                  <dd>{t(`val.pulse.calls.${pulse.calls}`)}</dd>
                </div>
                <div>
                  <dt>{t("chip.group")}</dt>
                  <dd>{t(`val.pulse.group4.${pulse.group4}`)}</dd>
                </div>
              </dl>
              <p className="panel-note recency-line">
                {formatRecency(t, pulse.hoursAgo)}
                {" · "}
                {pulseN === 1 ? t("nowCountOne") : t("nowCount", { n: pulseN })}
                {pulse.confidence === "remote" && ` · ${t("pulseRemoteTag")}`}
              </p>
              {pulse.note && <p className="panel-note">{pulse.note}</p>}
            </>
          ) : (
            <p className="panel-note">{t("noPulses")}</p>
          )}
        </section>

        <section className="panel panel-facts">
          <h2>{t("factsTitle")}</h2>
          <dl>
            <div>
              <dt>{t("row.plugs")}</dt>
              <dd>{t(`val.plugs.${venue.facts.plugs}`)}</dd>
            </div>
            <div>
              <dt>{t("row.wifi")}</dt>
              <dd>{t(`val.wifi.${venue.facts.wifi}`)}</dd>
            </div>
            <div>
              <dt>{t("row.parking")}</dt>
              <dd>{t(`val.parking.${venue.facts.parking}`)}</dd>
            </div>
            <div>
              <dt>{t("row.groups")}</dt>
              <dd>{t(`val.groups.${venue.facts.groups}`)}</dd>
            </div>
            <div>
              <dt>{t("row.calls")}</dt>
              <dd>{t(`val.calls.${venue.facts.calls}`)}</dd>
            </div>
          </dl>
          <p className="panel-note">{t("factsNote")}</p>
        </section>

        {venue.tips.length > 0 && (
          <section className="tips">
            <h2>{t("tipsTitle")}</h2>
            <ul>
              {venue.tips.map((tip) => (
                <li key={tip.text}>
                  <p>{tip.text}</p>
                  {tip.locale !== locale && (
                    <span className="tip-lang">{tip.locale.toUpperCase()}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="detail-bar">
        <a
          className="cta inline"
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          {t("directions")}
        </a>
        <button
          type="button"
          className="ghost detail-secondary detail-share-btn"
          onClick={handleShare}
          title={t("share")}
          aria-label={t("share")}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {t("share")}
        </button>
        <Link className="ghost detail-secondary" to={`/v/${venue.id}/pulse`}>
          {t("imHere")}
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
