# Frontier — Lander hero variations

A static landing page for Frontier (plain HTML, CSS and JS, with no build step) that holds several **hero variations**. You switch between them with the tabs in the nav bar.

| Tab | Variation | Status |
| --- | --- | --- |
| 01 · Pixel globe | Large headline, a row of four equal glass cards, and a pixel globe behind everything. Black & white, orange (`#E96E26`) buttons only. | ✅ Done |
| 02 | Placeholder | ⏳ To design |
| 03 | Placeholder | ⏳ To design |

The active tab is kept in the URL hash, so you can link straight to a variation: `index.html#v1`, `#v2`, `#v3`.

## Preview

**Locally.** No install is needed:

```bash
# Option A: open the file directly
open index.html            # macOS  (or double-click it)

# Option B: serve it (recommended)
python3 -m http.server 8080   # then visit http://localhost:8080
# or
npx serve .
```

**GitHub Pages.** In *Settings → Pages*, set *Source* to **Deploy from a branch** and pick the branch and `/ (root)`. The page is then published at `https://<owner>.github.io/<repo>/`.

## Structure

```
index.html                      # markup for the nav, all hero variations, and the shared sections
css/
  base.css                      # tokens, reset, buttons, nav + variation tabs, motion primitives
  sections.css                  # How it works, Back the extensions, Steps, Applicants, Banner, Footer
  variation-1-pixel-globe.css   # Hero variation 1 (pixel globe)
  variation-placeholder.css     # Temporary styles for variations 2 & 3
js/
  main.js                       # tab switching, typing domain, counters, scroll reveals, parallax
  variation-1-pixel-globe.js    # pixel globe: rotation, hover-to-pause, one name per pixel
  data/world-countries-50m.js   # Natural Earth 1:50m countries (world-atlas, public domain)
  vendor/                       # d3-array, d3-geo, topojson-client (ISC), vendored so the page works offline
assets/
  logos/                        # Frontier wordmark + partner logos (exported from the Figma file)
  icons/                        # chain icons used in the "Deposit" card
  img/banner-dunes.jpg          # banner background (desaturated in CSS for variation 1)
```

## Variation 1: Pixel globe

- **Layout.** A large two-line headline sits top-left with the typing domain field and the subtitle beside it. Below them is a row of four equal glass cards: Points rate, Members, Extensions live, and a Join Frontier card. Every section on the page uses the same card (`.panel` in `base.css`), with the same radius, border, padding and label row.
- **Pixel globe.** The earth is drawn on a fixed screen grid of square pixels, like an LED wall, and it sits behind all the hero content. Land pixels are softly lit (muted so the globe never overpowers the copy) and ocean pixels are faint. It's zoomed in so the top part of the globe rises behind the cards, but both edges stay visible so it still reads as a globe.
- **Readability.** Pixels under the headline, domain field, subtitle and cards are dimmed, and the cards are frosted glass.
- **Hover names.** Each pixel is a name. Hovering one shows the pixel's name and its coordinates next to the cursor while the globe keeps rotating. Names are tied to a 1.5° patch of earth, so the same spot always gives the same name. A few spots are fixed: Zürich → `vault.crypto`, New York → `gen.wealth`, Singapore → `burner.wallet`, Reykjavík → `anon.agent`. To change the names, edit `NAMES`, `TLDS` and the `fix(...)` calls in `js/variation-1-pixel-globe.js`.
- **Motion.** The hero has a staggered entrance, the typing domain field, stat counters and a light sweep across the button. Sections below the hero reveal on scroll. Motion is switched off when the visitor has `prefers-reduced-motion` turned on.

## Adding variation 2 / 3

1. Replace the `#hero-v2` (or `#hero-v3`) placeholder `<section>` in `index.html`. Keep `data-hero="2"`.
2. Add `css/variation-2-<name>.css` (and `js/variation-2-<name>.js` if it needs script) and link it in `index.html`.
3. Rename the tab label in the nav (`[data-variation-tab="2"]`).
4. For theme changes that should reach the sections below the hero, scope the rules with `body[data-variation="2"] …`.
