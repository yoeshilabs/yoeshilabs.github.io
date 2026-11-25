

import { makePlayer, TICK } from "./p3d/labs/shared/player.js";
import { makeStick } from "./p3d/labs/shared/stick.js";

const K = 0.58 / 0.133;    
const RISE = 0.42, BODY = 0.34;    

export async function makeWalk({ THREE, scene, cam, renderer }) {
  const W = await (await fetch(new URL("./data/walkmap.json", import.meta.url))).json();
  const bin = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)), HB = bin(W.heights), H = new Int16Array(HB.buffer, HB.byteOffset, HB.length >> 1), PART = bin(W.part);
  const cellOf = (x, z) => { const i = Math.floor((x - W.x0) / W.cell), j = Math.floor((z - W.z0) / W.cell); return i < 0 || j < 0 || i >= W.nx || j >= W.nz ? -1 : j * W.nx + i; };
  const heightAt = (x, z) => { const c = cellOf(x, z); return c < 0 || !PART[c] ? null : H[c] / 100; };
  const partAt = (x, z) => { const c = cellOf(x, z); return c < 0 ? 0 : PART[c]; };
   
  const floor = (x, z) => { const fx = (x - W.x0) / W.cell - 0.5, fz = (z - W.z0) / W.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j; let s = 0, w = 0;
    for (const [di, dj, k] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= W.nx || jj >= W.nz) continue; const c = jj * W.nx + ii; if (PART[c] && k > 0) { s += H[c] / 100 * k; w += k; } }
    return w ? s / w : heightAt(x, z) ?? 0; };
   
  let here = null, cur = null; const near = [], sray = new THREE.Raycaster(), RO = new THREE.Vector3(), RD = new THREE.Vector3();    
  const may = (mx, mz) => { const x = mx * K, z = mz * K, h = heightAt(x, z); if (h === null) return false;
    for (const [dx, dz] of [[BODY, 0], [-BODY, 0], [0, BODY], [0, -BODY]]) { const g = heightAt(x + dx, z + dz); if (g === null || Math.abs(g - h) > RISE) return false; }
    if (here !== null && Math.abs(h - here) > RISE) return false;
    if (cur && near.length) { const dx = x - cur.x, dz = z - cur.z, L = Math.hypot(dx, dz); if (L > 1e-5) for (const k of [0.45, 1.3]) { RO.set(cur.x, cur.y + k, cur.z); RD.set(dx / L, 0, dz / L); sray.set(RO, RD); sray.far = L + BODY; if (sray.intersectObjects(near, false).length) return false; } }
    return true; };

   
  const { makeCat } = await import("./home/next/cats/cast.js");
  const gen = await import("./p3d/gen/src/cat.js"), r0 = Math.floor(Math.random() * 1e9); let seed = "guest" + r0;
  for (let i = 0; i < 400; i++) { const g = gen.rollSeed("guest" + (r0 + i)); if (g.HAT === "None" && g.LASER === "None" && !g.SPK) { seed = "guest" + (r0 + i); break; } }    
  const me = await makeCat({ seed, shells: 6 }); me.holder.scale.setScalar(0.58); me.holder.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(me.holder);
  const T4 = (4 + 0.5) / 16 * Math.PI * 2, SA = 70.2, START = { x: SA * Math.cos(T4), z: (SA - 18) * Math.sin(T4) };    
  START.face = Math.atan2(-START.x, -START.z); if (heightAt(START.x, START.z) === null) Object.assign(START, W.start);    
  const player = makePlayer({ at: { x: START.x / K, z: START.z / K, face: START.face }, scale: 0.133, ground: (x, z) => floor(x * K, z * K) / K, may, jumpOnce: true });    

   
  const keys = new Set(), stick = makeStick({ parent: document.body, side: "left" });
  const OWN = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight", "Space", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6"]);
  const kd = (e) => { if (!OWN.has(e.code) || e.target.closest?.("input,textarea")) return; keys.add(e.code); e.preventDefault(); }, ku = (e) => keys.delete(e.code);
  addEventListener("keydown", kd); addEventListener("keyup", ku); addEventListener("blur", () => keys.clear());
  const view = { yaw: START.face, pitch: 0 }; let drag = null;
  const pd = (e) => { if (e.target !== renderer.domElement || document.pointerLockElement === renderer.domElement) return; drag = [e.clientX, e.clientY]; }, pu = () => { drag = null; };
  const pm = (e) => { if (!drag) return; view.yaw -= (e.clientX - drag[0]) * 0.005; view.pitch = Math.max(-0.6, Math.min(0.9, view.pitch - (e.clientY - drag[1]) * 0.005)); drag = [e.clientX, e.clientY]; };
  

  const lock = () => { try { renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); } catch (e) {} };
  renderer.domElement.addEventListener("click", () => { if (matchMedia("(pointer: fine)").matches && document.pointerLockElement !== renderer.domElement) lock(); });
  addEventListener("mousemove", (e) => { if (document.pointerLockElement !== renderer.domElement) return; view.yaw -= e.movementX * 0.0022; view.pitch = Math.max(-0.6, Math.min(0.9, view.pitch - e.movementY * 0.0022)); });
  addEventListener("pointerdown", pd); addEventListener("pointerup", pu); addEventListener("pointercancel", pu); addEventListener("pointermove", pm);

   
  const hud = document.createElement("div"); hud.style.cssText = "position:fixed;right:16px;bottom:16px;padding:8px 12px;border-radius:10px;background:rgba(20,14,30,.6);color:#f6f2ee;font:13px/1.45 Helvetica,Arial,sans-serif;pointer-events:none;z-index:2;max-width:46vw";
  const touch = matchMedia("(pointer: coarse)").matches; hud.textContent = touch ? "Stick to walk, push far to run, drag to look" : "W A S D walk, Shift runs, click and move the mouse to look (Esc lets go), Space jumps on the plaza"; document.body.appendChild(hud);
  setTimeout(() => { hud.style.transition = "opacity 1.2s"; hud.style.opacity = "0.35"; }, 12000);
  const barriers = (await import("./barriers.js")).placeBarriers({ THREE, scene });

  

  { const box = new THREE.Box3(new THREE.Vector3(W.x0 - 6, -2, W.z0 - 6), new THREE.Vector3(W.x0 + W.nx * W.cell + 6, 16, W.z0 + W.nz * W.cell + 6)), bb = new THREE.Box3();
    const mine = new Set(); me.holder.traverse((o) => mine.add(o)); scene.updateMatrixWorld(true); scene.traverse((o) => { if (!o.isMesh || mine.has(o) || (o.isInstancedMesh && o.count > 64) || o.isSkinnedMesh || !o.visible) return; if (o.material && o.material.transparent && o.material.opacity < 0.2) return; if (o.isInstancedMesh) { o.computeBoundingBox(); bb.copy(o.boundingBox); if (bb.intersectsBox(box)) near.push(o); return; }
      o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); if (bb.intersectsBox(box)) near.push(o); }); }
  const CH = 2.1, DIST = 2.8 * CH / 1.15, EYE = CH * 0.86, ray = new THREE.Raycaster(), head = new THREE.Vector3(), want = new THREE.Vector3(), dir = new THREE.Vector3(), aim = new THREE.Vector3(), cam3 = new THREE.Vector3();
  const SIDES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map((v) => new THREE.Vector3(...v)); let first = true, camDist = DIST, aimed = null, intro0 = null; const WIDE = new THREE.Vector3(0, 15, 53), WIDE_AT = new THREE.Vector3(0, 15 + Math.sin(-0.32) * 10, 53 - Math.cos(0.32) * 10);    
  function placeCamera(dt, m) {
    const el = Math.max(0.05, Math.min(1.1, 0.28 - view.pitch * 0.95)), ce = Math.cos(el), fx = Math.sin(view.yaw), fz = Math.cos(view.yaw);
    head.set(m.x * K, m.y * K + EYE, m.z * K); dir.set(-fx * ce, Math.sin(el), -fz * ce);
    ray.set(head, dir); ray.far = DIST + 0.5; const hit = ray.intersectObjects(near, false)[0], d = hit ? Math.max(0, hit.distance - 0.35) : DIST;
    camDist += (d - camDist) * Math.min(1, d < camDist ? 1 : dt * 2.5);    
    want.copy(head).addScaledVector(dir, camDist);    
    if (first) cam3.copy(want); else cam3.lerp(want, 1 - Math.exp(-dt * 14));
    for (const sd of SIDES) { ray.set(cam3, sd); ray.far = 0.3; const h = ray.intersectObjects(near, false)[0]; if (h) cam3.addScaledVector(sd, h.distance - 0.3); }
    

    if (intro0 === null) intro0 = m.t; const it = m.t - intro0;
    if (it < 4) { const k = it < 1.5 ? 0 : (1 - Math.cos(Math.PI * Math.min(1, (it - 1.5) / 2.5))) / 2; cam.position.copy(WIDE).lerp(cam3, k);
      aim.set(head.x + fx * 8, head.y, head.z + fz * 8); const look = WIDE_AT.clone().lerp(aim, k); aimed = look.clone(); cam.lookAt(look); me.holder.visible = true; if (cam.near > 0.1) { cam.near = 0.1; cam.updateProjectionMatrix(); } return; }
    cam.position.copy(cam3); if (cam.near > 0.1) { cam.near = 0.1; cam.updateProjectionMatrix(); }
    me.holder.visible = camDist > 0.8;    
    aim.set(head.x + fx * 8, head.y + Math.sin(-view.pitch) * 3, head.z + fz * 8);
    if (first || !aimed) { aimed = aim.clone(); first = false; } else aimed.lerp(aim, 1 - Math.exp(-dt * 14)); cam.lookAt(aimed); }

   
  let acc = 0, last = null, m = player.tick({}), AUTO = null;    
  function frame(nowMs) {
    const dt = last === null ? TICK : Math.min(0.1, (nowMs - last) / 1000); last = nowMs; acc = Math.min(acc + dt, TICK * 6);
    while (acc >= TICK) { acc -= TICK; here = m.air ? here : floor(m.x * K, m.z * K); cur = { x: m.x * K, y: m.y * K, z: m.z * K };
      const onPlaza = partAt(m.x * K, m.z * K) === 1, k = onPlaza ? keys : new Set([...keys].filter((c) => c !== "Space"));
      m = player.tick({ keys: k, yaw: view.yaw, move: AUTO ? AUTO(m, view) : stick.input({ x: m.x, z: m.z }, view.yaw), jump: false }); }
    me.holder.position.set(m.x * K, m.y * K, m.z * K); me.holder.rotation.set(0, m.yaw, 0);
    me.step(dt, undefined, { speed: m.speed, phase: m.phase, air: m.air, vy: m.vy, land: m.land, emote: m.emote, emoteT: m.emoteT, emoteLen: m.emoteLen });
    placeCamera(dt, m); barriers.tick(nowMs / 1000); }
  function reset() { player.stand({ x: START.x / K, z: START.z / K, face: START.face }); view.yaw = START.face; view.pitch = 0; here = null; first = true; aimed = null; intro0 = null; m = player.tick({}); }
  return { frame, reset, auto(fn) { AUTO = fn; }, place(x, z, face = 0) { player.stand({ x: x / K, z: z / K, face }); here = null; cur = null; m = player.tick({}); }, K, map: W, partAt, heightAt, near, get where() { return { x: m.x * K, y: m.y * K, z: m.z * K, part: partAt(m.x * K, m.z * K) }; }, player, view, keys, me };
}
