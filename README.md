# Frontier — Lander hero variations

A static landing page for Frontier (plain HTML, CSS and JS, with no build step) that holds several **hero variations**. You switch between them with the tabs in the nav bar.

| Tab | Variation | Status |
| --- | --- | --- |
| 01 · Globe | Black & white political globe on the right, copy on the left. Orange (`#E96E26`) buttons only. | ✅ Done |
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
  variation-1-globe.css         # Hero variation 1 (globe)
  variation-placeholder.css     # Temporary styles for variations 2 & 3
js/
  main.js                       # tab switching, typing domain, counters, scroll reveals, parallax
  variation-1-globe.js          # canvas globe: rotation, hover-to-pause, country/pin → name tooltip, drag
  data/world-countries-50m.js   # Natural Earth 1:50m countries (world-atlas, public domain)
  vendor/                       # d3-array, d3-geo, topojson-client (ISC), vendored so the page works offline
assets/
  logos/                        # Frontier wordmark + partner logos (exported from the Figma file)
  icons/                        # chain icons used in the "Deposit" card
  img/banner-dunes.jpg          # banner background (desaturated in CSS for variation 1)
```

## Variation 1: Globe

- **Globe.** An orthographic, politically mapped earth drawn on `<canvas>` with d3-geo. It rotates by default. While the cursor is over it, the rotation eases to a stop, and it picks up again when the cursor leaves. You can also drag to spin it.
- **Hover names.** Every country maps to a Frontier name, and the name follows the cursor in a tooltip (for example Switzerland → `vault.crypto`, USA → `gen.wealth`, Singapore → `burner.wallet`, Iceland → `anon.agent`). Pulsing pins at specific coordinates, such as Zürich, New York and Singapore, have their own names. To edit the names, change `COUNTRY_NAMES`, `POOL` and `PINS` in `js/variation-1-globe.js`.
- **Motion.** The hero has a staggered entrance, a typing domain field, a light sweep across the button, a pulsing bonus dot, stat counters, orbit rings and a drifting grid. Every section below the hero has a scroll reveal, and the cards and marquees have their own animations.
- **Reduced motion.** Motion is switched off when the visitor has `prefers-reduced-motion` turned on.

## Adding variation 2 / 3

1. Replace the `#hero-v2` (or `#hero-v3`) placeholder `<section>` in `index.html`. Keep `data-hero="2"`.
2. Add `css/variation-2-<name>.css` (and `js/variation-2-<name>.js` if it needs script) and link it in `index.html`.
3. Rename the tab label in the nav (`[data-variation-tab="2"]`).
4. For theme changes that should reach the sections below the hero, scope the rules with `body[data-variation="2"] …`.
