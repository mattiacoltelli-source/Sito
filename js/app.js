(function () {
  "use strict";

  var SITE = window.SITE, PRODUCTS = window.PRODUCTS;
  var plate = document.getElementById("plate");
  var face = plate.querySelector(".plate-face");
  var engraving = document.getElementById("engraving");
  var input = document.getElementById("text");
  var count = document.getElementById("count");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = { text: input.value, style: "corsivo" };
  var BASE = { corsivo: 0.78, romano: 0.4, blocco: 0.52 }; // fattore sull'altezza della lastra

  /* ---------- Anteprima incisione ---------- */
  function fit() {
    var avail = face.clientWidth - 8;
    var h = face.clientHeight;
    var size = Math.max(16, h * BASE[state.style]);
    engraving.style.fontSize = size + "px";
    var guard = 60;
    while (engraving.scrollWidth > avail && size > 12 && guard--) {
      size -= 2;
      engraving.style.fontSize = size + "px";
    }
  }

  function render() {
    var t = state.text.trim();
    engraving.textContent = t;
    engraving.classList.toggle("is-empty", !t);
    engraving.dataset.style = state.style;
    plate.setAttribute("aria-label", t ? "Anteprima dell'incisione: " + t : "Anteprima dell'incisione");
    var max = input.maxLength;
    count.textContent = state.text.length + "/" + max;
    count.classList.toggle("is-full", state.text.length >= max);
    fit();
    updateLinks();
  }

  function burn() {
    if (reduceMotion) return;
    plate.classList.remove("is-burning");
    void plate.offsetWidth; // riavvia l'animazione
    plate.classList.add("is-burning");
  }

  input.addEventListener("input", function () { state.text = input.value; render(); });
  document.querySelectorAll('input[name="style"]').forEach(function (r) {
    r.addEventListener("change", function () { state.style = r.value; render(); burn(); });
  });
  document.querySelectorAll(".ideas button").forEach(function (b) {
    b.addEventListener("click", function () {
      state.text = b.dataset.idea; input.value = state.text; render(); burn();
    });
  });
  window.addEventListener("resize", fit);
  if (document.fonts) {
    document.fonts.addEventListener("loadingdone", fit);
    ["56px Allura", "40px Cinzel", "40px Antonio"].forEach(function (f) { document.fonts.load(f).then(fit); });
  }

  /* ---------- Contatti ---------- */
  function waLink(message) {
    return "https://wa.me/" + SITE.whatsapp + "?text=" + encodeURIComponent(message);
  }
  function totalOf(p) { return p.price + (p.insidePrice && p.double ? p.insidePrice : 0); }
  function messageFor(p) {
    var t = state.text.trim();
    var dbl = p.insidePrice && p.double;
    var msg = "Ciao! Vorrei il bracciale «" + p.name + "» (" + totalOf(p) + " €" + (dbl ? ", con incisione anche all'interno" : "") + ").";
    if (t) msg += " Testo da incidere" + (dbl ? " fuori" : "") + ": «" + t + "».";
    if (dbl && p.inner && p.inner.trim()) msg += " Testo all'interno: «" + p.inner.trim() + "».";
    return msg;
  }
  function updateLinks() {
    document.querySelectorAll("[data-wa]").forEach(function (a) {
      var p = PRODUCTS.find(function (x) { return x.id === a.dataset.wa; });
      a.href = waLink(messageFor(p));
    });
    document.querySelectorAll("[data-mine]").forEach(function (el) {
      var t = state.text.trim();
      el.hidden = !t;
      var q = el.querySelector("q");
      if (q) q.textContent = t;
    });
    var wa = document.getElementById("contact-wa");
    wa.href = waLink("Ciao! Vorrei informazioni sui vostri bracciali incisi.");
    document.getElementById("contact-mail").href = "mailto:" + SITE.email + "?subject=" + encodeURIComponent("Informazioni bracciali");
  }

  /* ---------- Catalogo ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function photoSrc(name) { return "assets/products/" + name + ".jpg"; }

  function buildItem(p, index) {
    var item = el("article", "item");
    item.id = p.id;
    item.setAttribute("aria-labelledby", "t-" + p.id);

    var gallery = el("div", "gallery");
    var slip = el("div", "slip");
    var main = new Image();
    main.src = photoSrc(p.photos[0]);
    main.alt = p.alt;
    main.width = 1000; main.height = 1000;
    main.decoding = "async";
    if (index > 0) main.loading = "lazy";
    slip.appendChild(main);
    gallery.appendChild(slip);

    if (p.photos.length > 1) {
      var thumbs = el("div", "thumbs");
      thumbs.setAttribute("role", "group");
      thumbs.setAttribute("aria-label", "Foto di " + p.name);
      p.photos.forEach(function (name, i) {
        var b = el("button", "thumb");
        b.type = "button";
        b.setAttribute("aria-label", "Mostra foto " + (i + 1) + " di " + p.photos.length);
        if (i === 0) b.setAttribute("aria-current", "true");
        var im = new Image();
        im.src = photoSrc(name); im.alt = ""; im.loading = "lazy"; im.width = 128; im.height = 128;
        b.appendChild(im);
        b.addEventListener("click", function () {
          main.style.opacity = "0";
          setTimeout(function () { main.src = photoSrc(name); main.style.opacity = ""; }, 120);
          thumbs.querySelectorAll(".thumb").forEach(function (x) { x.removeAttribute("aria-current"); });
          b.setAttribute("aria-current", "true");
        });
        thumbs.appendChild(b);
      });
      gallery.appendChild(thumbs);
    }

    var info = el("div", "info");
    info.appendChild(el("h3", null, esc(p.name))).id = "t-" + p.id;
    info.appendChild(el("p", "tagline", esc(p.tagline)));
    var priceEl = el("p", "price");
    function setPrice() {
      var note = p.id === "coppia" ? "il set di due" : "";
      if (p.insidePrice) note = p.double ? p.price + " € + " + p.insidePrice + " € per la seconda incisione" : "+ " + p.insidePrice + " € se incidi anche dentro";
      priceEl.innerHTML = totalOf(p) + " €" + (note ? "<small>" + note + "</small>" : "");
    }
    setPrice();
    info.appendChild(priceEl);

    var dl = el("dl", "specs");
    p.specs.forEach(function (s) {
      dl.appendChild(el("div", null, "<dt>" + esc(s[0]) + "</dt><dd>" + esc(s[1]) + "</dd>"));
    });
    info.appendChild(dl);

    if (p.insidePrice) {
      var box = el("fieldset", "opts");
      box.appendChild(el("legend", null, "Dove vuoi incidere?"));
      [["solo", "Solo fuori"], ["doppia", "Fuori e dentro <small>+" + p.insidePrice + " €</small>"]].forEach(function (o, i) {
        var lab = el("label", null);
        var r = document.createElement("input");
        r.type = "radio"; r.name = "inc-" + p.id; r.value = o[0]; r.checked = i === 0;
        lab.appendChild(r); lab.appendChild(el("span", "chip", o[1]));
        box.appendChild(lab);
      });
      var inner = el("div", "inside");
      inner.hidden = true;
      var il = el("label", "inside-label", "Cosa vuoi incidere all'interno?");
      il.htmlFor = "in-" + p.id;
      var inp = document.createElement("input");
      inp.type = "text"; inp.id = "in-" + p.id; inp.maxLength = 30; inp.autocomplete = "off"; inp.spellcheck = false;
      inp.placeholder = "Un messaggio che leggi solo tu";
      inner.appendChild(il); inner.appendChild(inp);
      inner.appendChild(el("p", "inside-note", "La seconda incisione costa " + p.insidePrice + " € in più: il prezzo qui sopra si aggiorna."));
      box.appendChild(inner);
      box.addEventListener("change", function (e) {
        if (e.target.type !== "radio") return;
        p.double = e.target.value === "doppia";
        inner.hidden = !p.double;
        setPrice(); updateLinks();
        if (p.double) inp.focus();
      });
      inp.addEventListener("input", function () { p.inner = inp.value; updateLinks(); });
      info.insertBefore(box, dl);
    }

    var mine = el("p", "mine", "Con la tua incisione: <q></q> · <a href=\"#top\">cambia</a>");
    mine.setAttribute("data-mine", "");
    info.appendChild(mine);

    var actions = el("div", "actions");
    var wa = el("a", "btn btn--solid", "Richiedi su WhatsApp");
    wa.target = "_blank"; wa.rel = "noopener"; wa.setAttribute("data-wa", p.id);
    actions.appendChild(wa);
    info.appendChild(actions);

    item.appendChild(gallery);
    item.appendChild(info);
    return item;
  }

  var catalogo = document.getElementById("catalogo");
  var items = {};
  var order = PRODUCTS.map(function (p) { return p.id; });
  var bar = document.getElementById("picker-bar");
  var sheet = document.getElementById("sheet");
  var grid = document.getElementById("sheet-grid");
  var current = order[0];

  var chev = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var arrow = function (dir) { return '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="' + (dir < 0 ? "M12 4l-6 6 6 6" : "M8 4l6 6-6 6") + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; };

  PRODUCTS.forEach(function (p, i) {
    var item = buildItem(p, i);
    item.hidden = i > 0;
    items[p.id] = item;
    catalogo.appendChild(item);

    // frecce e indicatore sopra la foto principale
    var slip = item.querySelector(".slip");
    var prev = el("button", "pn pn--prev", arrow(-1)); prev.type = "button"; prev.setAttribute("aria-label", "Bracciale precedente");
    var next = el("button", "pn pn--next", arrow(1)); next.type = "button"; next.setAttribute("aria-label", "Bracciale successivo");
    var pos = el("span", "pos", (i + 1) + " di " + PRODUCTS.length);
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    slip.appendChild(prev); slip.appendChild(next); slip.appendChild(pos);
    // swipe orizzontale sulla foto
    var sx = 0, sy = 0;
    slip.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    slip.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    // voce nel pannello
    var opt = el("button", "opt-model"); opt.type = "button"; opt.dataset.id = p.id;
    var im = new Image(); im.src = photoSrc(p.photos[0]); im.alt = ""; im.width = 120; im.height = 120; im.loading = "lazy"; im.decoding = "async";
    opt.appendChild(im); opt.appendChild(el("span", "opt-name", esc(p.name)));
    opt.addEventListener("click", function () { selectModel(p.id, { hash: true }); closeSheet(); });
    grid.appendChild(opt);
  });

  function go(d) { selectModel(order[(order.indexOf(current) + d + order.length) % order.length], { hash: true }); }

  function selectModel(id, opts) {
    if (!items[id]) id = order[0];
    current = id;
    PRODUCTS.forEach(function (p) { items[p.id].hidden = p.id !== id; });
    items[id].classList.add("is-in");
    var p = PRODUCTS[order.indexOf(id)];
    bar.querySelector("img").src = photoSrc(p.photos[0]);
    bar.querySelector(".pb-name").textContent = p.name;
    grid.querySelectorAll(".opt-model").forEach(function (o) { if (o.dataset.id === id) o.setAttribute("aria-current", "true"); else o.removeAttribute("aria-current"); });
    if (opts && opts.hash) { try { history.replaceState(null, "", "#" + id); } catch (e) { /* ok */ } }
  }

  var lastFocus = null;
  function openSheet() {
    lastFocus = document.activeElement;
    sheet.hidden = false;
    document.body.classList.add("sheet-open");
    bar.setAttribute("aria-expanded", "true");
    requestAnimationFrame(function () { sheet.classList.add("is-open"); var c = grid.querySelector("[aria-current]") || grid.firstChild; if (c) c.focus({ preventScroll: true }); });
  }
  function closeSheet() {
    sheet.classList.remove("is-open");
    document.body.classList.remove("sheet-open");
    bar.setAttribute("aria-expanded", "false");
    setTimeout(function () { sheet.hidden = true; }, reduceMotion ? 0 : 220);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  bar.addEventListener("click", openSheet);
  sheet.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeSheet(); });
  document.addEventListener("keydown", function (e) {
    if (sheet.hidden) return;
    if (e.key === "Escape") closeSheet();
    if (e.key === "Tab") { // il focus resta dentro il pannello
      var f = sheet.querySelectorAll("button"); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });

  var fromHash = location.hash.slice(1);
  selectModel(items[fromHash] ? fromHash : order[0]);
  if (items[fromHash]) setTimeout(function () { document.getElementById("collezione").scrollIntoView(); }, 0);

  document.title = SITE.brand + " – Oggetti unici, creati per te";
  render();
  // il laser incide il testo una volta all'apertura
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); burn(); }); else burn();
})();
