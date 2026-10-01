/* ==========================================================================
   v2-how: the How it works section on v2.html
   Renders the lists from js/v2-config.js (assets, the formula's multiplier,
   backers, the estimator's chips) and runs the points estimator:
     perDay = deposit × EPOCH_MULTIPLIER, total = perDay × days
   "Until epoch ends" is the days left until EPOCH_END, worked out live.
   ========================================================================== */
(function () {
  "use strict";

  var C = window.FRONTIER_V2_CONFIG;
  var root = document.querySelector('[data-section="v2-how"]');
  if (!C || !root) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var make = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  /* ---- card 1: asset pills, then "+ more" ---- */
  var assets = root.querySelector("[data-assets]");
  if (assets) {
    assets.replaceChildren();
    C.ASSETS.forEach(function (a) { assets.appendChild(make("li", "v2-asset", a)); });
    assets.appendChild(make("li", "v2-asset v2-asset--more", "+ more"));
  }

  /* ---- card 2: the formula's multiplier ---- */
  var mult = root.querySelector("[data-mult]"), multPts = root.querySelector("[data-mult-pts]");
  if (mult) mult.textContent = C.EPOCH_MULTIPLIER + "×";
  if (multPts) multPts.textContent = fmt(C.EPOCH_MULTIPLIER) + " pts";

  /* ---- card 3: backers, each fill against the most backed ---- */
  var backers = root.querySelector("[data-backers]");
  if (backers) {
    // the three most backed (extensions without a published count are left out)
    var top = C.EXTENSIONS.filter(function (e) { return e.backers != null; })
                          .sort(function (x, y) { return y.backers - x.backers; }).slice(0, 3);
    var max = Math.max.apply(null, top.map(function (e) { return e.backers; }));
    backers.replaceChildren();
    top.forEach(function (e) {
      var li = make("li");
      li.appendChild(make("span", "v2-backers__tld", e.tld));
      var track = make("span", "v2-backers__track"), fill = make("i");
      fill.style.setProperty("--w", (e.backers / max * 100).toFixed(1) + "%");
      track.appendChild(fill);
      li.appendChild(track);
      li.appendChild(make("span", "v2-backers__n", fmt(e.backers) + " backers"));
      backers.appendChild(li);
    });
  }

  /* ---- the estimator ---- */
  var est = root.querySelector("[data-estimator]");
  if (!est) return;
  var E = C.ESTIMATOR;
  var daysToEpochEnd = function () {
    return Math.max(0, Math.ceil((new Date(C.EPOCH_END).getTime() - Date.now()) / 86400000));
  };
  var holdDays = function (v) { return v === "epoch" ? daysToEpochEnd() : +v; };

  // the chips, from the config (the markup holds the same defaults)
  var depGroup = est.querySelector('[data-est="deposit"]'), holdGroup = est.querySelector('[data-est="hold"]');
  depGroup.replaceChildren();
  E.DEPOSITS.forEach(function (d) {
    depGroup.appendChild(window.FrontierV2.chip({ label: "$" + fmt(d), value: d, pressed: d === E.DEFAULT_DEPOSIT }));
  });
  holdGroup.replaceChildren();
  E.HOLDS.forEach(function (h) {
    var chip = window.FrontierV2.chip({ label: h.label, value: h.days, pressed: h.days === E.DEFAULT_HOLD });
    if (h.days === "epoch") chip.setAttribute("aria-description", daysToEpochEnd() + " days left in Epoch " + C.EPOCH);
    holdGroup.appendChild(chip);
  });

  var totalEl = est.querySelector("[data-est-total]"), rateEl = est.querySelector("[data-est-rate]");
  var live = est.querySelector("[aria-live]");   // busy while counting, so it's read once, at the final number
  var pressed = function (g) { var c = g.querySelector('[aria-pressed="true"]'); return c ? c.value : null; };
  var shown = 0, anim = 0;
  function update(animate) {
    var amount = +pressed(depGroup), days = holdDays(pressed(holdGroup));
    var perDay = amount * C.EPOCH_MULTIPLIER, total = perDay * days;
    rateEl.textContent = fmt(perDay) + " pts/day at Epoch " + C.EPOCH + "’s " + C.EPOCH_MULTIPLIER + "× rate";
    cancelAnimationFrame(anim);
    if (!animate || reduce) { shown = total; totalEl.textContent = fmt(total); live.setAttribute("aria-busy", "false"); return; }
    live.setAttribute("aria-busy", "true");
    // a short count-up (~300ms) from what's on screen to the new total
    var from = shown, t0 = performance.now(), dur = 300;
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      shown = from + (total - from) * e;
      totalEl.textContent = fmt(shown);
      if (k < 1) anim = requestAnimationFrame(step);
      else { shown = total; live.setAttribute("aria-busy", "false"); }
    })(t0);
  }
  est.addEventListener("chipchange", function () { update(true); });
  update(false);
})();

/* ---- the closing panel: the epoch pill (live days left) and the name field ---- */
(function () {
  "use strict";
  var C = window.FRONTIER_V2_CONFIG;
  if (!C) return;
  var days = Math.max(0, Math.ceil((new Date(C.EPOCH_END).getTime() - Date.now()) / 86400000));
  var pill = document.querySelector("[data-cta-epoch]");
  if (pill) pill.textContent = "Epoch " + C.EPOCH + " · " + C.EPOCH_MULTIPLIER + "× points · " + days + " days left";
  var form = document.querySelector("[data-cta-form]");
  if (!form) return;
  var input = form.querySelector("input");
  // names are letters, digits and hyphens: drop anything else as it's typed
  input.addEventListener("input", function () {
    var v = input.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (v !== input.value) input.value = v;
    input.parentNode.setAttribute("data-value", v || input.placeholder);
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!input.value) { input.focus(); return; }
    location.hash = "join";
  });
})();
