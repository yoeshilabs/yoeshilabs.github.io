

import { makePlayer, TICK } from "./p3d/labs/shared/player.js";
import { makeStick } from "./p3d/labs/shared/stick.js";
import * as TOK from "./p3d/labs/shared/tokens.js";
import { controlBar } from "./p3d/labs/shared/controlbar.js";    

const K = 0.58 / 0.133;    
const RISE = 0.42, BODY = 0.34;    

export async function makeWalk({ THREE, scene, cam, renderer }) {
  const W = await (await fetch(new URL("./data/walkmap.json", import.meta.url))).json();
  const bin = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)), gunzip = async (s) => new Uint8Array(await new Response(new Blob([bin(s)]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());    
  const HB = W.heightsGz ? await gunzip(W.heightsGz) : bin(W.heights), H = new Int16Array(HB.buffer, HB.byteOffset, HB.length >> 1), PART = W.partGz ? await gunzip(W.partGz) : bin(W.part);
  const cellOf = (x, z) => { const i = Math.floor((x - W.x0) / W.cell), j = Math.floor((z - W.z0) / W.cell); return i < 0 || j < 0 || i >= W.nx || j >= W.nz ? -1 : j * W.nx + i; };
  

  const N = W.nx * W.nz, LV = W.levels || 1; let YREF = 0;
  const slot = (c, y) => { if (c < 0) return -1; let best = -1, bd = 1e9; for (let L = 0; L < LV; L++) { const k = c + L * N; if (!PART[k]) continue; const d = Math.abs(H[k] / 100 - y); if (d < bd) { bd = d; best = k; } } return best; };
  const heightAt = (x, z, y = YREF) => { const k = slot(cellOf(x, z), y); return k < 0 ? null : H[k] / 100; };
  const partAt = (x, z, y = YREF) => { const k = slot(cellOf(x, z), y); return k < 0 ? 0 : PART[k]; };
   
  const floor = (x, z) => { const fx = (x - W.x0) / W.cell - 0.5, fz = (z - W.z0) / W.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j; let s = 0, w = 0;
    const own = heightAt(x, z);    
    for (const [di, dj, k] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= W.nx || jj >= W.nz || k <= 0) continue; const c = slot(jj * W.nx + ii, own ?? YREF); if (c >= 0 && (own === null || Math.abs(H[c] / 100 - own) <= RISE)) { s += H[c] / 100 * k; w += k; } }
    return w ? s / w : heightAt(x, z) ?? 0; };
   
  let here = null, cur = null; const near = [], ALL = [], sray = new THREE.Raycaster(), RO = new THREE.Vector3(), RD = new THREE.Vector3();    
  const may = (mx, mz) => { const x = mx * K, z = mz * K, h = heightAt(x, z, here ?? YREF); if (h === null) return false;
    for (const [dx, dz] of [[BODY, 0], [-BODY, 0], [0, BODY], [0, -BODY]]) { const g = heightAt(x + dx, z + dz, h); if (g === null || Math.abs(g - h) > RISE) return false; }
    if (here !== null && Math.abs(h - here) > RISE) return false;
    if (cur && near.length) { const dx = x - cur.x, dz = z - cur.z, L = Math.hypot(dx, dz); if (L > 1e-5) for (const k of [0.45, 1.3]) { RO.set(cur.x, cur.y + k, cur.z); RD.set(dx / L, 0, dz / L); sray.set(RO, RD); sray.far = L + BODY; if (sray.intersectObjects(near, false).length) return false; } }
    return true; };

   
  const { makeCat } = await import("./home/next/cats/cast.js");
  const gen = await import("./p3d/gen/src/cat.js"), r0 = window.__testGuest || Math.floor(Math.random() * 1e9); let seed = "guest" + r0;    
  for (let i = 0; i < 400; i++) { const g = gen.rollSeed("guest" + (r0 + i)); if (g.HAT === "None" && g.LASER === "None" && !g.SPK) { seed = "guest" + (r0 + i); break; } }    
  const me = await makeCat({ seed, shells: 6 }); me.holder.scale.setScalar(0.58); me.holder.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(me.holder);
  const T4 = (4 + 0.5) / 16 * Math.PI * 2, SA = 70.2, START = { x: SA * Math.cos(T4), z: (SA - 18) * Math.sin(T4) };    
  START.face = Math.atan2(-START.x, -START.z); if (heightAt(START.x, START.z) === null) Object.assign(START, W.start);    
  const player = makePlayer({ at: { x: START.x / K, z: START.z / K, face: START.face }, scale: 0.133, ground: (x, z) => floor(x * K, z * K) / K, may, jumpOnce: true });    

   
  const keys = new Set(), stick = makeStick({ parent: document.body, side: "left" });
  const OWN = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight", "Space", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6"]);
  const kd = (e) => { if (!OWN.has(e.code) || e.target.closest?.("input,textarea")) return; keys.add(e.code); e.preventDefault(); }, ku = (e) => keys.delete(e.code);
  addEventListener("keydown", kd); addEventListener("keyup", ku); addEventListener("blur", () => keys.clear());
  const PITCH0 = 0.09;    
  const view = { yaw: START.face, pitch: PITCH0 }; let drag = null;
  const pd = (e) => { if (e.target !== renderer.domElement || document.pointerLockElement === renderer.domElement) return; drag = [e.clientX, e.clientY]; }, pu = () => { drag = null; };
  const pm = (e) => { if (!drag) return; view.yaw -= (e.clientX - drag[0]) * 0.005; view.pitch = Math.max(-0.6, Math.min(1.2, view.pitch - (e.clientY - drag[1]) * 0.005)); drag = [e.clientX, e.clientY]; };
  

  const lock = () => { try { renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); } catch (e) {} };
  renderer.domElement.addEventListener("click", () => { if (matchMedia("(pointer: fine)").matches && document.pointerLockElement !== renderer.domElement) lock(); });
  addEventListener("mousemove", (e) => { if (document.pointerLockElement !== renderer.domElement) return; view.yaw -= e.movementX * 0.0022; view.pitch = Math.max(-0.6, Math.min(1.2, view.pitch - e.movementY * 0.0022)); });
   
  const leaveFP = (zoom) => { FP = false; FPsince = 0; ZOOM = zoom; camDist = 0; if (!m.air) { player.stand({ x: m.x, z: m.z, face: view.yaw }); m = player.tick({}); } };    
  const toggleFP = () => { if (FP) leaveFP(1); else { FP = true; FPsince = 1; } };    
  addEventListener("keydown", (e) => { if ((e.code === "KeyC" || e.code === "KeyV") && !e.repeat && !e.target.closest?.("input,textarea")) toggleFP(); });    
  renderer.domElement.addEventListener("mousedown", (e) => { if (e.button === 1) { e.preventDefault(); toggleFP(); } });    
  renderer.domElement.addEventListener("wheel", (e) => { if (FP) { if (e.deltaY > 0) leaveFP(2.2 / DIST); return; }
    const z = ZOOM * Math.exp(e.deltaY * 0.001); if (z * DIST < 1.8 && e.deltaY < 0) { FP = true; FPsince = 1; } else ZOOM = Math.max(1.8 / DIST, Math.min(1.5, z)); }, { passive: true });
  addEventListener("pointerdown", pd); addEventListener("pointerup", pu); addEventListener("pointercancel", pu); addEventListener("pointermove", pm);

   
   
  const bar = controlBar({ show: ["move", "run", "jump", "use", "firstPerson"], words: { use: "lift" }, extra: [{ keys: ["1 to 6"], word: "moves" }] });
  const barriers = (await import("./barriers.js")).placeBarriers({ THREE, scene, closed: W.closed || [], tok: TOK });

  

  { const box = new THREE.Box3(new THREE.Vector3(W.x0 - 6, -2, W.z0 - 6), new THREE.Vector3(W.x0 + W.nx * W.cell + 6, 16, W.z0 + W.nz * W.cell + 6)), bb = new THREE.Box3();
    const mine = new Set(); me.holder.traverse((o) => mine.add(o)); scene.updateMatrixWorld(true); scene.traverse((o) => { if (!o.isMesh || mine.has(o) || (o.isInstancedMesh && o.count > 64) || o.isSkinnedMesh || !o.visible) return; if (o.material && o.material.transparent && o.material.opacity < 0.2) return; if (o.isInstancedMesh) { o.computeBoundingBox(); bb.copy(o.boundingBox); if (bb.intersectsBox(box)) ALL.push([o, bb.clone()]); return; }
      o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); if (bb.intersectsBox(box)) ALL.push([o, bb.clone()]); }); }
  const CH = 2.1, DIST = 2.8 * CH / 1.15, EYE = CH * 0.86, ray = new THREE.Raycaster(), head = new THREE.Vector3(), want = new THREE.Vector3(), dir = new THREE.Vector3(), aim = new THREE.Vector3(), cam3 = new THREE.Vector3();
  const SIDES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map((v) => new THREE.Vector3(...v)); let first = true, camDist = DIST, aimed = null, intro0 = null, FP = true  , FPsince = 0, ZOOM = 1; const WIDE = new THREE.Vector3(0, 15, 53), WIDE_AT = new THREE.Vector3(0, 15 + Math.sin(-0.32) * 10, 53 - Math.cos(0.32) * 10);    
  

  { const D3 = 18, gtA3 = (x, z) => { let lo = 19, hi = 260; for (let i = 0; i < 26; i++) { const a = (lo + hi) / 2; ((x / a) ** 2 + (z / (a - D3)) ** 2 > 1) ? (lo = a) : (hi = a); } return (lo + hi) / 2; };
    const V3 = new THREE.Vector3(), IM3 = new THREE.Matrix4(), WM3 = new THREE.Matrix4(), done = new Set(), WARM = [1.08, 0.9, 0.7], COOL = [0.5, 0.48, 0.62];
    const inside = (geo, mw) => { const p = geo.attributes.position, n = p.count, step = Math.max(1, Math.floor(n / 120)); for (let i = 0; i < n; i += step) { V3.fromBufferAttribute(p, i).applyMatrix4(mw); const a = gtA3(V3.x, V3.z); if (a < 68 || a > 92.9 || V3.y > 11.2) return false; } return true; };
    scene.traverse((o) => { if (!o.isMesh || done.has(o.geometry)) return; const mats = [].concat(o.material); if (!mats.some((m) => m && m.vertexColors) || !o.geometry.attributes.color) return;
      let mw = o.matrixWorld; if (o.isInstancedMesh) { o.getMatrixAt(0, IM3); mw = WM3.multiplyMatrices(o.matrixWorld, IM3); } if (!inside(o.geometry, mw)) return;
      const c = o.geometry.attributes.color, KP = window.__tunnelPow || 1.8, K0 = window.__tunnelFloor ?? 0.2;     for (let i = 0; i < c.count; i++) { const g0 = (c.getX(i) + c.getY(i) + c.getZ(i)) / 3, g = K0 ? Math.max(0, (g0 - K0) / (1 - K0)) : g0, t = Math.min(1, Math.max(0, (g - 0.42) / 0.5)), e = t * t * (3 - 2 * t), d = Math.pow(g, KP);    
        c.setXYZ(i, d * (COOL[0] + (WARM[0] - COOL[0]) * e), d * (COOL[1] + (WARM[1] - COOL[1]) * e), d * (COOL[2] + (WARM[2] - COOL[2]) * e)); }
      c.needsUpdate = true; done.add(o.geometry); });
    window.__tunnelLit = done.size;
    

    { let lan = null; scene.traverse((o) => { if (!lan && o.isInstancedMesh && o.geometry.type === "SphereGeometry" && Math.abs((o.geometry.parameters.radius || 0) - 0.34) < 1e-3 && o.count > 20) lan = o; });
      if (lan) { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,.42)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
        const tx = new THREE.CanvasTexture(c), pm = new THREE.MeshBasicMaterial({ map: tx, color: 0xffc98e, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, fog: true });
        const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(5.2, 5.2).rotateX(-Math.PI / 2), pm, lan.count), M = new THREE.Matrix4(), P = new THREE.Vector3(), Q = new THREE.Quaternion(), Sc = new THREE.Vector3();
        lan.updateMatrixWorld(true); for (let k = 0; k < lan.count; k++) { lan.getMatrixAt(k, M); M.premultiply(lan.matrixWorld); M.decompose(P, Q, Sc); pools.setMatrixAt(k, M.makeTranslation(P.x, 0.1, P.z)); }
        pools.name = "lantern-pools"; pools.renderOrder = 2; scene.add(pools); window.__pools = lan.count; } } }

  

  let nearKey = null; const NB = new THREE.Box3(), NV = new THREE.Vector3();
  const refreshNear = (x, z) => { const key = Math.floor(x / 6) + "," + Math.floor(z / 6); if (key === nearKey) return; nearKey = key; NB.setFromCenterAndSize(NV.set(x, 6, z), NV.clone().set(28, 30, 28)); near.length = 0; for (const [o, bx] of ALL) if (bx.intersectsBox(NB)) near.push(o); };
  const cray = new THREE.Raycaster(), CD = new THREE.Vector3(); let coverN = 0, coverRun = 0, barFP = false;
  function placeCamera(dt, m) {
    const el = Math.max(0.05, Math.min(1.1, 0.28 - view.pitch * 0.95)), ce = Math.cos(el), fx = Math.sin(view.yaw), fz = Math.cos(view.yaw);
    head.set(m.x * K, m.y * K + EYE, m.z * K); dir.set(-fx * ce, Math.sin(el), -fz * ce);
    { const fpShown = !!(FP && (FPsince || (intro0 !== null && m.t - intro0 >= 4))); if (fpShown !== barFP) { barFP = fpShown; bar.words({ use: "lift", firstPerson: fpShown ? "third person" : "first person" }); } }    
    

    if ((coverN = (coverN + 1) % 12) === 0 && window.arena) { let open = false; const hr = Math.hypot(head.x, head.z) || 1;
      for (const up of [null, 0.7, 1.7]) { if (up === null) CD.set(0, 1, 0); else CD.set(-head.x / hr, up, -head.z / hr).normalize(); cray.set(head, CD); cray.far = 13; if (!cray.intersectObjects(near, false).length) { open = true; break; } }
      coverRun = open ? 0 : coverRun + 1; window.arena.cover = coverRun >= 2; window.arena.plaza = partAt(head.x, head.z) === 1; }
    

    if (FP && (FPsince || (intro0 !== null && m.t - intro0 >= 4))) {     const cp = Math.cos(view.pitch); cam3.copy(head); camDist = 0; cam.position.copy(head); me.holder.visible = false;
      aim.set(head.x + fx * cp * 8, head.y + Math.sin(view.pitch) * 8, head.z + fz * cp * 8); aimed = aim.clone(); first = false; if (cam.near > 0.05) { cam.near = 0.05; cam.updateProjectionMatrix(); } cam.lookAt(aim); return; }
    const far = DIST * ZOOM; ray.set(head, dir); ray.far = far + 0.5; const hit = ray.intersectObjects(near, false)[0], d = hit ? Math.max(0, Math.min(far, hit.distance - 0.35)) : far;
    camDist += (d - camDist) * Math.min(1, d < camDist ? 1 : dt * 2.5); if (camDist < 1.2) cam3.copy(head).addScaledVector(dir, camDist);    
    want.copy(head).addScaledVector(dir, camDist);    
    if (first) cam3.copy(want); else cam3.lerp(want, 1 - Math.exp(-dt * 14));
    for (const sd of SIDES) { ray.set(cam3, sd); ray.far = 0.3; const h = ray.intersectObjects(near, false)[0]; if (h) cam3.addScaledVector(sd, h.distance - 0.3); }
    

    if (intro0 === null) intro0 = m.t; const it = m.t - intro0;
    if (it < 4) { const k = it < 1.5 ? 0 : (1 - Math.cos(Math.PI * Math.min(1, (it - 1.5) / 2.5))) / 2; cam.position.copy(WIDE).lerp(cam3, k);
      aim.set(head.x + fx * 8, head.y, head.z + fz * 8); const look = WIDE_AT.clone().lerp(aim, k); aimed = look.clone(); cam.lookAt(look); me.holder.visible = true; if (cam.near > 0.1) { cam.near = 0.1; cam.updateProjectionMatrix(); } return; }
    cam.position.copy(cam3); if (cam.near > 0.1) { cam.near = 0.1; cam.updateProjectionMatrix(); }
    me.holder.visible = camDist > 1.2;    
    aim.set(head.x + fx * 8, head.y + Math.tan(view.pitch) * 8, head.z + fz * 8);    
    if (first || !aimed) { aimed = aim.clone(); first = false; } else aimed.lerp(aim, 1 - Math.exp(-dt * 14)); cam.lookAt(aimed); }

  

  

  const free = (x, y, z) => { refreshNear(x, z); let open = 0; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; let clear = true; for (const hk of [0.45, 1.3]) { RO.set(x, y + hk, z); RD.set(Math.sin(a), 0, Math.cos(a)); sray.set(RO, RD); sray.far = 2; if (sray.intersectObjects(near, false).length) clear = false; } if (clear) open++; } return open >= 6; };
  const near1 = (x0, z0, y) => { let best = null, bd = 1e9; for (let dz = -4; dz <= 4; dz += W.cell) for (let dx = -4; dx <= 4; dx += W.cell) { const x = x0 + dx, z = z0 + dz, h = heightAt(x, z, y); if (h === null || Math.abs(h - y) > 0.6) continue;
      if (![[BODY, 0], [-BODY, 0], [0, BODY], [0, -BODY]].every(([ex, ez]) => heightAt(x + ex, z + ez, h) !== null)) continue; const d = Math.hypot(dx, dz); if (d < bd && free(x, h, z)) { bd = d; best = { x, z, y: h }; } } return best; };    
  const LIFTS = [0, 1, 2, 3].map((k) => { const t = Math.PI / 4 + k * Math.PI / 2, x0 = 85.2 * Math.cos(t), z0 = 67.2 * Math.sin(t), up = near1(x0, z0, 11.7), dn = near1(x0, z0, 0.1);
    return up && dn ? { k, x: up.x, z: up.z, y: up.y, gx: dn.x, gz: dn.z, ground: dn.y } : null; }).filter(Boolean);    
  const liftHint = document.createElement("button"); liftHint.style.cssText = `position:fixed;left:50%;bottom:78px;transform:translateX(-50%);padding:10px 18px;border-radius:999px;border:0;background:${TOK.COLOR.gold};color:${TOK.COLOR.night};font:${TOK.WEIGHT ? TOK.WEIGHT.control : 600} 15px ${TOK.TYPE.ui};cursor:pointer;z-index:3;display:none`; document.body.appendChild(liftHint);
  const fade = document.createElement("div"); fade.style.cssText = "position:fixed;inset:0;background:" + TOK.COLOR.night + ";opacity:0;pointer-events:none;transition:opacity .3s;z-index:4"; document.body.appendChild(fade);
  let liftNear = null, riding = false;
  const ride = () => { if (!liftNear || riding) return; const l = liftNear, up = m.y * K < 6, y = up ? l.y : l.ground; if (y === null || y === undefined) return; riding = true; fade.style.opacity = "1";
    setTimeout(() => { const face = Math.atan2(-l.x, -l.z), tx = up ? l.x : l.gx, tz = up ? l.z : l.gz; YREF = y; player.stand({ x: tx / K, z: tz / K, face }); here = null; cur = null; m = player.tick({}); YREF = m.y * K; view.yaw = face; first = true; fade.style.opacity = "0"; riding = false; }, 320); };
  liftHint.onclick = ride; addEventListener("keydown", (e) => { if (e.code === "KeyE" && !e.repeat) ride(); });
  const liftCheck = () => { const x = m.x * K, z = m.z * K, y = m.y * K; liftNear = LIFTS.find((l) => (y < 6 ? Math.hypot(l.gx - x, l.gz - z) < 6 && Math.abs(y - l.ground) < 1 : Math.hypot(l.x - x, l.z - z) < 6 && Math.abs(y - l.y) < 1)) || null;
    const want = liftNear ? (y < 6 ? "E  Lift up to the concourse" : "E  Lift down to the corridor") : ""; if (liftHint.textContent !== want) liftHint.textContent = want; liftHint.style.display = want ? "block" : "none"; };

   
  let acc = 0, last = null, m = player.tick({}), AUTO = null;    
  function frame(nowMs) { refreshNear(m.x * K, m.z * K);
    const dt = last === null ? TICK : Math.min(0.1, (nowMs - last) / 1000); last = nowMs; acc = Math.min(acc + dt, TICK * 6);
    while (acc >= TICK) { acc -= TICK; YREF = m.y * K; here = m.air ? here : floor(m.x * K, m.z * K); YREF = here ?? YREF; cur = { x: m.x * K, y: m.y * K, z: m.z * K };
      const onPlaza = partAt(m.x * K, m.z * K) === 1, k = onPlaza ? keys : new Set([...keys].filter((c) => c !== "Space"));
      m = player.tick({ keys: k, yaw: view.yaw, move: AUTO ? AUTO(m, view) : stick.input({ x: m.x, z: m.z }, view.yaw), jump: false }); }
    me.holder.position.set(m.x * K, m.y * K, m.z * K); me.holder.rotation.set(0, m.yaw, 0);
    me.step(dt, undefined, { speed: m.speed, phase: m.phase, air: m.air, vy: m.vy, land: m.land, emote: m.emote, emoteT: m.emoteT, emoteLen: m.emoteLen });
    placeCamera(dt, m); liftCheck(); barriers.tick(nowMs / 1000); }
  function reset() { YREF = W.start ? W.start.y : 4.8; player.stand({ x: START.x / K, z: START.z / K, face: START.face }); view.yaw = START.face; view.pitch = PITCH0; here = null; first = true; aimed = null; intro0 = null; m = player.tick({}); }
  return { frame, reset, auto(fn) { AUTO = fn; }, firstPerson(v) { if (v) { FP = true; FPsince = 1; } else if (FP) leaveFP(1); }, get fp() { return FP; }, place(x, z, face = 0, y = 0) { YREF = y; player.stand({ x: x / K, z: z / K, face }); here = null; cur = null; m = player.tick({}); YREF = m.y * K; }, K, map: W, partAt, heightAt, near, lifts: LIFTS, ride: () => { liftCheck(); ride(); }, get riding() { return riding; }, get where() { return { x: m.x * K, y: m.y * K, z: m.z * K, part: partAt(m.x * K, m.z * K) }; }, player, view, keys, me };
}
