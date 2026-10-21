// The site's pixel scenes. Each takes a <canvas> and runs. All motion is slow
// and stepped, like the pixel art: moss grows a cell at a time, single cells
// glow and fade, spores drift up, water moves along.

import { Pixels, play, random, reducedMotion, type Cell } from "./pixels.ts";

const pick = <T>(rnd: () => number, list: T[]): T | undefined => list[Math.floor(rnd() * list.length)];

interface Bank {
  top: number[]; // each column's top stone row
  height: number[]; // moss on it now
  max: number[]; // the most it will grow
  shade: Cell[][]; // each column's moss below the tip, top down
}

// Stone along the bottom of the grid with river rows under it; moss seeded at
// a few columns. Nothing is random at render time: the seed decides it all.
function bank(p: Pixels, seed: number, river: number, seeds: number): Bank {
  const rnd = random(seed), { cols, rows } = p;
  const stoneBottom = rows - river - 1, phase = rnd() * 10;
  const top: number[] = [], max: number[] = [], shade: Cell[][] = [];
  for (let x = 0; x < cols; x++) {
    const lift = Math.sin(x / 7 + phase) * 1.4 + Math.sin(x / 3.1 + phase * 2) * 0.8;
    top.push(Math.max(1, Math.min(stoneBottom, Math.round(stoneBottom - 1.5 - lift))));
    const n = 0.5 + 0.3 * Math.sin(x / 5.3 + phase) + 0.2 * Math.sin(x / 2.2 + phase * 3);
    max.push(n < 0.25 ? 0 : Math.min(top[x]!, Math.round(1 + n * 4)));
    shade.push(Array.from({ length: 8 }, () => (rnd() < 0.3 ? "D" : "M")));
  }
  const cells: Cell[][] = Array.from({ length: rows }, () => Array<Cell>(cols).fill("."));
  for (let x = 0; x < cols; x++) for (let y = top[x]!; y <= stoneBottom; y++) cells[y]![x] = "S";
  for (let y = stoneBottom + 1; y < rows; y++) for (let x = 0; x < cols; x++) cells[y]![x] = rnd() < 0.18 ? "r" : "R";
  p.set(cells);
  const b: Bank = { top, height: Array<number>(cols).fill(0), max, shade };
  const grow = growBank(p, b);
  for (let i = 0; i < seeds; i++) {
    const x = Math.floor(rnd() * cols);
    if (b.max[x]! > 0) grow(x);
  }
  return b;
}

// One step of growth on column x: the old tip darkens, a new bright tip
// appears above it, and a tall enough tuft drapes moss over the stone's edge.
function growBank(p: Pixels, b: Bank): (x: number) => void {
  return (x) => {
    const k = b.height[x]!, top = b.top[x]!;
    if (k > 0) p.cells[top - k]![x] = b.shade[x]![k - 1]!;
    p.cells[top - 1 - k]![x] = "L";
    b.height[x] = k + 1;
    if (k + 1 === 3 && p.cells[top]?.[x] === "S") p.cells[top]![x] = "D";
  };
}

// Columns that can grow: below their limit, beside moss, and never taller
// than a neighbour by more than one cell, so it spreads as a cushion, not a
// spike.
function frontier(b: Bank): number[] {
  return b.height.flatMap((h, x) => {
    const left = b.height[x - 1] ?? 0, right = b.height[x + 1] ?? 0;
    const ok = h < b.max[x]! && (h > 0 || left > 0 || right > 0) && h <= Math.max(left, right);
    return ok ? [x] : [];
  });
}

// The riverbank: a landscape the full width of its canvas, 16 px a cell.
// Starts a third grown, then fills in over a couple of minutes and rests,
// while the river runs at three speeds. A new width lays out a new bank.
export function riverbank(canvas: HTMLCanvasElement): void {
  const rnd = random(23);
  let b: Bank, grow: (x: number) => void;
  const step = (): void => { const x = pick(rnd, frontier(b)); if (x !== undefined) grow(x); };
  const lay = (p: Pixels): void => {
    b = bank(p, 11, 3, Math.max(2, Math.round(p.cols / 14)));
    grow = growBank(p, b);
    const total = b.max.reduce((a, m) => a + m, 0);
    for (let i = 0; i < (reducedMotion() ? total : total * 0.35); i++) step();
  };
  const p = new Pixels(canvas, 16, lay);
  play(p, [
    [850, step],
    [3100, () => { const t = pick(rnd, p.tips()); if (t) p.glow(...t); }],
    [4700, () => { const t = pick(rnd, p.tips()); if (t) p.spore(...t, 7000); }],
    [520, () => p.flow([p.rows - 3])],
    [780, () => p.flow([p.rows - 2])],
    [1150, () => p.flow([p.rows - 1])],
  ]);
}
