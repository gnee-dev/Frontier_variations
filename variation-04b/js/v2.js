/* ==========================================================================
   v2: reusable components for the sections below the hero (v2.html)
   Styles in css/v2.css; tokens in css/base.css (--v2-*).

   <f-section-header>  SectionHeader
     attributes  eyebrow, title, subtitle (optional), link-label + link-href (optional)
     rightSlot   any child with slot="right" replaces the link
     <f-section-header eyebrow="How it works"
                       title="Deposit, earn points, back the names you want"
                       subtitle="Frontier gives you priority access to new top-level domains."
                       link-label="Full walkthrough" link-href="how-it-works.html"></f-section-header>
     It renders plain markup (header > h2 ...) in place, so it styles and reads
     like any heading. FrontierV2.sectionHeader({...}) builds the same element.

   .v2-chip  Chip (a toggle <button> with aria-pressed)
     <div class="v2-chip-group" data-chip-group="single" role="group" aria-label="Deposit">
       <button type="button" class="v2-chip" aria-pressed="true" value="2000">$2,000</button> ...
     </div>
     data-chip-group="single": one pressed at a time; "multi": each toggles alone.
     The group fires "chipchange" with detail { value, values, chip }.
     FrontierV2.chip({ label, value, pressed }) builds one.
   ========================================================================== */
(function () {
  "use strict";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------------- SectionHeader ---------------- */
  function buildHeader(o) {
    var header = el("header", "v2-sh");
    var text = el("div", "v2-sh__text");
    if (o.eyebrow) text.appendChild(el("p", "v2-sh__eyebrow", o.eyebrow));
    var h = el("h2", "v2-sh__title", o.title || "");
    if (o.titleId) h.id = o.titleId;
    text.appendChild(h);
    if (o.subtitle) text.appendChild(el("p", "v2-sh__subtitle", o.subtitle));
    header.appendChild(text);
    // the right side: rightSlot if given, else the link
    var right = null;
    if (o.rightSlot) {
      right = el("div", "v2-sh__right");
      right.appendChild(o.rightSlot);
    } else if (o.link && o.link.label && o.link.href) {
      right = el("div", "v2-sh__right");
      var a = el("a", "v2-link", o.link.label);
      a.href = o.link.href;
      right.appendChild(a);
    }
    if (right) header.appendChild(right);
    return header;
  }

  if (window.customElements && !customElements.get("f-section-header")) {
    customElements.define("f-section-header", class extends HTMLElement {
      connectedCallback() {
        if (this._done) return;
        this._done = true;
        var slot = this.querySelector('[slot="right"]');
        if (slot) slot.removeAttribute("slot");
        var header = buildHeader({
          eyebrow: this.getAttribute("eyebrow"),
          title: this.getAttribute("title"),
          titleId: this.getAttribute("title-id"),
          subtitle: this.getAttribute("subtitle"),
          link: { label: this.getAttribute("link-label"), href: this.getAttribute("link-href") },
          rightSlot: slot
        });
        this.removeAttribute("title");          // not a tooltip on the whole block
        this.replaceChildren(header);
        this.style.display = "block";
      }
    });
  }

  /* ---------------- Chip ---------------- */
  function buildChip(o) {
    var b = el("button", "v2-chip", o.label);
    b.type = "button";
    if (o.value != null) b.value = o.value;
    b.setAttribute("aria-pressed", o.pressed ? "true" : "false");
    return b;
  }

  // one click handler for every chip on the page (chips added later work too)
  document.addEventListener("click", function (e) {
    var chip = e.target.closest && e.target.closest(".v2-chip");
    if (!chip || chip.disabled) return;
    var group = chip.closest("[data-chip-group]");
    var mode = group ? group.getAttribute("data-chip-group") : "multi";
    var chips = group ? Array.prototype.slice.call(group.querySelectorAll(".v2-chip")) : [chip];
    if (mode === "single") {
      if (chip.getAttribute("aria-pressed") === "true") return;   // a single group always keeps one pressed
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
    } else {
      chip.setAttribute("aria-pressed", chip.getAttribute("aria-pressed") === "true" ? "false" : "true");
    }
    (group || chip).dispatchEvent(new CustomEvent("chipchange", {
      bubbles: true,
      detail: {
        chip: chip,
        value: chip.value || chip.textContent.trim(),
        values: chips.filter(function (c) { return c.getAttribute("aria-pressed") === "true"; })
                     .map(function (c) { return c.value || c.textContent.trim(); })
      }
    }));
  });

  window.FrontierV2 = { sectionHeader: buildHeader, chip: buildChip };
})();
