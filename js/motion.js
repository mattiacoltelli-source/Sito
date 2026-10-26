(function () {
  "use strict";
  var root = document.documentElement;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  root.classList.add("js-motion");

  /* ---------- Comparsa allo scroll (una volta sola) ---------- */
  var targets = document.querySelectorAll(".sec-head, .item, .steps li, .material-in, .contact-in, .film-in");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t, i) {
      t.classList.add("reveal");
      if (t.matches(".steps li")) t.style.setProperty("--d", (Array.prototype.indexOf.call(t.parentNode.children, t) * 90) + "ms");
      io.observe(t);
    });
  }

  /* ---------- Laser: ripete l'incisione quando smetti di scrivere ---------- */
  var input = document.getElementById("text"), plate = document.getElementById("plate");
  var t;
  if (input && plate) {
    input.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        plate.classList.remove("is-burning");
        void plate.offsetWidth;
        plate.classList.add("is-burning");
      }, 700);
    });
  }

  if (!fine) return;

  /* ---------- Placca che segue il cursore (inclinazione + riflesso) ---------- */
  var bracelet = document.querySelector(".bracelet");
  if (bracelet && plate) {
    var raf = 0, px = 0, py = 0;
    function paint() {
      raf = 0;
      plate.style.setProperty("--rx", (-py * 7).toFixed(2) + "deg");
      plate.style.setProperty("--ry", (px * 9).toFixed(2) + "deg");
      plate.style.setProperty("--gx", ((px + 1) * 50).toFixed(1) + "%");
      plate.style.setProperty("--gy", ((py + 1) * 50).toFixed(1) + "%");
    }
    bracelet.addEventListener("pointermove", function (e) {
      var r = plate.getBoundingClientRect();
      px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2 + 120)));
      py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2 + 120)));
      plate.classList.add("is-tilting");
      if (!raf) raf = requestAnimationFrame(paint);
    });
    bracelet.addEventListener("pointerleave", function () {
      px = py = 0; plate.classList.remove("is-tilting");
      if (!raf) raf = requestAnimationFrame(paint);
    });
  }

  /* ---------- Pulsanti magnetici ---------- */
  document.addEventListener("pointermove", function (e) {
    var b = e.target.closest && e.target.closest(".btn, .nav-cta");
    if (!b) return;
    var r = b.getBoundingClientRect();
    b.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px");
    b.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px");
  });
  document.addEventListener("pointerout", function (e) {
    var b = e.target.closest && e.target.closest(".btn, .nav-cta");
    if (!b || b.contains(e.relatedTarget)) return;
    b.style.removeProperty("--tx"); b.style.removeProperty("--ty");
  });
})();
