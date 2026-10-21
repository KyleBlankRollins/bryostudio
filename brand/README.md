# Bryo Studio brand

The marks are pixel grids and the themes are hand-picked colours, and every
file in `dist/` is drawn from them by `scripts/build-brand.ts`. To change a
mark or a colour, edit `marks.ts` or `themes.ts` and run `npm run brand`;
never edit `dist/` by hand. `designs/bryo.af` (Affinity) is the board the
marks came from.

```
marks.ts          the grids (Tuft, Mound, Grown, Growth); cells are colour roles
themes.ts         Daylight, Night and Deep River: mark colours and interface colours
colour.ts         contrast and OKLab mixing, for the build
draw.ts           grids to SVG, shared by the build and the site
fonts/            DejaVu Sans Mono 2.37, regular and bold, and its licence
dist/             generated; replaced in full by every build
  <theme>/        daylight/, night/, deep-river/, each with:
    svg/          tuft, mound (solid and gapped), wordmark, lockup-horizontal, lockup-stacked
    png/          tuft and mound at whole pixels per cell: @2x is 2 px a cell
    favicon/      favicon.svg, favicon.ico (16, 32, 48), apple-touch-icon.png (180)
    growth/       the Growth sprite sheet (@1x, @8x), its timing (growth.json), and growth.svg
  web/            tokens.css, a favicon.svg that follows the system's light or dark
                  setting, and tuft-inline.svg, coloured by the page's CSS
```

The build also refreshes the site's copies: `src/styles/tokens.css` and the
favicons in `public/` (the `.ico` and touch icon in Night). The header's Tuft
is drawn from `marks.ts` by `src/components/Tuft.astro` whenever the site
builds, using `draw.ts`.

## The marks

- **Tuft**, the main mark: 8 × 8 cells, so 16 px is exactly 2 px a cell.
- **Mound**, for large uses (splash screens, the site's hero, print): 14 × 11.
- **Grown**, the wordmark: BRYO in 5 × 7 pixel letters with moss on the B, R
  and O (never above the Y), and "STUDIO" in DejaVu Sans Mono Bold, turned into
  outlines so no file needs the font.
- **Growth**, the animation: seven frames of the Tuft growing from the stone.
  `growth.svg` plays it once and holds on the Tuft, or shows only the Tuft to
  anyone who prefers reduced motion. In motion, spores may drift above the Y;
  in print it stays clean.

## The themes

- **Daylight** (light) and **Night** (dark) are the site's two themes: it
  follows the system, and the header's button switches between them.
- **Deep River** (dark, the river leading) is kept for a future product of its
  own. Not Ascribe: a VS Code extension takes its colours from the editor.

Each theme gives every cell role a colour (so every mark exists in every
theme) and sets the interface colours: background, surface, text, muted text,
border, moss (links), river (hover, notes) and focus. The soft moss and river
tints are mixed from those in OKLab. The build stops if text, links or muted
text fall below 4.5:1 against their backgrounds, or the focus ring or the
mark's moss below 3:1.

## Using them

- Pick the theme folder that matches the background: Daylight on light, Night
  or Deep River on dark.
- Scale rasters only by whole numbers, with nearest-neighbour filtering
  (`image-rendering: pixelated` on the web). If a size isn't a whole number of
  pixels a cell, use the SVG.
- Cells are solid by default. The `-gapped` SVGs, with small gaps and rounded
  corners, are for large uses only; at small sizes the gaps blur away.
- `web/tuft-inline.svg` only takes its colours when pasted into a page that
  loads `tokens.css`, not when loaded with `<img>`.

## Not generated yet

These would each be a few lines in the build, from the same themes, when
something needs them:

- Android `colors.xml` per theme, for the games and apps.
- Adobe Swatch Exchange (`.ase`) files per theme, which Affinity imports as
  palettes.
- Design tokens as JSON (the W3C Design Tokens format), for Figma and other
  design tools.
- Raster lockups and the wordmark as PNG. These need an SVG rasteriser (for
  example resvg) because "STUDIO" is outlined type, not cells.
- An animated GIF of Growth, for READMEs and places that won't play SVG.
- Android adaptive icon layers, the Play Store icon and feature graphic, and a
  social share image.

## The font

DejaVu Sans Mono is free to use, embed and redistribute (Bitstream Vera
licence, see `fonts/LICENSE-DejaVu`). It is from the official 2.37 release,
github.com/dejavu-fonts/dejavu-fonts.
