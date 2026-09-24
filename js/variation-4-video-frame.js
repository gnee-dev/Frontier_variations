/* ==========================================================================
   Hero · Variation 4 — "Video frame"
   Hover names over the video frame, like the other variations: an invisible
   layer of static points (28px apart, 22px on phones) covers the frame.
   Each point holds one name, shown in the name card until the cursor moves
   clearly nearer another point. The labels and the Watch brief button are
   left clear. No canvas is needed: a small marker element sits on the point.
   ========================================================================== */
(function () {
  "use strict";

  var frame = document.getElementById("hero-v4-frame");
  var tooltip = document.getElementById("hero-v4-tooltip");
  if (!frame || !tooltip) return;
  var tipName = tooltip.querySelector(".hero-tip__name");

  var marker = document.createElement("span");
  marker.className = "hero-v4__marker";
  marker.setAttribute("aria-hidden", "true");
  frame.appendChild(marker);

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

  // areas kept clear of names: the corner labels and the button
  var CLEAR = [".hero-v4__hud-tl", ".hero-v4__hud-bl", ".hero-v4__play"];
  function inClear(x, y, fr) {
    for (var i = 0; i < CLEAR.length; i++) {
      var el = frame.querySelector(CLEAR[i]);
      if (!el) continue;
      var r = el.getBoundingClientRect(), pad = 14;
      if (x > r.left - fr.left - pad && x < r.right - fr.left + pad && y > r.top - fr.top - pad && y < r.bottom - fr.top + pad) return true;
    }
    return false;
  }

  var hover = null;
  function onMove(e) {
    if (e.target.closest && e.target.closest("a, button")) return clearHover();
    var fr = frame.getBoundingClientRect();
    var pitch = fr.width < 520 ? 22 : 28;
    var x = e.clientX - fr.left, y = e.clientY - fr.top;
    // keep the current point until the cursor is clearly nearer another one
    if (hover && Math.abs(x - hover.x) < pitch * 0.65 && Math.abs(y - hover.y) < pitch * 0.65) return;
    var ox = fr.width / 2, oy = fr.height / 2;
    var i = Math.round((x - ox) / pitch), j = Math.round((y - oy) / pitch);
    var px = ox + i * pitch, py = oy + j * pitch;
    if (px < 12 || py < 12 || px > fr.width - 12 || py > fr.height - 12 || inClear(px, py, fr)) return clearHover();
    if (hover && hover.i === i && hover.j === j) return;
    hover = { i: i, j: j, x: px, y: py };
    renderName(pointName(i, j));
    marker.style.left = px + "px";
    marker.style.top = py + "px";
    frame.classList.add("is-hover");
    tooltip.classList.add("is-visible");
    var w = tooltip.offsetWidth, h = tooltip.offsetHeight;
    var tx = px + 14, ty = py - h - 14;
    if (tx + w > fr.width - 8) tx = px - w - 14;
    if (ty < 8) ty = py + 18;
    tooltip.style.setProperty("--tx", Math.round(tx) + "px");
    tooltip.style.setProperty("--ty", Math.round(ty) + "px");
  }
  function clearHover() {
    if (hover) { hover = null; tooltip.classList.remove("is-visible"); }
    frame.classList.remove("is-hover");
  }
  frame.addEventListener("pointermove", onMove);
  frame.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") onMove(e); });
  frame.addEventListener("pointerleave", clearHover);

  window.FrontierHeroMotion = window.FrontierHeroMotion || {};
  window.FrontierHeroMotion["4"] = { start: function () {}, stop: clearHover };
})();
