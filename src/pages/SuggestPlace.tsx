import { Map } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n";
import { postSuggestion } from "../lib/api";
import { authClient, signInWithGitHub } from "../lib/auth";
import { radioArrowPick } from "../lib/keys";
import { useGeo } from "../lib/location";
import { MAP_STYLES } from "../lib/maplibre";
import { useTheme } from "../lib/theme";
import type { Category } from "../lib/types";
import { useVenues } from "../lib/venueStore";

const CATEGORIES: Category[] = ["cafe", "cowork", "library", "other"];

export function SuggestPlace() {
  const { t, locale } = useI18n();
  const { setToast } = useVenues();
  const { data: session, isPending } = authClient.useSession();
  const { resolved: theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const geo = useGeo();
  const navigate = useNavigate();
  const mapRoot = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const centeredOnUser = useRef(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<"fail" | "limit" | "auth" | null>(null);
  const [sending, setSending] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!mapRoot.current || mapRef.current || !session) return;
    const map = new Map({
      container: mapRoot.current,
      style: MAP_STYLES[themeRef.current],
      center: [geo.origin.lng, geo.origin.lat],
      zoom: 15.5,
      attributionControl: false,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    mapRef.current?.setStyle(MAP_STYLES[theme]);
  }, [theme]);

  useEffect(() => {
    if (geo.status === "granted" && mapRef.current && !centeredOnUser.current) {
      centeredOnUser.current = true;
      mapRef.current.jumpTo({ center: [geo.origin.lng, geo.origin.lat] });
    }
  }, [geo.status, geo.origin]);

  const complete = name.trim().length >= 2 && category !== null;

  async function submit() {
    if (!complete || sending || !mapRef.current || !session) return;
    const center = mapRef.current.getCenter();
    setSending(true);
    setError(null);
    try {
      await postSuggestion({
        name: name.trim(),
        category: category!,
        lat: center.lat,
        lng: center.lng,
        note: note.trim() || undefined,
        locale,
      });
      setToast(t("suggestThanks"));
      navigate("/");
    } catch (e) {
      if (e instanceof Error && e.message.includes("401")) setError("auth");
      else setError(e instanceof Error && e.message.includes("429") ? "limit" : "fail");
    } finally {
      setSending(false);
    }
  }

  if (isPending) {
    return (
      <div className="suggest-root">
        <p className="suggest-intro">{t("locPending")}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="suggest-root">
        <header className="suggest-head">
          <Link className="ghost" to="/">
            ← {t("back")}
          </Link>
          <h1>{t("suggestTitle")}</h1>
          <p className="suggest-intro">{t("suggestSignIn")}</p>
        </header>
        <button
          className="cta inline"
          type="button"
          disabled={signingIn}
          onClick={async () => {
            setSigningIn(true);
            try {
              const res = await signInWithGitHub();
              if (res.error) setToast(t("signInFail"));
            } catch {
              setToast(t("signInFail"));
            } finally {
              setSigningIn(false);
            }
          }}
        >
          {t("signIn")}
        </button>
      </div>
    );
  }

  return (
    <div className="suggest-root">
      <header className="suggest-head">
        <Link className="ghost" to="/">
          ← {t("back")}
        </Link>
        <h1>{t("suggestTitle")}</h1>
        <p className="suggest-intro">{t("suggestIntro")}</p>
      </header>

      <div className="suggest-map">
        <div ref={mapRoot} className="map-canvas" />
        <div className="suggest-pin" aria-hidden="true" />
      </div>
      <p className="suggest-hint">{t("suggestPin")}</p>

      <div className="suggest-form">
        <label htmlFor="suggest-name">{t("suggestName")}</label>
        <input
          id="suggest-name"
          type="text"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("suggestNamePh")}
        />

        <p id="suggest-cat-label">{t("suggestCategory")}</p>
        <div
          className="pulse-opts"
          role="radiogroup"
          aria-labelledby="suggest-cat-label"
          onKeyDown={(e) => radioArrowPick(e, CATEGORIES, setCategory)}
        >
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat}
              type="button"
              role="radio"
              aria-checked={category === cat}
              tabIndex={category === cat || (category === null && idx === 0) ? 0 : -1}
              onClick={() => setCategory(cat)}
            >
              {t(`cat.${cat}`)}
            </button>
          ))}
        </div>

        <textarea
          className="pulse-note"
          rows={2}
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("suggestNote")}
        />

        {error && (
          <button className="banner err" type="button" onClick={submit}>
            {t(
              error === "limit"
                ? "suggestLimit"
                : error === "auth"
                  ? "suggestSignIn"
                  : "suggestFail",
            )}
          </button>
        )}

        <button
          className="cta inline"
          type="button"
          disabled={!complete || sending}
          onClick={submit}
        >
          {t("suggestSend")}
        </button>
      </div>
    </div>
  );
}
