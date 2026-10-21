// Drawing the grids as SVG, shared by scripts/build-brand.ts and the site's
// <Tuft /> component. SVGs are drawn in cell units.

import type { Grid, Palette, Role } from "./marks.ts";

const roleChars = new Set<string>(["L", "M", "D", "S", "R", "r", "I", "T"] satisfies Role[]);

export interface Cell {
  x: number;
  y: number;
  role: Role;
}

export function width(grid: Grid): number {
  return Math.max(...grid.map((row) => row.length));
}

export function cells(grid: Grid): Cell[] {
  const out: Cell[] = [];
  grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      if (!roleChars.has(ch)) throw new Error(`unknown cell "${ch}" at ${x},${y}`);
      out.push({ x, y, role: ch as Role });
    }),
  );
  return out;
}

export const num = (v: number): string => String(+v.toFixed(3));

// How a role is painted: a fixed colour, or a class the page's CSS colours
// (tokens.css has a .cell-<role> rule for each).
export type Paint = (role: Role) => string;
export const fills = (palette: Palette): Paint => (role) => `fill="${palette[role]}"`;
export const classes: Paint = (role) => `class="cell-${role}"`;

// Solid cells, the default: each run of one role along a row is one
// rectangle, and each paint is one path.
export function solidCells(grid: Grid, paint: Paint, ox = 0, oy = 0, scale = 1): string {
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
export function gappedCells(grid: Grid, paint: Paint): string {
  const gap = 0.07, side = 1 - 2 * gap, radius = side * 0.16;
  const groups = new Map<string, string[]>();
  for (const { x, y, role } of cells(grid)) {
    const rect = `<rect x="${num(x + gap)}" y="${num(y + gap)}" width="${num(side)}" height="${num(side)}" rx="${num(radius)}"/>`;
    const key = paint(role);
    groups.set(key, [...(groups.get(key) ?? []), rect]);
  }
  return [...groups].map(([key, rects]) => `<g ${key}>${rects.join("")}</g>`).join("\n");
}

// A grid for inline use in a page: coloured by the page's CSS, decorative
// (hidden from screen readers), size px wide.
export function inlineSvg(grid: Grid, size: number): string {
  const w = width(grid), h = grid.length;
  return `<svg viewBox="0 0 ${w} ${h}" width="${size}" height="${num((size * h) / w)}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${solidCells(grid, classes).replace(/\n/g, "")}</svg>`;
}
