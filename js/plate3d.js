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
  var cv = document.getElementById("gl3d"), stage = document.getElementById("stage3d"), wrap = stage.parentNode;
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
  (function () {
    var c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    var x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#c9d1e2"); g.addColorStop(0.38, "#6f7b98"); g.addColorStop(0.55, "#252d4a"); g.addColorStop(0.8, "#4b5676"); g.addColorStop(1, "#a9b3c8");
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    x.shadowColor = "#ffffff"; x.shadowBlur = 40;
    [0, 512].forEach(function (o) {
      function bx(col, rx, ry, rw, rh) { x.fillStyle = col; x.fillRect(o + rx, ry, rw, rh); x.fillRect(o + 512 - rx - rw, ry, rw, rh); }
      bx("#ffffff", 120, 40, 272, 70); bx("#ffffff", 20, 130, 60, 250); bx("#ffffff", 230, 120, 52, 40);
      bx("#ffe9cf", 186, 210, 140, 36); bx("#cfe0ff", 60, 400, 150, 24);
    });
    var tex = new THREE.CanvasTexture(c); tex.mapping = THREE.EquirectangularReflectionMapping; tex.encoding = THREE.sRGBEncoding;
    var pm = new THREE.PMREMGenerator(renderer); pm.compileEquirectangularShader();
    scene.environment = pm.fromEquirectangular(tex).texture; tex.dispose(); pm.dispose();
  })();
  var key = new THREE.SpotLight(0xfff0dc, 1.3, 60, 0.55, 1, 1); key.position.set(0, 10, 6); key.castShadow = true;
  key.shadow.mapSize.set(512, 512); key.shadow.bias = -0.0004; key.shadow.radius = 5; scene.add(key, key.target);

  function rnd(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- piano che riceve solo l'ombra ---------- */
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.ShadowMaterial({ opacity: 0.22 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  /* ---------- la targhetta, sdraiata sul tessuto ---------- */
  var PW = 2.3, PH = 0.6, PD = 0.11, B = 3.3, A = 3.0;
  var plateG = new THREE.Group(); scene.add(plateG);
  var zc = B * 0.9;
  plateG.rotation.x = -Math.PI / 2; plateG.position.set(0, PD / 2 + 0.03, zc);
  var steel = (function () {
    var W = 1024, H = 512, r = rnd(5), rc = document.createElement("canvas"), bc = document.createElement("canvas");
    rc.width = bc.width = W; rc.height = bc.height = H;
    var x = rc.getContext("2d"), y = bc.getContext("2d");
    x.fillStyle = "rgb(84,84,84)"; x.fillRect(0, 0, W, H); y.fillStyle = "#808080"; y.fillRect(0, 0, W, H);
    var i, v, yy, len, xx;
    for (i = 0; i < 2600; i++) { yy = r() * H; xx = r() * W; len = 40 + r() * 200; v = Math.round(70 + r() * 30); x.fillStyle = "rgba(" + v + "," + v + "," + v + ",.35)"; x.fillRect(xx, yy, len, 1);
      v = Math.round(118 + r() * 20); y.fillStyle = "rgba(" + v + "," + v + "," + v + ",.35)"; y.fillRect(xx, yy, len, 1); }
    for (i = 0; i < 0; i++) { var sx = r() * W, sy = r() * H, sl = 8 + r() * 26, a = (r() - 0.5) * 0.9;
      x.strokeStyle = "rgba(170,170,170,.7)"; x.lineWidth = 0.8; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + sl, sy + sl * a); x.stroke();
      y.strokeStyle = "rgba(235,235,235,.8)"; y.lineWidth = 0.8; y.beginPath(); y.moveTo(sx, sy); y.lineTo(sx + sl, sy + sl * a); y.stroke(); }
    var a1 = new THREE.CanvasTexture(rc), a2 = new THREE.CanvasTexture(bc); a1.anisotropy = a2.anisotropy = 4; return { rough: a1, bump: a2 };
  })();
  var plateMat = new THREE.MeshStandardMaterial({ color: 0xeceef0, metalness: 1, roughness: 1, roughnessMap: steel.rough, bumpMap: steel.bump, bumpScale: 0.07, envMapIntensity: 1.3 });
  function setSteel(d) { plateMat.bumpScale = 0.07 * (0.5 + 0.5 * d); }
  function rr(w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  var pg = new THREE.ExtrudeGeometry(rr(PW, PH, 0.07), { depth: PD, bevelEnabled: true, bevelThickness: 0.022, bevelSize: 0.022, bevelSegments: 4, curveSegments: 10 });
  pg.translate(0, 0, -PD / 2);
  (function () { var p = pg.attributes.position, uv = pg.attributes.uv; for (var q = 0; q < p.count; q++) { var nz = Math.abs(pg.attributes.normal.getZ(q)); if (nz > 0.9) uv.setXY(q, p.getX(q) / PW + 0.5, p.getY(q) / PH + 0.5); else uv.setXY(q, 0.013, 0.013); } uv.needsUpdate = true; })();
  var plate = new THREE.Mesh(pg, plateMat); plate.castShadow = true; plate.receiveShadow = true; plateG.add(plate);
  var plateLight = new THREE.PointLight(0xffffff, 0.8, 6, 2); plateLight.position.set(0, -0.7, 1.6); plateG.add(plateLight);
  key.target.position.copy(plateG.position);

  /* ---------- incisione: texture di testo, retro, "calore" del laser ---------- */
  var DW = PW - 0.3, DH = PH - 0.2, TW = 1560, TH = Math.round(TW * DH / DW);
  function mk(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  var textC = mk(TW, TH), alphaC = mk(TW, TH), backC = mk(TW, TH), heatC = mk(TW, TH);
  var aTex = new THREE.CanvasTexture(alphaC), bTex = new THREE.CanvasTexture(backC), hTex = new THREE.CanvasTexture(heatC);
  [aTex, bTex].forEach(function (t) { t.anisotropy = 4; });
  function decalMat(tex) {
    return new THREE.MeshStandardMaterial({ color: 0x14171a, metalness: 0.5, roughness: 0.5, alphaMap: tex, bumpMap: tex, bumpScale: -1.6, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, envMapIntensity: 0.8 });
  }
  var dg = new THREE.PlaneGeometry(DW, DH), zf = PD / 2 + 0.024;
  var decal = new THREE.Mesh(dg, decalMat(aTex)); decal.position.set(0, 0, zf); plateG.add(decal);
  var heat = new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ color: 0xff8f45, alphaMap: hTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, opacity: 0.9, fog: false }));
  heat.position.set(0, 0, zf + 0.002); plateG.add(heat);
  var backDecal = new THREE.Mesh(dg, decalMat(bTex)); backDecal.rotation.y = Math.PI; backDecal.position.set(0, 0, -zf); plateG.add(backDecal);

  var STY = { corsivo: { f: "Allura", w: "400", k: 0.82, up: false, ls: 0 }, romano: { f: "Cinzel", w: "500", k: 0.46, up: true, ls: 0.06 }, blocco: { f: "Antonio", w: "400", k: 0.62, up: true, ls: 0.1 } };
  var state = { text: "Sempre al tuo fianco", style: "corsivo" };
  var tx0 = 0, tx1 = TW, colMin = new Int16Array(TW), colMax = new Int16Array(TW);
  var layout = null, engraved = { text: null, style: null };
  function prefixX(n) {
    var c = textC.getContext("2d"); c.font = layout.font; if (layout.ls != null) c.letterSpacing = layout.ls;
    return layout.cx - layout.w / 2 + c.measureText(layout.label.slice(0, n)).width;
  }
  function paintText() {
    var c = textC.getContext("2d");
    c.fillStyle = "#000"; c.fillRect(0, 0, TW, TH); c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
    var st = STY[state.style], label = state.text.trim() || "Il tuo testo"; if (st.up) label = label.toUpperCase();
    var maxW = TW * 0.9, size = TH * st.k;
    function setF() { c.font = st.w + " " + size + "px '" + st.f + "'"; if ("letterSpacing" in c) c.letterSpacing = (size * st.ls) + "px"; }
    setF(); while (c.measureText(label).width > maxW && size > 24) { size -= 4; setF(); }
    var cxT = TW / 2; c.fillText(label, cxT, TH * 0.54);
    layout = { label: label, cx: cxT, font: c.font, ls: "letterSpacing" in c ? c.letterSpacing : null, w: c.measureText(label).width };
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
    var c = alphaC.getContext("2d"), edge = 26;
    c.globalCompositeOperation = "source-over"; c.fillStyle = "#000"; c.fillRect(0, 0, TW, TH); c.drawImage(textC, 0, 0);
    if (front < tx1 + 2) {
      var g = c.createLinearGradient(front - edge, 0, front, 0); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,1)");
      c.fillStyle = g; c.fillRect(front - edge, 0, edge, TH); c.fillStyle = "#000"; c.fillRect(front, 0, TW - front, TH);
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
    glow.material.opacity = 0.9 * k; glow.scale.set(0.3, 0.3, 1); light.intensity = 2.2 * k; return true;
  }
  function startLaser(from, durOv) {
    paintText(); engraved = { text: state.text, style: state.style };
    if (reduce) { showUpTo(TW + 10); need = true; return; }
    var f = from == null ? tx0 - 4 : Math.max(tx0 - 4, from);
    anim = { t0: performance.now(), from: f, dur: durOv || (500 + 1500 * Math.min(1, (tx1 + 6 - f) / (TW * 0.9))) };
  }
  function stepLaser(now) {
    if (!anim) return;
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
      anim = null; flash = { t0: now, pt: pt.clone() }; glow.material.opacity = 0; light.intensity = 0; showUpTo(TW + 10); }
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
  var DEF = { az: 0, el: 1.32, r: 3.0 }, view = { az: DEF.az, el: DEF.el, r: DEF.r };
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
    if (reduce) { setSteel(0); placeCamera(); startLaser(); return; }
    setSteel(1); view.az = DEF.az; view.el = DEF.el; view.r = DEF.r; buildIntro();
    intro = { t0: performance.now() }; clearTimeout(timer); timer = setTimeout(function () { startLaser(null, 1300); }, 350); need = true;
  }
  function endIntro() { if (!intro) return; intro = null; setSteel(0); placeCamera(); }
  function stepIntro(now) {
    var u = Math.min(1, (now - intro.t0) / INTRO_MS), e = easeIO(u); setSteel(1 - Math.min(1, Math.max(0, (e - 0.35) / 0.4)));
    camera.position.copy(camCurve.getPoint(e)); camera.lookAt(lookCurve.getPoint(e)); need = true;
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
  function burnSoon(from) { clearTimeout(timer); timer = setTimeout(function () { startLaser(from); }, 450); }
  function label(t) { stage.setAttribute("aria-label", t.trim() ? "Anteprima dell'incisione: " + t.trim() : "Anteprima dell'incisione"); }
  function setText(t) {
    flash = null; if (anim) { anim = null; glow.material.opacity = 0; light.intensity = 0; }
    var old = engraved.text || "", same = engraved.style === state.style;
    state.text = t; label(t); paintText();
    if (!t.trim()) { engraved.text = ""; showUpTo(0); need = true; return; }
    var k = 0; if (same) { while (k < old.length && k < t.length && old.charAt(k) === t.charAt(k)) k++; }
    var cut = k ? prefixX(Math.min(k, layout.label.length)) : 0;
    if (same && k === t.length) { engraved.text = t; showUpTo(TW + 10); need = true; return; }
    engraved.text = old.slice(0, k); showUpTo(cut ? cut : 0); need = true; burnSoon(cut || null);
  }
  document.addEventListener("lesna:engrave", function (e) {
    var d = e.detail || {};
    if (d.style && d.style !== state.style) { state.style = d.style; state.text = d.text; label(d.text); clearTimeout(timer); anim = null; flash = null; startLaser(); return; }
    setText(d.text);
  });
  document.getElementById("replay3d").addEventListener("click", function () { clearTimeout(timer); anim = null; flash = null; paintText(); showUpTo(0); startIntro(); });
  window.addEventListener("resize", resize);

  var tin = document.getElementById("text"), sel = document.querySelector('input[name="style"]:checked');
  state.text = tin ? tin.value : state.text; if (sel) state.style = sel.value; label(state.text);
  function boot() { paintBack(); paintText(); showUpTo(reduce ? TW + 10 : 0); wrap.classList.add("has-3d"); resize(); requestAnimationFrame(frame); startIntro(); }
  var fl = ["400 60px Allura", "500 60px Cinzel", "400 60px Antonio"].map(function (f) { return document.fonts && document.fonts.load ? document.fonts.load(f) : Promise.resolve(); });
  Promise.all(fl).catch(function () {}).then(boot);
}
})();
