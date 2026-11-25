/* Prancer 3D: The Purrancers in the Sphere (a lab, this Mac only: prancer-band/show/lab3d.html). The eight players of
   the live show as Prancer 3D cats with their instruments, standing where the film's band cards stand, played from the
   song's own events (prancer-band/tools/song3d.py: the stems, read note by note) on the show's clock.
   Built to be gentle on an ordinary computer:
     tiers      high, mid, low, flat: how many shells of fur each cat wears up close (10, 6, 3, none), and how often a far cat moves
     distance   a cat that is small on screen wears fewer shells (none under 160 pixels tall: the coat alone reads cleaner)
     off screen a cat outside the view is neither drawn nor moved (the fur shells are not culled by three.js themselves)
     the solver a cat far away skips the after-pose collision pass and is posed every other frame
   makeBand3D({ scene, song, spots: { me: Vector3, nylon, ... }, height, facing(pos) -> yaw, tier }) ->
     { members, update(t, beat, camera, viewH), setTier(name), stats() } */
import * as THREE from "three";
import { genesFor } from "./genes.js";
import { Avatar, addWings } from "./avatar.js";
import { makeInstrument } from "./instruments.js";
import { bakeStatic, batchCoat } from "./bake.js";
import { coatMaterial } from "./coat.js";
import { setDetail } from "./detail.js";
import { addHat, addNeck } from "./wardrobe.js";

/* who stands at each of the show's spots (prancer-band/BAND.md) */
const BAND = {
  me: { id: "frontcat", seed: "yoeshi109", role: "singer", persona: true },
  nylon: { id: "ozzy", seed: "ny4", role: "guitar", sig: "Tez Stud", hat: ["Top Hat", ["#1c1a20"]] },
  upright: { id: "captain", seed: "up2", role: "bass", sig: "3D Glasses", wings: "#5a1416" },
  congas: { id: "moxie", seed: "cg4", role: "congas", sig: "Cat-Eye Glasses", hat: ["Beret", ["#17151b"]], neck: "Gold Chain" },
  sax: { id: "leo", seed: "sx2", role: "sax", sig: "Heart Glasses", hat: ["Pirate Hat"] },
  violin: { id: "toast", seed: "vn3", role: "violin", sig: "Aviators", hat: ["Party Hat", ["#ff8fb3", "#7fd6ff"]] },
  keys: { id: "zoomie", seed: "ky3", role: "keys", sig: "Gold Hoop" },
  beats: { id: "billie", seed: "bt2", role: "beats", sig: "Pearl", neck: "Gold Chain" },
};
const CHOIR = ["ozzy", "captain", "zoomie", "moxie", "billie"];   // who sings the harmonies, unless the song says (song.choir)
export const TIERS = { high: { shells: 10, near: 1, every: 1 }, mid: { shells: 6, near: 1.4, every: 1 }, low: { shells: 3, near: 2, every: 2 }, flat: { shells: 0, near: 2, every: 2 } };
const MAX = TIERS.high.shells, clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const at = (song, part, t) => { const a = song.parts[part] || []; let lo = 0, hi = a.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (a[m].t <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r < 0 ? null : a[r]; };

export function makeBand3D({ scene, song, spots, height = 1.2, facing = () => Math.PI, tier = "mid", bake = true, detail = 0.5 }) {
  const members = [], V = new THREE.Vector3(), Wp = new THREE.Vector3(), fr = new THREE.Frustum(), M = new THREE.Matrix4(), S = new THREE.Sphere();
  let T = TIERS[tier] || TIERS.mid, frame = 0, k = 1;
  setDetail(detail);
  /* the song's own lineup (prancer-band/tools/songs.py band=, carried in the song's events): who plays what in it, and
     who sings the harmonies; a song without one gets the band's own instruments (BAND) */
  const LINEUP = song.band || {}, choir = new Set(song.choir || CHOIR);
  for (const [nm, pos] of Object.entries(spots)) {
    const m = BAND[nm]; if (!m) continue;
    const G = { ...genesFor(m.seed), CHEEKS: "None", LASERC: "None", WINGS: false };   // as on their cards: the band wears what BAND.md gives it (its cards show no cheeks or lasers)
    const av = new Avatar(G, { persona: m.persona, sig: m.sig, shells: MAX, armK: 1.45 });
    const holder = new THREE.Group(); holder.position.copy(pos); holder.rotation.y = facing(pos); holder.add(av.root); scene.add(holder);
    if (m.hat) addHat(av, m.hat[0], m.hat[1] || []); if (m.wings) { av.wings = addWings(av, "Bat");   /* the generator's own bat wings, from the shoulder blades and out to the sides below the head (src/avatar.js;
        a colour passed in keeps the old set high behind the head, which read as growing out of it), coloured here in the Captain's red (Yoeshi, 2026-11-16:
        "push the most up to date designs of the prancer 3d to the bands look including the fixed wings") */
      const red = new THREE.Color(m.wings); for (const w of av.wings) w.traverse((o) => { if (!o.isMesh) return; const mt = o.material;
        if (o.geometry.type === "ShapeGeometry") { mt.color.copy(red); mt.emissive.copy(red).multiplyScalar(0.25); } else if (o.geometry.type === "CapsuleGeometry") { mt.color.set("#2a0a0c"); mt.emissive.set("#000000"); mt.emissiveIntensity = 0; } }); } if (m.neck) addNeck(av, m.neck, [G.C1, G.C2]);
    members.push({ ...m, nm, av, holder, idx: members.length, off: pos.x * 0.37 + pos.z * 0.21 });
  }
  /* one size for the whole band, from the frontcat: his ears reach the top of the film's card */
  { const o = members.find((m) => m.id === "frontcat") || members[0]; o.av.update({ t: 0, dt: 1 / 60, speed: 0, phase: 0, air: 0, vy: 0, land: 0, look: new THREE.Vector2() });
    o.holder.updateMatrixWorld(true); const bx = new THREE.Box3().setFromObject(o.av.root); k = height / (bx.max.y - bx.min.y); }
  for (const m of members) {
    m.holder.scale.setScalar(k); m.holder.updateMatrixWorld(true);
    const L = LINEUP[m.id]; if (L) { m.role = L.role; m.look = L.look; }
    m.inst = makeInstrument(m.role, m.av, song, m.look);
    m.shells = []; m.mats = new Set(); m.av.root.traverse((o) => { const u = o.material && o.material.userData && o.material.userData.u; if (o.isInstancedMesh && u && u.uShells) { m.shells.push(o); m.mats.add(u.uShells); } });
    m.n = -1; m.r = height * 0.75;   // how big a ball holds it, for the view test
  }
  setDetail(1);
  /* the groove: how much each section moves the band (the song's own sections; a steady middle when a song has none),
     and the drops, each the first sung note of a chorus, where the players on their feet with the instrument on them hop */
  const ENERGY = { intro: 0.45, verse: 0.65, chorus: 1, "final chorus": 1, "synth break": 0.85, riff: 0.9, bridge: 0.35, "open soul": 0.55, outro: 0.85, ending: 0.3 };
  const SEC = (song.sections || []).map((x) => ({ t: x.t, e: ENERGY[x.name] ?? 0.75 })), vocal = (song.parts && song.parts.vocal) || [];
  const DROPS = (song.sections || []).filter((x) => /chorus/.test(x.name)).map((x) => (vocal.find((e) => e.t >= x.t) || x).t);
  const energy = (t) => { if (!SEC.length) return 0.75; let i = 0; while (i < SEC.length - 1 && SEC[i + 1].t <= t) i++;
    const a = i ? SEC[i - 1].e : SEC[0].e, k = Math.min(1, (t - SEC[i].t) / (song.beat * 2)); return a + (SEC[i].e - a) * (k * k * (3 - 2 * k)); };   // a two-beat blend into each section
  const HOPS = new Set(["singer", "guitar", "acoustic", "sax", "violin", "flute", "shaker"]);   // the instrument rides on them (the rest are at a stand, the decks, the keys)
  /* character: how big each moves (a frontcat struts, the bass holds the floor) and where in the bar their sway sits */
  const STYLE = { frontcat: [1.1, 0], ozzy: [1, 0.5], captain: [0.7, 0.25], moxie: [1.15, 0.75], leo: [0.95, 0.4], toast: [1, 0.9], zoomie: [0.8, 0.6], billie: [1.05, 0.15] };
  function groove(m, t) { const b = m.av.b, [big, off] = STYLE[m.id] || [1, (m.idx * 0.37) % 1], E = energy(t) * big, ph = (t - song.lead) / song.beat, f = ((ph % 1) + 1) % 1;
    const dip = Math.pow(0.5 + 0.5 * Math.cos(f * Math.PI * 2), 1.5), sw = Math.sin((ph + off) * Math.PI), nod = Math.exp(-f * 6);
    /* the bounce: down on the beat through the knees (thigh forward, knee bent, ankle back, so the paws stay planted) */
    const seated = m.role === "drums";   /* (a drummer sits: the groove is in the body, the legs are on the pedals) */
    const q = seated ? 0 : 0.26 * E * dip; b.hips.position.y -= (seated ? 0.015 : 0.05) * E * dip; b.thL.rotation.x -= q; b.thR.rotation.x -= q; b.knL.rotation.x += q * 1.9; b.knR.rotation.x += q * 1.9; b.anL.rotation.x -= q * 0.9; b.anR.rotation.x -= q * 0.9;
    /* the sway, one way then the other over two beats: the hips roll, the legs stay under them, the chest answers */
    const r = (seated ? 0.02 : 0.075) * E * sw; b.hips.rotation.z += r; b.thL.rotation.z -= r; b.thR.rotation.z -= r; b.chest.rotation.z -= r * 0.7; b.chest.rotation.y += 0.07 * E * Math.sin((ph + off) * Math.PI + 0.6);
    /* the head: a nod on every beat, a tilt with the sway */
    b.neck.rotation.x += 0.09 * E * nod; b.head.rotation.z += 0.07 * E * Math.sin((ph + off) * Math.PI + 1.1);
    /* the tail keeps the time */
    m.av.tail.forEach((l, i) => (l.rotation.z += 0.18 * E * Math.sin((ph + off) * Math.PI - i * 0.5) * (0.4 + i / m.av.tail.length)));
    /* the drop: a hop (those carrying their instrument), or a big lift of the chest and head (the rest) */
    for (const d of DROPS) { const u = t - d + 0.12; if (u < 0 || u > 0.6) continue; const k = Math.sin(Math.PI * u / 0.6);
      if (HOPS.has(m.role) || (m.role === "bass" && m.look === "electric")) { b.hips.position.y += 0.32 * k; b.knL.rotation.x += 0.7 * k; b.knR.rotation.x += 0.7 * k; b.thL.rotation.x -= 0.35 * k; b.thR.rotation.x -= 0.35 * k; }
      b.chest.rotation.x -= 0.16 * k; b.head.rotation.x -= 0.2 * k; }
    /* the frontcat leans back into a long note */
    if (m.id === "frontcat") { const e = at(song, "vocal", t); if (e && e.d > 1.1 && t < e.t + e.d) { const k = Math.min(1, (t - e.t) / 0.8) * Math.min(1, (e.t + e.d - t) / 0.3); b.chest.rotation.x -= 0.12 * k; b.head.rotation.x -= 0.1 * k; } } }
  /* one cat at song time t: the move, the groove, the voice, the instrument */
  const LK = new THREE.Vector2();
  function pose(m, t, bk, look, every = 1) { const av = m.av;
    av.update({ t: Math.max(0, t) + m.off, dt: 1 / 60 * every, speed: 0, phase: 0, air: 0, vy: 0, land: 0, emote: null, emoteT: 0, emoteLen: 99, look });
    const bob = av.L.bear[3] * 0.12 + 0.05; av.b.neck.rotation.x += bob * bk * 0.5; if (bk || t > 0.05) groove(m, t);
    if (m.inst.pose) m.inst.pose(t);
    if (m.id === "frontcat") { const e = at(song, "vocal", t), on = e && t < e.t + e.d;
      if (on) { const p = (t - e.t) / e.d; av.sing((p < 0.08 ? p / 0.08 : 1 - p * 0.35) * (0.55 + e.v * 0.6) * (e.vow === "e" ? 0.75 : 1), e.vow); av.b.chest.rotation.x += 0.08; av.b.head.rotation.x -= (e.n - 62) * 0.012; }
      else av.sing(0, "a"); }
    else if (choir.has(m.id)) { const e = at(song, "choir", t), on = e && t < e.t + e.d; av.sing(on ? 0.32 + 0.06 * Math.sin(t * 5) : 0, on ? e.vow : "a"); }
    av.root.updateMatrixWorld(true); m.inst.update(t); }
  /* fewer draws: the still pieces merged, after playing each cat through moments from the whole song */
  const baked = { before: 0, after: 0 };
  if (bake) for (const m of members) { const r = bakeStatic(m.av.root, (i) => { const t = 3 + i * 5.13 + (i % 3) * 0.29; LK.set(Math.sin(i * 1.7) * 0.5, Math.cos(i * 1.3) * 0.15); pose(m, t, i % 2 ? 1 : 0, LK); }, 50);
    baked.before += r.before; baked.after += r.after; m.flip = r.flip; }
  /* the coat: one skinned mesh per cat, and its fur one instanced draw */
  if (bake) for (const m of members) m.coat = batchCoat(m.av, coatMaterial, MAX);
  /* the fine parts (whiskers, strings, catchlights, a stud): gone when the cat is small on screen */
  const bb = new THREE.Box3(), sz = new THREE.Vector3();
  for (const m of members) { m.fine = []; m.holder.updateMatrixWorld(true);
    m.av.root.traverse((o) => { if (!o.isMesh || !o.visible || o.name.startsWith("coat") || (m.flip && m.flip.has(o))) return; let v = true; for (let p = o.parent; p && p !== m.holder; p = p.parent) if (!p.visible) v = false; if (!v) return;
      bb.setFromObject(o); bb.getSize(sz); const P = o.geometry.parameters || {}, ws = o.getWorldScale(new THREE.Vector3()).x;
      const big = Math.max(sz.x, sz.y, sz.z), thin = Math.min(sz.x, sz.y, sz.z, o.geometry.type === "TubeGeometry" ? 2 * P.radius * ws : 9, o.geometry.type === "CylinderGeometry" ? 2 * Math.max(P.radiusTop, P.radiusBottom) * ws : 9);
      if (big < height * 0.06 || thin < height * 0.006) m.fine.push(o); });
    m.fineOn = true; }
  const wear = (m, n) => { if (m.n === n) return; m.n = n; if (m.coat) return m.coat.wear(n); for (const s of m.shells) { s.count = n; s.visible = n > 0; } for (const u of m.mats) u.value = Math.max(1, n); };

  function update(t, beat, camera, viewH) {
    frame++; camera.updateMatrixWorld(); fr.setFromProjectionMatrix(M.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const px = viewH / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)), bk = Math.exp(-(((beat % 1) + 1) % 1) * 5), live = t > 0.05;
    for (const m of members) {
      const av = m.av, h = m.holder; S.center.copy(h.position).setY(h.position.y + height * 0.5); S.radius = m.r;
      const seen = fr.intersectsSphere(S); h.visible = seen; if (!seen) continue;
      const tall = height / Math.max(0.3, S.center.distanceTo(camera.position)) * px;   // how many pixels tall it stands
      wear(m, tall < 160 ? 0 : tall < 300 ? Math.min(3, T.shells) : T.shells);   // far off, the coat alone reads cleaner than a few shells of fur (and is cheaper)
      const far = tall < 160, every = far ? Math.max(T.every, 2) : T.every, fine = tall > 180 * T.near;
      if (fine !== m.fineOn) { m.fineOn = fine; for (const o of m.fine) o.visible = fine; }
      m.av.fast = far || (frame + m.idx * 7) % 40 !== 0;   // the arms search near last frame's answer; a full search now and then (each cat on its own frame)
      if (frame % every !== 0 && m.posed) continue; m.posed = true;
      /* where the camera is, as the cat sees it: it looks your way (a little) */
      h.worldToLocal(Wp.copy(camera.position)); const yaw = Math.atan2(Wp.x, Wp.z), pitch = Math.atan2(Wp.y - 3.2, Math.hypot(Wp.x, Wp.z));
      LK.set(clamp(yaw, -0.8, 0.8) * 0.6, clamp(pitch, -0.4, 0.3) * 0.5 - 0.05);
      m.av.settleOff = far;   // far away: no after-pose collision pass (it would not show)
      pose(m, t, live ? bk : 0, LK, every);
    }
  }
  return { members, scale: k, baked, update, setTier(name) { T = TIERS[name] || T; for (const m of members) m.n = -1; }, tier: () => Object.keys(TIERS).find((x) => TIERS[x] === T),
    stats: () => members.map((m) => ({ id: m.id, seen: m.holder.visible, shells: m.n, fine: m.fineOn ? m.fine.length : 0 })) };
}
