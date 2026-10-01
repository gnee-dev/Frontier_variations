/* ==========================================================================
   v2-leaderboard: "See where demand is forming" and the partner preview (v2.html)
   Reads EXTENSIONS and CATEGORIES from js/v2-config.js.
   - List / Map: the same extensions as table rows or as tiles (sized by backers).
   - Search and the category chips filter both views.
   - Choosing a row or a tile fills the Selected panel.
   - Backers bars are against the most backed extension; an extension without a
     published count shows [##] and an empty bar.
   ========================================================================== */
(function () {
  "use strict";

  var C = window.FRONTIER_V2_CONFIG;
  if (!C) return;
  var X = C.EXTENSIONS;
  var fmt = function (n) { return n == null ? "[##]" : Math.round(n).toLocaleString("en-US"); };
  var make = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  var max = Math.max.apply(null, X.map(function (e) { return e.backers || 0; })) || 1;

  /* ---- the partner preview: the most backed extension ---- */
  var pp = document.querySelector("[data-partner-preview]");
  if (pp) {
    var lead = X.slice().sort(function (a, b) { return (b.backers || 0) - (a.backers || 0); })[0];
    pp.querySelector('[data-pp="tld"]').textContent = lead.tld;
    pp.querySelector('[data-pp="backers"]').textContent = fmt(lead.backers) + " backers";
  }

  var root = document.querySelector("[data-leaderboard]");
  if (!root) return;
  var q = function (k) { return root.querySelector('[data-lb="' + k + '"]'); };
  var rows = q("rows"), map = q("map"), list = q("list"), empty = q("empty"), search = q("search");
  var state = { view: "list", category: "All", text: "", selected: X[0].tld };

  // the category chips, from the config
  var cats = q("category");
  cats.replaceChildren();
  (C.CATEGORIES || ["All"]).forEach(function (c) {
    cats.appendChild(window.FrontierV2.chip({ label: c, value: c, pressed: c === state.category }));
  });

  function visible() {
    var t = state.text.trim().toLowerCase().replace(/^\./, "");
    return X.filter(function (e) {
      return (state.category === "All" || e.category === state.category) &&
             (!t || e.tld.slice(1).toLowerCase().indexOf(t) !== -1);
    });
  }

  function select(tld) {
    state.selected = tld;
    var e = X.filter(function (x) { return x.tld === tld; })[0];
    if (!e) return;
    q("name").textContent = e.tld;
    q("applicant").textContent = e.applicant;
    q("backers").textContent = fmt(e.backers);
    q("status").textContent = e.status + " · " + e.applied;
    q("launch").textContent = e.launch;
    q("cta").textContent = "Back " + e.tld + " with points";
    root.querySelectorAll("[data-tld]").forEach(function (n) {
      var on = n.getAttribute("data-tld") === tld;
      n.classList.toggle("is-selected", on);
      var b = n.querySelector(".v2-lb__pick") || (n.matches("button") ? n : null);
      if (b) b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function render() {
    var items = visible();
    rows.replaceChildren();
    map.replaceChildren();
    items.forEach(function (e) {
      var rank = X.indexOf(e) + 1;
      // a table row: the extension is the row's button (keyboard), the whole row is clickable
      var tr = make("tr", "v2-lb__row");
      tr.setAttribute("data-tld", e.tld);
      tr.appendChild(make("td", "v2-lb__rank", String(rank)));
      var tdName = make("td", "v2-lb__ext");
      var pick = make("button", "v2-lb__pick", e.tld);
      pick.type = "button";
      tdName.appendChild(pick);
      tr.appendChild(tdName);
      tr.appendChild(make("td", "v2-lb__applicant", e.applicant));
      var tdB = make("td", "v2-lb__backers");
      var track = make("span", "v2-backers__track"), fill = make("i");
      fill.style.setProperty("--w", ((e.backers || 0) / max * 100).toFixed(1) + "%");
      track.appendChild(fill);
      tdB.appendChild(track);
      tdB.appendChild(make("span", "v2-lb__n", fmt(e.backers)));
      tr.appendChild(tdB);
      tr.appendChild(make("td", "v2-lb__status", e.status));
      var tdA = make("td", "v2-lb__act");
      var back = make("a", "v2-link", "Back");
      back.href = "#join";
      back.setAttribute("aria-label", "Back " + e.tld);
      tdA.appendChild(back);
      tr.appendChild(tdA);
      rows.appendChild(tr);

      // a map tile: grows with its backers
      var li = make("li");
      var tile = make("button", "v2-lb__tile");
      tile.type = "button";
      tile.setAttribute("data-tld", e.tld);
      tile.style.setProperty("--g", String(Math.max(1, Math.round((e.backers || 0) / max * 6))));
      tile.appendChild(make("span", "v2-lb__tile-tld", e.tld));
      tile.appendChild(make("span", "v2-lb__tile-n", fmt(e.backers) + " backers"));
      li.style.flexGrow = tile.style.getPropertyValue("--g");
      li.appendChild(tile);
      map.appendChild(li);
    });
    var none = !items.length;
    empty.hidden = !none;
    if (none) empty.textContent = "No extensions match “" + state.text.trim() + "”" + (state.category !== "All" ? " in " + state.category : "") + ".";
    list.hidden = none || state.view !== "list";
    map.hidden = none || state.view !== "map";
    // keep the selection if it's still listed, else select the first one shown
    if (items.length && !items.some(function (e) { return e.tld === state.selected; })) state.selected = items[0].tld;
    select(state.selected);
  }

  root.addEventListener("click", function (ev) {
    var row = ev.target.closest("[data-tld]");   // a row or a tile ("Back →" selects its row too)
    if (row) select(row.getAttribute("data-tld"));
  });
  q("view").addEventListener("chipchange", function (ev) { state.view = ev.detail.value; render(); });
  cats.addEventListener("chipchange", function (ev) { state.category = ev.detail.value; render(); });
  search.addEventListener("input", function () { state.text = search.value; render(); });

  render();
})();
