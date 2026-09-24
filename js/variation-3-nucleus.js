/* ==========================================================================
   Hero · Variation 3 — nucleus (particle sphere)
   - Nucleus: ~900 particles spread over a sphere, rotating in 3D. Depth
     drives size and brightness, so the near side reads bright and the far
     side dim, and it looks like a solid ball of light.
   - Halo: ~1,400 tiny particles in a wide shell around it, plus a few soft
     out-of-focus glows. The halo turns much more slowly than the nucleus
     for parallax, and a few particles twinkle.
   - Names: an invisible layer of static points covers the sphere. Each
     point holds one name, shown until the cursor moves to another point,
     so an idle cursor keeps its name while the nucleus keeps spinning.
   Registers window.FrontierHeroMotion["3"] = { start, stop }.
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.getElementById("hero-v3");
  var canvas = document.getElementById("nucleus");
  var tooltip = document.getElementById("nucleus-tooltip");
  if (!hero || !canvas || !tooltip) return;

  var box = canvas.parentElement;
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
  function pointName(i, j) {
    var h = hash((i + 1024) * 8192 + (j + 1024) + 104729);
    if (h % 7 === 0) return FEATURED[(h >>> 8) % FEATURED.length];
    return NAMES[(h >>> 3) % NAMES.length] + TLDS[(h >>> 13) % TLDS.length];
  }

  /* ---------------- Particles (unit space) ---------------- */

  // seeded random so the sphere looks the same on every load
  var seed = 20260924;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

  var core = [];   // nucleus particles on (and just under) the unit sphere
  var halo = [];   // halo particles in a shell from 1.35 to 2.4
  (function build() {
    var N = 900, golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i + 0.5) / N * 2;
      var r = Math.sqrt(1 - y * y);
      var th = i * golden + rnd() * 0.35;
      var depth = 1 - Math.pow(rnd(), 3) * 0.28;        // most on the surface, some just inside
      core.push({ x: Math.cos(th) * r * depth, y: y * depth, z: Math.sin(th) * r * depth,
                  s: 0.85 + rnd() * 1.3, tw: rnd() * 6.28 });
    }
    for (var k = 0; k < 1400; k++) {
      var u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, rr = Math.sqrt(1 - u * u);
      var rad = 1.35 + Math.pow(rnd(), 0.7) * 1.05;     // thins out toward the edge
      var bokeh = rnd() < 0.035;                        // a few soft, out-of-focus glows
      halo.push({ x: Math.cos(a) * rr * rad, y: u * rad * 0.92, z: Math.sin(a) * rr * rad,
                  s: bokeh ? 3 + rnd() * 4 : 0.4 + rnd() * 0.9, b: bokeh, tw: rnd() * 6.28, tws: 0.4 + rnd() * 1.2 });
    }
  })();

  // soft round sprite for glow
  var sprite = (function () {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var g = c.getContext("2d");
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.85)");
    grd.addColorStop(0.55, "rgba(255,255,255,0.18)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return c;
  })();

  /* ---------------- Layout ---------------- */

  var W = 0, H = 0, dpr = 1;
  var cx = 0, cy = 0, rCore = 0;   // canvas space, CSS px
  var offX = 0, offY = 0;          // canvas origin relative to the box (canvas spills past it)
  var pitch = 20;

  function layout() {
    // layout sizes (offset*), not getBoundingClientRect: the box scales in on entry
    if (canvas.offsetWidth < 20) return false;
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    cx = W / 2;
    cy = H / 2;
    rCore = box.offsetWidth * 0.2;   // nucleus ≈ 40% of the box; halo reaches ≈ 96%
    offX = canvas.offsetLeft;
    offY = canvas.offsetTop;
    pitch = box.offsetWidth < 400 ? 18 : 20;
    return true;
  }

  /* ---------------- Draw ---------------- */

  var TILT = -0.32;                 // tilt the spin axis toward the viewer
  var cosT = Math.cos(TILT), sinT = Math.sin(TILT);
  var CORE_SPEED = reduceMotion ? 0 : 0.00032;  // rad per ms (~18° a second)
  var HALO_SPEED = reduceMotion ? 0 : 0.00005;
  var aCore = 0.6, aHalo = 0;
  var lastT = 0;
  var hover = null;

  function project(p, ang, scale) {
    var ca = Math.cos(ang), sa = Math.sin(ang);
    var x = p.x * ca + p.z * sa;
    var z = -p.x * sa + p.z * ca;
    var y = p.y * cosT - z * sinT;
    z = p.y * sinT + z * cosT;
    var persp = 1 / (1 - z * 0.12);      // gentle perspective
    return { x: cx + x * scale * persp, y: cy - y * scale * persp, z: z, k: persp };
  }

  function draw(now) {
    if (!W) return;
    var time = now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    // soft inner glow of the nucleus
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rCore * 1.35);
    g.addColorStop(0, "rgba(255,255,255,0.14)");
    g.addColorStop(0.6, "rgba(255,255,255,0.05)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - rCore * 1.4, cy - rCore * 1.4, rCore * 2.8, rCore * 2.8);

    // halo
    for (var i = 0; i < halo.length; i++) {
      var h = halo[i];
      var q = project(h, aHalo, rCore);
      var tw = 0.75 + 0.25 * Math.sin(time * h.tws + h.tw);
      var s = h.s * q.k;
      if (h.b) {
        ctx.globalAlpha = 0.16 * tw;
        ctx.drawImage(sprite, q.x - s * 2, q.y - s * 2, s * 4, s * 4);
      } else {
        ctx.globalAlpha = (0.32 + 0.35 * (q.z + 2.4) / 4.8) * tw;
        ctx.drawImage(sprite, q.x - s * 1.6, q.y - s * 1.6, s * 3.2, s * 3.2);
      }
    }

    // nucleus: near side bright and larger, far side dim
    for (var j = 0; j < core.length; j++) {
      var c = core[j];
      var p = project(c, aCore, rCore);
      var front = (p.z + 1) / 2;                 // 0 back … 1 front
      var twc = 0.85 + 0.15 * Math.sin(time * 1.3 + c.tw);
      var size = c.s * (0.7 + 0.9 * front) * p.k;
      ctx.globalAlpha = Math.min(1, (0.2 + 0.9 * front * front) * twc);
      ctx.drawImage(sprite, p.x - size * 2, p.y - size * 2, size * 4, size * 4);
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    if (hover) {
      var hx = Math.round(hover.x), hy = Math.round(hover.y);
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1;
      ctx.strokeRect(hx - 8.5, hy - 8.5, 17, 17);
      ctx.fillStyle = "#fff";
      ctx.fillRect(hx - 2, hy - 2, 4, 4);
    }
  }

  /* ---------------- Hover: static points over the sphere ---------------- */

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
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    // keep the current point until the cursor is clearly nearer another one
    if (hover && Math.abs(x - hover.x) < pitch * 0.65 && Math.abs(y - hover.y) < pitch * 0.65) return;
    var i = Math.round((x - cx) / pitch), j = Math.round((y - cy) / pitch);
    var px = cx + i * pitch, py = cy + j * pitch;
    var d = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
    if (d > rCore * 2.3) return clearHover();
    if (hover && hover.i === i && hover.j === j) return;
    hover = { i: i, j: j, x: px, y: py };
    renderName(pointName(i, j));
    hero.classList.add("is-globe-hover");
    tooltip.classList.add("is-visible");
    // tooltip lives in the box; convert from canvas space
    var bx = px + offX, by = py + offY;
    var w = tooltip.offsetWidth, h = tooltip.offsetHeight;
    var tx = bx + 14, ty = by - h - 14;
    if (tx + w > box.clientWidth + 60) tx = bx - w - 14;
    tooltip.style.setProperty("--tx", Math.round(tx) + "px");
    tooltip.style.setProperty("--ty", Math.round(ty) + "px");
    if (!running) draw(performance.now());
  }
  function clearHover() {
    if (hover) { hover = null; tooltip.classList.remove("is-visible"); }
    hero.classList.remove("is-globe-hover");
  }
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") onMove(e); });
  canvas.addEventListener("pointerleave", clearHover);

  /* ---------------- Loop ---------------- */

  var running = false, rafId = 0;
  function frame(now) {
    if (!running) return;
    var dt = Math.min(64, now - (lastT || now));
    lastT = now;
    aCore += CORE_SPEED * dt;
    aHalo += HALO_SPEED * dt;
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

  function relayout() { if (layout()) { clearHover(); draw(performance.now()); } }
  if ("ResizeObserver" in window) new ResizeObserver(relayout).observe(box);

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
