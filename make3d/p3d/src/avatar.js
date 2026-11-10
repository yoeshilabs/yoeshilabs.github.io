/* Prancer 3D: the avatar. A Prancer Portraits cat built in three.js from its genes (src/genes.js), with no model files:
   every part is shaped in code, coated by src/coat.js and hung on a rig of bones (hips, spine, chest, neck, head, two
   arms, two legs, a tail of many links), so it can walk, run, jump and act. The look follows the genes: build and head
   width, ears, eyes (living irises, slit pupils, glossy corneas, lids that blink), nose, whisker pads, tail, fur length,
   coat and pattern, the wardrobe's colours, and the spirits' and wild cats' extras. Temperament sets how it carries
   itself: how open its eyes are, how its ears sit, how fast its tail moves, how much it bounces.
   Units: the head is about 1 across, the cat stands about 4.6 tall, it faces +z. Its right side is -x. */
import * as THREE from "three";
import { dressDetail } from "./outfits.js";
import { seg } from "./detail.js";
import { SDF } from "./epoch.js";
import { coatMaterial, furry, PART } from "./coat.js";

const V = Array.from({ length: 16 }, () => new THREE.Vector3()), QQ = new THREE.Quaternion(), QW = new THREE.Quaternion(), QD = new THREE.Quaternion(), DOWN = new THREE.Vector3(0, -1, 0);
const X = Array.from({ length: 5 }, () => new THREE.Vector3());   // the colliders' own scratch, apart from the solver's
const H = Array.from({ length: 16 }, () => new THREE.Vector3()), MW = new THREE.Matrix4();   // hold()'s own scratch (reach runs inside it)
const capD = (P, A, B, r) => { const ab = X[0].copy(B).sub(A), ap = X[1].copy(P).sub(A), t = clamp(ap.dot(ab) / (ab.lengthSq() || 1), 0, 1); return ap.sub(ab.multiplyScalar(t)).length() - r; };
const TAU = Math.PI * 2, clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k, smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const SPECIAL = { "url(#gold)": "#e3b04a", "url(#cosmos)": "#1b1240", "url(#chrome)": "#c9d1db" };
const hex = (c, d) => !c ? d : SPECIAL[c] || (c.startsWith("#") ? c : d);
/* where a held thing sits against a paw, by its radius (the cat's own units): a thin thing (a card, a stick, a string)
   in the pocket under the curled toes, a wide one (a cup, a ball) back against the pads. From the palm's centre: z off
   the pad, y down the paw toward the toes, and how far the toes turn (radians) */
export const pocket = (r) => { const k = smooth((r - 0.03) / 0.07); return { z: 0.1 + r + 0.1 * k, y: 0.1 - 0.07 * k, turn: 1.0 - 0.25 * k }; };

/* the temperaments' bearing: lid (how far the lids sit down), ears (back), tail (speed), bounce, tilt, pupil */
const BEAR = { Sweet: [0.05, 0, 0.8, 0.5, 4, 0.55], Fierce: [0.28, 0.25, 1.3, 0.3, 0, 0.25], Sassy: [0.22, 0.05, 1.0, 0.5, -7, 0.35], Goofy: [0, 0, 1.4, 1, 9, 0.7],
  Chill: [0.3, 0.05, 0.6, 0.3, 3, 0.45], Mysterious: [0.35, 0.1, 0.7, 0.2, -3, 0.3], Confident: [0.12, 0, 0.9, 0.4, 0, 0.4], Mischievous: [0.18, 0, 1.2, 0.7, 8, 0.5],
  Shy: [0.2, 0.2, 0.6, 0.25, 6, 0.6], Zen: [0.55, 0, 0.4, 0.15, 0, 0.4], Sleepy: [0.62, 0.1, 0.4, 0.15, 5, 0.5], Playful: [0, 0, 1.5, 1, 6, 0.75],
  Dramatic: [0.15, 0.05, 1.1, 0.6, -9, 0.5], Curious: [0, 0, 1.0, 0.6, 12, 0.85], Regal: [0.25, 0, 0.6, 0.2, -4, 0.35], Grumpy: [0.4, 0.3, 0.8, 0.15, 0, 0.3] };

/* the Portraits' laser colours (prancer-pfp LZC): the glow, and the core */
const LASERS = { Blue: ["#1e7bff", "#3fa9ff"], Red: ["#ff1e3c", "#ff5a6e"], Green: ["#1eff6a", "#7dffad"], Gold: ["#ffb21e", "#ffd76a"] };
/* what a cat wears before its eyes and in its ears, from the Portraits genes (SPECS) or the generator's (EYEWEAR) */
export const sigsOf = (G) => [G.SPECS || G.EYEWEAR, G.EARRING].filter((x) => x && x !== "None");

/* the genes, as the coat and the body need them */
/* the legendary combos (the generator's own): each wears its own gear, [outfit, sleeves, trousers] (outfits.js builds it; the headwear and what it holds come from the roll) */
const LEGWEAR = { Astronaut: ["Astronaut", "#f2f2ee", "#f2f2ee"], "Night Guardian": ["Night Guardian", "#1b1e29", "#1b1e29"], Adventurer: ["Adventurer", "#6a4125", "#c2ab7c"], Sphinx: ["Sphinx", null, null] };
export function look(G, mobile, opts = {}) {
  const sp = G.SPK || "", fur = { Shorthair: 0.075, Longhair: 0.15, Rex: 0.055, Hairless: 0 }[G.FUR] ?? 0.075;
  const ground = hex(G.bodyFill, "#888888"), gold = G.bodyFill === "url(#gold)", chrome = G.bodyFill === "url(#chrome)";
  /* a Van or Harlequin paints its crown, tail and patches in the Portraits' vanC (the pigment: brown on a brown tabby, where
     the ground is orange-ish) and its ears in earC; every other coat is its bodyFill all over */
  const body = G.VANISH && G.vanC ? hex(G.vanC, ground) : ground;
  return {
    body, ear: G.VANISH && G.earC ? hex(G.earC, ground) : null, mark: hex(G.markC, null), patch: hex(G.patchC, null), point: hex(G.pointC, null), muz: hex(G.muzC, body), white: G.WHITEC || "#f4f6fb",
    whiteMode: G.GENES && G.WHITE && G.WHITE !== "Solid White" ? G.WHITE : "None", pattern: G.PAT || "Solid", markO: G.MARKO ?? 1, neon: !!G.NEON,
    rim: hex(G.RIM, "#ffffff"), rimK: G.NEON ? 1.1 : sp ? 0.7 : 0.16, furLen: sp === "Cyber" || sp === "Crystal" || gold ? 0 : fur, droop: G.FUR === "Longhair" ? 0.7 : 0.25,
    shells: mobile ? 7 : 16, rough: gold ? 0.3 : chrome ? 0.16 : sp === "Crystal" ? 0.1 : 0.78, metal: gold || chrome ? 1 : 0, irid: sp === "Crystal" ? 1 : 0, facets: sp === "Crystal", ghost: sp === "Ghost",
    eyes: G.EYEC || ["#f6c52e", "#f6c52e"], glowEyes: !!sp, nose: hex(G.noseC, "#ff8fb3"), earIn: hex(G.earIn, "#ff8fb3"),
    ears: G.EARS || "Pointed", tail: G.TAILK || "Long", build: G.BUILD || "Classic", cw: G.CW || 1, bw: G.BW || 1, temp: G.TEMP || "Sweet", bear: BEAR[G.TEMP] || BEAR.Sweet,
    legend: G.LEGEND || null,   /* the legendary combos (the generator's own): Astronaut, and more to come */
    outfit: LEGWEAR[G.LEGEND] ? LEGWEAR[G.LEGEND][0] : G.MYTH ? (G.MONK ? "Hooded Robe" : G.CIB ? "Suit & Tie" : G.GLAD ? "Gladiator's Armor" : G.KNIGHT ? "Knight's Armor" : "None") : G.OUTFIT || "None",   /* a Mythic wears its own gear */ sleeve: LEGWEAR[G.LEGEND] ? LEGWEAR[G.LEGEND][1] : G.SLEEVE, tee: G.TEE, jacket: G.JACKET, pants: LEGWEAR[G.LEGEND] ? LEGWEAR[G.LEGEND][2] : G.PANTS, short: !!G.SHORTSLEEVE, c1: G.C1 || "#3a7bd5",
    cheeks: G.CHEEKS === "Blush" ? 1 : G.CHEEKS === "Freckles" ? 2 : 0, laser: LASERS[G.LASERC] || null, c2: G.C2 || "#ff5fa8",
    mane: G.MANE && G.MANE !== "None" ? G.MANE : null, halo: !!G.HALO, horns: !!G.HORNS, spirit: sp, fur: G.FUR, name: G.KEY || G.NAME,
    wings: G.WINGS ? (sp === "Infernal" ? "Bat" : "Feathered") : null, hatted: !!(G.HAT && G.HAT !== "None") || !!LEGWEAR[G.LEGEND], tails: sp === "Nekomata" ? 2 : 1,   /* the Portraits' Wings (Celestial feathered, Infernal bat) and the Nekomata's forked tail */
    sig: opts.sig || null, persona: !!opts.persona,
    cov: { c: { value: Array.from({ length: 12 }, () => new THREE.Vector4()) }, h: { value: Array.from({ length: 12 }, () => new THREE.Vector3()) }, n: { value: 0 } },
    ...(!globalThis.PRANCER_GEN && opts.persona ? {   // Yoeshi's own look (prancer-band, 2026-10-31; the band show only, the generator build leaves it out): the tuxedo inverted, a black tee, dark jeans, the chain and pendant, ruby shoes
      body: "#efe8dc", white: hex(G.bodyFill, "#311c22"), muz: hex(G.bodyFill, "#311c22"), whiteMode: globalThis.PRANCER_GEN ? "Tuxedo" : "Blaze", mark: null, patch: null, pattern: "Solid", build: "Slim", bw: 0.9,
      outfit: "Band Tee", tee: "#121216", sleeve: "#121216", short: true, pants: "#1c1f28" } : {}),
  };
}

/* ------------------------------------------------------------------ shapes */
const TORSO = [[0.001, -0.14], [0.34, -0.11], [0.55, 0.04], [0.64, 0.3], [0.62, 0.6], [0.54, 0.86], [0.42, 1.05], [0.29, 1.2], [0.001, 1.3]],   // a pear: wide at the belly, narrowing to the neck
  GARMENT_ = [[0.58, 0.0], [0.66, 0.3], [0.64, 0.6], [0.57, 0.86], [0.46, 1.04], [0.34, 1.16]].map(([r, y]) => [r * 1.06 + 0.02, y]);   // the torso's own shape, a little larger
export const GARMENT = GARMENT_;
const profR = (pr, y) => { for (let i = 1; i < pr.length; i++) if (y >= pr[i - 1][1] && y <= pr[i][1]) return pr[i - 1][0] + (pr[i][0] - pr[i - 1][0]) * (y - pr[i - 1][1]) / (pr[i][1] - pr[i - 1][1]); return 0; };   // a profile's radius at a height
function torsoGeo(L) {
  const g = new THREE.LatheGeometry(TORSO.map(([r, y]) => new THREE.Vector2(r, y)), seg(56)); g.scale(L.bw * 1.0, 1, L.bw * 0.86); g.computeVertexNormals(); return g;
}
function garmentGeo(L, y0, y1) {   // open at the ends
  const pts = GARMENT.map(([r, y]) => new THREE.Vector2(r, y)).filter((v) => v.y >= y0 - 0.01 && v.y <= y1 + 0.01);
  const g = new THREE.LatheGeometry(pts, seg(56)); g.scale(L.bw, 1, L.bw * 0.86); g.computeVertexNormals(); return g;
}
function headGeo(L) {   // a sphere, widened by the head-width gene, with cheeks, a flatter face and a softer chin
  const g = new THREE.SphereGeometry(1, seg(72), seg(54)), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i);
    const cheek = smooth(1 - Math.hypot((Math.abs(v.x) - 0.75) / 0.45, (v.y + 0.25) / 0.4)) * smooth((v.z + 0.3) / 0.5);
    v.x *= 1.06 * L.cw * (1 + 0.1 * cheek); v.y *= 0.92; v.z *= 0.94; if (v.z > 0.6) v.z = 0.6 + (v.z - 0.6) * 0.75;   // the face is flatter than the back of the head
    if (v.y < -0.55) v.y = -0.55 + (v.y + 0.55) * 0.8; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
function earGeo(h, r) { const g = new THREE.ConeGeometry(r, h, seg(40), seg(6)); g.translate(0, h / 2, 0);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / h; p.setX(i, p.getX(i) * (1 - 0.15 * y * y)); p.setZ(i, p.getZ(i) * 0.42 + (y > 0.6 ? 0 : 0)); }   // a flattened shell, softly curved
  g.computeVertexNormals(); return g; }
const cap = (r, len) => new THREE.CapsuleGeometry(r, len, seg(10), seg(28));
/* a limb segment as the Portraits draw one (a round-capped stroke, narrowing toward the paw): a tapered capsule whose two
   end spheres are centred on its joints (y = 0 and y = -len), so a bend at either end is a ball joint: no kink, no gap.
   open: leave the far end open at that fraction of the length (a short sleeve's hem, hidden by its cuff) */
function taper(r0, r1, len, open = 0) {
  const a = Math.asin(clamp((r0 - r1) / len, -0.95, 0.95)), N = seg(10), pts = [], end = open ? -len * open : -len, rAt = (y) => r0 + (r1 - r0) * (-y / len);
  if (!open) for (let i = 0; i <= N; i++) { const t = -Math.PI / 2 + (a + Math.PI / 2) * (i / N); pts.push(new THREE.Vector2(Math.max(1e-4, r1 * Math.cos(t)), -len + r1 * Math.sin(t))); }   // the far ball, from its pole up to the tangent
  else pts.push(new THREE.Vector2(rAt(end) / Math.cos(a), end));
  for (let i = 0; i <= N; i++) { const t = a + (Math.PI / 2 - a) * (i / N); pts.push(new THREE.Vector2(Math.max(1e-4, r0 * Math.cos(t)), r0 * Math.sin(t))); }   // the near ball, from the tangent up to its pole
  return new THREE.LatheGeometry(pts, seg(28)); }
/* the Portraits' wings, from behind the shoulders, folded back a little, beating slowly (avatar.update). Bat: a membrane
   with a scalloped trailing edge and three ribs (the band's Captain wore it first); Feathered: seven feathers a side
   fanning from straight up to out, white and cream in turn with a gold rachis, the middle one longest, as drawn.
   addWings(av, "Bat" | "Feathered", colour?) -> the two wing groups */
export function addWings(av, kind, col) {
  const bw = av.L.bw, bat = kind === "Bat", wings = [];
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(0.18, 0.5, 0.55, 0.78); sh.lineTo(1.25, 0.62); sh.quadraticCurveTo(1.05, 0.25, 1.12, 0.02); sh.quadraticCurveTo(0.9, 0.12, 0.78, -0.12); sh.quadraticCurveTo(0.6, 0.0, 0.45, -0.16); sh.quadraticCurveTo(0.3, -0.02, 0, 0);
  const mem = bat ? new THREE.MeshStandardMaterial({ color: col || "#2a0a0a", roughness: 0.7, side: THREE.DoubleSide, emissive: new THREE.Color(col || "#2a0a0a").multiplyScalar(0.25) }) : null, rib = new THREE.MeshStandardMaterial({ color: col ? "#2a0a0c" : "#ff5a1f", roughness: 0.6, emissive: col ? "#000000" : "#ff5a1f", emissiveIntensity: 0.35 });
  const fe = [new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.85, sheen: 1, side: THREE.DoubleSide }), new THREE.MeshPhysicalMaterial({ color: "#f6efdc", roughness: 0.85, sheen: 1, side: THREE.DoubleSide })], gold = new THREE.MeshPhysicalMaterial({ color: "#e8b84a", metalness: 0.6, roughness: 0.35 });
  const leaf = new THREE.Shape(); leaf.moveTo(0, 0); leaf.quadraticCurveTo(0.09, 0.3, 0.07, 0.72); leaf.quadraticCurveTo(0.03, 0.95, 0, 1); leaf.quadraticCurveTo(-0.03, 0.95, -0.07, 0.72); leaf.quadraticCurveTo(-0.09, 0.3, 0, 0);
  for (const s of [-1, 1]) { const g = new THREE.Group(); const low = bat && !col;   /* a cat's own bat wings spring from the shoulder blades and spread out to the sides, below the head (Yoeshi, 2026-11-10: from 0.62 up they read as growing out of the head); the band's Captain keeps his */
    g.position.set(s * 0.32 * bw, low ? 0.12 : bat ? 0.62 : 0.02, -0.5 * bw - (low ? 0.1 : bat ? 0 : 0.06)); g.userData.y = s * (low ? -0.5 : -0.35); g.rotation.set(0.15, g.userData.y, s * (low ? -0.5 : 0.15)); av.b.chest.add(g); wings.push(g);
    if (bat) { const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 14), mem); m.scale.set(s * 1.6, 1.6, 1); g.add(m);
      for (const [x, y] of [[0.55, 0.78], [1.25, 0.62], [1.12, 0.02]]) { const r = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, Math.hypot(x, y) * 1.6, 3, 6), rib); r.position.set(s * x * 0.8, y * 0.8, 0.01); r.rotation.z = -Math.atan2(s * x, y); g.add(r); } }
    else for (let i = 6; i >= 0; i--) { const a = (-44 + i * 11) * Math.PI / 180, len = 2.45 - Math.abs(i - 1.5) * 0.18, dir = new THREE.Vector2(s * Math.abs(Math.cos(a)), -Math.sin(a));   /* spread out to the sides, low on the back (Yoeshi 2026-11-07: they had risen round the head like a ruff), the upper primaries longest */
      const f = new THREE.Mesh(new THREE.ShapeGeometry(leaf, 10), fe[i % 2]); f.scale.set(2.7, len, 1); f.rotation.z = Math.atan2(-dir.x, dir.y); f.position.z = 0.012 * i; g.add(f);
      const q = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, len * 0.9, 3, 6), gold); q.position.set(dir.x * len * 0.47, dir.y * len * 0.47, 0.012 * i + 0.012); q.rotation.z = f.rotation.z; g.add(q); } }
  return wings;
}
/* indexed geometries (position, normal, uv) as one */
function mergeGeo(list) { let n = 0; const P = [], Nn = [], U = [], I = [];
  for (const g of list) { const p = g.attributes.position, q = g.attributes.normal, u = g.attributes.uv; for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); Nn.push(q.getX(i), q.getY(i), q.getZ(i)); U.push(u.getX(i), u.getY(i)); }
    const ix = g.index; for (let i = 0; i < ix.count; i++) I.push(ix.getX(i) + n); n += p.count; }
  const m = new THREE.BufferGeometry(); m.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); m.setAttribute("normal", new THREE.Float32BufferAttribute(Nn, 3)); m.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2)); m.setIndex(I); return m; }

/* a paw: a soft mitt, with toe beans on the pad side (-z when it hangs) */
function pawMesh(mat, beanMat, s, foot) {
  const g = new THREE.Group();
  let m; if (foot) { m = furry(new THREE.SphereGeometry(0.2 * s, seg(36), seg(24)), mat, mat.userData.shells); m.scale.set(1.05, 0.62, 1.45); m.position.z = 0.1 * s; }
  else {   /* a hand: the Portraits' round mitt, its four toes a scalloped edge at the tip (the grooves between them show on the back) */
    const palm = new THREE.SphereGeometry(0.2 * s, seg(36), seg(24)); palm.scale(1.02, 0.74, 0.98);
    const toes = [0, 1, 2, 3].map((i) => { const t = new THREE.SphereGeometry(0.068 * s, seg(18), seg(12)), a = (i - 1.5) * 0.36; t.scale(1, 1.1, 1.08); t.translate(Math.sin(a) * 0.15 * s, -0.12 * s - Math.cos(a) * 0.02 * s, 0.035 * s); return t; });
    m = furry(mergeGeo([palm, ...toes]), mat, mat.userData.shells); }
  g.add(m);
  const pad = foot ? [0, -0.1 * s, 0.12 * s] : [0, -0.02 * s, -0.16 * s], face = foot ? new THREE.Euler(Math.PI / 2, 0, 0) : new THREE.Euler(0, Math.PI, 0);
  const beans = new THREE.Group(); beans.position.set(...pad); beans.rotation.copy(face); g.add(beans);
  if (beanMat) {   /* the pink pads: out of the paw's design (Yoeshi, 2026-11-10); the avatar passes none */
  const big = new THREE.Mesh(new THREE.SphereGeometry(0.075 * s, seg(24), seg(16)), beanMat); big.scale.set(1.2, 0.85, 0.45); big.position.set(0, -0.04 * s, 0); beans.add(big);
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.036 * s, seg(16), seg(12)), beanMat), a = (i - 1.5) * 0.42;
    b.position.set(Math.sin(a) * 0.1 * s, Math.cos(a) * 0.075 * s + 0.02 * s, 0); b.scale.set(1, 1.15, 0.5); beans.add(b); } }
  if (foot) for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, seg(16), seg(12)), mat); t.position.set((i - 1) * 0.085 * s, -0.02 * s, 0.33 * s); t.scale.set(1, 0.8, 1.1); g.add(t); }   // toes
  return g;
}

/* an eye: a living iris and slit pupil, a glossy cornea, catchlights, an ink rim, and lids that blink */
const GV = new THREE.Vector3(); const WV = [0, 1, 2, 3, 4].map(() => new THREE.Vector3());
function eyeMesh(L, col, lidMat, side) {
  const g = new THREE.Group(), r = 0.25, u = { uIris: { value: new THREE.Color(col) }, uLook: { value: new THREE.Vector2() }, uPupil: { value: 0.5 }, uGlow: { value: L.glowEyes ? 1 : 0 } };
  const iris = new THREE.MeshPhysicalMaterial({ roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.5 });   /* a wet sheen and no pinpoint highlights: the catchlight is the cornea's */
  iris.onBeforeCompile = (s) => { Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vEye;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvEye = position;");
    s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>
      uniform vec3 uIris; uniform vec2 uLook; uniform float uPupil, uGlow; varying vec3 vEye;
      float eh(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }`)
      .replace("#include <color_fragment>", `#include <color_fragment>
      vec2 q = vEye.xy / ${r.toFixed(2)} - uLook; float rr = length(q), an = atan(q.y, q.x);
      vec3 c = uIris * (1.35 - 0.6 * rr) + 0.12 * sin(an * 37.0 + eh(vec2(floor(an * 12.0))) * 6.0) * uIris;   // lighter in the middle, fibres radiating out
      c *= 0.74 + 0.42 * smoothstep(0.6, -0.7, q.y);                                                      // the lid's shade on the upper iris, light pooling in the lower
      c += uIris * 0.55 * smoothstep(0.46, 0.04, length(q - vec2(0.27, -0.4)));                           // and a glow in it across from the catchlight: light coming through the eye
      c = mix(c, uIris * 0.25, smoothstep(0.72, 0.98, rr));                                              // the darker limbal ring
      float pw = 0.15 + 0.4 * uPupil, pd = length(vec2(q.x / pw, q.y / 0.84));
      c = mix(c, vec3(0.01, 0.01, 0.025), smoothstep(1.06, 0.9, pd));                                      // the pupil: an almond at its narrowest, round when excited (a hairline slit read as cold)
      diffuseColor.rgb = c;`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
      totalEmissiveRadiance += diffuseColor.rgb * (0.12 + uGlow * 0.9);`); };
  iris.customProgramCacheKey = () => "iris"; iris.userData.iris = u;   /* the GLB baker paints the iris from these */
  const ball = new THREE.Mesh(new THREE.SphereGeometry(r, seg(48), seg(32)), iris); g.add(ball);
  /* the cornea draws nothing of its own: its catchlights are the scene's real lights, mirrored in it, so they follow the lighting, the camera and the head (Yoeshi, 2026-11-10: a drawn white spot, alone or doubled,
     read as a sticker and did not follow the dynamic lighting). A little roughness makes each light a soft round window, not a pinpoint, and the mirror is strengthened so it reads at cover size */
  const cm = new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.12, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 0.55 });
  cm.onBeforeCompile = (s) => { s.fragmentShader = s.fragmentShader.replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\nnormal = normalize(normal + vec3(0.0, 0.2, 0.0));")   /* tipped up a little, as a cornea bulges: a light from above lands on the open eye, not under the lid */
      .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\nreflectedLight.directSpecular *= 4.0;"); };
  cm.customProgramCacheKey = () => "cornea";
  const cornea = new THREE.Mesh(new THREE.SphereGeometry(r * 1.03, seg(48), seg(32)), cm); g.add(cornea);
  const glint = () => {};
  /* the lids: close over the cornea (a wider shell left a dark slot under its edge), and shaded as a surface that faces forward and a little up, so no lid has a black underside where the eye stands proud of the head.
     No ink ring round the eye: it showed as black crescents inside the lids' corners (Yoeshi, 2026-11-10: the black space on the inner and outer eyelid) */
  const soft = (ge) => { const n = ge.attributes.normal; for (let i = 0; i < n.count; i++) { GV.set(n.getX(i), n.getY(i) + 0.55, n.getZ(i) + 1.1).normalize(); n.setXYZ(i, GV.x, GV.y, GV.z); } return ge; };
  const lid = new THREE.Mesh(soft(new THREE.SphereGeometry(r * 1.045, seg(40), seg(20), 0, TAU, 0, Math.PI / 2)), lidMat); g.add(lid);
  const low = new THREE.Mesh(soft(new THREE.SphereGeometry(r * 1.04, seg(40), seg(12), 0, TAU, Math.PI * 0.72, Math.PI * 0.28)), lidMat); g.add(low);
  g.scale.set(1.18, 0.95, 0.56); g.userData = { u, lid, low, glint, side };
  return g;
}

/* a soft white disc, for a laser's flare (made once) */
let FLARE = null;
const flareTex = () => FLARE || (FLARE = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })());

/* ------------------------------------------------------------------ the cat */
export class Avatar {
  constructor(G, opts = {}) {
    const L = this.L = look(G, opts.mobile, opts); if (opts.shells) L.shells = opts.shells; this.G = G; this.mats = []; this.capeU = { t: { value: 0 }, sit: { value: 0 } }; this.cloth = opts.drape ? opts.drape(this) : null;   /* cloth that follows the body (drape.js), for whoever asks: without it every garment is as before */
    this.rand = opts.rand || Math.random;   // blinks, flicks and glances: seeded in a generator, so its captured cover is always the same
    const mk = (part, o) => { const m = coatMaterial(L, part, o); m.userData.shells = L.shells; this.mats.push(m); return m; };
    const bone = (name, parent, x = 0, y = 0, z = 0) => { const b = new THREE.Group(); b.name = name; b.position.set(x, y, z); parent.add(b); this.b[name] = b; return b; };
    const beanMat = new THREE.MeshPhysicalMaterial({ color: L.nose, roughness: 0.4, clearcoat: 0.6, sheen: 0.5 });
    this.b = {}; const root = this.root = new THREE.Group(); root.name = "prancer";
    const legLen = 0.95, BW = L.bw, AK = this.armK = opts.armK || 1;   // armK: performers get longer arms to reach their instruments

    /* the rig */
    const hips = bone("hips", root, 0, legLen, 0), chest = bone("chest", hips, 0, 0.95, 0.02), neck = bone("neck", chest, 0, 0.3, 0.02), head = bone("head", neck, 0, 0.82, 0.05);
    const SX = L.outfit !== "None" ? 0.57 : 0.5 + (L.furLen || 0) * 0.4, shL = bone("shL", chest, SX * BW, -0.06, 0.02), shR = bone("shR", chest, -SX * BW, -0.06, 0.02);   // shoulders where the body's side is: the shirt, or the fur
    const elL = bone("elL", shL, 0, -0.5 * AK, 0), elR = bone("elR", shR, 0, -0.5 * AK, 0), wrL = bone("wrL", elL, 0, -0.42 * AK, 0), wrR = bone("wrR", elR, 0, -0.42 * AK, 0);
    const thL = bone("thL", hips, 0.3 * BW, 0.02, 0.02), thR = bone("thR", hips, -0.3 * BW, 0.02, 0.02);
    const knL = bone("knL", thL, 0, -0.46, 0), knR = bone("knR", thR, 0, -0.46, 0), anL = bone("anL", knL, 0, -0.42, 0), anR = bone("anR", knR, 0, -0.42, 0);

    /* body and head */
    const clothed = L.outfit !== "None", bareTorso = L.outfit === "Sphinx", bare = L.outfit === "Gladiator's Armor" || bareTorso, fu = L.furLen || 0, sw = Math.min(BW, 1.2), sleeve = clothed && !L.short && !bare;   /* a gladiator's arms are bare but for the manica (outfits.js) */
    /* what arms keep out of: the torso's profile (clothes, or the body and its fur); and how thick each part of an arm is */
    this.prof = clothed && !bareTorso ? GARMENT : TORSO; this.profFur = clothed && !bareTorso ? 0 : fu;   /* a Sphinx goes bare-chested: its jewels lie on its fur */ this.swivel = {};
    this.armR = { up: Math.max(clothed ? 0.2 * sw : 0, 0.17 * sw + (clothed ? 0 : fu)), fore: Math.max(sleeve ? 0.17 : 0, 0.145 + (sleeve ? 0 : fu)), paw: 0.22 + fu };
    hips.add(furry(torsoGeo(L), mk(PART.torso, { fur: clothed && !bareTorso ? 0 : undefined }), L.shells));
    const hm = furry(headGeo(L), mk(PART.head), L.shells); head.add(hm); this.headMesh = hm;
    const padZ = (x, y) => 0.8 + 0.15 * Math.sqrt(Math.max(0, 1 - ((Math.abs(x) - 0.12) / 0.19) ** 2 - ((y + 0.34) / 0.145) ** 2));
    for (const s of [-1, 1]) { const p = furry(new THREE.SphereGeometry(0.17, seg(36), seg(24)), mk(PART.muzzle, { fur: L.furLen * 0.5 }), L.shells); p.position.set(s * 0.12, -0.34, 0.8); p.scale.set(1.12, 0.85, 0.9); head.add(p); }
    const chin = furry(new THREE.SphereGeometry(0.14, seg(28), seg(20)), mk(PART.muzzle, { fur: L.furLen * 0.5 }), L.shells); chin.position.set(0, -0.5, 0.72); chin.scale.set(1.1, 0.75, 0.9); head.add(chin);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.1, seg(32), seg(20)), new THREE.MeshPhysicalMaterial({ color: L.nose, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 }));
    { const p = nose.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) * (1 + Math.max(0, y) * 4) * 0.9); } nose.geometry.computeVertexNormals(); }   // wider on top: a rounded triangle
    nose.position.set(0, -0.2, 0.93); nose.scale.set(1.1, 0.75, 0.75); head.add(nose);
    /* no drawn mouth: the cleft between the whisker pads is the shut mouth (Yoeshi, 2026-11-10: the black lines under the nose removed) */
    const wh = new THREE.MeshBasicMaterial({ color: 0xf6f4ee, transparent: true, opacity: 0.92 }); this.whiskers = [];
    const WL = L.legend === "Astronaut" ? 0.68 : 1;   /* inside a helmet the whiskers are shorter: at full length their tips came out through the shell (Yoeshi, 2026-11-10) */
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const y0 = -0.31 - k * 0.04, x0 = 0.22 * s;
      const c = new THREE.CatmullRomCurve3([new THREE.Vector3(x0, y0, padZ(x0, y0)), new THREE.Vector3(x0 + 0.42 * s * WL, y0 + 0.02 - k * 0.04, 0.86), new THREE.Vector3(x0 + 0.92 * s * WL, y0 - 0.06 - (k - 1) * 0.12, 0.62 + (1 - WL) * 0.3)]);
      const w = new THREE.Mesh(new THREE.TubeGeometry(c, seg(20), 0.0065, seg(6)), wh); head.add(w); this.whiskers.push([w, s, k]); }
    /* the mouth that sings: a dark opening under the whisker pads, a tongue, two little fangs; the chin drops with it */
    const mouth = new THREE.Group(); mouth.position.set(0, -0.47, 0.86); head.add(mouth);
    const cav = new THREE.Mesh(new THREE.SphereGeometry(0.12, seg(28), seg(18)), new THREE.MeshStandardMaterial({ color: 0x2a0d16, roughness: 0.65 })); cav.scale.set(1.15, 0.01, 0.55); mouth.add(cav);
    const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.07, seg(20), seg(14)), new THREE.MeshPhysicalMaterial({ color: "#ff7a9a", roughness: 0.35, clearcoat: 0.5 })); tongue.scale.set(1.2, 0.5, 0.9); mouth.add(tongue);
    const fangs = [-1, 1].map((s) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.05, seg(8)), new THREE.MeshPhysicalMaterial({ color: "#fffaf0", roughness: 0.25, clearcoat: 1 })); f.rotation.x = Math.PI; f.position.set(0.06 * s, 0, 0.045); mouth.add(f); return f; });
    this.pads = head.children.filter((o) => o.isMesh && o.position.y === -0.34);
    this.mouth = { g: mouth, cav, tongue, fangs, chin, open: 0, vow: "a", to: 0, toVow: "a", puff: 0 };
    this.eyes = [-1, 1].map((s, i) => { const e = eyeMesh(L, L.eyes[i === 0 ? 0 : 1], mk(PART.lid, { fur: 0 }), s); e.position.set(0.37 * s * L.cw, 0.07, 0.79); e.rotation.set(-0.04, 0.3 * s, 0); head.add(e); return e; });
    /* laser eyes (the Portraits' Laser Eyes): from each eye a beam in three layers, as drawn there (a wide glow in the
       laser's colour, a bright core, a white centre), and a white flare at the eye; the irises keep their own colour.
       Straight ahead; laserAt(point) aims them */
    if (L.laser) { const LEN = opts.laserLen || 7, beamM = (c, o) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { col: { value: new THREE.Color(c) }, op: { value: o } },
        vertexShader: "varying float vy; void main() { vy = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: "uniform vec3 col; uniform float op; varying float vy; void main() { gl_FragColor = vec4(col * op * pow(1.0 - vy, 0.8), 1.0); }" });
      this.lasers = this.eyes.map((e) => { const g = new THREE.Group(); g.name = "laser"; g.position.copy(e.position).add(new THREE.Vector3(0, 0, 0.17)); head.add(g);
        for (const [c, r, o] of [[L.laser[0], 0.1, 0.35], [L.laser[1], 0.04, 1], ["#ffffff", 0.014, 1]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.6, LEN, seg(10), 1, true).translate(0, LEN / 2, 0).rotateX(Math.PI / 2), beamM(c, o)); m.frustumCulled = false; g.add(m); }
        const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex(), color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); f.scale.setScalar(0.55); g.add(f); return g; }); }

    /* ears */
    const eh = { Pointed: 0.78, Tufted: 0.8, Folded: 0.5, Round: 0.58, Huge: 1.05, Small: 0.55, "Tall Tufted": 0.95 }[L.ears] || 0.78, er = { Huge: 0.5, Small: 0.3, Round: 0.42 }[L.ears] || 0.39;
    const inner = new THREE.MeshPhysicalMaterial({ color: L.earIn, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color("#ffffff") });
    this.ears = [-1, 1].map((s) => { const e = bone(s < 0 ? "earR" : "earL", head, 0.55 * s * L.cw, 0.6, -0.04);
      e.rotation.set(-0.12, -0.22 * s, -0.42 * s); if (L.ears === "Folded") e.rotation.x = 0.85;
      e.userData.ear = { h: eh + (/Tufted/.test(L.ears) ? (L.ears === "Tall Tufted" ? 0.3 : 0.16) : 0), r: er };   // its size, for the holes a hat cuts round it (wardrobe.js)
      e.add(furry(earGeo(eh, er), mk(PART.ear, { fur: L.furLen * 0.6 }), L.shells));
      const inn = new THREE.Mesh(earGeo(eh * 0.74, er * 0.68), inner); inn.position.set(0, 0.05, 0.07); e.add(inn);
      if (/Tufted/.test(L.ears)) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.035, L.ears === "Tall Tufted" ? 0.42 : 0.24, seg(8)), new THREE.MeshStandardMaterial({ color: L.point || L.mark || L.body, roughness: 0.9 })); t.position.y = eh + 0.08; e.add(t); }
      if (L.fur === "Longhair") for (let k = 0; k < 4; k++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.2, seg(6)), new THREE.MeshStandardMaterial({ color: "#f6f2ea", roughness: 0.9 })); t.position.set((k - 1.5) * 0.06, 0.12, 0.1); t.rotation.set(0.3, 0, (k - 1.5) * 0.2); e.add(t); }   // ear furnishings
      return e; });

    /* arms and legs */
    /* each segment runs joint to joint, narrowing toward the paw (as the Portraits' arm strokes do: forearm about 0.84 of the
       upper arm), its ends balls on the joints; longer arms (a performer's) a little fuller, so they do not read thin */
    const limb = (b, r0, r1, len, part, along, fur, arm) => { const m = furry(taper(r0, r1, len), mk(part, { along, fur: arm && fur === undefined ? fu * 0.6 : fur }), L.shells); b.add(m);
      /* an arm's fur is a foreleg's: shorter than the body's (0.6) and combed toward the paw, and none over the elbow's ball at either segment's end, where
         the upper arm's far ball and the forearm's near ball overlap (each wore a full pom-pom: the cinema render showed it on every strumming arm, 2026-11-09) */
      if (arm) { const U = m.material.userData.u; U.uDroop.value = 0.85; if (arm === "upper") U.uFade.value.set(1e3, 1e3 + 1, len - 0.55 * r1, len + 0.15 * r1); else U.uFade.value.set(-0.7 * r0, 0.25 * r0, 1e3, 1e3 + 1); }
      return m; };
    const AF = 1 + 0.3 * (AK - 1), RU = this.RU = 0.17 * Math.min(BW, 1.2) * AF, RE = this.RE = 0.148 * AF, RW = this.RW = 0.128 * AF;
    this.pawMat = {};   // each hand's coat material: its toes close round what it holds (grip) through the coat shader
    for (const [sh, el, wr, sd] of [[shL, elL, wrL, "L"], [shR, elR, wrR, "R"]]) {
      limb(sh, RU, RE, 0.5 * AK, PART.upper, 0.25, clothed && !bare ? 0 : undefined, "upper");   // a sleeve always covers the upper arm
      limb(el, RE, RW, 0.42 * AK, PART.lower, 0.65, sleeve ? 0 : undefined, "lower");
      const pm = this.pawMat[sd] = mk(PART.paw, { along: 1 }), p = pawMesh(pm, null, 1, false); p.position.y = -0.06; wr.add(p); }
    this.armR = { up: clothed && !bare ? RU + 0.034 : RU + fu, fore: sleeve ? (RE + RW) / 2 + 0.034 : (RE + RW) / 2 + fu, paw: 0.22 + fu };   // what the arm solver keeps clear, from these shapes
    for (const [th, kn, an] of [[thL, knL, anL], [thR, knR, anR]]) {
      limb(th, 0.22 * Math.min(BW, 1.25), 0.175, 0.46, PART.upper, 0.3, L.pants ? 0 : undefined); limb(kn, 0.175, 0.14, 0.42, PART.lower, 0.7, L.pants ? 0 : undefined);
      const f = pawMesh(mk(PART.paw, { along: 1 }), null, 1.05, true); f.position.y = -0.05; an.add(f); }

    /* the tail: a chain of links, thick to thin */
    const n = L.tail === "Bob" && L.tails === 1 ? 3 : 10, fl = L.fur === "Longhair" ? 1.45 : 1, tz = -(profR(this.prof, 0.12) + this.profFur * 0.5) * BW * 0.86; this.tails = [];   // from the surface (the fur, or the clothes), not from inside
    for (let k = 0; k < (L.tails || 1); k++) { let prev = bone("tail" + (k ? "B" : "") + "0", hips, 0, 0.12, tz); const chain = [prev]; this.tails.push(chain);
      prev.rotation.x = -1.25; if (L.tails > 1) prev.rotation.y = k ? -0.6 : 0.17;   /* a Nekomata's two strands fork from one root (prancer-pfp: -34 and 10 degrees) */
      for (let i = 0; i < n; i++) { const r = lerp(0.13, 0.075, i / n), len = 0.2;
        const m = furry(cap(r, len), mk(PART.tail, { along: i / (n - 1 || 1), fur: L.furLen * fl * (i > n - 3 ? 1.3 : 1) }), L.shells); m.position.y = len / 2; prev.add(m);
        if (i < n - 1) { prev = bone("tail" + (k ? "B" : "") + (i + 1), prev, 0, len + r * 0.4, 0); chain.push(prev); }
        else if (L.tails > 1) { const fm = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), new THREE.MeshStandardMaterial({ color: "#c9b3ff", emissive: "#a77bff", emissiveIntensity: 1.6, transparent: true, opacity: 0.85 })); fm.position.y = len + 0.02; fm.scale.set(0.8, 1.5, 0.8); prev.add(fm); (this.flames || (this.flames = [])).push(fm); } } }   // a Nekomata's tails burn violet at the tips
    this.tail = this.tails[0];

    /* clothes, in the wardrobe's colours: a garment over the torso, sleeves, trousers */
    if (clothed) {
      const main = { "Suit & Tie": L.jacket, "Leather Jacket": L.jacket, "Denim Jacket": L.jacket, Overalls: L.tee, "Band Tee": L.tee, Flannel: L.sleeve, "Lab Coat": "#f7f8fa", Astronaut: "#f2f2ee" }[L.outfit] || L.sleeve || L.c1;
      const cloth = (c) => { const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.82, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(c).lerp(new THREE.Color("#ffffff"), 0.4), side: THREE.DoubleSide }); return m; };
      const top = new THREE.Mesh(garmentGeo(L, 0, 1.16), cloth(main)); top.castShadow = true; hips.add(top);
      const hem = new THREE.Mesh(new THREE.TorusGeometry(0.6 * BW * 1.06 + 0.02, 0.035, seg(10), seg(48)), cloth(new THREE.Color(main).multiplyScalar(0.8))); hem.rotation.x = Math.PI / 2; hem.scale.y = 0.86; hem.position.y = 0.02; hips.add(hem);
      const roll = new THREE.Mesh(new THREE.TorusGeometry(0.33 * BW, 0.07, seg(12), seg(40)), cloth(main)); roll.rotation.x = Math.PI / 2; roll.scale.y = 0.86; roll.position.y = 1.14; hips.add(roll);   // the neckline
      if (L.outfit === "Astronaut") { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4 * BW, 0.07, seg(14), seg(48)), new THREE.MeshPhysicalMaterial({ color: "#c8ccd3", metalness: 1, roughness: 0.25 })); ring.rotation.x = Math.PI / 2; ring.position.y = 1.18; hips.add(ring); }
      const sl = L.sleeve || main, ctx = { top, hem, roll, hips, BW, AK, RU, RE, RW, skirts: this.skirts = [], capeU: this.capeU, drape: this.cloth, arms: [{ sh: shL, el: elL, s: 1 }, { sh: shR, el: elR, s: -1 }], sleeves: [], pants: [] };
      if (!bare) for (const [sh, el] of [[shL, elL], [shR, elR]]) { const T = 0.034, u = new THREE.Mesh(L.short ? taper(RU + T, RE + T, 0.5 * AK, 0.62) : taper(RU + T, RE + T, 0.5 * AK), cloth(sl)); sh.add(u); const sv = { up: u, fore: null }; ctx.sleeves.push(sv);
        if (L.short) { const hem = new THREE.Mesh(new THREE.TorusGeometry(RU + T - (RU - RE) * 0.62, 0.028, seg(8), seg(28)), cloth(new THREE.Color(sl).multiplyScalar(0.8))); hem.rotation.x = Math.PI / 2; hem.position.y = -0.5 * AK * 0.62; sh.add(hem); }   // a short sleeve's hem
        if (!L.short) { const f = sv.fore = new THREE.Mesh(taper(RE + T, RW + T + 0.012, 0.42 * AK - 0.07, 0.999), cloth(sl)); el.add(f); const cf = new THREE.Mesh(new THREE.TorusGeometry(RW + T + 0.01, 0.032, seg(8), seg(28)), cloth(new THREE.Color(sl).multiplyScalar(0.75))); cf.rotation.x = Math.PI / 2; cf.position.y = -(0.42 * AK - 0.07); el.add(cf); } }
      if (L.pants) for (const [th, kn] of [[thL, knL], [thR, knR]]) { const T = 0.036, r0 = 0.22 * Math.min(BW, 1.25) + T, r1 = 0.175 + T; const pt = new THREE.Mesh(taper(r0, r1, 0.46), cloth(L.pants)); th.add(pt);   // trousers on the legs' own shapes, the hem above the ankle
        const pk = new THREE.Mesh(taper(0.175 + T, 0.14 + T + 0.01, 0.42 - 0.06, 0.999), cloth(L.pants)); kn.add(pk); ctx.pants.push({ th, kn, s: th === thL ? 1 : -1, r0, r1, meshes: [pt, pk] }); const hem = new THREE.Mesh(new THREE.TorusGeometry(0.14 + T + 0.012, 0.03, seg(8), seg(28)), cloth(new THREE.Color(L.pants).multiplyScalar(0.8))); hem.rotation.x = Math.PI / 2; hem.position.y = -0.36; kn.add(hem); }
      /* the trousers' seat: they had legs and no seat, so the belly's fur showed between the top's hem and the legs from below (Yoeshi, 2026-11-10) */
      let seat = null; if (L.pants) { const g = new THREE.LatheGeometry([[0.001, -0.19], [0.2, -0.185], [0.36, -0.155], [0.575, -0.01], [0.632, 0.03]].map(([r, y]) => new THREE.Vector2(r, y)), seg(56)); g.scale(BW, 1, BW * 0.86); g.computeVertexNormals(); seat = new THREE.Mesh(g, cloth(L.pants)); seat.castShadow = true; hips.add(seat); }
      dressDetail(this, L, ctx);   /* what each outfit wears beyond its plain garment (outfits.js) */
      if (seat && ctx.pants[0]) { const pm = ctx.pants[0].meshes[0].material; if (!pm.map) seat.material = pm; }   // in whatever the outfit made the legs of (a knight's plate)
    }

    /* extras: the lion's mane, the celestial halo, the infernal horns */
    /* how far a mane opens at the crown for a hat: wide for a wide brim (it lies over the mane), not at all for a small hat (it sits on top of the mane: wardrobe.js MANE_UP; in a crater it read as a hole), a crown's width for the rest */
    const MO = !L.hatted ? 0 : { "Wizard Hat": 0.97, "Cowboy Hat": 0.97, "Bucket Hat": 0.97, Fedora: 0.97, "Top Hat": 0, Crown: 0, "Party Hat": 0, Beret: 0, "Chef Hat": 0, "Flower Crown": 0 }[G.HAT] ?? 0.62;
    if (L.mane) { const mc = { Blond: "#d9a441", Tawny: "#a8682a", Dark: "#4a2e1c", Black: "#1a1412", Cream: "#efe1c4" }[L.mane] || "#a8682a";
      const mm = coatMaterial({ ...L, body: mc, mark: null, patch: null, point: null, pattern: "Solid", whiteMode: "None", furLen: 0.22, droop: 1.2 }, PART.torso); this.mats.push(mm);
      const mane = furry(new THREE.SphereGeometry(1.32, seg(48), seg(36), 0, Math.PI * 2, MO, Math.PI - MO), mm, L.shells);   /* under a hat the mane opens at the crown, so the hat sits on the head, framed by the mane */ mane.position.set(0, -0.15, -0.28); mane.scale.set(1.1 * L.cw, 1.05, 0.8); head.add(mane); }
    if (L.halo) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, seg(16), seg(64)), new THREE.MeshStandardMaterial({ color: "#ffe28a", emissive: "#ffd04a", emissiveIntensity: 2.2 })); h.rotation.x = Math.PI / 2 - 0.2; h.position.y = 1.35; head.add(h); this.halo = h; }
    if (L.wings) this.wings = addWings(this, L.wings);
    if (L.horns) for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, seg(20)), new THREE.MeshPhysicalMaterial({ color: "#3a0c0c", roughness: 0.35, clearcoat: 1 })); h.position.set(0.3 * s, 0.82, 0.38); h.rotation.set(0.35, 0, -0.4 * s); head.add(h); }

    /* signature items: glasses and earrings (prancer-band/BAND.md), and the frontcat's chain, yin-yang pendant and ruby shoes */
    const sigs = [].concat(L.sig || []), gold = new THREE.MeshPhysicalMaterial({ color: "#e8bf4e", metalness: 1, roughness: 0.22 });
    /* A temple: from the hinge at a lens's outer edge back along the side of the head, just outside the fur, to end tucked
       into the fur behind the cheek (a collector, 2026-11-10: "maybe extend the temples?"; a straight bar ran into the head
       a third of the way along and showed as a stub). */
    const sideAt = (y, a, lift) => { const fu = L.furLen || 0, k = Math.sqrt(Math.max(0, 1 - (y / 0.92) ** 2)); let x = 1.06 * L.cw * k * Math.sin(a), z = 0.94 * k * Math.cos(a); if (z > 0.6) z = 0.6 + (z - 0.6) * 0.75; const d = Math.hypot(x, z) || 1; return new THREE.Vector3(x + x / d * (fu + lift), y, z + z / d * (fu + lift)); };
    const temple = (s, m, w = 0.19, hy = 0) => { const hx = 0.37 * L.cw + w * Math.cos(0.3), hz = 1.09 - w * Math.sin(0.3), y0 = 0.07 + hy, P = [new THREE.Vector3(s * hx, y0, hz), new THREE.Vector3(s * (hx + 0.07), y0, hz - 0.13)], fu = L.furLen || 0;   /* hinged on the frame's own outer edge, wherever that is for this pair (Yoeshi, 2026-11-10: the hearts' temples hung off in front of them) */
      for (let i = 0; i <= 8; i++) { const u = i / 8, e = Math.max(0, (u - 0.7) / 0.3); P.push(sideAt(y0 + (0.1 - y0) * Math.min(1, u * 2) - 0.1 * e * e, s * (0.95 + 0.9 * u), 0.035 - fu * 0.45 * Math.min(1, u * 3) - (fu * 0.55 + 0.1) * e * e)); }   /* nestled into long fur, so it does not hover off a fluffy head */
      head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P, false, "centripetal"), seg(40), 0.016, seg(6)), m)); };
    for (const sig of sigs) if (/^(Aviators|Cat-Eye Glasses|Heart Glasses|3D Glasses|Glasses)$/.test(sig)) { /* (the generator rolls round glasses as plain "Glasses") */ const g = new THREE.Group(); g.position.set(0, 0.07, 1.09); head.add(g);   /* in front of the eyes (they reach 1.04; at 1.0 the heart lenses sat inside them, Yoeshi 2026-11-07) */
      const frame = new THREE.MeshPhysicalMaterial({ color: sig === "Aviators" ? "#e8bf4e" : sig === "3D Glasses" ? "#f4f4f0" : sig === "Heart Glasses" ? "#ff4f8b" : "#16121c", metalness: sig === "Aviators" ? 1 : 0, roughness: 0.3, clearcoat: 1 });
      const hs = new THREE.Shape(); hs.moveTo(0, -0.17); hs.bezierCurveTo(-0.3, 0.02, -0.12, 0.2, 0, 0.07); hs.bezierCurveTo(0.12, 0.2, 0.3, 0.02, 0, -0.17); const heart = sig === "Heart Glasses", HK = 1.4;   /* the hearts larger: at 1 they were smaller than the eyes behind them */
      for (const s of [-1, 1]) { const lens = heart ? new THREE.ShapeGeometry(hs, 16).scale(HK, HK, 1)
          : new THREE.CircleGeometry(sig === "Aviators" ? 0.2 : 0.18, seg(40));
        if (sig === "Aviators") lens.scale(1, 1.15, 1); if (sig === "Cat-Eye Glasses") lens.scale(1.25, 0.78, 1);
        const col = sig === "3D Glasses" ? (s < 0 ? "#ff2a3c" : "#2ad8ff") : sig === "Heart Glasses" ? "#ff8fb8" : sig === "Aviators" ? "#5a4a2a" : "#2a2238";
        const l = new THREE.Mesh(lens, new THREE.MeshPhysicalMaterial({ color: col, transparent: true, opacity: 0.62, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide })); l.position.set(0.37 * s * L.cw, 0, 0); l.rotation.y = 0.3 * s; g.add(l);
        const rimG = heart ? new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hs.getPoints(24).map((p) => new THREE.Vector3(p.x * HK, p.y * HK, 0)), true), 64, 0.024, 8, true) : new THREE.TorusGeometry(sig === "Aviators" ? 0.2 : 0.185, 0.022, seg(10), seg(48));   /* the hearts framed too (Yoeshi: bare lenses floated) */ if (sig === "Aviators") rimG.scale(1, 1.15, 1); if (sig === "Cat-Eye Glasses") rimG.scale(1.25, 0.78, 1);
        { const rr = new THREE.Mesh(rimG, frame); rr.position.copy(l.position); rr.rotation.copy(l.rotation); g.add(rr); }
        if (sig === "Cat-Eye Glasses") { const w = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, seg(12)), frame); w.position.set(0.58 * s * L.cw, 0.1, -0.05); w.rotation.z = -0.9 * s; g.add(w); }
        temple(s, frame, heart ? 0.17 * HK : sig === "Aviators" ? 0.2 : sig === "Cat-Eye Glasses" ? 0.23 : 0.185, heart ? 0.06 * HK : 0); }
      const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.37 * L.cw - (heart ? 0.2 : 0.17), 0.018, seg(8), seg(20), Math.PI), frame); bridge.position.set(0, heart ? 0.07 : 0.02, 0.02); if (heart) bridge.scale.y = 0.55; g.add(bridge); }   /* from frame to frame */
    /* the rest of the Portraits' eyewear (prancer-pfp SPECS), as drawn there: lenses before the eyes (0.37 x cw either side,
       turned 0.3 outward), or a band bent round the face on a circle of radius WR so its ends come back round the cheeks */
    const frameOf = (c, metal = 0) => new THREE.MeshPhysicalMaterial({ color: c, metalness: metal, roughness: 0.3, clearcoat: 1 });
    const glassOf = (c, op) => new THREE.MeshPhysicalMaterial({ color: c, transparent: true, opacity: op, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide });
    const rimOf = (shape, r, m) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(shape.getPoints(12).slice(0, -1).map((p) => new THREE.Vector3(p.x, p.y, 0)), true, "centripetal"), seg(80), r, seg(6), true), m);
    const shapeOf = (pts) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); return sh; };
    const WR = 1.1 * L.cw, bent = (x, y) => { const a = x * L.cw / WR; return new THREE.Vector3(WR * Math.sin(a), y, WR * (Math.cos(a) - 1)); };
    const wrapBand = (x0, x1, top, bot, n = seg(48)) => { const P = [], I = [];   // a band from x0 to x1 (before the head's width), its edges top(x) and bot(x)
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, A = bent(x, top(x)), B = bent(x, bot(x)); P.push(A.x, A.y, A.z, B.x, B.y, B.z); if (i) { const k = 2 * i; I.push(k - 2, k - 1, k, k - 1, k + 1, k); } }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); return g; };
    const edgeOf = (x0, x1, f, r, m, n = seg(40)) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: n + 1 }, (_, i) => bent(x0 + (x1 - x0) * i / n, f(x0 + (x1 - x0) * i / n)))), n, r, seg(6)), m);
    const headAt = (y, a, lift) => { const fu = L.furLen || 0, k = Math.sqrt(Math.max(0, 1 - (y / 0.92) ** 2)); let x = 1.06 * L.cw * k * Math.sin(a), z = 0.94 * k * Math.cos(a); if (z > 0.6) z = 0.6 + (z - 0.6) * 0.75;   // the head's surface at height y, angle a (0 the face)
      const d = Math.hypot(x, z) || 1; return new THREE.Vector3(x + x / d * (fu + lift), y, z + z / d * (fu + lift)); };
    for (const sig of sigs) {
      if (sig === "Round Glasses" || sig === "Shades" || sig === "Star Glasses") { const g = new THREE.Group(); g.position.set(0, 0.07, 1.09); head.add(g);
        const fr = frameOf(sig === "Round Glasses" ? "#c9a24a" : sig === "Shades" ? "#2a2a33" : "#ff8f1f", sig === "Round Glasses" ? 1 : 0);
        const sh = sig === "Star Glasses" ? shapeOf(Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 0.12 : 0.27; return [Math.cos(a) * q, Math.sin(a) * q]; }))
          : sig === "Shades" ? (() => { const x = new THREE.Shape(); x.moveTo(-0.2, 0.12); x.lineTo(0.2, 0.12); x.quadraticCurveTo(0.2, -0.17, 0, -0.17); x.quadraticCurveTo(-0.2, -0.17, -0.2, 0.12); return x; })()
          : (() => { const x = new THREE.Shape(); x.absarc(0, 0, 0.19, 0, TAU, false); return x; })();
        const gl = glassOf(sig === "Round Glasses" ? "#bfe9ff" : sig === "Shades" ? "#0b0b10" : "#ffd23f", sig === "Round Glasses" ? 0.2 : sig === "Shades" ? 0.92 : 0.55);
        for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.ShapeGeometry(sh, 16), gl); l.position.set(0.37 * s * L.cw, 0, 0); l.rotation.y = 0.3 * s; g.add(l);
          const rr = rimOf(sh, 0.02, fr); rr.position.copy(l.position); rr.rotation.copy(l.rotation); g.add(rr);
          temple(s, fr, sig === "Star Glasses" ? 0.25 : 0.2, sig === "Star Glasses" ? 0.083 : sig === "Shades" ? 0.05 : 0); }
        const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, seg(8), seg(20), Math.PI), fr); bridge.position.set(0, 0.02, 0.02); g.add(bridge); }
      else if (sig === "Visor" || sig === "Agent Shades" || sig === "Ski Goggles" || sig === "Eyepatch") { const g = new THREE.Group(); g.position.set(0, 0.07, 1.04); head.add(g);
        if (sig === "Visor") { const col = new THREE.Color().setHSL(new THREE.Color(L.c1).getHSL({}).h, 0.95, 0.55), top = (x) => 0.25 - 0.06 * x * x, bot = (x) => -0.13 + 0.07 * (1 - x * x);
          g.add(new THREE.Mesh(wrapBand(-0.95, 0.95, top, bot), new THREE.MeshPhysicalMaterial({ color: col, emissive: col, emissiveIntensity: 0.7, transparent: true, opacity: 0.68, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide })));
          const w = frameOf("#e6ebf2", 0.6); g.add(edgeOf(-0.95, 0.95, top, 0.018, w), edgeOf(-0.95, 0.95, bot, 0.018, w)); }
        if (sig === "Agent Shades") { const top = (x) => 0.2 - 0.06 * x * x, bot = (x) => -0.2 + 0.22 * Math.exp(-((x / 0.09) ** 2)) + 0.3 * Math.max(0, (Math.abs(x) - 0.55) / 0.31) ** 2;
          g.add(new THREE.Mesh(wrapBand(-0.86, 0.86, top, bot, seg(64)), glassOf("#0a0a0e", 0.95))); g.add(edgeOf(-0.86, 0.86, top, 0.016, frameOf("#1c1c22"))); }
        if (sig === "Ski Goggles") { const strap = frameOf(L.c2 || "#ff5fa2"), top = (x) => 0.24 - 0.05 * x * x, bot = (x) => -0.2 + 0.04 * x * x;
          g.add(new THREE.Mesh(wrapBand(-0.86, 0.86, top, bot), strap));
          const lens = new THREE.Mesh(wrapBand(-0.78, 0.78, (x) => 0.19 - 0.05 * x * x, (x) => -0.15 + 0.04 * x * x + 0.11 * Math.exp(-((x / 0.1) ** 2))), new THREE.MeshPhysicalMaterial({ color: "#7fd8ff", metalness: 0.85, roughness: 0.08, iridescence: 1, clearcoat: 1 })); lens.position.z = 0.012; g.add(lens);
          const end = bent(0.86, 0).add(g.position), a0 = Math.atan2(end.x, end.z);   // the strap round the back of the head, from one end of the frame to the other, outside the fur
          head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 33 }, (_, i) => headAt(0.07, a0 + (TAU - 2 * a0) * i / 32, 0.03))), seg(48), 0.04, seg(6)), strap)); }
        if (sig === "Eyepatch") { const blk = frameOf("#16151a"), e = (x) => Math.sqrt(Math.max(0, 1 - ((x + 0.37) / 0.23) ** 2));
          g.add(new THREE.Mesh(wrapBand(-0.6, -0.14, (x) => 0.2 * e(x), (x) => -0.18 * e(x), seg(24)), blk));
          head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 40 }, (_, i) => { const a = (i / 40) * TAU; return headAt(0.36 - 0.11 * Math.sin(a), a, 0.02); }), true), seg(64), 0.022, seg(6), true), blk)); } }   // the strap across the brow, higher on the patch's side, round the back
      else if (sig === "Monocle") { const g = new THREE.Group(); g.position.set(0, 0.07, 1.09); head.add(g); const x = 0.37 * L.cw;
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.022, seg(10), seg(40)), gold); rim.position.set(x, 0, 0); rim.rotation.y = 0.3; g.add(rim);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.19, seg(32)), glassOf("#e8f6ff", 0.18)); lens.position.copy(rim.position); lens.rotation.copy(rim.rotation); g.add(lens);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[x + 0.13, -0.15, -0.02], [x + 0.3, -0.45, -0.06], [x + 0.14, -0.78, -0.12]].map((q) => new THREE.Vector3(...q))), seg(24), 0.009, seg(5)), gold)); }   // its chain
    }
    for (const sig of sigs) if (/Hoop|Pearl|Stud|Diamond/.test(sig)) { const e = this.ears[1], m = sig === "Diamond" ? new THREE.Mesh(new THREE.OctahedronGeometry(0.065), new THREE.MeshPhysicalMaterial({ color: "#eaf6ff", metalness: 0.4, roughness: 0.02, clearcoat: 1, iridescence: 0.4, envMapIntensity: 2.5 })) : sig === "Pearl" ? new THREE.Mesh(new THREE.SphereGeometry(0.06, seg(20), seg(14)), new THREE.MeshPhysicalMaterial({ color: "#f6f1ea", roughness: 0.15, clearcoat: 1, iridescence: 0.6 }))
        : sig === "Tez Stud" ? new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, seg(24)), gold) : new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, seg(10), seg(32)), gold);
      m.position.set(0.12, 0.12, 0.06); if (sig === "Tez Stud") m.rotation.x = Math.PI / 2; e.add(m); }
    if (!globalThis.PRANCER_GEN && L.persona) {
      const silver = new THREE.MeshPhysicalMaterial({ color: "#d9dde3", metalness: 1, roughness: 0.25 }), ch = new THREE.Mesh(new THREE.TorusGeometry(0.34 * BW, 0.02, seg(8), seg(48)), silver); ch.rotation.x = Math.PI / 2 - 0.35; ch.position.set(0, 1.12, 0.06); hips.add(ch);
      const cv = document.createElement("canvas"); cv.width = cv.height = 128; const x = cv.getContext("2d");   // the yin-yang
      x.fillStyle = "#f6f3ec"; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill(); x.fillStyle = "#111"; x.beginPath(); x.arc(64, 64, 62, -Math.PI / 2, Math.PI / 2); x.arc(64, 96, 31, Math.PI / 2, -Math.PI / 2, true); x.arc(64, 32, 31, Math.PI / 2, -Math.PI / 2, false); x.fill();
      x.beginPath(); x.arc(64, 32, 9, 0, Math.PI * 2); x.fill(); x.fillStyle = "#f6f3ec"; x.beginPath(); x.arc(64, 96, 9, 0, Math.PI * 2); x.fill();
      const pend = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, seg(40)), [silver, new THREE.MeshPhysicalMaterial({ map: new THREE.CanvasTexture(cv), roughness: 0.3, clearcoat: 1 }), silver]);
      pend.rotation.x = Math.PI / 2; pend.position.set(0, 0.86, 0.6 * BW * 0.86 + 0.06); hips.add(pend); this.pendant = pend;
      for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, seg(6)), silver); c.position.set(0.1 * s, 1.0, 0.5 * BW * 0.86 + 0.06); c.rotation.set(0.25, 0, 0.45 * s); hips.add(c); }
      const ruby = new THREE.MeshPhysicalMaterial({ color: "#b3122e", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.4, sheenColor: new THREE.Color("#ff6a8a") });
      for (const an of [anL, anR]) { const sh = new THREE.Mesh(new THREE.SphereGeometry(0.25, seg(32), seg(20)), ruby); sh.scale.set(1.0, 0.62, 1.45); sh.position.set(0, -0.06, 0.1); an.add(sh);
        const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, seg(28)), new THREE.MeshStandardMaterial({ color: "#2a0a10", roughness: 0.8 })); sole.scale.set(1, 1, 1.45); sole.position.set(0, -0.19, 0.1); an.add(sole); }
    }
    /* the coat works in the cat's rest space: note where every part sits now, standing still */
    root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    root.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.material && o.material.userData && o.material.userData.u) o.material.userData.u.uRest.value.multiplyMatrices(inv, o.matrixWorld); });
    this.rest = {}; for (const [k, b] of Object.entries(this.b)) this.rest[k] = { p: b.position.clone(), r: b.rotation.clone() };
    for (const e of this.eyes) this.cover(e, 1);   // the fur round the eyes lies short, never over the lids
    /* the resting arms: the least angle out from the body at which the elbow and forearm clear the belly, for this build */
    this.spl = 0.1; const R0 = this.armR, P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), P2 = new THREE.Vector3();
    for (; this.spl < 1.2; this.spl += 0.03) { shR.rotation.z = -this.spl; elR.rotation.x = -0.32; root.updateMatrixWorld(true); shR.getWorldPosition(P0); elR.getWorldPosition(P1); wrR.getWorldPosition(P2);
      let ok = true; for (let u = 0.7; u <= 1.001 && ok; u += 0.1) ok = this.bodyDist(V[11].lerpVectors(P0, P1, u)) > R0.up * 0.85;
      for (let u = 0; u <= 1.001 && ok; u += 0.2) ok = this.bodyDist(V[11].lerpVectors(P1, P2, u)) > R0.fore * 0.9;
      if (ok) break; }
    shR.rotation.z = 0; elR.rotation.x = 0; root.updateMatrixWorld(true);
    this.state = { dart: -9, nextDart: 0.7, blink: 0, nextBlink: 1.5, flick: 0, flickSide: 1, nextFlick: 3, look: new THREE.Vector2(), lookTo: new THREE.Vector2(), lookW: 0 };
  }

  /* one frame: m = { t, dt, speed (0 idle .. 1 walk .. 2 run), phase, air (0..1), vy, land (0..1), emote, emoteT, look (head yaw, pitch toward the camera) } */
  update(m) {
    const b = this.b, R = this.rest, L = this.L, [lidB, earB, tailK, bounceK, tiltK, pupB] = L.bear, t = m.t, S = this.state;
    for (const [k, v] of Object.entries(R)) { b[k].position.copy(v.p); b[k].rotation.copy(v.r); }
    for (const o of b.head.children) if (o.userData.tick) o.userData.tick(t || 0);   /* a hat with a moving part (the propeller) */
    for (const mat of this.mats) mat.userData.u.uTime.value = t;
    const walk = clamp(m.speed, 0, 1), run = clamp(m.speed - 1, 0, 1), ph = m.phase, amp = 0.55 + 0.45 * run;
    /* breathing, weight, idle sway */
    const br = m.breath ?? Math.sin(t * 1.6);   // m.breath: a breath given from outside (a looping capture)
    b.chest.scale.set(1 + 0.012 * br, 1 + 0.018 * br, 1 + 0.012 * br); b.hips.position.y += 0.012 * br * (1 - walk);
    b.hips.rotation.z += 0.025 * Math.sin(t * 0.7) * (1 - walk);
    b.shL.rotation.z += this.spl; b.shR.rotation.z -= this.spl; b.elL.rotation.x -= 0.32; b.elR.rotation.x -= 0.32;   // out round the belly as far as this body needs (this.spl), a soft elbow
    b.shL.rotation.x += 0.05 * Math.sin(t * 1.6 + 0.4) * (1 - walk); b.shR.rotation.x += 0.05 * Math.sin(t * 1.6 + 0.9) * (1 - walk);
    /* walking and running */
    if (walk > 0) {
      const s = walk * amp, sw = Math.sin(ph), bob = Math.abs(Math.sin(ph));
      b.thL.rotation.x -= sw * 0.65 * s; b.thR.rotation.x += sw * 0.65 * s;
      b.knL.rotation.x += Math.max(0, Math.cos(ph)) * 1.0 * s; b.knR.rotation.x += Math.max(0, -Math.cos(ph)) * 1.0 * s;
      b.anL.rotation.x -= Math.max(0, Math.cos(ph)) * 0.35 * s; b.anR.rotation.x -= Math.max(0, -Math.cos(ph)) * 0.35 * s;
      b.shL.rotation.x += sw * 0.6 * s; b.shR.rotation.x -= sw * 0.6 * s; b.elL.rotation.x -= (0.3 + 0.4 * run) * walk; b.elR.rotation.x -= (0.3 + 0.4 * run) * walk;
      b.hips.position.y += (bob * (0.07 + 0.08 * run) - 0.03) * walk * (0.6 + 0.4 * L.bear[3]); b.hips.rotation.y += sw * 0.1 * s; b.chest.rotation.y -= sw * 0.14 * s;
      b.chest.rotation.x += 0.06 * walk + 0.22 * run; b.head.rotation.x -= 0.12 * run; b.head.rotation.z += sw * 0.04 * s;
    }
    /* in the air: knees tucked, arms up; landing: a squash */
    if (m.air > 0) { const a = m.air, up = clamp(m.vy / 6, -1, 1);
      b.thL.rotation.x -= 0.6 * a; b.thR.rotation.x -= 0.6 * a; b.knL.rotation.x += 1.1 * a; b.knR.rotation.x += 1.1 * a;
      b.shL.rotation.x -= (1.6 + 0.6 * up) * a; b.shR.rotation.x -= (1.6 + 0.6 * up) * a; b.shL.rotation.z += 0.5 * a; b.shR.rotation.z -= 0.5 * a; b.chest.rotation.x -= 0.1 * up * a; }
    if (m.land > 0) { const l = Math.sin(Math.PI * m.land) * 0.5; b.hips.position.y -= 0.22 * l; b.thL.rotation.x -= 0.5 * l; b.thR.rotation.x -= 0.5 * l; b.knL.rotation.x += 0.9 * l; b.knR.rotation.x += 0.9 * l; }
    /* the head: looks toward the camera when idle (not while holding the Posey Paw), tilts by temperament */
    const E0 = m.emote, w0 = E0 ? smooth(m.emoteT / 0.25) * smooth((m.emoteLen - m.emoteT) / 0.3) : 0;
    const lookK = (1 - Math.max(walk, m.air) * 0.7) * (1 - (E0 === "posey" ? w0 : 0));
    b.neck.rotation.y += m.look.x * 0.35 * lookK; b.head.rotation.y += m.look.x * 0.45 * lookK; b.head.rotation.x += m.look.y * 0.5 * lookK;
    b.head.rotation.z += (tiltK * Math.PI / 180) * (0.6 + 0.4 * Math.sin(t * 0.37)) * (1 - walk * 0.5);
    /* the tail: a wave travelling down the links, raised when walking */
    const tw = tailK * (1 + walk);
    this.tails.forEach((chain, c) => chain.forEach((l, i) => { const k = i / chain.length, ph = c * 0.37 * 6.28; l.rotation.z += Math.sin(t * 2.2 * tw - i * 0.55 + ph) * (0.12 + 0.12 * k) * (0.6 + walk);
      l.rotation.x += (i === 0 ? 0.25 * walk : 0) + (L.tail === "Question" && i > chain.length - 4 ? 0.55 : 0.12) + 0.05 * Math.sin(t * 1.3 - i * 0.4 + ph);
      if (L.legend === "Astronaut") { if (i === 0) { l.rotation.z += 1.05; l.rotation.x -= 0.35; } else l.rotation.z -= 0.17; } }));   /* an astronaut's sleeved tail sweeps out to its side and curls up, clear of the jet pack's flames */
    if (this.jets) { const on = (m.emote && m.emote !== "posey" && m.emote !== "knead") || m.speed > 0.1 || m.air > 0 ? 1 : 0; this.thrust = lerp(this.thrust || 0, on, 0.15);   /* the jet pack fires as it moves; at rest only its pilot lights show */
      this.jets.forEach((f, i) => { const k = this.thrust * (1 + 0.15 * Math.sin(t * 31 + i * 2.3)); f.scale.set(Math.max(1e-3, this.thrust), Math.max(1e-3, k), Math.max(1e-3, this.thrust)); f.visible = this.thrust > 0.02; }); }
    if (this.flames) this.flames.forEach((f, i) => { const k = 1 + 0.18 * Math.sin(t * 9 + i * 2.1) ; f.scale.set(0.8 * k, 1.5 / k, 0.8 * k); });
    if (this.wings) this.wings.forEach((w, i) => { w.userData.beat = w.userData.y + (i ? -1 : 1) * (0.12 + 0.1 * Math.sin(t * 2.2)); w.rotation.y = w.userData.beat + (i ? 1 : -1) * (w.userData.fold || 0); });   /* a slow beat of the wings */
    /* ears: carried by temperament, a flick now and then */
    if (t > S.nextFlick) { S.flick = t; S.flickSide = this.rand() < 0.5 ? -1 : 1; S.nextFlick = t + 2.5 + this.rand() * 4; }
    this.ears.forEach((e, i) => { const s = i === 0 ? -1 : 1, f = (s === S.flickSide ? Math.max(0, 1 - Math.abs(t - S.flick - 0.12) / 0.12) : 0);
      e.rotation.z += s * (earB * 0.5 + 0.35 * f); e.rotation.x -= earB * 0.4 + (m.emote === "pawsup" ? -0.15 : 0); });
    /* eyes: blinking, glancing, pupils */
    if (t > S.nextBlink) { S.blink = t; S.nextBlink = t + 2.2 + this.rand() * 3.5; }
    const bl = Math.max(0, 1 - Math.abs(t - S.blink - 0.09) / 0.09);
    let lid = Math.max(0.06 + lidB * 0.6, bl), pupil = pupB + 0.1 * Math.sin(t * 0.3) + 0.14 * Math.exp(-Math.max(0, t - S.dart) * 2.5), happy = 0;   // the pupils open a moment at whatever catches the eye
    /* the eyes are never still: small darts round what they look at, a glance away now and then and back, each a quick jump and a hold (a slow drift read as glass) */
    { const r0 = this.rand(); if (t > S.nextDart) { const big = r0 < 0.2; S.lookTo.set((this.rand() - 0.5) * (big ? 0.42 : 0.08), (this.rand() - 0.5) * (big ? 0.2 : 0.05)); S.nextDart = t + (big ? 0.45 + this.rand() * 0.6 : 0.8 + this.rand() * 2.2); if (big) S.dart = t; } }
    S.look.lerp(S.lookTo, 0.42);
    /* emotes, each blended in and out */
    this.curl("L", 0); this.curl("R", 0); this._beat = m.beat; this._together = false;   // the paws open each frame (what holds something closes them after); the song's beat, if it is given, for the moves
    const E = m.emote, u = m.emoteT, w = E ? smooth(u / 0.25) * smooth((m.emoteLen - u) / 0.3) : 0;
    for (const k of this.skirts || []) k.scale.set(1, 1, 1); this.capeU.t.value = t; this.capeU.sit.value = 0;   /* a skirt hangs, unless the cat sits on it (sit) */
    if (E && w > 0) this.emote(E, u, w, t, (o) => { if (o.lid !== undefined) lid = lerp(lid, o.lid, w); if (o.pupil !== undefined) pupil = lerp(pupil, o.pupil, w); if (o.happy) happy = o.happy * w;
      if (o.look) S.look.lerp(o.look, 0.25); });
    for (const [i, e] of this.eyes.entries()) { const d = e.userData; d.lid.rotation.x = lerp(-1.25, 1.5, clamp(lid, 0, 1)); d.low.rotation.x = -0.35 * happy;
      d.glint(0.25 * Math.sin(-d.lid.rotation.x) * 1.07 - 0.075);
      d.u.uPupil.value = clamp(pupil, 0, 1); d.u.uLook.value.set(clamp(S.look.x + m.look.x * 0.42, -0.36, 0.36) - d.side * 0.15, clamp(S.look.y + m.look.y * 0.3 - 0.04 * lid, -0.25, 0.25)); }   /* both eyes on one point: each eye is set turned outward on the head, so its iris sits toward the nose (straight in each, the gaze spread apart and met nothing); and the eyes lead the head toward what it looks at */
    this.whiskers.forEach(([wk, s, k]) => wk.rotation.z = s * 0.04 * Math.sin(t * 3 + k));
    const mo = this.mouth; mo.open += (mo.to - mo.open) * 0.45; if (mo.toVow !== mo.vow) mo.vow = mo.toVow;
    const [sx, sy] = { a: [1.15, 1], e: [1.45, 0.62], o: [0.82, 1.05] }[mo.vow] || [1.15, 1], op = Math.max(0, mo.open);
    mo.cav.scale.set(sx, Math.max(0.01, op * 0.95 * sy), 0.55); mo.cav.visible = op > 0.03;   /* one mouth: shut, the drawn "w" is the mouth; the opening shows only once it opens, under the "w" as its upper lip (Yoeshi, 2026-11-10: shut, it lay as a second dark line under the drawn one) */ { const ry = 0.12 * op * 0.95 * sy; mo.g.position.set(0, -0.372 - ry, 0.86 + 0.05 * Math.min(1, op * 4)); }   /* it opens downward from the drawn "w", which is its upper lip: the opening hangs from the "w"'s lower edge, in front of the pads (it opened a pad's height below the "w", as a second mouth) */ mo.tongue.position.y = -0.03 - op * 0.04; mo.tongue.visible = op > 0.12;
    mo.fangs.forEach((f) => { f.visible = op > 0.1; f.position.y = 0.12 * op * 0.95 * sy - 0.015; f.position.x = Math.sign(f.position.x) * 0.06 * sx / 1.15; });
    mo.chin.position.y = -0.5 - 0.17 * op; this.pads.forEach((p) => { const k = 1 + mo.puff * 0.22; p.scale.set(1.12 * k, 0.85 * k, 0.9 * k); });
    if (this.halo) this.halo.rotation.z = t * 0.6;
    if (this.earU) this.earFrames();
    if (globalThis.PRANCER_GEN || !this.settleOff) this.settle();
    if (L.wings) this.wingsClear();
  }
  /* A cat's own wings give way to its arms (Yoeshi, 2026-11-10: the bat wings fluttered into the arms): each wing is a
     sheet swept round from the shoulder blade, so where an elbow or wrist comes within an arm's thickness of it the wing
     folds back about its root until it is clear, quickly, and opens again slowly once the arm has gone. */
  wingsClear() { const b = this.b, P = WV[0], Q = WV[1], ex = WV[2], ey = WV[3], n = WV[4], first = this._wf === undefined; this._wf = 1;
    this.wings.forEach((w, i) => { const s = i ? 1 : -1; let need = 0;
      for (let it = 0; it < 3; it++) { w.rotation.y = w.userData.beat + s * need; w.updateMatrix(); w.matrix.extractBasis(ex, ey, n); let add = 0;
        for (const sd of ["L", "R"]) { const sh = b["sh" + sd], el = b["el" + sd], wr = b["wr" + sd]; sh.updateMatrix(); el.updateMatrix();
          for (const k of [0, 1, 2]) { if (k < 2) P.copy(k ? wr.position : el.position); else P.copy(wr.position).multiplyScalar(1.45);   /* the elbow, the wrist, the paw beyond it */
            if (k) P.applyMatrix4(el.matrix); P.applyMatrix4(sh.matrix); Q.copy(P).sub(w.position); const u = Q.dot(ex) * s, v = Q.dot(ey), d = Q.dot(n);
            if (u > 0.05 && u < 2.3 && v > -0.6 && v < 1.5 && d < 0.2 && d > -0.9) add = Math.max(add, (0.2 - d) / Math.max(0.35, u)); } }
        need = Math.min(1.5, need + add); if (add < 0.01) break; }
      const f = w.userData.fold || 0; w.userData.fold = first ? need : f + (need - f) * (need > f ? 0.5 : 0.06); w.rotation.y = w.userData.beat + s * w.userData.fold; }); }
  /* the ears' frames for a hat's holes (wardrobe.js): the head's world-to-local, each ear's head-to-ear and its size,
     refreshed every frame so a hole follows a flick. Shared by every material of every hat this cat wears. */
  earUniforms() { if (!this.earU) { this.earU = { uHeadInv: { value: new THREE.Matrix4() }, uEarInv: { value: [new THREE.Matrix4(), new THREE.Matrix4()] }, uEarS: { value: [new THREE.Vector3(), new THREE.Vector3()] } }; this.earFrames(); } return this.earU; }
  earFrames() { const U = this.earU; this.b.head.updateWorldMatrix(true, false); U.uHeadInv.value.copy(this.b.head.matrixWorld).invert();
    this.ears.forEach((e, i) => { e.updateMatrix(); U.uEarInv.value[i].copy(e.matrix).invert(); const z = e.userData.ear;
      U.uEarS.value[i].set(this.L.ears === "Folded" ? 1e-4 : z.h, z.r, 0.025 + (this.L.furLen || 0) * 0.15); }); }   // a folded ear lies under its hat: no hole for it

  /* singing: how open the mouth is (0..1.2) and the vowel's shape ("a" open, "e" wide, "o" round); puff fills the cheeks (a sax) */
  sing(open, vow = "a", puff = 0) { this.mouth.to = open; this.mouth.toVow = vow; this.mouth.puff = puff; }

  /* aim the laser eyes at a point in the world */
  laserAt(P) { for (const g of this.lasers || []) g.lookAt(P); }
  /* a point on the torso, or the garment over it, in the hips' frame at rest: height y, angle a round it (0 the front, +
     toward its left), lifted off it by lift (what the neck wears sits on it: wardrobe.js addNeck) */
  surface(y, a, lift = 0, out = new THREE.Vector3()) { const bw = this.L.bw, pr = this.prof, r = profR(pr, Math.min(Math.max(y, pr[0][1] + 1e-3), pr[pr.length - 1][1] - 1e-3)) + this.profFur;
    return out.set((r * bw + lift) * Math.sin(a), y, (r * 0.86 * bw + lift) * Math.cos(a)); }
  /* what fur may not grow through, at rest: each mesh of obj (a hat) as a box in the cat's rest space, or all of obj as one
     ball (an eye); near one, every coat material presses its fur flat to fit the gap (coat.js) */
  cover(obj, ball) {
    const C = this.L.cov, B = new THREE.Box3(), U = new THREE.Box3(), M = new THREE.Matrix4(), inv = new THREE.Matrix4().copy(this.root.matrixWorld).invert(); obj.updateMatrixWorld(true);
    const put = (b, r) => { if (C.n.value > 11) return; const h = b.getSize(V[1]).multiplyScalar(0.5), c = b.getCenter(V[2]), i = C.n.value++; C.c.value[i].set(c.x, c.y, c.z, r ? Math.max(h.x, h.y, h.z) : 0.02); C.h.value[i].copy(r ? V[3].set(0, 0, 0) : h); };
    obj.traverse((o) => { if (!o.isMesh || o.isInstancedMesh) return; o.geometry.computeBoundingBox(); B.copy(o.geometry.boundingBox).applyMatrix4(M.multiplyMatrices(inv, o.matrixWorld));
      if (ball) U.union(B); else { const z = B.getSize(V[1]); if (z.x * z.y * z.z > 0.0032) { put(B); (this.hats || (this.hats = [])).push(new THREE.Box3().copy(o.geometry.boundingBox).applyMatrix4(M.copy(this.b.head.matrixWorld).invert().multiply(o.matrixWorld))); } } });
    if (ball) put(U, 1);
  }
  /* how far a world point is outside the torso (negative inside): its lathe profile, scaled to the build */
  /* the capes and skirts take a step (after update() and whatever poses the cat after it, with the world's matrices current): { t, wind } */
  drape(dt, o) { if (this.cloth) this.cloth.step(dt, o); }
  get k() { const e = this.root.matrixWorld.elements, k = Math.hypot(e[0], e[1], e[2]); return Math.abs(k - 1) < 1e-6 || !k ? 1 : k; }   // exactly 1 at life size, so a turned cat solves exactly as before   // the cat's size in the world (1 at life size): the solver's lengths follow it
  /* a bone's world-to-local matrix, worked out once per solve */
  inv(k) { const c = this._ic || (this._ic = {}), e = c[k] || (c[k] = { n: -1, m: new THREE.Matrix4() }); if (e.n !== SDF.n) { e.n = SDF.n; this.b[k].updateWorldMatrix(true, false); e.m.copy(this.b[k].matrixWorld).invert(); } return e.m; }
  bodyDist(P) { const l = SDF.on ? V[6].copy(P).applyMatrix4(this.inv("hips")) : this.b.hips.worldToLocal(V[6].copy(P)), bw = this.L.bw, r = profR(this.prof, l.y);
    return r ? (Math.hypot(l.x / bw, l.z / (0.86 * bw)) - r - this.profFur) * 0.86 * bw * this.k : this.k; }
  /* reach: a paw to a point in the world, after update(). Two bones, solved exactly, with the whole arm kept out of the
     body and out of whatever it plays. cols: signed distances to the instrument's solids (world point -> how far outside,
     negative inside; instruments.js). o.grip: solids the paw itself may close round (a neck it holds); o.out: the way the
     paw lifts off if it would sink in (a guitar's face); o.touch: how far its fur may press. First the paw is lifted
     clear; then the elbow tries 36 angles round the shoulder-to-paw line (nearest the pole and its last angle first) and
     keeps the one where the upper arm and the forearm, at their real thickness, clear everything; if none does, the paw
     lifts a little further off, until one does. */
  reach(...a) { const was = SDF.on; SDF.on = true; SDF.n++; try { return this.solveArm(...a); } finally { SDF.on = was; } }
  solveArm(side, target, pole, wristX = 0, cols = [], o = {}) {
    const [nu, nl, nw] = o.bones || ["sh" + side, "el" + side, "wr" + side], sh = this.b[nu], el = this.b[nl], K = this.k, [a, b] = (o.len || [0.5 * this.armK, 0.42 * this.armK + 0.06]).map((x) => x * K), R0 = o.r || this.armR, R = { up: R0.up * K, fore: R0.fore * K, paw: R0.paw * K }, grip = o.grip || [];   // an arm, or with o.bones/len/r any two-bone limb (a leg)
    const S = sh.getWorldPosition(V[0]), T = V[7].copy(target), q = V[11], E = V[10], soft = o.soft ?? 0.35; let out = o.out ? V[8].copy(o.out).normalize() : null;
    const inst = (P, skip) => { let d = 9; for (const c of cols) if (!skip || !skip.includes(c)) d = Math.min(d, c(P)); return d; };
    const pawD = (P) => Math.min(this.bodyDist(P), inst(P, grip)) - R.paw + (o.touch ?? 0.04) * K;
    for (let i = 0; i < 8; i++) { const d = pawD(T); if (d >= 0) break; let n = out;   // the paw: lifted clear
      if (!n) { const e = 0.02 * K, f = (k) => { q.copy(T); q.setComponent(k, q.getComponent(k) + e); return pawD(q); }; n = V[12].set(f(0), f(1), f(2)).addScalar(-d).normalize(); }
      T.addScaledVector(n, 0.006 * K - d); }
    if (!out && o.lift) { const e = 0.03 * K, f = (k) => { q.copy(T); q.setComponent(k, q.getComponent(k) + e); return pawD(q); }, d0 = pawD(T); out = V[8].set(f(0) - d0, f(1) - d0, f(2) - d0).normalize(); }   // which way is away from everything
    const prev = this.swivel[nu] || 0, best = { c: Infinity }, near = !globalThis.PRANCER_GEN && this.fast && this.swivel[nu] !== undefined, NK = near ? 9 : 36;   // fast (a crowd's far cat): only near last frame's answer
    const solve = (Tp, lift) => {
      const dir = V[1].copy(Tp).sub(S); let d = dir.length(); dir.normalize(); d = clamp(d, 0.1 * K, a + b - 0.003 * K);
      const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x)), p0 = V[2].copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize(), p1 = V[9].crossVectors(dir, p0).normalize(), Tl = V[4].copy(S).addScaledVector(dir, d);
      for (let k = 0; k < NK; k++) { const ang = near ? prev + (k - 4) * Math.PI / 18 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 18, da = Math.abs(ang - prev);
        E.copy(S).addScaledVector(dir, x).addScaledVector(p0, h * Math.cos(ang)).addScaledVector(p1, h * Math.sin(ang));
        let pi = 0, pb = 0;
        for (let u = 0.3; u < 1.01; u += 0.14) { q.lerpVectors(S, E, u); pi += Math.max(0, R.up - inst(q)); if (u > 0.7) pb += Math.max(0, R.up * soft - this.bodyDist(q)); }
        for (let u = 0.14; u < 0.99; u += 0.14) { q.lerpVectors(E, Tl, u); pi += Math.max(0, R.fore - inst(q, u > 0.65 && grip)); pb += Math.max(0, R.fore * soft - this.bodyDist(q)); }   // a wrist wraps what its paw holds
        const p = pi + pb;
        const c = p / K * 9 + Math.abs(ang) * 0.004 + Math.min(da, 6.283 - da) * 0.01 + lift / K * 0.6;
        if (c < best.c) { best.c = c; best.p = p; best.pi = pi; best.pb = pb; best.a = ang; if (!globalThis.PRANCER_GEN) { best.lift = lift; best.short = Math.max(0, Tp.distanceTo(S) - a - b); } V[3].copy(E); V[13].copy(Tl); } } };
    solve(T, 0);
    if (best.p > 0.002 * K && out) { V[14].copy(T); for (const l0 of near ? [0.08, 0.19] : [0.04, 0.08, 0.13, 0.19, 0.26, 0.34]) { const lift = l0 * K; V[15].copy(V[14]).addScaledVector(out, lift); if (V[15].distanceTo(S) > a + b) break; solve(V[15], lift); if (best.p <= 0.002 * K) break; } }   // never lifted past where the arm reaches
    this.swivel[nu] = best.a; if (!globalThis.PRANCER_GEN) (this.last || (this.last = {}))[side] = best;   // what it had to give up, for tools/armlab
    if (o.keep) {   // turn the bones the least way onto the new line: the twist the move gave them (which way the paw faces) stays
      const turn = (bone, from, to) => { QD.setFromUnitVectors(from, to).multiply(bone.getWorldQuaternion(QW)); bone.quaternion.copy(bone.parent.getWorldQuaternion(QQ).invert().multiply(QD)); bone.updateMatrixWorld(true); };
      turn(sh, el.getWorldPosition(V[5]).sub(S).normalize(), V[6].copy(V[3]).sub(S).normalize());
      turn(el, this.b[nw].getWorldPosition(V[5]).sub(V[3]).normalize(), V[6].copy(V[13]).sub(V[3]).normalize()); return; }
    sh.parent.getWorldQuaternion(QQ).invert(); sh.quaternion.setFromUnitVectors(DOWN, V[5].copy(V[3]).sub(S).normalize().applyQuaternion(QQ)); sh.updateMatrixWorld(true);
    sh.getWorldQuaternion(QQ).invert(); el.quaternion.setFromUnitVectors(DOWN, V[5].copy(V[13]).sub(V[3]).normalize().applyQuaternion(QQ)); el.updateMatrixWorld(true);
    this.b[nw].rotation.set(wristX, 0, 0);
  }
  /* the paw closing: its toes swing in toward the pad to close round a thing of radius r (the cat's own units; pocket()
     says how far they turn); null opens the paw flat again. firm: a little more or less than that */
  curl(side, k) { const u = this.pawMat && this.pawMat[side].userData.u.uGrip.value; if (u) u.set(k > 1e-3 ? k / 0.12 : 0, -0.08, 0.035, k); }   // the toes turned in by k (radians), nothing held
  grip(side, r, firm = 1) { const u = this.pawMat[side].userData.u.uGrip.value; if (r === null || r === undefined) { u.x = 0; return; } const th = pocket(r).turn * firm; u.set(th / 0.12, -0.08, 0.035, th); }
  /* hold: the paw closes round a thing in the world. g.axis = [A, B]: the thing's line (world) and g.r its radius there
     (a neck, a stick, a cup; 0 for a card); the paw comes to it from g.from (default: its shoulder's side), the thing in
     the pocket under its toes (pocket(): a thin thing under the curled toes, a wide one back against the pads), the
     wrist turned so the thing lies across the palm and the pad faces it. g.at: where along the line (0..1; default:
     nearest the shoulder). Or g.point and g.normal: a surface pressed with the paw open (a key, a drum head). Then
     whatever reach() takes: pole, cols, grip, out, touch, soft, lift. Returns where the palm's centre went. */
  hold(side, g) {
    const K = this.k, S = this.b["sh" + side].getWorldPosition(H[0]), from = H[1], ax = H[2].set(0, 0, 0), C = H[3], T = H[4], r = g.r || 0, pk = pocket(r / K);
    if (g.axis) { const [A, B] = g.axis; ax.copy(B).sub(A); const L = ax.length() || 1e-6; ax.divideScalar(L); const uN = clamp(H[5].copy(S).sub(A).dot(ax) / L, 0, 1);   // uN: the point of the line nearest the shoulder
      const place = (u) => { C.copy(A).addScaledVector(ax, u * L);
        if (g.from) from.copy(g.from); else from.copy(S).sub(C); from.addScaledVector(ax, -from.dot(ax)); if (from.lengthSq() < 1e-8) from.set(0, 1, 0); from.normalize();
        const up = H[6].copy(S).sub(C); up.addScaledVector(ax, -up.dot(ax)).addScaledVector(from, -up.dot(from)); if (up.lengthSq() < 1e-8) up.set(0, 1, 0); up.normalize();   // up the forearm, near enough: the palm's centre sits that way from the thing
        return T.copy(C).addScaledVector(from, pk.z * K).addScaledVector(up, pk.y * K).distanceTo(S); };
      /* out of reach there: the paw takes the thing nearer its shoulder (a short arm on a wide cat slides along it to the
         first point it can hold), never stretched straight toward it, which put the paw inside the chest */
      const Lmax = (0.92 * this.armK + 0.04) * K, u = g.at !== undefined ? g.at : uN;
      if (place(u) > Lmax && Math.abs(uN - u) > 1e-4) { let lo = u, hi = uN; for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (place(m) > Lmax) lo = m; else hi = m; } place(hi); } }
    else { from.copy(g.normal).normalize(); T.copy(g.point).addScaledVector(from, 0.19 * K + (g.touch ?? 0.01) * K); }
    const pole = g.pole || H[7].copy(from).multiplyScalar(0.4).add(H[6].set(0, -1, 0)).normalize();
    this.reach(side, T, pole, 0, g.cols || [], { grip: g.grip, out: g.out, touch: g.touch ?? 0.04, soft: g.soft ?? 0.35, lift: g.lift });
    /* the wrist: x across the palm (the thing's line), z off the pad (the way the paw came), y up the forearm as far as those allow */
    const el = this.b["el" + side], wr = this.b["wr" + side], E = el.getWorldPosition(H[5]), W = wr.getWorldPosition(H[8]), f = H[9].copy(E).sub(W).normalize(), z = H[10].copy(from), x = H[11], y = H[13];
    if (g.axis) { x.copy(ax); if (H[12].crossVectors(z, x).dot(f) < 0) x.negate(); } else { y.copy(f).addScaledVector(z, -f.dot(z)); if (y.lengthSq() < 1e-6) y.set(0, 1, 0); y.normalize(); x.crossVectors(y, z).normalize(); }
    y.crossVectors(z, x).normalize(); z.crossVectors(x, y).normalize();
    const bend = Math.acos(clamp(y.dot(f), -1, 1)); if (bend > 1.35) { const n = H[12].crossVectors(y, f); if (n.lengthSq() > 1e-8) { QD.setFromAxisAngle(n.normalize(), bend - 1.35); x.applyQuaternion(QD); y.applyQuaternion(QD); z.applyQuaternion(QD); } }   // a wrist bends only so far: past that the paw leans back toward the forearm
    MW.makeBasis(x, y, z); QW.setFromRotationMatrix(MW); wr.quaternion.copy(el.getWorldQuaternion(QQ).invert().multiply(QW)); wr.updateMatrixWorld(true);
    this.grip(side, g.axis ? r / K : null, g.firm);
    return T; }
  /* how far a world point is outside the head (negative inside): its scaled sphere and fur, and any hat on it */
  headDist(P) { const l = SDF.on ? X[2].copy(P).applyMatrix4(this.inv("head")) : this.b.head.worldToLocal(X[2].copy(P)), f = this.L.furLen || 0, rx = 1.11 * this.L.cw + f, ry = 0.92 + f, rz = 0.9 + f;
    let d = (Math.hypot(l.x / rx, l.y / ry, l.z / rz) - 1) * Math.min(rx, ry, rz);
    for (const bx of this.hats || []) { const c = bx.getCenter(X[3]), h = bx.getSize(X[4]).multiplyScalar(0.5), x = Math.abs(l.x - c.x) - h.x, y = Math.abs(l.y - c.y) - h.y, z = Math.abs(l.z - c.z) - h.z;
      d = Math.min(d, Math.hypot(Math.max(x, 0), Math.max(y, 0), Math.max(z, 0)) + Math.min(Math.max(x, y, z), 0)); }
    return d * this.k; }
  /* after a pose: no arm passes through the head, an ear, the hat, a leg or the other arm (or deep into the body). An arm
     that does is solved again to where its paw was going, round them, keeping the move's twist; one that does not is left
     exactly as the move made it */
  settle() { const was = SDF.on; SDF.on = true; SDF.n++; try { this.settleArms(); } finally { SDF.on = was; } }
  settleArms() {
    this.root.updateMatrixWorld(true); const b = this.b, K = this.k, R = { up: this.armR.up * K, fore: this.armR.fore * K, paw: this.armR.paw * K }, P = (o) => o.getWorldPosition(new THREE.Vector3());
    const ears = this.ears.map((e) => [e.localToWorld(new THREE.Vector3(0, 0.05, 0)), e.localToWorld(new THREE.Vector3(0, 0.45, 0))]), K1 = 0.1 * K;
    const legs = ["L", "R"].map((s) => [P(b["th" + s]), P(b["kn" + s]), P(b["an" + s])]), lr = (0.2 * Math.min(this.L.bw, 1.25) + (this.L.pants ? 0 : this.L.furLen || 0)) * K;
    for (const s of ["R", "L"]) { const o = s === "R" ? "L" : "R", oS = P(b["sh" + o]), oE = P(b["el" + o]), oW = P(b["wr" + o]);
      const cols = [(Q) => this.headDist(Q), (Q) => Math.min(...ears.map(([a, c]) => capD(Q, a, c, K1))), (Q) => this._together ? capD(Q, oS, oE, R.up * 0.85) : Math.min(capD(Q, oS, oE, R.up * 0.85), capD(Q, oE, oW, R.fore * 0.85), capD(Q, oW, oW, R.paw * 0.8)),   /* in a clap or a heart the paws and forearms meet */
        (Q) => Math.min(...legs.map(([h, k, a]) => Math.min(capD(Q, h, k, lr), capD(Q, k, a, lr * 0.8))))];
      const S = P(b["sh" + s]), E = P(b["el" + s]), W = P(b["wr" + s]), T = W.clone().addScaledVector(W.clone().sub(E).normalize(), 0.06 * K), inst = (Q) => Math.min(...cols.map((c) => c(Q)));
      let pen = Math.max(0, R.paw - 0.04 * K - Math.min(inst(T), this.bodyDist(T)));
      for (let u = 0.3; u <= 1.001; u += 0.14) { const q = V[11].lerpVectors(S, E, u); pen += Math.max(0, R.up - inst(q)) + (u > 0.7 ? Math.max(0, R.up * 0.8 - this.bodyDist(q)) : 0); }
      for (let u = 0.14; u <= 1.001; u += 0.14) { const q = V[11].lerpVectors(E, T, u); pen += Math.max(0, R.fore - inst(q)) + Math.max(0, R.fore * 0.8 - this.bodyDist(q)); }
      if (pen > 0.01 * K) this.reach(s, T, E.sub(S), 0, cols, { keep: 1, touch: 0.04, soft: 0.8, lift: 1 }); }
  }

  /* the emotes: wave, the Posey Paw, paws up, dance, knead, spin, clap, heart hands, sway. f(o) sets the face */
  emote(E, u, w, t, f) {
    const b = this.b, mix = (bone, axis, v) => { bone.rotation[axis] = lerp(bone.rotation[axis], v, w); }, add = (bone, axis, v) => { bone.rotation[axis] += v * w; };
    const bt = this._beat ?? t * 1.9, bph = ((bt % 1) + 1) % 1;   // the beat: the song's when the show gives it, else a steady 114 a minute
    const sit = (k) => {   /* sat down as a plush toy sits: the seat on the floor, the legs out in front in a soft V, heels down, toes up; the
         upright build has no haunches to fold, so a squat read as hovering */
      b.hips.position.y -= 0.6 * k * w; b.hips.position.z -= 0.05 * k * w; add(b.hips, "x", -0.08 * k);
      for (const [s, sd] of [["L", 1], ["R", -1]]) { b["th" + s].rotation.x = lerp(b["th" + s].rotation.x, -1.42, w * w);   /* the thighs rise behind the drop: rising first, they swing into the belly */ mix(b["th" + s], "z", sd * 0.42 * Math.min(this.L.bw, 1.2)); mix(b["kn" + s], "x", 0.12); mix(b["an" + s], "x", -0.25); }
      add(b.chest, "x", 0.06);
      for (const sk of this.skirts || []) sk.scale.set(1 + 0.55 * k * w, 1 - 0.58 * k * w, 1 + 0.55 * k * w); this.capeU.sit.value = k * w; };   /* a skirt sat on pools on the floor round the cat, as a seated doll's dress does, the legs out over it */
    if (E === "wave") { mix(b.shR, "x", -2.7); mix(b.shR, "z", -0.35 + 0.35 * Math.sin(t * 10)); mix(b.elR, "x", -0.35); mix(b.wrR, "x", -0.3); add(b.head, "z", -0.12); f({ happy: 0.8, pupil: 0.7 }); }
    else if (E === "posey") {   /* the Posey Paw: sat down, the right paw fully out and level, as painted, the left resting on the lap, looking to her right */
      sit(1); add(b.chest, "x", 0.05); mix(b.shR, "x", -1.6); mix(b.shR, "z", -0.5); mix(b.elR, "x", 0.02); mix(b.wrR, "x", -0.3);
      this.root.updateMatrixWorld(true); { const K = this.k, lr = (0.2 * Math.min(this.L.bw, 1.25) + (this.L.pants ? 0 : this.L.furLen || 0)) * K, C = b.chest,
        on = b.thL.getWorldPosition(new THREE.Vector3()).lerp(b.knL.getWorldPosition(new THREE.Vector3()), 0.4); on.x -= 0.05 * K; on.y += lr + this.armR.paw * K * 0.9;
        const from = b.wrL.getWorldPosition(new THREE.Vector3()); this.reach("L", from.lerp(on, w), C.localToWorld(new THREE.Vector3(1.2, -0.4, -0.6)).sub(C.getWorldPosition(new THREE.Vector3())).normalize(), 0, [], { soft: 0.3 });
        b.wrL.rotation.set(0.9 * w, 0, 0); this.curl("L", 0.3 * w); }
      add(b.neck, "y", -0.4); add(b.head, "y", -0.55); add(b.head, "z", -0.1); add(b.head, "x", -0.12); add(b.chest, "y", -0.1);
      this.tails.forEach((chain) => chain.forEach((l, i) => add(l, "y", i < 3 ? 0.35 : 0.15))); f({ look: new THREE.Vector2(-0.3, -0.02), pupil: 0.45 }); }
    else if (E === "pawsup") { for (const [sh, s] of [[b.shL, 1], [b.shR, -1]]) { mix(sh, "x", -2.85); mix(sh, "z", 0.4 * s + 0.15 * Math.sin(t * 9 + s)); } mix(b.elL, "x", -0.2); mix(b.elR, "x", -0.2);
      b.hips.position.y += Math.abs(Math.sin(t * 6)) * 0.12 * w; f({ happy: 1, pupil: 0.9 }); }
    else if (E === "dance") { const beat = bt * Math.PI; this.curl("L", 0.55 * w); this.curl("R", 0.55 * w);   // loose fists
      b.hips.position.y += Math.abs(Math.sin(beat)) * 0.14 * w; add(b.hips, "z", Math.sin(beat) * 0.12); add(b.chest, "z", -Math.sin(beat) * 0.18); add(b.head, "z", Math.sin(beat) * 0.15);
      mix(b.shL, "x", -1.4 - 1.0 * Math.max(0, Math.sin(beat))); mix(b.shR, "x", -1.4 - 1.0 * Math.max(0, -Math.sin(beat))); mix(b.elL, "x", -1.0); mix(b.elR, "x", -1.0);
      add(b.thL, "x", -0.35 * Math.max(0, Math.sin(beat))); add(b.thR, "x", -0.35 * Math.max(0, -Math.sin(beat))); f({ happy: 0.7, pupil: 0.85 }); }
    else if (E === "knead") {   /* making biscuits on its own lap: sat down, the paws pressing on the thighs in turn, toes spread as each one presses
         and curled as it lifts, the body rocking into the pressing paw, eyes shut */
      sit(1); this.root.updateMatrixWorld(true); const K = this.k, lr = (0.2 * Math.min(this.L.bw, 1.25) + (this.L.pants ? 0 : this.L.furLen || 0)) * K, C = b.chest, ph = t * 4.2;
      for (const [side, sd] of [["L", 1], ["R", -1]]) { const p = Math.sin(ph + (sd > 0 ? 0 : Math.PI)), down = Math.max(0, p), up = Math.max(0, -p);
        const th = b["th" + side].getWorldPosition(new THREE.Vector3()), kn = b["kn" + side].getWorldPosition(new THREE.Vector3()), on = th.lerp(kn, 0.42 - 0.08 * up);
        on.x += -sd * 0.05 * K; on.y += lr + this.armR.paw * K * 0.9 + 0.16 * up * K;
        const wr = b["wr" + side], from = wr.getWorldPosition(new THREE.Vector3());
        this.reach(side, from.lerp(on, w), C.localToWorld(new THREE.Vector3(sd * 1.2, -0.4, -0.6)).sub(C.getWorldPosition(new THREE.Vector3())).normalize(), 0, [], { soft: 0.3 });
        wr.rotation.set((0.9 - 0.5 * up) * w, 0, 0); this.curl(side, 0.85 * up * w); }
      const rock = Math.sin(ph); add(b.chest, "z", -0.07 * rock); add(b.chest, "x", 0.12); add(b.head, "z", 0.06 * rock); add(b.head, "x", 0.08);
      b.chest.position.x += Math.sin(t * 60) * 0.004 * w; f({ lid: 0.88, happy: 1 }); }
    else if (E === "clap" || E === "heart") {   // in front of the chest: a clap on the beat (pads together), or the paws curled into a heart, pads out
      const heart = E === "heart", sep = heart ? 0 : 0.42 * Math.pow(Math.sin(Math.PI * bph), 0.8), lift = heart ? 0.32 + 0.03 * Math.sin(t * 3) : 0.05;
      this.root.updateMatrixWorld(true); this._together = true; const C = b.chest, R0 = this.armR.paw, bw = this.L.bw, z = 0.42 * 0.86 * bw + (this.profFur || 0) + R0 + (heart ? 0.14 : 0.12);   // just clear of the chest, where these arms reach; the paws may meet (settle lets them)
      for (const [side, s] of [["L", 1], ["R", -1]]) { const wr = b["wr" + side], from = wr.getWorldPosition(new THREE.Vector3()), to = C.localToWorld(new THREE.Vector3(s * ((0.2 + (this.L.furLen || 0)) * (heart ? 0.8 : 0.95) + sep), lift, z));   // the paws' own size (the mitt and its fur): they touch
        this.reach(side, from.lerp(to, w), C.localToWorld(new THREE.Vector3(s * 1.2, -0.7, -0.3)).sub(C.getWorldPosition(new THREE.Vector3())).normalize(), 0, [], { soft: 0.3 });
        wr.rotation.set(heart ? -0.6 * w : 0, (heart ? -0.35 : 1.45) * s * w, 0); this.curl(side, (heart ? 0.9 : 0.1) * w); }
      if (!heart) add(b.head, "x", 0.06 * Math.exp(-bph * 6)); b.hips.position.y += (heart ? 0.03 * Math.sin(t * 3) : 0.04 * Math.exp(-bph * 5)) * w;
      f(heart ? { happy: 1, pupil: 1 } : { happy: 0.8, pupil: 0.8 }); }
    else if (E === "sway") { const k = Math.sin(bt * Math.PI / 2);   // paws up in a V, the whole cat swaying from side to side over two beats: the slow songs' lighters up
      for (const [sh, s] of [[b.shL, 1], [b.shR, -1]]) { mix(sh, "x", -2.7); mix(sh, "z", 0.45 * s + 0.22 * k); }
      mix(b.elL, "x", -0.15); mix(b.elR, "x", -0.15); add(b.hips, "z", 0.08 * k); add(b.chest, "z", 0.12 * k); add(b.head, "z", -0.1 * k); f({ happy: 0.6, lid: 0.35 }); }
    else if (E === "spin") { const k = smooth(u / 1.4); this.root.userData.spin = k * TAU * w; mix(b.shL, "z", 1.3); mix(b.shR, "z", -1.3); f({ happy: 0.6, pupil: 1 }); }
  }
}
