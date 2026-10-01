/* ==========================================================================
   How it works page (how-it-works.html). One block per animated section,
   named as in the markup (data-section) and in css/how-it-works.css:
   hiw-compare (swarm + queue), hiw-earn (deposit toggle + chart),
   hiw-back (Back buttons), hiw-priority (sticky card states),
   hiw-section-nav (floating pill, scroll-spy).
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
  function onVisible(el, cb, threshold) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); },
      { threshold: threshold || 0 }).observe(el);
  }

  /* ---------------- hiw-compare + hiw-steps: one story on one clock ----------------
     T seconds, looping. Both sides share the clock, so the same moment plays out
     two ways:
       Without Frontier  0-5 waiting for the public sale (countdown)
                         5    sale opens: everyone rushes alex.agent at once
                         5.4  a bot gets there first: Taken in 0.4s; the rest bounce off
       With Frontier     0-3.5  EARN: members' points build (dots grow)
                         3.5-5.5 BACK: everyone backs .agent (links to the name)
                         5.5-8  LINE: they line up by points; You land 2nd
                         8-11   LAUNCH: the line is served in order; #1's max falls
                                short, so the name goes to You
     The hiw-steps strip follows the With Frontier phases; a click jumps to one. */
  var compare = document.querySelector("[data-compare]");
  if (compare) (function () {
    var T = 13;
    var PH = { earn: [0, 3.5], back: [3.5, 5.5], line: [5.5, 13] };   // strip steps (LINE includes the launch)
    var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var ease = function (x) { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    var out = function (x) { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
    var lerp = function (a, b, k) { return a + (b - a) * k; };
    var rnd = (function (seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(7);

    /* ---- Without Frontier: the crowd ---- */
    var crowd = compare.querySelector("[data-crowd]");
    var cChip = crowd.querySelector("[data-chip]"), cNote = cChip.querySelector("[data-chip-note]");
    var people = [];
    for (var i = 0; i < 26; i++) {
      var bot = i >= 1 && i <= 3, you = i === 0, el = document.createElement("span");
      el.className = "hiw-dot" + (you ? " is-you" : bot ? " is-bot" : "");
      crowd.appendChild(el);
      people.push({
        el: el, you: you, bot: bot, win: i === 1,
        a: rnd() * Math.PI * 2, w: (rnd() < 0.5 ? -1 : 1) * (0.15 + rnd() * 0.35), r: 0.3 + rnd() * 0.7, j: rnd() * 6.28,
        delay: bot ? 0.02 * i : 0.1 + rnd() * 0.5, dur: bot ? 0.32 : 0.6 + rnd() * 0.7
      });
    }
    var cYou = document.createElement("span"); cYou.className = "hiw-tag hiw-tag--you"; crowd.appendChild(cYou);
    var cBot = document.createElement("span"); cBot.className = "hiw-tag hiw-tag--bot"; cBot.textContent = "bot · 0.4s"; crowd.appendChild(cBot);

    /* ---- With Frontier: the members (points: You 2nd) ---- */
    var lineEl = compare.querySelector("[data-line]");
    var lChip = lineEl.querySelector("[data-chip]"), lNote = lChip.querySelector("[data-chip-note]");
    var links = lineEl.querySelector("[data-links]");
    var POINTS = [41000, 48200, 31800, 22500, 17900, 12900, 9400, 7100, 5200, 3100];   // [0] is You
    var members = POINTS.map(function (pts, k) {
      var el = document.createElement("span");
      el.className = "hiw-dot" + (k === 0 ? " is-you" : "");
      lineEl.appendChild(el);
      var ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
      links.appendChild(ln);
      return { el: el, ln: ln, pts: pts, you: k === 0, top: k === 1, sx: rnd(), sy: rnd(), j: rnd() * 6.28 };
    });
    var order = members.slice().sort(function (a, b) { return b.pts - a.pts; });
    order.forEach(function (m, r) { m.rank = r; });
    var lYou = document.createElement("span"); lYou.className = "hiw-tag hiw-tag--you"; lineEl.appendChild(lYou);
    var lTop = document.createElement("span"); lTop.className = "hiw-tag hiw-tag--miss"; lTop.textContent = "max below price"; lineEl.appendChild(lTop);

    /* ---- status chips, strip ---- */
    var stWithout = compare.querySelector('[data-status="without"]'), stWith = compare.querySelector('[data-status="with"]');
    var strip = document.querySelector("[data-steps]");
    var stepEls = strip ? strip.querySelectorAll("[data-phase]") : [];
    var setText = function (el, txt) { if (el && el.textContent !== txt) el.textContent = txt; };
    var fmtPts = function (n) { return Math.round(n / 100) * 100 >= 1000 ? Math.round(n).toLocaleString("en-US") : Math.round(n); };

    function render(t) {
      /* Without Frontier */
      var W = crowd.clientWidth, H = crowd.clientHeight, cx = W / 2, cy = H / 2;
      var hw = cChip.offsetWidth / 2 + 5, hh = cChip.offsetHeight / 2 + 5;
      var inX = hw + 22, inY = hh + 14, outX = Math.min(W * 0.46, 240), outY = H * 0.5 - 16;
      var taken = t >= 5.4;
      people.forEach(function (p) {
        var a = p.a + p.w * t;
        var r = p.r + 0.08 * Math.sin(t * 0.9 + p.j);
        var hx = cx + Math.cos(a) * lerp(inX, outX, r), hy = cy + Math.sin(a) * lerp(inY, outY, r);
        // the rush: straight at the name's edge; the bots get there first
        var k = ease((t - 5 - p.delay) / p.dur);
        if (t > 5.5 && !p.win) k *= 1 - out((t - 5.5 - p.delay * 0.6) / 1.6);       // bounce back off
        var ang = Math.atan2(hy - cy, hx - cx);
        var ex = cx + Math.cos(ang) * hw * 1.02, ey = cy + Math.sin(ang) * hh * 1.25;
        var x = lerp(hx, ex, k), y = lerp(hy, ey, k);
        if (t > 4.4 && t < 5) { x += Math.sin(t * 40 + p.j) * 0.8; }                // restless just before
        p.el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
        p.el.classList.toggle("is-dim", taken && !p.win && !p.you);
        if (p.you) { cYou.style.transform = "translate(" + (x - 12).toFixed(1) + "px," + (y - 22).toFixed(1) + "px)"; }
      });
      setText(cYou, taken ? "You · missed it" : "You");
      // the winning bot's tag sits just above the taken name (clear of the crowd's labels)
      cBot.style.transform = "translate(" + (cx + hw - 40).toFixed(1) + "px," + (cy - hh - 22).toFixed(1) + "px)";
      cBot.classList.toggle("is-on", taken);
      cChip.classList.toggle("is-taken", taken);
      cChip.classList.toggle("is-open", t >= 5 && !taken);
      setText(cNote, taken ? "Taken" : t >= 5 ? "Open" : "");
      setText(stWithout, t < 5 ? "Public sale in 0:0" + Math.max(1, Math.ceil(5 - t)) : taken ? "Taken in 0.4s" : "Sale opens · everyone clicks");
      stWithout.classList.toggle("is-bad", taken);

      /* With Frontier */
      var W2 = lineEl.clientWidth, H2 = lineEl.clientHeight, cy2 = H2 / 2;
      var chipL = Math.min(W2 * 0.06, 22), chipW = lChip.offsetWidth, chipR = chipL + chipW;
      lChip.style.left = chipL + "px";
      var gap = Math.min(34, (W2 - chipR - 30) / members.length);
      var earn = ease(t / 3.5), back = clamp((t - 3.5) / 1.2) * (1 - clamp((t - 6) / 0.8));
      var lineK = ease((t - 5.5) / 1.8);
      var miss = out((t - 8.4) / 0.6), shift = ease((t - 8.9) / 0.6), win = ease((t - 9.6) / 0.7);
      var fade = 1 - clamp((t - 12.4) / 0.6);
      links.setAttribute("viewBox", "0 0 " + W2 + " " + H2);
      members.forEach(function (m) {
        // scattered across the field, each growing with its points
        var fx = chipR + 40 + m.sx * (W2 - chipR - 70), fy = 22 + m.sy * (H2 - 44);
        fx += Math.sin(t * 0.8 + m.j) * 4; fy += Math.cos(t * 0.7 + m.j) * 4;
        var slot = m.rank - (m.rank > 0 ? shift : 0);
        var qx = chipR + 22 + slot * gap, qy = cy2;
        var x = lerp(fx, qx, lineK), y = lerp(fy, qy, lineK);
        if (m.top) { y += miss * 30; x += miss * 6; }                                  // #1 steps out: max below price
        if (m.you) { x = lerp(x, chipR + 12, win); y = lerp(y, cy2, win); }             // You step up to the name
        var size = 3 + 9 * Math.sqrt(m.pts / 48200) * earn;                             // grows with points
        m.el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + (size / 8).toFixed(3) + ")";
        m.el.classList.toggle("is-dim", (m.top && miss > 0.5) || (win > 0.5 && !m.you));
        m.ln.setAttribute("x1", chipR); m.ln.setAttribute("y1", cy2);
        m.ln.setAttribute("x2", x.toFixed(1)); m.ln.setAttribute("y2", y.toFixed(1));
        m.ln.style.opacity = (back * 0.5).toFixed(2);
        if (m.you) lYou.style.transform = "translate(" + (x - 16).toFixed(1) + "px," + (y - 26).toFixed(1) + "px)";
        if (m.top) lTop.style.transform = "translate(" + (x - 40).toFixed(1) + "px," + (y + 9).toFixed(1) + "px)";
      });
      var youPts = POINTS[0] * earn;
      setText(lYou, win > 0.5 ? "You · registered" : t >= 7 ? "You · #" + (shift > 0.5 ? 1 : 2) + " in line" : "You · " + fmtPts(youPts) + " pts");
      lTop.classList.toggle("is-on", miss > 0.3);
      lChip.classList.toggle("is-yours", win > 0.5);
      lChip.classList.toggle("is-backed", back > 0.4);
      setText(lNote, win > 0.5 ? "Yours" : back > 0.4 ? members.length + " backing" : "");
      setText(stWith, t < 3.5 ? "Earning points" : t < 5.5 ? "Backing .agent" : t < 8 ? "Lining up by points" : win > 0.5 ? "Registered before the public sale" : "Served in order");
      lineEl.style.opacity = fade.toFixed(2);
      crowd.style.opacity = fade.toFixed(2);

      /* the strip */
      stepEls.forEach(function (li) {
        var ph = PH[li.dataset.phase], on = t >= ph[0] && t < ph[1];
        li.classList.toggle("is-active", on);
        li.classList.toggle("is-done", t >= ph[1]);
        li.style.setProperty("--p", on ? ((t - ph[0]) / (ph[1] - ph[0])).toFixed(3) : t >= ph[1] ? 1 : 0);
      });
    }

    // the clock: runs while the panel is on screen; a click on a step jumps to it
    var t = 0, last = 0, running = false;
    var frame = function (now) {
      if (!running) return;
      t = (t + Math.min(0.05, (now - last) / 1000)) % T; last = now;
      render(t);
      requestAnimationFrame(frame);
    };
    stepEls.forEach(function (li) {
      li.querySelector("a").addEventListener("click", function (e) {
        if (reduce) return;
        var rect = compare.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {   // the animation is on screen: jump to the step there
          e.preventDefault();
          t = PH[li.dataset.phase][0] + 0.01;
          render(t);
        }
      });
    });
    compare.hiwSeek = function (x) { t = x; render(x); };   // for checks: show the moment x seconds in
    if (reduce) { render(10.6); return; }           // still: the outcome of both sides
    render(0);
    onVisible(compare, function (on) {
      if (on && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
      else if (!on) running = false;
    });
  })();

  /* ---------------- hiw-earn: deposit toggle + chart ----------------
     The lines keep their shape (points scale with the deposit); the labels
     and the axis count to the new values. */
  var chart = document.querySelector("[data-chart]");
  var seg = document.querySelectorAll("[data-deposit]");
  if (chart && seg.length) {
    var ends = chart.querySelectorAll(".hiw-chart__ends b");
    var ys = chart.querySelectorAll(".hiw-chart__y");
    var axis = function (v) { return v >= 1e6 ? (v / 1e6).toString().replace(/\.0$/, "") + "M" : Math.round(v / 1000) + "K"; };
    var k = 1, anim = 0;
    var setDeposit = function (amount) {
      var from = k, to = amount / 100, t0 = performance.now(), dur = reduce ? 0 : 700;
      k = to;
      cancelAnimationFrame(anim);
      ys[0].textContent = axis(120000 * to);
      ys[1].textContent = axis(60000 * to);
      (function step(now) {
        var t = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - t, 3), m = from + (to - from) * e;
        ends.forEach(function (b) { b.textContent = fmt(+b.dataset.value * m); });
        if (t < 1) anim = requestAnimationFrame(step);
      })(t0);
      // redraw the lines briefly so the change reads as a recalculation
      chart.classList.remove("is-visible"); void chart.offsetWidth; chart.classList.add("is-visible");
    };
    seg.forEach(function (b) {
      b.addEventListener("click", function () {
        seg.forEach(function (o) { var on = o === b; o.classList.toggle("is-on", on); o.setAttribute("aria-checked", on ? "true" : "false"); });
        setDeposit(+b.dataset.deposit);
      });
    });
  }

  /* ---------------- hiw-back: Back buttons (add or remove your backing) ---------------- */
  document.querySelectorAll(".hiw-backed__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var c = btn.parentNode.querySelector(".hiw-backed__count"), on = !btn.classList.contains("is-backed");
      var n = +c.dataset.count + (on ? 1 : 0);
      btn.classList.toggle("is-backed", on);
      btn.textContent = on ? "Backed" : "Back";
      c.textContent = fmt(n) + " backers";
    });
  });

  /* ---------------- hiw-priority: the alex.agent card follows the steps ----------------
     State 1 price locked (rows sealed), 2 members commit (as they arrive),
     3 ranked by points, 4 the result. Rows slide to their new order. */
  var card = document.querySelector("[data-card]");
  var steps = document.querySelectorAll(".hiw-priority__steps [data-step]");
  if (card && steps.length) {
    var ARRIVAL = ["lark", "kestrel", "you", "nomad", "orbiter"];
    var RANKED = ["orbiter", "you", "kestrel", "nomad", "lark"];
    var rows = {};
    card.querySelectorAll(".hiw-card__rows li").forEach(function (li) { rows[li.dataset.m] = li; });
    var setState = function (s) {
      if (card.dataset.state === String(s)) return;
      card.dataset.state = s;
      var order = s >= 3 ? RANKED : ARRIVAL;
      order.forEach(function (m, idx) {
        rows[m].style.setProperty("--o", idx);
        rows[m].querySelector(".hiw-card__rank").textContent = idx + 1;
      });
      steps.forEach(function (st) { st.classList.toggle("is-active", +st.dataset.step === s); });
    };
    setState(1);
    var pick = function () {
      var mid = window.innerHeight * (window.innerWidth <= 900 ? 0.72 : 0.55), s = 1;
      steps.forEach(function (st) { if (st.getBoundingClientRect().top < mid) s = +st.dataset.step; });
      setState(s);
    };
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    pick();
  }

  /* ---------------- hiw-section-nav: the floating pill (shows after the hero, follows the sections) ---------------- */
  var spy = document.querySelector(".hiw-section-nav");
  if (spy) {
    var links = spy.querySelectorAll("[data-spy]");
    var hero = document.getElementById("hero-v4b");
    var targets = Array.prototype.map.call(links, function (a) { return document.getElementById(a.dataset.spy); });
    var update = function () {
      spy.classList.toggle("is-shown", !hero || window.scrollY > hero.offsetHeight * 0.35);
      var line = window.innerHeight * 0.4, cur = 0;
      targets.forEach(function (t, idx) { if (t && t.getBoundingClientRect().top < line) cur = idx; });
      links.forEach(function (a, idx) { a.classList.toggle("is-active", idx === cur); });
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }
})();
