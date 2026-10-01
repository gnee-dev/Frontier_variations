/* ==========================================================================
   Vaults dropdown in the nav (every 04b page): a button that opens a small
   menu of the vault pages (Solana, Hyperliquid). Opens on click (and on
   hover with a mouse), closes on a click outside, Escape, or leaving it.
   ========================================================================== */
(function () {
  "use strict";

  document.querySelectorAll("[data-dropdown]").forEach(function (dd) {
    var btn = dd.querySelector(".nav__drop-btn");
    var menu = dd.querySelector(".nav__menu");
    if (!btn || !menu) return;
    var closeTimer = 0;

    function set(open) {
      clearTimeout(closeTimer);
      dd.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      // with a mouse the hover has already opened it: a click keeps it open
      var open = dd.classList.contains("is-open");
      set(e.pointerType === "mouse" ? true : !open);
    });
    // mouse: open on hover, close shortly after leaving (so the gap to the menu is forgiving)
    dd.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") set(true); });
    dd.addEventListener("pointerleave", function (e) {
      if (e.pointerType !== "mouse") return;
      closeTimer = setTimeout(function () { set(false); }, 180);
    });
    document.addEventListener("click", function (e) { if (!dd.contains(e.target)) set(false); });
    dd.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && dd.classList.contains("is-open")) { set(false); btn.focus(); }
    });
    dd.addEventListener("focusout", function (e) { if (!dd.contains(e.relatedTarget)) set(false); });
  });
})();
