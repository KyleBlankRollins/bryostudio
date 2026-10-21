// The small part of opentype.js that scripts/build-brand.ts uses. The package
// ships no type declarations of its own.

declare module "opentype.js" {
  interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  interface Path {
    toPathData(decimalPlaces?: number): string;
    getBoundingBox(): BoundingBox;
  }
  interface Glyph {
    advanceWidth?: number;
    getPath(x: number, y: number, fontSize: number): Path;
    getBoundingBox(): BoundingBox;
  }
  interface Font {
    unitsPerEm: number;
    charToGlyph(char: string): Glyph;
  }
  const opentype: { parse(buffer: ArrayBuffer): Font };
  export default opentype;
}
