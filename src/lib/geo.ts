/** Ingombota centroid — T1 fallback until T2 location. */
export const ORIGIN = { lat: -8.8145, lng: 13.2348 };

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

export function formatDistance(meters: number, locale: "pt" | "en"): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const n = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  return locale === "pt" ? `${n.replace(".", ",")} km` : `${n} km`;
}
