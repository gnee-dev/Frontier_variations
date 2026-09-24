/* ==========================================================================
   Hero · Variation 1 — pixel globe
   - The earth is drawn on a fixed screen grid of square pixels (an
     "LED wall" look). Every grid cell samples the rotating globe:
     land pixels are softly lit, ocean pixels faint, borders show as seams.
   - The globe sits behind the hero copy and cards. Pixels under those
     elements are dimmed so text and buttons stay readable.
   - On top sits an invisible layer of static points covering exactly the
     globe disc. Each point holds one name. Hovering a point shows its
     name until the cursor moves to another point; the globe keeps
     rotating underneath.
   Registers window.FrontierHeroMotion["1"] = { start, stop }.
   ========================================================================== */
(function () {
  "use strict";

  if (!window.d3 || !window.topojson || !window.FRONTIER_WORLD_TOPO) return;

  var hero = document.getElementById("hero-v1");
  var canvas = document.getElementById("pixel-globe");
  var tooltip = document.getElementById("pixel-globe-tooltip");
  if (!hero || !canvas || !tooltip) return;

  var tipName = tooltip.querySelector(".hero-tip__name");
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DEG = Math.PI / 180;

  /* ---------------- Land mask (equirectangular raster) ---------------- */

  var MASK_W = 1440;
  var MASK_H = 720;
  var mask = (function () {
    var topo = window.FRONTIER_WORLD_TOPO;
    var land = topojson.feature(topo, topo.objects.countries);
    var borders = topojson.mesh(topo, topo.objects.countries, function (a, b) { return a !== b; });
    var off = document.createElement("canvas");
    off.width = MASK_W;
    off.height = MASK_H;
    var octx = off.getContext("2d");
    var proj = d3.geoEquirectangular().scale(MASK_W / (2 * Math.PI)).translate([MASK_W / 2, MASK_H / 2]);
    var p = d3.geoPath(proj, octx);
    octx.fillStyle = "#fff";
    octx.beginPath();
    p(land);
    octx.fill();
    octx.strokeStyle = "rgb(90,90,90)";
    octx.lineWidth = 2.2;
    octx.beginPath();
    p(borders);
    octx.stroke();
    var img = octx.getImageData(0, 0, MASK_W, MASK_H).data;
    var out = new Uint8Array(MASK_W * MASK_H);
    for (var i = 0; i < out.length; i++) out[i] = img[i * 4];
    return out;
  })();

  function sample(lat, lon) {
    var x = ((lon + 180) / 360) * MASK_W;
    var y = ((90 - lat) / 180) * MASK_H;
    x = ((x % MASK_W) + MASK_W) % MASK_W;
    y = Math.min(MASK_H - 1, Math.max(0, y));
    return mask[(y | 0) * MASK_W + (x | 0)];
  }

  /* ---------------- Names for the static hover points ---------------- */

  var NAMES = ["vault", "gen", "burner", "anon", "satoshi", "degen", "swarm", "gold", "ledger", "pixel",
    "first", "family", "node", "open", "cold", "based", "rare", "ghost", "hodl", "mint", "prime",
    "north", "island", "fjord", "studio", "bridge", "oasis", "stack", "moon", "alpha", "yield", "seed",
    "dao", "orbit", "keys", "signal", "sats", "meta", "pure", "trust", "safe", "chain", "hyper", "lucky",
    "noble", "atlas", "echo", "zero", "frontier", "genesis", "vista", "summit", "harbor", "ember"];
  var TLDS = [".crypto", ".wealth", ".wallet", ".agent", ".btc", ".sol", ".nft", ".robot", ".human", ".hype", ".gate"];
  // The names from the brief turn up more often than the generated ones
  var FEATURED = ["vault.crypto", "gen.wealth", "burner.wallet", "anon.agent", "satoshi.btc", "swarm.robot"];

  function hash(n) {
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return (n ^ (n >>> 16)) >>> 0;
  }
  // i, j: integer position of the static point relative to the globe centre
  function pointName(i, j) {
    var h = hash((i + 512) * 4096 + (j + 512) + 7919);
    if (h % 7 === 0) return FEATURED[(h >>> 8) % FEATURED.length];
    return NAMES[(h >>> 3) % NAMES.length] + TLDS[(h >>> 13) % TLDS.length];
  }

  /* ---------------- Layout ---------------- */

  var W = 0, H = 0, dpr = 1;
  var cell = 10;          // pixel grid pitch in CSS px
  var pitch = 28;         // spacing of the static hover points in CSS px
  var R = 600;            // globe radius in CSS px
  var cx = 0, cy = 0;     // globe centre in CSS px
  var avoid = [];         // rects (CSS px, canvas space) where pixels are dimmed
  var lam = 12;           // longitude at the centre of the disc
  var PHI = 12 * DEG;     // latitude at the centre of the disc (tilt)
  var sinPhi = Math.sin(PHI), cosPhi = Math.cos(PHI);

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
    pitch = mobile ? 24 : 28;
    R = mobile ? W * 0.72 : Math.min(W * 0.4, 660);
    cx = W * 0.5;
    // Show roughly the top 60% of the globe (both edges visible), rising behind the cards
    cy = H - R * (mobile ? 0.1 : 0.22);

    var hr = rect;
    avoid = Array.prototype.map.call(hero.querySelectorAll("[data-globe-avoid]"), function (el) {
      var r = el.getBoundingClientRect();
      var pad = 18;
      return { x0: r.left - hr.left - pad, y0: r.top - hr.top - pad, x1: r.right - hr.left + pad, y1: r.bottom - hr.top + pad };
    });
    return true;
  }

  /* ---------------- Rendering ---------------- */

  var LEVELS = 16;
  var buckets = [];
  for (var b = 0; b < LEVELS; b++) buckets.push([]);
  var hover = null; // { col, row, lat, lon, name }
  var pointer = null;

  // Light from upper-left, slightly in front
  var Lx = -0.45, Ly = 0.55, Lz = 0.7;
  var Ln = Math.sqrt(Lx * Lx + Ly * Ly + Lz * Lz);
  Lx /= Ln; Ly /= Ln; Lz /= Ln;

  function project(col, row) {
    // centre of the grid cell -> lat/lon on the globe (orthographic inverse)
    var x = (col + 0.5) * cell;
    var y = (row + 0.5) * cell;
    var u = (x - cx) / R;
    var v = (cy - y) / R;
    var rr = u * u + v * v;
    if (rr >= 1) return null;
    var z = Math.sqrt(1 - rr);
    var lat = Math.asin(z * sinPhi + v * cosPhi) / DEG;
    var lon = lam + Math.atan2(u, z * cosPhi - v * sinPhi) / DEG;
    lon = ((lon + 540) % 360) - 180;
    return { x: x, y: y, u: u, v: v, z: z, lat: lat, lon: lon };
  }

  function dimAt(x, y) {
    for (var i = 0; i < avoid.length; i++) {
      var a = avoid[i];
      if (x > a.x0 && x < a.x1 && y > a.y0 && y < a.y1) return 0.22;
    }
    return 1;
  }

  function draw() {
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (var k = 0; k < LEVELS; k++) buckets[k].length = 0;

    var rowMin = Math.max(0, Math.floor((cy - R) / cell));
    var rowMax = Math.min(Math.ceil(H / cell), Math.ceil((cy + R) / cell));

    for (var row = rowMin; row < rowMax; row++) {
      var y = (row + 0.5) * cell;
      var dy = (cy - y) / R;
      var half = Math.sqrt(Math.max(0, 1 - dy * dy)) * R;
      var colMin = Math.max(0, Math.floor((cx - half) / cell));
      var colMax = Math.min(Math.ceil(W / cell), Math.ceil((cx + half) / cell));
      for (var col = colMin; col < colMax; col++) {
        var p = project(col, row);
        if (!p) continue;
        var m = sample(p.lat, p.lon);
        var light = Math.max(0, p.u * Lx + p.v * Ly + p.z * Lz);
        var limb = Math.min(1, p.z * 3); // fade toward the rim
        var alpha, size;
        if (m > 180) {            // land
          alpha = (0.09 + 0.27 * light) * (0.35 + 0.65 * limb); // muted: max ≈ 0.36
          size = cell * (0.46 + 0.3 * light);
        } else if (m > 40) {      // border seam
          alpha = (0.045 + 0.108 * light) * limb;
          size = cell * 0.4;
        } else {                  // ocean
          alpha = (0.027 + 0.054 * light) * limb;
          size = cell * 0.22;
        }
        alpha *= dimAt(p.x, p.y);
        if (alpha < 0.02) continue;
        var level = Math.min(LEVELS - 1, Math.round(alpha * (LEVELS - 1)));
        buckets[level].push(p.x - size / 2, p.y - size / 2, size);
      }
    }

    for (var lv = 1; lv < LEVELS; lv++) {
      var list = buckets[lv];
      if (!list.length) continue;
      ctx.fillStyle = "rgba(255,255,255," + (lv / (LEVELS - 1)).toFixed(3) + ")";
      for (var i = 0; i < list.length; i += 3) ctx.fillRect(list[i], list[i + 1], list[i + 2], list[i + 2]);
    }

    // Faint atmosphere rim so the silhouette always reads as a globe
    var halo = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.08);
    halo.addColorStop(0, "rgba(255,255,255,0.045)");
    halo.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
    ctx.arc(cx, cy, R * 0.96, 0, Math.PI * 2, true);
    ctx.fill();

    // Hovered static point: a small marker that stays put while the globe turns
    if (hover) {
      var hx = Math.round(hover.x);
      var hy = Math.round(hover.y);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(hx - 3, hy - 3, 6, 6);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(hx - 9.5, hy - 9.5, 19, 19);
    }
  }

  /* ---------------- Hover ---------------- */

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
    // Stick to the current point until the cursor is clearly nearer another one
    if (hover && Math.abs(pointer.x - hover.x) < pitch * 0.65 && Math.abs(pointer.y - hover.y) < pitch * 0.65) return;
    var i = Math.round((pointer.x - cx) / pitch);
    var j = Math.round((pointer.y - cy) / pitch);
    var x = cx + i * pitch;
    var y = cy + j * pitch;
    var dx = (x - cx) / R;
    var dy = (y - cy) / R;
    if (dx * dx + dy * dy > 0.97 || y > H || dimAt(x, y) < 1) return clearHover();
    if (hover && hover.i === i && hover.j === j) return;

    var name = pointName(i, j);
    hover = { i: i, j: j, x: x, y: y, name: name };
    renderName(name);
    hero.classList.add("is-globe-hover");
    tooltip.classList.add("is-visible");
    placeTooltip();
    if (!running) draw();
  }

  function clearHover() {
    if (hover) { hover = null; tooltip.classList.remove("is-visible"); }
    hero.classList.remove("is-globe-hover");
  }

  function placeTooltip() {
    if (!hover) return;
    var w = tooltip.offsetWidth;
    var h = tooltip.offsetHeight;
    var x = hover.x + 16;
    var y = hover.y - h - 16;
    if (x + w > W - 8) x = hover.x - w - 16;
    if (y < 8) y = hover.y + 20;
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

  var BASE_SPEED = reduceMotion ? 0 : 0.006; // degrees of longitude per ms
  var targetSpeed = BASE_SPEED;
  var speed = BASE_SPEED;
  var running = false;
  var rafId = 0;
  var lastT = 0;

  function frame(t) {
    if (!running) return;
    var dt = Math.min(64, t - (lastT || t));
    lastT = t;
    speed += (targetSpeed - speed) * Math.min(1, dt * 0.008);
    if (Math.abs(speed) > 0.00001) {
      lam -= speed * dt;
    }
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    if (!W && !layout()) return;
    running = true;
    lastT = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  /* ---------------- Boot ---------------- */

  function relayout() { if (layout()) { clearHover(); draw(); } }
  if ("ResizeObserver" in window) new ResizeObserver(relayout).observe(hero);
  window.addEventListener("resize", relayout);
  // Card positions settle after fonts load and the entrance animation ends
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  setTimeout(relayout, 1600);

  var enabled = true;
  var onScreen = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen && enabled) start();
      else stop();
    }).observe(hero);
  }

  window.FrontierHeroMotion = window.FrontierHeroMotion || {};
  window.FrontierHeroMotion["1"] = {
    start: function () { enabled = true; relayout(); if (onScreen) start(); },
    stop: function () { enabled = false; stop(); clearHover(); }
  };
  relayout();
  start();
})();
