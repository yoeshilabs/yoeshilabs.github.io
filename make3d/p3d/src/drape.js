/* Prancer 3D: cloth that follows the body (2026-11-09, Yoeshi: "introduce physics so the clothes interact with body
   movement better"). A cape or a skirt keeps the shape it was tailored in, and moves as cloth does: it lags the body and
   swings back, flies out in a spin, trails in a prance, lies over the legs and along the floor when the cat sits, and
   never passes through the torso, the legs or the floor.

   How: every vertex of the garment is a particle in the world. Each step it keeps its own momentum (Verlet), is drawn
   toward where the tailored shape would put it on the body now (firmly near the pinned edge, loosely toward the hem),
   is held to its neighbours by links of the cloth's own lengths, and is then pushed out of the body. Because the
   particles live in the world and not on the cat, inertia is free: turn the cat and the hem is left behind.

   Opt-in: an Avatar built with { drape: (av) => new Drape(av) } tailors its capes and skirts for it (outfits.js) and
   moves them with av.drape(dt, { t, wind }). Without it nothing changes, pixel for pixel. A step with dt <= 0, and the
   first step, write nothing: the cover (frame 0, the clock held) is the tailored shape exactly.

   Beside cloth.js (the Sword Knight's cape, kept as minted), not in place of it. */
import * as THREE from "three";

const P = new THREE.Vector3(), HI = new THREE.Matrix4(), MI = new THREE.Matrix4();
const profR = (pr, y) => { for (let i = 1; i < pr.length; i++) if (y >= pr[i - 1][1] && y <= pr[i][1]) return pr[i - 1][0] + (pr[i][0] - pr[i - 1][0]) * (y - pr[i - 1][1]) / (pr[i][1] - pr[i - 1][1]); return 0; };
const sm = (u) => { u = u < 0 ? 0 : u > 1 ? 1 : u; return u * u * (3 - 2 * u); };

/* the normals of a grid that closes on itself (a skirt: the last column is the first again): one normal along the seam */
export function weld(g, w, n) { g.computeVertexNormals(); const N = g.attributes.normal;
  for (let j = 0; j < n; j++) { const a = j * w, b = a + w - 1; let x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b); const d = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / d, y / d, z / d); N.setXYZ(b, x / d, y / d, z / d); }
  N.needsUpdate = true; return g; }

export class Drape {
  constructor(av) { this.av = av; this.parts = []; this.caps = []; this.h = 0; }

  /* a garment: a mesh on the hips whose vertices are a grid, w across and n down from the pinned edge (vertex j * w + i).
       loop    the grid closes on itself (a skirt)
       soft    how loosely the hem follows (the pull toward the tailored shape, a step at 60 a second)
       stiff   (x, y, z) -> a firmer pull at a place (round a tail's opening)
       hoop    how far a row may open before the cloth holds (a skirt's folds opening in a spin)
       over    pushed out of a leg, the cloth goes up and over it (a skirt on a lap)
       pin     the rows down to this one are sewn in place (a headcloth: close on the crown, loose from the cheeks down)
       arms    the arms push it too (a headcloth's wings and lappets, in the way of a raised paw) */
  add(mesh, w, n, o = {}) {
    const g = mesh.geometry, pos = g.attributes.position, loop = !!o.loop, wp = loop ? w - 1 : w, N = wp * n, rest = new Float32Array(N * 3), vmap = new Uint16Array(pos.count);
    for (let j = 0; j < n; j++) for (let i = 0; i < w; i++) { const v = j * w + i, p = j * wp + i % wp; vmap[v] = p; if (i < wp) { rest[p * 3] = pos.getX(v); rest[p * 3 + 1] = pos.getY(v); rest[p * 3 + 2] = pos.getZ(v); } }
    const s = new Float32Array(N), soft = o.soft ?? 0.04, j0 = o.pin || 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < wp; i++) { const p = j * wp + i, t = j > j0 ? (j - j0) / (n - 1 - j0) : 0; let st = j > j0 ? Math.max(soft, Math.pow(1 - t, o.pow ?? 3)) : 1; if (j && o.stiff) st = Math.min(0.92, Math.max(st, o.stiff(rest[p * 3], rest[p * 3 + 1], rest[p * 3 + 2]))); s[p] = st; }
    const L = [], len = (a, b) => Math.hypot(rest[a * 3] - rest[b * 3], rest[a * 3 + 1] - rest[b * 3 + 1], rest[a * 3 + 2] - rest[b * 3 + 2]),
      link = (a, b, lo, hi, f) => { const d = len(a, b); if (d > 1e-5) L.push(a, b, d * lo, d * hi, f); }, hoop = o.hoop ?? 1.06;
    for (let j = 0; j < n; j++) for (let i = 0; i < wp; i++) { const p = j * wp + i, r = loop ? j * wp + (i + 1) % wp : i + 1 < wp ? p + 1 : -1, r2 = loop ? j * wp + (i + 2) % wp : i + 2 < wp ? p + 2 : -1;
      if (r >= 0 && j) link(p, r, 0.75, hoop, 1);                                        // along a row
      if (j + 1 < n) { link(p, p + wp, 0.88, 1.02, 1); if (r >= 0) { link(p, r + wp, 0.7, 1.12, 0.5); link(r, p + wp, 0.7, 1.12, 0.5); } }   // down the cloth, and across its squares
      if (j + 2 < n) link(p, p + 2 * wp, 0.62, 9, 0.35); if (r2 >= 0 && j) link(p, r2, 0.55, 9, 0.35); }   // it folds, but not flat on itself
    mesh.frustumCulled = false;
    const pt = { mesh, g, pos, loop, w, n, N, rest, vmap, s, L: Float32Array.from(L), x: new Float32Array(N * 3), xp: new Float32Array(N * 3), tg: new Float32Array(N * 3), live: false,
      damp: o.damp ?? 0.9, lag: o.lag ?? 0.95, fly: o.fly ?? 0.5, fold: o.fold ?? 0.92, over: !!o.over, pad: o.pad ?? 0.035, wind: o.wind ?? 1, arms: !!o.arms, fol: [] };
    this.parts.push(pt); return pt; }

  /* a trim sewn to a garment (a gold binding along its edge): each of its vertices rides the cloth's nearest point */
  follow(mesh, pt) { const p = mesh.geometry.attributes.position, a = p.array, c = pt.pos.array, n = p.count, idx = new Uint16Array(n), off = new Float32Array(n * 3);
    for (let v = 0; v < n; v++) { const x = a[v * 3], y = a[v * 3 + 1], z = a[v * 3 + 2]; let best = 1e9, bi = 0; for (let q = 0, i = 0; q < c.length; q += 3, i++) { const d = (c[q] - x) * (c[q] - x) + (c[q + 1] - y) * (c[q + 1] - y) + (c[q + 2] - z) * (c[q + 2] - z); if (d < best) { best = d; bi = i; } }
      idx[v] = bi; off[v * 3] = x - c[bi * 3]; off[v * 3 + 1] = y - c[bi * 3 + 1]; off[v * 3 + 2] = z - c[bi * 3 + 2]; }
    mesh.frustumCulled = false; pt.fol.push([p, idx, off]); }

  /* back to the tailored shape, at rest (a cat set somewhere new) */
  reset() { for (const pt of this.parts) pt.live = false; this.h = 0; this.yaw = undefined; this.om = 0; }
  weld(g, w, n) { return weld(g, w, n); }   // for the tailor (outfits.js reaches the cloth through the avatar, and imports nothing new)
  sm(u) { return sm(u); }

  step(dt, o = {}) {
    if (!(dt > 0) || !this.parts.length) return;
    const av = this.av, b = av.b, k = av.k, bw = av.L.bw, prof = av.prof, fur = av.profFur || 0, t = o.t || 0, W = o.wind, wx = W ? W.x : 0, wy = W ? W.y : 0, wz = W ? W.z : 0;
    const n = Math.max(1, Math.min(3, Math.round(dt * 60))), h = dt / n, e = h * 60, vs = this.h ? Math.min(2, h / this.h) : 1; this.h = h;
    b.anL.updateWorldMatrix(true, false); b.anR.updateWorldMatrix(true, false); const HM = b.hips.matrixWorld.elements; HI.copy(b.hips.matrixWorld).invert(); const hi = HI.elements, hx = HM[12], hz = HM[14];
    const F = av.root.getWorldPosition(P).y + 0.03 * k;   // the floor, a cloth's thickness up
    /* how fast the body turns: a turning body throws its cloth outward (the spin, a dance's twist) */
    const yaw = Math.atan2(HM[8], HM[10]); let om = 0; if (this.yaw !== undefined) { let d = yaw - this.yaw; d -= Math.round(d / 6.283185307179586) * 6.283185307179586; om = d / dt; } this.yaw = yaw; this.om = (this.om || 0) * 0.5 + om * 0.5; const om2 = Math.min(70, this.om * this.om);
    /* the legs: thigh and shin as tapered capsules, a ball at the paw */
    const caps = this.caps; caps.length = 0; const lf = (av.L.furLen || 0) * 0.5, r0 = (0.22 * Math.min(bw, 1.25) + lf) * k, r1 = (0.175 + lf) * k, r2 = (0.15 + lf) * k;
    for (const sd of ["L", "R"]) { const a = b["th" + sd].matrixWorld.elements, c = b["kn" + sd].matrixWorld.elements, d = b["an" + sd].matrixWorld.elements;
      caps.push(a[12], a[13], a[14], c[12], c[13], c[14], r0, r1, c[12], c[13], c[14], d[12], d[13], d[14], r1, r2, d[12], d[13] - 0.04 * k, d[14], d[12] + d[8] * 0.14, d[13] - 0.04 * k, d[14] + d[10] * 0.14, 0.2 * k, 0.2 * k); }
    /* the arms, for the cloth that asks: upper arm, forearm, the paw */
    let capsA = caps; if (this.parts.some((p) => p.arms)) { capsA = caps.slice(); for (const sd of ["L", "R"]) { const a = b["sh" + sd].matrixWorld.elements, c = b["el" + sd].matrixWorld.elements, d = b["wr" + sd].matrixWorld.elements, ru = (av.RU + lf) * k, re = (av.RE + lf) * k;
        capsA.push(a[12], a[13], a[14], c[12], c[13], c[14], ru, re, c[12], c[13], c[14], d[12], d[13], d[14], re, (av.RW + lf) * k, d[12], d[13], d[14], d[12] - d[4] * 0.1 * k, d[13] - d[5] * 0.1 * k, d[14] - d[6] * 0.1 * k, (0.2 + lf) * k, (0.2 + lf) * k); } }
    for (const pt of this.parts) { const { mesh, rest, x, xp, tg, s, L, N } = pt, pad = pt.pad * k, caps = pt.arms ? capsA : this.caps; mesh.updateWorldMatrix(true, false); const m = mesh.matrixWorld.elements;
      /* where the tailored shape puts each point now; what would hang under the floor lies along it instead, out from the cat */
      for (let p = 0, q = 0; p < N; p++, q += 3) { const rx = rest[q], ry = rest[q + 1], rz = rest[q + 2]; let X = m[0] * rx + m[4] * ry + m[8] * rz + m[12], Y = m[1] * rx + m[5] * ry + m[9] * rz + m[13], Z = m[2] * rx + m[6] * ry + m[10] * rz + m[14];
        if (Y < F) { const ex = (F - Y) * pt.fold, dx = X - hx, dz = Z - hz, d = Math.hypot(dx, dz) || 1e-6; X += dx / d * ex; Z += dz / d * ex; Y = F; }
        tg[q] = X; tg[q + 1] = Y; tg[q + 2] = Z; }
      if (!pt.live || Math.hypot(tg[0] - x[0], tg[1] - x[1], tg[2] - x[2]) > 3 * k) { x.set(tg); xp.set(tg); const was = pt.live; pt.live = true; if (!was) continue; }   // the first step only takes its place: nothing is written
      for (let it = 0; it < n; it++) { const dmp = Math.pow(pt.damp, e) * (it ? 1 : vs), hh = h * h * pt.wind;
        for (let p = 0, q = 0; p < N; p++, q += 3) { const st = s[p];
          if (st >= 1) { xp[q] = x[q]; xp[q + 1] = x[q + 1]; xp[q + 2] = x[q + 2]; x[q] = tg[q]; x[q + 1] = tg[q + 1]; x[q + 2] = tg[q + 2]; continue; }
          const a = 1 - Math.pow(1 - st, e), fl = (1 - st) * hh * (1 + 0.5 * Math.sin(t * 5.1 + rest[q] * 2.3 + rest[q + 1] * 1.9)), cf = om2 * h * h * pt.fly * (1 - st), ox = (x[q] - hx) * cf, oz = (x[q + 2] - hz) * cf;   // a gust has flutter in it; a turn throws the cloth out and up
          for (let c = 0; c < 3; c++) { const v = (x[q + c] - xp[q + c]) * dmp; xp[q + c] = x[q + c]; x[q + c] += v + (c ? c > 1 ? wz : wy : wx) * fl + (c ? c > 1 ? oz : Math.hypot(ox, oz) * 0.35 : ox); x[q + c] += (tg[q + c] - x[q + c]) * a; } }
        for (let r = 0; r < 3; r++) for (let i = 0; i < L.length; i += 5) { const A = L[i], B = L[i + 1], wa = 1 - s[A], wb = 1 - s[B], ws = wa + wb; if (ws <= 0) continue; const a = A * 3, c = B * 3, dx = x[c] - x[a], dy = x[c + 1] - x[a + 1], dz = x[c + 2] - x[a + 2], d = Math.hypot(dx, dy, dz) || 1e-9, lo = L[i + 2] * k, hi2 = L[i + 3] * k;
          const g = (d > hi2 ? (d - hi2) : d < lo ? (d - lo) : 0) / d * L[i + 4] / ws; if (!g) continue; x[a] += dx * g * wa; x[a + 1] += dy * g * wa; x[a + 2] += dz * g * wa; x[c] -= dx * g * wb; x[c + 1] -= dy * g * wb; x[c + 2] -= dz * g * wb; }
        for (let p = 0, q = 0; p < N; p++, q += 3) { const st = s[p]; if (st >= 1) continue;
          { const dx = x[q] - tg[q], dy = x[q + 1] - tg[q + 1], dz = x[q + 2] - tg[q + 2], d = Math.hypot(dx, dy, dz), mx = (1 - st) * pt.lag * k; if (d > mx) { const f = mx / d; x[q] = tg[q] + dx * f; x[q + 1] = tg[q + 1] + dy * f; x[q + 2] = tg[q + 2] + dz * f; } }   // never further from its place than this: no step can run away
          /* the torso: the profile the fur or the clothes are built on, in the hips' own space */
          { const X = x[q], Y = x[q + 1], Z = x[q + 2], ly = hi[1] * X + hi[5] * Y + hi[9] * Z + hi[13], r = profR(prof, ly);
            if (r) { const lx = hi[0] * X + hi[4] * Y + hi[8] * Z + hi[12], lz = hi[2] * X + hi[6] * Y + hi[10] * Z + hi[14], ex = lx / bw, ez = lz / (0.86 * bw), d = (Math.hypot(ex, ez) - r - fur) * 0.86 * bw - pt.pad;
              if (d < 0) { let nx = ex / bw, nz = ez / (0.86 * bw); const nl = Math.hypot(nx, nz) || 1; nx *= -d / nl; nz *= -d / nl; x[q] += HM[0] * nx + HM[8] * nz; x[q + 1] += HM[1] * nx + HM[9] * nz; x[q + 2] += HM[2] * nx + HM[10] * nz; } } }
          /* the legs */
          for (let c = 0; c < caps.length; c += 8) { const ax = caps[c], ay = caps[c + 1], az = caps[c + 2], ux = caps[c + 3] - ax, uy = caps[c + 4] - ay, uz = caps[c + 5] - az, px = x[q] - ax, py = x[q + 1] - ay, pz = x[q + 2] - az;
            let u = (px * ux + py * uy + pz * uz) / (ux * ux + uy * uy + uz * uz || 1e-9); u = u < 0 ? 0 : u > 1 ? 1 : u; const R = caps[c + 6] + (caps[c + 7] - caps[c + 6]) * u + pad; let dx = px - ux * u, dy = py - uy * u, dz = pz - uz * u; const d = Math.hypot(dx, dy, dz);
            if (d < R) { if (pt.over) dy = Math.abs(dy) + 0.3 * (R - d); const nl = Math.hypot(dx, dy, dz) || 1e-9, f = R / nl; x[q] = ax + ux * u + dx * f; x[q + 1] = ay + uy * u + dy * f; x[q + 2] = az + uz * u + dz * f; } }
          if (x[q + 1] < F) x[q + 1] = F; } }
      /* back onto the mesh, in its own space */
      MI.copy(mesh.matrixWorld).invert(); const mi = MI.elements, arr = pt.pos.array, vm = pt.vmap;
      for (let v = 0, o3 = 0; v < vm.length; v++, o3 += 3) { const q = vm[v] * 3, X = x[q], Y = x[q + 1], Z = x[q + 2]; arr[o3] = mi[0] * X + mi[4] * Y + mi[8] * Z + mi[12]; arr[o3 + 1] = mi[1] * X + mi[5] * Y + mi[9] * Z + mi[13]; arr[o3 + 2] = mi[2] * X + mi[6] * Y + mi[10] * Z + mi[14]; }
      for (const [fp, idx, off] of pt.fol) { const fa = fp.array; for (let v = 0, o3 = 0; v < idx.length; v++, o3 += 3) { const q = idx[v] * 3; fa[o3] = arr[q] + off[o3]; fa[o3 + 1] = arr[q + 1] + off[o3 + 1]; fa[o3 + 2] = arr[q + 2] + off[o3 + 2]; } fp.needsUpdate = true; }
      pt.pos.needsUpdate = true; if (pt.loop) weld(pt.g, pt.w, pt.n); else pt.g.computeVertexNormals(); }
  }
}
