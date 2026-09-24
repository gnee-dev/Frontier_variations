/* ==========================================================================
   Hero · Variation 1 — interactive political globe
   - Black & white orthographic globe drawn on <canvas> with d3-geo.
   - Rotates by default; eases to a stop while hovered, resumes on leave.
   - Every country (and a set of pinned coordinates) maps to a Frontier
     name, shown in a tooltip that follows the cursor.
   - Drag to spin manually.
   Exposes window.FrontierGlobe = { start, stop }.
   ========================================================================== */
(function () {
  "use strict";

  if (!window.d3 || !window.topojson || !window.FRONTIER_WORLD_TOPO) return;

  var root = document.getElementById("globe");
  var canvas = document.getElementById("globe-canvas");
  var tooltip = document.getElementById("globe-tooltip");
  if (!root || !canvas || !tooltip) return;

  var tipName = tooltip.querySelector(".globe__tooltip-name");
  var tipPlace = tooltip.querySelector(".globe__tooltip-place");
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Names shown on hover ---------------- */

  // Hand-picked names for recognisable places…
  var COUNTRY_NAMES = {
    "Switzerland": "vault.crypto",
    "United States of America": "gen.wealth",
    "Singapore": "burner.wallet",
    "Iceland": "anon.agent",
    "El Salvador": "satoshi.btc",
    "Japan": "swarm.robot",
    "United Arab Emirates": "gold.wealth",
    "Germany": "ledger.crypto",
    "Brazil": "degen.sol",
    "South Korea": "pixel.nft",
    "India": "first.human",
    "United Kingdom": "family.wealth",
    "China": "node.agent",
    "Australia": "open.gate",
    "Canada": "cold.wallet",
    "Nigeria": "based.hype",
    "France": "rare.nft",
    "Russia": "ghost.agent",
    "Argentina": "hodl.btc",
    "Mexico": "mint.nft",
    "South Africa": "prime.human",
    "Estonia": "e.agent",
    "Portugal": "surf.sol",
    "Greenland": "north.gate",
    "Indonesia": "island.sol",
    "Kenya": "mobile.wallet",
    "Norway": "fjord.vault",
    "Italy": "studio.nft",
    "Spain": "siesta.robot",
    "Turkey": "bridge.gate",
    "Egypt": "pyramid.btc",
    "Saudi Arabia": "oasis.wealth",
    "Antarctica": "cold.storage"
  };

  // …and a deterministic pool for everywhere else.
  var POOL = [
    "vault.crypto", "gen.wealth", "burner.wallet", "anon.agent", "stack.btc",
    "moon.sol", "mint.nft", "alpha.agent", "yield.vault", "seed.wallet",
    "dao.crypto", "orbit.sol", "keys.wallet", "signal.hype", "sats.btc",
    "meta.nft", "pure.human", "bot.robot", "open.gate", "frontier.crypto",
    "trust.wealth", "safe.vault", "chain.agent", "first.human", "hyper.hype",
    "lucky.sol", "noble.wealth", "atlas.gate", "echo.agent", "zero.wallet"
  ];

  // Pinned coordinates (lon, lat): drawn as pulsing beacons on the globe.
  var PINS = [
    { name: "vault.crypto", place: "Zürich", coord: [8.54, 47.37] },
    { name: "gen.wealth", place: "New York", coord: [-74.0, 40.71] },
    { name: "burner.wallet", place: "Singapore", coord: [103.82, 1.35] },
    { name: "anon.agent", place: "Reykjavík", coord: [-21.9, 64.15] },
    { name: "satoshi.btc", place: "San Salvador", coord: [-89.19, 13.69] },
    { name: "swarm.robot", place: "Tokyo", coord: [139.69, 35.68] },
    { name: "gold.wealth", place: "Dubai", coord: [55.27, 25.2] },
    { name: "degen.sol", place: "São Paulo", coord: [-46.63, -23.55] },
    { name: "based.hype", place: "Lagos", coord: [3.38, 6.52] },
    { name: "open.gate", place: "Sydney", coord: [151.21, -33.87] },
    { name: "family.wealth", place: "London", coord: [-0.13, 51.51] },
    { name: "pixel.nft", place: "Seoul", coord: [126.98, 37.57] }
  ];

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* ---------------- Geometry ---------------- */

  var topo = window.FRONTIER_WORLD_TOPO;
  var countries = topojson.feature(topo, topo.objects.countries).features;
  var borders = topojson.mesh(topo, topo.objects.countries, function (a, b) { return a !== b; });
  var coastline = topojson.mesh(topo, topo.objects.countries, function (a, b) { return a === b; });
  var graticule = d3.geoGraticule10();
  var sphere = { type: "Sphere" };

  countries.forEach(function (f) {
    var n = f.properties.name;
    f.properties.label = COUNTRY_NAMES[n] || POOL[hash(n) % POOL.length];
    f.properties.bounds = d3.geoBounds(f);
  });

  var projection = d3.geoOrthographic().clipAngle(90).precision(0.4);
  var path = d3.geoPath(projection, ctx);

  /* ---------------- State ---------------- */

  var size = 0;
  var dpr = 1;
  var rotation = [-10, -18, 0]; // start over Europe / Africa, tilted
  var speed = 0; // deg per ms, eased toward targetSpeed
  var BASE_SPEED = reduceMotion ? 0 : 0.012;
  var targetSpeed = BASE_SPEED;
  var hovering = false;
  var dragging = false;
  var dragStart = null;
  var pointer = null; // {x, y} in CSS px relative to canvas
  var hoverCountry = null;
  var hoverPin = null;
  var lastLabel = "";
  var running = false;
  var rafId = 0;
  var lastT = 0;
  var needsHitTest = false;

  /* ---------------- Sizing ---------------- */

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (rect.width < 20) return; // hidden (another variation is active)
    size = Math.round(rect.width);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    projection.translate([size / 2, size / 2]).scale(size / 2 - 8);
    draw(performance.now());
  }

  /* ---------------- Drawing ---------------- */

  function draw(t) {
    if (!size) return;
    projection.rotate(rotation);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    var c = size / 2;
    var r = projection.scale();

    // Outer halo
    var halo = ctx.createRadialGradient(c, c, r * 0.9, c, c, r * 1.08);
    halo.addColorStop(0, "rgba(255,255,255,0.10)");
    halo.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(c, c, r * 1.08, 0, Math.PI * 2);
    ctx.fill();

    // Ocean: dark sphere lit from the upper-left
    var ocean = ctx.createRadialGradient(c - r * 0.35, c - r * 0.4, r * 0.05, c, c, r);
    ocean.addColorStop(0, "#1c1c1c");
    ocean.addColorStop(0.6, "#0a0a0a");
    ocean.addColorStop(1, "#000000");
    ctx.beginPath();
    path(sphere);
    ctx.fillStyle = ocean;
    ctx.fill();

    // Graticule
    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Land
    ctx.beginPath();
    for (var i = 0; i < countries.length; i++) path(countries[i]);
    ctx.fillStyle = "#333333";
    ctx.fill();

    // Hovered country
    if (hoverCountry) {
      ctx.beginPath();
      path(hoverCountry);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fill();
    }

    // Political borders + coastlines
    ctx.beginPath();
    path(borders);
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 0.55;
    ctx.stroke();

    ctx.beginPath();
    path(coastline);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 0.7;
    ctx.stroke();

    if (hoverCountry) {
      ctx.beginPath();
      path(hoverCountry);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Terminator-style shading: darken the right limb for depth
    var shade = ctx.createRadialGradient(c - r * 0.45, c - r * 0.45, r * 0.2, c, c, r * 1.02);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(0.75, "rgba(0,0,0,0.15)");
    shade.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.beginPath();
    path(sphere);
    ctx.fillStyle = shade;
    ctx.fill();

    // Pins
    var center = [-rotation[0], -rotation[1]];
    for (var p = 0; p < PINS.length; p++) {
      var pin = PINS[p];
      var dist = d3.geoDistance(pin.coord, center);
      pin.visible = dist < Math.PI / 2 - 0.08;
      if (!pin.visible) continue;
      var xy = projection(pin.coord);
      pin.xy = xy;
      var fade = Math.min(1, (Math.PI / 2 - dist) / 0.5);
      var active = pin === hoverPin;
      var phase = ((t / 1000 + p * 0.37) % 2.2) / 2.2;

      // pulse ring
      ctx.beginPath();
      ctx.arc(xy[0], xy[1], 3 + phase * 14, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255," + (0.5 * (1 - phase) * fade).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();

      // dot
      ctx.beginPath();
      ctx.arc(xy[0], xy[1], active ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + fade.toFixed(3) + ")";
      ctx.fill();
      if (active) {
        ctx.beginPath();
        ctx.arc(xy[0], xy[1], 10, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.stroke();
      }
    }

    // Crisp rim
    ctx.beginPath();
    path(sphere);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /* ---------------- Hit testing ---------------- */

  function inBounds(b, lon, lat) {
    if (lat < b[0][1] || lat > b[1][1]) return false;
    if (b[0][0] <= b[1][0]) return lon >= b[0][0] && lon <= b[1][0];
    return lon >= b[0][0] || lon <= b[1][0]; // crosses the antimeridian
  }

  function hitTest() {
    needsHitTest = false;
    if (!pointer) return setHover(null, null);

    var c = size / 2;
    var dx = pointer.x - c;
    var dy = pointer.y - c;
    if (dx * dx + dy * dy > projection.scale() * projection.scale()) return setHover(null, null);

    // Pins win when the cursor is close to one
    for (var i = 0; i < PINS.length; i++) {
      var pin = PINS[i];
      if (!pin.visible || !pin.xy) continue;
      var px = pin.xy[0] - pointer.x;
      var py = pin.xy[1] - pointer.y;
      if (px * px + py * py < 16 * 16) {
        var host = findCountry(pin.coord);
        return setHover(host, pin);
      }
    }

    var ll = projection.invert([pointer.x, pointer.y]);
    if (!ll) return setHover(null, null);
    setHover(findCountry(ll), null);
  }

  function findCountry(ll) {
    for (var i = 0; i < countries.length; i++) {
      var f = countries[i];
      if (inBounds(f.properties.bounds, ll[0], ll[1]) && d3.geoContains(f, ll)) return f;
    }
    return null;
  }

  function setHover(country, pin) {
    hoverCountry = country;
    hoverPin = pin;
    root.classList.toggle("is-over-country", !!(country || pin));

    if (!country && !pin) {
      tooltip.classList.remove("is-visible");
      lastLabel = "";
      return;
    }

    var label = pin ? pin.name : country.properties.label;
    var place = pin ? pin.place + (country ? " · " + country.properties.name : "") : country.properties.name;
    if (label !== lastLabel) {
      var dot = label.indexOf(".");
      tipName.innerHTML = "";
      tipName.appendChild(document.createTextNode(label.slice(0, dot)));
      var tld = document.createElement("span");
      tld.className = "tld";
      tld.textContent = label.slice(dot);
      tipName.appendChild(tld);
      tooltip.classList.remove("is-swap");
      void tooltip.offsetWidth; // restart swap animation
      tooltip.classList.add("is-swap");
      lastLabel = label;
    }
    tipPlace.textContent = place;
    tooltip.classList.add("is-visible");
    positionTooltip();
  }

  function positionTooltip() {
    if (!pointer) return;
    var w = tooltip.offsetWidth;
    var h = tooltip.offsetHeight;
    var x = pointer.x + 18;
    var y = pointer.y - h - 14;
    var maxX = root.clientWidth - w - 4;
    if (x > maxX) x = pointer.x - w - 18;
    if (y < 4) y = pointer.y + 22;
    tooltip.style.setProperty("--tx", x + "px");
    tooltip.style.setProperty("--ty", y + "px");
  }

  /* ---------------- Loop ---------------- */

  function frame(t) {
    if (!running) return;
    var dt = Math.min(64, t - (lastT || t));
    lastT = t;

    // Ease rotation speed toward target (stops smoothly on hover)
    speed += (targetSpeed - speed) * Math.min(1, dt * 0.006);
    if (!dragging && Math.abs(speed) > 0.00001) {
      rotation[0] += speed * dt;
      if (hoverCountry || hoverPin) needsHitTest = true;
    }
    if (needsHitTest) hitTest();
    draw(t);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastT = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  /* ---------------- Input ---------------- */

  function localPoint(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener("pointerenter", function () {
    hovering = true;
    targetSpeed = 0;
    root.classList.add("is-hovering");
  });

  canvas.addEventListener("pointerleave", function () {
    hovering = false;
    if (!dragging) {
      targetSpeed = BASE_SPEED;
      pointer = null;
      setHover(null, null);
      root.classList.remove("is-hovering");
    }
  });

  canvas.addEventListener("pointermove", function (e) {
    pointer = localPoint(e);
    if (dragging && dragStart) {
      var k = 180 / (Math.PI * projection.scale()) * 1.4;
      rotation[0] = dragStart.rot[0] + (pointer.x - dragStart.x) * k;
      rotation[1] = Math.max(-60, Math.min(60, dragStart.rot[1] - (pointer.y - dragStart.y) * k));
      tooltip.classList.remove("is-visible");
      return;
    }
    needsHitTest = true;
    positionTooltip();
    if (!running) { hitTest(); draw(performance.now()); }
  });

  canvas.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch") {
      // Tap to reveal on touch devices
      pointer = localPoint(e);
      targetSpeed = 0;
      hitTest();
      return;
    }
    dragging = true;
    root.classList.add("is-dragging");
    var p = localPoint(e);
    dragStart = { x: p.x, y: p.y, rot: rotation.slice() };
    canvas.setPointerCapture(e.pointerId);
  });

  function endDrag(e) {
    if (e.pointerType === "touch") {
      setTimeout(function () {
        if (!hovering) return;
        targetSpeed = BASE_SPEED;
      }, 2400);
      return;
    }
    if (!dragging) return;
    dragging = false;
    dragStart = null;
    root.classList.remove("is-dragging");
    needsHitTest = true;
    if (!hovering) {
      targetSpeed = BASE_SPEED;
      pointer = null;
      setHover(null, null);
    }
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  /* ---------------- Boot ---------------- */

  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
  resize();

  // Only animate while the globe is on screen
  var onScreen = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen && window.FrontierGlobe.enabled) start();
      else stop();
    }).observe(root);
  }

  window.FrontierGlobe = {
    enabled: true,
    start: function () { this.enabled = true; if (onScreen) { resize(); start(); } },
    stop: function () { this.enabled = false; stop(); }
  };
  start();
})();
