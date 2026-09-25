/* ==========================================================================
   Hero · Variations 4 and 4b — "Video frame" / "Video full bleed"
   Hover names over the video, like the other variations: an invisible
   layer of static points (28px apart, 22px on small areas) covers the
   video. Each point holds one name, shown in the name card with a small
   square marker until the cursor moves clearly nearer another point.
   Labels, buttons, the copy and the cards are kept clear. No canvas is
   needed: a marker element sits on the point.
     4  : points over the contained frame
     4b : points over the full-bleed hero; the domain field is sized to the
          headline's width, as in Variation 3
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
  //       clear (selector of elements whose boxes stay free of names)
  function makeHover(opts) {
    var area = opts.area, tooltip = opts.tooltip;
    if (!area || !tooltip) return;
    var tipName = tooltip.querySelector(".hero-tip__name");
    var marker = document.createElement("span");
    marker.className = opts.markerClass;
    marker.setAttribute("aria-hidden", "true");
    area.appendChild(marker);

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
      var pitch = ar.width < 520 ? 22 : 28;
      var x = e.clientX - ar.left, y = e.clientY - ar.top;
      // keep the current point until the cursor is clearly nearer another one
      if (hover && Math.abs(x - hover.x) < pitch * 0.65 && Math.abs(y - hover.y) < pitch * 0.65) return;
      var ox = ar.width / 2, oy = ar.height / 2;
      var i = Math.round((x - ox) / pitch), j = Math.round((y - oy) / pitch);
      var px = ox + i * pitch, py = oy + j * pitch;
      if (px < 12 || py < 12 || px > ar.width - 12 || py > ar.height - 12 || inClear(px, py, ar)) return clearHover();
      if (hover && hover.i === i && hover.j === j) return;
      hover = { i: i, j: j, x: px, y: py };
      renderName(pointName(i, j));
      marker.style.left = px + "px";
      marker.style.top = py + "px";
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
    }
    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") onMove(e); });
    area.addEventListener("pointerleave", clearHover);
    return clearHover;
  }

  window.FrontierHeroMotion = window.FrontierHeroMotion || {};

  /* ---------------- Variation 4: the contained frame ---------------- */

  var frame = document.getElementById("hero-v4-frame");
  var clear4 = makeHover({
    area: frame,
    tooltip: document.getElementById("hero-v4-tooltip"),
    markerClass: "hero-v4__marker",
    hoverEl: frame, hoverClass: "is-hover",
    clear: ".hero-v4__hud-tl, .hero-v4__hud-bl, .hero-v4__play"
  });
  if (clear4) window.FrontierHeroMotion["4"] = { start: function () {}, stop: clear4 };

  /* ---------------- Variation 4b: full bleed ---------------- */

  var hero4b = document.getElementById("hero-v4b");
  var clear4b = makeHover({
    area: hero4b,
    tooltip: document.getElementById("hero-v4b-tooltip"),
    markerClass: "hero-v4b__marker",
    hoverEl: hero4b, hoverClass: "is-globe-hover",
    clear: "[data-globe-avoid], .hero-v2b__claim"
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
  if (hero4b) {
    window.addEventListener("resize", fitTitle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
    window.FrontierHeroMotion["4b"] = {
      start: function () { requestAnimationFrame(fitTitle); },
      stop: function () { if (clear4b) clear4b(); }
    };
  }
})();
