

import * as THREE from "three";
import { coatMaterial, furry, PART } from "./coat.js";
import { plate, gold, glow, add, tube, canvasTex } from "./knight.js";

const P = (x, y, z) => new THREE.Vector3(x, y, z), TAU = Math.PI * 2, clamp = (x, a, b) => Math.max(a, Math.min(b, x)), ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

export function makePony(L, opts = {}) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); root.name = "pony";
  const cov = { c: { value: Array.from({ length: 12 }, () => new THREE.Vector4()) }, h: { value: Array.from({ length: 12 }, () => new THREE.Vector3()) }, n: { value: 0 } };
  const G0 = { ...L, body: opts.coat || "#f4efe7", white: "#f4efe7", mark: null, patch: null, point: null, muz: "#efe2dc", pattern: "Solid", whiteMode: "None", furLen: 0.05, droop: 0.4, rimK: 0.2, metal: 0, rough: 0.85, irid: 0, ghost: false, facets: false, neon: false, cov };
  const coat = coatMaterial(G0, PART.torso), mane = coatMaterial({ ...G0, body: opts.mane || "#3f6fd8", white: opts.mane || "#3f6fd8", furLen: 0.11, droop: 0.9 }, PART.tail), snout = coatMaterial({ ...G0, body: "#efe2dc", furLen: 0.025 }, PART.muzzle);
  for (const m of [coat, mane, snout]) m.userData.shells = L.shells;
  const fz = (geo, mat, parent, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0]) => { const m = furry(geo, mat, L.shells); m.position.set(...p); m.scale.set(...s); m.rotation.set(...r); parent.add(m); return m; };
  const ball = (r) => new THREE.SphereGeometry(r, 40, 28), cap = (r, l) => new THREE.CapsuleGeometry(r, l, 10, 24);
   
  fz(ball(1), coat, body, [0, 1.85, 0], [0.55, 0.58, 1.2]); fz(ball(0.6), coat, body, [0, 1.95, 0.9], [1, 0.95, 0.9]); fz(ball(0.64), coat, body, [0, 2.0, -0.92], [1.05, 1, 0.9]);
   
  const neck = new THREE.Group(); neck.position.set(0, 2.25, 1.05); neck.rotation.x = 0.55; body.add(neck); fz(cap(0.33, 0.9), coat, neck, [0, 0.45, 0]);
  const head = new THREE.Group(); head.position.set(0, 0.98, 0); neck.add(head); const hd = new THREE.Group(); hd.rotation.x = -0.55; head.add(hd);
  fz(ball(1), coat, hd, [0, 0.1, 0.12], [0.38, 0.4, 0.5]); fz(ball(1), snout, hd, [0, -0.13, 0.52], [0.3, 0.26, 0.3]);
  for (const s of [-1, 1]) { add(hd, new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: "#5a3a3e" }), [s * 0.11, -0.12, 0.8]);    
    const eye = new THREE.Group(); eye.position.set(s * 0.29, 0.17, 0.33); eye.rotation.y = s * 0.55; hd.add(eye);
    add(eye, new THREE.SphereGeometry(0.13, 24, 16), new THREE.MeshPhysicalMaterial({ color: "#1a1424", roughness: 0.15, clearcoat: 1 }), [0, 0, 0], [0, 0, 0], [1, 1.12, 0.7]);
    add(eye, new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshBasicMaterial({ color: "#ffffff" }), [0.04, 0.05, 0.085]); add(eye, new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }), [-0.04, -0.04, 0.09]);
    const ear = new THREE.Group(); ear.position.set(s * 0.17, 0.46, 0.0); ear.rotation.set(-0.15, 0, -s * 0.25); hd.add(ear); fz(new THREE.ConeGeometry(0.1, 0.32, 16).translate(0, 0.16, 0), coat, ear, [0, 0, 0], [1, 1, 0.55]); ear.userData.s = s; }
  const ears = hd.children.filter((c) => c.userData.s);
  for (let i = 0; i < 3; i++) fz(ball(0.12), mane, hd, [(i - 1) * 0.08, 0.46 - i * 0.03, 0.26 + i * 0.04], [1, 1.3, 0.8]);    
   
  for (let i = 0; i < 7; i++) fz(ball(0.18 - i * 0.008), mane, neck, [((i % 2) - 0.5) * 0.08, 0.05 + i * 0.15, -0.26], [1, 1.1, 0.9]);
  const tail = []; let tp = new THREE.Group(); tp.position.set(0, 2.25, -1.5); tp.rotation.x = -2.3; body.add(tp);
  for (let i = 0; i < 6; i++) { fz(ball(0.17 - i * 0.012), mane, tp, [0, 0.12, 0], [1, 1.4, 1]); tail.push(tp); const n = new THREE.Group(); n.position.y = 0.24; tp.add(n); tp = n; }
   
  const legs = [], shoe = gold();
  for (const [x, z, front] of [[0.33, 0.92, 1], [-0.33, 0.92, 1], [0.34, -0.95, 0], [-0.34, -0.95, 0]]) { const hip = new THREE.Group(); hip.position.set(x, 1.5, z); body.add(hip); fz(cap(0.17, 0.42), coat, hip, [0, -0.33, 0]);
    const knee = new THREE.Group(); knee.position.y = -0.68; hip.add(knee); fz(cap(0.12, 0.42), coat, knee, [0, -0.3, 0]); const ft = new THREE.Group(); ft.position.y = -0.64; knee.add(ft);
    fz(ball(0.15), snout, ft, [0, 0.06, 0], [1.05, 0.8, 1.05]); add(ft, new THREE.CylinderGeometry(0.15, 0.17, 0.14, 24), new THREE.MeshStandardMaterial({ color: "#4a4450", roughness: 0.5 }), [0, -0.07, 0.01]);
    add(ft, new THREE.TorusGeometry(0.16, 0.025, 8, 28), shoe, [0, -0.135, 0.01], [Math.PI / 2, 0, 0]); legs.push({ hip, knee, ft, front, x }); }

   
  const f = 0.05, Tv = P(), ell = (l, c, r) => { const x = l.x - c[0], y = l.y - c[1], z = l.z - c[2], k0 = Math.hypot(x / r[0], y / r[1], z / r[2]), k1 = Math.hypot(x / r[0] / r[0], y / r[1] / r[1], z / r[2] / r[2]); return k1 > 0 ? k0 * (k0 - 1) / k1 : -Math.min(...r); };
  const skinBody = (l) => Math.min(ell(l, [0, 1.85, 0], [0.55 + f, 0.58 + f, 1.2 + f]), ell(l, [0, 1.95, 0.9], [0.6 + f, 0.57 + f, 0.54 + f]), ell(l, [0, 2.0, -0.92], [0.672 + f, 0.64 + f, 0.576 + f]));
  const skinNeck = (n) => Math.hypot(n.x, Math.max(0, Math.abs(n.y - 0.45) - 0.45), n.z) - 0.33 - f;
  const skinHead = (h) => Math.min(ell(h, [0, 0.1, 0.12], [0.38 + f, 0.4 + f, 0.5 + f]), ell(h, [0, -0.13, 0.52], [0.325, 0.285, 0.325]));
  

  const mt = plate(), gd = gold(), GAP = 0.035;
  function shell(frame, sk, c, dir, nu, nv, mat, uvFlip) { const pos = [], uv = [], idx = [], d = P(), q = P(), edge = { top: [], bottom: [], left: [], right: [], mid: [] };
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { dir(i / nu, j / nv, d); let lo = 0, hi = 3; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sk(q.copy(c).addScaledVector(d, m)) > GAP) hi = m; else lo = m; }
      q.copy(c).addScaledVector(d, hi); pos.push(q.x, q.y, q.z); uv.push(i / nu, uvFlip ? 1 - j / nv : j / nv); const v = q.clone();
      if (j === 0) edge.top.push(v); if (j === nv) edge.bottom.push(v); if (i === 0) edge.left.push(v); if (i === nu) edge.right.push(v); if (i === nu / 2) edge.mid.push(v); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, cc = a + nu + 1, dd = cc + 1; idx.push(a, cc, b, b, cc, dd); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.material.side = THREE.DoubleSide; m.castShadow = true; m.receiveShadow = true; frame.add(m); m.userData.edge = edge; return m; }
  const trim = (pts, frame, r = 0.018) => { if (pts.length > 1) tube(pts.map((v) => [v.x, v.y, v.z]), r, gd, frame); };
  const sph = (az, el, out, back) => out.set(Math.sin(az) * Math.cos(el), Math.sin(el), (back ? -1 : 1) * Math.cos(az) * Math.cos(el));
   
  const ch = shell(hd, (h) => skinHead(h), P(0, 0.05, 0.15), (u, v, o2) => sph((u - 0.5) * 0.85, 1.05 - v * 1.45, o2), 8, 10, mt);
  trim(ch.userData.edge.left, hd); trim(ch.userData.edge.right, hd); trim(ch.userData.edge.mid, hd, 0.016);
  add(hd, new THREE.OctahedronGeometry(0.055), glow("#7fd3ff", 1.8), [0, 0.36, 0.5], [0.6, 0, 0], [1, 1.3, 0.6]);
   
  for (let k = 0; k < 3; k++) for (const sd of [-1, 1]) { const y0 = 0.14 + k * 0.24, cr = shell(neck, skinNeck, P(0, y0 + 0.1, 0), (u, v, o2) => { const a = -0.75 + u * 1.65; o2.set(sd * Math.cos(a), (v - 0.5) * 0.001, Math.sin(a)).normalize(); }, 6, 1, mt);
    cr.geometry.translate(0, 0, 0); const g = cr.geometry.attributes.position; for (let i = 0; i < g.count; i++) g.setY(i, g.getY(i) + (i > 6 ? 0.1 : -0.1)); g.needsUpdate = true; cr.geometry.computeVertexNormals(); trim(cr.userData.edge.top.map((v) => v.clone().setY(v.y - 0.1)), neck, 0.014); }
   
  const pe = shell(body, skinBody, P(0, 1.95, 0.9), (u, v, o2) => sph((u - 0.5) * 2.3, -0.75 + v * 1.1, o2), 12, 8, mt); trim(pe.userData.edge.top, body); trim(pe.userData.edge.bottom, body);
  const boss = sph(0, -0.2, P()); const bp = P(0, 1.95, 0.9); for (let t = 0; t < 3; t += 0.01) if (skinBody(Tv.copy(bp).addScaledVector(boss, t)) > GAP + 0.02) { bp.addScaledVector(boss, t); break; }
  add(body, new THREE.SphereGeometry(0.09, 16, 12), gd, bp.toArray()); add(body, new THREE.OctahedronGeometry(0.05), glow("#7fd3ff", 1.8), bp.clone().addScaledVector(boss, 0.08).toArray());
  const cu = shell(body, skinBody, P(0, 2.0, -0.92), (u, v, o2) => sph((u - 0.5) * 2.4, 0.15 + v * 1.0, o2, true), 12, 8, mt); trim(cu.userData.edge.top, body); trim(cu.userData.edge.left, body); trim(cu.userData.edge.right, body);
  

  const star = canvasTex(512, 256, (x, W, H) => { x.fillStyle = "#232a78"; x.fillRect(0, 0, W, H); for (let i = 0; i < 70; i++) { x.fillStyle = i % 5 ? "#ffffff" : "#ffd76a"; x.globalAlpha = 0.5 + Math.random() * 0.5; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 2.2, 0, TAU); x.fill(); }
    x.globalAlpha = 1; x.fillStyle = "#e2b44a"; x.fillRect(0, H - 22, W, 22); for (let i = 10; i < W; i += 28) { x.beginPath(); x.arc(i, H - 22, 9, 0, Math.PI); x.fill(); } });
  const caps = [];
  for (const sd of [-1, 1]) { const cmat = new THREE.MeshStandardMaterial({ map: star, roughness: 0.8 }), NU = 14, NV = 12, pos = [], uv = [], idx = [], q = P(), dd = P();
    const surf = (o2, oy, oz, dx, dy) => { let lo = 0, hi = 3; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (skinBody(q.set(o2 + dx * m, oy + dy * m, oz)) > GAP + 0.01) hi = m; else lo = m; } return hi; };
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const z = 0.76 - i / NU * 1.5, v = j / NV;
      let X, Y; if (v < 0.5) { const th = 0.55 + v / 0.5 * (Math.PI / 2 - 0.55), t = surf(0, 1.85, z, sd * Math.sin(th), Math.cos(th)); X = sd * Math.sin(th) * t; Y = 1.85 + Math.cos(th) * t; }
      else { const xe = surf(0, 1.85, z, sd, 0), y = 1.85 - (v - 0.5) / 0.5 * 0.62; X = sd * Math.max(xe, surf(0, y, z, sd, 0)); Y = y; }
      pos.push(X, Y, z); uv.push(i / NU, 1 - v); }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c2 = a + NU + 1, e2 = c2 + 1; idx.push(a, c2, b, b, c2, e2); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, cmat); m.material.side = THREE.DoubleSide; m.castShadow = true; body.add(m); caps.push({ m, base: Float32Array.from(pos), sd }); }
   
  const seat = new THREE.Group(); seat.position.set(0, 2.53, -0.05); body.add(seat);
  add(seat, new THREE.SphereGeometry(1, 28, 14), new THREE.MeshStandardMaterial({ color: "#1d2a6e", roughness: 0.55 }), [0, 0, 0], [0, 0, 0], [0.4, 0.12, 0.62]);
  add(seat, new THREE.TorusGeometry(0.2, 0.05, 8, 20, Math.PI), gd, [0, 0.06, 0.52], [0, 0, 0], [1, 1.1, 1]); add(seat, new THREE.TorusGeometry(0.3, 0.06, 8, 24, Math.PI), gd, [0, 0.05, -0.55], [0, 0, 0], [1, 0.9, 1]);
  const stirrups = []; for (const s of [-1, 1]) { const st = new THREE.Group(); st.position.set(s * 0.98, 2.2, 0.16); body.add(st); add(st, new THREE.TorusGeometry(0.11, 0.02, 8, 20), gd, [0, 0, 0], [0, Math.PI / 2, 0]); add(st, new THREE.BoxGeometry(0.03, 0.4, 0.07), new THREE.MeshStandardMaterial({ color: "#3a2a1c" }), [-s * 0.18, 0.24, 0], [0, 0, s * 0.75]); stirrups.push(st); }
  const reins = [0, 1].map(() => add(body, new THREE.CylinderGeometry(0.014, 0.014, 1, 6), new THREE.MeshStandardMaterial({ color: "#3a2a1c" })));
   
  root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), B = new THREE.Box3(), M = new THREE.Matrix4();
  root.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.material && o.material.userData && o.material.userData.u) o.material.userData.u.uRest.value.multiplyMatrices(inv, o.matrixWorld); });
  root.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || cov.n.value > 11 || (o.material.metalness !== 1 && !o.material.map)) return; o.geometry.computeBoundingBox(); B.copy(o.geometry.boundingBox).applyMatrix4(M.multiplyMatrices(inv, o.matrixWorld));
    const h = B.getSize(P()).multiplyScalar(0.5), c = B.getCenter(P()), z = h.x * h.y * h.z; if (z < 0.004) return; const i = cov.n.value++; cov.c.value[i].set(c.x, c.y, c.z, 0.02); cov.h.value[i].copy(h); });
  const mats = []; root.traverse((o) => { if (o.material && o.material.userData && o.material.userData.u && !mats.includes(o.material)) mats.push(o.material); });
  const rest = new Map(); root.traverse((o) => { if (o.isObject3D) rest.set(o, [o.position.clone(), o.rotation.clone()]); });

   
  

  const L1 = P(), skin = (Q) => Math.min(skinBody(body.worldToLocal(L1.copy(Q))), skinNeck(neck.worldToLocal(L1.copy(Q))), skinHead(hd.worldToLocal(L1.copy(Q))));
  const dist = (Q, noSaddle) => Math.min(skin(Q) - GAP - 0.02, noSaddle ? 9 : ell(body.worldToLocal(L1.copy(Q)), [0, 2.53, -0.05], [0.42, 0.14, 0.64]));
  const headPts = []; for (let i = 0; i < 60; i++) { const a = i * 2.39996, y = 1 - (i + 0.5) / 30, r = Math.sqrt(1 - y * y); headPts.push(P(Math.cos(a) * r * 0.43, 0.1 + y * 0.45, 0.12 + Math.sin(a) * r * 0.55)); }

  return { root, body, seat, dist, skin, mats, headWorld: () => headPts.map((v) => hd.localToWorld(v.clone())), stirrup: (s) => stirrups[s < 0 ? 0 : 1].getWorldPosition(P()), update(t, dt, s = {}) {
    for (const [o, [p, r]] of rest) { o.position.copy(p); o.rotation.copy(r); }
    for (const m of mats) m.userData.u.uTime.value = t;
    const br = s.breath ?? Math.sin(t * 1.4), trot = s.trot || 0, rear = s.rear ?? -1, graze = ease(s.graze || 0), ph = s.ph ?? t * 7.5;    
    body.position.y += 0.015 * br * (1 - trot) + Math.abs(Math.sin(ph)) * 0.09 * trot;
    neck.rotation.x += 0.04 * Math.sin(t * 0.9) + graze * 0.95 - Math.sin(ph * 2) * 0.05 * trot; head.rotation.x += graze * 0.35;
    ears.forEach((e, i) => { e.rotation.x += Math.max(0, Math.sin(t * 0.7 + i * 2.1) - 0.93) * 6; });
    tail.forEach((l, i) => { l.rotation.z += Math.sin((s.swish ?? t * 2.2) - i * 0.6) * (0.12 + i * 0.03) * (1 + trot); l.rotation.x += 0.08 + trot * (0.12 + 0.09 * Math.sin(ph * 2 - i * 0.55)); });    
    for (const g of legs) { const k = (g.front ? 1 : -1) * (g.x > 0 ? 1 : -1), a = ph + (k > 0 ? 0 : Math.PI);    
      g.hip.rotation.x += Math.sin(a) * 0.5 * trot; g.knee.rotation.x += (g.front ? 1 : -1) * Math.max(0, Math.cos(a)) * 0.9 * trot; g.ft.rotation.x += (g.front ? 0.4 : -0.3) * Math.max(0, Math.cos(a)) * trot; }
    if (rear >= 0) { const k = Math.sin(clamp(rear, 0, 1) * Math.PI), up = ease(k * 1.4) * 0.62, pv = P(0, 0.05, -0.97);    
      body.position.sub(pv).applyAxisAngle(P(1, 0, 0), -up).add(pv); body.rotation.x -= up; neck.rotation.x -= up * 0.35; neck.rotation.z -= up * 1.05; head.rotation.z -= up * 0.3;    
      for (const g of legs) if (g.front) { g.hip.rotation.x -= up * 1.4 + Math.sin(t * 14) * 0.3 * up; g.knee.rotation.x += up * 2.2; } else g.hip.rotation.x += up * 0.9; this.up = up; } else this.up = 0;
    for (const c of caps) { const p = c.m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = c.base[i * 3 + 1], k = Math.max(0, (1.85 - y) / 0.62);    
      p.setX(i, c.base[i * 3] + c.sd * k * k * (0.03 * Math.sin(t * 2 + c.base[i * 3 + 2] * 3) + 0.07 * trot * Math.abs(Math.sin(ph + c.base[i * 3 + 2])))); p.setZ(i, c.base[i * 3 + 2] + k * k * 0.06 * trot * Math.sin(ph * 2)); } p.needsUpdate = true; }
    root.updateMatrixWorld(true);
     
    for (const [i, s2] of [[0, -1], [1, 1]]) { const a = hd.localToWorld(P(s2 * 0.24, -0.16, 0.5)), c = seat.localToWorld(P(s2 * 0.1, 0.12, 0.5)), r = reins[i]; body.worldToLocal(a); body.worldToLocal(c);
      r.position.copy(a).add(c).multiplyScalar(0.5); r.scale.set(1, a.distanceTo(c), 1); r.quaternion.setFromUnitVectors(P(0, 1, 0), c.clone().sub(a).normalize()); }
  } };
}
