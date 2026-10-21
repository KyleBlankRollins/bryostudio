// Builds brand/dist/ from the pixel grids in brand/marks.ts and the themes in
// brand/themes.ts, then brings the site's copies up to date. Run it after
// changing a grid or a theme; it replaces brand/dist/ in full.
//
//   npm run brand
//
// It fails, writing nothing, if a theme's text, links or focus ring are too
// low in contrast to read. Rasters are only ever drawn at whole pixels per
// cell, so the edges stay sharp; SVGs are drawn in cell units.

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync } from "node:zlib";
import opentype from "opentype.js";
import { contrast, mix } from "../brand/colour.ts";
import { grown, growthDurationsMs, growthFrames, mound, tuft, type Grid, type Palette, type Role } from "../brand/marks.ts";
import { daylight, night, themes, type Theme } from "../brand/themes.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "brand", "dist");
const site = join(root, "site");

// ---------- themes ----------

// Each role's CSS custom property.
const roleVars: Record<Role, string> = {
  L: "--mark-moss-light",
  M: "--mark-moss",
  D: "--mark-moss-deep",
  S: "--mark-stone",
  R: "--mark-river",
  r: "--mark-ripple",
  I: "--mark-ink",
  T: "--mark-ink-muted",
};
const roles = Object.keys(roleVars) as Role[];

// A theme as CSS custom properties: its ui colours, the soft tints derived
// from them, and its mark colours.
function tokens(theme: Theme): [string, string][] {
  const { ui, mark } = theme;
  return [
    ["--bg", ui.bg],
    ["--surface", ui.surface],
    ["--text", ui.text],
    ["--muted", ui.muted],
    ["--border", ui.border],
    ["--moss", ui.moss],
    ["--river", ui.river],
    ["--focus", ui.focus],
    ["--moss-soft", mix(ui.bg, mark.M, 0.18)],
    ["--river-soft", mix(ui.bg, mark.R, 0.18)],
    ...roles.map((role): [string, string] => [roleVars[role], mark[role]]),
  ];
}

// WCAG AA: 4.5:1 for text, 3:1 for the focus ring and the mark.
function checkContrast(theme: Theme): string[] {
  const t = Object.fromEntries(tokens(theme));
  const pairs: [string, string, string, number][] = [
    ["text on bg", t["--text"]!, t["--bg"]!, 4.5],
    ["text on surface", t["--text"]!, t["--surface"]!, 4.5],
    ["muted on bg", t["--muted"]!, t["--bg"]!, 4.5],
    ["muted on surface", t["--muted"]!, t["--surface"]!, 4.5],
    ["moss (links) on bg", t["--moss"]!, t["--bg"]!, 4.5],
    ["moss (links) on surface", t["--moss"]!, t["--surface"]!, 4.5],
    ["river on bg", t["--river"]!, t["--bg"]!, 4.5],
    ["river on surface", t["--river"]!, t["--surface"]!, 4.5],
    ["text on moss-soft", t["--text"]!, t["--moss-soft"]!, 4.5],
    ["text on river-soft", t["--text"]!, t["--river-soft"]!, 4.5],
    ["button text (bg) on moss", t["--bg"]!, t["--moss"]!, 4.5],
    ["focus ring on bg", t["--focus"]!, t["--bg"]!, 3],
    ["mark moss on bg", t["--mark-moss"]!, t["--bg"]!, 3],
  ];
  return pairs
    .map(([what, a, b, min]) => ({ what, ratio: contrast(a, b), min }))
    .filter(({ ratio, min }) => ratio < min)
    .map(({ what, ratio, min }) => `${theme.name}: ${what} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
}

// ---------- grids ----------

interface Cell {
  x: number;
  y: number;
  role: Role;
}

function width(grid: Grid): number {
  return Math.max(...grid.map((row) => row.length));
}

function cells(grid: Grid): Cell[] {
  const out: Cell[] = [];
  grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      if (!(ch in roleVars)) throw new Error(`unknown cell "${ch}" at ${x},${y}`);
      out.push({ x, y, role: ch as Role });
    }),
  );
  return out;
}

function checkGrid(name: string, grid: Grid): void {
  const w = grid[0]?.length ?? 0;
  if (w === 0 || grid.some((row) => row.length !== w)) throw new Error(`${name}: rows must all be one length`);
  cells(grid);
}

// ---------- SVG ----------

const num = (v: number): string => String(+v.toFixed(3));

// How a role is painted: a fixed colour, or a class the page's CSS colours.
type Paint = (role: Role) => string;
const fills = (palette: Palette): Paint => (role) => `fill="${palette[role]}"`;
const classes: Paint = (role) => `class="cell-${role}"`;

// Solid cells, the default: each run of one role along a row is one
// rectangle, and each paint is one path.
function solidCells(grid: Grid, paint: Paint, ox = 0, oy = 0, scale = 1): string {
  const runs = new Map<string, string[]>();
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const ch = row[x]!;
      let end = x + 1;
      while (row[end] === ch) end++;
      if (ch !== ".") {
        const key = paint(ch as Role);
        const w = (end - x) * scale;
        const d = `M${num(ox + x * scale)} ${num(oy + y * scale)}h${num(w)}v${num(scale)}h${num(-w)}z`;
        runs.set(key, [...(runs.get(key) ?? []), d]);
      }
      x = end;
    }
  });
  return [...runs].map(([key, d]) => `<path ${key} d="${d.join("")}"/>`).join("\n");
}

// Gapped cells, for large uses only: each cell a little apart, its corners
// slightly rounded, as on the design boards.
function gappedCells(grid: Grid, paint: Paint): string {
  const gap = 0.07, side = 1 - 2 * gap, radius = side * 0.16;
  const groups = new Map<string, string[]>();
  for (const { x, y, role } of cells(grid)) {
    const rect = `<rect x="${num(x + gap)}" y="${num(y + gap)}" width="${num(side)}" height="${num(side)}" rx="${num(radius)}"/>`;
    const key = paint(role);
    groups.set(key, [...(groups.get(key) ?? []), rect]);
  }
  return [...groups].map(([key, rects]) => `<g ${key}>${rects.join("")}</g>`).join("\n");
}

// pxPerUnit sets the default display size; CSS width and height override it.
function svg(w: number, h: number, body: string, pxPerUnit: number, crisp: boolean): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(w)} ${num(h)}" width="${num(w * pxPerUnit)}" height="${num(h * pxPerUnit)}"${crisp ? ' shape-rendering="crispEdges"' : ""} role="img">`,
    "<title>Bryo Studio</title>",
    body,
    "</svg>",
    "",
  ].join("\n");
}

// ---------- "STUDIO" in DejaVu Sans Mono Bold, as outlines ----------

const fontBytes = readFileSync(join(root, "brand", "fonts", "DejaVuSansMono-Bold.ttf"));
const font = opentype.parse(new Uint8Array(fontBytes).buffer);
const capHeight = font.charToGlyph("T").getBoundingBox().y2 / font.unitsPerEm;

interface Outlined {
  d: string;
  right: number;
  bottom: number;
}

// Letters with their cap tops at capTop; tracking is extra space per letter, in ems.
function outline(text: string, x: number, capTop: number, size: number, tracking: number): Outlined {
  const baseline = capTop + capHeight * size;
  let pen = x, right = x, bottom = baseline;
  const parts: string[] = [];
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    const path = glyph.getPath(pen, baseline, size);
    const box = path.getBoundingBox();
    parts.push(path.toPathData(3));
    right = Math.max(right, box.x2);
    bottom = Math.max(bottom, box.y2);
    pen += ((glyph.advanceWidth ?? 0) / font.unitsPerEm + tracking) * size;
  }
  return { d: parts.join(""), right, bottom };
}

// The wordmark in wordmark cells: Grown on top, "STUDIO" a cell below it at
// 1.5 cells, tracked wide, as on the board.
function wordmark(paint: Paint, ox = 0, oy = 0): { body: string; w: number; h: number } {
  const studio = outline("STUDIO", ox + 0.1, oy + grown.length + 1, 1.5, 0.9);
  return {
    body: `${solidCells(grown, paint, ox, oy)}\n<path ${paint("T")} d="${studio.d}"/>`,
    w: Math.max(width(grown), studio.right - ox),
    h: studio.bottom - oy,
  };
}

// ---------- PNG and ICO ----------

interface Image {
  w: number;
  h: number;
  rgba: Buffer;
}

function rgb(hex: string): [number, number, number] {
  const v = Number.parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

// The grid at a whole number of pixels per cell, with optional padding and background.
function raster(grid: Grid, palette: Palette, perCell: number, pad = 0, background?: string): Image {
  const w = width(grid) * perCell + 2 * pad, h = grid.length * perCell + 2 * pad;
  const rgba = Buffer.alloc(w * h * 4);
  const fill = (x0: number, y0: number, fw: number, fh: number, hex: string): void => {
    const [r, g, b] = rgb(hex);
    for (let y = y0; y < y0 + fh; y++)
      for (let x = x0; x < x0 + fw; x++) rgba.set([r, g, b, 255], (y * w + x) * 4);
  };
  if (background) fill(0, 0, w, h, background);
  for (const { x, y, role } of cells(grid)) fill(pad + x * perCell, pad + y * perCell, perCell, perCell, palette[role]);
  return { w, h, rgba };
}

function png({ w, h, rgba }: Image): Buffer {
  const chunk = (type: string, data: Buffer): Buffer => {
    const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body), body.length + 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w, 0);
  header.writeUInt32BE(h, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8 bits, RGBA, no interlace
  const raw = Buffer.alloc((w * 4 + 1) * h); // each row starts with filter type 0
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// An ICO holding PNGs, which every current browser and Windows reads.
function ico(images: Image[]): Buffer {
  const pngs = images.map(png);
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach((image, i) => {
    const e = 6 + 16 * i, data = pngs[i]!;
    head.writeUInt8(image.w % 256, e); // 0 means 256
    head.writeUInt8(image.h % 256, e + 1);
    head.writeUInt16LE(1, e + 4); // colour planes
    head.writeUInt16LE(32, e + 6); // bits per pixel
    head.writeUInt32LE(data.length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...pngs]);
}

// ---------- checks ----------

const frames = growthFrames();
const grids: [string, Grid][] = [["tuft", tuft], ["mound", mound], ["grown", grown], ...frames.map((f, i): [string, Grid] => [`growth t${i}`, f])];
for (const [name, grid] of grids) checkGrid(name, grid);

const failures = themes.flatMap(checkContrast);
if (failures.length > 0) {
  console.error(["Contrast too low:", ...failures].join("\n  "));
  process.exit(1);
}

// ---------- build ----------

const written: string[] = [];
function write(file: string, data: string | Buffer): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
  written.push(relative(root, file));
}

rmSync(dist, { recursive: true, force: true });

// Every asset, once per theme, in brand/dist/<theme>/.
for (const theme of themes) {
  const out = (path: string, data: string | Buffer): void => write(join(dist, theme.id, path), data);
  const paint = fills(theme.mark);

  out("svg/tuft.svg", svg(width(tuft), tuft.length, solidCells(tuft, paint), 32, true));
  out("svg/tuft-gapped.svg", svg(width(tuft), tuft.length, gappedCells(tuft, paint), 32, false));
  out("svg/mound.svg", svg(width(mound), mound.length, solidCells(mound, paint), 32, true));
  out("svg/mound-gapped.svg", svg(width(mound), mound.length, gappedCells(mound, paint), 32, false));

  // Wordmark and lockups. Units are wordmark cells; the Tuft is drawn at 1.25
  // of them beside the wordmark and 1.5 above it.
  const mark = wordmark(paint);
  out("svg/wordmark.svg", svg(mark.w, mark.h, mark.body, 8, false));
  {
    const t = 1.25, gap = 3, beside = wordmark(paint, width(tuft) * t + gap, 0);
    const body = `${solidCells(tuft, paint, 0, 0.17, t)}\n${beside.body}`;
    out("svg/lockup-horizontal.svg", svg(width(tuft) * t + gap + beside.w, Math.max(tuft.length * t + 0.17, beside.h), body, 8, false));
  }
  {
    const t = 1.5, gap = 2, tuftW = width(tuft) * t;
    const below = wordmark(paint, Math.max(0, (tuftW - mark.w) / 2), tuft.length * t + gap);
    const w = Math.max(tuftW, below.w);
    const body = `${solidCells(tuft, paint, (w - tuftW) / 2, 0, t)}\n${below.body}`;
    out("svg/lockup-stacked.svg", svg(w, tuft.length * t + gap + below.h, body, 8, false));
  }

  // Rasters: @Nx means N pixels per cell.
  for (const n of [2, 4, 8, 16, 32, 64]) out(`png/tuft@${n}x.png`, png(raster(tuft, theme.mark, n)));
  for (const n of [4, 8, 16, 32]) out(`png/mound@${n}x.png`, png(raster(mound, theme.mark, n)));

  // Favicons. The touch icon needs an opaque background; iOS would fill it black.
  out("favicon/favicon.svg", svg(width(tuft), tuft.length, solidCells(tuft, paint), 4, true));
  out("favicon/favicon.ico", ico([2, 4, 6].map((n) => raster(tuft, theme.mark, n))));
  out("favicon/apple-touch-icon.png", png(raster(tuft, theme.mark, 18, 18, theme.ui.bg)));

  // Growth: a sprite sheet with the frames left to right, its timing, and an
  // SVG that plays it once and holds on the Tuft. The SVG shows only the last
  // frame to anyone who prefers reduced motion.
  const sheet = tuft.map((_, y) => frames.map((f) => f[y] ?? "").join(""));
  out("growth/growth-sprite@1x.png", png(raster(sheet, theme.mark, 1)));
  out("growth/growth-sprite@8x.png", png(raster(sheet, theme.mark, 8)));
  out(
    "growth/growth.json",
    JSON.stringify(
      {
        image: "growth-sprite@1x.png",
        frameWidth: width(tuft),
        frameHeight: tuft.length,
        frames: frames.length,
        durationsMs: growthDurationsMs,
        loop: false,
        note: "Frames run left to right. Scale with nearest-neighbour filtering only.",
      },
      null,
      2,
    ) + "\n",
  );
  const total = growthDurationsMs.reduce((a, b) => a + b, 0);
  let start = 0;
  const rules = growthDurationsMs.map((ms, i) => {
    const from = num((start / total) * 100), to = num(((start + ms) / total) * 100);
    start += ms;
    const steps = i === frames.length - 1 ? `0%{visibility:hidden}${from}%{visibility:visible}` : `0%{visibility:hidden}${from}%{visibility:visible}${to}%{visibility:hidden}`;
    return `@keyframes f${i}{${steps}}.f${i}{animation:f${i} ${total}ms step-end forwards}`;
  });
  const style = [
    "<style>",
    `g{visibility:hidden}.f${frames.length - 1}{visibility:visible}`,
    ...rules,
    "@media (prefers-reduced-motion:reduce){g{animation:none!important}}",
    "</style>",
  ].join("\n");
  const groups = frames.map((f, i) => `<g class="f${i}">\n${solidCells(f, paint)}\n</g>`).join("\n");
  out("growth/growth.svg", svg(width(tuft), tuft.length, `${style}\n${groups}`, 32, true));
}

// For the web: the tokens, a favicon that follows the system's light or dark
// setting, and a Tuft coloured by the page's CSS.
const block = (theme: Theme, indent: string): string =>
  [`color-scheme: ${theme.scheme};`, ...tokens(theme).map(([name, value]) => `${name}: ${value};`)].map((l) => indent + l).join("\n");
const tokensCss = [
  "/* The Bryo Studio themes as CSS custom properties. Generated by",
  "   scripts/build-brand.ts from brand/themes.ts; edit those, not this. */",
  "",
  "/* Daylight unless the system asks for dark; a choice made with the theme",
  "   toggle (data-theme on <html>) wins over the system. */",
  `:root {\n${block(daylight, "  ")}\n}`,
  "",
  `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme]) {\n${block(night, "    ")}\n  }\n}`,
  "",
  ...themes.filter((t) => t !== daylight).map((t) => `:root[data-theme="${t.id}"] {\n${block(t, "  ")}\n}\n`),
  "/* The marks' cells, for SVGs drawn with classes (brand/dist/web/tuft-inline.svg). */",
  ...roles.map((role) => `.cell-${role} { fill: var(${roleVars[role]}); }`),
  "",
].join("\n");
write(join(dist, "web", "tokens.css"), tokensCss);

const adaptiveStyle = [
  "<style>",
  ...roles.map((role) => `.cell-${role}{fill:${daylight.mark[role]}}`),
  `@media (prefers-color-scheme:dark){${roles.map((role) => `.cell-${role}{fill:${night.mark[role]}}`).join("")}}`,
  "</style>",
].join("\n");
const adaptiveFavicon = svg(width(tuft), tuft.length, `${adaptiveStyle}\n${solidCells(tuft, classes)}`, 4, true);
write(join(dist, "web", "favicon.svg"), adaptiveFavicon);

const inlineTuft = `<svg viewBox="0 0 ${width(tuft)} ${tuft.length}" width="32" height="32" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${solidCells(tuft, classes).replace(/\n/g, "")}</svg>`;
write(join(dist, "web", "tuft-inline.svg"), inlineTuft + "\n");

// The site's copies. The header mark sits between <!-- brand:tuft --> markers
// in every page and is replaced in place.
write(join(site, "tokens.css"), tokensCss);
write(join(site, "favicon.svg"), adaptiveFavicon);
write(join(site, "favicon.ico"), ico([2, 4, 6].map((n) => raster(tuft, night.mark, n))));
write(join(site, "apple-touch-icon.png"), png(raster(tuft, night.mark, 18, 18, night.ui.bg)));
const pages = (readdirSync(site, { recursive: true }) as string[]).filter((p) => p.endsWith(".html"));
for (const page of pages) {
  const file = join(site, page), html = readFileSync(file, "utf8");
  const updated = html.replace(/<!-- brand:tuft -->[\s\S]*?<!-- \/brand:tuft -->/g, `<!-- brand:tuft -->${inlineTuft}<!-- /brand:tuft -->`);
  if (updated !== html) write(file, updated);
}

console.log(written.join("\n"));
console.log(`${written.length} files written`);
