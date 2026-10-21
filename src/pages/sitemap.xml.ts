// The sitemap, built from the pages themselves: every page but the 404 and
// the lab's experiments.
import type { APIRoute } from "astro";

const paths = Object.keys(import.meta.glob("./**/*.{astro,md}"))
  .filter((file) => !file.endsWith("/404.astro") && !file.startsWith("./lab/"))
  .map((file) => file.slice(1).replace(/(index)?\.(astro|md)$/, "").replace(/([^/])$/, "$1/"))
  .sort();

export const GET: APIRoute = ({ site }) => {
  const urls = paths.map((path) => `  <url><loc>${new URL(path, site)}</loc></url>`);
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, "</urlset>", ""].join("\n");
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
