/* ==========================================================================
   Hero · Variation 2 — dissolve ring
   - A thick ring of square orange pixels on a fixed screen grid, centred
     just inside the right edge near the bottom, so its upper-left quarter
     (and the hollow inside it) curls over the bottom-right corner.
   - The ring "dissolves": pixels are dense along the inner band and thin
     out toward the outer edge and toward the lower tail of the arc. Each
     pixel re-rolls on its own slow clock, so the ring shimmers as pixels
     drop out and reappear, and the dense band gently drifts.
   - Pixels under the copy and cards are dimmed so text stays readable.
   - Every grid cell in the ring band holds one name. Hovering a cell shows
     its name until the cursor moves to another cell.
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
  function cellId(col, row) { return (col + 1024) * 8192 + (row + 1024); }
  function cellName(col, row) {
    var h = hash(cellId(col, row) + 104729);
    if (h % 7 === 0) return FEATURED[(h >>> 8) % FEATURED.length];
    return NAMES[(h >>> 3) % NAMES.length] + TLDS[(h >>> 13) % TLDS.length];
  }

  /* ---------------- Layout ---------------- */

  var W = 0, H = 0, dpr = 1;
  var cell = 16;            // grid pitch in CSS px
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
    cell = mobile ? 10 : W < 1200 ? 12 : 13;
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
  // A band with defined edges, a little denser on the inside, that thins out and
  // scatters toward the lower tail of the arc (the "dissolve").
  function density(t, s, time) {
    var drift = 0.04 * Math.sin(s * 8 + time * 0.35);            // edges gently breathe
    var band = smooth(-0.06, 0.08, t + drift) * (1 - smooth(0.78, 1.12, t - drift));
    var body = 0.5 + 0.3 * (1 - Math.min(1, Math.max(0, t)));    // denser toward the inner edge
    var tail = 0.25 + 0.75 * smooth(0.05, 0.75, s);              // dissolves toward the tail
    return Math.min(0.92, band * body * tail);
  }

  function cellInfo(col, row) {
    var x = (col + 0.5) * cell;
    var y = (row + 0.5) * cell;
    var dx = x - cx, dy = y - cy;
    var r = Math.sqrt(dx * dx + dy * dy);
    var t = (r - rIn) / (rOut - rIn);
    if (t < -0.15 || t > 1.3) return null;
    // angle: -PI (pointing left, lower tail) .. -PI/2 (pointing up, top of arc)
    var ang = Math.atan2(dy, dx);
    var s = (ang + Math.PI) / (Math.PI / 2);
    return { x: x, y: y, t: t, s: s };
  }

  /* ---------------- Rendering ---------------- */

  var hover = null;
  var pointer = null;
  var startT = performance.now();

  function draw(now) {
    if (!W) return;
    var time = reduceMotion ? 0 : (now - startT) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = color;

    var size = Math.round(cell * 0.72);
    var off = (cell - size) / 2;
    var rowMin = Math.max(0, Math.floor((cy - rOut * 1.3) / cell));
    var rowMax = Math.ceil(H / cell);
    var colMin = Math.max(0, Math.floor((cx - rOut * 1.3) / cell));
    var colMax = Math.ceil(W / cell);

    for (var row = rowMin; row < rowMax; row++) {
      for (var col = colMin; col < colMax; col++) {
        var c = cellInfo(col, row);
        if (!c) continue;
        var d = density(c.t, c.s, time);
        if (d < 0.01) continue;
        var id = cellId(col, row);
        // each pixel re-rolls on its own clock (1.2s–3.2s), offset by a random phase
        var period = 1.2 + 2 * rand(id + 11);
        var epoch = Math.floor(time / period + rand(id + 23));
        if (rand(id * 31 + epoch) > d) continue;
        var a = dimAt(c.x, c.y);
        ctx.globalAlpha = a < 1 ? 0.22 : 0.92;
        // a few pixels stretch into short bars, like the reference
        var wide = rand(id + 57) < 0.08 ? cell : 0;
        ctx.fillRect(Math.round(col * cell + off), Math.round(row * cell + off), size + wide, size);
      }
    }
    ctx.globalAlpha = 1;

    if (hover) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hover.col * cell - 2.5, hover.row * cell - 2.5, cell + 5, cell + 5);
      ctx.fillRect(Math.round(hover.col * cell + off), Math.round(hover.row * cell + off), size, size);
    }
  }

  /* ---------------- Hover (one name per ring cell) ---------------- */

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

  function updateHover() {
    if (!pointer) return clearHover();
    // stick to the current cell until the cursor is clearly in another one
    if (hover && Math.abs(pointer.x - (hover.col + 0.5) * cell) < cell * 0.75 &&
        Math.abs(pointer.y - (hover.row + 0.5) * cell) < cell * 0.75) return;
    var col = Math.floor(pointer.x / cell);
    var row = Math.floor(pointer.y / cell);
    var c = cellInfo(col, row);
    if (!c || c.t < -0.05 || c.t > 1.1 || dimAt(c.x, c.y) < 1) return clearHover();
    hover = { col: col, row: row };
    renderName(cellName(col, row));
    hero.classList.add("is-globe-hover");
    tooltip.classList.add("is-visible");
    placeTooltip(c.x, c.y);
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
    draw(now);
    rafId = requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    if (!W && !layout()) return;
    if (reduceMotion) { draw(performance.now()); return; }
    running = true;
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
