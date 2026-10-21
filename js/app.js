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
  var tabs = document.getElementById("tabs");
  var items = {};
  PRODUCTS.forEach(function (p, i) {
    var item = buildItem(p, i);
    item.hidden = i > 0;
    items[p.id] = item;
    catalogo.appendChild(item);

    var tab = el("button", "tab");
    tab.type = "button"; tab.id = "tab-" + p.id; tab.dataset.id = p.id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", p.id);
    var im = new Image();
    im.src = photoSrc(p.photos[0]); im.alt = ""; im.width = 84; im.height = 84; im.decoding = "async";
    tab.appendChild(im);
    tab.appendChild(el("span", "tab-name", esc(p.name)));
    tabs.appendChild(tab);
  });
  tabs.setAttribute("role", "tablist");

  function selectModel(id, opts) {
    if (!items[id]) id = PRODUCTS[0].id;
    PRODUCTS.forEach(function (p) {
      var on = p.id === id;
      items[p.id].hidden = !on;
      var t = document.getElementById("tab-" + p.id);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    items[id].classList.add("is-in"); // niente attesa dello scroll per la comparsa
    if (opts && opts.hash) { try { history.replaceState(null, "", "#" + id); } catch (e) { /* ok */ } }
    if (opts && opts.scroll) {
      var top = document.getElementById("collezione").getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    }
    var cur = document.getElementById("tab-" + id);
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest", inline: "center", behavior: reduceMotion ? "auto" : "smooth" });
  }
  tabs.addEventListener("click", function (e) {
    var b = e.target.closest(".tab");
    if (b) selectModel(b.dataset.id, { hash: true });
  });
  tabs.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var ids = PRODUCTS.map(function (p) { return p.id; });
    var cur = ids.indexOf(document.activeElement.dataset && document.activeElement.dataset.id);
    if (cur < 0) return;
    var next = ids[(cur + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length];
    selectModel(next, { hash: true });
    document.getElementById("tab-" + next).focus();
    e.preventDefault();
  });
  var fromHash = location.hash.slice(1);
  selectModel(items[fromHash] ? fromHash : PRODUCTS[0].id);
  if (items[fromHash]) setTimeout(function () { document.getElementById("collezione").scrollIntoView(); }, 0);

  document.title = SITE.brand + " – Oggetti unici, creati per te";
  render();
  // il laser incide il testo una volta all'apertura
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); burn(); }); else burn();
})();
