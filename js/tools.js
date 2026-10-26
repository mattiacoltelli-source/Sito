(function () {
  "use strict";
  var form = document.getElementById("burin");
  if (!form) return;
  var tools = [
    { btn: document.getElementById("tool-style"), panel: document.getElementById("panel-style") },
    { btn: document.getElementById("tool-ideas"), panel: document.getElementById("panel-ideas") }
  ];
  function setOpen(t, open) {
    t.btn.setAttribute("aria-expanded", String(open));
    t.panel.hidden = !open;
  }
  function closeAll() { tools.forEach(function (t) { setOpen(t, false); }); }

  tools.forEach(function (t) {
    t.btn.addEventListener("click", function () {
      var open = t.panel.hidden;
      closeAll();
      setOpen(t, open);
    });
  });
  form.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var openTool = tools.filter(function (t) { return !t.panel.hidden; })[0];
    if (openTool) { closeAll(); openTool.btn.focus(); }
  });

  // il bottone mostra lo stile scelto, nel suo carattere
  var val = document.getElementById("tool-style-v");
  form.querySelectorAll('input[name="style"]').forEach(function (r) {
    r.addEventListener("change", function () {
      val.textContent = r.nextElementSibling.textContent;
      val.dataset.style = r.value;
      closeAll();
    });
  });
  form.querySelectorAll(".ideas button").forEach(function (b) { b.addEventListener("click", closeAll); });
})();
