import type { Category, LivePulse, Locale, Venue } from "./types";
import { authHeaders } from "./auth";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

export type VenuesResponse = {
  venues: Venue[];
  ranked: string[];
};

export type MineSuggestion = {
  id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  status: string;
  createdAt: string;
};

export type MeResponse = {
  user: { id: string; email: string; name: string | null } | null;
  isVerifier: boolean;
};

async function read(res: Response) {
  if (res.status === 401) throw new Error("api 401");
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json();
}

export async function fetchMe(): Promise<MeResponse> {
  return read(
    await fetch(`${BASE}/me`, { headers: await authHeaders() }),
  );
}

export async function fetchMySuggestions(): Promise<{ suggestions: MineSuggestion[] }> {
  return read(
    await fetch(`${BASE}/suggestions/mine`, { headers: await authHeaders() }),
  );
}

export async function fetchVenues(opts?: {
  lat?: number;
  lng?: number;
  chips?: string;
}): Promise<VenuesResponse> {
  const q = new URLSearchParams();
  if (opts?.lat != null) q.set("lat", String(opts.lat));
  if (opts?.lng != null) q.set("lng", String(opts.lng));
  if (opts?.chips) q.set("chips", opts.chips);
  const suffix = q.size ? `?${q}` : "";
  return read(await fetch(`${BASE}/venues${suffix}`));
}

export async function postPulse(
  venueId: string,
  pulse: LivePulse,
  origin?: { lat: number; lng: number },
): Promise<Venue> {
  const res = await fetch(`${BASE}/venues/${venueId}/pulses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...pulse,
      lat: origin?.lat,
      lng: origin?.lng,
    }),
  });
  const data = await read(res);
  return data.venue as Venue;
}

export async function postSuggestion(input: {
  name: string;
  category: Category;
  lat: number;
  lng: number;
  note?: string;
  locale: Locale;
}): Promise<{ id: string }> {
  const res = await fetch(`${BASE}/suggestions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify(input),
  });
  return read(res);
}
