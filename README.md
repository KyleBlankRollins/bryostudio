# Bryo Studio website

The static site for `bryostudio.com`. Plain HTML and one stylesheet, no build
step. `site/` is the publish folder; `netlify.toml` points Netlify at it.

```
netlify.toml          Netlify settings: publish folder, build (type-check), functions, headers, caching
package.json          npm scripts; the MongoDB driver; TypeScript 7 and types
tsconfig.json         type-checking for the functions and scripts (nothing is emitted)
netlify/functions/
  telemetry.ts        POST /api/telemetry: games' telemetry into MongoDB Atlas
scripts/
  send-test-telemetry.ts    posts a sample batch to check the whole path
site/
  index.html          home
  pizza-ambulance/    the first game's page
  privacy/            privacy pages (index, and one per app)
  404.html            not-found page
  styles.css          the one stylesheet for every page
  favicon.svg         the mark
  robots.txt
  sitemap.xml
screenshots/          local render checks (git-ignored)
```

To preview locally, serve `site/` from any static server, for example
`npx serve site` or `python -m http.server -d site 8080`. Links are
root-relative (`/styles.css`), so opening the files straight from disk will
not pick up the stylesheet.

## TypeScript

The functions and scripts are TypeScript, checked by TypeScript 7
(`npm run typecheck`, which Netlify also runs as the build, so a type error
fails the deploy). Nothing is compiled to disk: Netlify bundles the functions
itself, and Node (22.18 or later) runs the scripts straight from `.ts`, so
`tsconfig.json` allows only syntax Node can strip (`erasableSyntaxOnly`: no
enums, namespaces or parameter properties). Run `npm install` once after
cloning.

## Telemetry

Games post batches of telemetry lines to `https://bryostudio.com/api/telemetry`
(`netlify/functions/telemetry.ts`; the request and replies are described at
the top of that file). The function checks every batch and writes it to the
`pizza_ambulance.telemetry` collection of the Atlas cluster. A game never
holds database credentials.

- **`MONGODB_URI`** is set in Netlify (Site configuration, Environment
  variables), scoped to Functions and marked secret. It connects as the
  Atlas user `telemetry-writer`, which may only read and write the
  `pizza_ambulance` database. It is never written in this repository.
- Each stored line keeps the game's fields and adds `_game`, `_install` (a
  random id per install), `_app` (the game's version), `_batch` and
  `_received`. A batch sent again is stored once.
- Refused whole: anything but POST, bodies over 512 KB, more than 500 lines,
  a line over 16 KB, unknown games or line kinds, field names starting with
  `$`, `_` or containing `.`. One address may post 30 times a minute.
- To check the whole path after a deploy:
  `npm run test:telemetry`. Its lines have an install id
  starting `test-`; delete them in Atlas with
  `{"_install": {"$regex": "^test-"}}`.
- Locally, `netlify dev` serves the site and the function on
  `http://localhost:8888` with the Netlify environment variables, and
  `npm run test:telemetry -- http://localhost:8888` posts to it.

The contact email is not decided yet. Every page uses the literal
placeholder `{{CONTACT_EMAIL}}`; replace it across `site/` once it is.

## Page shell

Every page uses exactly this shell. Change only the `<title>`, the
`description`, the `aria-current="page"` on the nav link for the current
section (leave it off on other pages), and what goes inside `<main>`.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page title · Bryo Studio</title>
  <meta name="description" content="One plain sentence about this page.">
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <a class="brand" href="/">
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <ellipse class="mark-stone" cx="16" cy="19" rx="12.5" ry="6.5"/>
        <path class="mark-moss" d="M4 19.5c0-3.2 2.2-5.4 5-5.4.9-2.8 3.2-4.6 6-4.6 2.1 0 3.9 1 5 2.6.7-.3 1.5-.5 2.4-.5 3.6 0 5.6 2.9 5.6 6.4-6 2.6-17.6 2.8-24 1.5z"/>
        <path class="mark-stream" d="M3 28c3.3-2.6 6.7-2.6 10 0s6.7 2.6 10 0c2-1.6 4-2 6-1.2"/>
      </svg>
      Bryo Studio
    </a>
    <nav aria-label="Main">
      <a href="/pizza-ambulance/">Pizza Ambulance</a>
      <a href="/privacy/">Privacy</a>
    </nav>
  </header>
  <main id="main" class="page">
    <!-- page content -->
  </main>
  <footer class="site-footer">
    <p>© 2026 Bryo Studio · <a href="/privacy/">Privacy</a> · <a href="mailto:{{CONTACT_EMAIL}}">{{CONTACT_EMAIL}}</a></p>
  </footer>
</body>
</html>
```

On a privacy page, mark the Privacy nav link as current:
`<a href="/privacy/" aria-current="page">Privacy</a>`.

### What `main.page` styles with no classes

`h1`, `h2`, `h3`, `p`, `ul`, `ol`, `li`, `strong`, `a`, `hr`, `code` and
`table` (with `thead`/`th`/`td`/`caption`; wide tables scroll inside
themselves on phones) are all styled for long reading at about 65 characters
a line. Two small classes for policy pages:

```html
<p class="updated">Last updated: 17 October 2026</p>

<div class="note">
  <p>A short boxed aside, such as a plain-English summary.</p>
</div>
```

Other classes in `styles.css` (`.lede`, `.eyebrow`, `.card`, `.status`,
`.button`, `.makes`) are used on the home and game pages and are optional
elsewhere.

## Palette

Defined on `:root` in `styles.css`, with a dark set under
`@media (prefers-color-scheme: dark)`.

| Token          | Light     | Dark      | Use                         |
|----------------|-----------|-----------|-----------------------------|
| `--bg`         | `#f6f2e8` | `#131a16` | page background (cream)     |
| `--surface`    | `#fffcf4` | `#1b2420` | cards                       |
| `--text`       | `#1e2a23` | `#e9e5d9` | body text                   |
| `--muted`      | `#4c5751` | `#b3bab1` | secondary text (stone)      |
| `--moss`       | `#3b6634` | `#9fca8b` | links, accents              |
| `--river`      | `#22607f` | `#86c3e0` | link hover, notes, status   |
| `--moss-soft`  | `#dfe8d2` | `#22301f` | table head, tags            |
| `--river-soft` | `#d8e8ee` | `#18303b` | note box                    |
| `--moss-mark`, `--river-mark`, `--stone` | | | the mark and wave decoration only |
