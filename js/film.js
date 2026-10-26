(function () {
  "use strict";
  var v = document.getElementById("film");
  if (!v) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tg = document.getElementById("film-toggle"), chips = document.getElementById("film-chips");
  var ex = document.getElementById("film-ex"), tryBtn = document.getElementById("film-try");
  // i tempi sono quelli dei capitoli del video
  var C = [
    { t: 0, n: "Un nome", x: "Chiara" },
    { t: 4.4, n: "Nome e simbolo", x: "Isabella" },
    { t: 9.7, n: "Due nomi e una data", x: "L & M · 14.02.2023" },
    { t: 14, n: "Coordinate", x: "44.49° N, 11.34° E" },
    { t: 18.5, n: "Una data e un luogo", x: "Emilia-Romagna" },
    { t: 23, n: "Il posto del cuore", x: "45.46° N, 9.19° E" }
  ];

  var act = -1, manual = false, lock = 0;

  function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function set(i) {
    if (i === act) return;
    act = i;
    ex.textContent = C[i].x;
    chips.querySelectorAll("button").forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
  }
  C.forEach(function (c, i) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = c.n;
    b.addEventListener("click", function () {
      try { v.currentTime = c.t; } catch (e) {}
      lock = Date.now() + 800;
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
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  v.addEventListener("timeupdate", function () {
    if (Date.now() < lock) return;
    var t = v.currentTime, k = 0;
    C.forEach(function (c, i) { if (t >= c.t) k = i; });
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
      es.forEach(function (e) { if (e.isIntersecting) { if (!manual) play(); } else v.pause(); });
    }, { threshold: 0.35 }).observe(v);
    document.addEventListener("visibilitychange", function () { if (document.hidden) v.pause(); });
  }
  set(0); sync();
})();
