// Pizza Ambulance's releases, newest first, drafts left out; and where each
// one's page is.
import { getCollection } from "astro:content";

export async function pizzaAmbulanceReleases() {
  const releases = await getCollection("pizzaAmbulanceReleases", ({ data }) => !data.draft);
  return releases.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const releasePath = (version: string) => `/pizza-ambulance/whats-new/${version}/`;

// The date as the studio saw it (the tool writes the commit's own offset).
export const releaseDate = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Chicago" });
