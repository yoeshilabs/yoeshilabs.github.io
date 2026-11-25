/* The Arena's fabric and light, as a few named parts (2026-11-23, the refinement pass: "give the building a fabric, a light and a hierarchy, in
   that order"; every build a template, so the Lounge's street or the next venue can take the same parts).
   Two layers, told apart at a glance: the old shell in stone (coursed in blocks a cat high, four courses to a tier of arches), and the new layer in
   pale brushed metal, glass and light. Floors by place (terrazzo, flags, raked sand). Shade is baked into the surfaces (vertex colours, a soft dark
   at every wall's foot and under every tier), and light comes as pools: no new lights, nothing that casts a shadow.
   What crosses to Blender in a GLB export: the textures (small canvases, written as images), the vertex colours and the materials. What does not:
   the light pools' additive blending (they cross as plain see-through discs).
     makeFabric(THREE, { reading: "pearl" | "warm" }) -> { reading, stone, stoneShaded, pierStone, stoneFlat, metal, glass, terrazzo, flags, sand, inlay(c), lamp(c),
       mapStone(mesh, { a, b, y }), shadeRing(mesh, fn), pool(r, color, k), blob(w, d, k), panel(w, h, nu, nv, shade) } */
export function makeFabric(THREE, { reading = "pearl" } = {}) {
  const WARM = reading === "warm";
  const R = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const tex = (w, h, draw, rep = [1, 1]) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; };
  const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return "#" + c.getHexString(); };

  /* the stone: 2 courses of 2.75 m (a cat's height; four to a tier of 11 m) by 11 m, blocks 5.5 m long in a running bond. The pearl reading is the city's
     pristine stone (Yoeshi, 2026-11-21: "the city so far is pristine and futuristic"): fine crisp joints, the blocks barely differing. The warm reading
     is older: a creamier stone, deeper joints, blocks that differ, a little grain */
  const STONE_M = { w: 11, h: 5.5 };
  const stoneTex = (strong) => tex(1024, 512, (g, w, h) => { const rnd = R(WARM ? 7 : 3), base = WARM ? "#efe3cf" : "#f4f0f1", joint = strong ? (WARM ? "#9c8868" : "#a99db4") : (WARM ? "#b5a184" : "#cdc4d2"), vary = WARM ? 0.07 : 0.025;
    for (let r = 0; r < 2; r++) for (let k = -1; k < 2; k++) { const x0 = k * 512 + (r ? 256 : 0); g.fillStyle = shade(base, 1 - vary / 2 + rnd() * vary); g.fillRect(x0, r * 256, 512, 256); }
    if (WARM) for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "120,96,70" : "255,250,240"},${0.05 + rnd() * 0.06})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
    const J = strong ? 7 : WARM ? 5 : 3; g.fillStyle = joint;
    for (let r = 0; r <= 2; r++) g.fillRect(0, r * 256 - J / 2, w, J);
    for (let r = 0; r < 2; r++) for (let k = 0; k <= 2; k++) g.fillRect(k * 512 + (r ? 256 : 0) - J / 2, r * 256, J, 256);
    g.fillStyle = "rgba(255,255,255,.55)"; for (let r = 0; r < 2; r++) g.fillRect(0, r * 256 + J / 2 + 1, w, strong ? 2 : 1); });   // the arris under each joint catches the light
  /* the outside's stone has stronger joints (Yoeshi, 2026-11-24: "Yes, pearl", with the stronger joints outside offered: the coursing has to read from the plaza) */
  const stoneMap = stoneTex(false), stoneMapOut = stoneTex(true);
  const stone = new THREE.MeshStandardMaterial({ map: stoneMap, color: "#ffffff", roughness: WARM ? 0.62 : 0.32, metalness: WARM ? 0 : 0.06, emissive: "#6a5f78", emissiveMap: stoneMap, emissiveIntensity: 0.14 });
  const stoneShaded = stone.clone(); stoneShaded.vertexColors = true;                                                                   // (only on meshes that carry their shade: without it a mesh would draw black)
  const stoneOut = stone.clone(); stoneOut.map = stoneMapOut; stoneOut.emissiveMap = stoneMapOut;                                       // the outer wall: piers, cornices, crown, gates
  const pierStone = stoneOut;   // (piers take metric UVs from pierBox, so the coursing wraps their corners as masonry does)
  const stoneFlat = new THREE.MeshStandardMaterial({ color: WARM ? "#efe3cf" : "#f2edf0", roughness: WARM ? 0.6 : 0.3, metalness: WARM ? 0 : 0.06, emissive: "#6a5f78", emissiveIntensity: 0.14 });
  /* the new layer */
  const metal = new THREE.MeshStandardMaterial({ color: "#e4e8ef", roughness: 0.34, metalness: 0.55, emissive: "#5d6478", emissiveIntensity: 0.12 });
  const glass = new THREE.MeshStandardMaterial({ color: "#d7f1ff", roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false });
  const lamp = (c, k = 2.2) => new THREE.MeshStandardMaterial({ color: "#111", emissive: c, emissiveIntensity: k, roughness: 0.4 });
  const inlay = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.45, roughness: 0.25, metalness: 0.2 });

  /* floors: terrazzo (the concourse: pale with chips in the city's colours, slabs 4 m), flags (the ring corridor: plainer stone in large slabs, worn a
     little in the warm reading), and raked sand (the arena: rings raked round the centre, true circles) */
  const terrazzo = new THREE.MeshStandardMaterial({ roughness: 0.18, metalness: 0.04, vertexColors: true, map: tex(512, 512, (g, w, h) => { const rnd = R(11);
    g.fillStyle = "#f3eee8"; g.fillRect(0, 0, w, h); const chips = ["#d9cfc6", "#c9bfd8", "#efc6d2", "#ead6a6", "#b9b2bc", "#bfe3ee"];
    for (let i = 0; i < 2600; i++) { g.fillStyle = chips[Math.floor(rnd() * chips.length)]; const x = rnd() * w, y = rnd() * h, s = 1.5 + rnd() * 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + s, y + s * 0.3); g.lineTo(x + s * 0.6, y + s); g.closePath(); g.fill(); }
    g.fillStyle = "#d6ccc2"; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); }) });                                                      // its slab joint, one per 4 m tile
  terrazzo.map.repeat.set(STONE_M.w / 4, STONE_M.h / 4);                                                                               // (the floors' UVs are the stone's: 11 m by 5.5 m to a unit)
  const flags = new THREE.MeshStandardMaterial({ roughness: WARM ? 0.7 : 0.4, vertexColors: true, map: tex(512, 512, (g, w, h) => { const rnd = R(23), base = WARM ? "#dccdb6" : "#e6e0e4";
    for (let r = 0; r < 4; r++) for (let k = -1; k < 3; k++) { g.fillStyle = shade(base, 0.96 + rnd() * (WARM ? 0.08 : 0.04)); g.fillRect(k * 256 + (r % 2 ? 128 : 0), r * 128, 256, 128); }
    if (WARM) for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(90,70,50,${0.04 + rnd() * 0.05})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2); }
    g.fillStyle = WARM ? "#a8977e" : "#c2b9c6"; for (let r = 0; r <= 4; r++) g.fillRect(0, r * 128 - 1, w, 3); for (let r = 0; r < 4; r++) for (let k = 0; k <= 2; k++) g.fillRect(k * 256 + (r % 2 ? 128 : 0) - 1, r * 128, 3, 128); }) });
  const sand = new THREE.MeshStandardMaterial({ roughness: 0.9, map: tex(256, 512, (g, w, h) => { const rnd = R(5);
    for (let y = 0; y < h; y++) { const k = 0.5 + 0.5 * Math.cos((y / h) * Math.PI * 2 * 12); g.fillStyle = shade("#efd9b2", 0.9 + 0.1 * k); g.fillRect(0, y, w, 1); }   // 12 rake furrows to a tile
    for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "150,115,70" : "255,248,230"},${0.08 + rnd() * 0.1})`; g.fillRect(rnd() * w, rnd() * h, 1, 1); } }) });

  /* the stone's UVs in metres, along the ring and up: ExtrudeGeometry's own run along x or z, which shears the coursing on the curve. A whole number of
     blocks round each ring, so its one seam closes on a joint */
  function mapStone(mesh, { a, b, y = 0, polar = false }) {
    const g = mesh.geometry, P = g.attributes.position, Nn = g.attributes.normal, uv = g.attributes.uv, n = Math.max(1, Math.round((Math.PI * 2 * Math.sqrt((a * a + b * b) / 2)) / STONE_M.w));
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), yy = P.getY(i) + y, z = P.getZ(i);
      if (Math.abs(Nn.getY(i)) < 0.5) { let t = Math.atan2(z / b, x / a); if (t < 0) t += Math.PI * 2; uv.setXY(i, (t / (Math.PI * 2)) * n, yy / STONE_M.h); }
      else if (polar) { let t = Math.atan2(z / b, x / a); if (t < 0) t += Math.PI * 2; uv.setXY(i, (t / (Math.PI * 2)) * n, Math.hypot(x, z) / STONE_M.h); }   // (a floor round a ring: its slabs follow the ring)
      else uv.setXY(i, x / STONE_M.w, z / STONE_M.h); }
    uv.needsUpdate = true; return mesh; }
  /* shade baked into a mesh's vertex colours: fn(x, y, z, normal) -> brightness (1 as lit, lower in shade) */
  function shadeRing(mesh, fn, y = 0) { const g = mesh.geometry, P = g.attributes.position, Nn = g.attributes.normal, c = new Float32Array(P.count * 3), v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { v.set(Nn.getX(i), Nn.getY(i), Nn.getZ(i)); const k = fn(P.getX(i), P.getY(i) + y, P.getZ(i), v); c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k; }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3)); return mesh; }
  /* a pool of light on a floor or a wall: a soft disc, added to what is under it */
  const poolTex = tex(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const pool = (r, color = "#ffd9a8", k = 0.55) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex, color, transparent: true, opacity: k, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); m.renderOrder = 2; return m; };
  /* soft dark under a thing standing on a floor (a bench, a counter) */
  const blobTex = tex(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, "rgba(20,10,30,.75)"); gr.addColorStop(1, "rgba(20,10,30,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const blob = (w, d, k = 0.6) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: k, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); m.renderOrder = 1; return m; };
  /* a box whose UVs run in metres round its sides (one coursing wrapping its corners, as masonry does) and across its top; built at unit size for
     instancing with the size it will be scaled to (sx, sy, sz), or at its own size (unit: false) */
  function pierBox(sx, sy, sz, { unit = true } = {}) { const g = new THREE.BoxGeometry(unit ? 1 : sx, unit ? 1 : sy, unit ? 1 : sz), P = g.attributes.position, Nn = g.attributes.normal, uv = g.attributes.uv;
    const k = unit ? [sx, sy, sz] : [1, 1, 1];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i) * k[0], y = P.getY(i) * k[1], z = P.getZ(i) * k[2], nx = Nn.getX(i), ny = Nn.getY(i), nz = Nn.getZ(i), W = sx / 2, D = sz / 2;
      let u; if (Math.abs(ny) > 0.5) { uv.setXY(i, x / STONE_M.w, z / STONE_M.h); continue; }
      if (nz > 0.5) u = x + W; else if (nx > 0.5) u = sx + (D - z); else if (nz < -0.5) u = sx + sz + (W - x); else u = 2 * sx + sz + (z + D);   // round the box: front, right, back, left
      uv.setXY(i, u / (STONE_M.w / 2), (y + sy / 2) / STONE_M.h); }   // (blocks half as long on a pier: square-ish, a cat high, so a pier close up reads as regular masonry, not slabs)
    uv.needsUpdate = true; return g; }
  /* a subdivided panel (x across, y up) with its brightness baked per vertex by shadeFn(u, v) on 0..1 */
  function panel(w, h, nu, nv, shadeFn) { const g = new THREE.PlaneGeometry(w, h, nu, nv), P = g.attributes.position, c = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { const k = shadeFn(P.getX(i) / w + 0.5, P.getY(i) / h + 0.5); c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k; } g.setAttribute("color", new THREE.BufferAttribute(c, 3)); return g; }
  flags.map.repeat.set(2, 1);

  /* (2026-11-24, the ground floor) parts for building in plan: a surface over a grid, a panel with openings, a spandrel, a ring cut into segments */
  /* a surface from a grid: at(u, v) -> [x, y, z] on 0..1, its brightness baked per vertex by shadeFn(u, v), its UVs in metres from uvFn(x, y, z, u, v)
     (default: across x and z, for a floor or a ceiling). Its face points along d(at)/du x d(at)/dv; flip turns it round */
  function grid(at, nu, nv, shadeFn = () => 1, { uvFn = (x, y, z) => [x / STONE_M.w, z / STONE_M.h], flip = false, skip = null } = {}) {
    const pos = [], uv = [], col = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv, [x, y, z] = at(u, v), k = shadeFn(u, v); pos.push(x, y, z); uv.push(...uvFn(x, y, z, u, v)); col.push(k, k, k); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { if (skip && skip((i + 0.5) / nu, (j + 0.5) / nv)) continue; const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
  /* a wall standing on a line in plan (pts: [[x, z], ...]) from y0 to y1, coursed in metres along its length; shadeFn(s, y) with s the distance along it.
     It faces to the left of the direction of travel (flip for the right) */
  function wallAlong(pts, y0, y1, nv, shadeFn = () => 1, { flip = false } = {}) { const L = [0]; for (let k = 1; k < pts.length; k++) L.push(L[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const at = (u, v) => { const s = u * L[L.length - 1]; let k = 1; while (k < L.length - 1 && L[k] < s) k++; const f = (s - L[k - 1]) / Math.max(1e-6, L[k] - L[k - 1]); return [pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f, y0 + (y1 - y0) * v, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f]; };
    const total = L[L.length - 1], g = grid(at, pts.length - 1, nv, (u, v) => shadeFn(u * total, y0 + (y1 - y0) * v), { uvFn: (x, y, z, u) => [u * total / (STONE_M.w / 2), y / STONE_M.h], flip: !flip });
    // (the grid's u steps along the points: re-space them by length so the coursing does not stretch)
    const P = g.attributes.position, U = g.attributes.uv, C = g.attributes.color; for (let j = 0; j <= nv; j++) for (let i = 0; i < pts.length; i++) { const n = j * pts.length + i, y = y0 + (y1 - y0) * j / nv;
      P.setXYZ(n, pts[i][0], y, pts[i][1]); U.setXY(n, L[i] / (STONE_M.w / 2), y / STONE_M.h); const k = shadeFn(L[i], y); C.setXYZ(n, k, k, k); }
    g.computeVertexNormals(); return g; }
  /* a flat panel (x across, y up, centred like panel) with rectangular openings holes: [[x0, x1, y0, y1], ...]; the grid breaks on the openings'
     edges, so they are cut clean */
  function holedPanel(w, h, nu, nv, holes, shadeFn = () => 1) { const xs = new Set(), ys = new Set(); for (let i = 0; i <= nu; i++) xs.add(+(-w / 2 + w * i / nu).toFixed(4)); for (let j = 0; j <= nv; j++) ys.add(+(-h / 2 + h * j / nv).toFixed(4));
    for (const [x0, x1, y0, y1] of holes) { xs.add(+x0.toFixed(4)); xs.add(+x1.toFixed(4)); ys.add(+y0.toFixed(4)); ys.add(+y1.toFixed(4)); }
    const X = [...xs].filter((x) => x >= -w / 2 - 1e-4 && x <= w / 2 + 1e-4).sort((a, b) => a - b), Y = [...ys].filter((y) => y >= -h / 2 - 1e-4 && y <= h / 2 + 1e-4).sort((a, b) => a - b);
    const pos = [], uv = [], col = [], idx = [];
    for (const y of Y) for (const x of X) { pos.push(x, y, 0); uv.push(x / STONE_M.w, (y + h / 2) / STONE_M.h); const k = shadeFn(x / w + 0.5, y / h + 0.5); col.push(k, k, k); }
    const n = X.length; for (let j = 0; j < Y.length - 1; j++) for (let i = 0; i < n - 1; i++) { const cx = (X[i] + X[i + 1]) / 2, cy = (Y[j] + Y[j + 1]) / 2;
      if (holes.some(([x0, x1, y0, y1]) => cx > x0 && cx < x1 && cy > y0 && cy < y1)) continue; const a = j * n + i; idx.push(a, a + 1, a + n, a + 1, a + n + 1, a + n); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
  /* the wall over a barrel vault's open end (w wide, from its springing line at y 0 up to h), with the vault's half circle (radius r) cut out of it;
     one brightness k baked in */
  function spandrel(w, h, r, k = 0.4) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-r, 0); s.absarc(0, 0, r, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
    const g = new THREE.ShapeGeometry(s, 24), P = g.attributes.position, uv = g.attributes.uv, c = new Float32Array(P.count * 3).fill(k);
    for (let i = 0; i < P.count; i++) uv.setXY(i, P.getX(i) / STONE_M.w, P.getY(i) / STONE_M.h); g.setAttribute("color", new THREE.BufferAttribute(c, 3)); return g; }
  /* a ring between two boundaries in plan, as one shape from t0 to t1: pt(a, t) -> [x, z] places a ring's point, aIn and aOut are numbers or
     functions of t (a notch in a wall is aOut dipping in). In the shape's own plane (x, -z), ready for an ExtrudeGeometry turned up by rotateX(-pi/2) */
  function sector(pt, t0, t1, aIn, aOut, n = 32) { const f = (v) => (typeof v === "function" ? v : () => v), fi = f(aIn), fo = f(aOut), s = new THREE.Shape();
    for (let k = 0; k <= n; k++) { const t = t0 + (t1 - t0) * k / n, [x, z] = pt(fo(t), t); k ? s.lineTo(x, -z) : s.moveTo(x, -z); }
    for (let k = n; k >= 0; k--) { const t = t0 + (t1 - t0) * k / n, [x, z] = pt(fi(t), t); s.lineTo(x, -z); } s.closePath(); return s; }
  /* a whole ring cut by gaps ([[t0, t1], ...] with t1 > t0, any order, any may cross 0): its segments as shapes, about one point per step of t */
  function ringCut(pt, aIn, aOut, gaps, step = Math.PI * 2 / 192) { const TAU = Math.PI * 2, G = gaps.map(([a, b]) => { const s = ((a % TAU) + TAU) % TAU; return [s, s + (b - a)]; }).sort((p, q) => p[0] - q[0]), out = [];
    for (let k = 0; k < G.length; k++) { const t0 = G[k][1], t1 = k === G.length - 1 ? G[0][0] + TAU : G[k + 1][0]; if (t1 > t0 + 1e-4) out.push(sector(pt, t0, t1, aIn, aOut, Math.max(2, Math.ceil((t1 - t0) / step)))); }
    return out; }
  return { reading, STONE_M, stone, stoneShaded, stoneOut, pierStone, pierBox, stoneFlat, metal, glass, terrazzo, flags, sand, inlay, lamp, mapStone, shadeRing, pool, blob, panel, tex,
    grid, wallAlong, holedPanel, spandrel, sector, ringCut };
}
