/* ==========================================================================
   Hero · Variation 1 — pixel globe
   - The earth is drawn on a fixed screen grid of square pixels (an
     "LED wall" look). Every grid cell samples the rotating globe:
     land pixels are softly lit, ocean pixels faint, borders show as seams.
   - The globe sits behind the hero copy and cards. Pixels under those
     elements are dimmed so text and buttons stay readable.
   - Every pixel is a name: hovering a pixel shows
     that pixel's string (tied to its lat/lon, so a spot always gives the
     same name) next to the cursor. The globe keeps rotating while
     hovered, so the name updates as the earth moves under the cursor.
   Exposes window.FrontierGlobe = { start, stop }.
   ========================================================================== */
(function () {
  "use strict";

  if (!window.d3 || !window.topojson || !window.FRONTIER_WORLD_TOPO) return;

  var hero = document.getElementById("hero-v1");
  var canvas = document.getElementById("pixel-globe");
  var tooltip = document.getElementById("pixel-globe-tooltip");
  if (!hero || !canvas || !tooltip) return;

  var tipName = tooltip.querySelector(".pixel-globe__name");
  var tipCoord = tooltip.querySelector(".pixel-globe__coord");
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

  /* ---------------- One name per pixel ---------------- */

  var NAMES = ["vault", "gen", "burner", "anon", "satoshi", "degen", "swarm", "gold", "ledger", "pixel",
    "first", "family", "node", "open", "cold", "based", "rare", "ghost", "hodl", "mint", "prime",
    "north", "island", "fjord", "studio", "bridge", "oasis", "stack", "moon", "alpha", "yield", "seed",
    "dao", "orbit", "keys", "signal", "sats", "meta", "pure", "trust", "safe", "chain", "hyper", "lucky",
    "noble", "atlas", "echo", "zero", "frontier", "genesis", "vista", "summit", "harbor", "ember"];
  var TLDS = [".crypto", ".wealth", ".wallet", ".agent", ".btc", ".sol", ".nft", ".robot", ".human", ".hype", ".gate"];
  // A few fixed spots keep the names from the brief where people will look for them
  var FIXED = {};
  function fix(lat, lon, name) { FIXED[cellKey(lat, lon)] = name; }

  var GEO_CELL = 1.5; // degrees; one name per 1.5° × 1.5° patch of earth
  function cellKey(lat, lon) {
    var la = Math.floor((lat + 90) / GEO_CELL);
    var lo = Math.floor((((lon + 180) % 360) + 360) % 360 / GEO_CELL);
    return la * 1000 + lo;
  }
  function hash(n) {
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return (n ^ (n >>> 16)) >>> 0;
  }
  function nameFor(lat, lon) {
    var key = cellKey(lat, lon);
    if (FIXED[key]) return FIXED[key];
    var h = hash(key + 7919);
    return NAMES[h % NAMES.length] + TLDS[(h >>> 12) % TLDS.length];
  }
  fix(47.37, 8.54, "vault.crypto");   // Zürich
  fix(40.71, -74.0, "gen.wealth");    // New York
  fix(1.35, 103.82, "burner.wallet"); // Singapore
  fix(64.15, -21.9, "anon.agent");    // Reykjavík
  fix(13.69, -89.19, "satoshi.btc");  // San Salvador
  fix(35.68, 139.69, "swarm.robot");  // Tokyo

  /* ---------------- Layout ---------------- */

  var W = 0, H = 0, dpr = 1;
  var cell = 10;          // grid pitch in CSS px
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
          alpha = (0.1 + 0.3 * light) * (0.35 + 0.65 * limb); // muted: max ≈ 0.4
          size = cell * (0.46 + 0.3 * light);
        } else if (m > 40) {      // border seam
          alpha = (0.05 + 0.12 * light) * limb;
          size = cell * 0.4;
        } else {                  // ocean
          alpha = (0.03 + 0.06 * light) * limb;
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
    halo.addColorStop(0, "rgba(255,255,255,0.05)");
    halo.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
    ctx.arc(cx, cy, R * 0.96, 0, Math.PI * 2, true);
    ctx.fill();

    // Hovered pixel
    if (hover) {
      var hx = hover.col * cell;
      var hy = hover.row * cell;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(hx + 1, hy + 1, cell - 2, cell - 2);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(hx - cell + 0.5, hy - cell + 0.5, cell * 3 - 1, cell * 3 - 1);
    }
  }

  /* ---------------- Hover ---------------- */

  function formatCoord(lat, lon) {
    return Math.abs(lat).toFixed(1) + "°" + (lat >= 0 ? "N" : "S") + "  " + Math.abs(lon).toFixed(1) + "°" + (lon >= 0 ? "E" : "W");
  }

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
    var col = Math.floor(pointer.x / cell);
    var row = Math.floor(pointer.y / cell);
    var p = project(col, row);
    if (!p || dimAt(p.x, p.y) < 1) return clearHover();

    var name = nameFor(p.lat, p.lon);
    if (!hover || hover.name !== name) renderName(name);
    hover = { col: col, row: row, lat: p.lat, lon: p.lon, name: name };
    tipCoord.textContent = formatCoord(p.lat, p.lon);
    hero.classList.add("is-globe-hover");
    tooltip.classList.add("is-visible");
    placeTooltip();
  }

  function clearHover() {
    if (hover) { hover = null; tooltip.classList.remove("is-visible"); }
    hero.classList.remove("is-globe-hover");
  }

  function placeTooltip() {
    if (!hover) return;
    var w = tooltip.offsetWidth;
    var h = tooltip.offsetHeight;
    var x = (hover.col + 0.5) * cell + 16;
    var y = (hover.row + 0.5) * cell - h - 16;
    if (x + w > W - 8) x = (hover.col + 0.5) * cell - w - 16;
    if (y < 8) y = (hover.row + 0.5) * cell + 20;
    tooltip.style.setProperty("--tx", Math.round(x) + "px");
    tooltip.style.setProperty("--ty", Math.round(y) + "px");
  }

  hero.addEventListener("pointermove", function (e) {
    if (e.target.closest("[data-globe-avoid], a, button")) { pointer = null; clearHover(); return; }
    var r = hero.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    updateHover();
    if (!running) draw();
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
      if (hover) updateHover();
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

  function relayout() { if (layout()) draw(); }
  if ("ResizeObserver" in window) new ResizeObserver(relayout).observe(hero);
  window.addEventListener("resize", relayout);
  // Card positions settle after fonts load and the entrance animation ends
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  setTimeout(relayout, 1600);

  var onScreen = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen && window.FrontierGlobe.enabled) start();
      else stop();
    }).observe(hero);
  }

  window.FrontierGlobe = {
    enabled: true,
    start: function () { this.enabled = true; relayout(); if (onScreen) start(); },
    stop: function () { this.enabled = false; stop(); }
  };
  relayout();
  start();
})();
