import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

// MapLibre resolves its worker relative to import.meta.url at runtime, which
// Vite cannot see at build time — without this the worker request falls
// through to the SPA fallback and the map renders no tiles.
setWorkerUrl(maplibreWorkerUrl);

import type { ResolvedTheme } from "./theme";

export const MAP_STYLES: Record<ResolvedTheme, string> = {
  light: "https://tiles.openfreemap.org/styles/positron",
  // Committed fork of OpenFreeMap's dark style, warmed to the app palette.
  // Regenerate with `node tools/map-style.mjs`.
  dark: "/map-styles/dark.json",
};
