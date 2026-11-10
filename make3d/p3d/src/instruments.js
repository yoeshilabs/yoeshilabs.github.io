/* Prancer 3D: the instruments, and how each Purrancer plays theirs. Every instrument is modelled in code, and every
   move is read from the song's own events (src/music.js): the strumming paw hits each strum, the fretting paw sits
   where the chord is, strings ring when struck, conga heads flex on each slap, the sax's keys go down by fingering, the
   bow turns at each note, the Rhodes keys of the actual chord go down, the pads light on the beat they play.
     makeInstrument(role, avatar, song) -> { group, update(t) }   (update after avatar.update(); it places the paws) */
import * as THREE from "three";
import { seg } from "./detail.js";
import { SDF } from "./epoch.js";
import { pocket } from "./avatar.js";
/* the latest event of a part at time t, and the next (as in music.js, kept here so a generator can carry the instruments
   without the music engine) */
const at = (song, part, t) => { const a = song.parts[part] || []; let lo = 0, hi = a.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (a[m].t <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r < 0 ? null : a[r]; };
const after = (song, part, t) => { const e = at(song, part, t), a = song.parts[part] || [], i = e ? a.indexOf(e) + 1 : 0; return a[i] || null; };

const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k, ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const W = () => new THREE.Vector3();
const mat = {
  chrome: () => new THREE.MeshPhysicalMaterial({ color: "#dfe3ea", metalness: 1, roughness: 0.18 }), brass: () => new THREE.MeshPhysicalMaterial({ color: "#d8a83a", metalness: 1, roughness: 0.24, clearcoat: 0.6 }),
  black: () => new THREE.MeshPhysicalMaterial({ color: "#121016", roughness: 0.45, clearcoat: 0.4 }), wood: (c, cc = 0.9) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, clearcoat: cc, clearcoatRoughness: 0.12 }),
  string: () => new THREE.MeshStandardMaterial({ color: "#e9e4d8", metalness: 0.8, roughness: 0.3 }), glow: (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0 }),
};
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), cyl = (r0, r1, h, m, s = 24) => new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, s), m);
const anchor = (parent, x, y, z) => { const a = new THREE.Object3D(); a.position.set(x, y, z); parent.add(a); return a; };

/* a body outline from overlapping bouts (circles), sampled round its centre: guitars, the violin, the upright bass */
function outline(bouts, waist = 0, cut = null, n = 120) {
  const s = new THREE.Shape();
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a); let best = 0;
    for (const [cx, cy, r] of bouts) { const b = dx * cx + dy * cy, c2 = cx * cx + cy * cy - r * r, disc = b * b - c2; if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc)); }
    const px = dx * best; best *= 1 - waist * Math.exp(-((px - (bouts[0][0] + bouts[1][0]) / 2) ** 2) / 0.012) * Math.abs(dy);
    if (cut && cut(dx * best, dy * best)) best *= 0.62;
    i ? s.lineTo(dx * best, dy * best) : s.moveTo(dx * best, dy * best); }
  return s;
}
const slab = (shape, depth, m) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 4 }); g.translate(0, 0, -depth / 2); return new THREE.Mesh(g, m); };

/* ------------------------------------------------------------------ guitars: the ruby cutaway acoustic and the nylon */
/* x runs along the neck (to the headstock), y across the strings (+y the bass side), z out of the face. The outline is a
   closed spline round the centre line: lower bout, waist, upper bout, and on the ruby a Venetian cutaway on the treble
   side, its horn pointing up the neck */
function guitarOutline(cut, n) {
  const top = [[-0.7, 0], [-0.665, 0.22], [-0.55, 0.37], [-0.37, 0.425], [-0.18, 0.4], [-0.02, 0.33], [0.09, 0.3], [0.21, 0.318], [0.35, 0.312], [0.47, 0.24], [0.548, 0.12], [0.566, 0]];
  const low = cut ? [[0.545, -0.075], [0.46, -0.1], [0.385, -0.13], [0.36, -0.2], [0.395, -0.272], [0.33, -0.318], [0.21, -0.318]] : top.slice(7, 11).reverse().map(([x, y]) => [x, -y]);
  const ring = [...top, ...low, ...top.slice(1, 7).reverse().map(([x, y]) => [x, -y])];
  return new THREE.CatmullRomCurve3(ring.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "centripetal").getPoints(n).map((v) => new THREE.Vector2(v.x, v.y));
}
function guitar(style) {
  const g = new THREE.Group(), ruby = style === "ruby", HD = 0.1, top = ruby ? mat.wood("#9b1b30") : mat.wood("#e2bf86"), side = ruby ? mat.wood("#5e0e1c") : mat.wood("#6a3520"), cream = mat.wood("#f1e6cc", 0.6);
  const rim = guitarOutline(ruby, 160), body = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(rim), { depth: 0.15, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 3, curveSegments: 4 }).translate(0, 0, -0.075), [top, side]); g.add(body);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim.map((v) => new THREE.Vector3(v.x, v.y, HD - 0.004)), true), seg(200), 0.013, seg(6), true), cream));   // the binding
  const at2 = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
  at2(new THREE.Mesh(new THREE.CircleGeometry(0.1, seg(40)), new THREE.MeshBasicMaterial({ color: "#100808" })), 0.17, 0, HD + 0.002);   // the sound hole and its rosette
  at2(new THREE.Mesh(new THREE.RingGeometry(0.11, 0.138, seg(56)), ruby ? mat.brass() : new THREE.MeshPhysicalMaterial({ color: "#3a6f6a", roughness: 0.2, iridescence: 1 })), 0.17, 0, HD + 0.003);
  at2(new THREE.Mesh(new THREE.RingGeometry(0.146, 0.152, seg(56)), cream), 0.17, 0, HD + 0.003);
  if (ruby) { const pg = at2(new THREE.Mesh(new THREE.CircleGeometry(0.12, seg(36)), mat.black()), 0.05, -0.2, HD + 0.004); pg.scale.set(1.35, 0.72, 1); pg.rotation.z = -0.5; }   // the pickguard
  at2(box(0.075, 0.3, 0.024, mat.wood("#24150e", 0.5)), -0.34, 0, HD + 0.012);   // the bridge, its saddle and pins
  at2(box(0.012, 0.21, 0.016, cream), -0.315, 0, HD + 0.03);
  for (let i = 0; i < 6; i++) { const pin = at2(cyl(0.01, 0.01, 0.014, ruby ? cream : mat.wood("#24150e"), 8), -0.36, -0.075 + i * 0.03, HD + 0.028); pin.rotation.x = Math.PI / 2; }
  /* the neck: a round-backed shaft, a heel into the body, the fretboard (over the body to the sound hole), frets, dots, the nut */
  const nut = 1.425, scale = 1.745, fx = (f) => nut - scale * (1 - Math.pow(2, -f / 12)), wood = mat.wood(ruby ? "#3a2214" : "#6a3520", 0.5);
  const shaft = at2(new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.064, 0.93, seg(18), seg(1), false, 0, Math.PI), wood), 0.96, 0, HD); shaft.rotation.set(Math.PI / 2, 0, Math.PI / 2); shaft.scale.z = 0.8;
  const heel = at2(new THREE.Mesh(new THREE.SphereGeometry(0.07, seg(16), seg(12)), wood), 0.52, 0, HD - 0.07); heel.scale.set(0.9, 0.85, 1.3);
  at2(box(nut - 0.27, 0.11, 0.028, mat.wood("#20140e", 0.3)), (nut + 0.27) / 2, 0, HD + 0.016);
  for (let i = 1; i <= 19; i++) if (fx(i) > 0.28) at2(box(0.008, 0.112, 0.008, mat.chrome()), fx(i), 0, HD + 0.032);
  for (const i of [3, 5, 7, 9, 12, 15]) for (const y of i === 12 ? [-0.03, 0.03] : [0]) at2(new THREE.Mesh(new THREE.CircleGeometry(0.011, seg(12)), new THREE.MeshBasicMaterial({ color: "#f2ead8" })), (fx(i) + fx(i - 1)) / 2, y, HD + 0.031);
  at2(box(0.018, 0.116, 0.02, cream), nut + 0.005, 0, HD + 0.036);
  /* the headstock, angled back, with its tuners */
  const hs = new THREE.Group(); hs.position.set(nut + 0.01, 0, HD + 0.01); hs.rotation.y = 0.24; g.add(hs);
  const plate = box(0.3, 0.135, 0.034, ruby ? mat.black() : wood); plate.position.x = 0.16; hs.add(plate);
  for (let i = 0; i < 6; i++) { const s2 = i < 3 ? 1 : -1, x = 0.07 + (i % 3) * 0.085;
    const post = cyl(0.009, 0.009, 0.05, mat.chrome(), 8); post.rotation.x = Math.PI / 2; post.position.set(x, s2 * 0.04, 0.03); hs.add(post);
    const key = cyl(0.022, 0.022, 0.016, ruby ? mat.chrome() : cream, 12); key.position.set(x, s2 * 0.1, -0.005); key.scale.z = 0.55; hs.add(key); }
  /* the strings, saddle to nut */
  const strings = [];
  for (let i = 0; i < 6; i++) { const a = new THREE.Vector3(-0.315, -0.052 + i * 0.021, HD + 0.044), b = new THREE.Vector3(nut, -0.042 + i * 0.0168, HD + 0.048), d = b.clone().sub(a);
    const st = cyl(0.0032 + (5 - i) * 0.0008, 0.0032 + (5 - i) * 0.0008, d.length(), mat.string(), 6); st.position.copy(a).addScaledVector(d, 0.5); st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    st.userData.z = st.position.z; g.add(st); strings.push(st); }
  return { g, strings, HD, neckAt: fx, rim: guitarOutline(ruby, 40) };
}

/* ------------------------------------------------------------------ the upright bass */
function upright() {
  const g = new THREE.Group(), varnish = mat.wood("#7a3a12"), dark = mat.wood("#3a1606");
  const body = slab(outline([[0, -0.32, 0.5], [0, 0.42, 0.38]], 0.4), 0.34, [varnish, dark]); body.position.y = 1.05; g.add(body);
  for (const s of [-1, 1]) { const f = box(0.025, 0.36, 0.01, new THREE.MeshBasicMaterial({ color: "#120604" })); f.position.set(0.17 * s, 1.05, 0.19); f.rotation.z = 0.12 * s; g.add(f); }
  const board = box(0.1, 2.0, 0.05, mat.black()); board.position.set(0, 2.15, 0.19); g.add(board); const neck = box(0.12, 0.7, 0.12, varnish); neck.position.set(0, 2.9, 0.12); g.add(neck);
  const scroll = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.035, seg(12), seg(24)), varnish); scroll.rotation.y = Math.PI / 2; scroll.position.set(0, 3.32, 0.12); g.add(scroll);
  const tail = box(0.12, 0.34, 0.03, mat.black()); tail.position.set(0, 0.48, 0.2); g.add(tail); const br = box(0.24, 0.12, 0.02, mat.wood("#d9b37a", 0.2)); br.position.set(0, 0.88, 0.22); g.add(br);
  const pin = cyl(0.015, 0.008, 0.3, mat.chrome(), 8); pin.position.y = 0.15; g.add(pin);
  const strings = []; for (let i = 0; i < 4; i++) { const s = cyl(0.008 - i * 0.001, 0.008 - i * 0.001, 2.75, mat.string(), 6); s.position.set(-0.045 + i * 0.03, 1.98, 0.225); g.add(s); strings.push(s); }
  return { g, strings, pluck: anchor(g, 0.02, 1.32, 0.27), neckAt: (fret) => 3.1 - (1 - Math.pow(2, -fret / 12)) * 2.0 };
}

/* ------------------------------------------------------------------ congas */
function conga(h, r) {
  const g = new THREE.Group(), pts = []; for (let i = 0; i <= 16; i++) { const y = i / 16; pts.push(new THREE.Vector2(r * (0.78 + 0.32 * Math.sin(Math.PI * Math.pow(y, 0.85))) * (y > 0.97 ? 1.02 : 1), y * h)); }
  const shell = new THREE.Mesh(new THREE.LatheGeometry(pts, seg(40)), new THREE.MeshPhysicalMaterial({ color: "#b8571c", roughness: 0.35, clearcoat: 1, side: THREE.DoubleSide })); g.add(shell);
  for (let i = 0; i < 12; i++) { const st = box(0.006, h * 0.96, 0.006, new THREE.MeshBasicMaterial({ color: "#5e2508" })); const a = i / 12 * Math.PI * 2; st.position.set(Math.cos(a) * r * 1.06, h / 2, Math.sin(a) * r * 1.06); g.add(st); }   // the staves
  for (const y of [0.12, h - 0.05]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r * (y > 0.5 ? 1.02 : 0.8), 0.018, seg(8), seg(40)), mat.chrome()); ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring); }
  const skin = new THREE.Mesh(new THREE.CircleGeometry(r * 0.98, seg(40)), new THREE.MeshStandardMaterial({ color: "#efe0bd", roughness: 0.8 })); skin.rotation.x = -Math.PI / 2; skin.position.y = h + 0.005; g.add(skin);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, l = cyl(0.012, 0.012, 0.22, mat.chrome(), 6); l.position.set(Math.cos(a) * r * 1.07, h - 0.14, Math.sin(a) * r * 1.07); g.add(l); }   // the tuning lugs
  return { g, skin, top: h };
}

/* ------------------------------------------------------------------ the alto sax */
function sax() {
  const g = new THREE.Group(), b = mat.brass(), path = new THREE.CatmullRomCurve3([[0, 0, 0], [0, -0.04, -0.1], [0, -0.16, -0.16], [0, -0.5, -0.14], [0, -0.95, -0.1], [0, -1.12, -0.04], [0, -1.12, 0.08], [0, -0.98, 0.14]].map((p) => new THREE.Vector3(...p)));
  const segs = 7; for (let i = 0; i < segs; i++) { const sub = new THREE.CatmullRomCurve3(Array.from({ length: 6 }, (_, k) => path.getPoint((i + k / 5) / segs)));   // the tube widens toward the bell
    g.add(new THREE.Mesh(new THREE.TubeGeometry(sub, seg(12), 0.03 + i * 0.011, seg(16)), b)); }
  const bellPts = Array.from({ length: 14 }, (_, i) => { const y = i / 13; return new THREE.Vector2(0.1 + 0.13 * Math.pow(y, 2.4), y * 0.32); });
  const bell = new THREE.Mesh(new THREE.LatheGeometry(bellPts, seg(40)), new THREE.MeshPhysicalMaterial({ color: "#d8a83a", metalness: 1, roughness: 0.2, side: THREE.DoubleSide })); bell.position.set(0, -0.98, 0.14); bell.rotation.x = -0.25; g.add(bell);
  const mp = cyl(0.016, 0.026, 0.1, mat.black(), 12); mp.rotation.x = Math.PI / 2 + 0.6; mp.position.set(0, 0.0, 0.03); g.add(mp);
  const keys = []; for (let i = 0; i < 7; i++) { const k = cyl(0.026, 0.026, 0.012, new THREE.MeshPhysicalMaterial({ color: "#f3eee4", roughness: 0.2, clearcoat: 1, iridescence: 0.5 }), 16);
    k.rotation.x = Math.PI / 2 - 0.1; k.position.set(0.0, -0.36 - i * 0.1, -0.14 + i * 0.006 + 0.075 + i * 0.004); g.add(k); keys.push(k); }
  return { g, keys, upper: anchor(g, 0.02, -0.5, 0.0), lower: anchor(g, 0.02, -0.86, 0.04) };
}

/* ------------------------------------------------------------------ the violin and its bow */
function violin() {
  const g = new THREE.Group(), body = slab(outline([[-0.12, 0, 0.17], [0.13, 0, 0.14]], 0.45), 0.08, [mat.wood("#a2521c"), mat.wood("#6a2e0c")]); g.add(body);
  for (const s of [-1, 1]) { const f = box(0.1, 0.012, 0.01, new THREE.MeshBasicMaterial({ color: "#1a0a04" })); f.position.set(-0.04, 0.07 * s, 0.05); f.rotation.z = 0.2 * s; g.add(f); }
  const board = box(0.42, 0.045, 0.02, mat.black()); board.position.set(0.24, 0, 0.065); g.add(board); const scroll = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.015, seg(8), seg(16)), mat.wood("#a2521c")); scroll.rotation.x = Math.PI / 2; scroll.position.set(0.5, 0, 0.04); g.add(scroll);
  const chin = box(0.1, 0.12, 0.03, mat.black()); chin.position.set(-0.22, 0.06, 0.05); g.add(chin); const br = box(0.012, 0.07, 0.03, mat.wood("#e6c48a", 0.2)); br.position.set(-0.05, 0, 0.065); g.add(br);
  for (let i = 0; i < 4; i++) { const s = cyl(0.0022, 0.0022, 0.62, mat.string(), 5); s.rotation.z = Math.PI / 2; s.position.set(0.16, -0.015 + i * 0.01, 0.078); g.add(s); }
  const bow = new THREE.Group(), stick = cyl(0.008, 0.006, 0.9, mat.wood("#5a2a10", 0.6), 8); stick.position.y = 0.45; bow.add(stick);
  const hair = box(0.012, 0.86, 0.004, new THREE.MeshStandardMaterial({ color: "#f4efe2", roughness: 0.9 })); hair.position.set(0.025, 0.45, 0); bow.add(hair); const frog = box(0.04, 0.07, 0.03, mat.black()); frog.position.set(0.015, 0.04, 0); bow.add(frog);
  return { g, bow, contact: anchor(g, -0.08, 0, 0.09), neck: anchor(g, 0.4, -0.03, 0.06) };
}

/* ------------------------------------------------------------------ the DJ table: two turntables, a mixer, a grid of pads */
function decks() {
  const g = new THREE.Group(), table = box(2.0, 1.12, 0.62, mat.black()); table.position.set(0, 0.56, 0); g.add(table);
  const strip = box(1.96, 0.05, 0.01, mat.glow("#ff5fa8")); strip.position.set(0, 0.95, 0.315); g.add(strip);
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 128; const x = cv.getContext("2d"); x.fillStyle = "#0b0912"; x.fillRect(0, 0, 512, 128); x.font = "bold 76px ui-rounded, system-ui, sans-serif"; x.textAlign = "center"; x.fillStyle = "#ffd36e"; x.fillText("PURR", 256, 92);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), toneMapped: false })); logo.position.set(0, 0.55, 0.315); g.add(logo);
  const plat = []; for (const s of [1]) { const base = box(0.62, 0.08, 0.5, mat.chrome()); base.position.set(0.6 * s, 1.16, 0); g.add(base);
    const cvv = document.createElement("canvas"); cvv.width = cvv.height = 256; const v = cvv.getContext("2d"); v.fillStyle = "#0a0a0c"; v.beginPath(); v.arc(128, 128, 126, 0, 7); v.fill();
    for (let r = 40; r < 124; r += 3) { v.strokeStyle = `rgba(255,255,255,${0.05 + (r % 9 === 0 ? 0.06 : 0)})`; v.beginPath(); v.arc(128, 128, r, 0, 7); v.stroke(); }
    v.fillStyle = "#ff5fa8"; v.beginPath(); v.arc(128, 128, 36, 0, 7); v.fill(); v.fillStyle = "#ffd36e"; v.font = "bold 22px system-ui"; v.textAlign = "center"; v.fillText("PURR", 128, 136);
    const rec = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.012, seg(48)), [new THREE.MeshStandardMaterial({ color: "#0a0a0c" }), new THREE.MeshPhysicalMaterial({ map: new THREE.CanvasTexture(cvv), roughness: 0.25, clearcoat: 1 }), mat.black()]);
    rec.position.set(0.6 * s, 1.21, 0); g.add(rec); plat.push(rec);
    const arm = cyl(0.008, 0.008, 0.36, mat.chrome(), 6); arm.rotation.set(Math.PI / 2, 0, 0.5); arm.position.set(0.6 * s + 0.2, 1.24, -0.05); g.add(arm); }
  const mixer = box(0.36, 0.08, 0.46, mat.black()); mixer.position.set(0.05, 1.16, 0); g.add(mixer);
  for (let i = 0; i < 6; i++) { const k = cyl(0.018, 0.018, 0.03, mat.chrome(), 12); k.position.set(-0.05 + (i % 2) * 0.2, 1.22, -0.15 + Math.floor(i / 2) * 0.1); g.add(k); }
  const fader = box(0.04, 0.03, 0.06, mat.glow("#7fe0ff")); fader.position.set(0.05, 1.22, 0.14); g.add(fader);
  const pads = []; for (let i = 0; i < 16; i++) { const p = box(0.1, 0.03, 0.1, new THREE.MeshStandardMaterial({ color: "#1a1626", emissive: ["#ff5fa8", "#7fe0ff", "#ffd36e", "#9dff8a"][i % 4], emissiveIntensity: 0 }));
    p.position.set(-0.78 + (i % 4) * 0.12, 1.17, -0.18 + Math.floor(i / 4) * 0.12); g.add(p); pads.push(p); }
  return { g, plat, pads, strip, fader, padAt: (i) => pads[i].position };
}

/* ------------------------------------------------------------------ the drum kit (the band's, on the riser: Billie's) */
/* in the drummer's own space (it sits at z 0 facing +z, its left +x): the kick in front with the band's name on its front
   head, the snare over the left knee, the hi-hat to the left, two rack toms on the kick, the floor tom to the right, the
   crash and the ride up on the right, a throne low enough for the paws to rest on the pedals. Black gloss and chrome */
function drumKit() {
  const g = new THREE.Group(), finish = new THREE.MeshPhysicalMaterial({ color: "#15121c", roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.35, metalness: 0.3 });
  const chrome = mat.chrome(), headM = new THREE.MeshStandardMaterial({ color: "#d9d1c3", roughness: 0.9 }), inner = new THREE.MeshBasicMaterial({ color: "#07060a", side: THREE.BackSide });
  const brassM = new THREE.MeshPhysicalMaterial({ color: "#d9b24a", metalness: 1, roughness: 0.28, clearcoat: 0.5, side: THREE.DoubleSide });
  /* the drums and cymbals stand out in front of a cat's round belly (DZ further than a person's kit); the throne and the
     pedals stay under the drummer */
  const DZ = 0.5, F = new THREE.Group(); F.position.z = DZ; g.add(F);
  const put = (o, x, y, z, rx = 0, ry = 0, rz = 0, to = F) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); to.add(o); return o; };
  const leg3 = (x, z, h, r = 0.2, to = F) => { for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, l = cyl(0.012, 0.012, h * 0.5, chrome, 6); l.position.set(x + Math.cos(a) * r * 0.5, h * 0.22, z + Math.sin(a) * r * 0.5); l.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); to.add(l); } };
  const pole = (x, z, y0, y1, to = F) => { const p = cyl(0.016, 0.016, y1 - y0, chrome, 8); p.position.set(x, (y0 + y1) / 2, z); to.add(p); };
  /* a drum: shell, its coated head on top (local +y), hoops and lugs; returns its group and head */
  const drum = (r, depth) => { const d = new THREE.Group(), sh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, depth, seg(32), 1, true), finish); d.add(sh);
    const inn = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.99, r * 0.99, depth, seg(32), 1, true), inner); d.add(inn);
    const head = new THREE.Mesh(new THREE.CircleGeometry(r * 0.98, seg(32)), headM); head.rotation.x = -Math.PI / 2; head.position.y = depth / 2 + 0.004; d.add(head);
    for (const y of [depth / 2, -depth / 2]) { const h = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, 0.012, seg(6), seg(32)), chrome); h.rotation.x = Math.PI / 2; h.position.y = y; d.add(h); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, l = box(0.025, depth * 0.55, 0.03, chrome); l.position.set(Math.cos(a) * (r + 0.012), 0, Math.sin(a) * (r + 0.012)); l.rotation.y = -a; d.add(l); }
    return { d, head }; };
  const cymbal = (r) => { const pts = [[0.001, 0.035], [0.04, 0.032], [0.06, 0.016], [r * 0.5, 0.0], [r, -0.022]].map(([x, y]) => new THREE.Vector2(x, y));
    const c = new THREE.Group(), m = new THREE.Mesh(new THREE.LatheGeometry(pts, seg(40)), brassM); c.add(m); return c; };
  /* the kick, on its side, the band's name on its front head */
  const kick = drum(0.4, 0.48); kick.d.rotation.x = Math.PI / 2; put(kick.d, -0.12, 0.41, 1.12, Math.PI / 2);
  const cv = document.createElement("canvas"); cv.width = cv.height = 512; const x2 = cv.getContext("2d"); x2.fillStyle = "#15121c"; x2.beginPath(); x2.arc(256, 256, 250, 0, 7); x2.fill();
  x2.strokeStyle = "#ff5fa8"; x2.lineWidth = 14; x2.beginPath(); x2.arc(256, 256, 236, 0, 7); x2.stroke(); x2.fillStyle = "#ffd36e"; x2.textAlign = "center"; x2.font = "bold 64px ui-rounded, system-ui, sans-serif"; x2.fillText("THE", 256, 210); x2.font = "bold 70px ui-rounded, system-ui, sans-serif"; x2.fillText("PURRANCERS", 256, 290);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; const front = new THREE.Mesh(new THREE.CircleGeometry(0.392, seg(40)), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })); put(front, -0.12, 0.41, 1.365);
  for (const s2 of [-1, 1]) { const spur = cyl(0.012, 0.012, 0.3, chrome, 6); put(spur, -0.12 + s2 * 0.36, 0.12, 1.3, 0.5, 0, s2 * 0.6); }
  /* the snare, the toms */
  const snare = drum(0.2, 0.14); put(snare.d, 0.16, 0.84, 0.66, -0.12); pole(0.16, 0.66, 0.04, 0.77); leg3(0.16, 0.66, 0.5);
  const tom1 = drum(0.17, 0.2); put(tom1.d, 0.12, 1.1, 1.0, -0.42, 0, -0.12); const tom2 = drum(0.18, 0.22); put(tom2.d, -0.34, 1.1, 1.0, -0.42, 0, 0.14);
  const mount = cyl(0.02, 0.02, 0.32, chrome, 8); put(mount, -0.11, 0.86, 1.04);
  const floor = drum(0.23, 0.4); put(floor.d, -0.66, 0.6, 0.62, -0.05); for (const [lx, lz] of [[-0.86, 0.5], [-0.5, 0.48], [-0.68, 0.84]]) { const l = cyl(0.014, 0.014, 0.42, chrome, 6); put(l, lx, 0.2, lz); }
  /* cymbals on their stands: the hi-hat (two, its pedal), the crash and the ride */
  const hhTop = cymbal(0.2), hhBot = cymbal(0.2); put(hhBot, 0.45, 0.99, 0.48, Math.PI); put(hhTop, 0.45, 1.03, 0.48); pole(0.45, 0.48, 0.04, 0.99); leg3(0.45, 0.48, 0.5);   // over the snare's edge, where the left stick reaches with its elbow bent
  const crash = cymbal(0.3); put(crash, -0.36, 1.62, 1.12, -0.5, 0, 0.1); pole(-0.3, 1.25, 0.04, 1.55); leg3(-0.3, 1.25, 0.6);
  const ride = cymbal(0.34); put(ride, -0.86, 1.32, 0.9, -0.38, 0, 0.3); for (const c of [hhTop, crash, ride]) c.userData.rx = c.rotation.x; pole(-0.98, 0.98, 0.04, 1.26); leg3(-0.98, 0.98, 0.6);
  /* the throne, the pedals and the kick's beater */
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.09, seg(24)), new THREE.MeshPhysicalMaterial({ color: "#1b1720", roughness: 0.6, sheen: 1 })); put(seat, 0, 0.41, -0.04, 0, 0, 0, g); pole(0, -0.04, 0.04, 0.37, g); leg3(0, -0.04, 0.4, 0.28, g);
  const kp = box(0.13, 0.02, 0.5, chrome); put(kp, -0.16, 0.05, 1.08, 0.08, 0, 0, g); const hp = box(0.12, 0.02, 0.36, chrome); put(hp, 0.42, 0.05, 0.98, 0.12, 0, 0, g);   // the pedals, from the paws out to the drums
  const beater = new THREE.Group(); beater.position.set(-0.12, 0.12, 0.84); F.add(beater); const rod = cyl(0.008, 0.008, 0.3, chrome, 6); rod.position.y = 0.15; beater.add(rod);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.04, seg(12), seg(8)), new THREE.MeshStandardMaterial({ color: "#f3efe6", roughness: 0.9 })); ball.position.y = 0.3; beater.add(ball);
  /* where a stick lands on each: the near part of a head, the near edge of a cymbal (in the drummer's space) */
  const at3 = (o, x, y, z) => { o.updateMatrix(); return P(x, y, z).applyMatrix4(o.matrix).add(P(0, 0, DZ)); };
  const SPOT = { snare: at3(snare.d, 0, 0.075, -0.06), hat: at3(hhTop, 0, 0.04, -0.16), tom1: at3(tom1.d, 0, 0.11, -0.04), tom2: at3(tom2.d, 0, 0.12, -0.04), floor: at3(floor.d, 0.05, 0.21, -0.07),
    crash: at3(crash, 0.04, 0.02, -0.22), ride: at3(ride, 0.05, 0.03, -0.2) };
  return { g, SPOT, heads: { snare: snare.head, tom1: tom1.head, tom2: tom2.head, floor: floor.head, kick: front }, cymbals: { hat: hhTop, crash, ride }, beater, parts: { snare: snare.d, tom1: tom1.d, tom2: tom2.d, floor: floor.d } };
}
function stick() { const s = new THREE.Group(), w = cyl(0.014, 0.019, 0.56, mat.wood("#e8c896", 0.4), 8); w.position.y = 0.28; s.add(w);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.019, seg(10), seg(8)), mat.wood("#f0d8a8", 0.4)); tip.position.y = 0.56; s.add(tip); return s; }

/* ------------------------------------------------------------------ the Rhodes on its stand */
function rhodesKeys(style = "rhodes") {   // style "synth": the same keys in a synthesizer's black case, knobs and a lit screen on its panel
  const g = new THREE.Group(), lo = 48, hi = 84, whites = [], keys = {}, isB = (m) => [1, 3, 6, 8, 10].includes(m % 12), syn = style === "synth";
  for (let m = lo; m <= hi; m++) if (!isB(m)) whites.push(m); const kw = 1.9 / whites.length;
  const casing = box(2.06, 0.2, 0.44, new THREE.MeshPhysicalMaterial({ color: syn ? "#1d1b22" : "#7a1220", roughness: 0.4, clearcoat: 0.8 })); casing.position.set(0, 1.08, 0.02); g.add(casing);
  const lid = box(2.06, 0.05, 0.16, mat.black()); lid.position.set(0, 1.2, -0.12); g.add(lid);
  if (syn) { const wood = mat.wood("#5a3018", 0.5); for (const s2 of [-1, 1]) { const ch = box(0.05, 0.27, 0.46, wood); ch.position.set(1.055 * s2, 1.1, 0.02); g.add(ch); }   // walnut end cheeks
    for (let i = 0; i < 9; i++) { const kn = cyl(0.022, 0.026, 0.03, new THREE.MeshPhysicalMaterial({ color: i % 3 ? "#e8e4dc" : "#ff7a3a", roughness: 0.3, clearcoat: 0.6 }), 12); kn.position.set(-0.86 + i * 0.13 + (i > 5 ? 0.22 : 0), 1.24, -0.12); g.add(kn); }
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.07), new THREE.MeshStandardMaterial({ color: "#0c2a24", emissive: "#3cf0c0", emissiveIntensity: 0.9 })); scr.rotation.x = -Math.PI / 2; scr.position.set(0.12, 1.2265, -0.12); g.add(scr); }
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 64; const x = cv.getContext("2d"); x.fillStyle = "#121016"; x.fillRect(0, 0, 512, 64); x.font = syn ? "bold 38px Futura, 'Avenir Next', sans-serif" : "italic bold 40px Georgia, serif"; x.fillStyle = syn ? "#ff9a5c" : "#e9e4d8"; x.textAlign = "center"; x.fillText(syn ? "SYNTHPURR" : "Purrhodes", 256, 46);
  const name = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.075), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })); name.position.set(0, 1.12, -0.242); name.rotation.y = Math.PI; g.add(name);   // on the face away from the player
  const wm = new THREE.MeshPhysicalMaterial({ color: "#f6f1e6", roughness: 0.25, clearcoat: 0.6 }), bm = new THREE.MeshPhysicalMaterial({ color: "#16131a", roughness: 0.3, clearcoat: 0.8 });
  whites.forEach((m, i) => { const k = new THREE.Group(); k.position.set(-0.95 + kw * (i + 0.5), 1.2, 0.24); const key = box(kw * 0.93, 0.04, 0.3, wm); key.position.z = -0.15; k.add(key); g.add(k); keys[m] = k; });
  for (let m = lo; m <= hi; m++) if (isB(m)) { const i = whites.indexOf(m - 1), k = new THREE.Group(); k.position.set(-0.95 + kw * (i + 1), 1.235, 0.15); const key = box(kw * 0.55, 0.045, 0.19, bm); key.position.z = -0.1; k.add(key); g.add(k); keys[m] = k; }
  for (const s of [-1, 1]) { const leg = cyl(0.025, 0.025, 1.25, mat.chrome(), 8); leg.position.set(0.6 * s, 0.5, -0.05); leg.rotation.z = 0.45 * s; g.add(leg); const leg2 = leg.clone(); leg2.rotation.z = -0.45 * s; g.add(leg2); }
  return { g, keys, keyX: (m) => keys[clamp(m, lo, hi)].position.x, lo, hi };
}

/* ------------------------------------------------------------------ the semi-hollow electric (clean jazz and neo soul tones) */
/* as the guitars: x along the neck, y across the strings, z out of the face. A double cutaway with two horns, a thin
   arched body in a tobacco sunburst with cream binding, f-holes, two humbuckers, a bridge and a stop tailpiece */
function semiOutline(n) {
  const half = [[-0.72, 0], [-0.69, 0.2], [-0.58, 0.34], [-0.4, 0.41], [-0.2, 0.39], [-0.04, 0.33], [0.08, 0.32], [0.2, 0.33], [0.34, 0.31], [0.43, 0.25], [0.43, 0.18], [0.36, 0.13], [0.3, 0.08]];
  const ring = [...half, ...half.slice(1).reverse().map(([x, y]) => [x, -y])];
  return new THREE.CatmullRomCurve3(ring.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "centripetal").getPoints(n).map((v) => new THREE.Vector2(v.x, v.y));
}
function semiGuitar() {
  const g = new THREE.Group(), HD = 0.075, cream = mat.wood("#f1e6cc", 0.6), rim = semiOutline(160);
  const cv = document.createElement("canvas"); cv.width = cv.height = 512; const x = cv.getContext("2d"), gr = x.createRadialGradient(300, 256, 30, 290, 256, 300);   // the sunburst, and its f-holes
  gr.addColorStop(0, "#f2b24a"); gr.addColorStop(0.45, "#c9721e"); gr.addColorStop(0.78, "#5a2a0e"); gr.addColorStop(1, "#1e0d06"); x.fillStyle = gr; x.fillRect(0, 0, 512, 512);
  x.fillStyle = "#120806"; for (const s2 of [-1, 1]) { x.save(); x.translate(250, 256 + s2 * 120); x.beginPath(); x.ellipse(0, 0, 70, 9, s2 * 0.12, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(-68, -s2 * 4, 11, 0, 7); x.arc(68, s2 * 4, 11, 0, 7); x.fill(); x.restore(); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.repeat.set(1 / 1.2, 1 / 0.9); tex.offset.set(0.75 / 1.2, 0.45 / 0.9);   // the cap's UVs are the outline's x, y
  const top = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 }), side = mat.wood("#2a1208");
  g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(rim), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 3, curveSegments: 4 }).translate(0, 0, -0.05), [top, side]));
  for (const z of [HD - 0.004, -HD + 0.004]) g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim.map((v) => new THREE.Vector3(v.x, v.y, z)), true), seg(200), 0.011, seg(6), true), cream));   // binding, front and back
  const at2 = (m, px, py, pz) => { m.position.set(px, py, pz); g.add(m); return m; }, chrome = mat.chrome();
  for (const px of [-0.2, 0.12]) { at2(box(0.075, 0.15, 0.022, chrome), px, 0, HD + 0.012); at2(box(0.09, 0.17, 0.008, cream), px, 0, HD + 0.003);   // humbuckers in their rings
    for (const py of [-0.05, -0.03, -0.01, 0.01, 0.03, 0.05]) for (const dx of [-0.016, 0.016]) at2(cyl(0.006, 0.006, 0.006, chrome, 6), px + dx, py, HD + 0.025).rotation.x = Math.PI / 2; }
  at2(box(0.03, 0.17, 0.03, chrome), -0.33, 0, HD + 0.02); at2(box(0.05, 0.18, 0.025, chrome), -0.47, 0, HD + 0.014);   // the bridge and the stop tailpiece
  for (const [px, py] of [[-0.43, -0.22], [-0.33, -0.27], [-0.52, -0.16], [-0.42, -0.29]]) at2(cyl(0.028, 0.032, 0.035, mat.brass(), 14), px, py, HD + 0.02).rotation.x = Math.PI / 2;   // four gold knobs
  at2(cyl(0.006, 0.006, 0.06, cream, 6), 0.3, -0.25, HD + 0.03).rotation.x = 0.4;   // the pickup switch on the treble horn
  const pg = new THREE.Mesh(new THREE.CircleGeometry(0.1, seg(24)), new THREE.MeshPhysicalMaterial({ color: "#16100c", roughness: 0.3, clearcoat: 0.8 })); pg.scale.set(1.6, 0.5, 1); pg.rotation.z = -0.35; at2(pg, 0.0, -0.21, HD + 0.006);   // a slim pickguard
  /* the neck, as the guitars' (same scale length), its fretboard with pearl blocks, and an open-book headstock with three a side */
  const nut = 1.425, scale = 1.745, fx = (f) => nut - scale * (1 - Math.pow(2, -f / 12)), wood = mat.wood("#5a2a10", 0.6);
  const shaft = at2(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, nut - 0.28, seg(18), seg(1), false, 0, Math.PI), wood), (nut + 0.28) / 2, 0, HD - 0.01); shaft.rotation.set(Math.PI / 2, 0, Math.PI / 2); shaft.scale.z = 0.75;
  at2(box(nut - 0.27, 0.105, 0.026, mat.wood("#1a100a", 0.3)), (nut + 0.27) / 2, 0, HD + 0.016);
  for (let i = 1; i <= 20; i++) if (fx(i) > 0.28) at2(box(0.008, 0.106, 0.008, chrome), fx(i), 0, HD + 0.031);
  const pearl = new THREE.MeshPhysicalMaterial({ color: "#f4efe6", roughness: 0.2, iridescence: 1 });
  for (const i of [3, 5, 7, 9, 12, 15]) at2(box((fx(i - 1) - fx(i)) * 0.5, 0.075, 0.004, pearl), (fx(i) + fx(i - 1)) / 2, 0, HD + 0.03);
  at2(box(0.018, 0.11, 0.02, cream), nut + 0.005, 0, HD + 0.036);
  const hs = new THREE.Group(); hs.position.set(nut + 0.01, 0, HD + 0.01); hs.rotation.y = 0.24; g.add(hs);
  const hsh = new THREE.Shape([[0, -0.065], [0.27, -0.085], [0.32, -0.06], [0.3, 0], [0.32, 0.06], [0.27, 0.085], [0, 0.065]].map(([a, c]) => new THREE.Vector2(a, c)));
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(hsh, { depth: 0.03, bevelEnabled: false }).translate(0, 0, -0.015), mat.black()); hs.add(plate);
  for (let i = 0; i < 6; i++) { const s2 = i < 3 ? 1 : -1, px = 0.07 + (i % 3) * 0.085, post = cyl(0.009, 0.009, 0.05, chrome, 8); post.rotation.x = Math.PI / 2; post.position.set(px, s2 * 0.045, 0.03); hs.add(post);
    const key = cyl(0.02, 0.02, 0.014, cream, 12); key.position.set(px, s2 * 0.11, -0.005); key.scale.z = 0.55; hs.add(key); }
  const strings = [];
  for (let i = 0; i < 6; i++) { const a = new THREE.Vector3(-0.47, -0.05 + i * 0.02, HD + 0.03), b = new THREE.Vector3(nut, -0.042 + i * 0.0168, HD + 0.048), d = b.clone().sub(a);
    const st = cyl(0.003 + (5 - i) * 0.0007, 0.003 + (5 - i) * 0.0007, d.length(), mat.string(), 6); st.position.copy(a).addScaledVector(d, 0.5); st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    st.userData.z = st.position.z; g.add(st); strings.push(st); }
  return { g, strings, HD, neckAt: fx, rim: semiOutline(40) };
}

/* ------------------------------------------------------------------ the electric bass (a four-string with a split pickup) */
/* x along the neck, y across the strings (+y the low E), z out of the face. Offset waist, a long horn on the bass side,
   Olympic white with a tortoiseshell guard, a rosewood board, four big tuners in a line. A longer scale than the guitars,
   so the notes are fretted from the fifth fret up, where the paw reaches as on a guitar */
function bassOutline(n) {
  const ring = [[-0.78, 0], [-0.75, 0.17], [-0.64, 0.31], [-0.46, 0.37], [-0.26, 0.35], [-0.1, 0.29], [0.05, 0.27], [0.2, 0.31], [0.38, 0.34], [0.52, 0.31], [0.57, 0.24], [0.5, 0.17], [0.38, 0.13], [0.3, 0.07],
    [0.3, -0.07], [0.33, -0.13], [0.36, -0.2], [0.33, -0.27], [0.22, -0.3], [0.08, -0.28], [-0.06, -0.3], [-0.24, -0.36], [-0.45, -0.38], [-0.64, -0.32], [-0.75, -0.18]];
  return new THREE.CatmullRomCurve3(ring.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "centripetal").getPoints(n).map((v) => new THREE.Vector2(v.x, v.y));
}
function electricBass() {
  const g = new THREE.Group(), HD = 0.06, rim = bassOutline(160), chrome = mat.chrome(), at2 = (m, px, py, pz) => { m.position.set(px, py, pz); g.add(m); return m; };
  g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(rim), { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4, curveSegments: 4 }).translate(0, 0, -0.04), new THREE.MeshPhysicalMaterial({ color: "#efe6d2", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 })));
  const guard = [[0.3, 0.07], [0.42, 0.15], [0.5, 0.23], [0.42, 0.29], [0.22, 0.28], [0.02, 0.23], [-0.18, 0.21], [-0.3, 0.12], [-0.3, -0.04], [-0.22, -0.2], [-0.04, -0.24], [0.16, -0.22], [0.28, -0.19], [0.3, -0.08]];
  const gs = new THREE.Shape(new THREE.CatmullRomCurve3(guard.map(([a, c]) => new THREE.Vector3(a, c, 0)), true, "centripetal").getPoints(60).map((v) => new THREE.Vector2(v.x, v.y)));
  at2(new THREE.Mesh(new THREE.ShapeGeometry(gs), new THREE.MeshPhysicalMaterial({ color: "#5c2414", roughness: 0.25, clearcoat: 1, sheen: 1, sheenColor: new THREE.Color("#c46a2a") })), 0, 0, HD + 0.002);
  at2(box(0.06, 0.07, 0.022, mat.black()), -0.1, 0.04, HD + 0.012); at2(box(0.06, 0.07, 0.022, mat.black()), -0.16, -0.04, HD + 0.012);   // the split pickup
  at2(box(0.09, 0.17, 0.016, chrome), -0.5, 0, HD + 0.01);   // the bridge
  const cp = at2(box(0.24, 0.07, 0.008, chrome), -0.5, -0.24, HD + 0.004); cp.rotation.z = 0.35;   // the control plate and its knobs
  for (const d of [-0.07, 0.05]) at2(cyl(0.026, 0.026, 0.035, chrome, 14), -0.5 + d * 0.94, -0.24 + d * 0.34, HD + 0.02).rotation.x = Math.PI / 2;
  const nut = 1.62, scale = 2.12, fx = (f) => nut - scale * (1 - Math.pow(2, -f / 12)), maple = mat.wood("#d9b27a", 0.7);
  const shaft = at2(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.066, nut - 0.26, seg(18), seg(1), false, 0, Math.PI), maple), (nut + 0.26) / 2, 0, HD - 0.01); shaft.rotation.set(Math.PI / 2, 0, Math.PI / 2); shaft.scale.z = 0.75;
  at2(box(nut - 0.27, 0.115, 0.024, mat.wood("#2a160c", 0.3)), (nut + 0.27) / 2, 0, HD + 0.014);
  for (let i = 1; i <= 20; i++) if (fx(i) > 0.28) at2(box(0.008, 0.116, 0.008, chrome), fx(i), 0, HD + 0.028);
  for (const i of [3, 5, 7, 9, 12, 15]) for (const y of i === 12 ? [-0.03, 0.03] : [0]) at2(new THREE.Mesh(new THREE.CircleGeometry(0.011, seg(12)), new THREE.MeshBasicMaterial({ color: "#f2ead8" })), (fx(i) + fx(i - 1)) / 2, y, HD + 0.027);
  at2(box(0.018, 0.12, 0.02, mat.wood("#f1e6cc", 0.6)), nut + 0.005, 0, HD + 0.032);
  const hs = new THREE.Group(); hs.position.set(nut + 0.005, 0, HD - 0.005); g.add(hs);   // the headstock, flat, its four tuners on the bass side
  const hsh = new THREE.Shape(new THREE.CatmullRomCurve3([[0, -0.06], [0.2, -0.07], [0.36, -0.05], [0.42, 0.0], [0.4, 0.07], [0.3, 0.1], [0.12, 0.09], [0, 0.06]].map(([a, c]) => new THREE.Vector3(a, c, 0)), true, "centripetal").getPoints(40).map((v) => new THREE.Vector2(v.x, v.y)));
  hs.add(new THREE.Mesh(new THREE.ExtrudeGeometry(hsh, { depth: 0.035, bevelEnabled: false }).translate(0, 0, -0.0175), maple));
  for (let i = 0; i < 4; i++) { const px = 0.06 + i * 0.085, post = cyl(0.011, 0.011, 0.05, chrome, 8); post.rotation.x = Math.PI / 2; post.position.set(px, 0.03, 0.03); hs.add(post);
    const key = box(0.05, 0.045, 0.012, chrome); key.position.set(px, 0.135, 0); hs.add(key); const stem = cyl(0.008, 0.008, 0.05, chrome, 6); stem.position.set(px, 0.105, 0); hs.add(stem); }
  const strings = [];
  for (let i = 0; i < 4; i++) { const a = new THREE.Vector3(-0.5, 0.054 - i * 0.036, HD + 0.03), b = new THREE.Vector3(nut, 0.033 - i * 0.022, HD + 0.044), d = b.clone().sub(a);
    const st = cyl(0.0078 - i * 0.0011, 0.0078 - i * 0.0011, d.length(), mat.string(), 6); st.position.copy(a).addScaledVector(d, 0.5); st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    st.userData.z = st.position.z; g.add(st); strings.push(st); }
  return { g, strings, HD, neckAt: fx, rim: bassOutline(40), stringY: (i) => 0.054 - i * 0.036 };
}

/* ------------------------------------------------------------------ the flute */
/* x along the flute, the embouchure at 0, the foot at -1.5 (to the player's right, running on past the right paw, as a real
   flute does past the right hand); the lip plate and the keys face +y.
   Silver, a crown at the head, rings at the joints, seven open-hole keys and a rod along them */
function flute() {
  const g = new THREE.Group(), sil = new THREE.MeshPhysicalMaterial({ color: "#e4e9f1", metalness: 0.65, roughness: 0.2, clearcoat: 1, emissive: "#2a2f38" }), R = 0.044, L = 1.5;   // satin silver: full metal would mirror the dark room
  const tube = cyl(R, R * 0.96, L + 0.16, sil, seg(20)); tube.rotation.z = Math.PI / 2; tube.position.x = -L / 2 + 0.08; g.add(tube);
  const crown = cyl(R * 1.15, R * 1.15, 0.05, sil, seg(16)); crown.rotation.z = Math.PI / 2; crown.position.x = 0.17; g.add(crown);
  for (const px of [-0.32, -1.22]) { const ring = cyl(R * 1.18, R * 1.18, 0.03, sil, seg(16)); ring.rotation.z = Math.PI / 2; ring.position.x = px; g.add(ring); }   // the head joint and the foot joint
  const lip = new THREE.Mesh(new THREE.SphereGeometry(0.05, seg(16), seg(10)), sil); lip.scale.set(1.25, 0.28, 0.85); lip.position.set(0, R * 0.95, 0); g.add(lip);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.012, seg(12)), new THREE.MeshBasicMaterial({ color: "#0c0c10" })); hole.rotation.x = -Math.PI / 2; hole.position.set(0, R + 0.0155, 0); hole.scale.x = 1.4; g.add(hole);
  const rod = cyl(0.006, 0.006, 0.86, sil, 6); rod.rotation.z = Math.PI / 2; rod.position.set(-0.8, R * 0.7, -R * 0.75); g.add(rod);
  const keys = []; for (let i = 0; i < 7; i++) { const k = new THREE.Group(); k.position.set(-0.42 - i * 0.12 - (i > 2 ? 0.07 : 0), R + 0.004, 0); g.add(k);
    const cup = cyl(0.026, 0.026, 0.012, sil, seg(14)); k.add(cup); const ring = new THREE.Mesh(new THREE.CircleGeometry(0.009, seg(10)), new THREE.MeshBasicMaterial({ color: "#16161c" })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.0065; k.add(ring); keys.push(k); }
  return { g, keys, left: anchor(g, -0.5, -0.01, -0.035), right: anchor(g, -0.92, -0.01, -0.035) };
}

/* ------------------------------------------------------------------ egg shakers */
function egg(col) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, seg(16), seg(12)), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.3, clearcoat: 1, emissive: col, emissiveIntensity: 0.15 })); m.scale.set(0.8, 1, 0.8); return m; }   // big enough to show above a fluffy paw (and not hidden as fine detail far off)

/* ------------------------------------------------------------------ the boom mic */
function micStand(mouth, foot = new THREE.Vector3()) {   // foot: where the stand stands (the pole rises from it); mouth: where the mic's tip points
  const g = new THREE.Group(), base = mat.black(), c = mat.chrome(); g.position.copy(foot); mouth = mouth.clone().sub(foot);
  for (let i = 0; i < 3; i++) { const l = cyl(0.015, 0.015, 0.5, base, 6); const a = i / 3 * Math.PI * 2; l.position.set(Math.cos(a) * 0.2, 0.12, Math.sin(a) * 0.2); l.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); g.add(l); }
  const pole = cyl(0.02, 0.02, 1.95, c, 10); pole.position.y = 1.05; g.add(pole);
  const top = new THREE.Vector3(0, 2.02, 0), m = mouth, arm = new THREE.Vector3().subVectors(m, top), len = arm.length() - 0.18;
  const boom = cyl(0.016, 0.016, len, c, 8); boom.position.copy(top).addScaledVector(arm.normalize(), len / 2); boom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arm); g.add(boom);
  const mic = new THREE.Group(); mic.position.copy(m).addScaledVector(arm, -0.12); mic.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arm); g.add(mic);
  const handle = cyl(0.032, 0.022, 0.18, mat.black(), 16); handle.position.y = -0.04; mic.add(handle);
  const grille = new THREE.Mesh(new THREE.SphereGeometry(0.055, seg(20), seg(14)), new THREE.MeshPhysicalMaterial({ color: "#b9bec7", metalness: 1, roughness: 0.55 })); grille.position.y = 0.08; mic.add(grille);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.057, seg(14), seg(10)), new THREE.MeshBasicMaterial({ color: "#2a2a30", wireframe: true })); mesh.position.y = 0.08; mic.add(mesh);
  return g;
}

/* ------------------------------------------------------------------ colliders: what an arm must not pass through */
/* each gives how deep a world point sits inside a part of an instrument (0 outside), with a margin; the arm solver
   (avatar.reach) keeps the upper arm and forearm out of them */
/* signed distances to an instrument's solids, in the world (negative inside), for the arm solver (avatar.reach) */
const LP = new THREE.Vector3(), WS = new THREE.Vector3();
const inLocal = (o, f) => { const inv = new THREE.Matrix4(); let at = -1, sc = 1;   // inside a solve, where the part is is worked out once (epoch.js)
  return (P) => { if (!SDF.on) return f(o.worldToLocal(LP.copy(P))) * WS.setFromMatrixScale(o.matrixWorld).x;
    if (at !== SDF.n) { at = SDF.n; o.updateWorldMatrix(true, false); inv.copy(o.matrixWorld).invert(); sc = WS.setFromMatrixScale(o.matrixWorld).x; } return f(LP.copy(P).applyMatrix4(inv)) * sc; }; };
const sdBox = (o, c, h) => inLocal(o, (l) => { const x = Math.abs(l.x - c[0]) - h[0], y = Math.abs(l.y - c[1]) - h[1], z = Math.abs(l.z - c[2]) - h[2]; return Math.hypot(Math.max(x, 0), Math.max(y, 0), Math.max(z, 0)) + Math.min(Math.max(x, y, z), 0); });
const sdCyl = (o, R, y0, y1) => inLocal(o, (l) => { const r = Math.hypot(l.x, l.z) - R, y = Math.abs(l.y - (y0 + y1) / 2) - (y1 - y0) / 2; return Math.hypot(Math.max(r, 0), Math.max(y, 0)) + Math.min(Math.max(r, y), 0); });
const slabD = (d2, z) => Math.hypot(Math.max(d2, 0), Math.max(z, 0)) + Math.min(Math.max(d2, z), 0);
function polyD(pts, x, y) { let d = 1e9, s = 1;   // to a closed polygon, negative inside
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j], ex = b.x - a.x, ey = b.y - a.y, wx = x - a.x, wy = y - a.y, k = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey || 1), 0, 1);
    d = Math.min(d, (wx - ex * k) ** 2 + (wy - ey * k) ** 2); const c1 = y >= a.y, c2 = y < b.y, c3 = ex * wy > ey * wx; if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s; }
  return s * Math.sqrt(d); }
const sdOutline = (o, pts, hd, grow = 0) => inLocal(o, (l) => slabD(polyD(pts, l.x, l.y) - grow, Math.abs(l.z) - hd));
const sdBouts = (o, bouts, hd, cy = 0) => inLocal(o, (l) => { let d = 1e9; for (const [cx, by, R] of bouts) d = Math.min(d, Math.hypot(l.x - cx, l.y - cy - by) - R); return slabD(d, Math.abs(l.z) - hd); });

/* ------------------------------------------------------------------ the players */
const P = (x, y, z) => new THREE.Vector3(x, y, z);
/* for avatar.hold: a line of an instrument's frame in the world (two points), a direction of its frame (unit), its scale */
const line = (o, a, b) => [o.localToWorld(P(...a)), o.localToWorld(P(...b))], dirOf = (o, v) => P(...v).transformDirection(o.matrixWorld), scaleOf = (o) => WS.setFromMatrixScale(o.matrixWorld).x;
// The generator build defines globalThis.PRANCER_GEN as true, so the band-only kit (bass, congas, decks, keys, the mic
// stand) drops out of it; the band show leaves it undefined and gets everything.
/* set down for a move: while the cat waves, kneads or claps, its instrument goes to lie flat on the floor at its left side,
   face up, and comes back to its paws after; over 0.3 s each way. Returns step(on, dt), called after the instrument has
   been posed (or not) for the frame, and step.restore(), called before it is posed: each part keeps the place it is played in */
export function setDown(inst, av) {
  const parts = [inst.group, ...(inst.loose || [])].filter(Boolean), saved = new Map(); let k = 0, rest = null;
  const toLocal = (o, pos, q) => { const pq = o.parent.getWorldQuaternion(new THREE.Quaternion()); o.position.copy(o.parent.worldToLocal(pos.clone())); o.quaternion.copy(pq.invert().multiply(q)); };
  const restore = () => { for (const [o, [p, q]] of saved) { o.position.copy(p); o.quaternion.copy(q); } saved.clear(); };
  return Object.assign((on, dt) => { restore();
    k = clamp(k + (on ? 1 : -1) * dt / 0.3, 0, 1); if (!k || !parts.length) { rest = null; return k; }
    av.root.updateMatrixWorld(true);
    if (!rest) { const rq = av.root.getWorldQuaternion(new THREE.Quaternion()), y0 = av.root.getWorldPosition(W()).y;
      rest = parts.map((o, i) => { const q = rq.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.5 + i * 0.25, "YXZ"))), pos = av.root.localToWorld(P(1.85 + i * 0.55, 0, 0.45 - i * 0.2));
        const keep = [o.position.clone(), o.quaternion.clone()]; toLocal(o, pos, q); o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o); pos.y += y0 + 0.01 - bb.min.y;
        o.position.copy(keep[0]); o.quaternion.copy(keep[1]); o.updateMatrixWorld(true); return [pos, q]; }); }
    const e = ease(k);
    parts.forEach((o, i) => { saved.set(o, [o.position.clone(), o.quaternion.clone()]); const pos = o.getWorldPosition(W()).lerp(rest[i][0], e), q = o.getWorldQuaternion(new THREE.Quaternion()).slerp(rest[i][1], e);
      toLocal(o, pos, q); });
    return k; }, { restore });
}

export function makeInstrument(role, av, song, look = null) {   // look: which make of the instrument (the band's per-song lineup: a semi-hollow guitar, an electric bass, a synth)
  const b = av.b, root = av.root, w = (o) => o.getWorldPosition(W());
  const toWorldDir = (v) => v.clone().applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
  const strumAt = (part, t, amp = 0.17) => { const e = at(song, part, t); if (!e) return [0, 0]; const p = ease((t - e.t) / 0.07); return [e.dir === "d" ? lerp(amp, -amp, p) : lerp(-amp, amp, p), Math.exp(-(t - e.t) * 7) * e.v]; };
  const ring = (strings, k, t) => strings.forEach((s, i) => { s.position.z = s.userData.z + Math.sin(t * 95 + i * 1.7) * 0.004 * k; });
  const up = toWorldDir(P(0, 1, 0)), faceOf = (o) => P(0, 0, 1).transformDirection(o.matrixWorld);

  if (role === "singer" || role === "guitar" || role === "acoustic" || role === "ukulele") {   // acoustic and ukulele: a solo player's, with no mic stand
    const uke = role === "ukulele", gt = !globalThis.PRANCER_GEN && look === "semi" ? semiGuitar() : guitar(role === "singer" || role === "acoustic" ? "ruby" : "nylon"), part = role === "singer" || role === "acoustic" ? "acoustic" : "guitar";
    /* the staging, found by tools/stagesearch.mjs so that on every build the arms clear the body and the instrument: held
       low across the belly (further out on a wider cat), the neck rising to the left, the face tipped up toward the player
       and turned to the strumming side; the ukulele high on the chest. s: where the paw strums (along, across, the stroke's reach); pr: where the elbow goes */
    const bw = av.L.bw, K = uke ? { p: [0.027, 0.995, 0.73], r: [-0.355, -0.592, 0.169], s: [-0.2, 0.058, 0.146], k: 0.613, pr: [-0.967, 0.589, -0.8] } : { p: [-0.345, 0.504, 0.723], r: [-0.636, -0.532, 0.412], s: [0.074, 0.07, 0.14], k: 0.972, pr: [-0.421, 0.757, 0.274] };
    gt.g.position.set(K.p[0] * bw, K.p[1], K.p[2] * bw); gt.g.rotation.set(...K.r); gt.g.scale.setScalar(K.k); b.hips.add(gt.g);
    const HD = gt.HD, bodyS = sdOutline(gt.g, gt.rim, HD, 0.02), neckS = sdBox(gt.g, [0.86, 0, HD - 0.02], [0.6, 0.066, 0.052]), headS = sdBox(gt.g, [1.6, 0, HD - 0.01], [0.18, 0.09, 0.06]), cols = [bodyS, neckS, headS];
    /* the boom stand stands out in front and to the strumming side, clear of the singer, the guitar and the strum; the boom
       reaches back so the mic's tip waits a hand's width in front of the mouth, a little below it (measured from the cat's own
       mouth at rest, so it fits any build) */
    let mic = null; if (!globalThis.PRANCER_GEN && role === "singer") { root.updateMatrixWorld(true); const mo = root.worldToLocal(av.mouth.g.getWorldPosition(W()));
      mic = micStand(P(mo.x, mo.y - 0.1, mo.z + 0.34), P(0.5, 0, mo.z + 0.95)); root.add(mic); }
    let fret = 0;
    return { group: gt.g, K, update(t) {
      const GS = K.s, [dy, k] = strumAt(part, t, GS[2]), c = song.chords[clamp(Math.floor((t - song.lead) / song.bar), 0, song.bars - 1)], target = 3 + ((c.root - 40) % 12 + 12) % 12 * 0.55;   // the chord shapes sit between the third and ninth frets
      fret = lerp(fret, target, 0.25); ring(gt.strings, k, t);
      const u = dy / GS[2], sw = gt.g.localToWorld(P(GS[0] - 0.04 * u * u, GS[1] + dy, HD + 0.06 * u * u));   // the strum: an arc across the strings, off the face at each end
      av.reach("R", sw, toWorldDir(P(...K.pr)), -0.3, cols, { out: faceOf(gt.g), touch: 0.05 });
      av.hold("L", { axis: line(gt.g, [0.26, 0, HD - 0.02], [1.46, 0, HD - 0.02]), at: clamp((gt.neckAt(fret) - 0.26) / 1.2, 0, 1), r: 0.06 * scaleOf(gt.g), from: dirOf(gt.g, [0, -1, -0.35]), pole: toWorldDir(P(0.6, -1, -0.2)), cols, grip: [neckS, headS], touch: 0.06 });   // the paw closes round the neck from below, the toes up over the fretboard
    } };
  }
  if (!globalThis.PRANCER_GEN && role === "bass" && look === "electric") {
    /* worn as the guitars are (their staging, found by tools/stagesearch.mjs), the right paw plucking between the pickup and
       the end of the neck, the left fretting each note on the lowest string where it falls at the fifth fret or above */
    const eb = electricBass(), K = { p: [-0.345, 0.504, 0.723], r: [-0.636, -0.532, 0.412], k: 0.92, pr: [-0.421, 0.757, 0.274] }, bw = av.L.bw, HD = eb.HD;
    eb.g.position.set(K.p[0] * bw, K.p[1], K.p[2] * bw); eb.g.rotation.set(...K.r); eb.g.scale.setScalar(K.k); b.hips.add(eb.g);
    const neckS = sdBox(eb.g, [0.95, 0, HD - 0.02], [0.68, 0.07, 0.05]), headS = sdBox(eb.g, [1.83, 0.02, HD - 0.01], [0.22, 0.11, 0.05]), cols = [sdOutline(eb.g, eb.rim, HD + 0.02, 0.02), neckS, headS];
    const OPEN = [28, 33, 38, 43]; let fret = 7, str = 1;
    return { group: eb.g, K, update(t) {
      const e = at(song, "bass", t), dt = e ? t - e.t : 9, pull = e ? Math.exp(-dt * 9) * (0.4 + 0.6 * e.v) : 0;
      if (e) { let s2 = -1, f = 0; for (let i = 3; i >= 0; i--) { const d = e.n - OPEN[i]; if (d >= 5 && d <= 12) { s2 = i; f = d; break; } }
        if (s2 < 0) { s2 = e.n < 33 ? 0 : 1; f = 5 + (((e.n - OPEN[s2]) % 12) + 12) % 12 * 0.6; } str = s2; fret = lerp(fret, f, 0.35); }
      ring(eb.strings.slice(str, str + 1), pull, t);
      const u = ease(dt / 0.06), back = dt < 0.06 ? u : Math.max(0, 1 - (dt - 0.06) / 0.25);   // the pluck: through the string onto the next, then back up for the next note
      av.reach("R", eb.g.localToWorld(P(0.08, eb.stringY(str) - 0.03 * back, HD + 0.06 - 0.02 * back)), toWorldDir(P(...K.pr)), -0.3, cols, { out: faceOf(eb.g), touch: 0.05 });
      av.hold("L", { axis: line(eb.g, [0.27, 0, HD - 0.02], [1.63, 0, HD - 0.02]), at: clamp((eb.neckAt(fret) - 0.27) / 1.36, 0, 1), r: 0.062 * scaleOf(eb.g), from: dirOf(eb.g, [0, -1, -0.35]), pole: toWorldDir(P(0.6, -1, -0.2)), cols, grip: [neckS, headS], touch: 0.06 });
    }, pose(t) { const e = at(song, "bass", t), dt = e ? t - e.t : 9; b.chest.rotation.x += 0.04 * Math.exp(-dt * 6); } };
  }
  if ((!globalThis.PRANCER_GEN || globalThis.GEN_LAB) && role === "flute") {   /* (GEN_LAB: a lab build of the generator, to see a flute player as the generator would make one) */
    /* at the lips: the lip plate under the lower lip, out in front of the chin, the flute running down and forward to the
       right; the left paw near the head joint, the right paw out along the body; keys closed by the note. Between phrases
       it comes down to rest across the chest. The head is an obstacle for the arms (the paws work beside the face) */
    /* the lip plate is held just under the lower lip and the flute turns about it (ly, lz: how far below the mouth and in front);
       yaw: how far the foot swings back from straight across; roll: how far it drops to the right; bow: the head into it */
    const fl = flute(), FL = { bow: 0.39, yaw: -0.04, roll: 0.14, lg: -0.15, rg: -1.15, ly: 0.02, lz: 0.098, turn: 0.45 }; b.head.add(fl.g); let lift = 1; const head = (Q) => av.headDist(Q); fl.keys.forEach((k) => (k.userData.y = k.position.y));   // FL: the staging (searched with the arm bench: tools/flutesearch.mjs)
    return { group: fl.g, FL, update(t) {
      const e = at(song, "flute", t), nx = after(song, "flute", t), playing = e && t < e.t + e.d + 0.05, soon = nx && nx.t - t < song.beat * 1.5;
      lift = lerp(lift, playing || soon ? 1 : 0, 0.08); const r = 1 - lift;
      fl.g.rotation.set(0.1 * r, FL.yaw + 0.1 * r, FL.roll + 0.5 * r); fl.g.position.set(0, -0.47 - FL.ly, 0.86 + FL.lz + (av.L.furLen || 0) * 1.4).sub(P(0, 0.034, 0).applyEuler(fl.g.rotation)).add(P(0.1 * r, -0.6 * r, 0.2 * r)); fl.left.position.x = FL.lg; fl.right.position.x = FL.rg;   // the lip plate (on top of the tube) at the lips
      const closed = playing ? 7 - Math.round((((e.n % 12) + 12) % 12) / 11 * 6) : 0; fl.keys.forEach((k, i) => { k.position.y = k.userData.y - (i < closed ? 0.006 : 0); });
      av.sing(playing ? 0.08 : 0, "o");
      /* the paws close round the tube from below and the player's side, the toes over the top: the left under the body by the
         keys, the right round the foot joint; elbows out, the forearms kept off the chest */
      const tube = line(fl.g, [0.16, 0, 0], [-1.5, 0, 0]), rf = 0.044 * scaleOf(fl.g);
      av.hold("L", { axis: tube, at: 0.32, r: rf, from: dirOf(fl.g, [0, -0.5, 0.85]), pole: toWorldDir(P(1, -0.6, 0.5)), cols: [head], soft: 0.9, lift: 1 });   // the left close to the lips and from the far side, as a flutist's left hand sits, so its forearm crosses less of the chest
      av.hold("R", { axis: tube, at: 0.66, r: rf, from: dirOf(fl.g, [0, -0.9, -0.35]), pole: toWorldDir(P(-1, -0.6, 0.2)), cols: [head], soft: 0.9, lift: 1 });
    }, pose(t) { const e = at(song, "flute", t), playing = e && t < e.t + e.d, on = lift, r = 1 - on, k = FL.bow * on, tw = FL.turn * (0.3 + 0.7 * on);   // the stance comes and goes with the flute (lift: 1 at the lips, 0 at rest)
      /* a flutist's stance while it plays: the head bowed into the flute and the chest leaning in (the big head's mouth comes down
         and back to where the paws reach), the torso turned toward the flute's foot (the left shoulder forward, so the left arm
         reaches forward to the tube instead of across the chest), the head turned back to face front */
      b.chest.rotation.y -= tw; b.neck.rotation.y += tw * 0.35; b.head.rotation.y += tw * 0.65;
      b.head.rotation.x += k; b.neck.rotation.x += k * 0.4; b.chest.rotation.x += k * 0.35; b.head.rotation.z -= 0.1 * on; b.head.rotation.y -= 0.08 * on; if (playing) b.chest.rotation.x -= 0.04 * e.v;
      /* between phrases (Yoeshi, 2026-11-07: the resting pose looked depressing): the head up and out to the crowd, standing tall,
         in the groove with the band, a bob on every beat and the head rocking over two (on top of the band's own groove) */
      if (r > 0.01) { const ph = (t - (song.lead || 0)) / song.beat, f = ((ph % 1) + 1) % 1, bob = Math.exp(-f * 5);
        b.chest.rotation.x -= 0.07 * r; b.head.rotation.x -= (0.12 - 0.09 * bob) * r; b.neck.rotation.x += 0.05 * bob * r;
        b.head.rotation.z += 0.1 * r * Math.sin(ph * Math.PI + 0.4); b.chest.rotation.z += 0.04 * r * Math.sin(ph * Math.PI + 1.0); } } };
  }
  if (!globalThis.PRANCER_GEN && role === "shaker") {
    /* an egg shaker in each paw, in front of the chest: each paw takes its own shakes (the song's hats), the egg snapping
       down and out on the shake and swinging back up */
    const g = new THREE.Group(), eggs = [egg("#ffd84a"), egg("#7fe0ff")]; eggs.forEach((e) => g.add(e)); root.add(g); const T = W();
    return { group: g, update(t) {
      const ev = song.parts.shaker || [];
      ["R", "L"].forEach((side, i) => { let e = null; for (let j = ev.length - 1, n = 0; j >= 0 && n < 24; j--, n++) if (ev[j].t <= t && ev[j].hand === side) { e = ev[j]; break; }
        const dt = e ? t - e.t : 9, k = dt < 0.05 ? ease(dt / 0.05) : Math.exp(-(dt - 0.05) * 7), sx = side === "R" ? -1 : 1;
        T.set(sx * 0.42, 1.55 + (i ? 0.1 : 0) - 0.13 * k * (e ? 0.5 + 0.5 * e.v : 0), 0.7 + 0.08 * k); eggs[i].position.copy(T).add(P(sx * -0.03, 0.26, 0.12)); eggs[i].rotation.z = sx * (0.3 + 0.5 * k);   // the egg up out of the paw's grip, toward the crowd
        const E = eggs[i].position;   // the egg in the paw's grip: held from below and a little outside, the toes closed over it
        av.hold(side, { axis: [root.localToWorld(P(E.x - 0.12, E.y, E.z)), root.localToWorld(P(E.x + 0.12, E.y, E.z))], at: 0.5, r: 0.16 * av.k, from: toWorldDir(P(sx * 0.3, -1, 0.25)), pole: toWorldDir(P(sx, -0.7, 0.1)) }); });
    } };
  }
  if (!globalThis.PRANCER_GEN && role === "bass") {
    const ub = upright(); ub.g.position.set(0.4, 0, 1.08); ub.g.rotation.set(-0.3, -0.38, 0.1); root.add(ub.g); let fret = 3;
    const ubNeck = sdBox(ub.g, [0, 2.15, 0.19], [0.06, 1.0, 0.03]), hits = [sdBouts(ub.g, [[0, -0.32, 0.5], [0, 0.42, 0.38]], 0.19, 1.05), ubNeck];
    return { group: ub.g, update(t) {
      const e = at(song, "bass", t), dt = e ? t - e.t : 9, pull = e ? Math.exp(-dt * 9) : 0; if (e) fret = lerp(fret, ((e.n - 28) % 12 + 12) % 12, 0.3);
      ub.strings.forEach((s, i) => { s.position.z = 0.225 + Math.sin(t * 60 + i) * 0.006 * pull; });
      const pw = ub.g.localToWorld(P(0.08 - ease(dt / 0.1) * 0.16 + 0.04, 1.32, 0.3)); av.reach("R", pw, toWorldDir(P(-1, -0.2, 0.3)), 0.2, hits, { out: faceOf(ub.g) });
      av.hold("L", { axis: line(ub.g, [0, 1.15, 0.19], [0, 3.15, 0.19]), at: clamp((ub.neckAt(fret) - 1.15) / 2, 0, 1), r: 0.06 * scaleOf(ub.g), from: dirOf(ub.g, [-1, 0, -0.3]), pole: toWorldDir(P(1, -0.6, 0.3)), cols: hits, grip: [ubNeck] });   // round the neck from the player's side
    } };
  }
  if (!globalThis.PRANCER_GEN && role === "congas") {
    const g = new THREE.Group(), lo = conga(1.18, 0.27), hiD = conga(1.12, 0.23); lo.g.position.set(-0.42, 0, 1.0); hiD.g.position.set(0.42, 0, 0.96); g.add(lo.g, hiD.g); root.add(g); const drums = [lo, hiD];
    const hits = [sdCyl(lo.g, 0.32, 0, 1.18), sdCyl(hiD.g, 0.28, 0, 1.12)];
    /* each paw travels in an arc from its hit to its next one, as high as the time between allows (louder: higher), crossing
       to the other drum when the next hit is there; it stays on the skin for the contact; a slap lands nearer the rim. The
       chest turns into the hitting paw and leans into accents, the head with it (pose) */
    const evs = song.parts.congas || [], idx = (t) => { let lo = 0, hi = evs.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (evs[m].t <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; };
    const S = { t: -1, turn: 0, accent: 0, paw: { R: null, L: null } };
    const state = (t) => { if (S.t === t) return S; S.t = t; S.turn = 0; S.accent = 0; const i0 = idx(t);
      for (const side of ["R", "L"]) { let e = null, n = null;
        for (let i = i0, k = 0; i >= 0 && k < 40; i--, k++) if (evs[i].hand === side) { e = evs[i]; break; }
        for (let i = i0 + 1, k = 0; i < evs.length && k < 40; i++, k++) if (evs[i].hand === side) { n = evs[i]; break; }
        const dA = e ? drums[e.drum] : drums[side === "R" ? 0 : 1], dB = n && n.t - t < 1.2 ? drums[n.drum] : dA, dt = e ? t - e.t : 9, gap = e && n ? n.t - e.t : 9;
        /* the stroke: after a hit the paw comes up to hover low over the skin (a tap barely leaves it); before the next it
           winds up and comes down onto it, crossing to the other drum on the way; a slap or an open tone winds up higher */
        const BIG = (x) => x && x.kind !== "tap", tn = n ? n.t - t : 9, W = n ? (BIG(n) ? Math.min(0.3, Math.max(0.12, (e ? gap : 0.5) * 0.6)) : Math.min(0.2, Math.max(0.1, (e ? gap : 0.4) * 0.45))) : 0;
        const hover = e ? (BIG(e) ? 0.06 : 0.03) + 0.04 * e.v : 0.05, rise = dt < 0.03 ? 0 : hover * (1 - Math.exp(-(dt - 0.03) / 0.05));   // low over the skin between strokes; the strokes themselves bigger than life (they have to read from the back of the room)
        let lift = rise, u = 0;
        if (n && tn < W) { u = 1 - tn / W; const h = BIG(n) ? 0.32 + 0.18 * n.v : 0.15 + 0.06 * n.v; lift = Math.max(rise * (1 - u), h * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.7) * (u < 0.87 ? 1 : (1 - u) / 0.13)); }
        if (dt < 0.03) lift = 0;
        const k = ease(u), slap = e && e.kind === "slap" && u < 0.5 ? 0.16 : 0.02, sx = side === "R" ? -1 : 1;
        S.paw[side] = { e, lift, rock: e && !BIG(e) ? (Math.round(e.t / (song.beat / 2)) % 2 ? -0.35 : 0.35) * Math.exp(-dt * 6) : 0, P: P(lerp(dA.g.position.x, dB.g.position.x, k) + sx * slap * 0.6, lerp(dA.top, dB.top, k) + 0.17 + lift, lerp(dA.g.position.z, dB.g.position.z, k) - 0.02 - lift * 0.3) };
        if (e) { const f = Math.exp(-dt * 7) * (0.5 + 0.5 * e.v); S.turn += -sx * f; S.accent = Math.max(S.accent, Math.exp(-dt * 9) * e.v * (e.kind === "slap" ? 1.2 : 0.8)); } }
      return S; };
    return { group: g, update(t) {
      const st = state(t);
      for (const side of ["R", "L"]) { const pw = st.paw[side], sx = side === "R" ? -1 : 1;
        av.reach(side, root.localToWorld(pw.P), toWorldDir(P(sx, -0.1 - pw.lift * 0.6, 0.35)), 0.9 - pw.lift * 1.2 + pw.rock, hits, { out: up, touch: 0.08 });   // the wrist cocks back as the paw rises; heel, then toe, on the taps
        if (pw.e) { const dt = t - pw.e.t; drums[pw.e.drum].skin.scale.setScalar(1 + Math.exp(-dt * 30) * 0.03 * Math.sin(dt * 120)); } }
    }, pose(t) { const st = state(t);
      b.chest.rotation.y += 0.14 * st.turn; b.chest.rotation.x += 0.1 * st.accent; b.neck.rotation.x += 0.12 * st.accent; b.head.rotation.y -= 0.06 * st.turn; b.hips.position.y -= 0.03 * st.accent; } };
  }
  if (role === "sax") {
    const sx = sax(); sx.g.position.set(0.0, -0.44, 0.98); b.head.add(sx.g); let lift = 1;
    return { group: sx.g, update(t) {
      const e = at(song, "sax", t), nx = after(song, "sax", t), playing = e && t < e.t + e.d + 0.05, soon = nx && nx.t - t < song.beat * 1.2;
      lift = lerp(lift, playing || soon ? 1 : 0, 0.08);   // at the mouth to play; between phrases it drops to hang on its strap
      sx.g.rotation.set(-0.34 + (1 - lift) * 0.12, 0, -0.18); sx.g.position.set(0.04, -0.44 - (1 - lift) * 0.42, 1.0 + (1 - lift) * 0.22);
      const n = playing ? e.n : 0; sx.keys.forEach((k, i) => { k.position.x = playing && ((n >> (i % 4)) & 1) ? 0.012 : 0; });
      av.sing(0, "o", playing ? 0.4 + 0.6 * e.v : 0);
      /* the paws round the body from the front and their own sides, the toes on the keys: the left on the upper body, the right on the lower */
      av.hold("L", { axis: line(sx.g, [0, -0.3, -0.15], [0, -0.7, -0.12]), at: 0.5, r: 0.065 * scaleOf(sx.g), from: dirOf(sx.g, [0.6, 0, 0.8]), pole: toWorldDir(P(1, -0.5, 0.3)) });
      av.hold("R", { axis: line(sx.g, [0, -0.7, -0.12], [0, -1.05, -0.06]), at: 0.45, r: 0.085 * scaleOf(sx.g), from: dirOf(sx.g, [-0.6, 0, 0.8]), pole: toWorldDir(P(-1, -0.4, 0.3)) });
    }, pose(t) { const e = at(song, "sax", t), playing = e && t < e.t + e.d; if (playing) { b.chest.rotation.x -= 0.12 * e.v; b.head.rotation.x -= 0.08; } } };
  }
  if (role === "violin") {
    const vn = violin(); vn.g.scale.setScalar(1.7); vn.g.position.set(0.45, 0.18 + (av.L.furLen || 0) * 0.3, 0.67);   /* as a violinist holds it (Yoeshi 2026-11-07: it had sat over the mouth): the body on the left shoulder below the jaw, the chinrest under the jaw, the neck out forward and left, the strings up */ vn.g.rotation.set(-1.303, -0.145, -0.896); b.chest.add(vn.g); vn.bow.scale.setScalar(1.35); root.add(vn.bow); const loose = [vn.bow];
    return { group: vn.g, loose, update(t) {
      const e = at(song, "violin", t), playing = e && t < e.t + e.d + 0.1, idx = e ? song.parts.violin.indexOf(e) : 0, down = idx % 2 === 0;
      const p = e ? clamp((t - e.t) / Math.max(0.2, e.d), 0, 1) : 0.5, s = playing ? (down ? lerp(0.18, 0.58, p) : lerp(0.58, 0.18, p)) : 0.36;   // the stroke a little further from the frog end: the bow hand clears the chest
      const C = w(vn.contact), D = toWorldDir(P(-0.85, -0.1, 0.5)).normalize(), frog = C.clone().addScaledVector(D, s * 1.1 * av.k);
      vn.bow.position.copy(root.worldToLocal(frog.clone())); vn.bow.quaternion.setFromUnitVectors(P(0, 1, 0), root.worldToLocal(C.clone().addScaledVector(D, -1)).sub(vn.bow.position).normalize());
      /* the bow hand over the frog, the stick across the palm and the toes under it; the left paw under the neck, the vibrato a roll along it */
      av.hold("R", { axis: [frog.clone().addScaledVector(D, 0.25), frog.clone().addScaledVector(D, -0.25)], at: 0.5, r: 0.011 * av.k, from: toWorldDir(P(-0.5, 0.7, 0.5)), pole: toWorldDir(P(-1, -0.6, 0.2)), cols: [sdBouts(vn.g, [[-0.12, 0, 0.17], [0.13, 0, 0.14]], 0.05)] });
      const vib = playing ? Math.sin(t * 36) * 0.03 : 0; av.hold("L", { axis: line(vn.g, [0.1, 0, 0.05], [0.5, 0, 0.05]), at: 0.75 + vib, r: 0.03 * scaleOf(vn.g), from: dirOf(vn.g, [0, -0.3, -1]), pole: toWorldDir(P(1, -0.8, 0.4)) });
    }, pose() { b.head.rotation.z += 0.28; b.head.rotation.y += 0.25; b.head.rotation.x += 0.08; } };
  }
  if (!globalThis.PRANCER_GEN && role === "beats") {
    const dk = decks(); dk.g.position.set(0, 0, 1.08); root.add(dk.g); const hits = [sdBox(dk.g, [0, 0.56, 0], [1, 0.56, 0.31]), sdBox(dk.g, [0, 1.2, 0], [1, 0.05, 0.25])]; const lit = new Array(16).fill(0); let spin = 0;
    const PAD = { kick: 0, snare: 5, ghost: 6, rim: 9, hat: 14, shaker: 15, crash: 3 };
    return { group: dk.g, update(t, dt = 1 / 60) {
      const e = at(song, "beats", t); for (let i = 0; i < 16; i++) lit[i] *= 0.86;
      const recent = song.parts.beats.filter((x) => x.t <= t && x.t > t - 0.05); for (const x of recent) if (PAD[x.k] !== undefined) lit[PAD[x.k]] = 1;
      dk.pads.forEach((p, i) => { p.material.emissiveIntensity = lit[i] * 2.6; p.position.y = 1.17 - lit[i] * 0.01; });
      dk.strip.material.emissiveIntensity = 0.6 + (e && e.k === "kick" ? Math.exp(-(t - e.t) * 8) * 2 : 0);
      const sc = song.parts.beats.find((x) => x.k === "scratch" && t >= x.t && t < x.t + x.d), scr = sc ? Math.sin((t - sc.t) * 2 * Math.PI * 4.4) : 0;
      spin += sc ? scr * 0.3 : 0.06; dk.plat[0].rotation.y = spin;
      const hit = song.parts.beats.filter((x) => x.t <= t && ["kick", "snare", "rim", "crash"].includes(x.k)).pop(), hdt = hit ? t - hit.t : 9;
      const pp = hit ? dk.padAt(PAD[hit.k]) : dk.padAt(5), lift = hdt < 0.04 ? 0.02 : Math.min(0.2, (hdt - 0.04) * 1.6) + 0.02;
      av.hold("R", { point: dk.g.localToWorld(P(pp.x, 1.12 + lift, pp.z + 0.02)), normal: up, pole: toWorldDir(P(-1, -0.3, 0.3)), cols: hits, out: up, touch: 0.02 });   // the paw open on the pad, lifting between hits
      av.hold("L", { point: dk.g.localToWorld(P(0.6 + scr * 0.02, 1.2, 0.08 + scr * 0.09)), normal: up, pole: toWorldDir(P(1, -0.3, 0.3)), cols: hits, out: up, touch: 0.02 });   // flat on the record
    }, pose(t) { const ph = ((t - song.lead) / song.beat) % 1; b.neck.rotation.x += 0.16 * Math.exp(-Math.pow(ph - 0.05, 2) / 0.01); } };
  }
  if (!globalThis.PRANCER_GEN && role === "drums") {
    /* seated at the kit, open-handed (the arms never cross): the left stick on the hats, the right on the snare and the
       crash on a section's downbeat, both round the toms for a fill; the right foot on the kick pedal. Each stick's tip
       lands on the near part of the head or the near edge of the cymbal; between strokes it hovers low, then winds up */
    const kit = drumKit(); root.add(kit.g); const sticks = { L: stick(), R: stick() }; root.add(sticks.L, sticks.R);
    const evs = song.parts.beats || [], SL = 0.5;
    const HAND = (e) => (e.k === "hat" ? "L" : e.k === "snare" || e.k === "crash" ? "R" : e.k === "tom" ? e.hand : null);
    const SPOTOF = (e) => (e.k === "tom" ? ["tom1", "tom2", "floor"][e.drum || 0] : e.k === "hat" || e.k === "snare" || e.k === "crash" ? e.k : null);
    const BIG = (e) => e && e.k !== "hat";
    const idx = (t) => { let lo = 0, hi = evs.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (evs[m].t <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; };
    const hits = [sdCyl(kit.parts.snare, 0.24, -0.08, 0.08), sdCyl(kit.parts.tom1, 0.2, -0.11, 0.11), sdCyl(kit.parts.tom2, 0.21, -0.12, 0.12), sdCyl(kit.parts.floor, 0.26, -0.2, 0.2)];
    const S = { t: -1, hand: {}, kick: null, accent: 0, last: {} };
    const state = (t) => { if (S.t === t) return S; S.t = t; const i0 = idx(t); S.accent = 0; S.last = {};
      for (let i = i0, k = 0; i >= 0 && k < 80; i--, k++) { const sp = SPOTOF(evs[i]) || (evs[i].k === "kick" ? "kick" : null); if (sp && !S.last[sp]) S.last[sp] = evs[i]; }
      for (const side of ["L", "R"]) { let e = null, n = null;
        for (let i = i0, k = 0; i >= 0 && k < 80; i--, k++) if (HAND(evs[i]) === side) { e = evs[i]; break; }
        for (let i = i0 + 1, k = 0; i < evs.length && k < 80; i++, k++) if (HAND(evs[i]) === side) { n = evs[i]; break; }
        const rest = side === "L" ? "hat" : "snare", A = kit.SPOT[e ? SPOTOF(e) : rest], B2 = kit.SPOT[n && n.t - t < 1.2 ? SPOTOF(n) : e ? SPOTOF(e) : rest];
        const dt = e ? t - e.t : 9, tn = n ? n.t - t : 9, gap = e && n ? n.t - e.t : 9, W2 = n ? Math.min(0.26, Math.max(0.08, (e ? gap : 0.5) * 0.6)) : 0;
        const hover = e ? (BIG(e) ? 0.09 : 0.05) + 0.04 * (e.v || 0.5) : 0.08, rise = dt < 0.025 ? 0 : hover * (1 - Math.exp(-(dt - 0.025) / 0.04));
        let lift = rise, u = 0;
        if (n && tn < W2) { u = 1 - tn / W2; const h = BIG(n) ? 0.3 + 0.2 * (n.v || 0.6) : 0.13 + 0.07 * (n.v || 0.5); lift = Math.max(rise * (1 - u), h * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.12)), 0.7) * (u < 0.89 ? 1 : (1 - u) / 0.11)); }
        if (dt < 0.025) lift = 0;
        S.hand[side] = { e, lift, tip: A.clone().lerp(B2, ease(u)).add(P(0, lift, -lift * 0.35)) };
        if (e) S.accent = Math.max(S.accent, Math.exp(-dt * 9) * (e.v || 0.5) * (BIG(e) ? 1 : 0.35)); }
      let kn = null; for (let i = i0 + 1, k = 0; i < evs.length && k < 80; i++, k++) if (evs[i].k === "kick") { kn = evs[i]; break; }
      S.kick = { dt: S.last.kick ? t - S.last.kick.t : 9, tn: kn ? kn.t - t : 9 }; return S; };
    return { group: kit.g, S, update(t) { const st = state(t);
      for (const side of ["L", "R"]) { const h = st.hand[side], sh = root.worldToLocal(b["sh" + side].getWorldPosition(W())), dir = h.tip.clone().sub(sh).normalize(); h.paw = h.tip.clone().addScaledVector(dir, -SL);
        /* the grip stays in front of a round belly: forward until the paw is clear of it (the stick then angles down more) */
        for (let i = 0, Q = root.localToWorld(h.paw.clone()); i < 20 && av.bodyDist(Q) < (av.armR.paw + 0.04) * av.k; i++) { h.paw.z += 0.03; Q.copy(root.localToWorld(h.paw.clone())); }
        /* the paw closes round the stick from above (an overhand grip, the toes under it), the stick's line through where the paw was going */
        const pawW = root.localToWorld(h.paw.clone()), dW = root.localToWorld(h.tip.clone()).sub(pawW).normalize(), rs = 0.0165 * av.k;
        av.hold(side, { axis: [pawW.clone().addScaledVector(dW, 0.3), pawW.clone().addScaledVector(dW, -0.3)], at: 0.5, r: rs, from: toWorldDir(P(side === "L" ? 0.25 : -0.25, 1, -0.35)), pole: toWorldDir(P(side === "L" ? 1 : -1, -0.5, -0.2)), cols: hits, out: up, touch: 0.04 });
        const pk = pocket(rs / av.k), grip = root.worldToLocal(b["wr" + side].localToWorld(P(0, -0.06 - pk.y, -pk.z))), d2 = h.tip.clone().sub(grip).normalize();   // the stick, from the paw's pocket to where its tip goes
        sticks[side].position.copy(h.tip).addScaledVector(d2, -0.56); sticks[side].quaternion.setFromUnitVectors(P(0, 1, 0), d2); }   // its tip on the drum, its length back through the paw
      for (const [sp, head] of Object.entries(kit.heads)) { const e = st.last[sp], dt = e ? t - e.t : 9; head.scale.setScalar(1 + Math.exp(-dt * 30) * 0.04 * Math.sin(dt * 110)); }
      for (const [sp, c] of Object.entries(kit.cymbals)) { const e = st.last[sp], dt = e ? t - e.t : 9; c.rotation.x = c.userData.rx + (sp === "hat" ? 0.03 : 0.16) * Math.exp(-dt * 4.5) * Math.sin(dt * 15); }
      const k = st.kick; kit.beater.rotation.x = k.dt < 0.05 ? 0.28 : k.tn < 0.12 ? lerp(-0.45, -0.75, ease(1 - k.tn / 0.12)) : lerp(0.28, -0.45, ease((k.dt - 0.05) / 0.15));   // the beater: back, then into the head
    }, pose(t) { const st = state(t), k = st.kick;
      b.hips.position.y -= 0.34; b.hips.position.z -= 0.04;   // on the throne: thighs level, shins down to the pedals
      for (const [th, kn, an, s2] of [[b.thL, b.knL, b.anL, 1], [b.thR, b.knR, b.anR, -1]]) { th.rotation.set(-1.3, 0, 0.22 * s2); kn.rotation.set(0.62, 0, 0); an.rotation.set(-0.45, 0, 0); }   // the shins out to the pedals, the paws flat on them
      const press = k.dt < 0.06 ? 1 - k.dt / 0.06 : 0, lift = k.tn < 0.14 ? Math.sin(Math.PI * (1 - k.tn / 0.14)) : 0; b.thR.rotation.x -= 0.1 * lift; b.anR.rotation.x += -0.35 * lift + 0.2 * press;   // the right foot: heel up, then down on the pedal
      b.chest.rotation.x += 0.06 * st.accent; b.neck.rotation.x += 0.08 * st.accent; } };
  }
  if (!globalThis.PRANCER_GEN && role === "keys") {
    const rk = rhodesKeys(look || "rhodes"); rk.g.position.set(0, 0, 0.88); rk.g.rotation.y = Math.PI; root.add(rk.g); const hits = [sdBox(rk.g, [0, 1.08, 0.02], [1.03, 0.1, 0.22])]; let lx = -0.3, rx = 0.3;   // the keys toward the player (low notes under the left paw), the name toward the crowd
    return { group: rk.g, update(t) {
      const e = at(song, "keys", t), on = e && t < e.t + e.d, down = new Set(on ? [...e.n, Math.min(...e.n) - 12] : []);
      for (const [m, k] of Object.entries(rk.keys)) k.rotation.x = lerp(k.rotation.x, down.has(+m) ? 0.07 : 0, 0.5);
      if (e) { const lo = Math.min(...e.n), hi = Math.max(...e.n); lx = lerp(lx, rk.keyX(lo - 12), 0.3); rx = lerp(rx, rk.keyX(Math.round((lo + hi) / 2)), 0.3); }   // as a player voices it: the root an octave down in the left paw, the chord in the right
      const dt = e ? t - e.t : 9, press = dt < 0.03 ? 0 : Math.min(0.12, (dt - 0.03) * 0.8) * (on ? 0.3 : 1);
      av.hold("L", { point: rk.g.localToWorld(P(lx, 1.18 + press, 0.08)), normal: up, pole: toWorldDir(P(1, -0.6, 0.2)), cols: hits, out: up, touch: 0.02 });   // the paws open on the keys
      av.hold("R", { point: rk.g.localToWorld(P(rx, 1.18 + press, 0.08)), normal: up, pole: toWorldDir(P(-1, -0.6, 0.2)), cols: hits, out: up, touch: 0.02 });
    } };
  }
  return { group: null, update() {} };
}
