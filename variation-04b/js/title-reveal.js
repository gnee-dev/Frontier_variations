/* ==========================================================================
   Title reveal: every section title and subtitle below the hero fades in from
   the bottom as it scrolls into view (the subtitle a beat after its title).
   The heroes already rise on load (data-anim="rise"). Styles: .t-rise in base.css.
   Without IntersectionObserver, or with reduced motion, nothing is hidden.
   ========================================================================== */
(function () {
  "use strict";
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var TITLES = ".section-head__title, .banner__title, .hiw-title, .hiw-registries__title, .v2-sh__title";
  var SUBTITLES = ".section-head__desc, .hiw-desc, .vault-lede, .v2-sh__subtitle";
  var els = Array.prototype.filter.call(document.querySelectorAll(TITLES + ", " + SUBTITLES), function (el) {
    return !el.closest(".hero");
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -40px 0px" });

  els.forEach(function (el) {
    el.classList.add("t-rise");
    if (el.matches(SUBTITLES)) el.classList.add("t-rise--sub");
    io.observe(el);
  });
})();
