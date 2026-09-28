# Frontier — Variation 04b · Video full bleed (standalone)

A self-contained page for just the 04b hero, split out of the main variations page so it can be worked on separately. It has its own copies of the styles, scripts and assets, so changes here don't affect the other variations (and vice versa).

Open `variation-04b/index.html` directly, or serve the folder (`python3 -m http.server` inside it).

## What's on the page

- **Nav** with the logo and Sign up only (no variation tabs), one row at every size.
- **Hero**: the ocean horizon loop full bleed behind the centred stack (48px headline, domain field sized to the headline's width with Join Frontier inside, bonus line with the live countdown, subtitle) and three compact stat cards.
- **The rest of the page** (How it works, Back the extensions, Steps, Applicants, Banner, Footer), the same as on the main page.

## Video placement

`fitVideo()` in `js/variation-4b.js` sizes and places the video on every layout change:

- the **horizon** sits just above the stat cards (about 40px; 28px on phones),
- the **celestial ring** sits clear below the nav bar (at least 28px) and fully on screen,
- the video fills the width, and grows until its top reaches up under the nav when it would otherwise leave a band of plain background (tall screens), without the ring getting closer than about 48px to the nav.

Where the ring and horizon sit in each file (measured from the footage): ring 46.5–79% across and from 15.5% down, horizon 44.5% down (tablet and phone cuts: see `R4B` in the script).

| File | Size | Used when |
|---|---|---|
| `assets/media/hero-04b.mp4` / `.webm` | 1440×1076 | the hero is landscape (wider than 1.1:1) |
| `assets/media/hero-04b-tablet.*` | 800×1076, cut around the ring | tall tablet screens (0.6–1.1:1) |
| `assets/media/hero-04b-phone.*` | 612×1076, cut around the ring | phones (narrower than 0.6:1) |

Each has a first-frame poster (`*-poster.jpg`). H.264 MP4 plays where supported, VP9 WebM otherwise; `preload="none"` in the markup means only the chosen file downloads. The video plays only while the hero is on screen and stays on the poster for reduced motion.

## Hover grid

A faint grid of 20px cells (16px on phones) covers the hero outside the copy and the cards. The cell under the cursor is highlighted in orange and shows a name; while the cursor moves, the last three cells trail behind it in orange at falling opacity and fade as soon as it stops.

## Files

```
index.html
css/
  base.css, sections.css, hero-shared.css   # copies from the main page
  variation-2b-nucleus-centred.css          # the centred-stack layout (hero-v2b__* classes)
  variation-4b-video-full-bleed.css         # video, grid, hover, copy over the video
  page.css                                  # this page only: nav without tabs, compact stat cards
js/
  variation-4b.js                           # video renditions + placement, hover grid + trail, headline fitting
  main.js                                   # copy of the page script (typing domain, counters, reveals, countdown)
assets/
  logos/, icons/, media/
```
