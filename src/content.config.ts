// Content written once and shown on more than one page. Each release of
// Pizza Ambulance is one Markdown file in src/content/pizza-ambulance/: the
// notes.md that the game's tools/release_notes.ps1 writes, renamed for its
// version (0.3.0.md) and given some colour. Files starting with _ (the
// template) are left out.
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const pizzaAmbulanceReleases = defineCollection({
  loader: glob({ base: "./src/content/pizza-ambulance", pattern: "[^_]*.md" }),
  schema: z
    .object({
      // written by release_notes.ps1
      version: z.string().regex(/^\d+\.\d+\.\d+$/, "a version name such as 0.3.0"),
      code: z.number().int(), // Play's version code
      date: z.coerce.date(), // the release commit's date
      draft: z.boolean().default(true), // the tool's words, not yet the players'
      // added here, before publishing
      title: z.string().optional(), // a name for the release, e.g. "The Harbour"
      summary: z.string().optional(), // one plain sentence, for the release lists
    })
    .refine((release) => release.draft || release.summary, {
      message: "Add a summary before setting draft to false.",
      path: ["summary"],
    }),
});

export const collections = { pizzaAmbulanceReleases };
