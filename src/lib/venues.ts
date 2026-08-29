import seed from "../data/venues.json";
import { formatDistance, haversineMeters, ORIGIN } from "./geo";
import { openState, type OpenState } from "./hours";
import type { ChipId, Locale, Pulse, Venue } from "./types";

export const venues = seed as Venue[];

export function getVenue(id: string): Venue | undefined {
  return venues.find((v) => v.id === id);
}

export function latestPulse(venue: Venue): Pulse | undefined {
  if (!venue.pulses.length) return undefined;
  return [...venue.pulses].sort((a, b) => a.hoursAgo - b.hoursAgo)[0];
}

export function matchesChip(venue: Venue, chip: ChipId, now = new Date()): boolean {
  const pulse = latestPulse(venue);
  switch (chip) {
    case "open":
      // Unknown hours stay visible under "open now" — hiding them would
      // bury every venue we haven't surveyed yet.
      return openState(venue.hours, now) !== "closed";
    case "plugs":
      if (pulse) return pulse.plugs !== "no";
      return venue.facts.plugs !== "no";
    case "quiet":
      if (pulse) return pulse.noise === "quiet";
      return true;
    case "calls":
      if (pulse) return pulse.calls === "yes";
      return venue.facts.calls === "good";
    case "wifi":
      return venue.facts.wifi === "fast" || venue.facts.wifi === "ok";
    case "park":
      return venue.facts.parking === "easy" || venue.facts.parking === "limited";
    case "group":
      if (pulse) return pulse.group4 === "yes";
      return venue.facts.groups !== "solo";
  }
}

export function matchesChips(
  venue: Venue,
  chips: Record<ChipId, boolean>,
  now = new Date(),
): boolean {
  return (Object.keys(chips) as ChipId[]).every(
    (id) => !chips[id] || matchesChip(venue, id, now),
  );
}

export type CardModel = {
  venue: Venue;
  open: OpenState;
  meters: number;
  distance: string;
  recencyKey: "none" | "fresh" | "stale";
  hoursAgo: number | null;
  signals: string[];
  state: "" | "is-stale" | "is-closed" | "is-never";
};

function signalKeys(venue: Venue, locale: Locale): string[] {
  const pulse = latestPulse(venue);
  const out: string[] = [];
  const plugs =
    pulse?.plugs ??
    (venue.facts.plugs === "yes"
      ? "yes"
      : venue.facts.plugs === "no"
        ? "no"
        : venue.facts.plugs === "limited"
          ? "hard"
          : undefined);
  if (plugs === "yes") out.push(locale === "pt" ? "Tomadas fáceis" : "Plugs easy");
  else if (plugs === "hard") out.push(locale === "pt" ? "Tomadas difíceis" : "Plugs hard");
  if (pulse?.noise === "quiet") out.push(locale === "pt" ? "Sossegado" : "Quiet");
  else if (venue.facts.wifi === "fast") out.push(locale === "pt" ? "Wi‑Fi estável" : "Stable Wi‑Fi");
  if (out.length < 2 && (pulse?.group4 === "yes" || venue.facts.groups === "welcome")) {
    out.push(locale === "pt" ? "Grupo de 4" : "Group of 4");
  }
  if (out.length < 2 && (pulse?.calls === "yes" || venue.facts.calls === "good")) {
    out.push(locale === "pt" ? "Chamadas ok" : "OK for calls");
  }
  return out.slice(0, 2);
}

export function toCard(
  venue: Venue,
  locale: Locale,
  origin = ORIGIN,
  now = new Date(),
): CardModel {
  const open = openState(venue.hours, now);
  const meters = haversineMeters(origin, venue);
  const pulse = latestPulse(venue);
  const hoursAgo = pulse ? pulse.hoursAgo : null;
  let recencyKey: CardModel["recencyKey"] = "none";
  let state: CardModel["state"] = "";
  if (hoursAgo === null) {
    recencyKey = "none";
    state = "is-never";
  } else if (hoursAgo > 24) {
    recencyKey = "stale";
    state = "is-stale";
  } else {
    recencyKey = "fresh";
  }
  if (open === "closed") state = "is-closed";
  return {
    venue,
    open,
    meters,
    distance: formatDistance(meters, locale),
    recencyKey,
    hoursAgo,
    signals: signalKeys(venue, locale),
    state,
  };
}

export function rankVenues(
  list: Venue[],
  chips: Record<ChipId, boolean>,
  locale: Locale,
  origin = ORIGIN,
  now = new Date(),
): CardModel[] {
  return list
    .filter((v) => matchesChips(v, chips, now))
    .map((v) => toCard(v, locale, origin, now))
    .sort((a, b) => {
      const rank: Record<OpenState, number> = { open: 0, unknown: 1, closed: 2 };
      if (a.open !== b.open) return rank[a.open] - rank[b.open];
      if (a.meters !== b.meters) return a.meters - b.meters;
      const ah = a.hoursAgo ?? 10_000;
      const bh = b.hoursAgo ?? 10_000;
      return ah - bh;
    });
}
