// The light/dark theme toggle. Without this script the site simply follows
// the system's setting (tokens.css). With it, a button in the header switches
// between Daylight and Night, and the choice is remembered on this device.
//
// Loaded in <head>, before the stylesheets, so the chosen theme is set before
// anything is drawn.

(() => {
  const root = document.documentElement;
  const system = matchMedia("(prefers-color-scheme: dark)");
  const key = "theme";

  let chosen = null;
  try {
    chosen = localStorage.getItem(key);
  } catch {
    // storage blocked: follow the system
  }
  if (chosen !== "daylight" && chosen !== "night") chosen = null;

  const current = () => chosen ?? (system.matches ? "night" : "daylight");
  const apply = () => {
    if (chosen) root.dataset.theme = chosen;
    else delete root.dataset.theme;
  };
  apply();

  // 7 x 7 pixel icons: the theme the button switches to.
  const icon = (rows) => {
    let d = "";
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "#") d += `M${x} ${y}h1v1h-1z`; }));
    return `<svg viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><path fill="currentColor" d="${d}"/></svg>`;
  };
  const moon = icon(["..####.", ".###...", "###....", "###....", "###....", ".###...", "..####."]);
  const sun = icon(["...#...", ".#...#.", "..###..", "#.###.#", "..###..", ".#...#.", "...#..."]);

  document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    const label = () => {
      const toNight = current() === "daylight";
      button.innerHTML = toNight ? moon : sun;
      button.setAttribute("aria-label", toNight ? "Switch to dark theme" : "Switch to light theme");
    };
    button.addEventListener("click", () => {
      chosen = current() === "night" ? "daylight" : "night";
      try {
        localStorage.setItem(key, chosen);
      } catch {
        // storage blocked: the choice lasts until the page changes
      }
      apply();
      label();
    });
    system.addEventListener("change", () => {
      if (!chosen) label();
    });
    label();
    // Beside the brand, so on a phone it shares the first row; styles.css
    // moves it after the nav on wider screens.
    (header.querySelector(".brand") ?? header.firstElementChild)?.after(button);
  });
})();
