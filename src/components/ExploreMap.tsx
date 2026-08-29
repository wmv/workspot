import { AttributionControl, Map, Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { ORIGIN } from "../lib/geo";
import { MAP_STYLES } from "../lib/maplibre";
import { useTheme } from "../lib/theme";
import type { CardModel } from "../lib/venues";

export function ExploreMap({
  cards,
  selectedId,
  hoverId,
  user,
  onSelect,
  visible,
}: {
  cards: CardModel[];
  selectedId?: string;
  hoverId?: string | null;
  user?: { lat: number; lng: number } | null;
  onSelect: (id: string) => void;
  visible: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markers = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const puck = useRef<Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const { resolved } = useTheme();
  const themeRef = useRef(resolved);
  themeRef.current = resolved;

  useEffect(() => {
    if (!root.current || mapRef.current) return;
    const map = new Map({
      container: root.current,
      style: MAP_STYLES[themeRef.current],
      center: [ORIGIN.lng, ORIGIN.lat],
      zoom: 14.2,
      attributionControl: false,
    });
    // Top-right keeps the licence pill clear of the bottom venue sheet.
    map.addControl(new AttributionControl({ compact: true }), "top-right");
    map.on("load", () => map.resize());
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markers.current.clear();
      puck.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const ids = new Set(cards.map((c) => c.venue.id));
    for (const [id, marker] of markers.current) {
      if (!ids.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    }

    for (const card of cards) {
      const active = card.venue.id === selectedId || card.venue.id === hoverId;
      let marker = markers.current.get(card.venue.id);
      if (!marker) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "pin";
        el.tabIndex = -1;
        el.setAttribute("aria-label", card.venue.name);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectRef.current(card.venue.id);
        });
        marker = new Marker({ element: el, anchor: "center" })
          .setLngLat([card.venue.lng, card.venue.lat])
          .addTo(map);
        markers.current.set(card.venue.id, marker);
      }
      const el = marker.getElement();
      el.setAttribute("aria-label", card.venue.name);
      el.classList.toggle("is-on", active);
      el.classList.toggle("is-closed-pin", card.open === "closed");
    }

    if (user) {
      if (!puck.current) {
        const el = document.createElement("div");
        el.className = "puck";
        puck.current = new Marker({ element: el, anchor: "center" })
          .setLngLat([user.lng, user.lat])
          .addTo(map);
      } else {
        puck.current.setLngLat([user.lng, user.lat]);
      }
    } else if (puck.current) {
      puck.current.remove();
      puck.current = null;
    }
  }, [cards, selectedId, hoverId, user]);

  useEffect(() => {
    mapRef.current?.resize();
  }, [visible]);

  // DOM markers survive a style swap, so switching themes is just setStyle.
  useEffect(() => {
    mapRef.current?.setStyle(MAP_STYLES[resolved]);
  }, [resolved]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const selected = cards.find((c) => c.venue.id === selectedId);
    if (selected) {
      map.easeTo({
        center: [selected.venue.lng, selected.venue.lat],
        zoom: Math.max(map.getZoom(), 15),
        duration: 400,
      });
    }
  }, [selectedId, cards]);

  return (
    <div className="map-root">
      <div ref={root} className="map-canvas" />
    </div>
  );
}
