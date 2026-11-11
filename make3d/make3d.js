/* Make it 3D (the Lab, on the front door): a holder's own Prancer as a .glb, the same cat as the mint.
     Prancer Portraits  the 3D genes from the mint's own seed (prancer-3d/src/genes.js), dressed as the show dresses
                        them (prancer-band/show3d/you3d.js): the same cat a holder walks into the show as
     Prancer 3D         the generator's own cat (prancer-3d/gen/src/cat.js buildCat): same seed, same cat as the cover
   The wallet is asked for its address only (prancers/site/connect.js: no scopes, every request that could sign or send
   switched off), or an address is pasted. Holdings are read from TzKT: an address in, public token data out. Only a
   holder's own cats can be downloaded; the cat on the stage before that is a preview. The file is made in the browser
   (prancer-3d/src/glb.js: coat and eyes baked by their own shaders, the rig, seven moves) and never leaves the device.
   Testing on this Mac only: ?holder=<address>, ?seed3d=<a mint seed> (stands in for a Prancer 3D mint before launch). */
import * as THREE from "three";
import { RoomEnvironment } from "./p3d/lib/jsm/environments/RoomEnvironment.js";
import { genesFor } from "./p3d/src/genes.js";
import { Avatar, sigsOf } from "./p3d/src/avatar.js";
import { addHat, addNeck, holdPose, upright } from "./p3d/src/wardrobe.js";
import { Drape } from "./p3d/src/drape.js";
import { exportGLB, prancerClips } from "./p3d/src/glb.js";
import { COAT } from "./p3d/src/coat.js";
import { buildCat, rollSeed } from "./p3d/gen/src/cat.js";
import { MOVES as SIGNATURE } from "./p3d/gen/src/traits.js";
import { portraitsOf, prancer3dOf as mintsOf3d } from "./band/show3d/portraits.js";   /* the show's own lookups: the generator's contract (PRANCER_3D) is filled there on launch day */
import { connectReadOnly } from "./prancers/site/connect.js";

const ADDR = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/, LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname), QS = new URLSearchParams(location.search);
const MOBILE = /Mobi|Android/.test(navigator.userAgent), SHELLS = MOBILE ? 7 : 12;
const $ = (id) => document.getElementById(id), say = (t, bad) => { $("msg").textContent = t; $("msg").classList.toggle("bad", !!bad); };

/* ---------------------------------------------------------------- the holdings: TzKT, read only */
async function prancer3dOf(address) {
  const out = ADDR.test(address || "") ? (await mintsOf3d(address)).map((x) => ({ kind: "p3d", no: x.no, name: (() => { try { return String(rollSeed(x.seed).NAME || ""); } catch (e) { return ""; } })(), seed: x.seed }))   /* its name, rolled from its seed as the generator rolls it (TzKT may not have the mint's metadata yet) */ : [];
  if (LOCAL && QS.get("seed3d")) out.push({ kind: "p3d", no: "test", name: "", seed: QS.get("seed3d").slice(0, 64) });   // testing on this Mac, before the generator is minted
  return out;
}
async function holdings(address) {
  const [pp, p3] = await Promise.all([portraitsOf(address), prancer3dOf(address)]);
  return [...p3, ...pp.map((x) => ({ kind: "portrait", no: x.no, name: x.name, seed: x.seed }))];
}

/* ---------------------------------------------------------------- the cats: the same code the show and the generator use */
/* cloth: on the stage a cape or skirt is cloth (prancer-3d/src/drape.js), as in the generator and the show; the file is made
   from a second build without it, so a hem caught mid-swing never goes into a download */
const cloth = (on) => (on ? (a) => new Drape(a) : null), BPM = { Playful: 20, Goofy: 16, Sleepy: -20, Zen: -18, Chill: -10 };
const played = (av, G, name) => ({ av, name, move: G.MOVE || SIGNATURE[G.TEMP] || "wave", bpm: 96 + (BPM[G.TEMP] || 0) });   // its own signature move and pace, as the generator gives them
function portraitCat(seed, onStage = true) {
  const G = { ...genesFor(seed) }, av = new Avatar(G, { shells: SHELLS, sig: sigsOf(G), drape: cloth(onStage) });
  if (G.HAT && G.HAT !== "None") addHat(av, G.HAT, [G.C1, G.C2]);
  if (G.NECK && G.NECK !== "None") addNeck(av, G.NECK, [G.C1, G.C2]);
  return played(av, G, G.NAME || "Prancer");
}
function prancer3dCat(seed, onStage = true) { const G = rollSeed(seed), { cat } = buildCat(G, { instrument: false, shells: SHELLS, drape: cloth(onStage) }); return played(cat, G, G.NAME || "Prancer 3D"); }
const forFile = () => { const c = cur.card, m = c.kind === "p3d" ? prancer3dCat(c.seed, false) : portraitCat(c.seed, false); m.av.update({ t: 0, dt: 1 / 60, speed: 0, phase: 0, air: 0, vy: 0, land: 0, look: new THREE.Vector2() }); m.av.root.updateMatrixWorld(true); return m.av; };

/* ---------------------------------------------------------------- the stage */
const box = $("stage"), renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95; renderer.setClearColor(0x000000, 0);
box.prepend(renderer.domElement);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(28, 1, 0.05, 100);
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.45;
const key = new THREE.DirectionalLight(0xfff1e0, 2.2); key.position.set(2.5, 4, 3.5); scene.add(key);
const rim = new THREE.DirectionalLight(0xff5fa8, 1.5); rim.position.set(-3, 2.5, -3); scene.add(rim);
const cool = new THREE.DirectionalLight(0x7fe6ff, 0.6); cool.position.set(3, 1.5, -2.5); scene.add(cool);
scene.add(new THREE.HemisphereLight(0xb9a0ff, 0x1c1028, 0.55));
const shadow = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; return m; })();
scene.add(shadow);
const turn = new THREE.Group(); scene.add(turn);
function fit() { const w = box.clientWidth, h = box.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(fit).observe(box); fit();

let cur = null, spin = 0, drag = null, lastT = performance.now();
const LOOK = new THREE.Vector2(), dispose = (o) => o.traverse((x) => { x.geometry?.dispose?.(); for (const m of [].concat(x.material || [])) m.dispose?.(); });
function show(made, label, own) {
  if (cur) { turn.remove(cur.holder); dispose(cur.holder); }
  const holder = new THREE.Group(); holder.add(made.av.root);
  made.av.update({ t: 0, dt: 1 / 60, speed: 0, phase: 0, air: 0, vy: 0, land: 0, look: LOOK }); holder.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(made.av.root), size = bb.getSize(new THREE.Vector3()), k = 1 / size.y;   // the cat a metre tall on the stage
  holder.scale.setScalar(k); holder.position.set(-(bb.min.x + bb.max.x) / 2 * k, -bb.min.y * k, -(bb.min.z + bb.max.z) / 2 * k); turn.add(holder);
  shadow.scale.setScalar(Math.max(size.x, size.z) * k * 1.6);
  Object.assign(st, { y: 0, vy: 0, air: 0, land: 0, face: 0, faceTo: 0, idle: 9, phase: 0, emote: null, wind: 0, seen: 0 }); made.headY = bb.min.y + size.y * 0.82;
  camera.position.set(0, 0.62, 3.4); camera.lookAt(0, 0.48, 0);
  cur = { ...made, holder, own, label }; $("who").textContent = label; $("glb").disabled = !own; $("ar").disabled = !own; $("arnote").hidden = true;
}
/* playing it, as the generator plays (prancer-3d gen/src/piece.js; Yoeshi, 2026-11-10: everything the cat gains ports to the
   experiences and the Lab): tap it for its signature move, the six moves on the buttons or 1 to 6, Space to jump, W A S D or
   the arrows to walk it on the spot (Shift runs: W away from you, S toward you), and its eyes find you wherever you turn it */
const MOVES = [["wave", "Wave", 2.6], ["posey", "Posey Paw", 5], ["pawsup", "Paws Up", 3], ["dance", "Dance", 6], ["knead", "Knead", 5], ["spin", "Spin", 1.6]], LEN = Object.fromEntries(MOVES.map(([m, , l]) => [m, l]));
const st = {}, KEYS = {}, WIND = new THREE.Vector3(), AIM = new THREE.Vector3(), TO = new THREE.Vector2(), clamp = (x, a, b) => Math.max(a, Math.min(b, x)), wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const go = (m) => { if (!cur) return; st.emote = m; st.emoteT = 0; st.emoteLen = LEN[m]; };
box.tabIndex = 0; box.setAttribute("aria-label", "Your Prancer in 3D: drag to turn it, tap it for its move, 1 to 6 for the moves, Space to jump, W A S D to walk");
{ const row = document.createElement("div"); row.className = "moves"; for (const [m, label] of MOVES) { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.onclick = () => go(m); row.appendChild(b); } box.appendChild(row);
  box.querySelector(".hint").textContent = MOBILE ? "Drag to turn it, tap it for its move" : "Drag to turn it, tap it for its move · 1 to 6, Space, W A S D"; }
renderer.domElement.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: false }; renderer.domElement.setPointerCapture(e.pointerId); box.focus({ preventScroll: true }); });
renderer.domElement.addEventListener("pointermove", (e) => { if (!drag) return; if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.moved = true; turn.rotation.y += (e.clientX - drag.x) * 0.012; drag.x = e.clientX; spin = 2.5; });
renderer.domElement.addEventListener("pointerup", () => { if (drag && !drag.moved && performance.now() - drag.t < 350 && cur) go(cur.move); drag = null; });
box.addEventListener("keydown", (e) => { const i = "123456".indexOf(e.key), c = e.code; if (i >= 0) go(MOVES[i][0]);
  if (c === "Space") { e.preventDefault(); if (!e.repeat && st.y <= 0 && st.air < 0.5) { st.vy = 7.2; st.air = 1; st.emote = null; } }   // a jump
  if (/^(Key[WASD]|Arrow|Shift)/.test(c)) { KEYS[c] = 1; if (c[0] === "A") e.preventDefault(); } });   // the arrows walk it here, not the page
box.addEventListener("keyup", (e) => (KEYS[e.code] = 0)); box.addEventListener("blur", () => { for (const k in KEYS) KEYS[k] = 0; });
const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;
renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.05, (now - lastT) / 1000), t = now / 1000; lastT = now;
  if (spin > 0) spin -= dt; else if (!drag && !STILL) turn.rotation.y += dt * 0.35;   // a slow turn when left alone
  if (cur) { const av = cur.av;
    if (st.emote) { st.emoteT += dt; if (st.emoteT > st.emoteLen) st.emote = null; }
    const kx = (KEYS.KeyD || KEYS.ArrowRight || 0) - (KEYS.KeyA || KEYS.ArrowLeft || 0), kz = (KEYS.KeyW || KEYS.ArrowUp || 0) - (KEYS.KeyS || KEYS.ArrowDown || 0), speed = kx || kz ? (KEYS.ShiftLeft || KEYS.ShiftRight ? 2 : 1) : 0;
    if (speed) { st.emote = null; st.faceTo = Math.atan2(kx, -kz) - turn.rotation.y; st.idle = 0; spin = 2.5; } else if ((st.idle += dt) > 0.8) st.faceTo = 0;   // it turns that way, and back to the front after
    st.face += wrap(st.faceTo - st.face) * Math.min(1, dt * 9); if (speed) st.phase += dt * cur.bpm / 60 * Math.PI * (speed > 1 ? 1.5 : 1);
    st.vy -= 18 * dt; st.y += st.vy * dt; if (st.y <= 0) { if (st.air > 0.5) st.land = 1; st.y = st.vy = 0; st.air = Math.max(0, st.air - dt * 8); } else st.air = Math.min(1, st.air + dt * 6); st.land = Math.max(0, st.land - dt * 3.5); av.root.position.y = st.y;
    /* its eyes on you: the camera, as the cat sees it (the generator's look, from the head) */
    cur.holder.updateMatrixWorld(true); cur.holder.worldToLocal(AIM.copy(camera.position)); AIM.y -= cur.headY + st.y;
    let yawTo = wrap(Math.atan2(AIM.x, AIM.z) - st.face); if (Math.abs(yawTo) > 1.9) yawTo = 0;
    TO.set(clamp(yawTo, -0.9, 0.9) * 0.8, clamp(-Math.atan2(AIM.y, Math.hypot(AIM.x, AIM.z)), -0.4, 0.35)); LOOK.lerp(TO, st.seen ? 0.12 : 1); st.seen = 1;
    av.root.userData.spin = 0;
    av.update({ t, dt, speed, phase: st.phase, air: st.air, vy: st.vy, land: st.land, emote: st.emote, emoteT: st.emoteT, emoteLen: st.emoteLen, look: LOOK });
    av.root.rotation.y = (av.root.userData.spin || 0) + st.face; av.root.updateMatrixWorld(true);
    if (av.held) { if (st.emote) upright(av, dt); else holdPose(av, t, void 0, dt); }   // holding its thing up, unless a move is on
    /* its cape and skirt follow, with the air of its stride in them */
    const F = turn.rotation.y + st.face; st.wind += (Math.min(speed, 1.4) - st.wind) * Math.min(1, dt * 3); WIND.set(-3.6 * st.wind * Math.sin(F), 0.5 * st.wind, -3.6 * st.wind * Math.cos(F));
    if (av.earU) av.earFrames(); av.drape(dt, { t, wind: WIND }); }
  renderer.render(scene, camera);
});

/* ---------------------------------------------------------------- the steps */
let mine = [];
function drawCats() {
  const el = $("cats"); el.textContent = "";
  if (!mine.length) { const s = document.createElement("span"); s.className = "fine"; s.textContent = "No Prancer Portraits or Prancer 3D cats in this wallet yet."; el.appendChild(s); return; }
  for (const [kind, title] of [["p3d", "Prancer 3D"], ["portrait", "Prancer Portraits"]]) {
    const list = mine.filter((c) => c.kind === kind); if (!list.length) continue;
    const h = document.createElement("span"); h.className = "kind"; h.textContent = title; el.appendChild(h);
    for (const c of list) { const b = document.createElement("button"); b.type = "button"; b.textContent = `#${c.no}${c.name ? " " + c.name : ""}`;
      b.onclick = () => { for (const x of el.querySelectorAll("button")) x.classList.remove("on"); b.classList.add("on"); pick(c); }; el.appendChild(b); } }
}
function pick(c) {
  const made = c.kind === "p3d" ? prancer3dCat(c.seed) : portraitCat(c.seed);
  c.label = `${c.kind === "p3d" ? "Prancer 3D" : "Prancer Portraits"} #${c.no}${made.name ? " · " + made.name : ""}`; c.made = made.name;
  show(made, c.label, true); cur.card = c; $("glbnote").textContent = "Ready when you are. The file is made here, on your device.";
}
async function look(address) {
  if (!ADDR.test(address || "")) { say("That doesn't look like a Tezos address (tz1, tz2, tz3 or tz4).", true); return; }
  say("Looking for your Prancers…");
  try { mine = await holdings(address); drawCats(); say(mine.length ? `Found ${mine.length}. Pick one to see it in 3D.` : "This wallet holds no Prancer Portraits or Prancer 3D cats yet."); if (mine.length) $("cats").querySelector("button")?.click(); }
  catch (e) { say(e.message || "The lookup did not answer. Try again in a moment.", true); }
}
$("connect").onclick = async () => { try { say("Waiting for your wallet…"); await look(await connectReadOnly()); } catch (e) { say(/abort|reject|declin|cancel/i.test(String(e && (e.message || e.errorType))) ? "No problem. Connect again whenever you're ready, or paste your address." : (e.message || "The wallet did not answer. You can paste your address instead."), true); } };
$("paste").onsubmit = (e) => { e.preventDefault(); look($("addr").value.trim()); };
$("glb").onclick = async () => {
  if (!cur || !cur.own) return; const b = $("glb"); b.disabled = true; $("glbnote").textContent = "Making your file: baking the coat and the eyes, sampling the moves…";
  await new Promise((r) => setTimeout(r, 40));
  try {
    const av = forFile(), buf = exportGLB(av, renderer, THREE, { clips: prancerClips(av), coat: COAT, name: cur.label }); dispose(av.root);
    const file = `${(cur.card.kind === "p3d" ? "Prancer-3D-" : "Prancer-Portraits-") + cur.card.no}${cur.card.made ? "-" + cur.card.made.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") : ""}.glb`;
    const url = URL.createObjectURL(new Blob([buf], { type: "model/gltf-binary" })), a = Object.assign(document.createElement("a"), { href: url, download: file });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 8000);
    $("glbnote").textContent = `${file}, ${(buf.byteLength / 1e6).toFixed(1)} MB. Open it in Blender, Unity, Godot or any 3D viewer; its moves are in the file.`;
  } catch (e) { $("glbnote").textContent = "Something went wrong making the file. Try again, or try another cat."; }
  b.disabled = false;
};

/* in your hands (2026-11-08, Yoeshi's "final form": your cat as an object): the same cat as a USDZ for AR. On an iPhone or
   iPad, Safari opens it in AR Quick Look with no app; elsewhere it downloads (a Mac opens it in Quick Look too). Made from
   the very GLB above (prancer-3d/src/usdz.js), at a real cat's size, standing still on the floor it finds. Two taps, as
   Safari opens AR only from a tap on its link: one to make the file, one to open it. */
const AR_QUICKLOOK = (() => { try { return document.createElement("a").relList.supports("ar"); } catch (e) { return false; } })();
$("ar").onclick = async () => {
  if (!cur || !cur.own) return; const b = $("ar"), note = $("arnote"); b.disabled = true; note.hidden = false; note.textContent = "Getting your cat ready for AR…";
  await new Promise((r) => setTimeout(r, 40));
  try {
    const { exportUSDZ } = await import("./p3d/src/usdz.js");
    const av = forFile(), buf = await exportUSDZ(av, renderer, THREE, { coat: COAT, name: cur.label }); dispose(av.root);
    const file = `${(cur.card.kind === "p3d" ? "Prancer-3D-" : "Prancer-Portraits-") + cur.card.no}.usdz`;
    const url = URL.createObjectURL(new Blob([buf], { type: "model/vnd.usdz+zip" }));
    const a = Object.assign(document.createElement("a"), { href: url }); note.replaceChildren();
    if (AR_QUICKLOOK) { a.rel = "ar"; const img = document.createElement("img"); img.alt = cur.label; img.src = renderer.domElement.toDataURL("image/png"); img.style.cssText = "width:120px;border-radius:12px;display:block;margin:6px 0";
      a.append(img, "Tap to open in AR"); }   // (Quick Look wants the picture as the link's first child)
    else { a.download = file; a.textContent = `Download ${file} for AR (${(buf.byteLength / 1e6).toFixed(1)} MB)`; }
    a.style.color = "var(--gold)"; note.append(a, AR_QUICKLOOK ? "" : ". On an iPhone or iPad it opens in your room; on a Mac, in Quick Look.");
  } catch (e) { note.textContent = "Something went wrong getting it ready for AR. Try again, or try another cat."; }
  b.disabled = false;
};

/* the preview before anyone looks: a fresh roll of the Prancer 3D generator on every visit, from a random seed shaped like a
   mint's (Yoeshi, 2026-11-10: a random roll, not the same lion every time); not anyone's cat, so no download */
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
show(prancer3dCat("oo" + Array.from(crypto.getRandomValues(new Uint8Array(49)), (v) => B58[v % 58]).join("")), "A Prancer, for a preview", false);
if (LOCAL && QS.get("holder")) { $("addr").value = QS.get("holder"); look(QS.get("holder")); }
else if (LOCAL && QS.get("seed3d")) { mine = await prancer3dOf(""); drawCats(); $("cats").querySelector("button")?.click(); }
if (LOCAL) window.__make3d = { get cur() { return cur; }, look, renderer };   // for the checks on this Mac
