/* ==========================================================================
   Hero · Variation 3 — "Horizon"
   - Landscape: a height field of rolling hills (a valley in the middle,
     rising to both sides), sampled on a fixed world grid of square pixels
     and drawn in perspective along the bottom of the hero. The grid moves
     toward the camera, so it reads as flying forward over the hills.
   - Occlusion: rows are drawn from near to far against a per-column
     "skyline" buffer, so hills hide the pixels behind them.
   - Depth: far rows and columns thin out in two steps (with a fade, so nothing pops)
     and dissolve into the horizon. Slopes facing the camera are brighter,
     and one contour line glows, like the crest light in the reference.
   - Names: an invisible layer of static points covers the landscape. Each
     point holds one name, shown until the cursor moves to another point,
     so an idle cursor keeps its name while the landscape keeps moving.
   Colours are read from CSS variables (--horizon-*), so tab 03b reuses this
   hero in the light theme (data-hero="3 3b").
   Registers window.FrontierHeroMotion["3"] = { start, stop } (it runs for both tabs).
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.getElementById("hero-v3");
  var canvas = document.getElementById("horizon-3");
  var tooltip = document.getElementById("horizon-3-tooltip");
  if (!hero || !canvas || !tooltip) return;
  var ctx = canvas.getContext("2d");
  var tipName = tooltip.querySelector(".hero-tip__name");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Names ---------------- */

  var NAMES = ["vault", "gen", "burner", "anon", "satoshi", "degen", "swarm", "gold", "ledger", "pixel",
    "first", "family", "node", "open", "cold", "based", "rare", "ghost", "hodl", "mint", "prime",
    "north", "island", "fjord", "studio", "bridge", "oasis", "stack", "moon", "alpha", "yield", "seed",
    "dao", "orbit", "keys", "signal", "sats", "meta", "pure", "trust", "safe", "chain", "hyper", "lucky",
    "noble", "atlas", "echo", "zero", "frontier", "genesis", "vista", "summit", "harbor", "ember",
    "dune", "ridge", "valley", "mesa", "canyon", "horizon"];
  var TLDS = [".crypto", ".wealth", ".wallet", ".agent", ".btc", ".sol", ".nft", ".robot", ".human", ".hype", ".gate"];
  var FEATURED = ["vault.crypto", "gen.wealth", "burner.wallet", "anon.agent", "satoshi.btc", "swarm.robot"];
  function hash(n) {
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return (n ^ (n >>> 16)) >>> 0;
  }
  function pointName(i, j) {
    var h = hash((i + 1024) * 8192 + (j + 1024) + 130363);
    if (h % 7 === 0) return FEATURED[(h >>> 8) % FEATURED.length];
    return NAMES[(h >>> 3) % NAMES.length] + TLDS[(h >>> 13) % TLDS.length];
  }

  /* ---------------- Terrain ---------------- */

  var CAM_H = 1;             // camera height above the valley floor (world units)
  var Z_NEAR = 0.45, Z_FAR = 10;
  var LOD_1 = 3.2, LOD_2 = 6.4;   // beyond these, keep every 2nd / every 4th row and column
  var SPEED = reduceMotion ? 0 : 0.00028;   // world units per ms
  var CONTOUR = 0.62;        // height of the glowing contour line

  // valley in the middle rising to both sides, with hills everywhere on top
  // (including in the valley) and taller ranges toward the horizon
  function height(x, z) {
    var valley = 0.8 * (1 - Math.exp(-x * x * 0.11));
    var roll = 0.26 * Math.sin(0.36 * z + 0.7 * x + 1.3) * Math.cos(0.23 * z - 0.4 * x);
    var swell = 0.14 * Math.sin(0.17 * z - 0.26 * x + 0.6);
    var b = 0.5 + 0.5 * Math.sin(0.55 * z + 1.15 * x + 0.4);
    var hills = 0.34 * b * b * (0.65 + 0.35 * Math.sin(0.29 * z - 0.8 * x + 2.1));
    var r = 0.5 + 0.5 * Math.sin(0.13 * z + 0.42 * x - 0.9);
    var range = 0.5 * r * r * r * Math.min(1, Math.abs(x) * 0.25 + 0.35);
    var detail = 0.045 * Math.sin(1.1 * z - 1.4 * x) + 0.03 * Math.sin(1.9 * x + 0.7 * z);
    return Math.max(0, valley + roll + swell + hills + range + detail + 0.06);
  }

  /* ---------------- Layout ---------------- */

  var W = 0, H = 0, dpr = 1, horizon = 0, focal = 1, dx = 0.05, pitch = 24;
  var skyline = new Float32Array(0);   // topmost terrain y per screen column (for hover)
  var ybuf = new Float32Array(0);
  var avoid = [], stars = [];
  var travel = 0, sway = 0, lastT = 0, hover = null;

  function layoutRect(el, root) {
    var x = 0, y = 0, n = el;
    while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }

  // seeded random so the stars are the same on every load
  var seed = 20260924;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

  // Colours come from CSS variables, so the light tab (03b) can recolour the
  // shared hero; the defaults are the dark tab's (03) white-on-black.
  var pal = {};
  function readPalette() {
    var cs = getComputedStyle(hero);
    function v(name, def) { var x = cs.getPropertyValue(name).trim(); return x || def; }
    pal.pixel = v("--horizon-pixel", "255, 255, 255");
    pal.max = parseFloat(v("--horizon-max", "0.58"));
    pal.glow = v("--horizon-glow", "255, 255, 255");
    pal.glowA = v("--horizon-glow", "") ? 0.09 : 0.045;
    pal.star = v("--horizon-star", "255, 255, 255");
    pal.marker = v("--horizon-marker", "255, 255, 255");
  }

  function layout() {
    if (canvas.offsetWidth < 20) return false;
    readPalette();
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    var mobile = W < 760;
    // the horizon sits between the copy and the cards; the ground fills the rest
    var cards = hero.querySelector(".hero-v2b__cards");
    var cardsTop = cards ? layoutRect(cards, hero).y : H * 0.75;
    horizon = mobile ? Math.min(H * 0.55, cardsTop - 40) : Math.min(H * 0.6, cardsTop - 70);
    focal = (H - horizon) * 1.05 / CAM_H;
    dx = (mobile ? 18 : 22) / focal;        // near pixels ~22px apart
    pitch = mobile ? 20 : 24;
    skyline = new Float32Array(W);
    ybuf = new Float32Array(W);
    avoid = Array.prototype.map.call(hero.querySelectorAll("[data-globe-avoid]"), function (el) {
      var r = layoutRect(el, hero), pad = 16;
      return { x0: r.x - pad, y0: r.y - pad, x1: r.x + r.w + pad, y1: r.y + r.h + pad };
    });
    seed = 20260924;
    stars = [];
    for (var i = 0; i < Math.round(W / 14); i++) {
      stars.push({ x: rnd() * W, y: rnd() * horizon * 0.95, a: 0.12 + rnd() * 0.35, s: rnd() < 0.15 ? 2 : 1, tw: rnd() * 6.28, tws: 0.5 + rnd() * 1.5 });
    }
    return true;
  }

  function dimAt(x, y) {
    for (var i = 0; i < avoid.length; i++) {
      var a = avoid[i];
      if (x > a.x0 && x < a.x1 && y > a.y0 && y < a.y1) return 0.22;
    }
    return 1;
  }

  function smooth(a, b, v) { var t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); }

  /* ---------------- Draw ---------------- */

  var LEVELS = 12;
  var paths = [];
  var MAXN = 4096;
  var rowX = new Float32Array(MAXN), rowY = new Float32Array(MAXN), rowA = new Float32Array(MAXN), rowS = new Uint8Array(MAXN);

  function draw(now) {
    if (!W) return;
    var time = now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // stars above the horizon
    ctx.fillStyle = "rgb(" + pal.star + ")";
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      ctx.globalAlpha = st.a * (0.7 + 0.3 * Math.sin(time * st.tws + st.tw)) * dimAt(st.x, st.y);
      ctx.fillRect(Math.round(st.x), Math.round(st.y), st.s, st.s);
    }

    // faint glow along the horizon
    var g = ctx.createLinearGradient(0, horizon - 90, 0, horizon + 60);
    g.addColorStop(0, "rgba(" + pal.glow + ",0)");
    g.addColorStop(0.6, "rgba(" + pal.glow + "," + pal.glowA + ")");
    g.addColorStop(1, "rgba(" + pal.glow + ",0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon - 90, W, 150);

    for (var l = 0; l < LEVELS; l++) paths[l] = new Path2D();
    var i;
    for (i = 0; i < W; i++) ybuf[i] = H + 50;

    var cx = W / 2;
    var dz = dx;
    var r0 = Math.ceil((travel + Z_NEAR) / dz);
    for (var r = r0; ; r++) {
      var zw = r * dz;                   // world depth of this row (moves with the terrain)
      var z = zw - travel;               // distance from the camera
      if (z > Z_FAR) break;
      // level of detail: the step between kept rows/columns, and the one after the next boundary
      var step = z > LOD_2 ? 4 : z > LOD_1 ? 2 : 1;
      var edge = step === 1 ? LOD_1 : LOD_2;
      if (r % step) continue;
      var fog = 1 - smooth(Z_FAR * 0.45, Z_FAR, z);
      var near = smooth(Z_NEAR, Z_NEAR + 0.35, z);
      var lodFade = step === 4 ? 1 : 1 - smooth(edge * 0.8, edge, z);
      var rowGoes = step < 4 && r % (step * 2) !== 0;   // dropped at the next boundary
      var k = focal / z;
      var xmin = (-cx - 30) / k + sway, xmax = (W - cx + 30) / k + sway;
      var c0 = Math.floor(xmin / dx), c1 = Math.ceil(xmax / dx);
      var size = Math.max(1, Math.min(10, Math.round(8.5 / z)));
      var n = 0, hPrev = NaN;
      for (var c = c0; c <= c1 && n < MAXN; c++) {
        if (c % step) continue;
        var x = c * dx;
        var h = height(x, zw);
        var sx = cx + (x - sway) * k;
        var sy = horizon + (CAM_H - h) * k;
        // light: ground rising away from the viewer faces the camera and catches it,
        // plus a little side light from the left
        var hz = height(x, zw + dz);
        var slope = (hz - h) / dz;
        var slopeX = hPrev === hPrev ? (h - hPrev) / (dx * step) : 0;
        var shade = Math.min(1, Math.max(0, 0.35 + slope * 1.4 + slopeX * 0.35));
        var a = (0.2 + 0.8 * shade) * fog * near;
        if (rowGoes || (step < 4 && c % (step * 2) !== 0)) a *= lodFade;
        // the glowing contour: the height crosses CONTOUR between this point and its neighbour
        var d0 = h - CONTOUR;
        var onLine = z < Z_FAR * 0.7 && (d0 * (hz - CONTOUR) <= 0 || (hPrev === hPrev && d0 * (hPrev - CONTOUR) <= 0));
        rowX[n] = sx; rowY[n] = sy; rowA[n] = a; rowS[n] = onLine ? 1 : 0;
        hPrev = h;
        n++;
      }
      // draw the points that stick out above everything nearer
      for (i = 0; i < n; i++) {
        var px = rowX[i], py = rowY[i];
        if (px < -10 || px > W + 10 || py > H + 10) continue;
        var col = Math.max(0, Math.min(W - 1, Math.round(px)));
        if (py >= ybuf[col] - 0.5) continue;
        var sz = size, alpha = rowA[i];
        if (rowS[i]) { alpha = Math.min(1, 0.45 + alpha * 1.4); sz += 1; }
        alpha *= dimAt(px, py);
        var lv = Math.min(LEVELS - 1, Math.floor(alpha * LEVELS));
        if (lv <= 0) continue;
        paths[lv].rect(Math.round(px - sz / 2), Math.round(py - sz / 2), sz, sz);
      }
      // then this row becomes part of the skyline for the rows behind it
      for (i = 0; i + 1 < n; i++) {
        var xa = rowX[i], ya = rowY[i], xb = rowX[i + 1], yb = rowY[i + 1];
        var p0 = Math.max(0, Math.ceil(xa)), p1 = Math.min(W - 1, Math.floor(xb));
        for (var p = p0; p <= p1; p++) {
          var yy = ya + (yb - ya) * (p - xa) / (xb - xa);
          if (yy < ybuf[p]) ybuf[p] = yy;
        }
      }
    }
    for (i = 0; i < W; i++) skyline[i] = ybuf[i];

    // grey, never solid white: on the dark tab (03) the brightest pixels top out at about 56% white
    ctx.fillStyle = "rgb(" + pal.pixel + ")";
    for (l = 1; l < LEVELS; l++) {
      ctx.globalAlpha = (l + 0.5) / LEVELS * pal.max;
      ctx.fill(paths[l]);
    }
    ctx.globalAlpha = 1;

    if (hover) {
      var hx = Math.round(hover.x), hy = Math.round(hover.y);
      ctx.strokeStyle = "rgba(" + pal.marker + ",0.7)";
      ctx.lineWidth = 1;
      ctx.strokeRect(hx - 8.5, hy - 8.5, 17, 17);
      ctx.fillStyle = "rgb(" + pal.marker + ")";
      ctx.fillRect(hx - 2, hy - 2, 4, 4);
    }
  }

  /* ---------------- Hover: static points over the landscape ---------------- */

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

  function onMove(e) {
    if (e.target.closest && e.target.closest("a, button, [data-globe-avoid]")) return clearHover();
    var rc = canvas.getBoundingClientRect();
    var x = e.clientX - rc.left, y = e.clientY - rc.top;
    // keep the current point until the cursor is clearly nearer another one
    if (hover && Math.abs(x - hover.x) < pitch * 0.65 && Math.abs(y - hover.y) < pitch * 0.65) return;
    var ox = W / 2;
    var i = Math.round((x - ox) / pitch), j = Math.round((y - horizon) / pitch);
    var px = ox + i * pitch, py = horizon + j * pitch;
    var col = Math.max(0, Math.min(W - 1, Math.round(px)));
    if (px < 0 || px > W || py > H - 8 || py < skyline[col] + 4 || dimAt(px, py) < 1) return clearHover();
    if (hover && hover.i === i && hover.j === j) return;
    hover = { i: i, j: j, x: px, y: py };
    renderName(pointName(i, j));
    hero.classList.add("is-globe-hover");
    tooltip.classList.add("is-visible");
    var w = tooltip.offsetWidth, h = tooltip.offsetHeight;
    var tx = px + 14, ty = py - h - 14;
    if (tx + w > hero.clientWidth - 8) tx = px - w - 14;
    if (ty < 8) ty = py + 18;
    tooltip.style.setProperty("--tx", Math.round(tx) + "px");
    tooltip.style.setProperty("--ty", Math.round(ty) + "px");
    if (!running) draw(performance.now());
  }
  function clearHover() {
    if (hover) { hover = null; tooltip.classList.remove("is-visible"); }
    hero.classList.remove("is-globe-hover");
  }
  hero.addEventListener("pointermove", onMove);
  hero.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") onMove(e); });
  hero.addEventListener("pointerleave", clearHover);

  /* ---------------- Headline fitting (as in Variation 2b) ---------------- */

  var title = document.getElementById("hero-v3-title");
  var field = hero.querySelector(".hero-v2b__domain");
  var stack = hero.querySelector(".hero-v2b__stack");
  function fitTitle() {
    if (!title || !field || !stack || !stack.clientWidth) return;
    title.style.fontSize = "";
    var avail = stack.clientWidth;
    var natural = title.scrollWidth;
    if (natural > avail) {
      var base = parseFloat(getComputedStyle(title).fontSize);
      title.style.fontSize = Math.max(24, base * avail / natural).toFixed(2) + "px";
      natural = title.scrollWidth;
    }
    field.style.width = Math.min(natural, avail) + "px";
  }

  /* ---------------- Loop ---------------- */

  var running = false, rafId = 0;
  function frame(now) {
    if (!running) return;
    var dt = Math.min(64, now - (lastT || now));
    lastT = now;
    travel += SPEED * dt;
    sway = 0.35 * Math.sin(now / 9000);    // a slow drift left and right
    draw(now);
    rafId = requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    if (!layout()) return;
    if (reduceMotion) { draw(performance.now()); return; }
    running = true;
    lastT = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(rafId); }

  function relayout() {
    fitTitle();
    if (layout()) { clearHover(); draw(performance.now()); }
  }
  if ("ResizeObserver" in window) new ResizeObserver(relayout).observe(canvas);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  window.addEventListener("resize", relayout);

  var enabled = false, onScreen = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen && enabled) start(); else stop();
    }).observe(hero);
  }

  window.FrontierHeroMotion = window.FrontierHeroMotion || {};
  window.FrontierHeroMotion["3"] = {
    start: function () {
      enabled = true;
      requestAnimationFrame(function () { relayout(); if (onScreen) start(); });
    },
    stop: function () { enabled = false; stop(); clearHover(); }
  };
})();
