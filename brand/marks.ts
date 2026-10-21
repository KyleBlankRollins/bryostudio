// The Bryo Studio marks as pixel grids. These are the source for every file in
// brand/dist/ (scripts/build-brand.ts draws them); designs/bryo.af is the
// reference board they came from.
//
// One character per cell, "." for an empty cell. Characters are colour roles,
// not colours; each theme in themes.ts gives every role a colour, so a new
// theme is a new palette, never a new drawing.
//
//   L  moss: new growth, the lit tops     S  stone
//   M  moss                                R  river
//   D  moss in shade                       r  river ripple
//   I  ink: the wordmark's letters         T  muted ink: "STUDIO"

export type Role = "L" | "M" | "D" | "S" | "R" | "r" | "I" | "T";
export type Grid = readonly string[];
export type Palette = Readonly<Record<Role, string>>;

// Tuft, the main mark. 8 x 8, so a 16 px favicon is exactly 2 px a cell. A
// domed cushion that peaks left of centre, falls steeply on the left and
// gently on the right, drapes over the stone and overhangs it, above an
// unbroken river.
export const tuft: Grid = [
  "..L.....",
  ".LMLL...",
  ".MMMMLL.",
  "LMDMMMML",
  "MDMMDMDM",
  "DMDMMDM.",
  "DSSSSS..",
  "RRrRRRrR",
];

// Mound, for large uses (splash screens, the site's hero, print). 14 x 11: an
// uneven two-lobed cushion with moss creeping down the stone.
export const mound: Grid = [
  "..LLL.........",
  ".LLMMLL..LLL..",
  "LLMMMMLLLMMLL.",
  "LMMDMMMMMMDML.",
  "MMDMMDMMDMMMML",
  "DMDDMDDMDMDMDM",
  "DDSSSSDSSSSSS.",
  ".DSSSSSSSSSS..",
  "..............",
  "RRRRrRRRRRRrRR",
  ".rRRRRRrRRRRr.",
];

// Grown, the wordmark: BRYO in 5 x 7 pixel letters, one cell apart, with moss
// on their tops. Tufts grow above the B, R and O; the Y is left clean, because
// anything above its arms reads as part of the letter. "STUDIO" is set under
// it in DejaVu Sans Mono Bold by the build script.
const letters: Record<string, Grid> = {
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
};
const word = ["B", "R", "Y", "O"].map((ch) => letters[ch]!);
const letterRows = word[0]!.map((_, y) =>
  word.map((glyph) => glyph[y]!.replace(/#/g, y === 0 ? "L" : y === 1 ? "M" : "I")).join("."),
);
export const grown: Grid = [
  ".L.....................",
  "LM.L...L............LL.",
  ...letterRows,
];

// Growth, the animation: a spore lands on the stone, then every column of the
// Tuft grows up from it in six steps, its bright tip the newest growth. Moss
// only grows on stone or on moss already there, so an overhang waits for the
// column beside it. The last frame is the Tuft itself.
export const growthDurationsMs = [500, 180, 180, 180, 180, 180, 1500];

export function growthFrames(): Grid[] {
  return growth(tuft, growthDurationsMs.length - 1, [2, 4]);
}

// Any mark growing from its stone in the given number of steps; the frames
// run from bare stone (plus a landing spore at [y, x], if given) to the mark.
export function growth(grid: Grid, steps: number, spore?: [number, number]): Grid[] {
  const moss = (ch: string | undefined): boolean => ch !== undefined && "LMD".includes(ch);
  const at = (y: number, x: number): string | undefined => grid[y]?.[x];
  const frames: Grid[] = [];
  for (let k = 0; k <= steps; k++) {
    // Each column grows the same share of its height, bottom first.
    const grownCells = new Set<string>();
    for (let x = 0; x < grid[0]!.length; x++) {
      const column: number[] = [];
      for (let y = grid.length - 1; y >= 0; y--) if (moss(at(y, x))) column.push(y);
      column.slice(0, Math.ceil((column.length * k) / steps)).forEach((y) => grownCells.add(`${y},${x}`));
    }
    // Drop growth with nothing under it or beside it.
    const holds = (y: number, x: number): boolean => at(y, x) === "S" || grownCells.has(`${y},${x}`);
    for (let changed = true; changed; ) {
      changed = false;
      for (const cell of grownCells) {
        const [y, x] = cell.split(",").map(Number) as [number, number];
        if (!holds(y + 1, x) && !holds(y, x - 1) && !holds(y, x + 1)) {
          grownCells.delete(cell);
          changed = true;
        }
      }
    }
    const out = grid.map((row, y) => [...row].map((ch, x) => (moss(ch) ? (grownCells.has(`${y},${x}`) ? ch : ".") : ch)));
    if (k < steps) {
      for (let x = 0; x < out[0]!.length; x++) {
        const tip = out.findIndex((row) => moss(row[x]));
        if (tip >= 0) out[tip]![x] = "L"; // the newest growth
      }
    }
    if (k === 0 && spore) out[spore[0]]![spore[1]] = "L"; // the spore, landing
    frames.push(out.map((row) => row.join("")));
  }
  return frames;
}
