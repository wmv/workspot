import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import seed from "../data/venues.json";
import { fetchVenues, postPulse } from "./api";
import type { LivePulse, Venue } from "./types";

const KEY = "ws_pulses";

function hydrate(p: LivePulse): Venue["pulses"][number] {
  return {
    ...p,
    hoursAgo: Math.max(0, (Date.now() - Date.parse(p.at)) / 3_600_000),
  };
}

function readStore(): Record<string, LivePulse[]> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LivePulse[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, LivePulse[]>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function mergeVenue(venue: Venue, extra: LivePulse[]): Venue {
  return { ...venue, pulses: [...venue.pulses, ...extra.map(hydrate)] };
}

type Ctx = {
  venues: Venue[];
  getVenue: (id: string) => Venue | undefined;
  addPulse: (
    venueId: string,
    pulse: LivePulse,
    origin?: { lat: number; lng: number },
  ) => Promise<void>;
  toast: string | null;
  setToast: (msg: string | null) => void;
};

const VenueContext = createContext<Ctx | null>(null);

export function VenueProvider({ children }: { children: ReactNode }) {
  const [remote, setRemote] = useState<Venue[] | null>(null);
  const [extra, setExtra] = useState<Record<string, LivePulse[]>>(readStore);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchVenues();
      setRemote(data.venues);
    } catch {
      /* keep last remote or fall back to seed */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    const tick = window.setInterval(() => void refresh(), 15_000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(tick);
    };
  }, [refresh]);

  const venues = useMemo(() => {
    if (remote) return remote;
    return (seed as Venue[]).map((v) => mergeVenue(v, extra[v.id] ?? []));
  }, [remote, extra]);

  const getVenue = useCallback(
    (id: string) => venues.find((v) => v.id === id),
    [venues],
  );

  const addPulse = useCallback(
    async (
      venueId: string,
      pulse: LivePulse,
      origin?: { lat: number; lng: number },
    ) => {
      try {
        const venue = await postPulse(venueId, pulse, origin);
        setRemote((prev) => {
          const base = prev ?? (seed as Venue[]);
          return base.map((v) => (v.id === venueId ? venue : v));
        });
      } catch (err) {
        if (remote) throw err;
        const prev = readStore();
        const next = { ...prev, [venueId]: [...(prev[venueId] ?? []), pulse] };
        writeStore(next);
        setExtra(next);
      }
    },
    [remote],
  );

  const value = useMemo(
    () => ({ venues, getVenue, addPulse, toast, setToast }),
    [venues, getVenue, addPulse, toast],
  );

  return <VenueContext.Provider value={value}>{children}</VenueContext.Provider>;
}

export function useVenues() {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error("useVenues outside VenueProvider");
  return ctx;
}
