# Frontier — Variation 04b · Video full bleed (standalone)

A self-contained page for just the 04b hero, split out of the main variations page so it can be worked on separately. It has its own copies of the styles, scripts and assets, so changes here don't affect the other variations (and vice versa).

Open `variation-04b/index.html` directly, or serve the folder (`python3 -m http.server` inside it).

## What's on the page

The content follows the live site, frontier.d3.com, in this page's design, with the variation orange (`#E96E26`) for accents.

- **Nav**: logo, a **Vaults** dropdown (Solana, Hyperliquid) and Sign in.
- **Hero**: "Be the first to ever own" with the typed domain (starting with `zero.sync`) and Join Frontier inside the field; "1,000+ new internet extensions are coming. They work exactly like .com."; "+10,000 pts on sign-up" (the points in green, `#4AFFBA`). Four stat cards: Points rate 4× (Epoch 1 · ends Mar 21, 2027), Program TVL $113K, Members 34,434, Extensions live 55. The Ocean B background plays full bleed behind it: the intro, then the loop (see Video placement).
- **How Frontier works**: Deposit and earn, Build points (55,000 points), Get priority (.agent 84 · .crypto 57 · .robot 31 backers), with a "How it works" link.
- **Back the extensions you want**: .hype, .human, .agent, .robot, .btc, .sol (highlighted), .gate, .nft.
- **Get ready for the next internet land rush**: a five-point timeline, from 1985 (the first six) and 2012 (~1,200 more) to Aug 2026 (1,600+ applications, the current point), Oct 2026 (reveal day) and 2027 (first extensions go live), with a "Program timeline" link.
- **Over 20 TLD applicants and registries are part of Frontier**: Become a Frontier Partner, and "How Frontier works for registries".
- **A few things to know.**: a collapsible FAQ (native `<details>`: click a question to open or close it; the first starts open) with the four questions from the site, and View all FAQs.
- **Banner**: "Be first to the new internet frontier." with Join Frontier, then the site's disclaimer note.
- **Footer**: How it works · For registries · FAQ · Terms of Service · Frontier Terms · Privacy Policy · Brand kit, with X, Discord and LinkedIn.

Links point to sections on this page or `#` placeholders until the real URLs are wired up.

## Video placement

`fitVideo()` in `js/variation-4b.js` sizes and places the video on every layout change:

- the **horizon** is first placed just above the stat cards (about 40px; 28px on phones),
- the **celestial ring** sits clear below the nav bar (at least 28px) and fully on screen,
- the video fills the width, and grows until its top reaches up under the nav when it would otherwise leave a band of plain background (tall screens), without the ring getting closer than about 48px to the nav.
- then the whole video is raised by up to 15% of the hero's height, but never so far that the ring would come within 28px of the nav, and after that lowered by 3% of the hero's height, so the top of the hero is less crowded (the horizon always stays at least 12px above the stat cards). The result: the horizon sits about 130–155px above the stat cards on desktops and tablets (75–115px on phones), and the ring 50–100px under the nav. The nav's position is read from layout, so its slide-in animation doesn't skew the measurement.

The background is **Ocean B** (from the design exports `OceanB.dc.html` and `Main.dc.html`), in two clips at 1440 × 1076 that share one scene:

- **Intro** (`hero-04b*`, 16s): fades in from black as the ring rises from behind the horizon, with a sun flaring low on the right edge. It plays first on every page load.
- **Loop** (`hero-04b*-loop`, 12s): the same scene, holding, with light travelling along the ring's rim. It repeats for as long as the page is open.

Each **vault** has its own footage with the same framing (the ring and horizon sit exactly where they do in Ocean B, so the same placement values apply):
- **Solana**, in violet and green: `OceanBSolana.dc.html` (rise, `hero-04b-sol*`) and `OceanSolana.dc.html` (loop, `hero-04b-sol*-loop`).
- **Hyperliquid**, in deep blue and mint: `OceanBHyperliquid.dc.html` (rise, `hero-04b-hype*`) and `OceanHyperliquid.dc.html` (loop, `hero-04b-hype*-loop`).

The hero picks its footage with `data-media` (`hero-04b-sol`, `hero-04b-hype`; the main page uses the default `hero-04b`), and each vault's banner uses its own poster.

The two videos are stacked in the same box. The loop waits underneath, already loaded. 1.2s before the intro ends it starts, and the intro dissolves into it (`#hero-v4b-video.is-out`, timing `XF` in the script). The ring sits in the same place in both clips, so only the rim light and the water blend, with no visible cut. If the loop isn't ready in time, the intro holds its last frame until it is. If the screen changes size mid-play, the new files carry on from the same moment. With reduced motion, the intro's poster (its final frame) shows and nothing plays. The design's vignette sits over both (`radial-gradient(ellipse at 52% 45%, transparent 55%, rgba(13, 11, 31, 0.45))`, `.hero-v4b__vignette`, sized by the script to the full frame even on the tablet and phone cuts). The design's React runtime (`support.js`, `vendor/react*.js`) only rendered the mockups, so the page uses the videos, posters and vignette directly.

Where the ring and horizon sit in each file (measured from the footage, at the ring's highest point, which it holds at the end): ring 46.5–79% across and from 15.5% down, horizon 44.2% down (tablet and phone cuts: see `R4B` in the script). The same rules place it on the vault pages.

| File | Size | Used when |
|---|---|---|
| `assets/media/hero-04b.mp4` / `.webm` (+ `hero-04b-loop.*`) | 1440×1076 | the hero is landscape (wider than 1.1:1) |
| `assets/media/hero-04b-tablet.*` (+ `-tablet-loop.*`) | 800×1076, cut around the ring | tall tablet screens (0.6–1.1:1) |
| `assets/media/hero-04b-phone.*` (+ `-phone-loop.*`) | 612×1076, cut around the ring | phones (narrower than 0.6:1) |

Each has a poster (`*-poster.jpg`: the intro's final frame, the loop's first). H.264 MP4 plays where supported, VP9 WebM otherwise; `preload="none"` in the markup means only the chosen files (intro and loop for that shape) download. The video plays only while the hero is on screen and stays on the poster for reduced motion.

## How it works page

`how-it-works.html` recreates frontier.d3.com/how-it-works (layout, copy and interactions, from the screenshots and screen recording) in the 04b design: black page, Google Sans Flex, the orange accent, and the Ocean B hero background (rise, then loop) with the same placement rules. The hero has `data-fill`: the video always fills the full width (no side fades), moving down when it needs to so the ring stays at least 28px under the nav. It's linked from the nav on every 04b page: a "How it works" link, or on phones the first item in the Vaults menu.

Type scale on this page: body copy 16px (the hero subtitle's size: section descriptions, the compare labels and footers, step text, and the step eyebrows like "Step 1 · Start earning points"), info on cards 14px, animation labels 16px (the name) and 14px (tags), corner status tags 14px (`--hiw-fs-body`, `--hiw-fs-card` in `css/how-it-works.css`).

Each section has a name, used on its markup (`data-section`), its CSS block (`css/how-it-works.css`) and its JS block (`js/how-it-works.js`), so it can be changed on its own:

| Section | What it is | Anchor |
|---|---|---|
| `hiw-hero` | "Be first in line, not first to click", the subtitle, Join Frontier, and "4× points live now." (subtitle size, medium, `#4AFFBA`) | |
| `hiw-compare` | One story on one 13s clock, both sides at once. Dots are people (orange: You; red squares: bots); the pill is alex.agent. **Without Frontier**: waiting for the public sale (countdown), everyone rushes at once, a bot takes it in 0.4s, You miss it. **With Frontier**: members earn points (dots grow), back .agent (links to the name), line up by points (You 2nd); the line is served in order before the public sale, #1's max is below the price, so You register it. Each side has a live status chip; it runs while on screen, and shows the outcome still with reduced motion | `#why` |
| `hiw-steps` | Deposit, earn points / Back .agent / Points set your place, under the compare card. Also the timeline of the With Frontier animation: the step playing lights up with its progress; a click jumps the animation to it (or, when the panel is off screen, goes to that section) | |
| `hiw-earn` | Step 1, two columns. Left: "Day one beats month six by 3×", the description, the chips, and the invite link. Right, in a card: Deposit with its tabs ($100 / $1,000 / $10,000) and the live rate on one row, the chart (it redraws from the left on every tab change, values and axis counting to the new deposit), beside the chart each line's points level with where it ends, with the drop next to the value (−33%, −66%) and when it started (the line's colour and style identify it), and the estimate note. The card has 16px padding. Below 1080px the columns stack so the chart keeps its width; on phones the points go under the chart | `#deposit` |
| `hiw-back` | Step 2: "Back extensions like .agent before public sale" and the live most-backed list (Back buttons toggle your backing) | `#back` |
| `hiw-timeline` | "Build priority now to use later": milestones, then Sunrise / Frontier 7+ days / Public sale | `#timeline` |
| `hiw-priority` | Step 3: four steps on the left; the alex.agent card on the right stays in view and changes with them (price locked → members commit → ranked by points → You get alex.agent) | `#get-in-line` |
| `hiw-cta` | "Ready to be first in line?" | |
| `hiw-registries` | "Applied for a TLD? Meet your buyers before launch." | |
| `hiw-disclaimer` | the small print | |
| `hiw-section-nav` | the floating pill (Why · Earn points · Back TLDs · Timeline · Get in line); it appears after the hero and follows the section on screen | |

## Vaults

The **Vaults** tab in the nav opens a small menu of the two vault pages. It opens on hover with a mouse and on tap or Enter otherwise, and closes on a click outside, Escape, or when the pointer leaves it (`js/vaults.js`). Both vault pages have the same tab, with the current vault marked.

- `vault-solana.html` (Stake SOL, D3 Internet Vault on Loopscale)
- `vault-hyperliquid.html` (Stake HYPE, D3 Internet Vault on Upshift)

The two pages share one layout, from the Figma vault designs, in this page's design with orange accents. Only the content and the chain visuals change between them:

- **Nav**: Frontier × the chain logo (mark and name as tall as the Frontier wordmark, at each nav size, without stretching the marks), Vaults and Sign in. On narrow phones only the chain mark shows.
- **Hero**: the same full-bleed video. "Be the first to ever own" with the typed name (only the vault's own extension: alpha.sol, maker.sol, degen.sol, stake.sol, gm.sol, validator.sol, mint.sol on Solana; alpha.hype, trader.hype, perp.hype, whale.hype, gm.hype, liquid.hype, vault.hype on Hyperliquid), the 1,600+ applications line, a Stake button, and ".sol/.hype · .agent · .human · .robot lead the round for …". The hero keeps the main page's stat-card row as an invisible copy, with that last line centred over it, so the hero and the video are exactly as on the main page at every size (on phones the Stake button sits a little lower, to make up for the Join button the main page's field holds).
- **Backed by**: the chain, then the partner names (Solana: sunrise, Meteora, Raydium, Jupiter, Kamino, Superteam, + more; Hyperliquid: Hyperion DeFi, Upshift, Kinetiq, Veda), set in type.
- **Web. Mail. Wallet.**: browser, email and wallet mock-ups for maker.sol / trader.hype, with the address it resolves to and a 2,500 SOL/HYPE send.
- **… community goes first.**: Stake, Earn, Go first, then a Stake button.
- **This has happened twice before.**: 1985, 2012-2015 and 2026 (highlighted, with the chain's extension as a large orange tag).
- **Same SOL/HYPE. One move.**: today vs. the D3 Internet Vault (yield in green, place in line in orange), with a dotted link between them.
- **8× in month one.**: a step chart (8× month one, 4× to month 6, 2× to month 12, 1× after) that grows in when it scrolls into view, the legend, and "More points, higher priority."
- **Banner** over the horizon image, then the footer with the logos (Solana Foundation on the Solana page), the ICANN and points notes, and the usual links.

**Typed name** (every 04b page): the name part is at 64% white and the extension is at full strength in the accent colour (main page: "zero." at 64%, "sync" in orange; vaults: "alpha" at 64%, then .sol or .hype in the vault colour).

**Vault colours**: each vault swaps the orange accent for its own colour, for its buttons (black labels) and its highlights: the typed extension, the hover cell and trail, the section accents, the 2026 tag, the chart's month-one bar. Solana is white; Hyperliquid is `#97FCE4`. The accent is one set of tokens in `css/base.css` (`--c-accent`, `-hover`, `-press`, `--accent-rgb` for tints, `--c-on-accent` for button text), redefined per vault at the end of `css/vaults.css`. The main page keeps the orange with white labels.

## Hover grid

On the vault pages every hover name uses the vault's extension (`data-tld` on the hero: `.sol`, `.hype`); the main page mixes all of them.

A faint grid of 20px cells (16px on phones) covers the hero outside the copy and the cards. The cell under the cursor is highlighted in orange and shows a name; while the cursor moves, the last three cells trail behind it in orange at falling opacity and fade as soon as it stops.

## Files

```
index.html
how-it-works.html                           # the How it works page (sections named hiw-*)
vault-solana.html, vault-hyperliquid.html   # the vault pages (one layout, different content)
css/
  base.css, sections.css, hero-shared.css   # copies from the main page
  variation-2b-nucleus-centred.css          # the centred-stack layout (hero-v2b__* classes)
  variation-4b-video-full-bleed.css         # video, grid, hover, copy over the video
  page.css                                  # this page only: nav, four stat cards, orange accents, timeline, FAQ, disclaimer
  vaults.css                                # the Vaults dropdown and the vault pages
  how-it-works.css                          # the How it works page, one block per section
js/
  vaults.js                                 # the Vaults dropdown
  how-it-works.js                           # How it works: swarm/queue, chart, Back buttons, priority card, section pill
  variation-4b.js                           # video renditions + placement, hover grid + trail, headline fitting
  main.js                                   # copy of the page script (typing domain, counters, reveals, countdown)
assets/
  logos/, icons/, media/
```
