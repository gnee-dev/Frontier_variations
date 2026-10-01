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

## v2 (v2.html): redesigned sections below the hero

Linked as "v2" in the nav of every 04b page, before How it works. It has the 04b hero; the sections below it are being rebuilt on shared foundations. Built so far: How it works, Why now, Back the extensions, Where your money goes, FAQ, For registries, Stake your claim.

**Tokens** (`css/base.css`, all `--v2-*` so they never collide with the current page's tokens):

| Group | Tokens |
|---|---|
| Surfaces | `--v2-bg` #0A0A0A, `--v2-surface` #121212, `--v2-surface-sunken` #0F0F0F, `--v2-surface-warm` #161514 (registries only) |
| Borders | `--v2-border` #262626, `--v2-border-strong` #333333, `--v2-border-warm` #2E2B28 |
| Text | `--v2-text` #EDEDED, `--v2-text-secondary` #D4D4D4, `--v2-text-muted` #A3A3A3, `--v2-text-subtle` #8A8A8A |
| Accent | `--v2-accent` #F26A21, `--v2-accent-hover` #FF8A4C, `--v2-accent-tint` 14%, `--v2-accent-tint-weak` 8%, `--v2-accent-on-tint` #FFB184 |
| Status | `--v2-success` #4ADE9B |
| Radii | `--v2-r-sm` 6, `--v2-r-md` 10 (buttons, chips, inputs), `--v2-r-lg` 12, `--v2-r-xl` 16 (cards), `--v2-r-2xl` 20 (large panels), `--v2-r-3xl` 24 (feature cards) |
| Layout | `--v2-container` 1200px; `--v2-gutter` 120px ≥1280, 48px 768–1279, 20px <768; `--v2-section-pad` 96px desktop, 64px tablet, 48px mobile; `--v2-target` 44px |

Breakpoints: mobile <768, tablet 768–1023, desktop ≥1024. Fonts are untouched: everything uses `--font`, with only sizes and weights set.

**Rules**: orange is for primary actions, links and "you/your" states only; numbers are tabular; no background grid textures below the hero; anything you can press is at least 44px tall and a real `<button>`, `<a>`, `<input>` or `<label>`.

**Consistency rules** (for all future work):
- **Buttons**: one button style. Every primary button is the site's `.btn .btn--primary` (the same as Join Frontier: 18px/600 label, 9px × 16px padding, 8px radius, 40px tall; 16px label and 14px sides on phones), with the arrow icon where it leads somewhere. No one-off button classes.
- **Subtitles**: every subtitle (hero and sections) is `--v2-fs-subtitle` (17px), 400, `--v2-text-muted`.
- **Small tabs**: every clickable small tab or toggle is a `.v2-chip`: 15px, 500, 0 18px padding, 44px tall, the font token. Selected changes only the colours, never the weight or the size.
- **Type floor**: no text under 14px anywhere on v2 (eyebrows, notes, labels included).

**Layout** (`css/v2.css`): `.v2-section` (the v2 background, section padding, tabular numbers, no texture) and `.v2-container` (1200px centred, with the gutter).

**SectionHeader** (`<f-section-header>`, `js/v2.js` + `css/v2.css`):

```html
<f-section-header eyebrow="How it works"
                  title="Deposit, earn points, back the names you want"
                  subtitle="Frontier gives you priority access to new top-level domains from ICANN's 2026 round."
                  link-label="Full walkthrough" link-href="how-it-works.html"></f-section-header>
<!-- rightSlot: a child with slot="right" replaces the link -->
<f-section-header eyebrow="Points estimator" title="See what you'd earn"><div slot="right">…</div></f-section-header>
```

It renders a plain `header.v2-sh` with an `h2` in place. Eyebrow 14px uppercase 0.12em muted; title 44px/600/-0.02em/1.1 (32px on mobile); subtitle `--v2-fs-subtitle` (17px) muted 1.5; link 14px/600 accent with "→", on the bottom line of the left column (max 680px). On mobile it stacks, with the link 16px under the subtitle. `FrontierV2.sectionHeader({ eyebrow, title, subtitle, link: { label, href }, rightSlot })` builds the same element in script.

**Chip** (`.v2-chip`, a toggle `<button>` with `aria-pressed`):

```html
<div class="v2-chip-group" data-chip-group="single" role="group" aria-label="Deposit">
  <button type="button" class="v2-chip" aria-pressed="false" value="500">$500</button>
  <button type="button" class="v2-chip" aria-pressed="true" value="2000">$2,000</button>
</div>
```

44px min height, 0 18px padding, radius md, 15px. Unselected: 1px border-strong, text-secondary, 500, filled with bg (on a card, `.v2-card`) or surface (on a bg section, `.v2-section`). Selected: 1px accent border, accent-tint fill, accent-on-tint text (same 500 weight, so nothing shifts). `data-chip-group="single"` keeps one pressed; `"multi"` toggles each. The group fires `chipchange` with `{ value, values, chip }`; `FrontierV2.chip({ label, value, pressed })` builds one.

### v2 sections

**How it works** (`section.v2-how#v2-how`, `data-section="v2-how"`): a 48px stack of the SectionHeader ("Full walkthrough" links to `how-it-works.html`), the steps and the estimator.

- **Steps** (20px stack): a rail (3 columns, 24px gap; a 32px number circle and a 1px connector per step: step 1 filled accent with a connector fading from accent to border, steps 2 and 3 outlined with border connectors) over three equal-height cards (surface, 1px border, radius xl, 28px padding, 16px gap; h3 22/600, body 15px muted 1.5; each card's visual pinned to the bottom). Card 1: the asset pills from `ASSETS` and a dashed "+ more"; card 2: the formula "$1 × 1 day × 4× = 4 pts" with `EPOCH_MULTIPLIER`; card 3: the backer rows from `EXTENSIONS` (the same list the leaderboard will read). The backer bars are neutral (text-secondary), since orange is only for actions, links and "you" states.
- **Estimator** (`[data-estimator]`, surface, radius 2xl, 1.2fr / 1fr): left, the eyebrow, "See what you'd earn", and two single chip groups (`role="group"`, `aria-labelledby`): Deposit ($500, $2,000, $10,000, $50,000; default $2,000) and Hold for (30 days, 90 days, Until epoch ends; default 90). "Until epoch ends" is the days left until `EPOCH_END`, worked out live (172 on 1 Oct 2026). Right, over a radial glow: "Estimated points", the total (64px, Medium 500, accent), the per-day line, the disclaimer (14px) and "Start earning" (the site's primary `.btn`).
- **Maths** (`js/v2-how.js`): perDay = deposit × `EPOCH_MULTIPLIER`; total = perDay × days; en-US formatting. The result is `aria-live="polite"`; the total counts up over 300ms (`aria-busy` while counting, so it's announced once), and jumps straight there with reduced motion.
- **Responsive**: ≤1023px the cards stack, the rail hides and each card shows its number circle; ≤767px the estimator stacks (the form's divider moves to its bottom), the total drops to 48px so the largest value fits, and the chips wrap.

**Why now** (`#v2-why`): SectionHeader ("Program timeline" → `how-it-works.html#timeline`), then the timeline in one card: five milestones on a rail (done: grey with a check; you are here: filled accent with a halo, its eyebrow "You are here" in accent; upcoming: outlined; the last one outlined in accent, as it's your window). Each has a date (14px uppercase), an h3 (22/600), the text (15px muted) and a tag: `.v2-tag--you` (tint) for "You: deposit & earn", neutral for "You: back extensions", "You: keep backing" and "Your priority window opens". Below 1024px it runs vertically, the rail down the left.

**Back the extensions you want** (`#v2-back`, `js/v2-leaderboard.js`): SectionHeader; a search field and the category chips (from `CATEGORIES`); the leaderboard and the Selected panel (340px). Rows come from `EXTENSIONS`: rank, the extension (the row's button), applicant, backers (a neutral bar against the most backed; [##] when not published), status and "Back →". Choosing a row fills the panel and its button ("Back .agent with points"); search and the chips filter the table, with an empty message when nothing matches. Below 1024px the panel goes under the board; on phones the applicant and status columns hide.

**Where your money goes** (`#v2-trust`): SectionHeader, then three columns with dividers (stacked below 1024px): icon, h3, text, and the vaults (Solana and Hyperliquid, with their marks from the Vaults menu) / "How vaults work →" / "Frontier Terms →".

**FAQ** (`#faq`): the SectionHeader and "View all FAQs" (secondary button) on the left, sticky on desktop; five `<details>` on the right, the first open. Answers 2–4 are the site's existing answers; the fifth ("What if an extension I backed isn't approved?") has no answer yet and shows [Answer].

**For registries** (`#registries`): one warm panel (`--v2-surface-warm`, `--v2-border-warm`): SectionHeader, "Become a Frontier Partner" (primary) and "How it works for registries" (secondary), the logo placeholders, and the partner dashboard preview (the most backed extension from the config, a Live status, the chart, and the two placeholder stats).

**Stake your claim** (`#join`, the closing panel; every "Join" / "Sign in" / "Back" link on v2 lands here): surface panel (radius 2xl) with faint wave lines and a low orange glow; a pill "Epoch 1 · 4× points · N days left" (N worked out live from `EPOCH_END`); a centred SectionHeader; the hero's domain field at section size: a real input ("yourname" at 64%, letters, digits and hyphens only, growing with its text so ".agent" follows it) and the hero's Join Frontier button; and the hero's sign-up line ("+10,000 pts" in #4AFFBA). On phones the button drops under the name.

Colour: per the v2 rules, orange is kept for buttons, links, the selected state and "you/your"; the bars, the chart line, the trust icons and the +/− are neutral.

**Secondary button** (`.btn--secondary`, `css/base.css`): the primary `.btn`'s size and padding with a 1.4px accent stroke at 64%, accent text and a black fill (the How it works page's secondary look).

Program constants and shared lists live in `js/v2-config.js` (`window.FRONTIER_V2_CONFIG`): `EPOCH`, `EPOCH_MULTIPLIER`, `EPOCH_END`, `ASSETS`, `EXTENSIONS`, `ESTIMATOR`.

## How it works page

`how-it-works.html` recreates frontier.d3.com/how-it-works (layout, copy and interactions, from the screenshots and screen recording) in the 04b design: black page, Google Sans Flex, the orange accent, and the Ocean B hero background (rise, then loop) with the same placement rules. The hero has `data-fill`: the video always fills the full width (no side fades), moving down when it needs to so the ring stays at least 28px under the nav. It's linked from the nav on every 04b page ("How it works", next to Vaults); on phones, where the nav has no room for it, it's in the footer links.

Spacing and buttons: the six sections after the hero have 120px top and bottom padding. Secondary actions (Get your link, See all extensions, Read the FAQ, Become a Frontier partner, How Frontier works for registries, Book a call) are outlined buttons: the orange buttons' size and padding, a 1.4px orange border at 64% opacity, orange text, black fill.

Type scale on this page: body copy 16px (the hero subtitle's size: section descriptions, the compare labels and footers, step text, and the step eyebrows like "Step 1 · Start earning points"), info on cards 14px, animation labels 16px (the name) and 14px (tags), corner status tags 14px (`--hiw-fs-body`, `--hiw-fs-card` in `css/how-it-works.css`).

Each section has a name, used on its markup (`data-section`), its CSS block (`css/how-it-works.css`) and its JS block (`js/how-it-works.js`), so it can be changed on its own:

| Section | What it is | Anchor |
|---|---|---|
| `hiw-hero` | "Be first in line, not first to click", the subtitle, Join Frontier, and "4× points live now." (subtitle size, medium, `#4AFFBA`) | |
| `hiw-compare` | (The three-step strip that followed it was removed; the steps are explained by the sections below.) One story on one 13s clock, both sides at once. Dots are people (orange: You; red squares: bots); the pill is alex.agent. **Without Frontier**: waiting for the public sale (countdown), everyone rushes at once, a bot takes it in 0.4s, You miss it. **With Frontier**: members earn points (dots grow), back .agent (links to the name), line up by points (You 2nd); the line is served in order before the public sale, #1's max is below the price, so You register it. Each side has a live status chip; it runs while on screen, and shows the outcome still with reduced motion | `#why` |
| `hiw-earn` | Step 1, two columns. Left: "Day one beats month six by 3×", the description, the chips, and the invite link. Right, in a card: Deposit with its tabs ($100 / $1,000 / $10,000) and the live rate on one row, the chart (it redraws from the left on every tab change, values and axis counting to the new deposit), the chart across the full width of the card, with each line's points in a box on it at the line's end (a dot marks the end; the drop −33% / −66% next to the value, then when it started), and the estimate note. The card has 16px padding and 24px between its three parts (the deposit bar, the chart, the note). Below 1080px the columns stack; on phones the boxes go under the chart | `#deposit` |
| `hiw-back` | Step 2: "Back extensions like .agent before public sale" and the live most-backed list (Back buttons toggle your backing) | `#back` |
| `hiw-timeline` | "Build priority now to use later", as a road (`.hiw-road`): the three milestones (Deposits open in orange, ICANN review, Participating extensions launch) over one rail: the "now" dot, orange to ICANN review, fading into dashes, then grey, with a thick orange stretch over the Frontier phase; the lines draw in from the left when the section comes into view. "Now" and its line sit under the first two milestones; under the launch, its three phases (Sunrise / Frontier, 7+ days raised in orange with a glow, "Points set priority." in orange / Public sale) and the note. Then "Read the FAQ" (primary) and "Registry or applicant? Become a Frontier partner" (secondary). Small text is 14px. Below 1080px "Now" moves above the full-width phases; on phones it's one column, the rail down the left | `#timeline` |
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
v2.html                                     # v2: the 04b hero, then the redesigned sections (How it works → Stake your claim)
how-it-works.html                           # the How it works page (sections named hiw-*)
vault-solana.html, vault-hyperliquid.html   # the vault pages (one layout, different content)
css/
  base.css, sections.css, hero-shared.css   # copies from the main page
  variation-2b-nucleus-centred.css          # the centred-stack layout (hero-v2b__* classes)
  variation-4b-video-full-bleed.css         # video, grid, hover, copy over the video
  page.css                                  # this page only: nav, four stat cards, orange accents, timeline, FAQ, disclaimer
  vaults.css                                # the Vaults dropdown and the vault pages
  how-it-works.css                          # the How it works page, one block per section
  v2.css                                    # v2: layout, SectionHeader, Chip, the v2 sections (tokens in base.css)
js/
  vaults.js                                 # the Vaults dropdown
  v2.js                                     # v2: <f-section-header>, chip groups
  v2-config.js                              # v2: program constants and shared lists (epoch, assets, extensions, estimator)
  v2-how.js                                 # v2: How it works cards and the points estimator
  v2-leaderboard.js                         # v2: the leaderboard (search, filters, selected) and the partner preview
  how-it-works.js                           # How it works: swarm/queue, chart, Back buttons, priority card, section pill
  variation-4b.js                           # video renditions + placement, hover grid + trail, headline fitting
  main.js                                   # copy of the page script (typing domain, counters, reveals, countdown)
assets/
  logos/, icons/, media/
```
