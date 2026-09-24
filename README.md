# Frontier — Lander hero variations

A static landing page for Frontier (plain HTML, CSS and JS, with no build step) that holds several **hero variations**. You switch between them with the tabs in the nav bar.

| Tab | Variation | Status |
| --- | --- | --- |
| 01 · Pixel globe | Large headline, a row of four equal glass cards, and a pixel globe behind everything. Black & white; orange (`#E96E26`) for buttons and the typed TLD + caret. | ✅ Done |
| 02 · Dissolve ring | Light mode. Left-aligned headline and domain field at the Figma sizes, the same four cards, and an orange pixel ring dissolving in the bottom-right corner. | ✅ Done |
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
  base.css                      # tokens + theme, reset, buttons, nav + variation tabs, motion primitives
  hero-shared.css               # domain field, stat/CTA cards, hover name card (used by every hero)
  sections.css                  # How it works, Back the extensions, Steps, Applicants, Banner, Footer
  variation-1-pixel-globe.css   # Hero variation 1 (pixel globe, dark)
  variation-2-dissolve-ring.css # Hero variation 2 (dissolve ring) + the light theme for the whole page
  variation-placeholder.css     # Temporary styles for variation 3
js/
  main.js                       # tab switching, typing domain, counters, scroll reveals
  variation-1-pixel-globe.js    # pixel globe: rotation + static hover points with names
  variation-2-dissolve-ring.js  # dissolve ring: shimmering pixel arc + one name per ring cell
  data/world-countries-50m.js   # Natural Earth 1:50m countries (world-atlas, public domain)
  vendor/                       # d3-array, d3-geo, topojson-client (ISC), vendored so the page works offline
assets/
  logos/                        # Frontier wordmark + partner logos (exported from the Figma file)
  icons/                        # chain icons used in the "Deposit" card
```

## Variation 1: Pixel globe

- **Layout.** A large two-line headline sits top-left with the typing domain field and the subtitle beside it. Below them is a row of four equal glass cards: Points rate, Members, Extensions live, and a Join Frontier card. Every section on the page uses the same card (`.panel` in `base.css`), with the same radius, border, padding and label row.
- **Pixel globe.** The earth is drawn on a fixed screen grid of square pixels, like an LED wall, and it sits behind all the hero content. Land pixels are softly lit (muted to about 36% white so the globe never overpowers the copy) and ocean pixels are faint. It's zoomed in so the top part of the globe rises behind the cards, but both edges stay visible so it still reads as a globe.
- **Readability.** Pixels under the headline, domain field, subtitle and cards are dimmed, and the cards are frosted glass.
- **Hover names.** On top of the rotating globe sits an invisible layer of static points (28px apart) that covers exactly the globe disc. Each point holds one name. Hovering a point shows its name in a small 14px card, and it stays put until the cursor moves to another point. The globe keeps rotating underneath. The names from the brief (`vault.crypto`, `gen.wealth`, `burner.wallet`, `anon.agent`, …) come up more often than the generated ones. To change the names, edit `NAMES`, `TLDS` and `FEATURED` in `js/variation-1-pixel-globe.js`.
- **Motion.** The hero has a staggered entrance, the typing domain field, stat counters and a light sweep across the button. Sections below the hero reveal on scroll. Motion is switched off when the visitor has `prefers-reduced-motion` turned on.

## Variation 2: Dissolve ring

- **Light mode.** The whole page switches to a light theme while this tab is on. Every colour comes from theme tokens on `<body>` in `base.css`, and `variation-2-dissolve-ring.css` redefines them under `body[data-variation="2"]`. The orange is deepened to `#C4531B` for buttons and the typed TLD, so white button text has 4.6:1 contrast. The ring pixels keep the brand `#E96E26`.
- **Layout.** The headline, domain field and subtitle are left-aligned at the Figma sizes: 64px headline on one line, a 674 × 89px domain field with 56px text, an 18px subtitle, and 24px gaps. The four cards stay at the bottom, as in Variation 1.
- **Dissolve ring.** A thick ring of square orange pixels on a fixed grid curls over the bottom-right corner. It's denser along the inner edge and dissolves toward the outer edge and the lower tail. Each pixel drops out and reappears on its own slow clock, so the ring shimmers. Pixels behind the text and cards are dimmed.
- **Hover names.** Each cell in the ring holds one name, shown in the same small card as Variation 1 and kept until the cursor moves to another cell.

## Adding variation 3

1. Replace the `#hero-v3` placeholder `<section>` in `index.html`. Keep `data-hero="3"`.
2. Add `css/variation-3-<name>.css` (and `js/variation-3-<name>.js` if it needs script) and link it in `index.html`. A motion script registers itself as `window.FrontierHeroMotion["3"] = { start, stop }`, and the tabs start and stop it.
3. Rename the tab label in the nav (`[data-variation-tab="3"]`).
4. To theme the whole page, redefine the tokens under `body[data-variation="3"]`. `variation-2-dissolve-ring.css` shows how.
