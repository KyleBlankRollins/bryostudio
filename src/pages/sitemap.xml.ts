// The sitemap, built from the pages themselves: every page but the 404 and
// the lab's experiments. Pages made from a [param] file are listed from what
// they are made of (Pizza Ambulance's releases).
import type { APIRoute } from "astro";
import { pizzaAmbulanceReleases, releasePath } from "../lib/releases.ts";

const paths = Object.keys(import.meta.glob("./**/*.{astro,md}"))
  .filter((file) => !file.endsWith("/404.astro") && !file.startsWith("./lab/") && !file.includes("["))
  .map((file) => file.slice(1).replace(/(index)?\.(astro|md)$/, "").replace(/([^/])$/, "$1/"))
  .sort();

export const GET: APIRoute = async ({ site }) => {
  const releases = (await pizzaAmbulanceReleases()).map(({ data }) => releasePath(data.version)).sort();
  const urls = [...paths, ...releases].map((path) => `  <url><loc>${new URL(path, site)}</loc></url>`);
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, "</urlset>", ""].join("\n");
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
