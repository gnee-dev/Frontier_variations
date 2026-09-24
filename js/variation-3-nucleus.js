/* ==========================================================================
   Hero · Variations 3 and 3b — nucleus (particle sphere)
   - Nucleus: ~1,500 tiny square pixels spread over a sphere, rotating in 3D.
     Depth drives pixel size and brightness, so the near side reads bright
     and the far side dim, and it looks like a solid ball.
   - Halo: ~1,400 single pixels in a wide shell around it, plus a few
     larger, faint ones. The halo turns much more slowly than the nucleus
     for parallax, and the pixels twinkle gently.
   - Names: an invisible layer of static points covers the sphere. Each
     point holds one name, shown until the cursor moves to another point,
     so an idle cursor keeps its name while the nucleus keeps spinning.
   One builder, two placements:
     3  : sphere centred between the two text columns
     3b : a much bigger sphere rising out of the bottom of the hero, behind
          the centred copy (pixels under the copy are dimmed)
   Registers window.FrontierHeroMotion["3"] and ["3b"] = { start, stop }.
   ========================================================================== */
(function () {
  "use strict";

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

  /* ---------------- Particles (unit space, shared) ---------------- */

  // seeded random so the sphere looks the same on every load
  var seed = 20260924;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

  var core = [];   // nucleus particles on (and just under) the unit sphere
  var halo = [];   // halo particles in a shell from 1.35 to 2.4
  (function build() {
    var N = 1500, golden = Math.PI * (3 - Math.sqrt(5));
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
      var bokeh = rnd() < 0.012;                        // a few larger, faint pixels
      halo.push({ x: Math.cos(a) * rr * rad, y: u * rad * 0.92, z: Math.sin(a) * rr * rad,
                  s: bokeh ? 3 + rnd() * 4 : 0.4 + rnd() * 0.9, b: bokeh, tw: rnd() * 6.28, tws: 0.4 + rnd() * 1.2 });
    }
  })();

  var TILT = -0.32;                 // tilt the spin axis toward the viewer
  var cosT = Math.cos(TILT), sinT = Math.sin(TILT);
  var CORE_SPEED = reduceMotion ? 0 : 0.00032;  // rad per ms (~18° a second)
  var HALO_SPEED = reduceMotion ? 0 : 0.00005;

  /* ---------------- Builder ---------------- */

  // opts: key, hero, canvas, tooltip, listenEl, tipParent,
  //       geometry(W, H) -> { cx, cy, rCore, pitch },
  //       avoidSelector (optional: dim pixels under these elements)
  function makeNucleus(opts) {
    var hero = opts.hero, canvas = opts.canvas, tooltip = opts.tooltip;
    if (!hero || !canvas || !tooltip) return null;
    var ctx = canvas.getContext("2d");
    var tipName = tooltip.querySelector(".hero-tip__name");

    var W = 0, H = 0, dpr = 1, cx = 0, cy = 0, rCore = 0, pitch = 20;
    var offX = 0, offY = 0;  // canvas origin relative to the tooltip's parent
    var avoid = [];
    var aCore = 0.6, aHalo = 0, lastT = 0, hover = null;

    // Element box relative to `root`, from layout offsets (unaffected by transforms)
    function layoutRect(el, root) {
      var x = 0, y = 0, n = el;
      while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
    }

    function layout() {
      // layout sizes (offset*), not getBoundingClientRect: things scale/slide in on entry
      if (canvas.offsetWidth < 20) return false;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      var g = opts.geometry(W, H);
      cx = g.cx; cy = g.cy; rCore = g.rCore; pitch = g.pitch;
      var cr = layoutRect(canvas, opts.tipParent);
      offX = cr.x; offY = cr.y;
      avoid = opts.avoidSelector ? Array.prototype.map.call(hero.querySelectorAll(opts.avoidSelector), function (el) {
        var r = layoutRect(el, opts.tipParent), pad = 16;
        return { x0: r.x - cr.x - pad, y0: r.y - cr.y - pad, x1: r.x - cr.x + r.w + pad, y1: r.y - cr.y + r.h + pad };
      }) : [];
      return true;
    }

    function dimAt(x, y) {
      for (var i = 0; i < avoid.length; i++) {
        var a = avoid[i];
        if (x > a.x0 && x < a.x1 && y > a.y0 && y < a.y1) return 0.22;
      }
      return 1;
    }

    function project(p, ang) {
      var ca = Math.cos(ang), sa = Math.sin(ang);
      var x = p.x * ca + p.z * sa;
      var z = -p.x * sa + p.z * ca;
      var y = p.y * cosT - z * sinT;
      z = p.y * sinT + z * cosT;
      var persp = 1 / (1 - z * 0.12);      // gentle perspective
      return { x: cx + x * rCore * persp, y: cy - y * rCore * persp, z: z, k: persp };
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

      // halo: tiny square pixels; the few "bokeh" ones are larger and faint
      ctx.fillStyle = "#fff";
      var i, q, tw;
      for (i = 0; i < halo.length; i++) {
        var h = halo[i];
        q = project(h, aHalo);
        if (q.y > H + 8 || q.y < -8) continue;
        tw = 0.75 + 0.25 * Math.sin(time * h.tws + h.tw);
        var dim = avoid.length ? dimAt(q.x, q.y) : 1;
        if (h.b) {
          var bs = Math.round(h.s * q.k);
          ctx.globalAlpha = 0.1 * tw * dim;
          ctx.fillRect(Math.round(q.x - bs / 2), Math.round(q.y - bs / 2), bs, bs);
        } else {
          var hs = h.s * q.k < 0.9 ? 1 : 2;
          ctx.globalAlpha = (0.35 + 0.4 * (q.z + 2.4) / 4.8) * tw * dim;
          ctx.fillRect(Math.round(q.x), Math.round(q.y), hs, hs);
        }
      }

      // nucleus: tiny pixels, near side bigger and brighter, far side small and dim
      var grow = Math.sqrt(Math.max(1, rCore / 100));   // bigger spheres get slightly bigger pixels
      for (var j = 0; j < core.length; j++) {
        var c = core[j];
        var p = project(c, aCore);
        if (p.y > H + 8) continue;
        var front = (p.z + 1) / 2;                   // 0 back … 1 front
        var twc = 0.85 + 0.15 * Math.sin(time * 1.3 + c.tw);
        var size = Math.max(1, Math.round(c.s * (0.6 + 1.25 * front) * p.k * grow));
        ctx.globalAlpha = Math.min(1, (0.25 + 0.95 * front * front) * twc) * (avoid.length ? dimAt(p.x, p.y) : 1);
        ctx.fillRect(Math.round(p.x - size / 2), Math.round(p.y - size / 2), size, size);
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

    /* ---- hover: static points over the sphere ---- */

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
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      // keep the current point until the cursor is clearly nearer another one
      if (hover && Math.abs(x - hover.x) < pitch * 0.65 && Math.abs(y - hover.y) < pitch * 0.65) return;
      var i = Math.round((x - cx) / pitch), j = Math.round((y - cy) / pitch);
      var px = cx + i * pitch, py = cy + j * pitch;
      var d = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
      if (d > rCore * 2.3 || py < 0 || py > H || (avoid.length && dimAt(px, py) < 1)) return clearHover();
      if (hover && hover.i === i && hover.j === j) return;
      hover = { i: i, j: j, x: px, y: py };
      renderName(pointName(i, j));
      hero.classList.add("is-globe-hover");
      tooltip.classList.add("is-visible");
      var bx = px + offX, by = py + offY;
      var w = tooltip.offsetWidth, h = tooltip.offsetHeight;
      var tx = bx + 14, ty = by - h - 14;
      if (tx + w > opts.tipParent.clientWidth + 60) tx = bx - w - 14;
      if (ty < 8) ty = by + 18;
      tooltip.style.setProperty("--tx", Math.round(tx) + "px");
      tooltip.style.setProperty("--ty", Math.round(ty) + "px");
      if (!running) draw(performance.now());
    }
    function clearHover() {
      if (hover) { hover = null; tooltip.classList.remove("is-visible"); }
      hero.classList.remove("is-globe-hover");
    }
    opts.listenEl.addEventListener("pointermove", onMove);
    opts.listenEl.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") onMove(e); });
    opts.listenEl.addEventListener("pointerleave", clearHover);

    /* ---- loop ---- */

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

    function relayout() {
      if (opts.beforeLayout) opts.beforeLayout();
      if (layout()) { clearHover(); draw(performance.now()); }
    }
    if ("ResizeObserver" in window) new ResizeObserver(relayout).observe(canvas);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

    var enabled = false, onScreen = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen && enabled) start(); else stop();
      }).observe(hero);
    }

    window.FrontierHeroMotion = window.FrontierHeroMotion || {};
    window.FrontierHeroMotion[opts.key] = {
      start: function () {
        enabled = true;
        requestAnimationFrame(function () { relayout(); if (onScreen) start(); });
      },
      stop: function () { enabled = false; stop(); clearHover(); }
    };
    return { relayout: relayout };
  }

  /* ---------------- Variation 3: sphere between the columns ---------------- */

  var box3 = document.querySelector("#hero-v3 .hero-v3__globe");
  if (box3) makeNucleus({
    key: "3",
    hero: document.getElementById("hero-v3"),
    canvas: document.getElementById("nucleus"),
    tooltip: document.getElementById("nucleus-tooltip"),
    listenEl: document.getElementById("nucleus"),
    tipParent: box3,
    geometry: function (W, H) {
      var bw = box3.offsetWidth;
      return { cx: W / 2, cy: H / 2, rCore: bw * 0.2, pitch: bw < 400 ? 18 : 20 };
    }
  });

  /* ---------------- Variation 3b: big sphere rising from the bottom ---------------- */

  var hero3b = document.getElementById("hero-v3b");
  var title3b = document.getElementById("hero-v3b-title");
  var field3b = hero3b && hero3b.querySelector(".hero-v3b__domain");

  // 56px in a 674px frame, the width of the domain field.
  // Only on screens too narrow for the 674px field is the headline scaled
  // down, so it keeps matching the (narrower) field instead of overflowing.
  function fitTitle() {
    if (!title3b || !field3b || !field3b.offsetWidth) return;
    title3b.style.fontSize = "";
    if (field3b.offsetWidth >= 674) return;           // desktop: exact Figma 64px
    title3b.style.fontSize = "56px";
    var natural = title3b.scrollWidth;
    if (!natural) return;
    var size = Math.min(56, 56 * field3b.offsetWidth / natural);
    title3b.style.fontSize = Math.max(26, size).toFixed(2) + "px";
  }

  if (hero3b) {
    var ctl3b = makeNucleus({
      key: "3b",
      hero: hero3b,
      canvas: document.getElementById("nucleus-3b"),
      tooltip: document.getElementById("nucleus-3b-tooltip"),
      listenEl: hero3b,
      tipParent: hero3b,
      avoidSelector: "[data-globe-avoid]",
      beforeLayout: fitTitle,
      geometry: function (W, H) {
        var mobile = W < 760;
        var r = (mobile ? W * 0.42 : Math.min(W * 0.2, 300)) * 1.2;   // 20% bigger
        // centre near the bottom edge, pushed down by 20% of the nucleus diameter:
        // the top dome rises between the copy and the cards, the rest disappears
        // behind the cards and out of the bottom of the hero
        return { cx: W / 2, cy: (mobile ? H + r * 0.1 : H - r * 0.2) + r * 0.4, rCore: r, pitch: mobile ? 20 : 24 };
      }
    });
    window.addEventListener("resize", function () { if (ctl3b) ctl3b.relayout(); else fitTitle(); });
  }
})();
