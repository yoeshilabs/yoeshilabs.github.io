/* Prancer 3D: cloth. A sheet of particles joined by springs (Verlet, with stretch, shear and bend links), its top row
   pinned to points that move with a body, falling under gravity, pushed by the wind, and kept out of whatever it
   touches (signed distance functions of a world point: the body, the tail, a pony). So a cape hangs, swings when its
   knight moves, and lies over the tail instead of through it.
     makeCloth({ w, h, nx, ny, map, pins(i, out), cols: [(P) => distance], thick }) -> { mesh, step(dt, t), settle(n) } */
import * as THREE from "three";

export function makeCloth(o) {
  const nx = o.nx || 11, ny = o.ny || 13, N = nx * ny, thick = o.thick ?? 0.05, cols = o.cols || [];
  const pos = new Float32Array(N * 3), prev = new Float32Array(N * 3), links = [], V = new THREE.Vector3(), A = new THREE.Vector3(), Gd = new THREE.Vector3();
  const geo = new THREE.PlaneGeometry(o.w, o.h, nx - 1, ny - 1), mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: o.map || null, color: o.map ? "#ffffff" : "#232a78", roughness: 0.78, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = true;
  const id = (x, y) => y * nx + x, dx = o.w / (nx - 1), dy = o.h / (ny - 1);
  const link = (a, b, k) => { const ax = a * 3, bx = b * 3; links.push([a, b, Math.hypot(pos[ax] - pos[bx], pos[ax + 1] - pos[bx + 1], pos[ax + 2] - pos[bx + 2]), k]); };
  /* start: hanging straight down from the pins */
  const pin = new THREE.Vector3();
  const mid = new THREE.Vector3(); o.pins(0.5, mid);   // flaring toward the hem, so it hangs full
  for (let x = 0; x < nx; x++) { o.pins(x / (nx - 1), pin); for (let y = 0; y < ny; y++) { const i = id(x, y) * 3, k = y / (ny - 1) * (o.flare ?? 0.6); pos[i] = pin.x + (pin.x - mid.x) * k; pos[i + 1] = pin.y - y * dy; pos[i + 2] = pin.z + (pin.z - mid.z) * k - k * 0.15; } }
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) { if (x < nx - 1) link(id(x, y), id(x + 1, y), 1); if (y < ny - 1) link(id(x, y), id(x, y + 1), 1);
    if (x < nx - 1 && y < ny - 1) { link(id(x, y), id(x + 1, y + 1), 0.6); link(id(x + 1, y), id(x, y + 1), 0.6); }
    if (x < nx - 2) link(id(x, y), id(x + 2, y), 0.25); if (y < ny - 2) link(id(x, y), id(x, y + 2), 0.25); }
  /* the lengths come from that flat sheet; it starts out blown back behind the body (o.back), so it settles down onto
     what is behind it (a tail) from outside, never under it */
  /* laid out from where the pins are now (call place() again after moving the body, say onto a pony, before settling) */
  function place() { const bk = o.back || new THREE.Vector3(0, 0, -1), m2 = new THREE.Vector3(); o.pins(0.5, m2);
    for (let x = 0; x < nx; x++) { o.pins(x / (nx - 1), pin); for (let y = 0; y < ny; y++) { const i = id(x, y) * 3, k = y / (ny - 1), f = k * (o.flare ?? 0.6);
      pos[i] = pin.x + (pin.x - m2.x) * f + bk.x * k * o.h * 0.9; pos[i + 1] = pin.y - y * dy * 0.6; pos[i + 2] = pin.z + (pin.z - m2.z) * f + bk.z * k * o.h * 0.9; } }
    prev.set(pos); }
  place();
  /* the way out of a collider: its gradient, by small steps */
  const away = (P, f, d) => { const e = 0.015; Gd.set(f(V.copy(P).setX(P.x + e)) - d, f(V.copy(P).setY(P.y + e)) - d, f(V.copy(P).setZ(P.z + e)) - d); const l = Gd.length(); return l > 1e-6 ? Gd.multiplyScalar(1 / l) : Gd.set(0, 0, -1); };
  function step(dt, t) {
    const h = Math.min(dt, 1 / 30) / 2;
    for (let sub = 0; sub < 2; sub++) {
      const wind = (o.wind || 0.6) * (0.6 + 0.4 * Math.sin(t * 0.9 + sub)), wx = Math.sin(t * 0.37) * wind, wz = -0.4 * wind;
      for (let y = 1; y < ny; y++) for (let x = 0; x < nx; x++) { const i = id(x, y) * 3, k = y / (ny - 1);   // Verlet: keep moving, a little damped; gravity; wind, stronger toward the hem
        for (let c = 0; c < 3; c++) { const p = pos[i + c], v = (p - prev[i + c]) * (o.damp ?? 0.975); prev[i + c] = p; pos[i + c] = p + v; }
        pos[i + 1] -= 9.8 * h * h; pos[i] += wx * k * h * h * (1 + Math.sin(t * 3 + x * 0.7 + y) * 0.5); pos[i + 2] += wz * k * h * h; }
      for (let x = 0; x < nx; x++) { o.pins(x / (nx - 1), pin); const i = id(x, 0) * 3; prev[i] = pos[i]; prev[i + 1] = pos[i + 1]; prev[i + 2] = pos[i + 2]; pos[i] = pin.x; pos[i + 1] = pin.y; pos[i + 2] = pin.z; }
      for (let it = 0; it < 5; it++) {
        for (const [a, b, L, k] of links) { const ai = a * 3, bi = b * 3, ex = pos[bi] - pos[ai], ey = pos[bi + 1] - pos[ai + 1], ez = pos[bi + 2] - pos[ai + 2], d = Math.hypot(ex, ey, ez) || 1e-6, f = (d - L) / d * 0.5 * k;
          const pa = a < nx ? 0 : 1, pb = b < nx ? 0 : 1, s = pa + pb || 1;   // the pinned row does not move
          pos[ai] += ex * f * pa * 2 / s; pos[ai + 1] += ey * f * pa * 2 / s; pos[ai + 2] += ez * f * pa * 2 / s; pos[bi] -= ex * f * pb * 2 / s; pos[bi + 1] -= ey * f * pb * 2 / s; pos[bi + 2] -= ez * f * pb * 2 / s; }
        for (let i = nx; i < N; i++) { A.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);   // out of whatever it touches
          for (const f of cols) { const d = f(A); if (d < thick) { const n = away(A, f, d); A.addScaledVector(n, thick - d); } }
          pos[i * 3] = A.x; pos[i * 3 + 1] = A.y; pos[i * 3 + 2] = A.z; }
      }
    }
    const p = geo.attributes.position; p.array.set(pos); p.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
  }
  /* how near the cloth comes to anything (negative: through), and settling it at rest for a still */
  const clearance = () => { let m = 9; for (let i = nx; i < N; i++) { A.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); for (const f of cols) m = Math.min(m, f(A)); } return m; };
  return { mesh, cols, step, clearance, place, settle(n = 120, t = 0) { place(); for (let i = 0; i < n; i++) step(1 / 30, t + i / 30); } };
}
