(function () {
  "use strict";
  var view = document.getElementById("custom");
  if (!view) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var behind = [document.querySelector(".top"), document.querySelector("main"), document.querySelector(".sheet")].filter(Boolean);
  var opener = null, isOpen = false;

  function setInert(on) { behind.forEach(function (e) { if (on) e.setAttribute("inert", ""); else e.removeAttribute("inert"); }); }

  function open() {
    if (isOpen) return;
    isOpen = true; opener = document.activeElement;
    if (window.lesnaLoad3d) window.lesnaLoad3d(); // se la 3D non e' ancora partita, parte ora
    view.removeAttribute("inert"); setInert(true);
    view.classList.add("is-open"); document.body.classList.add("view-open");
    view.scrollTop = 0;
    try { history.pushState({ custom: 1 }, ""); } catch (e) { /* ok */ }
    // la targhetta e' gia' pronta: l'animazione inizia appena la pagina entra
    var replay = document.getElementById("replay3d");
    if (replay) replay.click();
    setTimeout(function () { var b = view.querySelector(".view-back"); if (b) b.focus({ preventScroll: true }); }, reduce ? 0 : 120);
  }
  function close(goto) {
    if (!isOpen) return;
    isOpen = false;
    view.classList.remove("is-open"); document.body.classList.remove("view-open");
    view.setAttribute("inert", ""); setInert(false);
    if (history.state && history.state.custom) { try { history.back(); } catch (e) { /* ok */ } }
    if (goto) {
      var t = document.querySelector(goto);
      if (t) setTimeout(function () { t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 60);
    } else if (opener && opener.focus) { try { opener.focus({ preventScroll: true }); } catch (e) { /* ok */ } }
  }

  window.lesnaOpenCustom = open;
  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-open-custom]");
    if (o) { e.preventDefault(); open(); return; }
    var c = e.target.closest("[data-close-custom]");
    if (c) { e.preventDefault(); close(c.getAttribute("data-goto")); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen && !document.querySelector(".tool-panel:not([hidden])")) close(); });
  window.addEventListener("popstate", function () { if (isOpen) close(); });
})();
