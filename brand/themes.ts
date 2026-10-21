// The Bryo Studio themes. Each has two sets of colours:
//
// - mark: the colour of each cell role in brand/marks.ts, so every mark can be
//   drawn in every theme;
// - ui: what the site (and later the apps) need around the marks.
//
// Every value here is picked by hand. scripts/build-brand.ts derives the soft
// tints from them and fails the build if any text, link or focus colour is
// too low in contrast to read.

import type { Palette } from "./marks.ts";

export interface Ui {
  bg: string; // page background
  surface: string; // cards, panels
  text: string; // body text
  muted: string; // secondary text
  border: string; // card and table borders (decorative)
  moss: string; // links, accents, buttons
  river: string; // link hover, notes, status
  focus: string; // keyboard focus ring
}

export interface Theme {
  id: string;
  name: string;
  scheme: "light" | "dark";
  mark: Palette;
  ui: Ui;
}

// Light. The site's default when the system asks for light.
export const daylight: Theme = {
  id: "daylight",
  name: "Daylight",
  scheme: "light",
  mark: { L: "#6dbb4a", M: "#3f8a3a", D: "#245a2a", S: "#a3ab9f", R: "#1f9fc0", r: "#16718a", I: "#14201a", T: "#56635a" },
  ui: {
    bg: "#eef2e6",
    surface: "#f8faf3",
    text: "#14201a",
    muted: "#4f5c53",
    border: "#d3dacb",
    moss: "#2f6b2b", // darker than the mark's moss, which is too pale for text
    river: "#15667d",
    focus: "#b4530f",
  },
};

// Dark, and the brand's home: the default for the marks.
export const night: Theme = {
  id: "night",
  name: "Night",
  scheme: "dark",
  mark: { L: "#8fd16a", M: "#5fa04a", D: "#2f6b34", S: "#4a554f", R: "#4fc3d9", r: "#2a7f99", I: "#e4ecdf", T: "#9aa79f" },
  ui: {
    bg: "#0f1512",
    surface: "#16201b",
    text: "#e4ecdf",
    muted: "#9aa79f",
    border: "#2a3830",
    moss: "#8fd16a",
    river: "#4fc3d9",
    focus: "#f0a35e",
  },
};

// Dark, with the river leading. Kept for a future product of its own; nothing
// uses it yet.
export const deepRiver: Theme = {
  id: "deep-river",
  name: "Deep River",
  scheme: "dark",
  mark: { L: "#9fdc7c", M: "#5aa66a", D: "#2c6a52", S: "#2d4456", R: "#56d0f0", r: "#2a86b0", I: "#e3f1f7", T: "#8aa6b8" },
  ui: {
    bg: "#0b1824",
    surface: "#112233",
    text: "#e3f1f7",
    muted: "#8aa6b8",
    border: "#1d3346",
    moss: "#9fdc7c",
    river: "#56d0f0",
    focus: "#f0a35e",
  },
};

export const themes: readonly Theme[] = [daylight, night, deepRiver];
