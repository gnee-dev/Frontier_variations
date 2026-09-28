/* ==========================================================================
   Hero · Variation 4b — "Video full bleed" (standalone page)
   - Video: each hero shape loads the file cut for it (full, tablet or phone),
     and fitVideo() sizes and places it so the horizon sits just above the
     stat cards and the celestial ring sits clear below the nav, fully on screen.
     It plays only while the hero is on screen and not for reduced motion.
   - Hover names: a faint grid of 20px cells (16px on phones) covers the hero
     outside the copy and the cards. The cell under the cursor is highlighted
     in orange and shows a name; a short orange trail follows while the cursor
     moves and fades as soon as it stops.
   - The domain field is sized to the headline's width.
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
  //       gridParent + gridClass (a faint pixel grid on the same points),
  //       gridLines (true: a continuous grid of lines with one cell per point, and
  //       the marker outlines that cell; otherwise separate 17px boxes like the marker),
  //       pitch (optional: function(width) -> point spacing; default 28px, 22px on small areas),
  //       trail + trailClass (grid mode: that many fading cells follow the cursor while it
  //       moves and fade out as soon as it stops)
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
    var pitchFor = opts.pitch || function (width) { return width < 520 ? 22 : 28; };

    // Trail: the last few cells the cursor crossed, each a little fainter
    var TRAIL_ALPHA = [0.55, 0.32, 0.16];
    var trail = [], trailCells = [], stopTimer = 0;
    for (var t = 0; opts.trail && t < opts.trail; t++) {
      var el = document.createElement("span");
      el.className = opts.trailClass;
      el.setAttribute("aria-hidden", "true");
      area.insertBefore(el, marker);   // under the highlighted cell
      trail.push(el);
    }
    function placeCell(el, c, pitch) {
      el.style.left = (c.x - pitch / 2) + "px";
      el.style.top = (c.y - pitch / 2) + "px";
      el.style.width = el.style.height = (pitch + 1) + "px";
    }
    function showTrail(pitch) {
      for (var k = 0; k < trail.length; k++) {
        var c = trailCells[k];
        if (!c) { trail[k].style.opacity = 0; continue; }
        placeCell(trail[k], c, pitch);
        trail[k].style.transition = "opacity 0.08s linear";
        trail[k].style.opacity = TRAIL_ALPHA[k] || 0.1;
      }
    }
    function fadeTrail(slow) {
      for (var k = 0; k < trail.length; k++) {
        trail[k].style.transition = slow ? "opacity 0.38s ease-out" : "none";
        trail[k].style.opacity = 0;
      }
      trailCells = [];
    }
    // the cursor counts as stopped after a short pause without movement
    function armStop() {
      if (!trail.length) return;
      clearTimeout(stopTimer);
      stopTimer = setTimeout(function () { fadeTrail(true); }, 110);
    }
    // cells between two cells (inclusive of from, exclusive of to), so a fast
    // move still leaves a continuous trail
    function cellsBetween(a, b, pitch, ox, oy) {
      var out = [], di = b.i - a.i, dj = b.j - a.j, n = Math.max(Math.abs(di), Math.abs(dj));
      for (var s = n - 1; s >= 0 && out.length < trail.length; s--) {
        var ci = a.i + Math.round(di * s / n), cj = a.j + Math.round(dj * s / n);
        out.push({ i: ci, j: cj, x: ox + ci * pitch, y: oy + cj * pitch });
      }
      return out;   // nearest to b first
    }
    function layoutGrid() {
      if (!grid || !area.clientWidth) return;
      var pitch = pitchFor(area.clientWidth);
      var ox = Math.round(area.clientWidth / 2), oy = Math.round(area.clientHeight / 2);
      var svg;
      if (opts.gridLines) {
        // 1px lines along the tile's top and left edges: a continuous grid whose
        // cells (pitch x pitch) are each centred on a point
        svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + pitch + "' height='" + pitch + "'>" +
          "<path fill='white' d='M0 0h" + pitch + "v1h-" + pitch + "z M0 1h1v" + (pitch - 1) + "h-1z'/></svg>";
      } else {
        var o = pitch / 2 - 8;   // the box spans point-8 .. point+9, like the marker
        svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + pitch + "' height='" + pitch + "'>" +
          "<path fill='white' fill-rule='evenodd' d='M" + o + " " + o + "h17v17h-17z M" + (o + 1) + " " + (o + 1) + "v15h15v-15z'/></svg>";
      }
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
      armStop();
      // keep the current point until the cursor is clearly nearer another one
      // (in grid mode: until it leaves the cell)
      var keep = opts.gridLines ? 0.5 : 0.65;
      if (hover && Math.abs(x - hover.x) < pitch * keep && Math.abs(y - hover.y) < pitch * keep) return;
      var ox = Math.round(ar.width / 2), oy = Math.round(ar.height / 2);   // whole pixels, as the grid
      var i = Math.round((x - ox) / pitch), j = Math.round((y - oy) / pitch);
      var px = ox + i * pitch, py = oy + j * pitch;
      if (px < 12 || py < 12 || px > ar.width - 12 || py > ar.height - 12 || inClear(px, py, ar)) return clearHover();
      if (hover && hover.i === i && hover.j === j) return;
      var next = { i: i, j: j, x: px, y: py };
      if (trail.length && hover) {
        trailCells = cellsBetween(hover, next, pitch, ox, oy).concat(trailCells).slice(0, trail.length);
        showTrail(pitch);
      }
      hover = next;
      renderName(pointName(i, j));
      if (opts.gridLines) {
        // outline exactly the cell around the point: its borders sit on the grid lines
        marker.style.left = (px - pitch / 2) + "px";
        marker.style.top = (py - pitch / 2) + "px";
        marker.style.width = marker.style.height = (pitch + 1) + "px";
      } else {
        marker.style.left = px + "px";
        marker.style.top = py + "px";
      }
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
      if (trail.length) { clearTimeout(stopTimer); fadeTrail(true); }
    }
    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") onMove(e); });
    area.addEventListener("pointerleave", clearHover);
    return clearHover;
  }

  window.FrontierHeroMotion = window.FrontierHeroMotion || {};

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function playVideo(v) {
    if (!v || reduceMotion) return;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});   // autoplay blocked: the poster stays
  }

  // Renditions: each hero shape loads only the file cut for it (see assets/media).
  // The ring and horizon positions are fractions of each file (x across, y down).
  var MEDIA = "assets/media/";
  var mp4ok = (function () {
    var v = document.createElement("video");
    return !!(v.canPlayType && v.canPlayType('video/mp4; codecs="avc1.640028"'));
  })();
  function setRendition(v, r) {
    if (!v || v.dataset.rendition === r.name) return false;
    var wasPlaying = !v.paused;
    v.dataset.rendition = r.name;
    v.preload = "auto";   // the markup says "none", so nothing loads before the right file is chosen
    v.poster = MEDIA + r.name + "-poster.jpg";
    v.src = MEDIA + r.name + (mp4ok ? ".mp4" : ".webm");   // a src attribute wins over the <source> tags
    if (wasPlaying) playVideo(v);
    return true;
  }


  /* ---------------- Variation 4b: full bleed ---------------- */

  var hero4b = document.getElementById("hero-v4b");
  var clear4b = makeHover({
    area: hero4b,
    tooltip: document.getElementById("hero-v4b-tooltip"),
    markerClass: "hero-v4b__marker",
    hoverEl: hero4b, hoverClass: "is-globe-hover",
    clear: "[data-globe-avoid], .hero-v2b__claim",
    gridParent: document.getElementById("hero-v4b-bg"), gridClass: "hero-v4b__grid",
    gridLines: true,
    pitch: function (width) { return width < 520 ? 16 : 20; },   // a finer grid than Variation 4
    trail: 3, trailClass: "hero-v4b__trail"
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
  // Size and place the full-bleed video: the horizon just above the stat cards,
  // the ring clear below the nav and fully on screen, and as large as that
  // allows (filling the width whenever it can; if it can't, it is centred and
  // its sides fade). Each rendition knows where its ring and horizon are.
  var video4b = document.getElementById("hero-v4b-video");
  var R4B = {
    //                        size        ring across      ring top  horizon   (measured from the video)
    full:   { name: "hero-04b",        ratio: 1440 / 1076, ringL: 0.465, ringR: 0.79,  ringT: 0.155, hz: 0.445 },
    tablet: { name: "hero-04b-tablet", ratio: 800 / 1076,  ringL: 0.21,  ringR: 0.79,  ringT: 0.155, hz: 0.445 },
    phone:  { name: "hero-04b-phone",  ratio: 612 / 1076,  ringL: 0.12,  ringR: 0.875, ringT: 0.155, hz: 0.445 }
  };
  function offsetIn(el, root) {
    var y = 0, x = 0, n = el;
    while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x, y: y };
  }
  function fitVideo() {
    var cards = hero4b.querySelector(".hero-v2b__cards");
    var nav = document.querySelector(".nav__inner");
    var W = hero4b.clientWidth, H = hero4b.clientHeight;
    if (!video4b || !cards || !nav || !W) return;
    // the file cut for this shape of hero: full on landscape screens, crops on tall ones
    var aspect = W / H;
    var g = aspect >= 1.1 ? R4B.full : aspect >= 0.6 ? R4B.tablet : R4B.phone;
    setRendition(video4b, g);
    var navBottom = nav.getBoundingClientRect().bottom - hero4b.getBoundingClientRect().top;
    var cardsTop = offsetIn(cards, hero4b).y;
    var horizon = cardsTop - (W < 760 ? 28 : 40);        // just above the cards
    var above = g.hz - g.ringT;                           // share of the height the ring takes above the horizon
    var hMax = (horizon - navBottom - 28) / above;        // largest size with the ring 28px under the nav
    var hFitRing = (W - 32) / ((g.ringR - g.ringL) * g.ratio);   // the whole ring across the screen
    var hCover = W / g.ratio;                             // exactly fills the width
    // Fill the width (smaller and centred if the ring would reach the nav). If the
    // video's top edge would then sit well below the nav, leaving a band of plain
    // page background (tall screens: tablets, phones), grow it until it reaches up
    // under the nav, as long as the ring stays about 48px clear of the nav and fits
    // across the screen; the sides are then cropped, never the ring.
    var h = Math.min(hMax, hCover);
    var videoTop = horizon - g.hz * h;
    if (videoTop > navBottom + 24) {
      var hFill = (horizon - navBottom * 0.5) / g.hz;               // top edge halfway up the nav
      var hRing = (horizon - navBottom - 48) / above;               // ring 48px under the nav
      h = Math.max(h, Math.min(hFill, hRing, hFitRing));
    }
    h = Math.max(160, h);
    var w = h * g.ratio;
    var left;
    if (w >= W) {
      // wider than the screen: centred, then nudged so both edges of the ring stay
      // 16px inside the screen, without ever showing past the video's own edges
      left = Math.min(Math.max((W - w) / 2, 16 - g.ringL * w), W - 16 - g.ringR * w);
      left = Math.max(W - w, Math.min(0, left));
    } else {
      left = (W - w) / 2;
    }
    video4b.style.width = Math.round(w) + "px";
    video4b.style.height = Math.round(h) + "px";
    video4b.style.left = Math.round(left) + "px";
    video4b.style.top = Math.round(horizon - h * g.hz) + "px";
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
