/* The cast of the site: Prancer 3D cats made ready to stand anywhere on it, as stills (cats.js) or alive in the rooms of
   the condo (../condo/condo.js). Two kinds:
     makeCat({ role: "music" | "art" | "words" | "together" })   Yoeshi's own cat, the Frontcat (the Portraits seed yoeshi109 in his inverted
                                                     tuxedo), dressed for each branch of his work as the heart figure was on
                                                     his old site (Yoeshi, 2026-11-11)
     makeCat({ role: "maestro", wear })              Maestro in 3D, the concierge, as Yoeshi approved him (2026-11-11): made by
                                                     prancer-3d labs/shared/maestro3d.js, the one source of his look. wear: "cream"
                                                     (with a coffee), "sage" or "lilac"
     makeCat({ seed }) or makeCat({ find: "Newspaper" })   any Prancer 3D, as the generator makes it (find: the first seed, find0
                                                     find1 ..., whose cat holds that)
   The cat, its tee, suit, guitar and newspaper are Prancer 3D's own, read from a snapshot and never changed; the prints,
   tablet, camera and microphone are made here, for the site only ("custom assets are fine outside of the generator
   for marketing and branding"). A cat comes back standing at rest in its holder (a Group, its own things in it), in the
   avatar's own units (about 3.6 tall to the ear tips), with step(dt, look, emote) to keep it alive. */
import * as THREE from "three";
import { genesFor } from "../../../p3d/src/genes.js";
import { Avatar } from "../../../p3d/src/avatar.js";
import { makeInstrument } from "../../../p3d/src/instruments.js";
import { addProp, holdPose } from "../../../p3d/src/wardrobe.js";

const TAU = Math.PI * 2;
export const LEN = { wave: 2.6, posey: 5, pawsup: 3, dance: 6, knead: 5, spin: 1.6 };   // how long each move runs
export const M = (color, roughness = 0.6, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness, ...o });
export const add = (parent, geo, mat, p = [0, 0, 0], r = [0, 0, 0]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); parent.add(m); return m; };
export const rod = (parent, p0, p1, r, mat) => { const a = new THREE.Vector3(...p0), d = new THREE.Vector3(...p1).sub(a), m = add(parent, new THREE.CylinderGeometry(r, r, d.length(), 12), mat, a.clone().addScaledVector(d, 0.5).toArray()); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; };
export const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
export const loadTex = (src) => new Promise((res) => new THREE.TextureLoader().load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, () => res(null)));

/* his cat: the Frontcat's coat, without the stage clothes */
const base = genesFor("yoeshi109"), dark = typeof base.bodyFill === "string" && base.bodyFill.startsWith("#") ? base.bodyFill : "#311c22";
const COAT = { ...base, CHEEKS: "None", LASERC: "None", WINGS: false, GENES: true, WHITE: "Blaze", WHITEC: dark, muzC: dark, bodyFill: "#efe8dc", markC: null, patchC: null, PAT: "Solid", BUILD: "Slim", BW: 0.9, VANISH: false, HAT: "None" };
const TEE = "#f4f2ec", WEAR = {
  music: { OUTFIT: "Band Tee", TEE, SLEEVE: TEE, SHORTSLEEVE: true, PANTS: "#17171c" },
  art: { OUTFIT: "Band Tee", TEE, SLEEVE: TEE, SHORTSLEEVE: true, PANTS: "#17171c" },
  words: { OUTFIT: "Suit & Tie", JACKET: "#1d2a44", SLEEVE: "#1d2a44", SHORTSLEEVE: false, PANTS: "#7a7c82" },
  together: { OUTFIT: "Band Tee", TEE, SLEEVE: TEE, SHORTSLEEVE: true, PANTS: "#17171c" },   // the fourth card, Work Together (2026-11-20): open-pawed, a welcome
};

/* the groomed coat (prancer-3d labs/shared/groom.js; Yoeshi, 2026-11-15: "Wire it into the shows and site"): the fur lies down along the way
   the coat runs, finer and in small tufts, as on the Blender coat; the generator's src stays as minted. Loaded once, when the first cat
   is made; a prancer-3d snapshot older than 6292896 has no groom.js, and then every cat keeps the coat as minted. ?groom=0 on a page
   for the coat as minted */
let groomer = null, groomMod = null; const groomOf = () => (groomer ||= import("../../../p3d/labs/shared/groom.js").then((m) => ((groomMod = m), m.groom), () => null));
const GROOM_OFF = typeof location !== "undefined" && new URLSearchParams("").get("groom") === "0";
/* the light through the fur takes the room's colour (Yoeshi, 2026-11-16: "tint the glow per room and stage"): roomGlow turns a room's
   wallpaper (base and ink, or one colour) into that light, its walls' colour lifted toward white as the Lounge lifts its own; furLight
   sets it for the coats drawn next (groom's shared glow, so a page that draws its rooms one by one sets each before it is drawn), at
   groom's calm strength (0.15, wrap 0.3). Nothing until a groomed cat has been made; a groom.js before prancer-3d 50775fe has no
   groomLight, and its coats keep their own glow */
export function roomGlow(paper) { const c = typeof paper === "string" ? new THREE.Color(paper) : new THREE.Color(paper.base).lerp(new THREE.Color(paper.ink || paper.base), 0.5), h = {};
  c.getHSL(h, THREE.SRGBColorSpace); return c.setHSL(h.h, Math.min(0.5, Math.max(0.12, h.s)), 0.72, THREE.SRGBColorSpace); }
const GLOW_CALM = typeof location !== "undefined" && new URLSearchParams("").get("glow") === "calm";   // ?glow=calm: groom's own calm glow in every room, to compare
export function furLight(color, k = 0.15, wrap = 0.3) { if (!GROOM_OFF && !GLOW_CALM && groomMod && groomMod.groomLight) groomMod.groomLight(color, k, wrap); }

export async function makeCat({ role = "seed", seed = "", find = "", wear = "cream", shells = 14, media = "./media/", play = null, coat = {}, rand = undefined, drape = null } = {}) {   /* rand, drape: passed through to the Avatar (2026-11-24, for a recorded take: rand from prancer-3d labs/shared/take.js takeRand(seed) so its blinks and glances can be saved; drape for cloth). Unset, every cat is built exactly as before */   /* coat: groom options, or null for the coat as minted */   /* play: a song for the Frontcat's guitar in place of the page's own loop: { beat, bar, bars, chords, acoustic } (a film gives the real song's strums) */
  let av, inst = null; const ROLE = role;
  if (ROLE === "seed") {   /* any Prancer 3D, by the generator's own code */
    const gen = await import("../../../p3d/gen/src/cat.js");
    if (find) for (let i = 0; i < 4000; i++) { const g = gen.rollSeed("find" + i); if (g.HOLD === find && !g.SPK && g.LASER === "None" && g.HAT === "None") { seed = "find" + i; break; } }
    const c = gen.buildCat(gen.rollSeed(seed), { shells, rand, drape }); av = c.cat; inst = c.inst;
  } else if (ROLE === "maestro") {   /* Maestro in 3D: one source for every place he stands, prancer-3d labs/shared/maestro3d.js (first written here, moved there so he cannot drift) */
    const { makeMaestro } = await import("../../../p3d/labs/shared/maestro3d.js"), c = makeMaestro({ wear: wear === "noruff" ? "cream" : wear, hold: wear === "cream", shells: Math.round(shells * 3), beard: wear !== "noruff", rand }); av = c.cat; inst = c.inst;
  } else av = new Avatar({ ...COAT, ...WEAR[ROLE] }, { shells, armK: ROLE === "music" ? 1.45 : 1, rand, drape });
  const holder = new THREE.Group(); holder.add(av.root); const props = new THREE.Group(); holder.add(props);

  /* made for the site: prints, and the things of each trade */
  /* a print lying on the chest, following the garment (the avatar's own surface: height, angle round the body, lift off it) */
  function print(draw, { y0 = 0.72, y1 = 1.08, half = 0.34, lift = 0.05 } = {}) {
    const n = 13, m = 13, pos = [], uv = [], idx = [], v = new THREE.Vector3();
    for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) { av.surface(y1 - (y1 - y0) * j / (m - 1), -half + 2 * half * i / (n - 1), lift, v); pos.push(v.x, v.y, v.z); uv.push(i / (n - 1), 1 - j / (m - 1)); }
    for (let j = 0; j < m - 1; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i; idx.push(a, a + n, a + 1, a + 1, a + n, a + n + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return add(av.b.hips, g, new THREE.MeshStandardMaterial({ map: canvasTex(512, 512, draw), transparent: true, roughness: 0.9, side: THREE.DoubleSide }));
  }
  const yinYang = (x, w) => { const c = w / 2, r = w * 0.4; x.fillStyle = "#f6f3ec"; x.beginPath(); x.arc(c, c, r, 0, TAU); x.fill(); x.fillStyle = "#141418"; x.beginPath(); x.arc(c, c, r, -Math.PI / 2, Math.PI / 2); x.arc(c, c + r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true); x.arc(c, c - r / 2, r / 2, Math.PI / 2, -Math.PI / 2, false); x.fill();
    x.beginPath(); x.arc(c, c - r / 2, r * 0.14, 0, TAU); x.fill(); x.fillStyle = "#f6f3ec"; x.beginPath(); x.arc(c, c + r / 2, r * 0.14, 0, TAU); x.fill(); x.strokeStyle = "#141418"; x.lineWidth = w * 0.022; x.beginPath(); x.arc(c, c, r, 0, TAU); x.stroke(); };
  const peace = (x, w) => { const c = w / 2, r = w * 0.36; x.strokeStyle = "#141418"; x.lineWidth = w * 0.055; x.lineCap = "round"; x.beginPath(); x.arc(c, c, r, 0, TAU); x.stroke(); x.beginPath(); x.moveTo(c, c - r); x.lineTo(c, c + r); x.moveTo(c, c); x.lineTo(c - r * 0.71, c + r * 0.71); x.moveTo(c, c); x.lineTo(c + r * 0.71, c + r * 0.71); x.stroke(); };
  /* (no shoes on any of them: Yoeshi, 2026-11-17, "go shoeless everywhere". Gold boots, red sandals and black dress shoes stood here until then.) */
  /* something held in the right paw, as the generator's held things are */
  function held(build) { const hold = new THREE.Group(), g = new THREE.Group(); hold.name = "held"; av.b.wrR.add(hold); hold.add(g); g.position.y = -0.08; g.scale.setScalar(1.5); build(g); hold.userData.grip = null; av.held = hold; }
  if (ROLE === "music") {
    // (no print on this tee: the guitar is held across the chest and hid all but a sliver of it)
    const beat = play ? play.beat : 60 / 84, bar = play ? play.bar : beat * 4, chords = play ? play.chords : [], acoustic = play ? play.acoustic : [], roots = [52, 47, 49, 45];
    if (!play) for (let b = 0; b < 40; b++) { const root = roots[b % 4], t0 = 1 + b * bar; chords.push({ root, tones: [root, root + 4, root + 7, root + 11], sec: "verse" }); for (const s of [0, 6, 8, 12, 14]) acoustic.push({ t: t0 + s * beat / 4, d: beat * 0.6, n: [root, root + 7, root + 12], dir: s % 4 === 2 ? "u" : "d", v: 0.5 }); }
    inst = makeInstrument("acoustic", av, { lead: 1, beat, bar, bars: play ? play.bars : 40, chords, parts: { acoustic } });   // the ruby cutaway, played
    /* under this page's daylight the ruby top washed out to salmon: its reds are deepened here, for this picture only */
    const seen = new Set(), px = (m) => { const im = m.map && m.map.image; if (!im || !im.getContext) return [1, 1, 1]; const d = im.getContext("2d").getImageData(im.width >> 1, im.height >> 1, 1, 1).data; return [d[0] / 255, d[1] / 255, d[2] / 255]; };
    inst.group.traverse((o) => { for (const m of [].concat(o.material || [])) { if (seen.has(m) || !m.color) continue; seen.add(m); const k = px(m), r = m.color.r * k[0], g = m.color.g * k[1], b = m.color.b * k[2];
      if (r > 1.7 * g && r > 1.4 * b) { m.color.multiplyScalar(0.6); if ("clearcoat" in m) { m.clearcoat = 1; m.clearcoatRoughness = 0.12; } m.needsUpdate = true; } } });
  }
  if (ROLE === "art") {
    print(peace);
    const art = await loadTex(media + "09-prancer-3d.jpg");
    held((g) => { const frame = M("#17171c", 0.35, { clearcoat: 0.6 }), screen = new THREE.MeshBasicMaterial({ map: art, color: art ? "#ffffff" : "#8a5cff" });   // a tablet with a Prancer 3D on its screen
      add(g, new THREE.BoxGeometry(0.52, 0.4, 0.03), frame, [-0.06, 0.24, 0.06]); add(g, new THREE.PlaneGeometry(0.47, 0.35), screen, [-0.06, 0.24, 0.076]); });
    /* a camera on a tripod, beside him */
    const tri = new THREE.Group(); tri.position.set(2.0, 0, 0.15); tri.rotation.y = -0.55; props.add(tri); const blk = M("#1b1b20", 0.5), top = 1.6, cy = top + 0.32;
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + Math.PI / 3; rod(tri, [0, top, 0], [Math.sin(a) * 0.62, 0, Math.cos(a) * 0.62], 0.035, blk); }
    add(tri, new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16), blk, [0, top + 0.04, 0]); add(tri, new THREE.BoxGeometry(0.66, 0.42, 0.34), M("#23232b", 0.42), [0, cy, 0]);
    add(tri, new THREE.CylinderGeometry(0.17, 0.19, 0.3, 28), M("#0f0f13", 0.25, { clearcoat: 1 }), [0.04, cy, 0.3], [Math.PI / 2, 0, 0]); add(tri, new THREE.CircleGeometry(0.13, 28), M("#40528a", 0.05, { clearcoat: 1, metalness: 0.4 }), [0.04, cy, 0.452]);
    add(tri, new THREE.BoxGeometry(0.24, 0.1, 0.2), M("#23232b", 0.42), [-0.1, cy + 0.26, 0]); add(tri, new THREE.CylinderGeometry(0.045, 0.045, 0.05, 16), M("#c4202f", 0.4), [0.22, cy + 0.235, 0]);
  }
  if (ROLE === "words") addProp(av, "Newspaper");

  /* alive on one clock: step(dt, where it looks, a move if any: { emote, emoteT, emoteLen }) */
  let t = 0; const ZERO = new THREE.Vector2();
  const cat = { holder, av, role: ROLE, seed, get t() { return t; }, set t(v) { t = v; }, get inst() { return inst; },   /* (set t: a recorded take restores the cast's own clock, 2026-11-24) */
    step(dt, look = ZERO, e = null) { t += dt; av.update({ t, dt, speed: 0, phase: 0, air: 0, vy: 0, land: 0, look, ...(e || {}) }); if (inst) inst.update(t); else if (av.held) holdPose(av, t, [], dt); } };
  holder.updateMatrixWorld(true); for (let i = 0; i < 140; i++) cat.step(1 / 60);   // standing as it will
  if (ROLE === "words") {   /* a studio microphone on a boom, its tip a paw's width from his mouth (placed once he stands as he will) */
    holder.updateMatrixWorld(true); const mo = holder.worldToLocal(av.mouth.g.getWorldPosition(new THREE.Vector3())), mic = new THREE.Group(); props.add(mic);
    const blk = M("#1b1b20", 0.45), base = new THREE.Vector3(2.05, 0, 0.5), headTop = mo.y + 1.2, tip = new THREE.Vector3(mo.x + 0.92, mo.y - 0.16, mo.z + 0.2), elbow = new THREE.Vector3(base.x, headTop, base.z);
    add(mic, new THREE.CylinderGeometry(0.42, 0.46, 0.06, 32), blk, [base.x, 0.03, base.z]); add(mic, new THREE.CylinderGeometry(0.035, 0.035, headTop, 12), blk, [base.x, headTop / 2, base.z]);
    const hang = new THREE.Vector3(tip.x, tip.y + 0.62, tip.z), arm = hang.clone().sub(elbow), boom = add(mic, new THREE.CylinderGeometry(0.03, 0.03, arm.length(), 10), blk, elbow.clone().addScaledVector(arm, 0.5).toArray()); boom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arm.clone().normalize());
    add(mic, new THREE.SphereGeometry(0.06, 12, 10), blk, elbow.toArray()); add(mic, new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), blk, [hang.x, hang.y - 0.08, hang.z]);
    add(mic, new THREE.CylinderGeometry(0.115, 0.115, 0.42, 24), M("#2a2a31", 0.35, { metalness: 0.6 }), [tip.x, tip.y + 0.3, tip.z]); add(mic, new THREE.CylinderGeometry(0.12, 0.12, 0.2, 24), M("#9aa0aa", 0.3, { metalness: 0.9 }), [tip.x, tip.y + 0.12, tip.z]);
    add(mic, new THREE.SphereGeometry(0.12, 24, 12, 0, TAU, Math.PI / 2, Math.PI / 2), M("#9aa0aa", 0.3, { metalness: 0.9 }), [tip.x, tip.y + 0.02, tip.z]);
    mic.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }
  holder.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  if (coat && !GROOM_OFF) { const groom = await groomOf(); if (groom) groom(av, coat); }   /* before the cat is first drawn */
  return cat;
}
