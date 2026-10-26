(function () {
  "use strict";
  var v = document.getElementById("film");
  if (!v) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tg = document.getElementById("film-toggle"), chips = document.getElementById("film-chips");
  var ex = document.getElementById("film-ex"), tryBtn = document.getElementById("film-try");
  // t = quando il video passa alla scena (a meta' della dissolvenza)
  var C = [
    { t: 0, n: "Un nome", x: "Chiara" },
    { t: 3.592, n: "Nome e simbolo", x: "Isabella" },
    { t: 7.242, n: "Due nomi e una data", x: "L & M · 14.02.2023" },
    { t: 10.892, n: "Coordinate", x: "44.49° N, 11.34° E" },
    { t: 14.542, n: "Una data e un luogo", x: "Emilia-Romagna" },
    { t: 18.192, n: "Il posto del cuore", x: "45.46° N, 9.19° E" }
  ];


  var act = -1, manual = false, pending = false;

  function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function set(i) {
    if (i === act) return;
    act = i;
    ex.textContent = C[i].x;
    var btns = chips.querySelectorAll("button");
    btns.forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
    // sul telefono i pulsanti scorrono di lato: il selezionato resta in vista
    if (chips.scrollWidth > chips.clientWidth + 2) {
      var b = btns[i];
      chips.scrollTo({ left: Math.max(0, b.offsetLeft - (chips.clientWidth - b.offsetWidth) / 2), behavior: reduce ? "auto" : "smooth" });
    }
  }
  C.forEach(function (c, i) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = c.n;
    b.addEventListener("click", function () {
      try { v.currentTime = c.t + 0.2; } catch (e) {}
      pending = true;
      setTimeout(function () { pending = false; }, 2000);
      set(i);
      if (!manual && !reduce) play();
    });
    chips.appendChild(b);
  });

  tryBtn.addEventListener("click", function () {
    var input = document.getElementById("text");
    if (!input) return;
    input.value = C[act < 0 ? 0 : act].x;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    if (window.lesnaOpenCustom) window.lesnaOpenCustom();
  });

  v.addEventListener("seeked", function () { pending = false; });
  v.addEventListener("timeupdate", function () {
    if (pending || v.seeking) return;
    var t = v.currentTime, k = 0;
    C.forEach(function (c, i) { if (t >= c.t) k = i; });
    // verso un capitolo precedente solo con un salto vero (ripartenza), non per un'oscillazione del tempo
    if (k < act && t > C[act].t - 0.4) return;
    set(k);
  });
  function sync() {
    var p = v.paused;
    tg.dataset.paused = String(p);
    tg.setAttribute("aria-label", p ? "Riproduci il video" : "Metti in pausa il video");
  }
  v.addEventListener("play", sync);
  v.addEventListener("pause", sync);
  tg.addEventListener("click", function () {
    if (v.paused) { manual = false; play(); } else { manual = true; v.pause(); }
  });

  // parte solo quando si vede, si ferma quando esce dallo schermo o dalla scheda
  if ("IntersectionObserver" in window && !reduce) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { v.preload = "auto"; if (!manual) play(); } else v.pause(); });
    }, { threshold: 0.35 }).observe(v);
    document.addEventListener("visibilitychange", function () { if (document.hidden) v.pause(); });
  }
  set(0); sync();
})();
