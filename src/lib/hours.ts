import type { HourBlock } from "./types";

const TZ = "Africa/Luanda";

function partsInLuanda(now: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bits = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    bits.weekday ?? "Mon",
  );
  const [h, m] = (bits.hour + ":" + bits.minute).split(":").map(Number);
  return { weekday, minutes: h * 60 + m };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function isOpenNow(hours: HourBlock[], now = new Date()): boolean {
  const { weekday, minutes } = partsInLuanda(now);
  return hours.some((block) => {
    if (!block.days.includes(weekday)) return false;
    const start = toMinutes(block.open);
    const end = toMinutes(block.close);
    if (end < start) return minutes >= start || minutes <= end;
    return minutes >= start && minutes < end;
  });
}

export function hoursLabel(hours: HourBlock[], locale: "pt" | "en"): string {
  const weekdays = hours.find((h) =>
    [1, 2, 3, 4, 5].every((d) => h.days.includes(d)),
  );
  if (!weekdays) return locale === "pt" ? "Horário variável" : "Hours vary";
  return locale === "pt"
    ? `Seg–Sex ${weekdays.open}–${weekdays.close}`
    : `Mon–Fri ${weekdays.open}–${weekdays.close}`;
}
