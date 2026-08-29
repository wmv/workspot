import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useI18n } from "../i18n";
import { haversineMeters } from "../lib/geo";
import { radioArrowPick } from "../lib/keys";
import { useGeo } from "../lib/location";
import type { LivePulse, Pulse } from "../lib/types";
import { CHECKIN_RADIUS_M } from "../lib/types";
import { useVenues } from "../lib/venueStore";

type Row<K extends keyof Pulse> = {
  key: K;
  options: Pulse[K][];
};

const ROWS = [
  { key: "plugs", options: ["yes", "hard", "no"] },
  { key: "noise", options: ["quiet", "medium", "loud"] },
  { key: "crowd", options: ["open", "busy", "packed"] },
  { key: "calls", options: ["yes", "maybe", "no"] },
  { key: "group4", options: ["yes", "maybe", "no"] },
] as const satisfies Row<keyof Pulse>[];

type Answers = {
  plugs: Pulse["plugs"] | null;
  noise: Pulse["noise"] | null;
  crowd: Pulse["crowd"] | null;
  calls: Pulse["calls"] | null;
  group4: Pulse["group4"] | null;
};

const EMPTY: Answers = {
  plugs: null,
  noise: null,
  crowd: null,
  calls: null,
  group4: null,
};

export function PulseScreen() {
  const { id } = useParams();
  const { t } = useI18n();
  const { getVenue, addPulse, setToast } = useVenues();
  const geo = useGeo();
  const navigate = useNavigate();
  const sheet = useRef<HTMLDivElement>(null);
  const venue = id ? getVenue(id) : undefined;

  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);

  const complete = ROWS.every((row) => answers[row.key] !== null);

  useEffect(() => {
    const first = sheet.current?.querySelector("button");
    first?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && venue) {
        e.preventDefault();
        navigate(`/v/${venue.id}`);
      }
      if (e.key !== "Tab" || !sheet.current) return;
      const focusable = [
        ...sheet.current.querySelectorAll<HTMLElement>(
          "button, textarea, a[href]",
        ),
      ].filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, venue]);

  if (!venue) {
    return (
      <div className="pulse-root" role="dialog" aria-modal="true">
        <div className="pulse-sheet" ref={sheet}>
          <p className="empty">{t("notFound")}</p>
          <Link className="cta inline" to="/">
            {t("home")}
          </Link>
        </div>
      </div>
    );
  }

  function pick<K extends keyof Answers>(key: K, value: NonNullable<Answers[K]>) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setError(false);
  }

  async function submit() {
    if (!complete || !venue) return;
    const meters = haversineMeters(geo.origin, venue);
    const remote =
      geo.status !== "granted" || meters > CHECKIN_RADIUS_M;
    const pulse: LivePulse = {
      at: new Date().toISOString(),
      plugs: answers.plugs!,
      noise: answers.noise!,
      crowd: answers.crowd!,
      calls: answers.calls!,
      group4: answers.group4!,
      confidence: remote ? "remote" : "on-site",
      note: note.trim() || undefined,
    };
    try {
      await addPulse(venue.id, pulse, geo.origin);
      setToast(t("pulseThanks"));
      navigate(`/v/${venue.id}`);
    } catch {
      setError(true);
    }
  }

  const far =
    geo.status === "granted" &&
    haversineMeters(geo.origin, venue) > CHECKIN_RADIUS_M;

  return (
    <div
      className="pulse-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pulse-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) navigate(`/v/${venue.id}`);
      }}
    >
      <div className="pulse-sheet" ref={sheet}>
        <div className="pulse-head">
          <p className="pulse-venue">{venue.name}</p>
          <h1 id="pulse-title">{t("pulseTitle")}</h1>
          <Link className="pulse-x" to={`/v/${venue.id}`} aria-label={t("back")}>
            ×
          </Link>
        </div>

        {far && <p className="banner">{t("pulseRemote")}</p>}

        <div className="pulse-rows">
          {ROWS.map((row) => (
            <div key={row.key} className="pulse-row">
              <p id={`pulse-q-${row.key}`}>{t(`pulse.q.${row.key}`)}</p>
              <div
                className="pulse-opts"
                role="radiogroup"
                aria-labelledby={`pulse-q-${row.key}`}
                onKeyDown={(e) =>
                  radioArrowPick(e, row.options, (value) => pick(row.key, value))
                }
              >
                {row.options.map((opt, idx) => (
                  <button
                    key={String(opt)}
                    type="button"
                    role="radio"
                    aria-checked={answers[row.key] === opt}
                    tabIndex={
                      answers[row.key] === opt ||
                      (answers[row.key] === null && idx === 0)
                        ? 0
                        : -1
                    }
                    onClick={() => pick(row.key, opt)}
                  >
                    {t(`val.pulse.${row.key}.${opt}`)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {noteOpen ? (
          <textarea
            className="pulse-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("pulseNotePh")}
          />
        ) : (
          <button
            className="pulse-detail"
            type="button"
            onClick={() => setNoteOpen(true)}
          >
            {t("pulseAddDetail")}
          </button>
        )}

        {error && (
          <button className="banner err" type="button" onClick={submit}>
            {t("pulseFail")}
          </button>
        )}

        <button
          className="cta inline pulse-submit"
          type="button"
          disabled={!complete}
          onClick={submit}
        >
          {t("pulseSend")}
        </button>
      </div>
    </div>
  );
}
