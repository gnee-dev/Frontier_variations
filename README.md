# Frontier — Lander hero variations

A static landing page for Frontier (plain HTML, CSS and JS, with no build step) that holds several **hero variations**. You switch between them with the tabs in the nav bar.

| Tab | Variation | Status |
| --- | --- | --- |
| 01 · Pixel globe | Large headline, a row of four equal glass cards, and a pixel globe behind everything. Black & white; orange (`#E96E26`) for buttons and the typed TLD + caret. | ✅ Done |
| 01b · Globe colour | Variation 1 with exactly the same layout and content, in the Figma colours: a rose-to-amber pixel globe with faint blue oceans, orange accents and icons, green points, and soft dusk light behind the hero. | ✅ Done |
| 02 · Nucleus | Dark mode. Headline left, typed domain + Join Frontier right (equal heights), and a centred particle sphere: a rotating nucleus inside a sparse halo. Three compact stat cards at the bottom. | ✅ Done |
| 02b · Nucleus centred | Dark mode. The second Figma file's centred stack (headline sized to the domain field's width, field with Join Frontier inside, bonus line, subtitle) with a big particle sphere rising out of the bottom of the hero. | ✅ Done |
| 03 · Horizon | Dark mode. The 02b centred stack over a pixel landscape along the bottom of the hero: rolling hills of square pixels in perspective, moving toward the viewer as if flying forward, with a glowing crest line. | ✅ Done |
| 03b · Horizon light | Light mode of 03 · Horizon: the same hero (centred stack, moving pixel landscape, stat cards) in the light theme's colours: warm off-white page, lighter orange `#DA5A12` buttons and TLD, green `#1AC684` points, and orange `#E96E26` landscape pixels. | ✅ Done |
| 03c · Horizon colour | 03 · Horizon with exactly the same layout, in the 01b / Figma colours: near-black plum, a dusk landscape (amber near, rose toward the horizon) with a blue crest line, orange accents and green points. | ✅ Done |

The tabs are grouped in pairs: each variation (01, 02, 03) has its "b" (and for 03, "c") versions next to it. To fit them all, inactive tabs show only their number, and only the active tab's name slides open (hover a tab for its full name). On phones and small tablets (720px and below), the tabs get their own full-width row under the logo and Sign up, with numbers only.

The active tab is kept in the URL hash, so you can link straight to a variation: `index.html#v1`, `#v1b`, `#v2`, `#v2b`, `#v3`, `#v3b`, `#v3c`.

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
  variation-1b-colour.css       # Variation 1b: colour theme over the variation 1 hero and page (also used by 3c)
  variation-2-nucleus.css       # Hero variation 2 (nucleus particle sphere, dark)
  variation-2b-nucleus-centred.css # Hero variation 2b (centred copy, sphere rising from the bottom)
  variation-3-horizon.css       # Hero variation 3 (pixel landscape; layout from 2b)
  variation-3b-horizon-light.css # Variation 3b: the light theme for the whole page, applied to the variation 3 hero
  variation-3c-horizon-colour.css # Variation 3c: landscape + hero colours over the variation 3 hero (page colours from 1b)
js/
  main.js                       # tab switching, typing domain, counters, scroll reveals
  variation-1-pixel-globe.js    # pixel globe: rotation + static hover points with names
  variation-2-nucleus.js        # nucleus builder for 2 and 2b: rotating particle sphere + halo + static hover points; 2b headline fitting
  variation-3-horizon.js        # horizon (tabs 03, 03b and 03c): moving pixel landscape + static hover points; headline fitting
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

## Variation 2: Nucleus

- **Layout.** Dark mode with orange buttons. "Be the first to ever own" and the subtitle sit on the left. The typed domain with the Join Frontier button right under it, and the bonus line (with the live countdown), sit on the right. The particle sphere is in the middle. Both side columns share one grid row, so they're always the same height, with their tops and bottoms aligned. Three compact stat cards sit at the bottom, and the page uses −0.08% letter-spacing, as in the centred and light variations.
- **Nucleus.** A particle sphere drawn on a canvas in tiny square pixels. The nucleus is ~1,500 pixels spread over a sphere, rotating in 3D (about 18° a second) on a slightly tilted axis. Near-side pixels are bigger and brighter, so it reads as a solid ball. Around it, a halo of ~1,400 single pixels (and a few larger faint ones) turns much more slowly for parallax, and the pixels twinkle gently. The whole graphic is muted and fades softly toward its edge, like the globe in Variation 1. The canvas spills past its box so the halo can spread wider than the column gap, and it's centred on the page.
- **Hover names.** As in the other variations, an invisible layer of static points (20px apart) covers the sphere. Each point holds one name, which stays put while the cursor is idle even though the nucleus keeps spinning.

## Variation 2b: Nucleus centred

- **Layout.** This follows the second Figma file's layout with smaller type: one centred stack of the 48px headline, the domain field (48px text, always exactly as wide as the headline's text, measured in script) with Join Frontier inside it (17.5px above and below the button, 16px to its right), the 16px highlighted bonus line with the live countdown, and the 14px subtitle. Every button on this tab's page content is the same 40px button with an 18px label (16px on phones under 400px). The nav's Sign up matches the other tabs. The stack sits in the space between the bottom of the nav and the top of the stat cards, raised above centre: the free space splits 30% above and 70% below, which lifts it by about 10% of that space on desktop. There's always at least 32px above and below, so on phones with no spare room it stays centred. Each is one line with a 1.2 line height, and the gaps are 24px, 20px and 24px. On screens too narrow for the 674px field, the headline scales down in script to match the field's width. Three compact stat cards sit at the bottom.
- **Sphere.** It's the same particle sphere as Variation 2, much bigger (the nucleus is up to 360px in radius), centred at the bottom edge. The top dome rises between the copy and the cards, and the rest disappears behind the cards and out of the bottom of the hero, with a soft fade. It keeps rotating, and pixels under the copy are dimmed.
- **Hover names.** They work the same way as the other variations: static points hold the names, and an idle cursor keeps its name.
- **Code.** `js/variation-2-nucleus.js` builds both 2 and 2b from one `makeNucleus()` function with different placements.

## Variation 3: Horizon

- **Layout.** It uses the same markup and classes as Variation 2b (`hero-v2b__*`): the centred headline, the domain field sized to the headline, the bonus line with the live countdown, the subtitle and three compact stat cards. The tab-wide rules (−0.08% letter-spacing, 40px buttons with 18px labels) cover both tabs.
- **Landscape.** A height field of rolling hills (a valley in the middle rising to both sides) is sampled on a fixed world grid of small square pixels and drawn in perspective. The horizon sits between the copy and the stat cards. The grid moves toward the camera, about 0.28 world units a second, with a slow sideways drift, so it reads as flying forward over the hills. Rows are drawn near to far against a per-column skyline, so hills hide what's behind them. Far rows and columns thin out in two steps and fade into the horizon without popping. There are hills everywhere, including in the valley, with taller ranges toward the horizon. Slopes facing the camera catch more light, and one contour line is lit like the crest light in the reference. Every pixel is grey, never solid white: the brightest ones top out at about 56% white. There are faint stars above, and the whole layer fades out at the bottom edge.
- **Hover names.** As in the other variations, an invisible layer of static points (24px apart, 20px on phones) covers the ground below the skyline. Each point holds one name, which stays put while the cursor is idle even though the landscape keeps moving. Pixels under the copy and cards are dimmed.
- **Tuning.** `height()`, `SPEED`, `CONTOUR`, `Z_FAR` and the `LOD_1`/`LOD_2` distances are at the top of `js/variation-3-horizon.js`.

## Variation 3b: Horizon light

- **Same hero as 03.** Tab 03b reuses the Variation 3 hero (`data-hero="3 3b"`), so the elements, layout and motion are identical: the centred stack, the moving pixel landscape with hover names, and the three stat cards.
- **Light theme colours (from the earlier Variation 2).** The whole page switches to the light theme while this tab is on. Every colour comes from theme tokens on `<body>`, and `css/variation-3b-horizon-light.css` redefines them under `body[data-variation="3b"]`. Buttons and the typed TLD use the lighter orange `#DA5A12` (white button text has 3.85:1 contrast), "+10,000 pts" is green `#1AC684`, and the name part of the domain is a light grey.
- **Landscape.** The pixels are the brand orange `#E96E26` (the colour of the old dissolve ring), up to 72% opacity, with a soft orange light along the horizon and faint dark specks for stars. The script reads these from the `--horizon-pixel`, `--horizon-max`, `--horizon-glow`, `--horizon-star` and `--horizon-marker` variables, so tab 03 keeps its grey-on-black.
- The earlier dissolve ring hero was replaced by this one; it's in the git history if it's needed again.

## Variation 3c: Horizon colour

- **Same hero as 03.** Tab 03c also reuses the Variation 3 hero (`data-hero="3 3b 3c"`), so the layout, copy, hierarchy and motion are identical.
- **01b colours.** The page tokens and the section accents come from `css/variation-1b-colour.css`, whose rules cover both `1b` and `3c`: a near-black plum background, white headings and 64% body text, orange `#E96E26` buttons (`#FF7C31` for orange text such as the typed TLD), green `#4AFFBA` for points, and orange card icons. `css/variation-3c-horizon-colour.css` adds the hero: soft dusk light (a rose band at the horizon, warm light from below), a warm-tinted domain field and plum-tinted stat cards.
- **Dusk landscape.** The ground shades from warm amber near the viewer to rose toward the horizon, the lit crest line is the Figma blue `#4AC6FF`, and the horizon glows rose. The script reads `--horizon-pixel`, `--horizon-pixel-far` and `--horizon-line` (and the other `--horizon-*` variables) and draws the ground in six depth bands for the gradient. Colour is used only in the landscape and the accents, so the copy stays first.

## Adding another variation

1. Add a tab in the nav (`data-variation-tab="4"`, `aria-controls="hero-v4"`, with `variation-tabs__num` and `variation-tabs__name` spans) and a `<section data-hero="4">` hero in `index.html`, and allow the id in the hash regex in `js/main.js`.
2. Add `css/variation-4-<name>.css` (and `js/variation-4-<name>.js` if it needs script) and link it in `index.html`. A motion script registers itself as `window.FrontierHeroMotion["4"] = { start, stop }`, and the tabs start and stop it.
3. To theme the whole page, redefine the tokens under `body[data-variation="4"]`. `variation-3b-horizon-light.css` shows how.
