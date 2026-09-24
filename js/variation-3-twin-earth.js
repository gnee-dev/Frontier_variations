/* ==========================================================================
   Hero · Variation 3 — twin earth
   - One earth, split down the middle. The left half is drawn "for real":
     continents and ocean shaded from a light on the left, a blue
     atmosphere on the lit rim, faint cloud wisps. It's rendered once
     (static, no rotation) into an offscreen canvas.
   - The right half is its digital twin: the same continents as small,
     dense square pixels in a soft cream, at a few opacity levels. Pixels
     blink gently and at random to give it some life.
   - Each pixel is a name. Hovering a pixel shows its name and keeps it
     until the cursor moves to another pixel.
   Registers window.FrontierHeroMotion["3"] = { start, stop }.
   ========================================================================== */
(function () {
  "use strict";

  if (!window.d3 || !window.topojson || !window.FRONTIER_WORLD_TOPO) return;

  var hero = document.getElementById("hero-v3");
  var canvas = document.getElementById("twin-earth");
  var tooltip = document.getElementById("twin-earth-tooltip");
  if (!hero || !canvas || !tooltip) return;

  var box = canvas.parentElement;
  var tipName = tooltip.querySelector(".hero-tip__name");
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DEG = Math.PI / 180;

  /* ---------------- Land mask (equirectangular raster) ---------------- */

  var MASK_W = 2048, MASK_H = 1024;
  var mask = (function () {
    var topo = window.FRONTIER_WORLD_TOPO;
    var land = topojson.feature(topo, topo.objects.countries);
    var off = document.createElement("canvas");
    off.width = MASK_W;
    off.height = MASK_H;
    var octx = off.getContext("2d");
    var proj = d3.geoEquirectangular().scale(MASK_W / (2 * Math.PI)).translate([MASK_W / 2, MASK_H / 2]);
    octx.fillStyle = "#fff";
    octx.beginPath();
    d3.geoPath(proj, octx)(land);
    octx.fill();
    var img = octx.getImageData(0, 0, MASK_W, MASK_H).data;
    var out = new Uint8Array(MASK_W * MASK_H);
    for (var i = 0; i < out.length; i++) out[i] = img[i * 4];
    return out;
  })();
  function landAt(lat, lon) {
    var x = ((lon + 180) / 360) * MASK_W;
    var y = ((90 - lat) / 180) * MASK_H;
    x = ((x % MASK_W) + MASK_W) % MASK_W;
    y = Math.min(MASK_H - 1, Math.max(0, y));
    return mask[(y | 0) * MASK_W + (x | 0)] / 255;
  }

  /* ---------------- Noise (terrain + clouds) ---------------- */

  function hash2(x, y) {
    var n = (x * 374761393 + y * 668265263) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) {
    return 0.55 * vnoise(x, y) + 0.3 * vnoise(x * 2.1, y * 2.1) + 0.15 * vnoise(x * 4.3, y * 4.3);
  }

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
  function rand(n) { return hash(n) / 4294967296; }
  function nameFor(id) {
    var h = hash(id + 104729);
    if (h % 7 === 0) return FEATURED[(h >>> 8) % FEATURED.length];
    return NAMES[(h >>> 3) % NAMES.length] + TLDS[(h >>> 13) % TLDS.length];
  }

  /* ---------------- View ---------------- */

  var LAM0 = 48 * DEG;   // longitude at the centre: Africa/Europe on the real half, Asia on the pixel half
  var PHI0 = 12 * DEG;   // tilt
  var sinP = Math.sin(PHI0), cosP = Math.cos(PHI0);
  // light from the left and a little in front; the real half fades into night toward the split
  var L = [-0.93, 0.22, 0.3];
  (function () { var n = Math.hypot(L[0], L[1], L[2]); L = [L[0] / n, L[1] / n, L[2] / n]; })();

  function inverse(u, v) {
    var rr = u * u + v * v;
    if (rr > 1) return null;
    var z = Math.sqrt(1 - rr);
    return {
      z: z,
      lat: Math.asin(z * sinP + v * cosP) / DEG,
      lon: (LAM0 + Math.atan2(u, z * cosP - v * sinP)) / DEG
    };
  }

  var S = 0, dpr = 1, R = 0, C = 0;
  var realHalf = null;       // offscreen canvas with the rendered real half
  var pixels = [];           // { x, y, a, blinkP, blinkPh, id }
  var cell = 7;

  function renderReal() {
    var W = Math.round(S * dpr);
    var off = document.createElement("canvas");
    off.width = W;
    off.height = W;
    var octx = off.getContext("2d");
    var img = octx.createImageData(W, W);
    var d = img.data;
    var r = R * dpr, c = C * dpr;
    for (var py = 0; py < W; py++) {
      var v = (c - py - 0.5) / r;
      for (var px = 0; px < Math.ceil(c); px++) {
        var u = (px + 0.5 - c) / r;
        var p = inverse(u, v);
        if (!p) continue;
        var land = landAt(p.lat, p.lon);
        var lambert = Math.max(0, u * L[0] + v * L[1] + p.z * L[2]);
        var lit = Math.pow(lambert, 0.9);
        var t = fbm(p.lon * 0.09, p.lat * 0.09);
        var R_, G_, B_;
        if (land > 0.5) {
          // earthy land: dark olive to dusty brown
          // drier toward the subtropics, blended smoothly with latitude (no hard band)
          var belt = 0.3 * Math.exp(-Math.pow((Math.abs(p.lat) - 22) / 12, 2)) - 0.08;
          var dry = Math.min(1, Math.max(0, (t - 0.38) * 1.7 + belt));
          R_ = 40 + 56 * dry; G_ = 44 + 32 * dry; B_ = 30 + 16 * dry;
          var polar = Math.max(0, (Math.abs(p.lat) - 62) / 18);
          R_ += (200 - R_) * polar; G_ += (205 - G_) * polar; B_ += (210 - B_) * polar;
        } else {
          R_ = 6 + 6 * t; G_ = 16 + 9 * t; B_ = 26 + 12 * t;     // deep ocean
        }
        // faint cloud wisps
        var cl = Math.max(0, fbm(p.lon * 0.05 + 11, p.lat * 0.12 + 3) - 0.56) * 2.6;
        R_ += (215 - R_) * cl * 0.32; G_ += (218 - G_) * cl * 0.32; B_ += (224 - B_) * cl * 0.32;
        var shade = 0.02 + 0.8 * Math.pow(lit, 1.35);   // moody: deep shadow toward the split
        R_ *= shade; G_ *= shade; B_ *= shade;
        // atmosphere on the lit rim
        var rim = Math.pow(1 - p.z, 2.4) * (0.2 + 0.8 * lit);
        R_ += 50 * rim; G_ += 92 * rim; B_ += 140 * rim;
        var i = (py * W + px) * 4;
        // soft edge
        var edge = Math.min(1, (1 - Math.sqrt(u * u + v * v)) * r);
        d[i] = R_; d[i + 1] = G_; d[i + 2] = B_; d[i + 3] = 255 * Math.max(0, edge);
      }
    }
    octx.putImageData(img, 0, 0);
    return off;
  }

  function buildPixels() {
    pixels = [];
    var gap = 3;                                   // gap between the halves
    var cols = Math.floor((R - gap) / cell);
    var rows = Math.floor((2 * R) / cell);
    var top = C - rows * cell / 2;
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var x = C + gap + col * cell + cell / 2;
        var y = top + row * cell + cell / 2;
        var u = (x - C) / R, v = (C - y) / R;
        var p = inverse(u, v);
        if (!p || u * u + v * v > 0.985) continue;
        var land = landAt(p.lat, p.lon) > 0.5;
        var id = row * 1000 + col;
        var r = rand(id + 5);
        // land: dense and bright; ocean: sparse and faint
        if (land ? r > 0.9 : r > 0.22) continue;
        var level = rand(id + 9);
        var a = land ? (level < 0.5 ? 0.9 : level < 0.8 ? 0.6 : 0.35) : (level < 0.5 ? 0.22 : 0.12);
        pixels.push({ x: x, y: y, a: a, id: id, blinkP: 5 + 9 * rand(id + 13), blinkPh: rand(id + 17), col: col, row: row });
      }
    }
  }

  function layout() {
    var rect = box.getBoundingClientRect();
    if (rect.width < 20) return false;
    var size = Math.round(rect.width);
    if (size === S && realHalf) return true;
    S = size;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    R = S / 2 - 2;
    C = S / 2;
    cell = S < 420 ? 6 : 7;
    realHalf = renderReal();
    buildPixels();
    return true;
  }

  /* ---------------- Draw ---------------- */

  var hover = null;
  var startT = performance.now();

  function draw(now) {
    if (!S) return;
    var time = reduceMotion ? 0 : (now - startT) / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(realHalf, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var size = cell - 2;
    ctx.fillStyle = "#ece6dc";
    for (var i = 0; i < pixels.length; i++) {
      var p = pixels[i];
      // gentle random blink: once per cycle a pixel dips and recovers over ~0.9s
      var ph = (time / p.blinkP + p.blinkPh) % 1;
      var w = ph < 0.09 ? Math.sin(ph / 0.09 * Math.PI) : 0;
      ctx.globalAlpha = p.a * (1 - 0.6 * w);
      ctx.fillRect(Math.round(p.x - size / 2), Math.round(p.y - size / 2), size, size);
    }
    ctx.globalAlpha = 1;

    if (hover) {
      ctx.strokeStyle = "rgba(236, 230, 220, 0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(hover.x - cell) + 0.5, Math.round(hover.y - cell) + 0.5, cell * 2, cell * 2);
      ctx.fillRect(Math.round(hover.x - size / 2), Math.round(hover.y - size / 2), size, size);
    }
  }

  /* ---------------- Hover (one name per pixel) ---------------- */

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

  function nearestPixel(x, y) {
    var best = null, bd = cell * cell * 1.2;
    for (var i = 0; i < pixels.length; i++) {
      var p = pixels[i], dx = p.x - x, dy = p.y - y, dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = p; }
    }
    return best;
  }

  function onMove(e) {
    var r = box.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    // keep the current pixel until the cursor is clearly nearer another one
    if (hover && Math.abs(x - hover.x) < cell * 0.8 && Math.abs(y - hover.y) < cell * 0.8) return;
    var p = x > C ? nearestPixel(x, y) : null;
    if (!p) return clearHover();
    if (hover === p) return;
    hover = p;
    renderName(nameFor(p.id));
    hero.classList.add("is-globe-hover");
    tooltip.classList.add("is-visible");
    var w = tooltip.offsetWidth, h = tooltip.offsetHeight;
    var tx = p.x + 14, ty = p.y - h - 14;
    if (tx + w > S + 120) tx = p.x - w - 14;
    if (ty < -40) ty = p.y + 18;
    tooltip.style.setProperty("--tx", Math.round(tx) + "px");
    tooltip.style.setProperty("--ty", Math.round(ty) + "px");
    if (!running) draw(performance.now());
  }
  function clearHover() {
    if (hover) { hover = null; tooltip.classList.remove("is-visible"); }
    hero.classList.remove("is-globe-hover");
    if (!running) draw(performance.now());
  }
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") onMove(e); });
  canvas.addEventListener("pointerleave", clearHover);

  /* ---------------- Loop ---------------- */

  var running = false, rafId = 0;
  function frame(now) {
    if (!running) return;
    draw(now);
    rafId = requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    if (!layout()) return;
    if (reduceMotion) { draw(performance.now()); return; }
    running = true;
    rafId = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(rafId); }

  function relayout() { if (layout()) draw(performance.now()); }
  var resizeTimer = 0;
  if ("ResizeObserver" in window) {
    new ResizeObserver(function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(relayout, 120); }).observe(box);
  }

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
