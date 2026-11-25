

import * as THREE from "three";
import { makeCloth } from "./cloth.js";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k, ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }, TAU = Math.PI * 2;
const P = (x, y, z) => new THREE.Vector3(x, y, z);
export const plate = () => new THREE.MeshPhysicalMaterial({ color: "#cdd5df", metalness: 1, roughness: 0.34, clearcoat: 0.3, clearcoatRoughness: 0.3 });    
export const gold = () => new THREE.MeshPhysicalMaterial({ color: "#e2b44a", metalness: 1, roughness: 0.25 });
export const glow = (c, k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false });
export const add = (parent, geo, mat, p = [0, 0, 0], r = [0, 0, 0], s) => { const o = new THREE.Mesh(geo, mat); o.position.set(...p); o.rotation.set(...r); if (s) o.scale.set(...s); o.castShadow = true; parent.add(o); return o; };
export const tube = (pts, r, mat, parent, closed = false) => add(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => P(...p)), closed), pts.length * 12, r, 8, closed), mat);
export const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };

 
function sword() {
  const g = new THREE.Group(), L = 4.6, W = 0.17, inlay = glow("#7fe6ff", 1.4), lit = inlay.color.clone();    
  const s = new THREE.Shape(); s.moveTo(-W, 0); s.lineTo(-W * 0.86, L - 0.55); s.lineTo(0, L); s.lineTo(W * 0.86, L - 0.55); s.lineTo(W, 0); s.closePath();
  const blade = add(g, new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.028, bevelSize: 0.035, bevelSegments: 2 }).translate(0, 0, -0.01),
    new THREE.MeshPhysicalMaterial({ color: "#b4bfcc", metalness: 0.85, roughness: 0.55, envMapIntensity: 0.5, specularIntensity: 0.6 }));    
  const aura = add(g, new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false }).translate(0, 0, -0.06), new THREE.MeshBasicMaterial({ color: "#9fd8ff", transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending }));
  aura.scale.set(1.3, 1.02, 1); aura.castShadow = false;
  for (const z of [-0.052, 0.052]) { add(g, new THREE.BoxGeometry(0.035, L - 0.75, 0.006), new THREE.MeshPhysicalMaterial({ color: "#9aaabd", metalness: 1, roughness: 0.3 }), [0, (L - 0.75) / 2 + 0.12, z]);    
    const ln = add(g, new THREE.BoxGeometry(0.012, L - 1.0, 0.004), inlay, [0, (L - 1.0) / 2 + 0.2, z * 1.12]); ln.castShadow = false; }    
  const gd = gold(); for (const s2 of [-1, 1]) tube([[0, 0.03, 0], [s2 * 0.25, 0.0, 0], [s2 * 0.5, 0.1, 0], [s2 * 0.48, 0.24, 0], [s2 * 0.36, 0.2, 0]], 0.05, gd, g);    
  add(g, new THREE.SphereGeometry(0.11, 16, 12), gd, [0, 0.02, 0], [0, 0, 0], [1.4, 0.8, 1]);
  add(g, new THREE.OctahedronGeometry(0.07), glow("#7fd3ff", 1.6), [0, 0.03, 0.09]);
  add(g, new THREE.CylinderGeometry(0.075, 0.07, 1.0, 16), new THREE.MeshStandardMaterial({ color: "#1d2a6e", roughness: 0.7 }), [0, -0.52, 0]);    
  for (let i = 0; i < 7; i++) add(g, new THREE.TorusGeometry(0.077, 0.012, 6, 20), gd, [0, -0.1 - i * 0.14, 0], [Math.PI / 2 + 0.25, 0, 0]);
  add(g, new THREE.SphereGeometry(0.14, 20, 16), gd, [0, -1.08, 0]); add(g, new THREE.OctahedronGeometry(0.06), glow("#7fd3ff", 1.6), [0, -1.08, 0.13]);    
  return { g, L, blade, glowAt: (t) => inlay.color.copy(lit).multiplyScalar(0.75 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.6))) };    
}

 
export const capeTex = () => canvasTex(512, 384, (x, W, H) => { x.fillStyle = "#232a78"; x.fillRect(0, 0, W, H); const r = x.createRadialGradient(W * 0.35, H * 0.45, 10, W * 0.35, H * 0.45, W * 0.5); r.addColorStop(0, "rgba(91,63,191,.55)"); r.addColorStop(1, "rgba(91,63,191,0)"); x.fillStyle = r; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { x.fillStyle = i % 5 ? "#ffffff" : "#ffd76a"; x.globalAlpha = 0.5 + Math.random() * 0.5; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 2.4, 0, TAU); x.fill(); }
    x.globalAlpha = 1; x.strokeStyle = "#e2b44a"; x.lineWidth = 14; x.strokeRect(0, 0, W, H); });

export function makeKnight(av) {
  const b = av.b, L = av.L, bw = L.bw, metal = plate(), gd = gold();
   
  for (const k of ["hips", "shL", "shR", "elL", "elR", "thL", "thR", "knL", "knR"]) for (const o of b[k].children) if (o.isMesh && o.material && o.material.sheen === 1) o.material = metal;
   
  const H = b.hips, front = (y) => (([[0.0, 0.62], [0.3, 0.72], [0.6, 0.7], [0.86, 0.62], [1.04, 0.51]].reduce((r, [yy, rr], i, a) => (i && y >= a[i - 1][0] && y <= yy ? lerp(a[i - 1][1], rr, (y - a[i - 1][0]) / (yy - a[i - 1][0])) : r), 0.6)) * bw * 0.86 + 0.012);
  tube([0.15, 0.4, 0.65, 0.9, 1.08].map((y) => [0, y, front(y)]), 0.022, gd, H);
  for (const s of [-1, 1]) { tube([[s * 0.04, 0.95, front(0.95)], [s * 0.2, 0.92, front(0.92) - 0.03], [s * 0.3, 0.78, front(0.78) - 0.06], [s * 0.2, 0.68, front(0.68) - 0.03], [s * 0.1, 0.74, front(0.74)]], 0.016, gd, H);
    tube([[s * 0.04, 0.5, front(0.5)], [s * 0.24, 0.45, front(0.45) - 0.04], [s * 0.3, 0.33, front(0.33) - 0.06]], 0.014, gd, H); }
  add(H, new THREE.OctahedronGeometry(0.075), glow("#7fd3ff", 1.8), [0, 0.82, front(0.82) + 0.03], [0, 0, 0], [1, 1.3, 0.6]);
  for (const [y, r] of [[0.24, 0.72], [0.36, 0.73]]) add(H, new THREE.TorusGeometry(r * bw * 1.06 + 0.03, 0.022, 8, 56), gd, [0, y, 0], [Math.PI / 2, 0, 0], [1, 0.87, 1]);
  add(H, new THREE.TorusGeometry(0.64 * bw * 1.06 + 0.05, 0.05, 10, 56), new THREE.MeshStandardMaterial({ color: "#5a3a22", roughness: 0.6 }), [0, 0.06, 0], [Math.PI / 2, 0, 0], [1, 0.87, 1]);    
  add(H, new THREE.BoxGeometry(0.16, 0.13, 0.04), gd, [0, 0.06, 0.6 * bw * 0.86 + 0.06]);    
  for (const s of [-1, 1]) { const t = add(H, new THREE.CylinderGeometry(0.3, 0.36, 0.34, 20, 1, true, -0.6, 1.2), metal, [s * 0.32 * bw, -0.12, 0.02], [0.1, s * 0.5, s * 0.12]); t.material = metal; t.material.side = THREE.DoubleSide; }    
   
  add(b.chest, new THREE.TorusGeometry(0.34 * bw, 0.07, 10, 40), metal, [0, 0.22, 0.02], [Math.PI / 2, 0, 0], [1, 0.86, 1]); add(b.chest, new THREE.TorusGeometry(0.36 * bw, 0.02, 6, 40), gd, [0, 0.26, 0.02], [Math.PI / 2, 0, 0], [1, 0.86, 1]);
  for (const [sh, s] of [[b.shL, 1], [b.shR, -1]]) { for (const [k, y] of [[1, 0.06], [0.82, -0.08]]) { add(sh, new THREE.SphereGeometry(0.3 * k * Math.min(bw, 1.2), 24, 12, 0, TAU, 0, Math.PI / 2), metal, [s * 0.04, y, 0], [0, 0, -s * 0.35], [1.1, 0.75, 1.15]);
      add(sh, new THREE.TorusGeometry(0.3 * k * Math.min(bw, 1.2), 0.016, 6, 32), gd, [s * 0.04, y, 0], [Math.PI / 2, -s * 0.35, 0], [1.1, 1.15, 1]); } }
  for (const kn of [b.knL, b.knR]) { add(kn, new THREE.SphereGeometry(0.17, 18, 12), metal, [0, 0.02, 0.1], [0, 0, 0], [1, 0.85, 0.8]); add(kn, new THREE.TorusGeometry(0.12, 0.014, 6, 24), gd, [0, 0.02, 0.22]); }
   
  const bow = new THREE.Group(); bow.position.set(-0.36 * L.cw, 0.88, 0.3); bow.rotation.set(-0.35, 0.15, 0.32); bow.scale.setScalar(1.4); b.head.add(bow); const rb = new THREE.MeshPhysicalMaterial({ color: "#3f6fd8", roughness: 0.5, sheen: 1, sheenColor: new THREE.Color("#b8d0ff") });
  for (const s of [-1, 1]) { add(bow, new THREE.SphereGeometry(0.2, 24, 16), rb, [s * 0.22, 0.03, 0], [0, 0, s * 0.4], [1.15, 0.68, 0.42]); add(bow, new THREE.SphereGeometry(0.1, 16, 10), rb, [s * 0.075, -0.16, 0.02], [0, 0, s * 0.3], [0.55, 1.5, 0.3]); }    
  add(bow, new THREE.SphereGeometry(0.085, 16, 12), gd, [0, 0, 0.03], [0, 0, 0], [1, 1, 0.7]);    
  

  const tailPts = [], tr = (i) => 0.13 - 0.055 * i / Math.max(1, av.tail.length - 1) + (L.furLen || 0) * (L.fur === "Longhair" ? 1.45 : 1);
  const tailS = (Q) => { let d = 9; for (let i = 0; i + 1 < tailPts.length; i++) { const a = tailPts[i], c = tailPts[i + 1], abx = c.x - a.x, aby = c.y - a.y, abz = c.z - a.z, apx = Q.x - a.x, apy = Q.y - a.y, apz = Q.z - a.z, t2 = clamp((apx * abx + apy * aby + apz * abz) / (abx * abx + aby * aby + abz * abz || 1), 0, 1);
    d = Math.min(d, Math.hypot(apx - abx * t2, apy - aby * t2, apz - abz * t2) - tr(i)); } return d; };
  const legPts = [], lr = (L.pants ? 0.25 : 0.22) * Math.min(bw, 1.25) + (L.pants ? 0 : L.furLen || 0);    
  const segD = (Q, a, c) => { const abx = c.x - a.x, aby = c.y - a.y, abz = c.z - a.z, apx = Q.x - a.x, apy = Q.y - a.y, apz = Q.z - a.z, t2 = clamp((apx * abx + apy * aby + apz * abz) / (abx * abx + aby * aby + abz * abz || 1), 0, 1); return Math.hypot(apx - abx * t2, apy - aby * t2, apz - abz * t2); };
  const Rx = 0.44 * bw + 0.07, Rz = 0.44 * bw * 0.86 + 0.07;
  const back = () => new THREE.Vector3(0, 0, -1).applyQuaternion(H.getWorldQuaternion(new THREE.Quaternion())).setY(0).normalize();
  const cape = makeCloth({ w: 1.5 * bw, h: 1.15, nx: 11, ny: 13, map: capeTex(), flare: 0.7, thick: 0.05, get back() { return back(); }, pins: (u, out) => { const a = (u - 0.5) * 2.4; return H.localToWorld(out.set(Math.sin(a) * Rx, 1.08, -Math.cos(a) * Rz)); },
    cols: [(Q) => av.bodyDist(Q), tailS, (Q) => { let d = 9; for (const [a, c, r] of legPts) d = Math.min(d, segD(Q, a, c) - r); return d; }] });
  cape.track = () => { legPts.length = 0; const W = (o) => o.getWorldPosition(new THREE.Vector3()); for (const sd of ["L", "R"]) { legPts.push([W(b["th" + sd]), W(b["kn" + sd]), lr], [W(b["kn" + sd]), W(b["an" + sd]), lr * 0.85]); } legPts.push([W(H).setY(W(H).y - 0.1), W(H).setY(W(H).y + 0.5), 0.5 * bw]);
    tailPts.length = 0; for (let i = 1; i < av.tail.length; i++) tailPts.push(av.tail[i].getWorldPosition(new THREE.Vector3())); const e = av.tail[av.tail.length - 1]; tailPts.push(e.localToWorld(new THREE.Vector3(0, 0.25, 0))); };
  const step0 = cape.step; cape.step = (dt, t) => { cape.track(); step0(dt, t); }; const settle0 = cape.settle; cape.settle = (n, t) => { cape.track(); settle0(n, t); };
   
  const sw = sword(), hold = new THREE.Group(); H.add(hold); hold.add(sw.g);
  const box = (o, c, h) => { const l = new THREE.Vector3(); return (Q) => { o.worldToLocal(l.copy(Q)); const x = Math.abs(l.x - c[0]) - h[0], y = Math.abs(l.y - c[1]) - h[1], z = Math.abs(l.z - c[2]) - h[2]; return Math.hypot(Math.max(x, 0), Math.max(y, 0), Math.max(z, 0)) + Math.min(Math.max(x, y, z), 0); }; };
  const bladeS = box(sw.g, [0, sw.L / 2, 0], [0.2, sw.L / 2, 0.06]), guardS = box(sw.g, [0, 0.1, 0], [0.55, 0.16, 0.08]), gripS = box(sw.g, [0, -0.55, 0], [0.09, 0.6, 0.09]), headS = (Q) => av.headDist(Q);
  

  const qE = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)), qDir = (d, roll) => new THREE.Quaternion().setFromUnitVectors(P(0, 1, 0), d.normalize()).multiply(new THREE.Quaternion().setFromAxisAngle(P(0, 1, 0), roll));
  const POSE = { present: [P(-0.46 * bw, 1.0, 0.98), qE(0.32, 0.15, 0.5)], rest: [P(-0.36 * bw, 0.72, 0.8), qDir(P(-0.82, 0.42, -0.4), 1.2)], wind: [P(0.42 * bw, 0.86, 0.6), qDir(P(0.9, 0.04, -0.45), 0.3)], out: [P(-0.3 * bw, 0.95, 0.85), qDir(P(-0.62, 0.02, 0.78), 1.57)], low: [P(-0.2 * bw, 0.82, 1.0), qDir(P(-0.15, -0.2, 1), 1.57)], aside: [P(-1.0 * bw, 0.85, 0.42), qDir(P(-1, 0.58, 0.1), 1.2)] };    
  const SWING = [[0, POSE.present], [0.12, POSE.low], [0.28, POSE.wind], [0.38, POSE.out], [0.8, POSE.out], [1, POSE.present]];    
  const qa = new THREE.Quaternion(), out = { p: P(0, 0, 0), q: new THREE.Quaternion() };
  const blend = (A, B, k) => { out.p.lerpVectors(A[0], B[0], k); out.q.slerpQuaternions(A[1], B[1], k); return out; };
   
  const clearance = () => { let h = 9, d = 9; for (let y = 0.1; y <= sw.L; y += 0.15) for (const x of [-0.19, 0, 0.19]) { const Q = sw.g.localToWorld(P(x * (1 - y / sw.L), y, 0)); h = Math.min(h, av.headDist(Q)); d = Math.min(d, av.bodyDist(Q)); } return { head: +h.toFixed(3), body: +d.toFixed(3) }; };
  return { sword: sw, hold, cape, clearance, update(t, dt, s = {}) {
    const rest = ease(s.rest || 0), sg = s.swing ?? -1;
    let f = blend(POSE.present, POSE.rest, rest); if (s.aside) { const fp = f.p.clone(), fq = f.q.clone(), k = ease(s.aside); f.p.lerpVectors(fp, POSE.aside[0], k); f.q.slerpQuaternions(fq, POSE.aside[1], k); }
    if (sg >= 0) {    
      let i = 1; while (i < SWING.length - 1 && sg > SWING[i][0]) i++; f = blend(SWING[i - 1][1], SWING[i][1], ease((sg - SWING[i - 1][0]) / (SWING[i][0] - SWING[i - 1][0])));
      const go = ease((sg - 0.32) / 0.48);
      av.root.rotation.y = -go * TAU; av.root.updateMatrixWorld(true); }
     
    av.tail.forEach((l, i, a) => { l.rotation.x = i ? (i > a.length - 4 ? -0.32 : 0.06) + 0.04 * Math.sin(t * 1.4 - i) : -1.5; l.rotation.z = Math.sin(t * 1.8 - i * 0.5) * 0.09; });
    sw.glowAt(t);
    const sway = (s.breath ?? Math.sin(t * 1.3)) * 0.03 * (1 - rest);    
    hold.position.copy(f.p); hold.quaternion.copy(f.q); hold.rotateZ(sway); hold.updateMatrixWorld(true);
     
    const cols = [bladeS, guardS, gripS, headS];
    av.reach("L", sw.g.localToWorld(P(0.02, -0.2, 0.0)), P(1, -0.4, -0.3).applyQuaternion(av.root.quaternion), 0.3, cols, { grip: [gripS, guardS], touch: 0.08 });
    av.reach("R", sw.g.localToWorld(P(-0.02, -0.66, 0.0)), P(-1, -0.4, -0.3).applyQuaternion(av.root.quaternion), 0.3, cols, { grip: [gripS], touch: 0.08 });
  } };
}
