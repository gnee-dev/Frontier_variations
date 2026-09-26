/* ==========================================================================
   Frontier Lander — page behaviour
   - Variation tabs in the nav (persisted in the URL hash: #v1, #v1b, #v2, #v2b, #v3, #v3b, #v3c, #v4, #v4b)
   - Hero entrance, typing domain, counters
   - Scroll reveals, card sheen
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Variation tabs ---------------- */

  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-variation-tab]"));
  var heroes = Array.prototype.slice.call(document.querySelectorAll("[data-hero]"));
  var indicator = document.querySelector(".variation-tabs__indicator");

  function moveIndicator(tab) {
    if (!indicator || !tab) return;
    indicator.style.width = tab.offsetWidth + "px";
    indicator.style.transform = "translateX(" + tab.offsetLeft + "px)";
  }

  // Tab names open and close as the active tab changes (see .variation-tabs__name),
  // so the tab being slid to is still changing size: glide the indicator from where
  // it is to the tab's live position and width, over the names' 0.45s.
  var glideId = 0;
  function glideIndicator(tab) {
    if (!indicator || !tab) return;
    cancelAnimationFrame(glideId);
    var x0 = indicator.offsetLeft + (new DOMMatrixReadOnly(getComputedStyle(indicator).transform).m41 || 0);
    var w0 = indicator.offsetWidth, t0 = performance.now(), dur = 450;
    indicator.style.transition = "none";
    (function step(now) {
      var t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
      indicator.style.width = (w0 + (tab.offsetWidth - w0) * e) + "px";
      indicator.style.transform = "translateX(" + (x0 + (tab.offsetLeft - x0) * e) + "px)";
      if (t < 1) glideId = requestAnimationFrame(step);
      else indicator.style.transition = "";
    })(t0);
  }

  // A hero can serve several tabs: data-hero="1 1b" (1b is a colour theme of hero 1)
  function heroServes(hero, id) { return hero.dataset.hero.split(" ").indexOf(id) !== -1; }

  function setVariation(id, opts) {
    id = String(id);
    if (!heroes.some(function (h) { return heroServes(h, id); })) id = "1";
    document.body.dataset.variation = id;

    tabs.forEach(function (tab) {
      var on = tab.dataset.variationTab === id;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      if (on) glideIndicator(tab);
    });

    heroes.forEach(function (hero) {
      var on = heroServes(hero, id);
      hero.hidden = !on;
      hero.classList.remove("is-entered");
      if (on) {
        void hero.offsetWidth; // restart entrance animation
        hero.classList.add("is-entered");
        runCounters(hero);
      }
    });

    // Each hero's motion script registers itself in window.FrontierHeroMotion under
    // the hero's first id; stop the others first, then (re)start the active one so
    // it re-reads theme colours when switching between tabs that share a hero
    var active = heroes.filter(function (h) { return heroServes(h, id); })[0];
    var motionKey = active ? active.dataset.hero.split(" ")[0] : id;
    var motion = window.FrontierHeroMotion || {};
    Object.keys(motion).forEach(function (key) { motion[key].stop(); });
    if (motion[motionKey]) motion[motionKey].start();
    typer.stop();
    typer.start(active && active.querySelector(".domain-box__text"));

    if (!opts || !opts.silent) history.replaceState(null, "", "#v" + id);
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      setVariation(tab.dataset.variationTab);
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    tab.addEventListener("keydown", function (e) {
      var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });

  window.addEventListener("resize", function () {
    moveIndicator(document.querySelector(".variation-tabs__tab.is-active"));
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      moveIndicator(document.querySelector(".variation-tabs__tab.is-active"));
    });
  }

  /* ---------------- Typing domain (whichever hero is active) ---------------- */

  var typer = (function () {
    var el = null;
    var words = ["vault.crypto", "gen.wealth", "burner.wallet", "anon.agent", "satoshi.btc", "swarm.robot", "degen.sol"];
    var wordIdx = 0;
    var charIdx = words[0].length;
    var deleting = false;
    var timer = 0;
    var active = false;

    // Name part as plain text, TLD in a .tld span. data-dot="name" keeps the
    // dot with the name ("vault." + "crypto"), otherwise it goes with the TLD.
    function render(text) {
      var dot = text.indexOf(".");
      if (dot === -1) { el.textContent = text; return; }
      var cut = el.dataset.dot === "name" ? dot + 1 : dot;
      el.innerHTML = "";
      el.appendChild(document.createTextNode(text.slice(0, cut)));
      var tld = document.createElement("span");
      tld.className = "tld";
      tld.textContent = text.slice(cut);
      el.appendChild(tld);
    }

    function tick() {
      if (!active) return;
      var word = words[wordIdx];
      var delay;
      if (!deleting) {
        charIdx++;
        render(word.slice(0, charIdx));
        if (charIdx >= word.length) { deleting = true; delay = 2200; }
        else delay = 70 + Math.random() * 60;
      } else {
        charIdx--;
        render(word.slice(0, charIdx));
        if (charIdx <= 0) {
          deleting = false;
          wordIdx = (wordIdx + 1) % words.length;
          delay = 280;
        } else delay = 34;
      }
      timer = setTimeout(tick, delay);
    }

    return {
      start: function (target) {
        if (!target || active) return;
        el = target;
        if (reduceMotion) { render(words[0]); return; }
        active = true;
        wordIdx = 0;
        charIdx = words[0].length;
        deleting = true;
        render(words[0]);
        timer = setTimeout(tick, 2600);
      },
      stop: function () {
        active = false;
        clearTimeout(timer);
        if (el) render(words[0]);
      }
    };
  })();

  /* ---------------- Countdowns ([data-countdown-to="ISO date"]) ---------------- */

  var countdowns = document.querySelectorAll("[data-countdown-to]");
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function tickCountdowns() {
    var now = Date.now();
    countdowns.forEach(function (el) {
      var left = Math.max(0, Date.parse(el.dataset.countdownTo) - now);
      var mins = Math.floor(left / 60000);
      var d = Math.floor(mins / 1440);
      var h = Math.floor((mins % 1440) / 60);
      var m = mins % 60;
      el.textContent = d + "d " + pad2(h) + "h " + pad2(m) + "m";
    });
  }
  if (countdowns.length) {
    tickCountdowns();
    setInterval(tickCountdowns, 15000);
  }

  /* ---------------- Counters ---------------- */

  var fmt = new Intl.NumberFormat("en-US");

  function countUp(el) {
    var to = parseFloat(el.dataset.countTo);
    var suffix = el.dataset.countSuffix || "";
    if (reduceMotion || isNaN(to)) { el.textContent = fmt.format(to) + suffix; return; }
    var dur = 1600;
    var t0 = performance.now();
    function step(t) {
      var k = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt.format(Math.round(to * eased)) + suffix;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function runCounters(scope) {
    scope.querySelectorAll("[data-count-to]").forEach(function (el) {
      el.textContent = "0" + (el.dataset.countSuffix || "");
      setTimeout(function () { countUp(el); }, 700);
    });
  }

  /* ---------------- Scroll reveal ---------------- */

  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        entry.target.querySelectorAll("[data-count-to]").forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) {
      // Counters outside the hero start at 0 and count when revealed
      el.querySelectorAll("[data-count-to]").forEach(function (c) { c.textContent = "0"; });
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- Card sheen follows cursor ---------------- */

  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---------------- Boot ---------------- */

  var fromHash = (location.hash.match(/^#v([1-3][bc]?|4b?)$/) || [])[1] || "1";
  setVariation(fromHash, { silent: true });
})();
