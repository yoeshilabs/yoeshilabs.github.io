/* You, at the show: a Prancer Portrait seen from inside. Your own paws are in view (bobbing on the beat, swinging as
   you walk, up in the air when you hold Space); at a stand you can reach over the counter and take something, eat it
   bite by bite or drink it down, put on the tour tee or the cap, wave a glow stick. Badges for the things worth doing,
   eight band pins to find, confetti to catch with your paws up, and a card at the end of the night.
     E (or Use)        take something / eat or drink it / put the glow stick away
     Space (or Paws up) paws in the air, hold it                                                                  */
import { ITEMS } from "./items.js";
import { floorAt } from "./venue.js";

export const COATS = [
  { name: "Ginger", arm: "#f2a14a", paw: "#f6b56a", shade: "#c26a20", stripe: "#d9822e" },
  { name: "Midnight", arm: "#2a2630", paw: "#34303b", shade: "#141218" },
  { name: "Cream", arm: "#f4efe4", paw: "#fbf7ef", shade: "#c9c1b3" },
  { name: "Smoke", arm: "#9aa0ab", paw: "#aab0ba", shade: "#6c727d", stripe: "#7d838e" },
  { name: "Tuxedo", arm: "#2a2630", paw: "#f4efe4", shade: "#141218" },
  { name: "Calico", arm: "#f4efe4", paw: "#fbf7ef", shade: "#c9c1b3", patch: ["#f2a14a", "#2a2630"] },
];
const BADGES = [["doors", "Doors open", "Made it inside"], ["front", "Front row", "Reached the barrier"], ["gods", "Up on the concourse", "Climbed to the walkway"],
  ["art", "Art lover", "Visited the Prancer Art Hall"], ["snack", "Snack attack", "Finished something tasty"], ["drink", "Hydrated", "Finished a drink"],
  ["merch", "Merch drip", "Wore the tour tee"], ["glow", "Glow up", "Waved a glow stick on a chorus"], ["pawsup", "Paws up!", "Paws in the air on a chorus"],
  ["confetti", "Confetti catcher", "Caught 25 pieces of confetti"], ["pins", "Met the band", "Found all eight band pins"], ["end", "Stayed to the end", "Saw the whole show"]];
const CHORUS = [[54, 82], [119, 147], [184, 211], [211.3, 236]], inChorus = (t) => CHORUS.some(([a, b]) => t >= a && t < b);
const INK = "#120d16", $ = (id) => document.getElementById(id);
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

export function createGame({ cam, me, venue, STAGE, keys, view, conf }) {
  const cv = $("paws"), g = cv.getContext("2d"); let W = 0, H = 0, S = 0;
  const fit = () => { const d = Math.min(devicePixelRatio, 2); W = innerWidth; H = innerHeight; S = Math.min(W, H) * (W > H ? 1 : 1.25); cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); };
  fit(); addEventListener("resize", fit);
  const st = { coat: COATS[store.get("purrancers-coat", 0)] || COATS[0], holding: null, anim: null, up: 0, upHeld: false, stride: 0, tee: false, cap: false, fx: {}, crumbs: [],
    badges: new Set(), pins: 0, caught: new Set(), upChorus: 0, glowChorus: 0 };

  /* ------------------------------------------------ badges, toasts, the HUD */
  const toastEl = $("toast"), hudEl = $("score"), promptEl = $("prompt");
  let toastT = 0; const toast = (title, line) => { toastEl.innerHTML = `<b>${title}</b><span>${line}</span>`; toastEl.classList.add("on"); toastT = performance.now() + 2600; };
  const award = (key) => { if (st.badges.has(key)) return; st.badges.add(key); const b = BADGES.find((x) => x[0] === key); toast(`★ ${b[1]}`, b[2]); hud(); };
  const hud = () => { hudEl.textContent = `★ ${st.badges.size}/${BADGES.length}   ● Pins ${st.pins}/8`; };
  hud();

  /* ------------------------------------------------ what's in reach */
  const fwd = () => ({ x: -Math.sin(me.yaw), z: -Math.cos(me.yaw) });
  function nearStand() { const f = fwd(); for (const s of venue.stands) { const dx = s.front.x - me.x, dz = s.front.z - me.z, d = Math.hypot(dx, dz);
      if (d < 3.2 && (dx * f.x + dz * f.z) / (d || 1) > 0.35) return s; } return null; }
  function use() { if (st.anim) return; const h = st.holding;
    if (h && (ITEMS[h.key].kind === "food" || ITEMS[h.key].kind === "drink")) { st.anim = { kind: "eat", t: 0, dur: 0.75, bit: false }; return; }
    if (h && h.key === "glow") { st.holding = null; return; }
    const s = nearStand(); if (s && !h) { const key = s.items[s.next % s.items.length]; s.next++; st.anim = { kind: "reach", t: 0, dur: 0.8, key, got: false }; } }
  addEventListener("keydown", (e) => { if (e.code === "KeyE" && !e.repeat) use(); if (e.code === "Space") { st.upHeld = true; e.preventDefault(); } });
  addEventListener("keyup", (e) => { if (e.code === "Space") st.upHeld = false; });
  $("use").addEventListener("pointerdown", (e) => { e.preventDefault(); use(); });
  const pu = $("pawsup"); pu.addEventListener("pointerdown", (e) => { e.preventDefault(); st.upHeld = true; pu.setPointerCapture(e.pointerId); });
  pu.addEventListener("pointerup", () => (st.upHeld = false)); pu.addEventListener("pointercancel", () => (st.upHeld = false));

  function got(key) { const it = ITEMS[key];
    if (key === "tee") { st.tee = true; award("merch"); toast("Tour tee on", "Your sleeves say it all"); return; }
    if (key === "cap") { st.cap = !st.cap; toast(st.cap ? "Tour cap on" : "Cap off", st.cap ? "Brim to the stage" : "Back in your pocket"); return; }
    st.holding = { key, used: 0 }; toast(it.name, it.kind === "drink" ? "Press E to drink" : it.kind === "food" ? "Press E to eat" : "Hold Space and wave it on a chorus"); }
  function bite() { const h = st.holding, it = ITEMS[h.key]; h.used = Math.min(1, h.used + 1 / 3);
    if (it.kind === "food") for (let i = 0; i < 14; i++) st.crumbs.push({ x: W * 0.5 + (Math.random() - 0.5) * S * 0.12, y: H * 0.93, vx: (Math.random() - 0.5) * 140, vy: -60 - Math.random() * 140, c: it.crumbs, life: 1 });
    if (h.used >= 0.999) { st.holding = null; award(it.kind === "drink" ? "drink" : "snack"); const now = performance.now();
      if (h.key === "cola") { st.fx.cola = now + 12000; toast("Catnip Cola", "Whoa. The room is swirling"); }
      if (h.key === "shake") { st.fx.freeze = now + 3500; toast("Brain freeze", "Worth it"); }
      if (h.key === "candy") { st.fx.candy = now + 8000; toast("Sugar rush", "Everything is pink"); }
      if (h.key === "water") { st.fx = {}; toast("Refreshing", "Clear head, ready to dance"); } } }

  /* ------------------------------------------------ the paws */
  const lerp = (a, b, k) => a + (b - a) * k, ease = (k) => k * k * (3 - 2 * k);
  /* one arm, from off the bottom of the screen to the paw: a tapered furry sleeve of a limb, shaded across its width, tufts of
     fur along its edges, a ruff at the wrist, then the back of the paw with four toes, soft shadow and a rim of light */
  const shadeOf = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  function limb(pts, w0, w1, tuft) {   // the outline of a tapering limb along pts, fur tufts on both edges
    const L = [], R = []; for (let i = 0; i < pts.length; i++) { const [x, y] = pts[i], [x2, y2] = pts[Math.min(i + 1, pts.length - 1)], [x0, y0] = pts[Math.max(i - 1, 0)];
      let nx = -(y2 - y0), ny = x2 - x0; const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d; const w = lerp(w0, w1, i / (pts.length - 1)) / 2, f = tuft && i % 2 ? 1.12 : 1;
      L.push([x + nx * w * f, y + ny * w * f]); R.push([x - nx * w * (tuft && i % 2 === 0 ? 1.1 : 1), y - ny * w * (tuft && i % 2 === 0 ? 1.1 : 1)]); }
    g.beginPath(); g.moveTo(...L[0]); for (const p of L.slice(1)) g.lineTo(...p); for (const p of R.reverse()) g.lineTo(...p); g.closePath(); }
  function arm(side, px, py, sc) { const c = st.coat, bx = side < 0 ? W * 0.05 : W * 0.95, by = H + S * 0.2, T = S * 0.13 * sc;
    const mx = lerp(bx, px, 0.5) + side * S * 0.06, my = lerp(by, py, 0.55), N = 16, pts = [];
    for (let i = 0; i <= N; i++) { const k = i / N; pts.push([lerp(lerp(bx, mx, k), lerp(mx, px, k), k), lerp(lerp(by, my, k), lerp(my, py + S * 0.03 * sc, k), k)]); }
    const rot = side * -0.22, rx = S * 0.076 * sc, ry = S * 0.062 * sc, ca = Math.cos(rot), sa = Math.sin(rot);
    const at = (x, y) => [px + x * ca - y * sa, py + x * sa + y * ca];                         // paw space to screen
    const TOES = [-1.5, -0.5, 0.5, 1.5].map((i) => { const [x, y] = at(i * rx * 0.46, -ry * (0.74 + (Math.abs(i) < 1 ? 0.1 : 0))); return [x, y, rx * 0.29, ry * 0.36, rot + i * 0.18]; });
    const [bxp, byp] = at(0, ry * 0.08);
    /* the whole silhouette (arm, paw, toes) is one shape: ink strokes for every part first, then every fill on top, so
       only the outer edge keeps its outline and nothing shows where the parts meet */
    const toe = ([x, y, a, b_, r]) => () => { g.beginPath(); g.ellipse(x, y, a, b_, r, 0, 7); };
    const shapes = [() => limb(pts, T * 1.25, T * 0.86, true), () => { g.beginPath(); g.ellipse(bxp, byp, rx, ry, rot, 0, 7); }, ...TOES.map(toe)];
    g.save(); g.shadowColor = "rgba(0,0,0,.4)"; g.shadowBlur = S * 0.03; g.shadowOffsetY = S * 0.012;   // one soft shadow under the paw
    g.beginPath(); g.ellipse(bxp, byp, rx, ry, rot, 0, 7); g.fillStyle = INK; g.fill(); g.restore();
    g.lineJoin = "round"; g.lineWidth = 7; g.strokeStyle = INK; for (const sh of shapes) { sh(); g.stroke(); }
    const across = g.createLinearGradient(px - side * T, py, px + side * T, py);                    // light from the stage, top and inside
    across.addColorStop(0, shadeOf(c.arm, 1.12)); across.addColorStop(0.55, c.arm); across.addColorStop(1, shadeOf(c.arm, 0.68));
    shapes[0](); g.fillStyle = across; g.fill();
    const pg = g.createRadialGradient(...at(-rx * 0.3, -ry * 0.6), rx * 0.1, bxp, byp, rx * 1.35); pg.addColorStop(0, shadeOf(c.paw, 1.1)); pg.addColorStop(0.65, c.paw); pg.addColorStop(1, shadeOf(c.paw, 0.74));
    for (const sh of shapes.slice(1)) { sh(); g.fillStyle = pg; g.fill(); }
    if (c.stripe) for (let k = 0.35; k < 0.86; k += 0.12) { const [x, y] = pts[Math.round(k * N)]; g.beginPath(); g.moveTo(x - T * 0.42, y - T * 0.1); g.quadraticCurveTo(x, y + T * 0.08, x + T * 0.4, y - T * 0.05);
      g.lineWidth = T * 0.13; g.lineCap = "round"; g.strokeStyle = c.stripe; g.stroke(); }
    if (c.patch) { const [x, y] = pts[Math.round(0.6 * N)]; g.beginPath(); g.ellipse(x, y, T * 0.42, T * 0.3, side * 0.5, 0, 7); g.fillStyle = c.patch[side < 0 ? 0 : 1]; g.fill(); }
    g.save(); g.globalAlpha = 0.35; g.strokeStyle = shadeOf(c.arm, 0.7); g.lineWidth = 1.4; g.lineCap = "round";   // fur strands
    for (let i = 3; i < N - 3; i += 2) { const [x, y] = pts[i]; g.beginPath(); g.moveTo(x - T * 0.2, y); g.lineTo(x - T * 0.1, y - T * 0.12); g.moveTo(x + T * 0.15, y + T * 0.05); g.lineTo(x + T * 0.24, y - T * 0.08); g.stroke(); } g.restore();
    const creases = (y0, y1) => { g.lineCap = "round"; g.lineWidth = Math.max(1.5, S * 0.0035); g.strokeStyle = shadeOf(c.paw, 0.78);   // the creases between the toes, soft and short
      for (let i = 0; i < 3; i++) { const x = (i - 1) * rx * 0.46; g.beginPath(); g.moveTo(...at(x, -ry * y0)); g.quadraticCurveTo(...at(x * 1.03, -ry * (y0 + y1) / 2), ...at(x * 1.06, -ry * y1)); g.stroke(); } };
    creases(0.9, 0.56);
    g.beginPath(); g.ellipse(...at(-rx * 0.28, -ry * 0.12), rx * 0.34, ry * 0.17, rot - 0.5, 0, 7); g.fillStyle = "rgba(255,255,255,.22)"; g.fill();   // a soft shine
    g.beginPath(); g.ellipse(bxp, byp, rx * 0.93, ry * 0.93, rot, Math.PI * 1.08, Math.PI * 1.55); g.lineWidth = 2.5; g.strokeStyle = "rgba(255,190,240,.5)"; g.stroke();   // rim light from the stage
    if (st.tee) { const sl = pts.slice(0, Math.round(N * 0.6) + 1); limb(sl, T * 1.6, T * 1.4, false);   // the tour tee's sleeve, with a hem and a fold
      const tg = g.createLinearGradient(px - side * T * 1.4, py, px + side * T * 1.4, py); tg.addColorStop(0, "#ff86bf"); tg.addColorStop(0.6, "#ff5fa8"); tg.addColorStop(1, "#c93a7e");
      g.fillStyle = tg; g.fill(); g.lineWidth = 3.5; g.strokeStyle = INK; g.stroke(); const [hx, hy] = sl[sl.length - 1], [qx, qy] = sl[sl.length - 3];
      g.save(); g.translate(hx, hy); g.rotate(Math.atan2(hy - qy, hx - qx) + Math.PI / 2); g.beginPath(); g.moveTo(-T * 0.72, -T * 0.12); g.lineTo(T * 0.72, -T * 0.12); g.lineWidth = 2.5; g.strokeStyle = "#ffd36e"; g.stroke(); g.restore();
      const [fx_, fy_] = sl[Math.round(sl.length / 2)]; g.beginPath(); g.moveTo(fx_ - T * 0.3, fy_ + T * 0.1); g.quadraticCurveTo(fx_, fy_ - T * 0.1, fx_ + T * 0.25, fy_ + T * 0.15); g.lineWidth = 2; g.strokeStyle = "rgba(120,20,70,.6)"; g.stroke(); }
  }
  function drawPaws(t, b, dt, now, moving) { g.clearRect(0, 0, W, H);
    const pulse = Math.exp(-(((b % 1) + 1) % 1) * 5), pulse2 = Math.exp(-((((b + 0.5) % 1) + 1) % 1) * 5);
    st.up += ((st.upHeld ? 1 : 0) - st.up) * Math.min(1, dt * 9); const U = ease(st.up);
    st.stride += dt * 7 * moving; const sw = Math.sin(st.stride) * S * 0.025 * moving;
    let lx = W * 0.27, ly = H * 0.9 - S * 0.018 * pulse2 + sw, rx = W * 0.73, ry = H * 0.9 - S * 0.018 * pulse - sw, rs = 1;
    const wave = Math.sin(now / 1000 * 7) * S * 0.035;
    const upY = Math.max(H * 0.4, H - S * 0.62);   // paws up, but never noodle arms on a tall phone screen
    lx = lerp(lx, W * 0.3 + wave, U); ly = lerp(ly, upY, U); rx = lerp(rx, W * 0.7 - wave, U); ry = lerp(ry, upY, U);
    if (st.freeze()) { lx += (Math.random() - 0.5) * 4; rx += (Math.random() - 0.5) * 4; }
    const a = st.anim; if (a) { a.t += dt; const k = Math.min(1, a.t / a.dur), e = Math.sin(Math.PI * k);
      if (a.kind === "reach") { rx = lerp(rx, W * 0.56, e); ry = lerp(ry, H * 0.58, e); rs = lerp(1, 0.7, e); if (k > 0.5 && !a.got) { a.got = true; got(a.key); } }
      if (a.kind === "eat") { rx = lerp(rx, W * 0.53, e); ry = lerp(ry, H * 1.02, e); rs = lerp(1, 1.25, e); if (k > 0.5 && !a.bit) { a.bit = true; bite(); } }
      if (k >= 1) st.anim = null; }
    const h = st.holding; arm(-1, lx, ly, 1); arm(1, rx, ry, rs);
    if (h) { g.save(); g.translate(rx, ry - S * 0.06 * rs); if (h.key === "glow") g.rotate(Math.sin(now / 1000 * 7) * 0.5 * U); ITEMS[h.key].draw(g, S * 0.2 * rs, h.used, now / 1000); g.restore(); }   // what you hold, whole, in front of your paw
    for (const c of st.crumbs) { c.vy += 600 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt * 0.9; g.fillStyle = c.c; g.globalAlpha = Math.max(0, c.life); g.fillRect(c.x, c.y, 6, 5); } g.globalAlpha = 1;
    st.crumbs = st.crumbs.filter((c) => c.life > 0 && c.y < H + 20);
    if (st.cap) { g.beginPath(); g.moveTo(-10, -10); g.lineTo(W + 10, -10); g.lineTo(W + 10, H * 0.04); g.quadraticCurveTo(W / 2, H * 0.13, -10, H * 0.04); g.closePath();   // the brim, just in view
      g.fillStyle = "#d9437f"; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); g.setLineDash([10, 8]); g.beginPath(); g.moveTo(0, H * 0.035); g.quadraticCurveTo(W / 2, H * 0.105, W, H * 0.035);
      g.strokeStyle = "rgba(255,211,110,.7)"; g.lineWidth = 2; g.stroke(); g.setLineDash([]); }
    if (st.fx.candy > now) { const gr = g.createRadialGradient(W / 2, H / 2, S * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7); gr.addColorStop(0, "rgba(255,156,203,0)"); gr.addColorStop(1, "rgba(255,156,203,.45)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    if (st.freeze()) { const gr = g.createRadialGradient(W / 2, H / 2, S * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7); gr.addColorStop(0, "rgba(127,230,255,0)"); gr.addColorStop(1, "rgba(127,230,255,.5)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    view.style.filter = st.fx.cola > now ? `hue-rotate(${Math.sin(now / 700) * 70}deg) saturate(1.6)` : ""; }
  st.freeze = () => st.fx.freeze > performance.now();

  /* ------------------------------------------------ confetti in your paws (the same path the shader draws) */
  function catchConfetti(t) { if (st.up < 0.6) return; const p = cam.position, f = fwd(), hx = p.x + f.x * 0.6, hz = p.z + f.z * 0.6, hy = p.y + 0.4; let any = false;
    for (let c = 0; c < conf.CUES.length; c++) { const dt0 = t - conf.CUES[c]; if (dt0 < 0.8 || dt0 > 30) continue;
      for (let i = c * 5200; i < (c + 1) * 5200; i += 2) { const V = conf.cv, Pp = conf.cp, dt = t - V[i * 4 + 3]; if (dt < 0 || dt > 40) continue;
        const e = (1 - Math.exp(-1.2 * dt)) / 1.2, x = Pp[i * 3] + V[i * 4] * e + 0.25 * Math.sin(dt * 3 + V[i * 4] * 7), y = Math.max(0.04, Pp[i * 3 + 1] + V[i * 4 + 1] * e - 0.8 * dt), z = Pp[i * 3 + 2] + V[i * 4 + 2] * e;
        if ((x - hx) ** 2 + (y - hy) ** 2 + (z - hz) ** 2 < 2.6) { st.caught.add(i); V[i * 4 + 3] = -100; any = true; } } }
    if (any) { conf.attr.needsUpdate = true; if (st.caught.size >= 25) award("confetti"); } }

  /* ------------------------------------------------ every frame */
  function update(t, dt, b, now, moving, live) {
    if (performance.now() > toastT) toastEl.classList.remove("on");
    const r = Math.hypot(me.x - STAGE.x, me.z - STAGE.z), a = Math.atan2(me.x - STAGE.x, -(me.z - STAGE.z));
    if (live) { award("doors"); if (r < 9.4) award("front"); if (r > 20.6) award("gods"); if (r > 21.5 && a > venue.hall.a0 && a < venue.hall.a1) award("art");
      if (inChorus(t) && st.up > 0.8) { st.upChorus += dt; if (st.upChorus > 2) award("pawsup"); if (st.holding?.key === "glow") { st.glowChorus += dt; if (st.glowChorus > 2) award("glow"); } }
      catchConfetti(t); }
    for (const p of venue.pins) if (!p.got && Math.hypot(p.base.x - me.x, p.base.z - me.z) < 1.4 && Math.abs(p.base.y - (me.eye - 0.1)) < 2.2) {
      p.got = true; p.sprite.visible = false; p.halo.intensity = 0;   // dim the light, never remove it: a change in the number of lights rebuilds every shader (a half-second stall)
       st.pins++; hud(); toast(`Band pin ${st.pins} of 8`, `The ${p.who === "me" ? "singer" : p.who} pin`); if (st.pins === 8) award("pins"); }
    const s = !st.anim && nearStand(), h = st.holding;
    promptEl.textContent = h && ITEMS[h.key].kind !== "hold" ? `E  ${ITEMS[h.key].kind === "drink" ? "Drink" : "Eat"} the ${ITEMS[h.key].name.toLowerCase()}`
      : h ? "E  Put the glow stick away" : s ? `E  Grab ${s.key === "merch" ? "" : "a "}${ITEMS[s.items[s.next % s.items.length]].name.toLowerCase()}` : "";
    promptEl.classList.toggle("on", !!promptEl.textContent);
    drawPaws(t, b, dt, now, moving); }

  function recap() { award("end"); store.set("purrancers-badges", [...st.badges]);
    const v = document.createElement("div"); v.className = "veil";
    v.innerHTML = `<div class="card recap"><img src="assets/purrancers-title.png" alt="The Purrancers"><p>Thank you for coming out tonight. Your night:</p>
      <ul>${BADGES.map(([k, n, l]) => `<li class="${st.badges.has(k) ? "got" : ""}"><b>${st.badges.has(k) ? "★" : "☆"} ${n}</b><span>${l}</span></li>`).join("")}</ul>
      <p>Band pins ${st.pins} of 8 · confetti caught ${st.caught.size}</p><button>See it again</button></div>`;
    document.body.appendChild(v); return v; }
  function setCoat(i) { st.coat = COATS[i]; store.set("purrancers-coat", i); }
  return { update, recap, setCoat, coatIndex: () => COATS.indexOf(st.coat) };
}
