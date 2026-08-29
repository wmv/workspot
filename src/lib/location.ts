import { useCallback, useEffect, useState } from "react";
import { haversineMeters, ORIGIN } from "./geo";
import type { Venue } from "./types";

export const NEIGHBORHOOD_M = 12_000;

export type GeoStatus = "pending" | "granted" | "denied" | "unavailable";

export type Geo = {
  status: GeoStatus;
  origin: { lat: number; lng: number };
  request: () => void;
};

export function inSeedNeighborhood(
  origin: { lat: number; lng: number },
  list: Venue[],
): boolean {
  if (!list.length) return false;
  return list.some((v) => haversineMeters(origin, v) <= NEIGHBORHOOD_M);
}

export function useGeo(): Geo {
  const [status, setStatus] = useState<GeoStatus>("pending");
  const [origin, setOrigin] = useState(ORIGIN);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      setOrigin(ORIGIN);
      return;
    }
    setStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus("denied");
        else setStatus("unavailable");
        setOrigin(ORIGIN);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { status, origin, request };
}
