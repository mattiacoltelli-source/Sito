/* Anteprima 3D della targhetta (Three.js, caricato solo se serve).
   Se WebGL non c'e' o il caricamento fallisce, resta l'anteprima in CSS. */
(function () {
  "use strict";
  var stage = document.getElementById("stage3d");
  if (!stage) return;
  var wrap = stage.parentNode, conn = navigator.connection || {};
  function fail() { wrap.classList.remove("has-3d"); wrap.classList.add("no-3d"); } // torna l'anteprima in CSS
  if (conn.saveData) return fail();
  try { var t = document.createElement("canvas"); if (!(t.getContext("webgl") || t.getContext("experimental-webgl"))) return fail(); } catch (e) { return fail(); }

  function load() {
    var s = document.createElement("script");
    s.src = "js/three.min.js?v=1"; s.async = true;
    s.onload = function () { try { init(); } catch (e) { fail(); } };
    s.onerror = fail;
    document.head.appendChild(s);
  }
  if (document.readyState === "complete") start(); else window.addEventListener("load", start);
  setTimeout(function () { if (!wrap.classList.contains("has-3d")) fail(); }, 9000);
  function start() { if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 1500 }); else setTimeout(load, 300); }

  function init() {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cv = document.getElementById("gl3d"), stage = document.getElementById("stage3d");
  var need = true;

  /* ---------- renderer, scena ---------- */
  var renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  var scene = new THREE.Scene(); 
  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);

  /* ---------- ambiente: piccola stanza con luci morbide, per i riflessi ---------- */
  var ENV_BOXES = [[540, 38, 90, 26], [700, 30, 120, 30], [860, 44, 80, 24], [620, 120, 70, 20], [790, 130, 90, 22]];
  (function () {
    var c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    var x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#f0f2f6"); g.addColorStop(0.12, "#d3d8e1"); g.addColorStop(0.3, "#9097a6"); g.addColorStop(0.52, "#5d6372"); g.addColorStop(0.8, "#8e94a3"); g.addColorStop(1, "#c8ccd6");
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    x.shadowColor = "#ffffff"; x.shadowBlur = 8;
    x.shadowBlur = 26; x.fillStyle = "#ffffff"; ENV_BOXES.forEach(function (b) { x.fillRect(b[0], b[1], b[2], b[3]); });   // una sola luce morbida: e' il riflesso che si vede sulla piastrina
    x.shadowBlur = 0; x.fillStyle = "rgba(255,255,255,.10)"; x.fillRect(0, 0, 1024, 150);
    var tex = new THREE.CanvasTexture(c); tex.mapping = THREE.EquirectangularReflectionMapping; tex.encoding = THREE.sRGBEncoding;
    var pm = new THREE.PMREMGenerator(renderer); pm.compileEquirectangularShader();
    scene.environment = pm.fromEquirectangular(tex).texture; tex.dispose(); pm.dispose();
  })();
  var key = new THREE.SpotLight(0xfff0dc, 1.3, 60, 0.55, 1, 1); key.position.set(0, 6, 5); key.castShadow = true;
  key.shadow.mapSize.set(512, 512); key.shadow.bias = -0.0004; key.shadow.radius = 5; scene.add(key, key.target);

  function rnd(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- piano che riceve solo l'ombra ---------- */
  var fabric = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.ShadowMaterial({ opacity: 0.42 }));
  fabric.rotation.x = -Math.PI / 2; fabric.receiveShadow = true; scene.add(fabric);

  /* ---------- la targhetta, sdraiata sul tessuto ---------- */
  var PW = 2.5, PH = 0.95, PD = 0.07, KB = 0.03, B = 3.3, A = 3.0;
  var plateG = new THREE.Group(); scene.add(plateG);
  var zc = B * 0.9;
  plateG.rotation.x = -Math.PI / 2; plateG.position.set(0, PD / 2 + 0.3, zc);
  var steel = (function () {
    var W = 1024, H = 512, r = rnd(5), rc = document.createElement("canvas"), bc = document.createElement("canvas");
    rc.width = bc.width = W; rc.height = bc.height = H;
    var x = rc.getContext("2d"), y = bc.getContext("2d");
    x.fillStyle = "rgb(15,15,15)"; x.fillRect(0, 0, W, H); y.fillStyle = "#808080"; y.fillRect(0, 0, W, H);
    var i, v, yy, len, xx;
    for (i = 0; i < 38000; i++) { // grana fine, uguale in ogni direzione: niente righe
      xx = r() * W; yy = r() * H; v = Math.round(12 + r() * 30); x.fillStyle = "rgb(" + v + "," + v + "," + v + ")"; x.fillRect(xx, yy, 2, 2);
      v = Math.round(118 + r() * 20); y.fillStyle = "rgb(" + v + "," + v + "," + v + ")"; y.fillRect(xx, yy, 2, 2);
    }
    var a1 = new THREE.CanvasTexture(rc), a2 = new THREE.CanvasTexture(bc); a1.anisotropy = a2.anisotropy = 4; a1.wrapS = a1.wrapT = a2.wrapS = a2.wrapT = THREE.RepeatWrapping; return { rough: a1, bump: a2 };
  })();
  var plateMat = new THREE.MeshStandardMaterial({ color: 0xf6f8fa, metalness: 1, roughness: 1, roughnessMap: steel.rough, bumpMap: steel.bump, bumpScale: 0.011, envMapIntensity: 1.5 });
    var chainMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.4, envMapIntensity: 0.9 });
  var partMat = new THREE.MeshStandardMaterial({ color: 0xcfd4d9, metalness: 1, roughness: 0.38, envMapIntensity: 1.0 });
  var steelOn = true;
  var look = 1; // 1 = luce e ombra che si muovono (durante l'animazione), 0 = fermo e uniforme
  function setLook(d, e) {
    if (e == null) sheen.material.opacity = 0;
    else {
      cLocal.copy(camera.position); plateG.worldToLocal(cLocal);
      var t = cLocal.z / (cLocal.z + sheenL.z), fade = 1 - Math.min(1, Math.max(0, (e - 0.4) / 0.28));
      paintSheen(cLocal.x + t * (sheenL.x - cLocal.x), cLocal.y + t * (sheenL.y - cLocal.y)); sheen.material.opacity = 0.55 * fade;
    }
    look = d; fabric.material.opacity = 0.42 * d; plateMat.envMapIntensity = 1.15 + 0.3 * d;
    key.position.x = e == null ? 0 : -4.5 + 9 * e; key.intensity = 1.3 * (0.35 + 0.65 * d);
  }
  function setSteel(d) { plateMat.bumpScale = 0.011 * (0.65 + 0.35 * d); }
  function rr(w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  var plShape = rr(PW, PH, 0.09);
  [-1, 1].forEach(function (sg) { var h = new THREE.Path(); h.absarc(sg * (PW / 2 - 0.2), 0, 0.065, 0, Math.PI * 2, true); plShape.holes.push(h); });
  var pg = new THREE.ExtrudeGeometry(plShape, { depth: PD, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.016, bevelSegments: 4, curveSegments: 14 });
  pg.translate(0, 0, -PD / 2);
  // suddivide i triangoli, cosi' la lastra puo' curvarsi in modo morbido
  function subdivide(g, n) {
    g = g.toNonIndexed(); var names = ["position", "normal", "uv"];
    while (n--) {
      var src = names.map(function (k) { return g.attributes[k]; }), out = src.map(function (a) { return new Float32Array(a.count * 4 * a.itemSize); }), o = 0;
      for (var t = 0; t < src[0].count; t += 3) {
        for (var a = 0; a < 3; a++) { /* per ogni attributo: 4 triangoli figli */ }
        var idx = [[0, 3, 5], [3, 1, 4], [5, 4, 2], [3, 4, 5]];
        src.forEach(function (at, ai) {
          var sz = at.itemSize, v = [], m = [];
          for (var q = 0; q < 3; q++) { v.push([]); for (var c = 0; c < sz; c++) v[q].push(at.array[(t + q) * sz + c]); }
          function mid(p1, p2) { var r2 = []; for (var c = 0; c < sz; c++) r2.push((p1[c] + p2[c]) / 2); return r2; }
          var pts = [v[0], v[1], v[2], mid(v[0], v[1]), mid(v[1], v[2]), mid(v[2], v[0])];
          idx.forEach(function (tri, ti) { tri.forEach(function (pi, k) { for (var c = 0; c < sz; c++) out[ai][((o + ti * 3 + k)) * sz + c] = pts[pi][c]; }); });
        });
        o += 12;
      }
      var ng = new THREE.BufferGeometry(); names.forEach(function (k, ai) { ng.setAttribute(k, new THREE.BufferAttribute(out[ai], src[ai].itemSize)); }); g = ng;
    }
    return g;
  }
  pg = subdivide(pg, 3);
  (function () {
    var p = pg.attributes.position, nrm = pg.attributes.normal, uv = pg.attributes.uv;
    for (var q = 0; q < p.count; q++) {
      var nz = nrm.getZ(q), xx = p.getX(q);
      if (Math.abs(nz) > 0.9) {
        uv.setXY(q, xx / PW + 0.5, p.getY(q) / PH + 0.5);
        var sg = nz > 0 ? 1 : -1, nl = Math.hypot(2 * KB * xx, 1); nrm.setXYZ(q, sg * 2 * KB * xx / nl, 0, sg / nl);
      } else uv.setXY(q, 0.013, 0.013);
      p.setZ(q, p.getZ(q) - KB * xx * xx);
    }
    uv.needsUpdate = nrm.needsUpdate = p.needsUpdate = true;
  })();
  var plate = new THREE.Mesh(pg, plateMat); plate.castShadow = true; plate.receiveShadow = true; plateG.add(plate);
  var plateLight = new THREE.PointLight(0xffffff, 0.8, 6, 2); plateLight.position.set(0, -0.7, 1.6); plateG.add(plateLight);
  key.target.position.copy(plateG.position);

  /* ---------- incisione: texture di testo, retro, "calore" del laser ---------- */
  var DW = PW - 0.5, DH = PH - 0.2, TW = 1560, TH = Math.round(TW * DH / DW);
  function mk(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  var oldAlpha = 0, hasInk = false, FADE = 220, oldC = mk(TW, TH), oldX = oldC.getContext("2d"), tmpC = mk(TW, TH), tmpX = tmpC.getContext("2d"), textC = mk(TW, TH), alphaC = mk(TW, TH), backC = mk(TW, TH), heatC = mk(TW, TH);
  var aTex = new THREE.CanvasTexture(alphaC), bTex = new THREE.CanvasTexture(backC), hTex = new THREE.CanvasTexture(heatC);
  [aTex, bTex].forEach(function (t) { t.anisotropy = 4; });
  function decalMat(tex) {
    return new THREE.MeshStandardMaterial({ color: 0x4a525c, metalness: 0.6, roughness: 0.42, alphaMap: tex, bumpMap: tex, bumpScale: -2.4, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, envMapIntensity: 0.8 });
  }
  function bent(sign) { var g = new THREE.PlaneGeometry(DW, DH, 120, 4), p = g.attributes.position; for (var q = 0; q < p.count; q++) { var xx = p.getX(q); p.setZ(q, sign * -KB * xx * xx); } g.computeVertexNormals(); return g; }
  var dg = bent(1), dgB = bent(-1), zf = PD / 2 + 0.024;
  var decal = new THREE.Mesh(dg, decalMat(aTex)); decal.position.set(0, 0, zf); plateG.add(decal);
  var heat = new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ color: 0xff8f45, alphaMap: hTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, opacity: 0.9, fog: false }));
  heat.position.set(0, 0, zf + 0.002); plateG.add(heat);
  // riflesso che scorre lungo la targhetta mentre la camera passa (si spegne a fine animazione)
  var shC = mk(256, 64), shX = shC.getContext("2d"), shTex = new THREE.CanvasTexture(shC);
  var sheen = new THREE.Mesh(bent(1), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -6, fog: false }));
  sheen.scale.set((PW - 0.25) / DW, (PH - 0.1) / DH, 1); sheen.position.set(0, 0, zf + 0.004); plateG.add(sheen);
  // riflesso fisico: punto in cui una luce fissa (sopra la targhetta) si specchia verso la camera; per questo si muove meno della camera e anche in verticale
  var sheenL = { x: 0.15, y: 1.5, z: 0.8 }, cLocal = new THREE.Vector3();
  function paintSheen(hx, hy) {
    var u = (hx / (PW - 0.25) + 0.5) * 256, v = (0.5 - hy / (PH - 0.1)) * 64;
    shX.globalCompositeOperation = "source-over"; shX.clearRect(0, 0, 256, 64);
    shX.save(); shX.translate(u, v); shX.scale(1, 0.3);
    var g = shX.createRadialGradient(0, 0, 0, 0, 0, 80); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(0.45, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
    shX.fillStyle = g; shX.fillRect(-90, -90 / 0.3, 180, 180 / 0.3); shX.restore();
    shX.globalCompositeOperation = "destination-in";
    var vm = shX.createLinearGradient(0, 0, 0, 64); vm.addColorStop(0, "rgba(0,0,0,0)"); vm.addColorStop(0.1, "rgba(0,0,0,1)"); vm.addColorStop(0.9, "rgba(0,0,0,1)"); vm.addColorStop(1, "rgba(0,0,0,0)");
    shX.fillStyle = vm; shX.fillRect(0, 0, 256, 64);
    var h = shX.createLinearGradient(0, 0, 256, 0); h.addColorStop(0, "rgba(0,0,0,0)"); h.addColorStop(0.1, "rgba(0,0,0,1)"); h.addColorStop(0.9, "rgba(0,0,0,1)"); h.addColorStop(1, "rgba(0,0,0,0)");
    shX.fillStyle = h; shX.fillRect(0, 0, 256, 64); shTex.needsUpdate = true;
  }
  var backDecal = new THREE.Mesh(dgB, decalMat(bTex)); backDecal.rotation.y = Math.PI; backDecal.position.set(0, 0, -zf); plateG.add(backDecal);

  var STY = { corsivo: { f: "Allura", w: "400", k: 0.82, up: false, ls: 0 }, romano: { f: "Cinzel", w: "500", k: 0.46, up: true, ls: 0.06 }, blocco: { f: "Antonio", w: "400", k: 0.62, up: true, ls: 0.1 } };
  var state = { text: "Sempre al tuo fianco", style: "corsivo", heart: false };
  var tx0 = 0, tx1 = TW, colMin = new Int16Array(TW), colMax = new Int16Array(TW);
  function heartPath(c, cx, cy, s) {
    c.beginPath(); c.moveTo(cx, cy + s * 0.9);
    c.bezierCurveTo(cx - s * 1.4, cy + s * 0.1, cx - s * 0.8, cy - s * 0.9, cx, cy - s * 0.35);
    c.bezierCurveTo(cx + s * 0.8, cy - s * 0.9, cx + s * 1.4, cy + s * 0.1, cx, cy + s * 0.9); c.closePath(); c.fill();
  }
  var layout = null, engraved = { text: null, style: null, heart: null };
  function prefixX(n) {
    if (layout.multi) return 0;
    var c = textC.getContext("2d"); c.font = layout.font; if (layout.ls != null) c.letterSpacing = layout.ls;
    return layout.cx - layout.w / 2 + c.measureText(layout.label.slice(0, n)).width;
  }
  function paintText() {
    var c = textC.getContext("2d");
    c.fillStyle = "#000"; c.fillRect(0, 0, TW, TH); c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
    var st = STY[state.style], label = state.text.trim() || " "; if (st.up) label = label.toUpperCase();
    var maxW = TW * 0.9, size = TH * st.k, lines = [label], lc = Math.round(label.length / 2);
    function setF() { c.font = st.w + " " + size + "px '" + st.f + "'"; if ("letterSpacing" in c) c.letterSpacing = (size * st.ls) + "px"; }
    function widest() { return Math.max.apply(null, lines.map(function (l) { return c.measureText(l).width; })); }
    setF(); while (widest() > maxW && size > 24) { size -= 4; setF(); }
    if (size < TH * st.k * 0.6 && label.indexOf(" ") > 0) {
      var cut = -1, d = 1e9, q; for (q = 0; q < label.length; q++) if (label.charAt(q) === " " && Math.abs(q - lc) < d) { d = Math.abs(q - lc); cut = q; }
      lines = [label.slice(0, cut), label.slice(cut + 1)]; size = TH * st.k * 0.62; setF(); while (widest() > maxW && size > 24) { size -= 4; setF(); }
    }
    var cxT = TW / 2;
    if (lines.length > 1) { c.fillText(lines[0], cxT, TH * 0.31); c.fillText(lines[1], cxT, TH * 0.72); } else c.fillText(label, cxT, TH * 0.54);
    layout = { label: label, cx: cxT, font: c.font, ls: "letterSpacing" in c ? c.letterSpacing : null, w: c.measureText(label).width, multi: lines.length > 1 };
    if (state.heart) heartPath(c, TW * 0.87, TH * 0.5, TH * 0.2);
    var im = c.getImageData(0, 0, TW, TH).data; tx0 = TW; tx1 = 0;
    for (var x = 0; x < TW; x++) {
      var lo = -1, hi = -1;
      for (var y = 0; y < TH; y += 2) { if (im[(y * TW + x) * 4 + 1] > 128) { if (lo < 0) lo = y; hi = y; } }
      colMin[x] = lo; colMax[x] = hi; if (lo >= 0) { if (x < tx0) tx0 = x; if (x > tx1) tx1 = x; }
    }
    if (tx1 <= tx0) { tx0 = TW * 0.3; tx1 = TW * 0.7; }
  }
  function paintBack() {
    var c = backC.getContext("2d"); c.fillStyle = "#000"; c.fillRect(0, 0, TW, TH); c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = "400 " + (TH * 0.8) + "px 'Allura'"; if ("letterSpacing" in c) c.letterSpacing = "0px"; c.fillText("lesna lab", TW / 2, TH * 0.54); bTex.needsUpdate = true;
  }
  function showUpTo(front) {
    var c = alphaC.getContext("2d"), edge = 30;
    c.globalCompositeOperation = "source-over"; c.fillStyle = "#000"; c.fillRect(0, 0, TW, TH);
    if (front >= TW) { c.drawImage(textC, 0, 0); }
    else {
      if (oldAlpha > 0.004) { c.save(); c.globalAlpha = oldAlpha; c.drawImage(oldC, 0, 0); c.restore(); }   // il vecchio testo sfuma via in un attimo, prima che parta il laser
      tmpX.globalCompositeOperation = "source-over"; tmpX.clearRect(0, 0, TW, TH); tmpX.drawImage(textC, 0, 0);          // a sinistra: il nuovo, con bordo morbido
      tmpX.globalCompositeOperation = "destination-in";
      var g = tmpX.createLinearGradient(front - edge, 0, front, 0); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
      tmpX.fillStyle = g; tmpX.fillRect(0, 0, front, TH); tmpX.globalCompositeOperation = "source-over";
      c.drawImage(tmpC, 0, 0);
    }
    aTex.needsUpdate = true;
    var h = heatC.getContext("2d"), hot = 120; h.fillStyle = "#000"; h.fillRect(0, 0, TW, TH);
    if (front < tx1 + 2) {
      h.drawImage(textC, 0, 0);
      var hg2 = h.createLinearGradient(front - hot, 0, front, 0); hg2.addColorStop(0, "rgba(0,0,0,1)"); hg2.addColorStop(0.8, "rgba(0,0,0,.25)"); hg2.addColorStop(1, "rgba(0,0,0,0)");
      h.fillStyle = "#000"; h.fillRect(0, 0, Math.max(0, front - hot), TH); h.fillStyle = hg2; h.fillRect(front - hot, 0, hot, TH); h.fillStyle = "#000"; h.fillRect(front, 0, TW - front, TH);
    }
    hTex.needsUpdate = true;
  }

  /* ---------- laser: punto luminoso che segue le lettere, luce sul metallo, scintille ---------- */
  var gc = mk(128, 128), gx = gc.getContext("2d"), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,250,235,1)"); gr.addColorStop(0.18, "rgba(255,214,160,.85)"); gr.addColorStop(0.5, "rgba(255,160,90,.25)"); gr.addColorStop(1, "rgba(255,140,80,0)"); gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
  var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false }));
  glow.scale.set(0.42, 0.42, 1); plateG.add(glow);
  var light = new THREE.PointLight(0xffd5a0, 0, 2.2, 2); plateG.add(light);
  var SP = 64, spPos = new Float32Array(SP * 3), sparkData = [], nextSpark = 0;
  var sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
  plateG.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.085, color: 0xffb35e, depthWrite: false, transparent: true, opacity: 0.95, sizeAttenuation: true, fog: false })));
  for (var k = 0; k < SP; k++) { sparkData.push({ life: 0, v: new THREE.Vector3(), i3: k * 3 }); spPos[k * 3 + 2] = -99; }
  var anim = null, flash = null;
  function stepFlash(now) {
    if (!flash) return false; var q = (now - flash.t0) / 450;
    if (q >= 1) { flash = null; glow.material.opacity = 0; light.intensity = 0; return true; }
    var k = (1 - q) * (1 - q); glow.position.copy(flash.pt); light.position.copy(flash.pt).add(new THREE.Vector3(0, 0, 0.16));
    glow.material.opacity = 0; light.intensity = 0; return true; // niente lampo bianco: restano solo le scintille
  }
  function startLaser(from, durOv) {
    oldX.clearRect(0, 0, TW, TH); oldX.drawImage(alphaC, 0, 0); // quello che si vede ora: il laser lo sostituisce passando
    paintText();
    if (reduce) { showUpTo(TW + 10); need = true; return; }
    var f = from == null ? tx0 - 4 : Math.max(tx0 - 4, from), nw = performance.now(), fd = hasInk ? FADE : 0; oldAlpha = fd ? 1 : 0;
    anim = { f0: nw, t0: nw + fd, from: f, dur: durOv || (500 + 1500 * Math.min(1, (tx1 + 6 - f) / (TW * 0.9))) };
  }
  function stepLaser(now) {
    if (!anim) return;
    if (now < anim.t0) { oldAlpha = Math.max(0, 1 - (now - anim.f0) / FADE); showUpTo(-1); need = true; return; }
    oldAlpha = 0;
    var p = Math.min(1, (now - anim.t0) / anim.dur), front = anim.from + p * (tx1 + 6 - anim.from);
    showUpTo(front);
    var cx = Math.max(0, Math.min(TW - 1, Math.round(front))), lo = 9999, hi = -1;
    for (var x = Math.max(0, cx - 10); x <= Math.min(TW - 1, cx + 10); x++) { if (colMin[x] >= 0) { lo = Math.min(lo, colMin[x]); hi = Math.max(hi, colMax[x]); } }
    var onInk = hi >= 0, v = onInk ? (lo + (hi - lo) * (0.5 + 0.5 * Math.sin(now * 0.06))) / TH : 0.5;
    var pt = new THREE.Vector3((front / TW - 0.5) * DW, (0.5 - v) * DH, zf + 0.05);
    glow.position.copy(pt); light.position.copy(pt).add(new THREE.Vector3(0, 0, 0.16));
    var fade = Math.min(1, p * 10, (1 - p) * 10) * (onInk ? 1 : 0.25);
    glow.material.opacity = 0; light.intensity = 0;
    if (p >= 1) {
      for (var b = 0; b < 28; b++) { var sd2 = sparkData[nextSpark++ % SP]; sd2.life = 0.45 + Math.random() * 0.4; sd2.v.set((Math.random() - 0.1) * 1.8, (Math.random() - 0.5) * 1.3, 0.5 + Math.random() * 1.4); spPos[sd2.i3] = pt.x; spPos[sd2.i3 + 1] = pt.y; spPos[sd2.i3 + 2] = pt.z; }
      hasInk = !!state.text.trim(); anim = null; flash = { t0: now, pt: pt.clone() }; glow.material.opacity = 0; light.intensity = 0; showUpTo(TW + 10); }
  }
  function stepSparks(dt) {
    var live = false;
    for (var s2 = 0; s2 < SP; s2++) {
      var sd = sparkData[s2]; if (sd.life <= 0) continue; sd.life -= dt;
      if (sd.life <= 0) { spPos[sd.i3 + 2] = -99; continue; }
      sd.v.z -= 3.2 * dt; spPos[sd.i3] += sd.v.x * dt * 0.5; spPos[sd.i3 + 1] += sd.v.y * dt * 0.5; spPos[sd.i3 + 2] += sd.v.z * dt * 0.5; live = true;
    }
    sg.attributes.position.needsUpdate = true; return live;
  }

  /* ---------- telecamera: gira intorno alla targhetta (trascina), zoom (pizzica o rotella) ---------- */
  var T0 = plateG.position.clone().add(new THREE.Vector3(0, 0, 0));
  var DEF = { az: -0.1, el: 1.15, r: 3.4 }, view = { az: DEF.az, el: DEF.el, r: DEF.r };
  function camFrom(v, az2) {
    var a = az2 == null ? v.az : az2, ce = Math.cos(v.el);
    return new THREE.Vector3(T0.x + v.r * Math.sin(a) * ce, T0.y + v.r * Math.sin(v.el), T0.z + v.r * Math.cos(a) * ce);
  }
  function placeCamera() {
    camera.position.copy(camFrom(view)); camera.lookAt(T0); need = true;
  }
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight || Math.round(w * 0.5);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = 30; camera.updateProjectionMatrix(); placeCamera();
  }

  /* ---------- animazione iniziale (3,8 s): vicino, scorre sulla targhetta mentre il laser incide, poi si allontana ---------- */
  var intro = null, INTRO_MS = 3800, camCurve, lookCurve, timer = 0;
  var easeIO = function (u) { return u * u * (3 - 2 * u); };
  function buildIntro() {
    plateG.updateMatrixWorld(true);
    var P = plateG.position, Xa = new THREE.Vector3(1, 0, 0).applyQuaternion(plateG.quaternion), Ya = new THREE.Vector3(0, 1, 0).applyQuaternion(plateG.quaternion), Za = new THREE.Vector3(0, 0, 1).applyQuaternion(plateG.quaternion);
    var at = function (x, y, z) { return P.clone().addScaledVector(Xa, x).addScaledVector(Ya, y).addScaledVector(Za, z); };
    camCurve = new THREE.CatmullRomCurve3([at(-1.3, -1.3, 0.95), at(0.85, -1.25, 1.0), at(0, -1.9, 1.5), camFrom(view)], false, "catmullrom", 0.5);
    lookCurve = new THREE.CatmullRomCurve3([at(-0.7, 0, 0.05), at(0.7, 0, 0.05), at(0, 0, 0.05), T0.clone()], false, "catmullrom", 0.5);
  }
  function startIntro() {
    if (reduce) { setSteel(0); setLook(0); placeCamera(); startLaser(); return; }
    setSteel(1); setLook(1, 0); view.az = DEF.az; view.el = DEF.el; view.r = DEF.r; buildIntro();
    intro = { t0: performance.now() }; clearTimeout(timer); timer = setTimeout(function () { startLaser(null, 1300); }, 350); need = true;
  }
  function endIntro() { if (!intro) return; intro = null; setSteel(0); setLook(0); placeCamera(); }
  function stepIntro(now) {
    var u = Math.min(1, (now - intro.t0) / INTRO_MS), e = easeIO(u); setSteel(1 - Math.min(1, Math.max(0, (e - 0.35) / 0.4)));
    camera.position.copy(camCurve.getPoint(e)); camera.lookAt(lookCurve.getPoint(e)); plateG.updateMatrixWorld(); setLook(1 - Math.min(1, Math.max(0, (e - 0.55) / 0.4)), e); need = true;
    if (u >= 1) endIntro();
  }

  /* ---------- ciclo di disegno: si ferma fuori schermo e a scheda in background ---------- */
  var visible = true, lastT = performance.now();
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) need = true; }).observe(stage);
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (!visible || document.hidden) return;
    if (intro) stepIntro(now);
    var busy = !!anim || stepFlash(now); stepLaser(now); var sp = stepSparks(dt);
    if (busy || sp || need) { renderer.render(scene, camera); need = false; }
  }

  /* ---------- collegamento con i comandi del sito (js/app.js manda "lesna:engrave") ---------- */
  function label(t) { stage.setAttribute("aria-label", t.trim() ? "Anteprima dell'incisione: " + t.trim() : "Anteprima dell'incisione"); }
  // si scrive il testo intero dopo una pausa: niente effetto per ogni lettera
  function burnSoon() { clearTimeout(timer); timer = setTimeout(function () { startLaser(); }, 900); }
  document.addEventListener("lesna:engrave", function (e) {
    var d = e.detail || {}; state.text = d.text; label(d.text);
    if (d.style && d.style !== state.style) { state.style = d.style; clearTimeout(timer); startLaser(); return; }
    burnSoon();
  });
  document.getElementById("replay3d").addEventListener("click", function () { clearTimeout(timer); anim = null; flash = null; hasInk = false; oldAlpha = 0; oldX.clearRect(0, 0, TW, TH); paintText(); showUpTo(0); startIntro(); });
  window.addEventListener("resize", resize);

  var tin = document.getElementById("text"), sel = document.querySelector('input[name="style"]:checked');
  state.text = tin ? tin.value : state.text; if (sel) state.style = sel.value; label(state.text);
  function boot() { paintBack(); paintText(); showUpTo(reduce ? TW + 10 : 0); wrap.classList.add("has-3d"); resize(); requestAnimationFrame(frame); startIntro(); }
  var fl = ["400 60px Allura", "500 60px Cinzel", "400 60px Antonio"].map(function (f) { return document.fonts && document.fonts.load ? document.fonts.load(f) : Promise.resolve(); });
  Promise.all(fl).catch(function () {}).then(boot);
}
})();
