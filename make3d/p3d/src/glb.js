/* Prancer 3D: the GLB a holder downloads. A compact glTF 2.0 binary writer made for the Prancer rig (no exporter
   library, so it can travel on chain with the generator):
     the coat   each coat part's pattern is baked into a texture through its UVs by the very shader that draws it live
                (src/coat.js), so the cat looks like itself in any 3D app; glowing patterns get an emissive texture
     the eyes   the iris, fibres, limbal ring and slit pupil are baked the same way
     the rig    every part stays on its bone, as a node hierarchy (hips, chest, neck, head, arms, legs, the tail links)
     the moves  each clip is sampled from the live rig at 30 fps and stored as keyframes per bone: idle, wave, the
                Posey Paw, paws up, dance, knead, spin (glTF animations; any viewer or game engine can play them)
   Fur shells and the cornea's live reflections are left out: they are made for the real-time renderer, and the baked
   coat already carries the colour of the fur.
     exportGLB(avatar, renderer, THREE, { clips, coat: COAT glsl, name }) -> ArrayBuffer */

const SRGB = "vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }";
const IRIS = `uniform vec3 uIris; uniform float uGlow; varying vec3 vEye;
  float eh(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  vec3 iris(){ vec2 q = vEye.xy / 0.25; float rr = length(q), an = atan(q.y, q.x);
    vec3 c = uIris * (1.35 - 0.6 * rr) + 0.12 * sin(an * 37.0 + eh(vec2(floor(an * 12.0))) * 6.0) * uIris;
    c = mix(c, uIris * 0.25, smoothstep(0.72, 0.98, rr)); float pd = length(vec2(q.x / 0.25, q.y / 0.86));
    c = mix(c, vec3(0.01, 0.01, 0.025), smoothstep(1.05, 0.95, pd)); return vEye.z < 0.0 ? uIris * 0.2 : c; }`;

/* paint a mesh's surface into a texture through its UVs, then grow the colours over the seams */
function bake(T, renderer, geo, frag, uniforms, size) {
  const rt = new T.WebGLRenderTarget(size, size), cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 2), scene = new T.Scene();
  const m = new T.ShaderMaterial({ uniforms, side: T.DoubleSide, depthTest: false,
    vertexShader: `uniform mat4 uRest; varying vec3 vCat, vLoc, vBase, vEye; varying float vShell;
      void main(){ vBase = position; vLoc = position; vEye = position; vCat = (uRest * vec4(position, 1.0)).xyz; vShell = 0.0; gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0); }`,
    fragmentShader: frag });
  if (!uniforms.uRest) uniforms.uRest = { value: new T.Matrix4() };
  scene.add(new T.Mesh(geo, m)); const keep = renderer.getRenderTarget(), cc = renderer.getClearColor(new T.Color()), ca = renderer.getClearAlpha();
  renderer.setRenderTarget(rt); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, cam);
  const px = new Uint8Array(size * size * 4); renderer.readRenderTargetPixels(rt, 0, 0, size, size, px);
  renderer.setRenderTarget(keep); renderer.setClearColor(cc, ca); rt.dispose(); m.dispose();
  for (let pass = 0; pass < 6; pass++) { const src = px.slice();   // seam padding: empty texels take their painted neighbours' colour
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = (y * size + x) * 4; if (src[i + 3]) continue; let r = 0, g = 0, b = 0, n = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue; const j = (yy * size + xx) * 4; if (src[j + 3]) { r += src[j]; g += src[j + 1]; b += src[j + 2]; n++; } }
      if (n) { px[i] = r / n; px[i + 1] = g / n; px[i + 2] = b / n; px[i + 3] = 255; } } }
  const cv = document.createElement("canvas"); cv.width = cv.height = size; const x = cv.getContext("2d"), id = x.createImageData(size, size);
  for (let y = 0; y < size; y++) id.data.set(px.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);   // the render target's rows run bottom up; glTF textures top down
  for (let i = 3; i < id.data.length; i += 4) id.data[i] = 255; x.putImageData(id, 0, 0); return cv;
}
const png = (cv) => { const s = atob(cv.toDataURL("image/png").split(",")[1]), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; };

export function exportGLB(avatar, renderer, T, { clips = [], coat, name = "Prancer" } = {}) {
  const J = { asset: { version: "2.0", generator: "Prancer 3D (Yoeshi Labs)" }, scene: 0, scenes: [{ name, nodes: [] }], nodes: [], meshes: [], materials: [], textures: [], images: [], samplers: [{ magFilter: 9729, minFilter: 9987 }], accessors: [], bufferViews: [], buffers: [] };
  const chunks = []; let off = 0;
  const view = (bytes, target) => { const pad = (4 - (off % 4)) % 4; if (pad) { chunks.push(new Uint8Array(pad)); off += pad; }
    J.bufferViews.push({ buffer: 0, byteOffset: off, byteLength: bytes.byteLength, ...(target ? { target } : {}) }); chunks.push(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)); off += bytes.byteLength; return J.bufferViews.length - 1; };
  const acc = (arr, type, ct, target, mm) => { const n = { VEC2: 2, VEC3: 3, VEC4: 4, SCALAR: 1 }[type], a = { bufferView: view(arr, target), componentType: ct, count: arr.length / n, type };
    if (mm) { const min = Array(n).fill(Infinity), max = Array(n).fill(-Infinity); for (let i = 0; i < arr.length; i++) { const k = i % n; min[k] = Math.min(min[k], arr[i]); max[k] = Math.max(max[k], arr[i]); } a.min = min; a.max = max; }
    J.accessors.push(a); return J.accessors.length - 1; };
  const image = (cv) => { J.images.push({ bufferView: view(png(cv)), mimeType: "image/png" }); J.textures.push({ sampler: 0, source: J.images.length - 1 }); return J.textures.length - 1; };
  const lin = (c) => [c.r, c.g, c.b];   // three's colours are already linear, as glTF factors are
  const matCache = new Map(), geoCache = new Map(), nodeOf = new Map();

  function material(m, mesh) {
    if (matCache.has(m)) return matCache.get(m);
    const P = { metallicFactor: m.metalness ?? 0, roughnessFactor: m.roughness ?? 1 }, M = { name: m.name || m.type, pbrMetallicRoughness: P };
    if (m.userData && m.userData.u && coat) {   // a coat part: bake its colour and its glow
      const u = m.userData.u, size = mesh.geometry.attributes.position.count > 3000 ? 512 : 256, glsl = `${coat}\n${SRGB}\nvoid main(){ vec3 e; vec3 c = coat(e); gl_FragColor = vec4(srgb(`;
      P.baseColorTexture = { index: image(bake(T, renderer, mesh.geometry, glsl + "c * 0.9), 1.0); }", u, size)) };
      const em = u.uNeon.value > 0.5 || u.uPat.value >= 21; if (em) { M.emissiveTexture = { index: image(bake(T, renderer, mesh.geometry, glsl + "min(e, vec3(1.0))), 1.0); }", u, size)) }; M.emissiveFactor = [1, 1, 1]; }
    } else if (m.userData && m.userData.iris) { const u = m.userData.iris;
      P.baseColorTexture = { index: image(bake(T, renderer, mesh.geometry, `${IRIS}\n${SRGB}\nvoid main(){ gl_FragColor = vec4(srgb(iris()), 1.0); }`, { uIris: u.uIris, uGlow: u.uGlow }, 256)) };
      P.roughnessFactor = 0.25; if (u.uGlow.value > 0.5) { M.emissiveTexture = P.baseColorTexture; M.emissiveFactor = [0.8, 0.8, 0.8]; } }
    else { P.baseColorFactor = [...lin(m.color || new T.Color(1, 1, 1)), m.transparent ? m.opacity : 1];
      if (m.map && m.map.image) P.baseColorTexture = { index: image(m.map.image) };
      if (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0) M.emissiveFactor = lin(m.emissive).map((v) => Math.min(1, v * (m.emissiveIntensity ?? 1)));
      if (m.isMeshBasicMaterial) { M.emissiveFactor = lin(m.color).map((v) => Math.min(1, v)); P.baseColorFactor = [0, 0, 0, 1]; }
      if (m.transparent && m.opacity < 1) M.alphaMode = "BLEND"; }
    if (m.side === T.DoubleSide) M.doubleSided = true;
    J.materials.push(M); matCache.set(m, J.materials.length - 1); return J.materials.length - 1;
  }
  function mesh(o) {
    const g = o.geometry, mats = Array.isArray(o.material) ? o.material : [o.material], key = g.uuid + mats.map((m) => m.uuid).join();
    if (geoCache.has(key)) return geoCache.get(key);
    const a = g.attributes, attrs = { POSITION: acc(new Float32Array(a.position.array), "VEC3", 5126, 34962, true) };
    if (a.normal) attrs.NORMAL = acc(new Float32Array(a.normal.array), "VEC3", 5126, 34962); if (a.uv) attrs.TEXCOORD_0 = acc(new Float32Array(a.uv.array), "VEC2", 5126, 34962);
    const idx = g.index ? g.index.array : Uint32Array.from({ length: a.position.count }, (_, i) => i), groups = g.groups.length ? g.groups : [{ start: 0, count: idx.length, materialIndex: 0 }];
    const prims = groups.map((gr) => { const part = idx.slice(gr.start, gr.start + gr.count), big = a.position.count > 65535;
      return { attributes: attrs, indices: acc(big ? new Uint32Array(part) : new Uint16Array(part), "SCALAR", big ? 5125 : 5123, 34963), material: material(mats[gr.materialIndex] || mats[0], o) }; });
    J.meshes.push({ name: o.name || "part", primitives: prims }); geoCache.set(key, J.meshes.length - 1); return J.meshes.length - 1;
  }
  /* the node tree, minus what only the live renderer needs (fur shells, the cornea's additive gloss, hidden parts) */
  const skip = (o) => !o.visible || o.isInstancedMesh || (o.isMesh && [].concat(o.material).some((m) => m.blending === T.AdditiveBlending));
  const ROOT = avatar.root, savedRoot = [ROOT.position.clone(), ROOT.quaternion.clone()]; ROOT.position.set(0, 0, 0); ROOT.quaternion.identity();
  function node(o) {
    const n = { name: o.name || (o.isMesh ? "part" : "joint") }, i = J.nodes.length; J.nodes.push(n); nodeOf.set(o, i);
    const p = o.position, q = o.quaternion, s = o.scale;
    if (p.lengthSq()) n.translation = [p.x, p.y, p.z]; if (q.w < 0.999999) n.rotation = [q.x, q.y, q.z, q.w]; if (s.x !== 1 || s.y !== 1 || s.z !== 1) n.scale = [s.x, s.y, s.z];
    if (o.isMesh) n.mesh = mesh(o);
    const kids = o.children.filter((c) => !skip(c)).map(node); if (kids.length) n.children = kids; return i;
  }
  /* the moves: sample each clip from the live rig, keep the channels that move */
  const animated = [];
  for (const clip of clips) {
    const fps = 30, N = Math.max(2, Math.round(clip.duration * fps) + 1), tracks = new Map(), times = new Float32Array(N);
    for (let k = 0; k < N; k++) { times[k] = k / fps; clip.pose(k / fps); ROOT.position.set(0, 0, 0);
      ROOT.traverse((o) => { if (skip(o) && o !== ROOT) return; let tr = tracks.get(o); if (!tr) tracks.set(o, (tr = { t: new Float32Array(N * 3), r: new Float32Array(N * 4), s: new Float32Array(N * 3) }));
        tr.t.set([o.position.x, o.position.y, o.position.z], k * 3); tr.r.set([o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w], k * 4); tr.s.set([o.scale.x, o.scale.y, o.scale.z], k * 3); }); }
    animated.push({ name: clip.name, times, tracks });
  }
  avatar.update(clips.length ? clips[0].rest() : undefined);   // back to rest before writing the tree
  ROOT.updateMatrixWorld(true); J.scenes[0].nodes = [node(ROOT)]; J.nodes[0].name = name;
  const varies = (a, n) => { for (let i = n; i < a.length; i++) if (Math.abs(a[i] - a[i % n]) > 1e-4) return true; return false; };
  for (const A of animated) { const ch = [], sm = [], tAcc = acc(A.times, "SCALAR", 5126, undefined, true);
    for (const [o, tr] of A.tracks) { const ni = nodeOf.get(o); if (ni === undefined) continue;
      for (const [path, arr, n, ty] of [["translation", tr.t, 3, "VEC3"], ["rotation", tr.r, 4, "VEC4"], ["scale", tr.s, 3, "VEC3"]]) if (varies(arr, n)) { sm.push({ input: tAcc, output: acc(arr, ty, 5126), interpolation: "LINEAR" }); ch.push({ sampler: sm.length - 1, target: { node: ni, path } }); } }
    if (ch.length) (J.animations ||= []).push({ name: A.name, samplers: sm, channels: ch }); }
  ROOT.position.copy(savedRoot[0]); ROOT.quaternion.copy(savedRoot[1]);
  for (const k of ["textures", "images", "materials"]) if (!J[k].length) delete J[k];
  /* the binary: a JSON chunk, a BIN chunk, each padded to four bytes */
  const bin = new Uint8Array((off + 3) & ~3); let o2 = 0; for (const c of chunks) { bin.set(c, o2); o2 += c.byteLength; }
  J.buffers.push({ byteLength: bin.byteLength });
  let js = new TextEncoder().encode(JSON.stringify(J)); const jp = (4 - (js.length % 4)) % 4; if (jp) { const t = new Uint8Array(js.length + jp); t.set(js); t.fill(32, js.length); js = t; }
  const out = new ArrayBuffer(12 + 8 + js.length + 8 + bin.byteLength), dv = new DataView(out), u8 = new Uint8Array(out);
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, out.byteLength, true);
  dv.setUint32(12, js.length, true); dv.setUint32(16, 0x4e4f534a, true); u8.set(js, 20);
  dv.setUint32(20 + js.length, bin.byteLength, true); dv.setUint32(24 + js.length, 0x004e4942, true); u8.set(bin, 28 + js.length);
  return out;
}

/* the clips a Prancer ships with, sampled from its own rig (avatar.update) */
export function prancerClips(avatar) {
  const base = (t, extra = {}) => ({ t, dt: 1 / 30, speed: 0, phase: 0, air: 0, vy: 0, land: 0, emote: null, emoteT: 0, emoteLen: 99, look: { x: 0, y: 0 }, ...extra });
  const em = (name, len) => ({ name, duration: len, rest: () => base(0), pose: (t) => { avatar.root.userData.spin = 0; avatar.update(base(t + 0.5, { emote: name, emoteT: t, emoteLen: len })); avatar.root.rotation.y = avatar.root.userData.spin || 0; } });
  const walk = (name, speed, len) => ({ name, duration: len, rest: () => base(0), pose: (t) => avatar.update(base(t, { speed, phase: t * (speed > 1 ? 13 : 6.4) })) });
  return [{ name: "Idle", duration: 4, rest: () => base(0), pose: (t) => avatar.update(base(t)) }, walk("Walk", 1, 2 * Math.PI / 6.4 * 2), walk("Run", 2, 2 * Math.PI / 13 * 2),
    em("wave", 2.6), em("posey", 5), em("pawsup", 3), em("dance", 6), em("knead", 5), em("spin", 1.6)].map((c) => ({ ...c, name: { wave: "Wave", posey: "Posey Paw", pawsup: "Paws Up", dance: "Dance", knead: "Knead", spin: "Spin" }[c.name] || c.name }));
}
