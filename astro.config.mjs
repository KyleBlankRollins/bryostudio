// Astro builds the site into dist/, which Netlify publishes. Everything is
// static: no adapter, no client-side framework.
import { satteri } from "@astrojs/markdown-satteri";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://bryostudio.com",
  build: {
    // The security policy (netlify.toml) allows only the site's own files:
    // no inline <style>, so stylesheets always stay separate files.
    inlineStylesheets: "never",
  },
  // Collapse whitespace but keep a space where the source has one (Astro 7's
  // default, "jsx", drops spaces between lines and links).
  compressHTML: true,
  markdown: {
    // Text is written with the right punctuation already; leave it alone.
    processor: satteri({ features: { smartPunctuation: false } }),
  },
});
