/* Groomed fur for the live room (Yoeshi, 2026-11-15, on the Blender coat: "Omg HUGE improvement on the long hair ... We may not
   be able to fix that in the generator but I want any cats looking like that version in the evolved builds").
   The minted coat (src/coat.js) grows each fur shell straight out along the skin's normal and draws every strand as a cone
   standing on its root: from the side the coat reads as quills. Groomed, each shell also slides along the way the coat runs
   on that part (down the body, back from the face, along a leg toward the paw, along the tail toward its tip, up an ear),
   further the higher it is, so a strand leaves the skin at a low angle and lies down; the strands are finer, softer at the
   tip, and gathered a little into tufts. The cat's genes, colours and markings are untouched: only how the fur stands.
   Shared by every evolved build (the Lounge, the shows, the site): the material's own shader is rewritten as it compiles,
   src stays as minted. It takes a cat (an Avatar, its parts each a mesh with fur shells) or anything holding cats (a band,
   a whole scene): a batched coat (src/bake.js batchCoat: a cat in one skinned mesh, as the Sphere's band) is combed too,
   each vertex given the way its part runs.
     groom(cat or root, { comb, lift, clump })   once, after the cats are built (and batched) and before they are drawn;
     a second call on the same tree does nothing to what it already groomed */
import * as THREE from "three";
import { whiskers } from "./whiskers.js";

const PART = { torso: 0, head: 1, ear: 2, upper: 3, lower: 4, paw: 5, tail: 6, muzzle: 7, lid: 8 };
/* the way the coat runs, in the cat's own space (y up, z forward), for the parts that are not a limb */
const CATWAY = { [PART.torso]: [0, -1, -0.25], [PART.head]: [0, -0.45, -1], [PART.muzzle]: [0, -0.25, -1] };

const VERT_OLD = "transformed += objectNormal * fl * vShell; transformed.y -= uDroop * fl * vShell * vShell;";
const VERT_NEW = `{ vec3 nW = normalize(objectNormal), way = uWayCat > 0.5 ? normalize(transpose(mat3(uRest)) * uWay) : normalize(uWay);
    vec3 tg = way - nW * dot(way, nW); tg = length(tg) > 0.15 ? normalize(tg) : normalize(cross(nW, vec3(0.3, 1.0, 0.1)));
    /* each strand its own way a little (from its root's place), and a slow wobble so the coat is not combed flat like a toy */
    float j = sin(dot(position, vec3(12.9, 78.2, 37.7)) * 3.0); tg = normalize(tg + cross(nW, tg) * j * 0.22);
    float h = vShell; vec3 sd = cross(nW, tg); float wv = sin(h * 2.6 + dot(position, vec3(7.1, 5.3, 6.7)) * 1.3) * (0.05 + 0.07 * h);
    transformed += nW * fl * h * uLift + tg * fl * uComb * pow(h, 1.35) + sd * fl * wv * h; transformed.y -= uDroop * fl * h * h; }`;
const EMIS_OLD = "totalEmissiveRadiance += coatEmis + uRim * fres * uRimK;", EMIS_NEW = `totalEmissiveRadiance += coatEmis + uRim * fres * uRimK;
      { float ge = pow(max(0.0, 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)))), 2.2);   /* (max: a strand facing the camera dead on rounds |dot| a hair past 1, and pow of a negative is NaN, which the bloom would spread over the whole frame) */   /* light through the fur at the outline, in the room's own colour, taking the coat's */
        totalEmissiveRadiance += uGlowCol * uGlowK * ge * mix(0.35, 1.0, vShell) * (0.35 + 0.65 * coatCol);
        totalEmissiveRadiance += uWrapK * coatCol * uGlowCol * 0.26; }   /* and a little light wrapping round the coat, so its shadows are soft */`;
/* the light the room shines through the fur: one colour for every groomed coat, which a room may set (groomLight) */
/* calm by default (a stage's lights and bloom on a white coat blew out at a stronger one: the launch chat's check, 2026-11-16); a page sets its own */
export const GLOW = { col: { value: new THREE.Color("#c8b4a8") }, k: { value: 0.15 }, wrap: { value: 0.3 } };
export function groomLight(color, k = GLOW.k.value, wrap = GLOW.wrap.value) { GLOW.col.value.set(color); GLOW.k.value = k; GLOW.wrap.value = wrap; }
const FRAG_OLD = `{ vec3 q = vBase * 70.0; vec3 cell = floor(q), o = h33(cell) * 0.6 + 0.2; float d = length((fract(q) - o).xz + (fract(q) - o).y * 0.3);
    float len = 0.55 + 0.45 * h31(cell + 5.0); if (vShell > len || d > 0.55 * (1.0 - vShell / len) + 0.05) discard; }`;
/* finer strands (the cells a third smaller), gathered toward tuft centres as they rise, ending soft and round rather than in a point */
const FRAG_NEW = `{ vec3 tq = vBase * 26.0; vec3 tc = floor(tq) + h33(floor(tq)) * 0.8 + 0.1; vec3 q = vBase * 105.0;
    q = mix(q, tc / 26.0 * 105.0, vShell * vShell * uClump * 0.18);
    vec3 cell = floor(q), o = h33(cell) * 0.6 + 0.2; float d = length((fract(q) - o).xz + (fract(q) - o).y * 0.3);
    float len = 0.5 + 0.5 * h31(cell + 5.0), k = vShell / len;
    /* at the silhouette the outer layers are seen edge on: there the strands thin, so the edge reads soft rather than spiked */
    /* (a faceted coat, Crystal's flatShading, has no vNormal: its face's normal from the derivatives, as three.js takes it) */
#ifdef FLAT_SHADED
    vec3 gNrm = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
#else
    vec3 gNrm = normalize(vNormal);
#endif
    float gz = 1.0 - abs(dot(gNrm, normalize(vViewPosition))), thin = mix(1.0, 0.3, smoothstep(0.45, 1.0, gz) * smoothstep(0.2, 0.9, vShell));
    float rr = (0.5 * sqrt(max(0.0, 1.0 - k * k)) * (1.0 - 0.35 * k) + 0.035) * thin;
    /* soft tips (with the room's anti-aliasing, uSoft): a strand's edge and its last part fade rather than stop, as a real hair's tip does */
    float al = uSoft > 0.5 ? (1.0 - smoothstep(rr * 0.55, rr * 1.15, d)) * (1.0 - smoothstep(0.7, 1.0, k)) : step(d, rr) * step(k, 1.0);
    if (al < (uSoft > 0.5 ? 0.04 : 0.5)) discard; if (uSoft > 0.5) diffuseColor.a *= al;
    diffuseColor.rgb *= (0.95 + 0.1 * h31(cell + 11.0)) * mix(0.8, 1.06, vShell); }   /* every strand a shade of its own, gently; deeper toward the roots, for the coat's depth */`;

const VERT_OLD_B = "transformed += aOff * fl * vShell; transformed.y -= uDroop * fl * vShell * vShell;";
const VERT_NEW_B = `{ vec3 nW = normalize(aOff), way = normalize(aWay); vec3 tg = way - nW * dot(way, nW); tg = length(tg) > 0.15 ? normalize(tg) : normalize(cross(nW, vec3(0.3, 1.0, 0.1)));
    float j = sin(dot(aLoc, vec3(12.9, 78.2, 37.7)) * 3.0); tg = normalize(tg + cross(nW, tg) * j * 0.22);
    float h = vShell, ck = (aPart > 3.5 && aPart < 6.5) ? 0.3 : (aPart > 2.5 && aPart < 3.5 ? 0.6 : 1.0); vec3 sd = cross(nW, tg); float wv = sin(h * 2.6 + dot(aLoc, vec3(7.1, 5.3, 6.7)) * 1.3) * (0.05 + 0.07 * h);
    transformed += nW * fl * h * uLift + tg * fl * uComb * ck * pow(h, 1.35) + sd * fl * wv * h; transformed.y -= uDroop * fl * h * h; }`;
const done = new WeakSet();
/* the way each part runs, in its own mesh's space: the cat's way turned into it, or (a limb, the tail, an ear, a paw) out from its joint */
function wayOf(o, u) { const part = u.uPart ? u.uPart.value : 0;
  if (CATWAY[part]) { const R = new THREE.Matrix3().setFromMatrix4(u.uRest.value).transpose(); return new THREE.Vector3(...CATWAY[part]).applyMatrix3(R).normalize(); }
  o.geometry.computeBoundingBox(); const c = o.geometry.boundingBox.getCenter(new THREE.Vector3()).add(o.position); return c.lengthSq() > 1e-6 ? c.normalize() : new THREE.Vector3(0, 1, 0); }
/* a batched coat: every vertex gets the way of the part it came from (body.userData.spans: [part mesh, first vertex, count]),
   turned into the batched mesh's space as it was when it was bound */
function batchWays(body) { const g = body.geometry, n = g.attributes.position.count, W = new Float32Array(n * 3), inv = new THREE.Matrix4().copy(body.matrixWorld).invert(), M = new THREE.Matrix4(), R = new THREE.Matrix3();
  for (const [o, vo, cnt] of body.userData.spans || []) { o.updateMatrixWorld(true); M.multiplyMatrices(inv, o.matrixWorld); R.setFromMatrix4(M); const w = wayOf(o, o.material.userData.u).applyMatrix3(R).normalize();
    for (let i = 0; i < cnt; i++) W.set([w.x, w.y, w.z], (vo + i) * 3); }
  return new THREE.BufferAttribute(W, 3); }
function patchBatched(mat, opts) { const u = mat.userData.u; if (done.has(mat)) return 0; done.add(mat);
  Object.assign(u, { uComb: { value: opts.comb }, uLift: { value: opts.lift }, uClump: { value: opts.clump }, uSoft: { value: opts.soft ? 1 : 0 }, uGlowCol: GLOW.col, uGlowK: GLOW.k, uWrapK: GLOW.wrap }); if (opts.soft) mat.alphaToCoverage = true;
  const base = mat.onBeforeCompile, key = mat.customProgramCacheKey;
  mat.onBeforeCompile = (s, r) => { base.call(mat, s, r); Object.assign(s.uniforms, u);
    if (!s.vertexShader.includes(VERT_OLD_B) || !s.fragmentShader.includes(FRAG_OLD)) { console.warn("groom: the batched coat shader changed; left as it was"); return; }
    s.vertexShader = s.vertexShader.replace("attribute vec3 aRest, aLoc, aOff;", "attribute vec3 aRest, aLoc, aOff, aWay; uniform float uComb, uLift;").replace(VERT_OLD_B, VERT_NEW_B);
    s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uClump, uSoft, uGlowK, uWrapK; uniform vec3 uGlowCol;").replace(FRAG_OLD, FRAG_NEW).replace(EMIS_OLD, EMIS_NEW); };
  mat.customProgramCacheKey = () => (key ? key.call(mat) : "coat") + "|groom"; mat.needsUpdate = true; return 1; }

export function groom(target, { comb = 0.95, lift = 0.6, clump = 1, whisk = true, soft = false } = {}) {   /* soft: soft hair tips, only where the page draws with anti-aliasing (multisampling) */
  const root = target && (target.root || target); if (!root || !root.traverse || (root.userData && root.userData.groomed)) return 0; let n = 0; if (whisk) whiskers(root);   /* once per tree: a room that calls it every frame pays nothing after the first */   /* the whiskers evolve with the coat */ const seen = new Set(), opts = { comb, lift, clump, soft }, soft2 = soft;
  /* batched coats first: the fur mesh shares its attributes with its body, so the ways go on once and both see them */
  root.traverse((o) => { if (!o.isSkinnedMesh || !o.geometry.attributes.aOff || !o.userData.spans || o.geometry.attributes.aWay) return;
    const a = batchWays(o); o.geometry.setAttribute("aWay", a);
    for (const f of (o.parent ? o.parent.children : [])) if (f !== o && f.isSkinnedMesh && f.geometry.attributes.aOff === o.geometry.attributes.aOff) { f.geometry.setAttribute("aWay", a); n += patchBatched(f.material, opts); } });
  root.traverse((o) => {
    const m = o.isMesh && !o.isInstancedMesh && o.material && o.material.userData && o.material.userData.u;
    if (!m || !m.uRest || !m.uFurLen || o.geometry.attributes.aOff || seen.has(o.material) || done.has(o.material)) return;   /* (a batched coat's body: no shells, nothing to comb) */ seen.add(o.material); done.add(o.material);
    const mat = o.material, part = m.uPart ? m.uPart.value : 0;
    let way, catWay = 0;
    if (CATWAY[part]) { way = new THREE.Vector3(...CATWAY[part]); catWay = 1; }   /* turned into the part's space in the shader, by its rest matrix */
    else way = wayOf(o, m);
    const soft = part === PART.paw || part === PART.lower || part === PART.tail ? 0.3 : part === PART.upper ? 0.6 : 1;   /* (a tail's long fur slid apart into a flaky clump, his word: glitchy) */   /* a paw's round cuff and a forearm: combed gently, or their layers part into flakes */
    Object.assign(m, { uWay: { value: way }, uWayCat: { value: catWay }, uComb: { value: comb * soft }, uLift: { value: lift }, uClump: { value: part === PART.muzzle ? 0 : clump }, uSoft: { value: soft2 ? 1 : 0 }, uGlowCol: GLOW.col, uGlowK: GLOW.k, uWrapK: GLOW.wrap }); if (soft2) mat.alphaToCoverage = true;   /* the whisker pads: no tufts (tufted, their short fur read as spikes) */
    const base = mat.onBeforeCompile, key = mat.customProgramCacheKey;
    mat.onBeforeCompile = (s, r) => { base.call(mat, s, r); Object.assign(s.uniforms, m);
      if (!s.vertexShader.includes(VERT_OLD) || !s.fragmentShader.includes(FRAG_OLD)) { console.warn("groom: the coat shader changed; left as minted"); return; }
      s.vertexShader = s.vertexShader.replace("uniform float uFurLen, uShells, uDroop;", "uniform float uFurLen, uShells, uDroop, uWayCat, uComb, uLift; uniform vec3 uWay;").replace(VERT_OLD, VERT_NEW);
      s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uClump, uSoft, uGlowK, uWrapK; uniform vec3 uGlowCol;").replace(FRAG_OLD, FRAG_NEW).replace(EMIS_OLD, EMIS_NEW); };
    mat.customProgramCacheKey = () => (key ? key.call(mat) : "coat") + "|groom"; mat.needsUpdate = true; n++;
  });
  root.userData.groomed = true; return n;
}
