export type Locale = "pt" | "en";

export type Category = "cafe" | "library" | "cowork" | "other";

export type ChipId =
  | "open"
  | "plugs"
  | "quiet"
  | "calls"
  | "wifi"
  | "park"
  | "group";

export type HourBlock = {
  days: number[];
  open: string;
  close: string;
};

// "unknown" means not yet verified by the team or a pulse — real venues are
// seeded from OSM with only what the data actually says.
export type Facts = {
  plugs: "yes" | "limited" | "no" | "unknown";
  wifi: "fast" | "ok" | "unreliable" | "no" | "unknown";
  parking: "easy" | "limited" | "none" | "unknown";
  groups: "welcome" | "tolerated" | "solo" | "unknown";
  calls: "good" | "headphones" | "bad" | "unknown";
};

export type Pulse = {
  hoursAgo: number;
  plugs: "yes" | "hard" | "no";
  noise: "quiet" | "medium" | "loud";
  crowd: "open" | "busy" | "packed";
  calls: "yes" | "maybe" | "no";
  group4: "yes" | "maybe" | "no";
  confidence?: "on-site" | "remote";
  note?: string;
  at?: string;
};

export type LivePulse = Omit<Pulse, "hoursAgo"> & {
  at: string;
  confidence: "on-site" | "remote";
};

export type Tip = { text: string; locale: Locale };

export type Venue = {
  id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  hours: HourBlock[];
  facts: Facts;
  pulses: Pulse[];
  tips: Tip[];
};

export const CHIP_ORDER: ChipId[] = [
  "open",
  "plugs",
  "quiet",
  "calls",
  "wifi",
  "park",
  "group",
];

export const DEFAULT_CHIPS: Record<ChipId, boolean> = {
  open: true,
  plugs: false,
  quiet: false,
  calls: false,
  wifi: false,
  park: false,
  group: false,
};

export const CHECKIN_RADIUS_M = 150;
