// Pixel scenes (src/scripts/scenes.ts): a grid of cells on a canvas in the
// theme's mark colours, changed a step at a time.
// A scene only runs while it is on screen (and the tab is visible), and
// anyone who prefers reduced motion gets its finished, still state.

import type { Role } from "../../brand/marks.ts";

export type Cell = Role | ".";

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
const moss = (c: Cell | undefined): boolean => c === "L" || c === "M" || c === "D";

export const reducedMotion = (): boolean => matchMedia("(prefers-reduced-motion: reduce)").matches;

// A small seeded random generator, so a scene looks the same on every visit.
export function random(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Fade {
  x: number;
  y: number;
  age: number; // ms
  life: number; // ms
}

// Every live scene, so a theme change can recolour them all.
const live = new Set<Pixels>();
let colours: Partial<Record<Role, string>> = {};
function readColours(): void {
  const style = getComputedStyle(document.documentElement);
  colours = Object.fromEntries(Object.entries(roleVars).map(([role, name]) => [role, style.getPropertyValue(name).trim()]));
  live.forEach((p) => p.render());
}
readColours();
new MutationObserver(readColours).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColours);

// The grid fills the canvas's box (set by CSS) at a fixed cell size; when the
// box changes size, onResize lays out the scene again.
export class Pixels {
  cols = 0;
  rows = 0;
  cells: Cell[][] = [];
  private glows: Fade[] = [];
  private spores: Fade[] = [];
  private device = 1; // device pixels per cell
  readonly canvas: HTMLCanvasElement;
  private readonly cell: number;
  private readonly onResize: (p: Pixels) => void;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, cell: number, onResize: (p: Pixels) => void) {
    this.canvas = canvas;
    this.cell = cell;
    this.onResize = onResize;
    this.ctx = canvas.getContext("2d")!;
    canvas.setAttribute("aria-hidden", "true");
    live.add(this);
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
  }

  // The canvas draws at exactly its size on screen, so nothing is rescaled
  // and blurred; the last row and column may be cut short.
  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.device = Math.max(1, Math.round(this.cell * dpr));
    this.canvas.width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    this.canvas.height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    const cols = Math.ceil(this.canvas.width / this.device), rows = Math.ceil(this.canvas.height / this.device);
    const changed = cols !== this.cols || rows !== this.rows;
    this.cols = cols;
    this.rows = rows;
    if (changed) this.onResize(this);
    this.render();
  }

  set(cells: Cell[][]): void {
    this.cells = cells.map((row) => [...row]);
  }

  // The moss cells with nothing above them: where new growth shows.
  tips(): [number, number][] {
    const out: [number, number][] = [];
    this.cells.forEach((row, y) => row.forEach((c, x) => {
      if (moss(c) && !moss(this.cells[y - 1]?.[x])) out.push([x, y]);
    }));
    return out;
  }

  // A cell brightens and fades back, over life ms.
  glow(x: number, y: number, life = 2600): void {
    this.glows.push({ x, y, age: 0, life });
  }

  // A spore leaves a cell and drifts up, fading, over life ms.
  spore(x: number, y: number, life = 6000): void {
    this.spores.push({ x, y: y - 0.5, age: 0, life });
  }

  // Water flows: the river and ripple cells of each row move one cell along.
  flow(rows: number[], direction: 1 | -1 = 1): void {
    for (const y of rows) {
      const row = this.cells[y];
      if (!row) continue;
      const water = row.flatMap((c, x) => (c === "R" || c === "r" ? [x] : []));
      const kinds = water.map((x) => row[x]!);
      water.forEach((x, i) => (row[x] = kinds[(i - direction + kinds.length) % kinds.length]!));
    }
  }

  advance(ms: number): void {
    for (const f of [...this.glows, ...this.spores]) f.age += ms;
    this.glows = this.glows.filter((f) => f.age < f.life);
    this.spores = this.spores.filter((f) => f.age < f.life);
  }

  render(): void {
    const { ctx, device: d } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cells.forEach((row, y) => row.forEach((c, x) => {
      if (c === ".") return;
      ctx.fillStyle = colours[c] ?? "#000";
      ctx.fillRect(x * d, y * d, d, d);
    }));
    // Light: single cells glowing and fading.
    ctx.fillStyle = "#fff";
    for (const g of this.glows) {
      ctx.globalAlpha = 0.4 * Math.sin((Math.PI * g.age) / g.life);
      ctx.fillRect(g.x * d, g.y * d, d, d);
    }
    // Spores: half a cell, rising a cell every 900 ms.
    ctx.fillStyle = colours.L ?? "#8fd16a";
    for (const s of this.spores) {
      ctx.globalAlpha = 0.9 * (1 - s.age / s.life);
      const y = s.y - s.age / 900, x = s.x + 0.25 + 0.3 * Math.sin(s.age / 1400);
      ctx.fillRect(Math.round(x * d), Math.round(y * d), Math.ceil(d / 2), Math.ceil(d / 2));
    }
    ctx.globalAlpha = 1;
  }
}

// Runs a scene's timers, each [every ms, step], while its canvas is on
// screen. Drawing is capped at about 30 frames a second; the steps
// themselves are slow.
export function play(p: Pixels, timers: [number, () => void][]): void {
  if (reducedMotion()) {
    p.render();
    return;
  }
  const due = timers.map(() => 0);
  let raf = 0, last = 0, drawn = 0;
  const frame = (now: number): void => {
    const dt = last ? Math.min(now - last, 250) : 0;
    last = now;
    timers.forEach(([every, step], i) => {
      due[i]! += dt;
      while (due[i]! >= every) {
        due[i]! -= every;
        step();
      }
    });
    p.advance(dt);
    if (now - drawn > 32) {
      p.render();
      drawn = now;
    }
    raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    } else if (!entry?.isIntersecting && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }).observe(p.canvas);
}
