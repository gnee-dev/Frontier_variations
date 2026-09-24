/* ==========================================================================
   Frontier Lander — page behaviour
   - Variation tabs in the nav (persisted in the URL hash: #v1 / #v2 / #v3)
   - Hero entrance, typing domain, counters
   - Scroll reveals, card sheen, nav state, banner parallax
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

  function setVariation(id, opts) {
    id = String(id);
    if (!heroes.some(function (h) { return h.dataset.hero === id; })) id = "1";
    document.body.dataset.variation = id;

    tabs.forEach(function (tab) {
      var on = tab.dataset.variationTab === id;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      if (on) moveIndicator(tab);
    });

    heroes.forEach(function (hero) {
      var on = hero.dataset.hero === id;
      hero.hidden = !on;
      hero.classList.remove("is-entered");
      if (on) {
        void hero.offsetWidth; // restart entrance animation
        hero.classList.add("is-entered");
        runCounters(hero);
      }
    });

    if (window.FrontierGlobe) {
      if (id === "1") window.FrontierGlobe.start();
      else window.FrontierGlobe.stop();
    }
    if (id === "1") typer.start(); else typer.stop();

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

  /* ---------------- Typing domain (hero v1) ---------------- */

  var typer = (function () {
    var el = document.getElementById("hero-domain");
    var words = ["vault.crypto", "gen.wealth", "burner.wallet", "anon.agent", "satoshi.btc", "swarm.robot", "degen.sol"];
    var wordIdx = 0;
    var charIdx = words[0].length;
    var deleting = false;
    var timer = 0;
    var active = false;

    function render(text) {
      var dot = text.indexOf(".");
      if (dot === -1) { el.textContent = text; return; }
      el.innerHTML = "";
      el.appendChild(document.createTextNode(text.slice(0, dot)));
      var tld = document.createElement("span");
      tld.className = "tld";
      tld.textContent = text.slice(dot);
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
      start: function () {
        if (!el || reduceMotion || active) return;
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

  /* ---------------- Nav + parallax on scroll ---------------- */

  var nav = document.getElementById("nav");
  var bannerMedia = document.querySelector(".banner__media");
  var ticking = false;

  function onScroll() {
    ticking = false;
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
    if (bannerMedia && !reduceMotion) {
      var r = bannerMedia.parentElement.getBoundingClientRect();
      var progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      bannerMedia.style.setProperty("--parallax", (progress * -40).toFixed(1) + "px");
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------------- Boot ---------------- */

  var fromHash = (location.hash.match(/^#v([123])$/) || [])[1] || "1";
  setVariation(fromHash, { silent: true });
})();
