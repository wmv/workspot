import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

// MapLibre resolves its worker relative to import.meta.url at runtime, which
// Vite cannot see at build time — without this the worker request falls
// through to the SPA fallback and the map renders no tiles.
setWorkerUrl(maplibreWorkerUrl);

export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
