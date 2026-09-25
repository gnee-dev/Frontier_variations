/* ==========================================================================
   Hero · Variations 4 and 4b — "Video frame" / "Video full bleed"
   Hover names over the video, like the other variations: a layer of static
   points (28px apart, 22px on small areas) covers the video, shown as a
   faint pixel grid of the marker's boxes. Each point holds one name, shown in the name card with a small
   square marker until the cursor moves clearly nearer another point.
   Labels, buttons, the copy and the cards are kept clear. No canvas is
   needed: a marker element sits on the point.
     4  : points over the contained frame (plays a <video id="hero-v4-video"> there, if one is added)
     4b : points over the full-bleed hero, which plays the same video (sized and
          placed by fitVideo); the domain field is sized to the headline's width
   ========================================================================== */
(function () {
  "use strict";

  var NAMES = ["vault", "gen", "burner", "anon", "satoshi", "degen", "swarm", "gold", "ledger", "pixel",
    "first", "family", "node", "open", "cold", "based", "rare", "ghost", "hodl", "mint", "prime",
    "north", "island", "fjord", "studio", "bridge", "oasis", "stack", "moon", "alpha", "yield", "seed",
    "dao", "orbit", "keys", "signal", "sats", "meta", "pure", "trust", "safe", "chain", "hyper", "lucky",
    "noble", "atlas", "echo", "zero", "frontier", "genesis", "vista", "summit", "harbor", "ember",
    "mist", "dusk", "tide", "lagoon", "violet", "aurora"];
  var TLDS = [".crypto", ".wealth", ".wallet", ".agent", ".btc", ".sol", ".nft", ".robot", ".human", ".hype", ".gate"];
  var FEATURED = ["vault.crypto", "gen.wealth", "burner.wallet", "anon.agent", "satoshi.btc", "swarm.robot"];
  function hash(n) {
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return (n ^ (n >>> 16)) >>> 0;
  }
  function pointName(i, j) {
    var h = hash((i + 1024) * 8192 + (j + 1024) + 7919);
    if (h % 7 === 0) return FEATURED[(h >>> 8) % FEATURED.length];
    return NAMES[(h >>> 3) % NAMES.length] + TLDS[(h >>> 13) % TLDS.length];
  }

  // opts: area (element the points cover), tooltip, markerClass, hoverEl + hoverClass,
  //       clear (selector of elements whose boxes stay free of names),
  //       gridParent + gridClass (a faint pixel grid of the same boxes, on the same points)
  function makeHover(opts) {
    var area = opts.area, tooltip = opts.tooltip;
    if (!area || !tooltip) return;
    var tipName = tooltip.querySelector(".hero-tip__name");
    var marker = document.createElement("span");
    marker.className = opts.markerClass;
    marker.setAttribute("aria-hidden", "true");
    area.appendChild(marker);

    // Faint pixel grid: one 17px box (the marker's size) centred on every point,
    // drawn as a repeating tile so it lines up exactly with the hover marker.
    var grid = null;
    if (opts.gridParent) {
      grid = document.createElement("span");
      grid.className = opts.gridClass;
      grid.setAttribute("aria-hidden", "true");
      opts.gridParent.appendChild(grid);
    }
    function pitchFor(width) { return width < 520 ? 22 : 28; }
    function layoutGrid() {
      if (!grid || !area.clientWidth) return;
      var pitch = pitchFor(area.clientWidth);
      var ox = Math.round(area.clientWidth / 2), oy = Math.round(area.clientHeight / 2);
      var o = pitch / 2 - 8;   // the box spans point-8 .. point+9, like the marker
      var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + pitch + "' height='" + pitch + "'>" +
        "<path fill='white' fill-rule='evenodd' d='M" + o + " " + o + "h17v17h-17z M" + (o + 1) + " " + (o + 1) + "v15h15v-15z'/></svg>";
      grid.style.backgroundImage = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
      grid.style.backgroundSize = pitch + "px " + pitch + "px";
      // tile origin = point - pitch/2, so each box is centred on a point
      grid.style.backgroundPosition = (((ox - pitch / 2) % pitch) + pitch) % pitch + "px " + (((oy - pitch / 2) % pitch) + pitch) % pitch + "px";
    }
    if ("ResizeObserver" in window) new ResizeObserver(layoutGrid).observe(area);
    window.addEventListener("resize", layoutGrid);
    layoutGrid();

    function renderName(name) {
      var dot = name.indexOf(".");
      tipName.textContent = "";
      tipName.appendChild(document.createTextNode(name.slice(0, dot)));
      var tld = document.createElement("span");
      tld.className = "tld";
      tld.textContent = name.slice(dot);
      tipName.appendChild(tld);
      tooltip.classList.remove("is-swap");
      void tooltip.offsetWidth;
      tooltip.classList.add("is-swap");
    }

    function inClear(x, y, ar) {
      var els = area.querySelectorAll(opts.clear);
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect(), pad = 14;
        if (!r.width) continue;
        if (x > r.left - ar.left - pad && x < r.right - ar.left + pad && y > r.top - ar.top - pad && y < r.bottom - ar.top + pad) return true;
      }
      return false;
    }

    var hover = null;
    function onMove(e) {
      if (e.target.closest && e.target.closest("a, button")) return clearHover();
      var ar = area.getBoundingClientRect();
      var pitch = pitchFor(ar.width);
      var x = e.clientX - ar.left, y = e.clientY - ar.top;
      // keep the current point until the cursor is clearly nearer another one
      if (hover && Math.abs(x - hover.x) < pitch * 0.65 && Math.abs(y - hover.y) < pitch * 0.65) return;
      var ox = Math.round(ar.width / 2), oy = Math.round(ar.height / 2);   // whole pixels, as the grid
      var i = Math.round((x - ox) / pitch), j = Math.round((y - oy) / pitch);
      var px = ox + i * pitch, py = oy + j * pitch;
      if (px < 12 || py < 12 || px > ar.width - 12 || py > ar.height - 12 || inClear(px, py, ar)) return clearHover();
      if (hover && hover.i === i && hover.j === j) return;
      hover = { i: i, j: j, x: px, y: py };
      renderName(pointName(i, j));
      marker.style.left = px + "px";
      marker.style.top = py + "px";
      opts.hoverEl.classList.add(opts.hoverClass);
      tooltip.classList.add("is-visible");
      var w = tooltip.offsetWidth, h = tooltip.offsetHeight;
      var tx = px + 14, ty = py - h - 14;
      if (tx + w > ar.width - 8) tx = px - w - 14;
      if (ty < 8) ty = py + 18;
      tooltip.style.setProperty("--tx", Math.round(tx) + "px");
      tooltip.style.setProperty("--ty", Math.round(ty) + "px");
    }
    function clearHover() {
      if (hover) { hover = null; tooltip.classList.remove("is-visible"); }
      opts.hoverEl.classList.remove(opts.hoverClass);
    }
    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") onMove(e); });
    area.addEventListener("pointerleave", clearHover);
    return clearHover;
  }

  window.FrontierHeroMotion = window.FrontierHeroMotion || {};

  /* ---------------- Variation 4: the contained frame ---------------- */

  var frame = document.getElementById("hero-v4-frame");
  var clear4 = makeHover({
    area: frame,
    tooltip: document.getElementById("hero-v4-tooltip"),
    markerClass: "hero-v4__marker",
    hoverEl: frame, hoverClass: "is-hover",
    clear: ".hero-v4__hud-tl, .hero-v4__hud-bl, .hero-v4__play",
    gridParent: frame, gridClass: "hero-v4__grid"
  });
  // If the frame holds a <video id="hero-v4-video">, it plays only while tab 04 is
  // on (and stays on its poster for visitors who prefer reduced motion). With the
  // placeholder image there is nothing to play.
  var video4 = document.getElementById("hero-v4-video");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function playVideo(v) {
    if (!v || reduceMotion) return;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});   // autoplay blocked: the poster stays
  }
  function play4() { playVideo(video4); }
  if (clear4) window.FrontierHeroMotion["4"] = {
    start: play4,
    stop: function () { clear4(); if (video4) video4.pause(); }
  };

  /* ---------------- Variation 4b: full bleed ---------------- */

  var hero4b = document.getElementById("hero-v4b");
  var clear4b = makeHover({
    area: hero4b,
    tooltip: document.getElementById("hero-v4b-tooltip"),
    markerClass: "hero-v4b__marker",
    hoverEl: hero4b, hoverClass: "is-globe-hover",
    clear: "[data-globe-avoid], .hero-v2b__claim",
    gridParent: document.getElementById("hero-v4b-bg"), gridClass: "hero-v4b__grid"
  });

  // The domain field is always exactly as wide as the headline's text (as in
  // Variation 3); on narrow screens the headline scales down to fit.
  var title4b = document.getElementById("hero-v4b-title");
  var field4b = hero4b && hero4b.querySelector(".hero-v2b__domain");
  var stack4b = hero4b && hero4b.querySelector(".hero-v2b__stack");
  function fitTitle() {
    if (!title4b || !field4b || !stack4b || !stack4b.clientWidth) return;
    title4b.style.fontSize = "";
    var avail = stack4b.clientWidth;
    var natural = title4b.scrollWidth;
    if (natural > avail) {
      var base = parseFloat(getComputedStyle(title4b).fontSize);
      title4b.style.fontSize = Math.max(24, base * avail / natural).toFixed(2) + "px";
      natural = title4b.scrollWidth;
    }
    field4b.style.width = Math.min(natural, avail) + "px";
  }
  // Size and place the full-bleed video: the horizon (50% down the video) just
  // above the stat cards, the ring (12-50% down, 54-91% across) clear below
  // the nav and fully on screen, and as large as that allows (filling the
  // width whenever it can; if it can't, it is centred and its sides fade).
  var video4b = document.getElementById("hero-v4b-video");
  var VIDEO_RATIO = 1440 / 1076;
  function offsetIn(el, root) {
    var y = 0, x = 0, n = el;
    while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x, y: y };
  }
  function fitVideo() {
    var cards = hero4b.querySelector(".hero-v2b__cards");
    var nav = document.querySelector(".nav__inner");
    var W = hero4b.clientWidth;
    if (!video4b || !cards || !nav || !W) return;
    var navBottom = nav.getBoundingClientRect().bottom - hero4b.getBoundingClientRect().top;
    var cardsTop = offsetIn(cards, hero4b).y;
    var horizon = cardsTop - (W < 760 ? 28 : 40);        // just above the cards
    // the ring takes the 38% of the video's height above the horizon
    var hMax = (horizon - navBottom - 28) / 0.38;         // largest size with the ring 28px under the nav
    var hFitRing = (W - 32) / (0.37 * VIDEO_RATIO);       // the whole ring across the screen
    var hCover = W / VIDEO_RATIO;                         // exactly fills the width
    // Fill the width (smaller and centred if the ring would reach the nav). If that
    // would leave a tall empty sky above the ring (tall screens: tablets, phones),
    // grow the video until the ring sits about 48px under the nav instead; the
    // sides are then cropped, never the ring.
    var h = Math.min(hMax, hCover);
    var skyGap = horizon - 0.38 * h - navBottom;
    if (skyGap > (W > 820 ? 240 : 120)) {
      var hTarget = (horizon - navBottom - 48) / 0.38;
      h = Math.max(h, Math.min(hTarget, hFitRing));
    }
    h = Math.max(160, h);
    var w = h * VIDEO_RATIO;
    var left;
    if (w >= W) {
      // wider than the screen: centred, nudged left if needed to keep the ring's right edge 16px in
      left = Math.max(W - w, Math.min((W - w) / 2, W - 16 - 0.91 * w));
    } else {
      left = (W - w) / 2;
    }
    video4b.style.width = Math.round(w) + "px";
    video4b.style.height = Math.round(h) + "px";
    video4b.style.left = Math.round(left) + "px";
    video4b.style.top = Math.round(horizon - h / 2) + "px";
    video4b.classList.add("is-placed");
    video4b.classList.toggle("is-narrow", w < W - 1);
  }
  function layout4b() { fitTitle(); fitVideo(); }

  if (hero4b) {
    window.addEventListener("resize", layout4b);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout4b);
    window.FrontierHeroMotion["4b"] = {
      start: function () { requestAnimationFrame(layout4b); playVideo(video4b); },
      stop: function () { if (clear4b) clear4b(); if (video4b) video4b.pause(); }
    };
  }
})();
