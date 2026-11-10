/* Prancer 3D: hats and things held, for any Prancer (the generator, the playground, the band). Hats sit on the head bone
   and move with it; a held thing sits in the right paw and stays upright whatever the wrist does. Each prop is a nod to
   a chapter or to the Portraits' "Holding" trait: Prancer Post's newspaper, a heART Tarot card, a Tez coin, and the
   Portraits' boba, fish, yarn, rose, donut, ice cream, balloon, lollipop and wand.
     addHat(avatar, kind, colours)   addProp(avatar, kind)   holdPose(avatar)  (each frame, after update) */
import * as THREE from "three";
import { pocket } from "./avatar.js";

const M = (c, r = 0.6, m = 0, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, metalness: m, ...o });
const add = (parent, geo, mat, p = [0, 0, 0], rot = [0, 0, 0], sc) => { const o = new THREE.Mesh(geo, mat); o.position.set(...p); o.rotation.set(...rot); if (sc) o.scale.set(...sc); o.castShadow = true; parent.add(o); return o; };
const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const TAU = Math.PI * 2;
/* the head's own shape (avatar headGeo, before the width gene, which the hat group adds), grown by a factor: for things that hug it (a cowl, a headcloth) */
const cheekK = (v) => { const a = 1 - Math.hypot((Math.abs(v.x) - 0.75) / 0.45, (v.y + 0.25) / 0.4), b = (v.z + 0.3) / 0.5, sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }; return 1 + 0.1 * sm(a) * sm(b); };
const headShape = (geo, R) => { const p = geo.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.x *= 1.06 * R * cheekK(v); v.y *= 0.92 * R; v.z *= 0.94 * R; if (v.z > 0.6) v.z = 0.6 + (v.z - 0.6) * 0.75; if (v.y < -0.55) v.y = -0.55 + (v.y + 0.55) * 0.8; p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); return geo; };
const headPt = (d, R) => { const v = new THREE.Vector3(...d).normalize(); v.x *= 1.06 * R * cheekK(v); v.y *= 0.92 * R; v.z *= 0.94 * R; if (v.z > 0.6) v.z = 0.6 + (v.z - 0.6) * 0.75; if (v.y < -0.55) v.y = -0.55 + (v.y + 0.55) * 0.8; return v; };

export const HATS = ["Beanie", "Cap", "Top Hat", "Crown", "Party Hat", "Beret", "Wizard Hat", "Headphones", "Cowboy Hat", "Flower Crown", "Bucket Hat", "Chef Hat", "Propeller Cap", "Pirate Hat", "Viking Helmet", "Hood", "Gladiator's Helm", "Ribbon Bow", "Guardian Cowl", "Fedora", "Nemes"];
const MANE_UP = { "Top Hat": 0.24, Crown: 0.24, "Party Hat": 0.24, Beret: 0.26, "Chef Hat": 0.22, "Flower Crown": 0.14 };
/* headwear that covers the ears has ears of its own: a closed peak h tall whose foot flares into what it stands on,
   a little smaller for small or folded ears and larger for big ones (as the Astronaut's helmet, outfits.js) */
const PEAK = (h) => new THREE.LatheGeometry([[0.46, -0.17], [0.37, -0.07], [0.3, 0.02], [0.25, 0.14 * h / 0.64], [0.17, 0.32 * h / 0.64], [0.09, 0.5 * h / 0.64], [0.03, 0.6 * h / 0.64], [0, h]].map(([r, y]) => new THREE.Vector2(r, y)), 28);
const EARK = (av) => ({ Folded: 0.82, Small: 0.82, Round: 0.9, Huge: 1.14, "Tall Tufted": 1.08 })[av.L.ears] || 1;
export function addHat(av, kind, [c1 = "#3a7bd5", c2 = "#ffd36e"] = []) {
  const g = new THREE.Group(), cw = av.L.cw; g.name = "hat"; av.b.head.add(g); const k1 = M(c1, 0.8, 0, { sheen: 1, sheenColor: new THREE.Color(c1).lerp(new THREE.Color("#fff"), 0.4) }), gold = M("#e8bf4e", 0.22, 1);
  if (kind === "Beanie") { add(g, new THREE.SphereGeometry(1.0, 40, 20, 0, TAU, 0, Math.PI / 2), k1, [0, 0.18, -0.02], [-0.12, 0, 0], [1.07, 0.82, 1.0]);
    add(g, new THREE.TorusGeometry(1.0, 0.09, 12, 48), M(c2, 0.85), [0, 0.2, -0.02], [Math.PI / 2 - 0.12, 0, 0], [1.07, 1.0, 1]); add(g, new THREE.SphereGeometry(0.2, 16, 12), M(c2, 0.95), [0, 1.02, -0.12]); }
  if (kind === "Cap") { add(g, new THREE.SphereGeometry(0.98, 40, 20, 0, TAU, 0, Math.PI / 2), k1, [0, 0.3, -0.05], [-0.1, 0, 0], [1.04, 0.62, 1.0]);
    add(g, new THREE.CylinderGeometry(0.62, 0.62, 0.04, 32, 1, false, -Math.PI / 2, Math.PI), M(c2, 0.7), [0, 0.36, 0.55], [0.12, 0, 0], [1, 1, 1.2]); add(g, new THREE.SphereGeometry(0.06, 10, 8), M(c2), [0, 0.92, -0.15]); }
  if (kind === "Top Hat") { const h = M("#141218", 0.5, 0, { sheen: 0.6 }); add(g, new THREE.CylinderGeometry(0.34, 0.31, 0.62, 32), h, [0, 1.19, -0.05], [-0.08, 0, 0.06]);   /* smaller (Yoeshi), sitting between the ears */
    add(g, new THREE.CylinderGeometry(0.5, 0.5, 0.04, 40), h, [0, 0.9, -0.03], [-0.08, 0, 0.06]); add(g, new THREE.CylinderGeometry(0.345, 0.345, 0.1, 32, 1, true), M(c1, 0.7), [0, 0.97, -0.04], [-0.08, 0, 0.06]); }
  if (kind === "Crown") { const r = add(g, new THREE.CylinderGeometry(0.42, 0.4, 0.24, 32, 1, true), gold, [0, 0.98, 0]); r.material.side = THREE.DoubleSide;
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(g, new THREE.ConeGeometry(0.08, 0.22, 8), gold, [Math.sin(a) * 0.41, 1.2, Math.cos(a) * 0.41]); add(g, new THREE.SphereGeometry(0.05, 10, 8), M(["#e0115f", "#3fa9ff", "#2fbf71"][i % 3], 0.1, 0, { clearcoat: 1 }), [Math.sin(a) * 0.43, 0.98, Math.cos(a) * 0.43]); } }
  if (kind === "Party Hat") { const t = tex(128, 256, (x, w, h) => { x.fillStyle = c1; x.fillRect(0, 0, w, h); x.fillStyle = c2; for (let i = -h; i < h; i += 40) { x.save(); x.translate(0, i); x.rotate(-0.5); x.fillRect(-w, 0, w * 3, 14); x.restore(); } });
    add(g, new THREE.ConeGeometry(0.32, 0.85, 32), M("#fff", 0.6, 0, { map: t }), [0.2, 1.28, 0], [0, 0, -0.25]); add(g, new THREE.SphereGeometry(0.1, 12, 10), M(c2, 0.95), [0.39, 1.68, 0]); }
  if (kind === "Beret") { add(g, new THREE.SphereGeometry(0.54, 32, 16), k1, [0.04, 1.0, -0.08], [0.12, 0, -0.18], [1, 0.3, 1]); add(g, new THREE.CylinderGeometry(0.02, 0.03, 0.12, 8), k1, [0.05, 1.18, -0.08]); }   /* perched between the ears: a beret cut by an ear at its rim left a sliver of cloth floating past it */
  if (kind === "Wizard Hat") { const h = M(c1 === "#e9e4d8" ? "#3b2a6e" : c1, 0.75, 0, { sheen: 0.5 }); const cone = add(g, new THREE.ConeGeometry(0.5, 1.35, 32), h, [-0.08, 1.55, -0.15], [-0.18, 0, 0.12]);   /* its base centred on the brim (it leaned off to one side of it) */
    add(g, new THREE.CylinderGeometry(1.0, 1.3, 0.11, 48), h, [0, 0.88, -0.03], [-0.1, 0, 0.05]); g.userData.seam = "#e2b44a";   /* a wide brim, drooping a little: each ear passes through the cloth itself, with a whole seam round it in the band's gold (Yoeshi, 2026-11-10: at 0.85 the ears bit notches out of its rim) */ { const band = new THREE.Mesh(new THREE.TorusGeometry(0.478, 0.04, 8, 40), gold); band.position.y = -0.585; band.rotation.x = Math.PI / 2; band.castShadow = true; cone.add(band); }   /* the gold band rides the cone itself, where it meets the brim (Yoeshi, 2026-11-10: it sat off the rim, at the brim's tilt and not the cone's) */
    for (let i = 0; i < 4; i++) add(g, new THREE.OctahedronGeometry(0.05), gold, [Math.sin(i * 1.7) * 0.28, 1.2 + i * 0.22, 0.25 - i * 0.07]); }
  if (kind === "Headphones") {   /* true form (Yoeshi 2026-11-07: behind the ears): a padded band that follows the head's own shape over the back, behind the ears on
       every head, a soft cushion under it; meeting oval cups, each with a cushion ring on the head and a coloured plate outside */
    const R = 1.06 + (av.L.furLen || 0) * 0.55, p = M("#1a1820", 0.35, 0.2, { clearcoat: 1 }), cu = M("#34313c", 0.9), arc = (k, r, m) => add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => { const a = (i / 12 - 0.5) * 2.7, c = Math.cos(a); return headPt([Math.sin(a), 0.8 * c, -0.62 * c], R * k); })), 40, r, 8), m);
    arc(1.06, 0.075, p); arc(1.0, 0.055, cu);   // the band, and its cushion under it
    for (const s of [-1, 1]) { const c = headPt([s, 0.04, -0.12], R);
      add(g, new THREE.TorusGeometry(0.21, 0.07, 10, 28), cu, [c.x + s * 0.03, c.y, c.z], [0, Math.PI / 2, 0], [1.2, 1, 1]);   // the cushion ring, on the head
      add(g, new THREE.SphereGeometry(0.27, 28, 16), p, [c.x + s * 0.12, c.y, c.z], [0, 0, 0], [0.42, 1.2, 1]);   // the oval cup
      add(g, new THREE.CylinderGeometry(0.13, 0.13, 0.02, 28), M(c1, 0.4), [c.x + s * 0.23, c.y, c.z], [0, 0, Math.PI / 2], [1.2, 1, 1]);   // its plate
    } }
  if (kind === "Cowboy Hat") { const h = M("#8a5a32", 0.85, 0, { sheen: 0.6 }); const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(new THREE.Vector2(0.35 + u * 0.85, 0.12 * Math.pow(u, 3))); }
    const brim = add(g, new THREE.LatheGeometry(pts, 40), h, [0, 0.88, -0.02], [-0.06, 0, 0]); brim.material.side = THREE.DoubleSide; brim.scale.set(1, 1, 0.9);
    add(g, new THREE.CylinderGeometry(0.4, 0.46, 0.5, 32), h, [0, 1.12, -0.03], [-0.06, 0, 0], [1, 1, 0.85]); add(g, new THREE.CylinderGeometry(0.465, 0.465, 0.1, 32, 1, true), M("#3a2214"), [0, 0.95, -0.03], [-0.06, 0, 0], [1, 1, 0.85]); }
  if (kind === "Flower Crown") { add(g, new THREE.TorusGeometry(0.72, 0.04, 8, 48), M("#3f9a5a"), [0, 0.78, 0], [Math.PI / 2 - 0.15, 0, 0]);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, f = new THREE.Group(); f.position.set(Math.sin(a) * 0.72, 0.78 + Math.cos(a) * 0.1, Math.cos(a) * 0.72); g.add(f); const col = ["#ff8fb3", "#ffd36e", "#b48cff", "#ffffff"][i % 4];
      for (let k = 0; k < 5; k++) add(f, new THREE.SphereGeometry(0.07, 8, 6), M(col, 0.7), [Math.cos(k / 5 * TAU) * 0.07, 0.03, Math.sin(k / 5 * TAU) * 0.07], [0, 0, 0], [1, 0.5, 1]); add(f, new THREE.SphereGeometry(0.045, 8, 6), M("#ffd36e"), [0, 0.06, 0]); } }
  if (kind === "Bucket Hat") { add(g, new THREE.CylinderGeometry(0.5, 0.62, 0.4, 32), k1, [0, 1.0, -0.04], [-0.08, 0, 0]); add(g, new THREE.CylinderGeometry(0.62, 1.16, 0.27, 40, 1, true), M(c1, 0.8, 0, { side: THREE.DoubleSide }), [0, 0.7, -0.04], [-0.08, 0, 0]); }   /* a wider brim: the ears pass through it whole (at 0.92 they bit notches out of its rim, as the Wizard Hat's did) */
  if (kind === "Chef Hat") { const w = M("#f8f6f0", 0.9, 0, { sheen: 0.6 }); add(g, new THREE.CylinderGeometry(0.42, 0.42, 0.4, 32), w, [0, 1.04, -0.05]);
    for (let i = 0; i < 5; i++) add(g, new THREE.SphereGeometry(0.3, 16, 12), w, [Math.sin(i / 5 * TAU) * 0.22, 1.36, Math.cos(i / 5 * TAU) * 0.22 - 0.05]); add(g, new THREE.SphereGeometry(0.3, 16, 12), w, [0, 1.5, -0.05]); }
  if (kind === "Pirate Hat") {   // the Portraits' bicorne (the band's horn player Leo wears it too): black with a gold edge and a little white crossbones
    const h = M("#16131a", 0.55, 0, { sheen: 0.5, side: THREE.DoubleSide }), sh = new THREE.Shape(); sh.moveTo(-1.05, 0); sh.quadraticCurveTo(-0.9, 0.42, -0.3, 0.6); sh.quadraticCurveTo(0, 0.7, 0.3, 0.6); sh.quadraticCurveTo(0.9, 0.42, 1.05, 0); sh.quadraticCurveTo(0, 0.2, -1.05, 0);
    const hf = h.clone(); hf.userData.whole = 1;   /* the front board stands in front of the ears: no openings in it (the ears' openings, reaching forward, bit steps out of its lower edge) */
    const front = add(g, new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 16 }), hf, [0, 0.88, 0.12], [-0.12, 0, 0.04], [1, 1, 1]);
    add(g, new THREE.SphereGeometry(0.62, 32, 16, 0, TAU, 0, Math.PI / 2), h, [0, 0.86, -0.12], [-0.12, 0, 0.04], [1.05 * cw, 0.75, 0.95]);
    const edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sh.getPoints(24).slice(0, 25).map((p) => new THREE.Vector3(p.x, p.y, 0.12))), 48, 0.025, 6), gold); front.add(edge);
    const bone = M("#f6f2ea", 0.5); add(front, new THREE.SphereGeometry(0.075, 14, 10), bone, [0, 0.36, 0.13], [0, 0, 0], [1, 0.95, 0.5]);
    for (const s of [-1, 1]) add(front, new THREE.CapsuleGeometry(0.018, 0.18, 4, 8), bone, [0, 0.27, 0.13], [0, 0, s * 0.8]); }
  if (kind === "Propeller Cap") {   /* four panels, a stem, a propeller that spins (the Portraits' cap, panel colours as drawn) */
    for (const [i, c] of ["#ff3b3b", "#ffd23f", "#3fa9ff", "#3fe07a"].entries()) add(g, new THREE.SphereGeometry(0.98, 12, 20, i * Math.PI / 2, Math.PI / 2, 0, Math.PI / 2), M(c, 0.8, 0, { sheen: 0.6 }), [0, 0.3, -0.05], [-0.1, 0, 0], [1.04, 0.62, 1.0]);
    add(g, new THREE.TorusGeometry(0.98, 0.02, 6, 48), M("#2a2a33", 0.7), [0, 0.3, -0.05], [Math.PI / 2 - 0.1, 0, 0], [1.04, 1, 1]);   // the seam round the rim
    add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), M("#8f9aa8", 0.4, 0.6), [0, 0.98, -0.1]); const prop = add(g, new THREE.CylinderGeometry(0.34, 0.34, 0.025, 24), M("#ff3b3b", 0.6), [0, 1.08, -0.1], [0, 0, 0], [1, 1, 0.16]);
    g.userData.tick = (t) => { prop.rotation.y = t * 9; }; }   // spins (avatar.update); still on a captured cover
  if (kind === "Viking Helmet") {   /* a steel dome, a riveted brown band, two cream horns sweeping up from the sides */
    add(g, new THREE.SphereGeometry(0.98, 36, 20, 0, TAU, 0, Math.PI / 2), M("#9aa5b4", 0.35, 0.7), [0, 0.3, -0.05], [-0.1, 0, 0], [1.04, 0.66, 1.0]);
    add(g, new THREE.TorusGeometry(0.99, 0.06, 10, 48), M("#b07228", 0.8), [0, 0.3, -0.05], [Math.PI / 2 - 0.1, 0, 0], [1.04, 1, 1]);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; add(g, new THREE.SphereGeometry(0.035, 8, 6), gold, [Math.sin(a) * 1.03, 0.3 + Math.cos(a) * 0.1, Math.cos(a) * 0.99 - 0.05]); }
    for (const s of [-1, 1]) { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.92, 0.5, -0.05), new THREE.Vector3(s * 1.16, 0.66, -0.05), new THREE.Vector3(s * 1.24, 0.92, -0.05), new THREE.Vector3(s * 1.14, 1.16, -0.05)]);   /* horns, not antlers: shorter and tapering */
      const tg = new THREE.TubeGeometry(c, 16, 0.09, 10), tp = tg.attributes.position, tc = new THREE.Vector3(); for (let k = 0; k < tp.count; k++) { const u = Math.floor(k / 11) / 16; c.getPointAt(Math.min(1, u), tc); tp.setXYZ(k, tc.x + (tp.getX(k) - tc.x) * (1 - 0.75 * u), tc.y + (tp.getY(k) - tc.y) * (1 - 0.75 * u), tc.z + (tp.getZ(k) - tc.z) * (1 - 0.75 * u)); } tg.computeVertexNormals();
      add(g, tg, M("#f3ead6", 0.5)); add(g, new THREE.SphereGeometry(0.09, 10, 8), M("#f3ead6", 0.5), [s * 0.92, 0.5, -0.05]); } }
  if (kind === "Hood") {   /* the Star Monk's hood: part of the robe (Yoeshi: one layer, no rim), the cowl drawn up over the head. One shell in the robe's
    brown round the back and top of the head, open at the face, falling past the chin to the shoulders where it meets the robe; two peaks of its own over the ears, which stay inside */
    const h = M("#6b4a2e", 0.9, 0, { side: THREE.DoubleSide }), P0 = Math.PI * 0.8, PL = Math.PI * 1.4, fu = av.L.furLen || 0, HY = (Math.min(1.18, 0.99 + fu * 0.6) - 0.06) / 1.12, HX = 1.13 + fu * 0.8;   /* fitted (Yoeshi, 2026-11-10): the crown down on the head with no hollow above it, and wide enough at the sides that the cheeks stay inside the cloth */
    add(g, new THREE.SphereGeometry(1.12, 40, 24, P0, PL, 0, Math.PI * 0.62), h, [0, 0.06, -0.08], [0, 0, 0], [HX, HY, 1.0]);
    const cowl = add(g, new THREE.LatheGeometry([new THREE.Vector2(1.12 * Math.sin(Math.PI * 0.62), 0.06 + 1.12 * HY * Math.cos(Math.PI * 0.62)), new THREE.Vector2(1.08, -0.78), new THREE.Vector2(1.2, -1.3)], 40, P0 - Math.PI / 2, PL), h, [0, 0, -0.08], [0, 0, 0], [HX, 1, 1]);   // from the shell's rim down past the chin to the shoulders (a lathe's phi starts a quarter back from a sphere's)
    cowl.geometry.computeVertexNormals();
    /* the hood's own peaks (Yoeshi, 2026-11-10: "apply the new logic from the astronaut's helmet": the cat's ears showed inside
       the copies that stood over them): the cat's ears tuck away under the cloth, and the hood rises into two closed peaks of its own */
    for (const e of av.ears || []) { e.visible = false; const sx = Math.sign(e.position.x) || 1, v = new THREE.Vector3(sx * 0.5, 0.82, -0.08).normalize(), pk = add(g, PEAK(0.64), h, [v.x * 1.12 * HX, 0.06 + v.y * 1.12 * HY - 0.03, -0.08 + v.z * 1.12], [-0.1, 0, -0.46 * sx], [EARK(av), EARK(av), EARK(av) * 0.55]); pk.castShadow = true; } }   // the hood's ear peaks
  if (kind === "Gladiator's Helm") {   /* a bronze dome, a riveted brow band and the crest: red plumes along the top from brow to nape (no nose guard: it read as a rod down the face, 2026-11-07) */
    const br = M("#d99a3e", 0.3, 0.8); add(g, new THREE.SphereGeometry(0.98, 36, 20, 0, TAU, 0, Math.PI / 2), br, [0, 0.32, -0.05], [-0.1, 0, 0], [1.04, 0.66, 1.0]);
    add(g, new THREE.TorusGeometry(0.99, 0.06, 10, 48), M("#b07228", 0.7, 0.3), [0, 0.32, -0.05], [Math.PI / 2 - 0.1, 0, 0], [1.04, 1, 1]); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; add(g, new THREE.SphereGeometry(0.035, 8, 6), gold, [Math.sin(a) * 1.03, 0.32 + Math.cos(a) * 0.1, Math.cos(a) * 0.99 - 0.05]); }
    for (let i = 0; i <= 14; i++) { const a = Math.PI * (0.08 + i / 14 * 0.84), r = 1.0, y = 0.32 + Math.sin(a) * 0.66 * r - 0.03, z = Math.cos(a) * r - 0.05, ht = 0.34 + 0.05 * (i % 2);
      add(g, new THREE.BoxGeometry(0.07, ht, 0.11), M(i % 3 ? "#c4222f" : "#e0424e", 0.85), [0, y + ht * 0.45 * Math.sin(a), z + ht * 0.45 * Math.cos(a) * 0.5], [-(a - Math.PI / 2) * 0.6 - 0.1, 0, 0]); } }   // the crest
  if (kind === "Ribbon Bow") {   /* a pink bow on the left of the head, as the knight wears it: two loops, a knot, two tails */
    const b = new THREE.Group(), d = new THREE.Vector3(0.52, 0.72, 0.46).normalize(), k = 1 / Math.hypot(d.x / (1.06 * cw), d.y / 0.92, d.z / 0.94), fu = (av.L.furLen || 0) * 0.6; b.position.copy(d).multiplyScalar(k + fu + 0.04); b.position.x /= cw; b.rotation.set(0.3, 0.35, -0.55); g.add(b);   /* on the head's surface (its ellipsoid and its fur), not floating beside it */ const pk = M("#ff8fc0", 0.6, 0, { sheen: 0.8 });
    for (const s of [-1, 1]) add(b, new THREE.TorusGeometry(0.17, 0.07, 10, 20), pk, [s * 0.2, 0.02, 0], [0.2, 0, 0], [1.2, 0.8, 0.5]);
    add(b, new THREE.SphereGeometry(0.075, 12, 10), M("#ffb3d4", 0.6), [0, 0, 0.02]); for (const s of [-1, 1]) add(b, new THREE.BoxGeometry(0.08, 0.3, 0.02), pk, [s * 0.07, -0.2, 0.0], [0, 0, s * 0.25]); }
  if (kind === "Guardian Cowl") {   /* the Night Guardian's: a matte cowl over the whole head, open at the muzzle and round the eyes (each eye ringed in a faint moonlit line), down the back of the neck;
    tall sheaths over the ears that move with them. The cut-out is in its shader: the head's own eyes and muzzle show through */
    const fu = av.L.furLen || 0, ink = M("#1d202b", 0.55, 0.15, { sheen: 0.5, sheenColor: new THREE.Color("#4a5470"), side: THREE.DoubleSide }), R = 1.0 + 0.05 + fu * 0.55;
    ink.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vCowl;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvCowl = position;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vCowl;").replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
      { vec3 p = vCowl; vec2 e = vec2(abs(p.x) - 0.37, p.y - 0.07); if (p.z > 0.3 && dot(e / vec2(0.27, 0.23), e / vec2(0.27, 0.23)) < 1.0) discard;
        if (p.z > 0.2 && p.y < -0.12 - 0.5 * max(0.0, abs(p.x) - 0.42)) discard; }`); };
    ink.customProgramCacheKey = () => "cowl";
    add(g, headShape(new THREE.SphereGeometry(1, 64, 40, 0, TAU, 0, Math.PI * 0.86), R), ink);   /* the head's own shape, out past its fur */
    const rim = M("#a9c8ff", 0.3, 0, { emissive: "#7fb0ff", emissiveIntensity: 0.9 });
    for (const s of [-1, 1]) { const ring = add(g, new THREE.TorusGeometry(1, 0.016, 6, 40), rim, [s * 0.37, 0.07, 0.86 + fu * 0.3], [0, s * 0.3, 0], [0.27, 0.23, 1]); ring.renderOrder = 1; }
    /* the cowl's own ears: tall closed sheaths rising out of the cowl, the cat's ears tucked away inside (they were copies on the ears themselves, open behind) */
    for (const e of av.ears || []) { e.visible = false; const sx = Math.sign(e.position.x) || 1, P = headPt([sx * 0.5, 0.82, -0.08], R), pk = add(g, PEAK(0.98), M("#1d202b", 0.55, 0.15, { sheen: 0.5, sheenColor: new THREE.Color("#4a5470") }), [P.x, P.y - 0.03, P.z], [-0.1, 0, -0.42 * sx], [EARK(av), EARK(av), EARK(av) * 0.5]); pk.castShadow = true; } }
  if (kind === "Fedora") {   /* the Adventurer's: brown felt, the crown creased down the middle and pinched at the front, a dark band, the brim up at the sides and down at the front; worn a little rakish */
    const felt = M("#6e4a2e", 0.85, 0, { sheen: 0.8, sheenColor: new THREE.Color("#a07a54") }), hg = new THREE.Group(); hg.position.set(0, 0.8, -0.04); hg.rotation.set(-0.1, 0, 0.07); hg.scale.set(1.12, 1.05, 1.0); g.add(hg);
    const crown = new THREE.LatheGeometry([[0.0, 0.5], [0.2, 0.52], [0.36, 0.47], [0.44, 0.32], [0.46, 0.0]].map(([r, y]) => new THREE.Vector2(r, y)), 64), cp = crown.attributes.position;
    for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), k = Math.max(0, (y - 0.3) / 0.22); cp.setY(i, y - 0.09 * k * Math.exp(-(x * x) / 0.02)); }   /* the crown dented softly down its middle, front to back */
    crown.computeVertexNormals(); add(hg, crown, felt);
    const brim = new THREE.RingGeometry(0.44, 1.1, 56, 4), bp = brim.attributes.position; brim.rotateX(-Math.PI / 2);
    for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), z = bp.getZ(i), r = Math.hypot(x, z), k = Math.max(0, (r - 0.46) / 0.64); bp.setY(i, 0.2 * k * k * (x * x) / (r * r) - 0.08 * k * Math.max(0, z / r)); }
    brim.computeVertexNormals(); add(hg, brim, M("#6e4a2e", 0.85, 0, { sheen: 0.8, sheenColor: new THREE.Color("#a07a54"), side: THREE.DoubleSide })); add(hg, new THREE.CylinderGeometry(0.462, 0.47, 0.11, 48, 1, true), M("#2a1a10", 0.6), [0, 0.06, 0]); }
  if (kind === "Nemes") {   /* the Sphinx's royal headcloth, one cloth: close over the crown in gold and lapis stripes, cut straight across the brow, open at the face, falling
    behind the cheeks and flaring into its two wings over the shoulders, the lappets coming forward over the chest; bound in gold all round its edge, the royal cat at the brow, the queue behind; the ears through gold-bound openings */
    const fu = av.L.furLen || 0, R = 1.05 + fu * 0.55, goldM = M("#e8bf4e", 0.22, 1), n = 46, m = 81, THB = Math.PI * 0.34, TH = Math.PI * 0.6, vH = 0.58, EF = Math.PI * 0.31, EL = Math.PI * 0.2;
    const XB = 1.58, ZB = 0.7, ZF = 0.72, sm = (x) => x * x * (3 - 2 * x);
    const dir = (th, ph) => [Math.sin(ph) * Math.sin(th), Math.cos(th), Math.cos(ph) * Math.sin(th)], phiOf = (t, e) => (t < 0 ? -1 : 1) * (e + (Math.PI - e) * (1 - Math.abs(t)));
    const pt = (v, t, open) => { if (v <= vH) { const th = v / vH * TH, e = th < THB || (th === THB && !open) ? 0 : EF; return headPt(dir(th, phiOf(t, e)), R); }
      const k = (v - vH) / (1 - vH), e = EF + (EL - EF) * sm(k), ph = phiOf(t, e), P0 = headPt(dir(TH, ph), R), c = Math.cos(ph), B = new THREE.Vector3(Math.sin(ph) * XB * (c >= 0 ? 1 : 1 - 0.5 * Math.pow(-c, 1.3)), c > 0 ? -1.12 - 0.5 * Math.pow(c, 1.6) : -1.12 - 0.16 * -c, c * (c > 0 ? ZF : ZB));   /* the hem: low in front (the lappets), cut high at the wings, gathered in at the back */
      return P0.lerp(B, sm(k)).addScaledVector(new THREE.Vector3(Math.sin(ph), 0, Math.cos(ph) * 0.6), 0.06 * Math.sin(Math.PI * k)); };   // from the head's side out to the shoulders, bellied a little
    const vs = []; for (let j = 0; j < n; j++) vs.push(j / (n - 1)); const vb = THB / TH * vH; let jb = vs.findIndex((v) => v > vb); vs.splice(jb, 0, vb, vb);   // two rows at the brow: one closed across the forehead, one open at the face
    const rows = vs.map((v, j) => Array.from({ length: m }, (_, i) => pt(v, i / (m - 1) * 2 - 1, j === jb + 1)));
    const P = [], U = [], I = [], w = m; rows.forEach((r, j) => r.forEach((q, i) => { P.push(q.x, q.y, q.z); U.push(i / (m - 1), 1 - vs[j]); if (i && j) { const a = (j - 1) * w + i - 1, b = a + 1, c = j * w + i - 1, d = c + 1; I.push(a, c, b, b, c, d); } }));
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2)); geo.setIndex(I); geo.computeVertexNormals();
    const stripes = tex(64, 1024, (x, w2, h) => { const N = 44; for (let j = 0; j < N; j++) { x.fillStyle = j % 2 ? "#1f4fa8" : "#e2b44a"; x.fillRect(0, j * h / N, w2, h / N + 1); } x.fillStyle = "rgba(255,255,255,.06)"; for (let j = 0; j < N; j += 2) x.fillRect(0, j * h / N, w2, 2); });
    const cloth = add(g, geo, M("#ffffff", 0.42, 0.3, { map: stripes, side: THREE.DoubleSide, clearcoat: 0.4, clearcoatRoughness: 0.3 }));
    /* the gold binding: down the left edge, across the brow, down the right edge; and along the hem */
    const edge = (t) => rows.slice(jb + 1).map((r) => r[t < 0 ? 0 : m - 1].clone()), brow = []; for (let i = 0; i <= 24; i++) brow.push(headPt(dir(THB, -EF + 2 * EF * i / 24), R + 0.012));
    const bind = [add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([...edge(-1).reverse(), ...brow.slice(1, -1), ...edge(1)]), 220, 0.042, 8), goldM), add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rows[rows.length - 1]), 120, 0.04, 8), goldM)];
    /* with cloth (drape.js) the headcloth is sewn close down to the cheeks and loose below: its wings and lappets hang from the head, sway with it, and a raised arm pushes them aside (Yoeshi, 2026-11-10: the arms went through). Its gold binding rides the cloth.
       The cloth is cut at the head's own width, so the solver measures it true (the hat's group is scaled by the head's width after) */
    if (av.cloth) { for (const o of [cloth, ...bind]) { o.geometry.scale(cw, 1, 1); o.scale.x = 1 / cw; }
      const part = av.cloth.add(cloth, m, rows.length, { pin: vs.findIndex((v) => v > vH) - 1, soft: 0.16, pow: 1.6, arms: 1, over: 1, pad: 0.06, lag: 0.8, damp: 0.84, fly: 0.2, wind: 0.25, stiff: (x, y, z) => z < 0 ? 0.92 : z < 0.3 ? 0.6 : 0 }); for (const o of bind) av.cloth.follow(o, part); }
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(brow.map((q) => headPt(dir(THB - 0.07, Math.atan2(q.x, q.z)), R + 0.02))), 48, 0.03, 8), goldM);   // a second fine band above the brow
    const em = new THREE.Group(); em.position.copy(headPt(dir(THB - 0.12, 0), R + 0.04)); em.rotation.x = -0.35; g.add(em);   // the royal cat at the brow, a carnelian at its heart
    add(em, new THREE.SphereGeometry(0.1, 16, 12), goldM, [0, 0.08, 0]); for (const s2 of [-1, 1]) add(em, new THREE.ConeGeometry(0.045, 0.1, 8), goldM, [s2 * 0.06, 0.18, 0], [0, 0, -s2 * 0.3]); add(em, new THREE.CapsuleGeometry(0.06, 0.12, 4, 10), goldM, [0, -0.06, -0.02]);
    add(em, new THREE.SphereGeometry(0.035, 10, 8), M("#d23a2a", 0.15, 0, { emissive: "#a11a10", emissiveIntensity: 0.6, clearcoat: 1 }), [0, -0.05, 0.05]);
    { const bq = rows[rows.length - 1][(m - 1) / 2]; add(g, new THREE.CylinderGeometry(0.13, 0.08, 0.5, 16), M("#ffffff", 0.42, 0.3, { map: stripes, clearcoat: 0.4 }), [bq.x, bq.y - 0.2, bq.z + 0.05], [-0.12, 0, 0]); add(g, new THREE.TorusGeometry(0.11, 0.03, 8, 20), goldM, [bq.x, bq.y - 0.42, bq.z + 0.08], [Math.PI / 2 - 0.12, 0, 0]); }   // the queue, gathered behind
    /* the Nemes' own ears (Yoeshi, 2026-11-10: "one more pass on the sphinx": the cat's ears came through openings that gaped behind them): the cat's ears tuck away under the cloth, which rises into two closed peaks in its own stripes, each bound in gold at its foot */
    for (const e of av.ears || []) { e.visible = false; const sx = Math.sign(e.position.x) || 1, P = headPt([sx * 0.5, 0.82, -0.08], R), pk = add(g, PEAK(0.7), M("#ffffff", 0.42, 0.3, { map: stripes, clearcoat: 0.4, clearcoatRoughness: 0.3 }), [P.x, P.y - 0.03, P.z], [-0.1, 0, -0.44 * sx], [EARK(av), EARK(av), EARK(av) * 0.55]); pk.castShadow = true;
      const bd = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.03, 8, 28), goldM); bd.rotation.x = Math.PI / 2; bd.position.y = -0.03; pk.add(bd); } }
  if (av.L.mane && MANE_UP[kind]) g.position.y += MANE_UP[kind];   // a small hat sits on top of a mane, not in a hollow in it (avatar.js closes the mane under these)
  g.scale.x = cw;   // a hat as wide as the head it sits on (the head's width gene; its depth and height do not change)
  if (kind !== "Hood" && kind !== "Beret" && kind !== "Guardian Cowl" && kind !== "Nemes") earHoles(av, g);   // and holes where the ears pass through it (a hood covers them, with peaks of its own; a beret sits between them, and an ear flicking at its rim cut a sliver of cloth loose)
  av.cover(g);   // the fur under it lies pressed flat: nothing grows through the hat
  return g;
}
/* the ear holes: every material of the hat discards what lies inside either ear's tapered ellipse (the ear's own shape,
   following a flick: avatar.earUniforms), so an ear passes through a brim, a dome or a band through a cut-out that fits
   it, never through the cloth. The seam that binds each opening is the cloth itself (Yoeshi, 2026-11-09: a seam is
   "fully part of the cloth"; a ring set beside the cut stayed behind when the ear flicked): the same material draws a
   band round the cut, darker than the cloth or in the colour the hat names (the Nemes: gold), from the ear out past the
   margin, so it hugs the ear and moves with the opening. One program for every hat material (customProgramCacheKey). */
export function earHoles(av, g) { const U = av.earUniforms(), done = new Set(), sc = g.userData.seam ? new THREE.Color(g.userData.seam) : null, seam = { value: sc ? new THREE.Vector4(sc.r, sc.g, sc.b, 1) : new THREE.Vector4() };
  g.traverse((o) => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { if (done.has(m) || m.userData.whole) continue; done.add(m);
    m.onBeforeCompile = (s) => { Object.assign(s.uniforms, U); s.uniforms.uSeam = seam;
      s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vHatW;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvHatW = (modelMatrix * vec4(position, 1.0)).xyz;");
      s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nuniform mat4 uHeadInv, uEarInv[2]; uniform vec3 uEarS[2]; uniform vec4 uSeam; varying vec3 vHatW;")
        .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
        float seamK = 0.0; { vec3 ph = (uHeadInv * vec4(vHatW, 1.0)).xyz;
          for (int i = 0; i < 2; i++) { vec3 pe = (uEarInv[i] * vec4(ph, 1.0)).xyz; float h = uEarS[i].x, r = uEarS[i].y, mg = uEarS[i].z, t = pe.y / h;
            if (t > -0.12 && t < 1.1) { float k = max(0.25, 1.0 - 0.8 * clamp(t, 0.0, 1.0)), sx = r * k, sz = (pe.z > 0.0 ? 0.2 : 0.3) * r * k, c = mg * 0.4, b = mg + 0.03;
              if (length(vec2(pe.x / (sx + c), pe.z / (sz + c))) < 1.0) discard; seamK = max(seamK, 1.0 - smoothstep(0.93, 1.0, length(vec2(pe.x / (sx + b), pe.z / (sz + b))))); } } }`)
        .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, uSeam.w > 0.5 ? uSeam.rgb : diffuseColor.rgb * 0.55 + 0.012, seamK);"); };
    m.customProgramCacheKey = () => "earseams"; m.needsUpdate = true; } });
  if (av.L.ears === "Folded") { av.root.updateMatrixWorld(true); const meshes = []; g.traverse((o) => { if (o.isMesh) meshes.push(o); }); const ray = new THREE.Raycaster();
    const sides = meshes.map((m) => [m, [].concat(m.material).map((x) => x.side)]); for (const m of meshes) for (const x of [].concat(m.material)) x.side = THREE.DoubleSide;   /* the test looks out from inside the hat: it must see its inner faces too */
    const HC = av.b.head.getWorldPosition(new THREE.Vector3()); for (const e of av.ears || []) { const EP = e.localToWorld(new THREE.Vector3(0, 0.2, 0)), dd = EP.clone().sub(HC), L0 = dd.length(); ray.set(HC, dd.normalize()); const h = ray.intersectObjects(meshes, false)[0]; if (h && h.distance < L0 + 0.6) e.visible = false; }   /* a folded ear the hat covers lies tucked under it (it showed through the cloth): the hat lies across its line from the head's centre */
    for (const [m, sd] of sides) [].concat(m.material).forEach((x, i) => (x.side = sd[i])); } }

/* neckwear (the Portraits' Neckwear), on the torso or the garment over it (avatar.surface), on the hips, so it moves with
   the body as the clothes do: a chain, pearls and a lei drape in a loop lowest at the front; a collar and a scarf wrap the
   neck; a bow tie, a bandana and a medal sit on the chest. As drawn in prancer-pfp (NECK), in 3D. */
export const NECKS = ["Gold Chain", "Bandana", "Collar", "Flower Lei", "Gold Medal", "Bow Tie", "Pearls", "Scarf"];
const cloth = (c) => M(c, 0.82, 0, { sheen: 1, sheenColor: new THREE.Color(c).lerp(new THREE.Color("#fff"), 0.4), side: THREE.DoubleSide });
const sheet = (rows) => { const P = [], I = [], w = rows[0].length;   // a cloth from rows of points (each row the same length)
  rows.forEach((r, j) => r.forEach((p, i) => { P.push(p.x, p.y, p.z); if (i && j) { const a = (j - 1) * w + i - 1, b = a + 1, c = j * w + i - 1, d = c + 1; I.push(a, c, b, b, c, d); } }));
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); return g; };
export function addNeck(av, kind, [c1 = "#3a7bd5", c2 = "#ff5fa8"] = []) {
  if (!NECKS.includes(kind)) return null; const g = new THREE.Group(); g.name = "neck"; av.b.hips.add(g);
  const Y = 1.1, gold = M("#e8bf4e", 0.22, 1), at = (y, a, lift) => av.surface(y, a, lift);
  const loop = (drop, lift, n) => Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU - Math.PI; return at(Y - drop * Math.pow(Math.max(0, Math.cos(a)), 1.5), a, lift); });   // round the neck, lowest at the front
  const along = (curve, n, geo, mat, place, uOf = (i) => i / n) => { const m = new THREE.InstancedMesh(geo, mat, n), X = new THREE.Matrix4(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), Pp = new THREE.Vector3(), Sc = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < n; i++) { const u = uOf(i); curve.getPointAt(u, Pp); curve.getTangentAt(u, T); N.set(Pp.x, 0, Pp.z).normalize(); B.crossVectors(T, N).normalize(); N.crossVectors(B, T).normalize(); place(i, X.makeBasis(T, B, N).setPosition(Pp)); m.setMatrixAt(i, X); }   // place: changes in the thing's own frame (x along, z out)
    m.castShadow = true; g.add(m); return m; };
  if (kind === "Gold Chain") { const c = new THREE.CatmullRomCurve3(loop(0.26, 0.03, 48), true); const link = new THREE.TorusGeometry(0.022, 0.0075, 6, 12);
    along(c, 70, link, gold, (i, X) => { X.multiply(new THREE.Matrix4().makeScale(1.45, 1, 1)); if (i % 2) X.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)); }); }   // links, every other one turned a quarter
  if (kind === "Pearls") along(new THREE.CatmullRomCurve3(loop(0.21, 0.06, 48), true), 46, new THREE.SphereGeometry(0.032, 12, 8), M("#fffaf2", 0.28, 0, { clearcoat: 1, iridescence: 0.5, sheen: 1, sheenColor: new THREE.Color("#ffffff"), emissive: "#fff6ea", emissiveIntensity: 0.12 }), () => {});
  if (kind === "Flower Lei") { const c = new THREE.CatmullRomCurve3(loop(0.3, 0.07, 48), true), cols = ["#ff6f91", "#ffd23f", "#ffffff", "#b48cff"], n = 26;
    const petals = along(c, n * 5, new THREE.SphereGeometry(0.045, 10, 8), M("#ffffff", 0.7), (i, X) => { const k = i % 5, a = k / 5 * TAU; X.multiply(new THREE.Matrix4().makeTranslation(Math.cos(a) * 0.045, Math.sin(a) * 0.045, 0)).multiply(new THREE.Matrix4().makeScale(1, 1, 0.45)); }, (i) => Math.floor(i / 5) / n);   // five petals round each flower
    for (let i = 0; i < n * 5; i++) petals.setColorAt(i, new THREE.Color(cols[Math.floor(i / 5) % 4])); petals.instanceColor.needsUpdate = true;
    along(c, n, new THREE.SphereGeometry(0.028, 8, 6), M("#ffd23f", 0.6), (i, X) => X.multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.02))); }
  if (kind === "Collar" || kind === "Scarf") { const sc = kind === "Scarf", c = new THREE.CatmullRomCurve3(loop(sc ? 0.03 : 0, sc ? 0.07 : 0.035, 48), true);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 96, sc ? 0.08 : 0.042, 10, true), sc ? cloth(c2) : M(c1, 0.45, 0, { clearcoat: 0.6 })));
    if (!sc) { const f = at(Y, 0, 0.035), ring = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 14), gold); ring.position.copy(f).add(new THREE.Vector3(0, -0.05, 0.035)); g.add(ring);
      const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.014, 20).rotateX(Math.PI / 2), gold); tag.position.copy(f).add(new THREE.Vector3(0, -0.12, 0.04)); g.add(tag); }   // the tag on its ring, hanging from the front of the collar
    else g.add(new THREE.Mesh(sheet(Array.from({ length: 9 }, (_, j) => { const y = Y - 0.05 - j * 0.05, a = 0.38 - j * 0.015; return [at(y, a - 0.17, 0.1 - j * 0.004), at(y, a + 0.17, 0.1 - j * 0.004)]; })), cloth(c2))); }   // the tail, down the chest
  if (kind === "Bandana") { const rows = Array.from({ length: 8 }, (_, j) => { const v = j / 7, y = Y - 0.02 - v * 0.4, h = 1.05 * (1 - v) + 0.02; return Array.from({ length: 13 }, (_, i) => at(y, h * (i / 6 - 1), 0.04)); });
    g.add(new THREE.Mesh(sheet(rows), cloth(c2))); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rows[0]), 32, 0.03, 6), cloth(new THREE.Color(c2).multiplyScalar(0.7).getStyle()))); }
  if (kind === "Bow Tie") { const pal = ["#c8102e", "#111114", c2], c = pal[[...String(av.L.name || "")].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % 3], m = cloth(c), p = at(Y - 0.04, 0, 0.06);
    const wing = new THREE.Shape(); wing.moveTo(0, 0); wing.lineTo(0.17, 0.08); wing.quadraticCurveTo(0.2, 0, 0.17, -0.08); wing.lineTo(0, 0);
    for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.ExtrudeGeometry(wing, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 8 }), m); w.position.copy(p); w.scale.x = s; g.add(w); }
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), cloth(new THREE.Color(c).multiplyScalar(0.8).getStyle())); k.position.copy(p).add(new THREE.Vector3(0, 0, 0.03)); g.add(k); }
  if (kind === "Gold Medal") { const lowY = 0.82, rib = (s, col, w, lift) => new THREE.Mesh(sheet(Array.from({ length: 10 }, (_, j) => { const t = j / 9, y = Y - (Y - lowY) * t, a = s * (0.75 - 0.69 * t); return [at(y, a - w, lift), at(y, a + w, lift)]; })), cloth(col));
    for (const s of [-1, 1]) { g.add(rib(s, "#c8102e", 0.08, 0.035)); g.add(rib(s, "#3a7bd5", 0.055, 0.04)); }   // red edged blue ribbons, as drawn
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.025, 28).rotateX(Math.PI / 2), gold); d.position.copy(at(lowY - 0.1, 0, 0.07)); g.add(d);
    const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 0.03 : 0.07; i ? st.lineTo(Math.cos(a) * q, Math.sin(a) * q) : st.moveTo(Math.cos(a) * q, Math.sin(a) * q); }
    const sm = new THREE.Mesh(new THREE.ShapeGeometry(st), M("#fff3b0", 0.4)); sm.position.copy(d.position).add(new THREE.Vector3(0, 0, 0.014)); g.add(sm); }
  return g;
}

export const PROPS = ["Newspaper", "Tarot Card", "Tez Coin", "Boba Tea", "Fish", "Yarn Ball", "Rose", "Donut", "Ice Cream", "Balloon", "Lollipop", "Magic Wand", "Coffee", "Pizza", "Plasma Blade", "Gladius", "Blaster", "Enchanted Blade", "Crescent", "Golden Idol", "Golden Ankh"];
export function addProp(av, kind, opts = {}) {
  const hold = new THREE.Group(), g = new THREE.Group(); hold.name = "held"; av.b.wrR.add(hold); hold.add(g); g.position.y = -0.08; g.scale.setScalar(1.5);   // chibi paws, readable props
  if (kind === "Newspaper") { const t = tex(512, 256, (x, w, h) => { x.fillStyle = "#f2ede2"; x.fillRect(0, 0, w, h); x.fillStyle = "#1a1a1a"; x.font = "bold 58px Georgia, serif"; x.fillText("PRANCER POST", 20, 70); x.fillRect(20, 86, 470, 5); for (let i = 0; i < 9; i++) x.fillRect(20 + (i % 2) * 240, 110 + Math.floor(i / 2) * 26, 210, 9); });
    add(g, new THREE.CylinderGeometry(0.11, 0.11, 0.62, 24), M("#ffffff", 0.9, 0, { map: t }), [0, 0.12, 0.05], [0, 0, 0.15]); }
  if (kind === "Tarot Card") { const t = tex(256, 420, (x, w, h) => { x.fillStyle = "#1c1236"; x.fillRect(0, 0, w, h); x.strokeStyle = "#e8bf4e"; x.lineWidth = 8; x.strokeRect(14, 14, w - 28, h - 28); x.lineWidth = 2; x.strokeRect(30, 30, w - 60, h - 60);
      x.fillStyle = "#ff5fa8"; x.beginPath(); x.moveTo(128, 260); x.bezierCurveTo(40, 190, 70, 120, 128, 160); x.bezierCurveTo(186, 120, 216, 190, 128, 260); x.fill(); x.fillStyle = "#e8bf4e"; x.font = "bold 34px Georgia, serif"; x.textAlign = "center"; x.fillText("heART", 128, 350); });
    add(g, new THREE.BoxGeometry(0.34, 0.56, 0.01), [M("#e8bf4e"), M("#e8bf4e"), M("#e8bf4e"), M("#e8bf4e"), M("#fff", 0.5, 0, { map: t }), M("#2a1a4a")], [0, 0.3, 0.06]); }
  if (kind === "Tez Coin") { const t = tex(128, 128, (x) => { x.fillStyle = "#e8bf4e"; x.fillRect(0, 0, 128, 128); x.save(); x.translate(64, 64); x.rotate(-Math.PI / 2); x.translate(-38, -44); x.scale(0.78, 0.78);   /* turned a quarter: the coin face's uv lies on its side */ x.strokeStyle = "#8a5a14"; x.lineWidth = 11; x.lineCap = "round"; x.lineJoin = "round"; x.stroke(new Path2D("M18 14L34 8V64Q34 78 48 78Q56 78 60 72M8 28H90L56 62Q94 66 94 94Q94 120 66 120Q46 120 42 108M44 99a7 7 0 1 0 .1 0")); x.restore(); });   /* struck with the Tezos mark as the Portraits draw it (no font glyph) */
    add(g, new THREE.CylinderGeometry(0.18, 0.18, 0.04, 40), [M("#c9a038", 0.25, 1), M("#e8bf4e", 0.3, 1, { map: t }), M("#e8bf4e", 0.3, 1, { map: t })], [0, 0.22, 0.06], [Math.PI / 2, 0, 0]); }
  if (kind === "Boba Tea") { add(g, new THREE.CylinderGeometry(0.14, 0.11, 0.42, 24), M("#e9c9a8", 0.2, 0, { transparent: true, opacity: 0.85, clearcoat: 1 }), [0, 0.22, 0]); add(g, new THREE.SphereGeometry(0.145, 20, 10, 0, TAU, 0, Math.PI / 2), M("#ffffff", 0.1, 0, { transparent: true, opacity: 0.5 }), [0, 0.43, 0]);
    add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), M("#ff5fa8", 0.4), [0.04, 0.56, 0], [0, 0, 0.15]); for (let i = 0; i < 9; i++) add(g, new THREE.SphereGeometry(0.03, 8, 6), M("#2a1a14", 0.3), [Math.cos(i * 2.3) * 0.07, 0.05 + (i % 3) * 0.03, Math.sin(i * 2.3) * 0.07]); }
  if (kind === "Fish") {   /* a goldfish (Yoeshi, 2026-11-10: "it just looks like an egg"): a body that narrows to the tail, a forked tail fin, a dorsal and two side fins, a pale belly, gill and scale lines, eyes and a mouth */
    const f = new THREE.Group(); f.position.set(0, 0.3, 0.05); g.add(f); const or = M("#ff8a1f", 0.3, 0, { clearcoat: 1 }), fin = M("#ffb04a", 0.45, 0, { side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const bg = new THREE.SphereGeometry(1, 28, 18), bp = bg.attributes.position; for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), k = x < 0 ? 1 - 0.62 * Math.pow(-x, 1.6) : 1 - 0.18 * x * x; bp.setY(i, bp.getY(i) * k + (x < 0 ? 0 : -0.04 * x)); bp.setZ(i, bp.getZ(i) * k); } bg.computeVertexNormals();
    const tx = tex(128, 64, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ff7a14"); gr.addColorStop(0.5, "#ff9a2a"); gr.addColorStop(0.72, "#ffd9a8"); gr.addColorStop(1, "#fff1dc"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(190,70,0,.45)"; c.lineWidth = 1.2; for (let r = 0; r < 5; r++) for (let q = 0; q < 12; q++) { c.beginPath(); c.arc((q + (r % 2) * 0.5) * w / 12, 12 + r * 7, 5, 0.2, Math.PI - 0.2); c.stroke(); } });
    const body = new THREE.Mesh(bg, M("#ffffff", 0.3, 0, { clearcoat: 1, map: tx })); body.scale.set(0.25, 0.15, 0.085); body.castShadow = true; f.add(body);
    const sh = (pts) => { const q = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? q.lineTo(x, y) : q.moveTo(x, y))); return new THREE.ShapeGeometry(q); };
    add(f, sh([[-0.2, 0], [-0.4, 0.15], [-0.34, 0.02], [-0.42, -0.13], [-0.2, 0]]), fin); add(f, sh([[-0.1, 0.1], [0.0, 0.21], [0.1, 0.13], [-0.1, 0.1]]), fin);
    for (const z of [-1, 1]) { add(f, sh([[0, 0], [-0.1, -0.07], [-0.04, 0.02], [0, 0]]), fin, [0.05, -0.06, z * 0.07], [z * 0.7, 0, 0]);
      add(f, new THREE.SphereGeometry(0.026, 12, 10), M("#fffdf5", 0.2), [0.16, 0.035, z * 0.062]); add(f, new THREE.SphereGeometry(0.014, 10, 8), M("#141018", 0.2), [0.172, 0.035, z * 0.078]);
      add(f, new THREE.TorusGeometry(0.06, 0.006, 6, 14, 2.2), M("#d95a08", 0.5), [0.09, 0, z * 0.074], [0, z < 0 ? Math.PI : 0, -1.1]); }
    add(f, new THREE.TorusGeometry(0.018, 0.007, 6, 12), M("#d95a08", 0.5), [0.244, -0.012, 0], [0, Math.PI / 2, 0]); }
  if (kind === "Yarn Ball") { const c = ["#ff5fa2", "#3fa9ff", "#ffd23f"][av.root.id % 3]; add(g, new THREE.SphereGeometry(0.2, 24, 16), M(c, 0.95), [0, 0.22, 0.05]); for (let i = 0; i < 4; i++) add(g, new THREE.TorusGeometry(0.2, 0.012, 6, 32), M(c, 0.95), [0, 0.22, 0.05], [i * 0.8, i * 0.6, 0]); }
  if (kind === "Rose") { add(g, new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), M("#2f8f4e"), [0, 0.3, 0.04]); add(g, new THREE.SphereGeometry(0.11, 16, 12), M("#c8102e", 0.5, 0, { sheen: 1 }), [0, 0.64, 0.04], [0, 0, 0], [1, 0.9, 1]); add(g, new THREE.SphereGeometry(0.06, 8, 6), M("#2f8f4e"), [0.06, 0.32, 0.04], [0, 0, 0], [1.4, 0.4, 0.7]); }
  if (kind === "Donut") { add(g, new THREE.TorusGeometry(0.15, 0.08, 16, 32), M("#d9a066", 0.6), [0, 0.25, 0.06]); add(g, new THREE.TorusGeometry(0.15, 0.06, 12, 32), M("#ff8fc0", 0.3, 0, { clearcoat: 1 }), [0, 0.25, 0.1], [0, 0, 0], [1, 1, 0.6]); }
  if (kind === "Ice Cream") { add(g, new THREE.ConeGeometry(0.11, 0.32, 16), M("#d9a066", 0.8), [0, 0.18, 0.04], [Math.PI, 0, 0]); add(g, new THREE.SphereGeometry(0.13, 16, 12), M("#ffc8dc", 0.6), [0, 0.42, 0.04]); add(g, new THREE.SphereGeometry(0.04, 8, 6), M("#c8102e", 0.2, 0, { clearcoat: 1 }), [0, 0.56, 0.04]); }
  if (kind === "Balloon") { add(g, new THREE.CylinderGeometry(0.004, 0.004, 1.8, 4), M("#ffffff"), [-0.46, 0.78, 0], [0, 0, 0.53]); add(g, new THREE.SphereGeometry(0.32, 24, 18), M("#ff3f6e", 0.15, 0, { clearcoat: 1 }), [-1.1, 1.87, 0], [0, 0, 0.53], [1, 1.15, 1]); }   // on a long string, drifting up and out, clear of the head and any hat
  if (kind === "Lollipop") { add(g, new THREE.CylinderGeometry(0.014, 0.014, 0.56, 6), M("#ffffff"), [0, 0.28, 0.04]); const sw = tex(256, 256, (x) => { x.fillStyle = "#ff5fa2"; x.fillRect(0, 0, 256, 256); x.strokeStyle = "#ffffff"; x.lineWidth = 22; x.lineCap = "round"; x.beginPath(); for (let a = 0; a < 6 * Math.PI; a += 0.05) { const r = 6 + a * 6.2; x.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } x.stroke(); });
    add(g, new THREE.CylinderGeometry(0.21, 0.21, 0.07, 40), [M("#ff5fa2", 0.3, 0, { clearcoat: 1 }), M("#ffffff", 0.2, 0, { clearcoat: 1, map: sw }), M("#ffffff", 0.2, 0, { clearcoat: 1, map: sw })], [0, 0.66, 0.04], [Math.PI / 2, 0, 0]); }   /* a bold spiral both sides (Yoeshi: it read as nothing) */
  if (kind === "Magic Wand") { add(g, new THREE.CylinderGeometry(0.018, 0.022, 0.62, 8), M("#16151a", 0.3), [0, 0.31, 0.04]); const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.06 : 0.14; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    add(g, new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false }), M("#ffe36e", 0.3, 0, { emissive: "#ffd23f", emissiveIntensity: 0.6 }), [0, 0.7, 0.03]); }
  if (kind === "Coffee") {   /* the Portraits' takeaway cup: white, tapered, a brown sleeve, a dark lid, two wisps of steam */
    add(g, new THREE.CylinderGeometry(0.13, 0.1, 0.4, 24), M("#ffffff", 0.45, 0, { clearcoat: 0.4 }), [0, 0.2, 0]); add(g, new THREE.CylinderGeometry(0.125, 0.112, 0.12, 24), M("#a0703c", 0.85), [0, 0.19, 0]);
    add(g, new THREE.CylinderGeometry(0.145, 0.145, 0.035, 24), M("#3a2a20", 0.5), [0, 0.415, 0]); add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.012, 10), M("#3a2a20", 0.5), [0.06, 0.44, 0]);
    const wisp = M("#ffffff", 0.9, 0, { transparent: true, opacity: 0.55, depthWrite: false }); for (const x of [-0.045, 0.035]) add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(x, 0.46, 0), new THREE.Vector3(x + 0.025, 0.51, 0), new THREE.Vector3(x - 0.02, 0.56, 0), new THREE.Vector3(x + 0.015, 0.61, 0)]), 12, 0.008, 5), wisp); }
  if (kind === "Plasma Blade") {   /* the Star Monk's: a light-coloured glow round a white-hot core, from a ribbed steel hilt with its emitter and a red stud; its colour the Portraits' PLC */
    const c = opts.col || "#3fa0ff", steel = M("#8f9aa8", 0.35, 0.8), dark = M("#16151a", 0.5, 0.3), LB = 1.9;
    add(g, new THREE.CylinderGeometry(0.045, 0.05, 0.42, 16), steel, [0, 0.21, 0]); for (let i = 0; i < 5; i++) add(g, new THREE.TorusGeometry(0.05, 0.008, 6, 20), dark, [0, 0.1 + i * 0.055, 0], [Math.PI / 2, 0, 0]);   // the grip and its rings
    add(g, new THREE.CylinderGeometry(0.062, 0.055, 0.06, 16), M("#3a404a", 0.5, 0.5), [0, 0.45, 0]); add(g, new THREE.SphereGeometry(0.014, 8, 6), M("#ff3b3b", 0.3, 0, { emissive: "#ff3b3b", emissiveIntensity: 1.5 }), [0.045, 0.3, 0.025]);   // the emitter, the stud
    /* the glow: brightest along the blade and fading to nothing at its edge, in the blade's own colour over any backdrop
       (Yoeshi, 2026-11-10: "a bit glitchy"; flat additive shells showed as a hard-edged slab, and vanished against snow) */
    const glow = (r, op) => new THREE.ShaderMaterial({ uniforms: { c: { value: new THREE.Color(c) }, o: { value: op } }, transparent: true, depthWrite: false,
      vertexShader: "varying float f; void main(){ vec4 p = modelViewMatrix * vec4(position, 1.0); f = abs(dot(normalize(normalMatrix * normal), normalize(-p.xyz))); gl_Position = projectionMatrix * p; }",
      fragmentShader: "uniform vec3 c; uniform float o; varying float f; void main(){ gl_FragColor = vec4(c, o * f * f * f); }" });
    add(g, new THREE.CylinderGeometry(0.022, 0.022, LB, 10), new THREE.MeshBasicMaterial({ color: "#ffffff" }), [0, 0.48 + LB / 2, 0]); add(g, new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }), [0, 0.48 + LB, 0]);   // the core
    add(g, new THREE.CapsuleGeometry(0.055, LB - 0.02, 6, 20), glow(0.05, 0.95), [0, 0.5 + LB / 2, 0]); add(g, new THREE.CapsuleGeometry(0.12, LB - 0.04, 6, 20), glow(0.1, 0.6), [0, 0.5 + LB / 2, 0]); }   // the glow
  if (kind === "Gladius") {   /* the gladiator's: a short, broad, leaf-shaped blade; a bronze guard, a ribbed bone grip, a ball pommel */
    const steel = M("#dfe6ee", 0.25, 0.9), br = M("#d6a24c", 0.35, 0.8), bone = M("#efe3c8", 0.6); const sh = new THREE.Shape(); sh.moveTo(-0.12, 0); sh.quadraticCurveTo(-0.16, 0.65, -0.1, 0.8); sh.lineTo(0, 0.95); sh.lineTo(0.1, 0.8); sh.quadraticCurveTo(0.16, 0.65, 0.12, 0); sh.closePath();
    add(g, new THREE.ExtrudeGeometry(sh, { depth: 0.024, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }), steel, [0, 0.3, -0.012]);
    add(g, new THREE.BoxGeometry(0.3, 0.06, 0.07), br, [0, 0.28, 0]); add(g, new THREE.CylinderGeometry(0.04, 0.045, 0.26, 12), bone, [0, 0.13, 0]); for (let i = 1; i < 4; i++) add(g, new THREE.TorusGeometry(0.044, 0.005, 6, 16), M("#b8a888", 0.6), [0, 0.13 - 0.13 + i * 0.065, 0], [Math.PI / 2, 0, 0]);
    add(g, new THREE.SphereGeometry(0.06, 14, 10), br, [0, -0.03, 0]); }
  if (kind === "Blaster") {   /* the Agent's: a tiny chrome blaster with a glowing core, small enough to hide in a paw, far too powerful */
    const chrome = M("#dfe5ec", 0.18, 1), dark = M("#2a2a33", 0.5, 0.3), lit = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.8 });
    add(g, new THREE.BoxGeometry(0.07, 0.18, 0.05), dark, [0, 0.09, -0.01], [0.15, 0, 0]);   // the grip
    add(g, new THREE.CapsuleGeometry(0.05, 0.3, 4, 12), chrome, [0, 0.36, 0]); for (let k = 0; k < 3; k++) add(g, new THREE.TorusGeometry(0.052, 0.008, 6, 20), M("#8f9aa8", 0.4, 0.8), [0, 0.26 + k * 0.08, 0], [Math.PI / 2, 0, 0]);   // the body, its rings
    add(g, new THREE.SphereGeometry(0.03, 12, 10), lit("#5fd4ff"), [0, 0.36, 0.045]);   // the core
    add(g, new THREE.CylinderGeometry(0.022, 0.026, 0.14, 12), chrome, [0, 0.58, 0]); add(g, new THREE.SphereGeometry(0.018, 10, 8), lit("#bff2ff"), [0, 0.655, 0]); }   // the muzzle, lit
  if (kind === "Enchanted Blade") {   /* the Sword Knight's, copied from Prancelot's sword (src/knight.js): far too big for its knight, a satin steel blade with a line of light down each fuller, a curled gold guard with its gem, a grip wound in blue, a gold pommel; scaled to stand a cat's height in one paw */
    const sw = new THREE.Group(); sw.scale.setScalar(0.6); sw.position.y = 0.65; g.add(sw); const L = 4.6, Wd = 0.17, glow = (c, k) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false }), gd = M("#e2b44a", 0.25, 1);
    const s = new THREE.Shape(); s.moveTo(-Wd, 0); s.lineTo(-Wd * 0.86, L - 0.55); s.lineTo(0, L); s.lineTo(Wd * 0.86, L - 0.55); s.lineTo(Wd, 0); s.closePath();
    add(sw, new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.028, bevelSize: 0.035, bevelSegments: 2 }).translate(0, 0, -0.01), new THREE.MeshPhysicalMaterial({ color: "#b4bfcc", metalness: 0.85, roughness: 0.55, envMapIntensity: 0.5, specularIntensity: 0.6 }));
    const aura = add(sw, new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false }).translate(0, 0, -0.06), new THREE.MeshBasicMaterial({ color: "#9fd8ff", transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending })); aura.scale.set(1.3, 1.02, 1); aura.castShadow = false;
    for (const z of [-0.052, 0.052]) { add(sw, new THREE.BoxGeometry(0.035, L - 0.75, 0.006), M("#9aaabd", 0.3, 1), [0, (L - 0.75) / 2 + 0.12, z]); add(sw, new THREE.BoxGeometry(0.012, L - 1.0, 0.004), glow("#7fe6ff", 1.4), [0, (L - 1.0) / 2 + 0.2, z * 1.12]).castShadow = false; }
    for (const s2 of [-1, 1]) add(sw, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0.03, 0], [s2 * 0.25, 0.0, 0], [s2 * 0.5, 0.1, 0], [s2 * 0.48, 0.24, 0], [s2 * 0.36, 0.2, 0]].map((p) => new THREE.Vector3(...p))), 60, 0.05, 8), gd);   // the guard, curled
    add(sw, new THREE.SphereGeometry(0.11, 16, 12), gd, [0, 0.02, 0], [0, 0, 0], [1.4, 0.8, 1]); add(sw, new THREE.OctahedronGeometry(0.07), glow("#7fd3ff", 1.6), [0, 0.03, 0.09]);
    add(sw, new THREE.CylinderGeometry(0.075, 0.07, 1.0, 16), new THREE.MeshStandardMaterial({ color: "#1d2a6e", roughness: 0.7 }), [0, -0.52, 0]); for (let i = 0; i < 7; i++) add(sw, new THREE.TorusGeometry(0.077, 0.012, 6, 20), gd, [0, -0.1 - i * 0.14, 0], [Math.PI / 2 + 0.25, 0, 0]);
    add(sw, new THREE.SphereGeometry(0.14, 20, 16), gd, [0, -1.08, 0]); add(sw, new THREE.OctahedronGeometry(0.06), glow("#7fd3ff", 1.6), [0, -1.08, 0.13]); }   // the pommel and its gem
  if (kind === "Pizza") {   /* a slice, tip up, the crust in the paw: as drawn, with three pepperoni (the show's slice, grown to a paw) */
    const sh = new THREE.Shape(); sh.moveTo(-0.2, 0.04); sh.quadraticCurveTo(0, -0.05, 0.2, 0.04); sh.lineTo(0, 0.52); sh.closePath();
    add(g, new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }), M("#ffd25e", 0.7), [0, 0, 0]);
    const cm = M("#d99a4e", 0.8); add(g, new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.2, 0.04, 0.015), new THREE.Vector3(0, -0.05, 0.015), new THREE.Vector3(0.2, 0.04, 0.015)), 14, 0.036, 8), cm, [0, 0, 0]);   /* the crust runs along the slice's own edge (Yoeshi, 2026-11-10: an arc of its own curved away from it) */
    for (const x of [-0.2, 0.2]) add(g, new THREE.SphereGeometry(0.036, 10, 8), cm, [x, 0.04, 0.015]);
    for (const [x, y] of [[-0.06, 0.18], [0.06, 0.13], [0, 0.31]]) add(g, new THREE.CylinderGeometry(0.036, 0.036, 0.012, 14).rotateX(Math.PI / 2), M("#c8102e", 0.5), [x, y, 0.036]); }
  if (kind === "Crescent") {   /* the Night Guardian's: a throwing crescent moon in dark steel, edged in moonlight, a paw cut through its middle */
    const cs = new THREE.Shape(); cs.moveTo(0.05, 0.24); cs.absarc(0, 0, 0.25, Math.PI * 0.43, -Math.PI * 0.43, false); cs.quadraticCurveTo(-0.11, 0, 0.05, 0.24);
    const cr = add(g, new THREE.ExtrudeGeometry(cs, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 }), M("#8a93a8", 0.25, 1, { emissive: "#1a2440", emissiveIntensity: 0.4 }), [0, 0.22, 0.02]);
    add(cr, new THREE.TorusGeometry(0.25, 0.008, 6, 40, Math.PI * 1.14), M("#cfe0ff", 0.2, 0, { emissive: "#8fb6ff", emissiveIntensity: 1.2 }), [0, 0, 0.022], [0, 0, Math.PI * 0.43]); }
  if (kind === "Golden Idol") {   /* the Adventurer's prize: a little golden cat, seated, its ears up and its eyes two rubies, on a plinth */
    const au = M("#f0c24a", 0.18, 1, { emissive: "#6b4a10", emissiveIntensity: 0.25 });
    add(g, new THREE.CylinderGeometry(0.11, 0.12, 0.06, 20), au, [0, 0.03, 0]); add(g, new THREE.CapsuleGeometry(0.075, 0.14, 6, 16), au, [0, 0.17, 0]); add(g, new THREE.SphereGeometry(0.07, 16, 12), au, [0, 0.32, 0.01]);
    for (const s2 of [-1, 1]) { add(g, new THREE.ConeGeometry(0.028, 0.07, 8), au, [s2 * 0.04, 0.39, 0.0], [0, 0, -s2 * 0.25]); add(g, new THREE.SphereGeometry(0.014, 8, 6), M("#e0115f", 0.1, 0, { emissive: "#c0103f", emissiveIntensity: 1.4 }), [s2 * 0.026, 0.33, 0.065]); }
    add(g, new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI), au, [0.07, 0.08, -0.02], [0, Math.PI / 2, 0]); }   // and its tail round its feet
  if (kind === "Golden Ankh") {   /* the Sphinx's: the key of life in gold, a turquoise set where the arms cross */
    const au = M("#e8bf4e", 0.2, 1), loop = add(g, new THREE.TorusGeometry(0.09, 0.028, 10, 28), au, [0, 0.52, 0.04], [0, 0, 0], [0.85, 1.15, 1]);
    add(g, new THREE.BoxGeometry(0.3, 0.05, 0.05), au, [0, 0.38, 0.04]); add(g, new THREE.BoxGeometry(0.055, 0.42, 0.05), au, [0, 0.16, 0.04]); add(g, new THREE.SphereGeometry(0.03, 10, 8), M("#2fc6c0", 0.15, 0, { clearcoat: 1 }), [0, 0.38, 0.07]); }
  hold.userData.grip = GRIPS[kind] || null; av.held = hold; return hold;
}
/* how each thing is held (in the prop's own frame, g above): axis, the line the paw closes round, and r its radius there;
   at, where along it the paw takes it; world, the way that line should point (the cat's frame: "up", "side" (across), or
   a direction); from, the side the paw comes from (the cat's frame; default: the outside, a little in front); face, a
   direction on the thing that should face the way the cat faces (else its top is kept up) */
const GRIPS = {
  Newspaper: { axis: [[0, -0.19, 0.05], [0, 0.43, 0.05]], r: 0.11, at: 0.42, world: [0.35, 0.92, 0.1] },
  "Tarot Card": { axis: [[-0.17, 0.04, 0.06], [0.17, 0.04, 0.06]], r: 0.012, at: 0.5, world: "side", from: [0, -1, 0.25], face: [0, 0, 1] },
  "Tez Coin": { axis: [[-0.1, 0.05, 0.06], [0.1, 0.05, 0.06]], r: 0.02, at: 0.5, world: "side", from: [0, -1, 0.25], face: [0, 0, 1] },
  "Boba Tea": { axis: [[0, 0.02, 0], [0, 0.42, 0]], r: 0.13, at: 0.4, world: "up" },
  Fish: { axis: [[-0.28, 0.3, 0.05], [0.28, 0.3, 0.05]], r: 0.11, at: 0.55, world: "side", from: [-0.2, -1, 0.3], face: [0, 0, 1] },
  "Yarn Ball": { axis: [[-0.06, 0.22, 0.05], [0.06, 0.22, 0.05]], r: 0.2, at: 0.5, world: "side", from: [-0.5, -0.8, 0.3] },
  Rose: { axis: [[0, 0.02, 0.04], [0, 0.58, 0.04]], r: 0.015, at: 0.3, world: [0.25, 0.95, 0.15] },
  Donut: { axis: [[-0.08, 0.1, 0.06], [0.08, 0.1, 0.06]], r: 0.075, at: 0.5, world: "side", from: [0, -1, 0.3], face: [0, 0, 1] },
  "Ice Cream": { axis: [[0, 0.06, 0.04], [0, 0.33, 0.04]], r: 0.075, at: 0.45, world: "up" },
  Balloon: { axis: [[-0.01, 0.01, 0], [-0.1, 0.17, 0]], r: 0.004, at: 0.3, world: [-0.5, 0.8, -0.33], float: 3.2 },   /* the string out and back, behind the face from any side */
  Lollipop: { axis: [[0, 0.02, 0.04], [0, 0.5, 0.04]], r: 0.014, at: 0.35, world: [0.55, 0.82, 0.12], face: [0, 0, 1] },   /* out from the face: the candy beside the chin */
  "Magic Wand": { axis: [[0, 0.02, 0.04], [0, 0.6, 0.04]], r: 0.02, at: 0.3, world: [0.35, 0.85, 0.4] },
  Coffee: { axis: [[0, 0.02, 0], [0, 0.4, 0]], r: 0.12, at: 0.4, world: "up" },
  Pizza: { axis: [[-0.14, 0.05, 0.015], [0.14, 0.05, 0.015]], r: 0.035, at: 0.5, world: "side", from: [0, -1, 0.25], face: [0, 0, 1] },
  "Plasma Blade": { axis: [[0, 0.02, 0], [0, 0.42, 0]], r: 0.064, at: 0.45, rad: 1, low: 0.3, out: 0.12, world: [-0.4, 0.9, -0.14] },   /* up and out past its own paw, leaning back, clear of the face (it had stood straight up through it) */
  Gladius: { axis: [[0, 0.02, 0], [0, 0.25, 0]], r: 0.058, at: 0.5, rad: 1, low: 0.25, out: 0.1, world: [-0.3, 0.5, 0.82], face: [-1, 0, 0] }   /* at the ready: forward and a little up, clear of its armoured forearm */,
  Blaster: { axis: [[0, 0.01, -0.01], [0, 0.17, -0.01]], r: 0.04, at: 0.5, rad: 1, world: [0.15, 0.95, 0.3], face: [0, 0, 1] },
  "Enchanted Blade": { axis: [[0, 0.03, 0], [0, 0.6, 0]], r: 0.06, at: 0.8, rad: 1, low: 0.4, out: 0.12, world: [-0.66, 0.7, -0.12], face: [0, 0, 1] },   /* leaning out past its own paw, clear of the ear and the bow */
  Crescent: { axis: [[-0.16, 0.22, 0.03], [-0.16, 0.3, 0.03]], r: 0.03, at: 0.5, world: "up", face: [0, 0, 1] },   /* by its back, the crescent out beside the paw */
  "Golden Idol": { axis: [[0, 0.03, 0], [0, 0.26, 0]], r: 0.08, at: 0.45, world: "up" },
  "Golden Ankh": { axis: [[0, 0.0, 0.04], [0, 0.36, 0.04]], r: 0.03, at: 0.35, world: [0.2, 0.96, 0.15], face: [0, 0, 1] },
};
const V3 = () => new THREE.Vector3(), QW = new THREE.Quaternion(), QR = new THREE.Quaternion(), QI = new THREE.Quaternion(), Q1 = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), QS = new THREE.Quaternion();
const HP = V3(), DIR = V3(), FR = V3(), PA = V3(), PB = V3(), AX = V3(), AXS = V3(), GP = V3(), FW = V3(), CF = V3(), UPW = V3(), POLE = V3(), OFF = new THREE.Vector3(0, -0.08, 0), PX = new THREE.Vector3(1, 0, 0);
const dirOf = (w) => w === "up" ? DIR.set(0, 1, 0) : w === "side" ? DIR.set(1, 0, 0) : DIR.fromArray(w);
/* the holding arm: the right paw up in front of the chest, closed round the thing (avatar.hold), the thing placed in its
   grip; after avatar.update(), when no move is playing */
export function holdPose(av, t, colliders, dt) {
  if (!av.held) return; const G = av.held.userData.grip, rq = av.root.getWorldQuaternion(QR), K = av.k;
  av.b.chest.localToWorld(HP.set(-0.32 - (G && G.out || 0), -0.25 - (G && G.low || 0) + 0.02 * Math.sin(t * 1.6), 0.78));   // where the paw holds it (a long sword lower, at the waist)
  if (!G) { av.reach("R", HP, POLE.set(-1, -0.6, -0.2).applyQuaternion(rq), 0, colliders); placeHeld(av, 0, dt); return; }
  const d = dirOf(G.world).applyQuaternion(rq).normalize(), from = FR.fromArray(G.from || [-0.9, -0.1, 0.35]).applyQuaternion(rq); from.addScaledVector(d, -from.dot(d)).normalize();
  const A = PA.copy(HP).addScaledVector(from, -pocket(G.r * 1.5).z * K).addScaledVector(d, -0.25), B = PB.copy(A).addScaledVector(d, 0.5);   // the thing's line, through the pocket of a paw at HP
  av.hold("R", { axis: [A, B], at: 0.5, r: G.r * 1.5 * K, from, pole: POLE.set(-1, -0.6, -0.2).applyQuaternion(rq).normalize(), cols: colliders });
  if (av.shield) av.reach("L", av.b.chest.localToWorld(T6.set(0.62, -0.55, 0.42)), POLE.set(1, -0.6, -0.2).applyQuaternion(rq).normalize(), 0, colliders);   /* the shield paw comes forward to carry it */
  placeHeld(av, 0, dt);
}
/* the Gladiator's scutum: just in front of the left paw, upright and facing the way the cat faces, so the paw holds it from behind */
function shieldPose(av) { const sg = av.shield, P = sg.parent; P.updateMatrixWorld(true); const p = P.worldToLocal(av.b.wrL.getWorldPosition(T7)); sg.position.set(p.x + 0.04, p.y + 0.02, p.z + 0.3 + 1.5 * (av.L.furLen || 0)); }
/* the thing in the paw's grip, whatever the paw is doing (in a move too): its line across the palm in the pocket, rolled
   so its face is toward the way the cat faces, or its top up. A thing with no grip known stays upright in the paw. */
export function placeHeld(av, mv, dt) { if (av.shield) shieldPose(av); const h = av.held; if (!h) return; const G = h.userData.grip;
  /* the holding arm passes from the way it holds a thing at rest to a move, and back, over a quarter of a second (it
     switched in one frame, which threw a long blade's tip across the picture: Yoeshi, 2026-11-10). Nothing on the cover. */
  { const J = [av.b.shR, av.b.elR, av.b.wrR], ar = h.userData.ar || (h.userData.ar = { mv: !!mv, k: 1, q: J.map((j) => j.quaternion.clone()) });
    if (!!mv !== ar.mv) { ar.mv = !!mv; ar.k = 0; }
    if (ar.k < 1) { ar.k = Math.min(1, ar.k + 0.07); const e = ar.k * ar.k * (3 - 2 * ar.k); J.forEach((j, i) => j.quaternion.copy(QS.copy(ar.q[i]).slerp(j.quaternion, e))); av.b.shR.updateMatrixWorld(true); }
    else J.forEach((j, i) => ar.q[i].copy(j.quaternion)); }
  if (!G) { h.quaternion.copy(av.b.wrR.getWorldQuaternion(QW).invert().multiply(av.root.getWorldQuaternion(QR))); return; }
  const a = PA.fromArray(G.axis[0]).multiplyScalar(1.5).add(OFF), b = PB.fromArray(G.axis[1]).multiplyScalar(1.5).add(OFF), ax = AX.copy(b).sub(a).normalize(), gp = GP.copy(a).lerp(b, G.at ?? 0.5);
  const wq = av.b.wrR.getWorldQuaternion(QW), rq = av.root.getWorldQuaternion(QR), wi = QI.copy(wq).invert();
  const want = (G.face ? FW.set(0, 0, 1).applyQuaternion(rq) : FW.set(0, 1, 0)).applyQuaternion(wi); want.x = 0;   // in the wrist's frame, about the line (x)
  const fit = (sg) => { Q1.setFromUnitVectors(AXS.copy(ax).multiplyScalar(sg), PX); const cur = (G.face ? CF.fromArray(G.face) : CF.set(0, 1, 0)).applyQuaternion(Q1); cur.x = 0;
    if (want.lengthSq() > 1e-6 && cur.lengthSq() > 1e-6) { want.normalize(); cur.normalize(); Q2.setFromAxisAngle(PX, Math.atan2(cur.y * want.z - cur.z * want.y, cur.y * want.y + cur.z * want.z)); Q1.premultiply(Q2); }
    return UPW.set(0, 1, 0).applyQuaternion(Q1).applyQuaternion(wq).y; };   // how far up its top points, in the world
  if (fit(1) < 0 && G.face) fit(-1);   // a faced thing on its head: its line the other way round
  const pk = pocket(G.r * 1.5); h.quaternion.copy(Q1); h.position.set(0, -0.06 - pk.y, -pk.z).sub(gp.applyQuaternion(Q1));
  /* a long weapon (G.rad) in a move keeps one line on the body: up, out past the holding paw and a little back, so neither the blade nor its short end below the paw comes across the face, eased in over a few frames, so a
     raised paw never brings the blade across the face; at rest it keeps its grip's own line (the cover) */
  const ek = h.userData.k = mv && !G.float ? Math.min(1, (h.userData.k || 0) + 0.15) : 0;
  /* anything else in a move is carried as it is held at rest: the same way up and facing the same way from the cat (a cup stays level, a wand's star stays up, a card keeps its face), turned about the paw's
     grip and eased in over a few frames. Its attitude at rest is noted each frame it rests (h.userData.q0, in the cat's frame) */
  if (ek && !G.rad && h.userData.q0) { const q = Q2.copy(wq).invert().multiply(rq).multiply(h.userData.q0), g0 = T6.copy(a).lerp(b, G.at ?? 0.5), pk0 = T7.copy(h.position).add(T5.copy(g0).applyQuaternion(h.quaternion));
    h.quaternion.slerp(q, ek); h.position.copy(pk0).sub(g0.applyQuaternion(h.quaternion)); }
  if (ek && G.rad) { h.updateMatrixWorld(true); const a = h.localToWorld(T6.fromArray(G.axis[0]).multiplyScalar(1.5).add(OFF)), b = h.localToWorld(T7.fromArray(G.axis[1]).multiplyScalar(1.5).add(OFF)), gw = T3.copy(a).lerp(b, G.at ?? 0.5);
    const out = T4.set(-0.62, 1, -0.22).normalize().applyQuaternion(rq); Q1.setFromUnitVectors(b.sub(a).normalize(), out); Q2.identity().slerp(Q1, ek);
    const ql = QI.copy(wq).invert().multiply(Q2).multiply(wq), gl = av.b.wrR.worldToLocal(T5.copy(gw)); h.quaternion.premultiply(ql); h.position.sub(gl).applyQuaternion(ql).add(gl); }
  /* a move that brings the paw up by the head (a wave, paws up): the thing leans away from the head about the paw, a little at a time, until it is clear */
  if (av.headDist) { const wr = av.b.wrR, tipL = TL.fromArray(G.axis[1]).multiplyScalar(1.5 * 1.3).add(OFF), HC = av.b.head.getWorldPosition(TW);
    const baseL = T6.fromArray(G.axis[0]).multiplyScalar(1.5).add(OFF);   /* a long weapon along its whole length (its middle can cross the face with its tip clear); anything else by its tip, as before */
    for (let k = 0; k < 16; k++) { h.updateMatrixWorld(true); let tipW = null, dm = 1e9; for (const f of G.rad ? [0.35, 0.6, 0.8, 1] : [1]) { const p = h.localToWorld(T7.copy(baseL).lerp(tipL, f)), dd = av.headDist(p); if (dd < dm) { dm = dd; tipW = T2.copy(p); } } if (dm > 0.12) break;
      const tw = wr.worldToLocal(T3.copy(tipW)), aw = wr.worldToLocal(T4.copy(tipW).add(T5.copy(tipW).sub(HC).normalize())).sub(tw), ax = T5.crossVectors(tw, aw); if (ax.lengthSq() < 1e-8) break;
      Q2.setFromAxisAngle(ax.normalize(), 0.14); h.quaternion.premultiply(Q2); h.position.applyQuaternion(Q2); } }
  /* a long weapon is steadied (Yoeshi, 2026-11-10: the blade was glitchy): its line in the world follows where the paw
     would put it over a few frames, about the grip, so the start and end of a move and any small change in the arm never
     show as a jump at the far end of a long blade. The first frame (the cover) is exactly where the paw puts it. */
  if (G.rad) { const qd = QS.copy(wq).multiply(h.quaternion), gl = T6.copy(a).lerp(b, G.at ?? 0.5), at = T7.copy(h.position).add(T5.copy(gl).applyQuaternion(h.quaternion));
    if (!h.userData.qs) h.userData.qs = qd.clone(); else h.userData.qs.slerp(qd, 0.2);
    h.quaternion.copy(QI.copy(wq).invert().multiply(h.userData.qs)); h.position.copy(at).sub(gl.applyQuaternion(h.quaternion)); }
  /* a thing that floats (the Balloon): its string rises from the paw whatever the paw is doing. In a move it keeps the line it floats on at rest (up, out and back on the cat's own side); given the frame's time (dt)
     the balloon is a light thing on a taut string: it trails the paw and the turn, swings and settles, and gives way round the head. Nothing is changed at rest while no time passes, so the cover is as it was */
  if (G.float && (mv || dt > 0)) { h.updateMatrixWorld(true); const gw = h.localToWorld(T6.copy(a).lerp(b, G.at ?? 0.5)), tip = h.localToWorld(T7.copy(a).addScaledVector(ax, G.float)), L = tip.distanceTo(gw), sc = L / G.float, u = T3.copy(tip).sub(gw).normalize();
    const S = h.userData.fl || (h.userData.fl = { p: tip.clone(), v: V3() }); if (mv) tip.copy(dirOf(G.world).applyQuaternion(rq).normalize().multiplyScalar(L)).add(gw);
    if (dt > 0) { const e = Math.min(dt, 0.05); S.v.addScaledVector(T4.copy(tip).sub(S.p), 40 * e).multiplyScalar(Math.exp(-10 * e)); S.p.addScaledVector(S.v, e);   // light and full of drag: it never swings out like a weight, it lags, rises and settles
      if (av.headDist) { const d = av.headDist(S.p); if (d < 0.6) S.p.addScaledVector(T4.copy(S.p).sub(av.b.head.getWorldPosition(TW)).normalize(), (0.6 - d) * sc); }
      S.p.sub(gw).setLength(L).add(gw); }   // the string stays taut
    else if (dt === undefined) S.p.copy(tip);
    Q2.setFromUnitVectors(u, T4.copy(S.p).sub(gw).normalize()); const ql = QI.copy(wq).invert().multiply(Q2).multiply(wq), gl = av.b.wrR.worldToLocal(T5.copy(gw)); h.quaternion.premultiply(ql); h.position.sub(gl).applyQuaternion(ql).add(gl); }
  else if (G.float && h.userData.fl) { h.updateMatrixWorld(true); h.userData.fl.p.copy(h.localToWorld(T7.copy(a).addScaledVector(ax, G.float))); h.userData.fl.v.set(0, 0, 0); }
  if (!mv) (h.userData.q0 || (h.userData.q0 = new THREE.Quaternion())).copy(rq).invert().multiply(wq).multiply(h.quaternion); }
const T6 = new THREE.Vector3(), T7 = new THREE.Vector3(), TL = new THREE.Vector3(), TW = new THREE.Vector3(), T2 = new THREE.Vector3(), T3 = new THREE.Vector3(), T4 = new THREE.Vector3(), T5 = new THREE.Vector3();
export const upright = (av, dt) => placeHeld(av, 1, dt);   /* in a move */
