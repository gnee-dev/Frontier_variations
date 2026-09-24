# Frontier — Lander hero variations

A static landing page for Frontier (plain HTML, CSS and JS, with no build step) that holds several **hero variations**. You switch between them with the tabs in the nav bar.

| Tab | Variation | Status |
| --- | --- | --- |
| 01 · Pixel globe | Large headline, a row of four equal glass cards, and a pixel globe behind everything. Black & white; orange (`#E96E26`) for buttons and the typed TLD + caret. | ✅ Done |
| 01b · Globe colour | Variation 1 with exactly the same layout and content, in the Figma colours: a rose-to-amber pixel globe with faint blue oceans, orange accents and icons, green points, and soft dusk light behind the hero. | ✅ Done |
| 02 · Dissolve ring | Light mode. Left-aligned headline, domain field with Join Frontier inside it, a bonus line with a live countdown, three stat cards, and a rotating orange pixel ring dissolving in the bottom-right corner. | ✅ Done |
| 03 · Nucleus | Dark mode. Headline left, typed domain + Join Frontier right (equal heights), and a centred particle sphere: a rotating nucleus inside a sparse halo. Three compact stat cards at the bottom. | ✅ Done |
| 03b · Nucleus centred | Dark mode. The second Figma file's centred stack (headline sized to the domain field's width, field with Join Frontier inside, bonus line, subtitle) with a big particle sphere rising out of the bottom of the hero. | ✅ Done |
| 04 | Placeholder | ⏳ To design |

With six tabs, the nav shows only the tab numbers (01, 01b, 02…) below 1200px wide; hover a tab for its full name. On phones (560px and below), the tabs get their own full-width row under the logo and Sign up.

The active tab is kept in the URL hash, so you can link straight to a variation: `index.html#v1`, `#v2`, `#v3`, `#v3b`, `#v4`.

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
  variation-1b-colour.css       # Variation 1b: colour theme over the variation 1 hero and page
  variation-2-dissolve-ring.css # Hero variation 2 (dissolve ring) + the light theme for the whole page
  variation-3-nucleus.css       # Hero variation 3 (nucleus particle sphere, dark)
  variation-3b-nucleus-centred.css # Hero variation 3b (centred copy, sphere rising from the bottom)
  variation-placeholder.css     # Temporary styles for variation 4
js/
  main.js                       # tab switching, typing domain, counters, scroll reveals
  variation-1-pixel-globe.js    # pixel globe: rotation + static hover points with names
  variation-2-dissolve-ring.js  # dissolve ring: rotating pixel arc + static hover points with names
  variation-3-nucleus.js        # nucleus builder for 3 and 3b: rotating particle sphere + halo + static hover points; 3b headline fitting
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

## Variation 1b: Globe colour

- **Same page.** It reuses the Variation 1 hero (`data-hero="1 1b"`), so the layout, copy, hierarchy and motion are identical. Only colours change, all in `css/variation-1b-colour.css` under `body[data-variation="1b"]`.
- **Palette (from Figma).** A near-black plum background, white headings and 64% body text as in V1, orange `#E96E26` buttons with a brighter `#FF7C31` for orange text, green `#4AFFBA` for points (the "+10,000 pts" highlight, pills, the live dot), and blue `#4AC6FF` only as a faint tint on the oceans and the applicants strip.
- **Globe.** The land pixels shade from rose at the top of the globe to warm amber lower down. The script reads the colours from the CSS variables `--globe-land-top`, `--globe-land-bottom`, `--globe-ocean` and `--globe-alpha`, so V1 stays white.
- **Accents.** The card label icons and chain icons are orange. The How it works visuals get a soft orange glow, the timeline and hot TLD dots are orange, and the banner has a warm glow.

## Variation 2: Dissolve ring

- **Light mode.** The whole page switches to a light theme while this tab is on. Every colour comes from theme tokens on `<body>` in `base.css`, and `variation-2-dissolve-ring.css` redefines them under `body[data-variation="2"]`. Buttons and the typed TLD use a lighter, more saturated orange, `#DA5A12`. White button text on it has 3.85:1 contrast. The ring pixels and their soft glow use the brand `#E96E26`, and "+10,000 pts" is green, `#1AC684`.
- **Layout.** This follows the updated Figma hero, kept left-aligned. The whole page uses −0.08% letter-spacing (small uppercase labels keep their wider tracking). The headline and the typed domain are both 40px, with the name part of the domain in a light grey. The Join Frontier button sits inside the domain field on the right. Under the field is the bonus line, highlighted as in Figma: "+10,000 pts bonus" in green, "opens in" and the countdown in the text colour, and the rest muted. Then comes the 16px subtitle. Three shorter stat cards sit at the bottom.
- **Countdown.** "deposit opens in 4d 09h 44m" is live. It counts down to the `data-countdown-to` date on the element, currently `2026-09-28T19:00:00Z`, and updates every 15 seconds.
- **Dissolve ring.** A thick ring of small square orange pixels curls over the bottom-right corner, and the whole ring rotates. The pattern lives in the ring's own polar coordinates and is sampled on a fixed pixel grid, so it stays crisp. It's dense along the inner band and dissolves toward the outer edge and the lower tail. Some pixels are lighter "shade" tones, and each one slowly drops out and returns. A blurred orange glow sits behind the ring, and the whole layer fades out at the bottom of the hero into the page background.
- **Hover names.** As in Variation 1, an invisible layer of static points (20px apart) covers the ring band. Each point holds one name, which stays put while the cursor is idle even though the ring keeps turning.

## Variation 3: Nucleus

- **Layout.** Dark mode with orange buttons. "Be the first to ever own" and the subtitle sit on the left. The typed domain with the Join Frontier button right under it, and the bonus line (with the live countdown), sit on the right. The particle sphere is in the middle. Both side columns share one grid row, so they're always the same height, with their tops and bottoms aligned. Three compact stat cards sit at the bottom, and the page uses −0.08% letter-spacing, as in Variation 2.
- **Nucleus.** A particle sphere drawn on a canvas in tiny square pixels. The nucleus is ~1,500 pixels spread over a sphere, rotating in 3D (about 18° a second) on a slightly tilted axis. Near-side pixels are bigger and brighter, so it reads as a solid ball. Around it, a halo of ~1,400 single pixels (and a few larger faint ones) turns much more slowly for parallax, and the pixels twinkle gently. The whole graphic is muted and fades softly toward its edge, like the globe in Variation 1. The canvas spills past its box so the halo can spread wider than the column gap, and it's centred on the page.
- **Hover names.** As in the other variations, an invisible layer of static points (20px apart) covers the sphere. Each point holds one name, which stays put while the cursor is idle even though the nucleus keeps spinning.

## Variation 3b: Nucleus centred

- **Layout.** This follows the second Figma file's layout with smaller type: one centred stack of the 48px headline, the domain field (48px text, always exactly as wide as the headline's text, measured in script) with Join Frontier inside it (17.5px above and below the button, 16px to its right), the 16px highlighted bonus line with the live countdown, and the 14px subtitle. Every button on this tab's page content is the same 40px button with an 18px label (16px on phones under 400px). The nav's Sign up matches the other tabs. The whole stack is vertically centred between the bottom of the nav and the top of the stat cards at every breakpoint, with at least 32px above and below. Each is one line with a 1.2 line height, and the gaps are 24px, 20px and 24px. On screens too narrow for the 674px field, the headline scales down in script to match the field's width. Three compact stat cards sit at the bottom.
- **Sphere.** It's the same particle sphere as Variation 3, much bigger (the nucleus is up to 360px in radius), centred at the bottom edge. The top dome rises between the copy and the cards, and the rest disappears behind the cards and out of the bottom of the hero, with a soft fade. It keeps rotating, and pixels under the copy are dimmed.
- **Hover names.** They work the same way as the other variations: static points hold the names, and an idle cursor keeps its name.
- **Code.** `js/variation-3-nucleus.js` builds both 3 and 3b from one `makeNucleus()` function with different placements.

## Adding variation 4

1. Replace the `#hero-v4` placeholder `<section>` in `index.html`. Keep `data-hero="4"`.
2. Add `css/variation-4-<name>.css` (and `js/variation-4-<name>.js` if it needs script) and link it in `index.html`. A motion script registers itself as `window.FrontierHeroMotion["4"] = { start, stop }`, and the tabs start and stop it.
3. Rename the tab label in the nav (`[data-variation-tab="4"]`).
4. To theme the whole page, redefine the tokens under `body[data-variation="4"]`. `variation-2-dissolve-ring.css` shows how.
