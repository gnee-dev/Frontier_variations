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

  /* ---------------- hiw-compare: Without Frontier (swarm) ----------------
     Dots crowd around the taken name; one of them (orange) is You. Each dot
     drifts on its own slow orbit around the name, outside the name's box. */
  var swarm = document.querySelector("[data-swarm]");
  if (swarm) {
    var dots = [], N = 34, running = false, last = 0;
    for (var i = 0; i < N; i++) {
      var d = document.createElement("span");
      d.className = "hiw-swarm__dot" + (i === 0 ? " is-you" : "");
      swarm.appendChild(d);
      dots.push({
        el: d,
        a: Math.random() * Math.PI * 2,
        w: (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.55),   // radians per second
        r: 0.25 + Math.random() * 0.75,                                        // 0..1 between the name and the edge
        rw: 0.6 + Math.random() * 1.2, rp: Math.random() * 6.28,
        j: Math.random() * 6.28
      });
    }
    var youLabel = document.createElement("span");
    youLabel.className = "hiw-swarm__you";
    youLabel.textContent = "You";
    swarm.appendChild(youLabel);

    var place = function (t) {
      var W = swarm.clientWidth, H = swarm.clientHeight, cx = W / 2, cy = H / 2;
      var inX = 90, inY = 30, outX = Math.min(W * 0.42, 210), outY = H * 0.5 - 30;   // the "You" label stays inside the stage   // keep clear of the name pill
      dots.forEach(function (p, k) {
        var r = p.r + 0.12 * Math.sin(t * p.rw + p.rp);
        var rx = inX + (outX - inX) * r, ry = inY + (outY - inY) * r;
        var x = cx + Math.cos(p.a) * rx + Math.sin(t * 3 + p.j) * 2.5;          // a little jitter: the clicking
        var y = cy + Math.sin(p.a) * ry + Math.cos(t * 2.6 + p.j) * 2.5;
        p.el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
        if (k === 0) youLabel.style.transform = "translate(" + (x - 10).toFixed(1) + "px," + (y - 22).toFixed(1) + "px)";
      });
    };
    var tick = function (now) {
      if (!running) return;
      var dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      dots.forEach(function (p) { p.a += p.w * dt; });
      place(now / 1000);
      requestAnimationFrame(tick);
    };
    place(0);
    if (!reduce) onVisible(swarm, function (on) {
      if (on && !running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
      else if (!on) running = false;
    });
  }

  /* ---------------- hiw-compare: With Frontier (queue) ---------------- */
  var queue = document.querySelector("[data-queue]");
  if (queue) {
    var line = queue.querySelector(".hiw-queue__line");
    for (var q = 0; q < 19; q++) {
      var li = document.createElement("li");
      li.style.setProperty("--i", q);
      if (q === 1) li.className = "is-you";
      line.appendChild(li);
    }
    onVisible(queue, function (on) { if (on) queue.classList.add("is-on"); }, 0.3);
  }

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
