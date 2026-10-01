/* ==========================================================================
   v2 — shared components for the redesigned sections (v2.html)
   - FrontierV2.SectionHeader(props) → <header class="v2-section-header">
   - FrontierV2.Chip(props)          → <button class="v2-chip" aria-pressed>
   - Chip toggling: any .v2-chip on the page flips aria-pressed on click and
     fires a "chipchange" event ({ detail: { pressed } }). A chip inside a
     [data-chip-group="single"] container unpresses its siblings.
   Styles in css/v2.css.
   ========================================================================== */
(function () {
  "use strict";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* props: { eyebrow, title, subtitle?, link?: { label, href }, rightSlot?: Node } */
  function SectionHeader(props) {
    var header = el("header", "v2-section-header");
    var main = el("div", "v2-section-header__main");
    if (props.eyebrow) main.appendChild(el("p", "v2-section-header__eyebrow", props.eyebrow));
    main.appendChild(el("h2", "v2-section-header__title", props.title));
    if (props.subtitle) main.appendChild(el("p", "v2-section-header__subtitle", props.subtitle));
    header.appendChild(main);

    if (props.rightSlot) {
      var slot = el("div", "v2-section-header__slot");
      slot.appendChild(props.rightSlot);
      header.appendChild(slot);
    } else if (props.link) {
      var a = el("a", "v2-section-header__link", props.link.label + " ");
      a.href = props.link.href;
      a.appendChild(el("span", null, "→")).setAttribute("aria-hidden", "true");
      header.appendChild(a);
    }
    return header;
  }

  /* props: { label, pressed?: boolean, value?, onChange?: (pressed) => void } */
  function Chip(props) {
    var button = el("button", "v2-chip", props.label);
    button.type = "button";
    button.setAttribute("aria-pressed", props.pressed ? "true" : "false");
    if (props.value != null) button.value = props.value;
    if (props.onChange) {
      button.addEventListener("chipchange", function (e) { props.onChange(e.detail.pressed); });
    }
    return button;
  }

  function setPressed(chip, on) {
    if ((chip.getAttribute("aria-pressed") === "true") === on) return;
    chip.setAttribute("aria-pressed", on ? "true" : "false");
    chip.dispatchEvent(new CustomEvent("chipchange", { bubbles: true, detail: { pressed: on } }));
  }

  document.addEventListener("click", function (e) {
    var chip = e.target.closest && e.target.closest(".v2-chip");
    if (!chip || chip.disabled) return;
    var group = chip.closest("[data-chip-group]");
    if (group && group.dataset.chipGroup === "single") {
      group.querySelectorAll(".v2-chip").forEach(function (other) { setPressed(other, other === chip); });
    } else {
      setPressed(chip, chip.getAttribute("aria-pressed") !== "true");
    }
  });

  window.FrontierV2 = { SectionHeader: SectionHeader, Chip: Chip };
})();
