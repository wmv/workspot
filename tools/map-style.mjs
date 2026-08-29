// Generates public/map-styles/dark.json: OpenFreeMap's "dark" style with its
// neutral grays warmed into the app's green-dark palette. Tiles, glyphs and
// sprites keep pointing at OpenFreeMap. Rerun after tweaking the knobs below:
//   node tools/map-style.mjs
const UPSTREAM = "https://tiles.openfreemap.org/styles/dark";

// The app's dark family (--shade #1a211c) sits around hue 150.
const HUE = 150;
const SAT = 0.10; // how much green the grays pick up
const WATER = { h: 190, s: 0.16 }; // water leans blue-green to stay readable

function parse(c) {
  let m;
  if ((m = c.match(/^#([0-9a-f]{3})$/i))) {
    const [r, g, b] = [...m[1]].map((x) => parseInt(x + x, 16));
    return { r, g, b, a: 1 };
  }
  if ((m = c.match(/^#([0-9a-f]{6})$/i))) {
    const n = parseInt(m[1], 16);
    return { r: n >> 16, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  if ((m = c.match(/^rgba?\(([^)]+)\)$/))) {
    const [r, g, b, a = 1] = m[1].split(",").map(Number);
    return { r, g, b, a };
  }
  if ((m = c.match(/^hsla?\(([^)]+)\)$/))) {
    const parts = m[1].split(",").map((x) => parseFloat(x));
    const [h, s, l, a = 1] = parts;
    return { ...hslToRgb(h, s / 100, l / 100), a };
  }
  return null;
}

function rgbToHsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToRgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(f(h + 1 / 3) * 255),
    g: Math.round(f(h) * 255),
    b: Math.round(f(h - 1 / 3) * 255),
  };
}

function warm(c, { h = HUE, s = SAT } = {}) {
  const rgb = parse(c);
  if (!rgb) return c;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  // Grays get the brand hue; anything already colored keeps its own hue.
  const isGray = hsl.s < 0.15;
  const out = hslToRgb(isGray ? h : hsl.h, isGray ? s : hsl.s, hsl.l);
  return rgb.a === 1
    ? `rgb(${out.r},${out.g},${out.b})`
    : `rgba(${out.r},${out.g},${out.b},${rgb.a})`;
}

function walk(node, fn) {
  if (Array.isArray(node)) return node.map((v) => walk(v, fn));
  if (node && typeof node === "object")
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v, fn)]));
  if (typeof node === "string" && /^(#|rgb|hsl)/.test(node)) return fn(node);
  return node;
}

const style = await (await fetch(UPSTREAM)).json();
style.name = "WorkSpot Dark";
style.layers = style.layers.map((layer) => {
  const tint = /^water/.test(layer.id) ? WATER : undefined;
  return walk(layer, (c) => warm(c, tint));
});

const { mkdir, writeFile } = await import("node:fs/promises");
await mkdir("public/map-styles", { recursive: true });
await writeFile("public/map-styles/dark.json", JSON.stringify(style));
console.log("wrote public/map-styles/dark.json,", style.layers.length, "layers");
