/* ==========================================================================
   Hero · Variation 2 — dissolve ring
   - A thick ring of small square orange pixels, curling over the
     bottom-right corner. The pixel pattern lives in the ring's own polar
     coordinates, so the whole ring rotates; it is sampled on a fixed
     screen grid, so it always stays crisp pixels.
   - The ring "dissolves": dense along the inner band, thinning toward the
     outer edge and toward the lower tail (that envelope stays put while
     the pattern flows through it). Some pixels are lighter "shade" tones,
     and each pixel slowly drops out and returns, so the ring shimmers.
   - Pixels under the copy and cards are dimmed so text stays readable.
   - Names: an invisible layer of static points covers the ring band. Each
     point holds one name, shown until the cursor moves to another point,
     so an idle cursor keeps its name while the ring keeps turning.
   Registers window.FrontierHeroMotion["2"] = { start, stop }.
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.getElementById("hero-v2");
  var canvas = document.getElementById("dissolve-ring");
  var tooltip = document.getElementById("dissolve-ring-tooltip");
  if (!hero || !canvas || !tooltip) return;

  var tipName = tooltip.querySelector(".hero-tip__name");
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Names ---------------- */

  var NAMES = ["vault", "gen", "burner", "anon", "satoshi", "degen", "swarm", "gold", "ledger", "pixel",
    "first", "family", "node", "open", "cold", "based", "rare", "ghost", "hodl", "mint", "prime",
    "north", "island", "fjord", "studio", "bridge", "oasis", "stack", "moon", "alpha", "yield", "seed",
    "dao", "orbit", "keys", "signal", "sats", "meta", "pure", "trust", "safe", "chain", "hyper", "lucky",
    "noble", "atlas", "echo", "zero", "frontier", "genesis", "vista", "summit", "harbor", "ember"];
  var TLDS = [".crypto", ".wealth", ".wallet", ".agent", ".btc", ".sol", ".nft", ".robot", ".human", ".hype", ".gate"];
  var FEATURED = ["vault.crypto", "gen.wealth", "burner.wallet", "anon.agent", "satoshi.btc", "swarm.robot"];

  function hash(n) {
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return (n ^ (n >>> 16)) >>> 0;
  }
  function rand(n) { return hash(n) / 4294967296; } // 0..1
  function pointName(i, j) {
    var h = hash((i + 1024) * 8192 + (j + 1024) + 104729);
    if (h % 7 === 0) return FEATURED[(h >>> 8) % FEATURED.length];
    return NAMES[(h >>> 3) % NAMES.length] + TLDS[(h >>> 13) % TLDS.length];
  }

  /* ---------------- Layout ---------------- */

  var W = 0, H = 0, dpr = 1;
  var cell = 9;             // pixel grid pitch in CSS px
  var pitch = 20;           // spacing of the static hover points in CSS px
  var cx = 0, cy = 0;       // ring centre (just outside the bottom-right corner)
  var rIn = 0, rOut = 0;    // inner / outer radius of the band
  var avoid = [];
  var color = "#e96e26";

  function layout() {
    var rect = hero.getBoundingClientRect();
    if (rect.width < 20) return false;
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    var mobile = W < 760;
    cell = mobile ? 7 : W < 1200 ? 8 : 9;
    pitch = mobile ? 18 : 20;
    // Centre just past the right edge and a little above the bottom, so the
    // ring's hollow and curve show above the card row (like the reference)
    rOut = mobile ? W * 0.8 : Math.min(W * 0.4, 620);
    rIn = rOut * 0.66;
    cx = W - rOut * (mobile ? 0.02 : 0.08);
    cy = H - (mobile ? rOut * 0.05 : rOut * 0.12);

    color = getComputedStyle(document.body).getPropertyValue("--c-ring").trim() || "#e96e26";

    var hr = rect;
    avoid = Array.prototype.map.call(hero.querySelectorAll("[data-globe-avoid]"), function (el) {
      var r = el.getBoundingClientRect();
      var pad = 16;
      return { x0: r.left - hr.left - pad, y0: r.top - hr.top - pad, x1: r.right - hr.left + pad, y1: r.bottom - hr.top + pad };
    });
    return true;
  }

  function dimAt(x, y) {
    for (var i = 0; i < avoid.length; i++) {
      var a = avoid[i];
      if (x > a.x0 && x < a.x1 && y > a.y0 && y < a.y1) return 0.22;
    }
    return 1;
  }

  /* ---------------- Density field ---------------- */

  function smooth(a, b, x) { var k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); }

  // t: 0 at the inner edge, 1 at the outer edge. s: 0 at the lower tail, 1 at the top.
  // A dense band with defined edges that thins out toward the outer edge and
  // toward the lower tail of the arc (the "dissolve"). Screen-fixed envelope.
  function density(t, s, time) {
    var drift = 0.035 * Math.sin(s * 8 + time * 0.35);           // edges gently breathe
    var band = smooth(-0.05, 0.06, t + drift) * (1 - smooth(0.72, 1.12, t - drift));
    var body = 0.66 + 0.3 * (1 - Math.min(1, Math.max(0, t)));   // denser toward the inner edge
    var tail = 0.3 + 0.7 * smooth(0.04, 0.7, s);                 // dissolves toward the tail
    return Math.min(0.94, band * body * tail);
  }

  /* ---------------- Rendering ---------------- */

  var hover = null;   // { i, j, x, y }
  var pointer = null;
  var rot = 0;        // ring rotation in radians
  var ROT_SPEED = reduceMotion ? 0 : 0.00005; // rad per ms (~3° a second)
  var startT = performance.now();
  var lastT = 0;
  var TWO_PI = Math.PI * 2;

  // Tones: most pixels are full orange, some are lighter "shade" pixels
  function toneFor(r) { return r < 0.64 ? 0 : r < 0.86 ? 1 : 2; }
  var TONE_ALPHA = [0.95, 0.5, 0.24];

  var buckets = [[], [], [], [], [], []]; // tone × (normal, dimmed)

  function draw(now) {
    if (!W) return;
    var time = reduceMotion ? 0 : (now - startT) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (var k = 0; k < buckets.length; k++) buckets[k].length = 0;

    var size = Math.max(3, Math.round(cell * 0.7));
    var off = Math.round((cell - size) / 2);
    var rBase = rIn * 0.9;
    var reach = rOut * 1.15;
    var rowMin = Math.max(0, Math.floor((cy - reach) / cell));
    var rowMax = Math.ceil(H / cell);

    for (var row = rowMin; row < rowMax; row++) {
      var y = (row + 0.5) * cell;
      var dy = y - cy;
      if (Math.abs(dy) > reach) continue;
      var half = Math.sqrt(reach * reach - dy * dy);
      var colMin = Math.max(0, Math.floor((cx - half) / cell));
      var colMax = Math.min(Math.ceil(W / cell), Math.ceil((cx + half) / cell));
      for (var col = colMin; col < colMax; col++) {
        var x = (col + 0.5) * cell;
        var dx = x - cx;
        var r = Math.sqrt(dx * dx + dy * dy);
        var t = (r - rIn) / (rOut - rIn);
        if (t < -0.1 || t > 1.2) continue;
        var ang = Math.atan2(dy, dx);
        var s = (ang + Math.PI) / (Math.PI / 2);
        var d = density(t, s, time);
        if (d < 0.01) continue;

        // ring-space cell: radial bin + angular bin that rotates with the ring
        var rb = Math.floor((r - rBase) / cell);
        var rMid = rBase + (rb + 0.5) * cell;
        var nb = Math.max(8, Math.floor(TWO_PI * rMid / cell));
        var phi = ((ang - rot) % TWO_PI + TWO_PI) % TWO_PI;
        var ab = Math.floor(phi / TWO_PI * nb);
        var id = (rb + 64) * 65536 + ab;

        // each ring pixel slowly drops out and returns (2.5s–6.5s clock)
        var period = 2.5 + 4 * rand(id + 11);
        var epoch = Math.floor(time / period + rand(id + 23));
        if (rand(id * 31 + epoch) > d) continue;

        var tone = toneFor(rand(id + 71));
        var dim = dimAt(x, y) < 1 ? 1 : 0;
        buckets[tone * 2 + dim].push(col * cell + off, row * cell + off);
      }
    }

    ctx.fillStyle = color;
    for (var b = 0; b < buckets.length; b++) {
      var list = buckets[b];
      if (!list.length) continue;
      var tone = b >> 1, dimmed = b & 1;
      ctx.globalAlpha = TONE_ALPHA[tone] * (dimmed ? 0.24 : 1);
      for (var i = 0; i < list.length; i += 2) ctx.fillRect(list[i], list[i + 1], size, size);
    }
    ctx.globalAlpha = 1;

    // Hovered static point: a small marker that stays put while the ring turns
    if (hover) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(Math.round(hover.x) - 8.5, Math.round(hover.y) - 8.5, 17, 17);
      ctx.fillRect(Math.round(hover.x) - 3, Math.round(hover.y) - 3, 6, 6);
    }
  }

  /* ---------------- Hover: static points over the ring band ---------------- */

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

  // Snap the cursor to the nearest static point. The name only changes when
  // the cursor reaches a different point, so an idle cursor keeps its name.
  function updateHover() {
    if (!pointer) return clearHover();
    if (hover && Math.abs(pointer.x - hover.x) < pitch * 0.65 && Math.abs(pointer.y - hover.y) < pitch * 0.65) return;
    var i = Math.round((pointer.x - cx) / pitch);
    var j = Math.round((pointer.y - cy) / pitch);
    var x = cx + i * pitch;
    var y = cy + j * pitch;
    var r = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
    var t = (r - rIn) / (rOut - rIn);
    if (t < -0.04 || t > 1.05 || x < 0 || x > W || y > H || dimAt(x, y) < 1) return clearHover();
    if (hover && hover.i === i && hover.j === j) return;
    hover = { i: i, j: j, x: x, y: y };
    renderName(pointName(i, j));
    hero.classList.add("is-globe-hover");
    tooltip.classList.add("is-visible");
    placeTooltip(x, y);
    if (!running) draw(performance.now());
  }

  function clearHover() {
    if (hover) { hover = null; tooltip.classList.remove("is-visible"); }
    hero.classList.remove("is-globe-hover");
  }

  function placeTooltip(px, py) {
    var w = tooltip.offsetWidth;
    var h = tooltip.offsetHeight;
    var x = px + 16;
    var y = py - h - 16;
    if (x + w > W - 8) x = px - w - 16;
    if (y < 8) y = py + 20;
    tooltip.style.setProperty("--tx", Math.round(x) + "px");
    tooltip.style.setProperty("--ty", Math.round(y) + "px");
  }

  hero.addEventListener("pointermove", function (e) {
    if (e.target.closest("[data-globe-avoid], a, button")) { pointer = null; clearHover(); return; }
    var r = hero.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    updateHover();
  });
  hero.addEventListener("pointerleave", function () { pointer = null; clearHover(); });
  hero.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "touch" || e.target.closest("[data-globe-avoid], a, button")) return;
    var r = hero.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    updateHover();
  });

  /* ---------------- Loop ---------------- */

  var running = false;
  var rafId = 0;

  function frame(now) {
    if (!running) return;
    var dt = Math.min(64, now - (lastT || now));
    lastT = now;
    rot += ROT_SPEED * dt;
    draw(now);
    rafId = requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    if (!W && !layout()) return;
    if (reduceMotion) { draw(performance.now()); return; }
    running = true;
    lastT = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  /* ---------------- Boot ---------------- */

  function relayout() { if (layout()) { clearHover(); draw(performance.now()); } }
  if ("ResizeObserver" in window) new ResizeObserver(relayout).observe(hero);
  window.addEventListener("resize", relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  var enabled = false;
  var onScreen = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen && enabled) start();
      else stop();
    }).observe(hero);
  }

  window.FrontierHeroMotion = window.FrontierHeroMotion || {};
  window.FrontierHeroMotion["2"] = {
    start: function () {
      enabled = true;
      // hero was hidden until now: measure once visible, again after the entrance settles
      requestAnimationFrame(function () { relayout(); if (onScreen) start(); });
      setTimeout(relayout, 1200);
    },
    stop: function () { enabled = false; stop(); clearHover(); }
  };
})();
