/* The rest of the venue, built here rather than in Blender: the raised concourse round the back of the floor (a railing
   to lean on over the crowd, a strip of light along its edge, the back wall), the four stands, the mixing desk in the
   middle of the floor, and the eight band pins hidden round the place. Positions are polar round the stage's centre:
   r metres out, a radians round the bowl (0 straight back from the stage, positive to your right as you face it). */
import * as THREE from "three";
import { STANDS, itemCanvas } from "./items.js";

export const R_IN = 20.2, R_OUT = 26.6, DECK = 2.3, A_MAX = 1.42, AISLE = 1.3, POCKET = 2.6;   // AISLE: half its width              // the concourse: from the last tier back to the wall
export const floorAt = (r) => (r < 10.5 ? 0 : Math.min(DECK, (r - 10.5) * 0.24)); // the tiers rise into the concourse, no step

export function buildVenue({ scene, STAGE, fanTex, fanMeta, pinFaces }) {
  const P = (r, a, y = 0) => new THREE.Vector3(STAGE.x + r * Math.sin(a), y, STAGE.z - r * Math.cos(a));
  const std = (hex, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
  const glow = (hex) => new THREE.MeshBasicMaterial({ color: hex, toneMapped: false, fog: false });
  const group = new THREE.Group(); scene.add(group);
  const colliders = [];                                                       // round things you cannot walk through: { x, z, r }

  /* the concourse deck, its front face, the edge light and the railing */
  const deck = new THREE.Mesh(new THREE.RingGeometry(R_IN, R_OUT, 120, 1, Math.PI / 2 - A_MAX - 0.06, 2 * A_MAX + 0.12).rotateX(-Math.PI / 2), std(0x2a1730, 0.55));
  deck.position.set(STAGE.x, DECK, STAGE.z); group.add(deck);
  const front = new THREE.Mesh(new THREE.CylinderGeometry(R_IN, R_IN, DECK, 120, 1, true, Math.PI - A_MAX - 0.06, 2 * A_MAX + 0.12), std(0x170c1c, 0.8));
  front.material.side = THREE.DoubleSide; front.position.set(STAGE.x, DECK / 2, STAGE.z); group.add(front);
  class Arc extends THREE.Curve { constructor(r, y, a0 = -A_MAX - 0.06, a1 = A_MAX + 0.06) { super(); this.r = r; this.y = y; this.a0 = a0; this.a1 = a1; } getPoint(u) { return P(this.r, this.a0 + u * (this.a1 - this.a0), this.y); } }
  const GAP = (AISLE + 0.3) / R_IN;                                           // the railing opens where the aisle comes up
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new Arc(R_IN + 0.04, DECK - 0.02), 200, 0.035, 6), glow(0xff5fa8)));
  for (const [a0, a1] of [[-A_MAX - 0.06, -GAP], [GAP, A_MAX + 0.06]]) group.add(new THREE.Mesh(new THREE.TubeGeometry(new Arc(R_IN + 0.25, DECK + 1.0, a0, a1), 100, 0.035, 8), std(0xc9c3d6, 0.3, 0.9)));
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6), std(0xc9c3d6, 0.3, 0.9), 70);
  for (let i = 0; i < 70; i++) { let a = -A_MAX + i * (2 * A_MAX) / 69; if (Math.abs(a) < GAP) a = Math.sign(a || 1) * GAP; const m = new THREE.Matrix4().setPosition(P(R_IN + 0.25, a, DECK + 0.5)); posts.setMatrixAt(i, m); } group.add(posts);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R_OUT + 0.2, R_OUT + 0.2, 6, 120, 1, true, Math.PI - A_MAX - 0.06, 2 * A_MAX + 0.12), std(0x1c0f24, 0.9));
  wall.material.side = THREE.DoubleSide; wall.position.set(STAGE.x, DECK + 3, STAGE.z); group.add(wall);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new Arc(R_OUT + 0.1, DECK + 3.6), 200, 0.03, 6), glow(0x7fe6ff)));

  /* the centre aisle: from the concourse down the middle of the floor to an open pocket at the barrier */
  const carpet = std(0x5a1430, 0.9), nose = glow(0xffd36e);
  const flat = new THREE.Mesh(new THREE.BoxGeometry(AISLE * 2, 0.03, 10.6 - 8.4), carpet); flat.position.set(STAGE.x, 0.015, STAGE.z - (8.4 + 10.6) / 2); group.add(flat);
  for (let r = 8.6 + 0.82 * 3; r < 19.7; r += 0.82) { const z = (r - 10.5) * 0.24; if (z <= 0) continue;   // each tier's tread under the aisle, carpeted, its edge lit
    const st_ = new THREE.Mesh(new THREE.BoxGeometry(AISLE * 2, 0.04, 0.82), carpet); st_.position.set(STAGE.x, z + 0.02, STAGE.z - r); group.add(st_);
    const ns = new THREE.Mesh(new THREE.BoxGeometry(AISLE * 2 - 0.2, 0.025, 0.04), nose); ns.position.set(STAGE.x, z + 0.045, STAGE.z - r + 0.39); group.add(ns); }
  const pocket = new THREE.Mesh(new THREE.CircleGeometry(POCKET, 48).rotateX(-Math.PI / 2), carpet); pocket.position.copy(P(9.9, 0, 0.012)); group.add(pocket);

  /* a canvas texture, glowing or plain */
  const canvasTex = (w, h, paint) => { const c = Object.assign(document.createElement("canvas"), { width: w, height: h }); paint(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const sign = (title, [c1, c2]) => canvasTex(1024, 220, (g, w, h) => { g.fillStyle = "#1a0b24"; g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 40); g.fill();
    g.lineWidth = 8; g.strokeStyle = c1; g.shadowColor = c1; g.shadowBlur = 24; g.stroke(); let fs = 120; g.font = `bold ${fs}px "Arial Rounded MT Bold", sans-serif`;
    while (g.measureText(title).width > w - 90) g.font = `bold ${(fs -= 6)}px "Arial Rounded MT Bold", sans-serif`;
    const gr = g.createLinearGradient(0, 40, 0, h - 40); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowBlur = 30; g.fillText(title, w / 2, h / 2 + 6); });
  const menu = (items, c1) => canvasTex(512, 340, (g, w, h) => { g.fillStyle = "#0e0814"; g.fillRect(0, 0, w, h); g.strokeStyle = c1; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = "#fff7ef"; g.font = 'bold 34px "Arial Rounded MT Bold", sans-serif'; g.fillText("MENU", 36, 62); g.font = '30px "Arial Rounded MT Bold", sans-serif';
    items.forEach((k, i) => { g.drawImage(itemCanvas(k, 64), 34, 92 + i * 78, 60, 60); g.fillText(k === "tee" ? "Tour tee" : k === "glow" ? "Glow stick" : k === "cap" ? "Tour cap" : itemName(k), 110, 132 + i * 78); });
    g.fillStyle = c1; g.font = 'italic 22px "Arial Rounded MT Bold", sans-serif'; g.fillText("free with your ticket", 36, h - 26); });
  const itemName = (k) => ({ donut: "Donut", pizza: "Pizza slice", taco: "Fish taco", cola: "Catnip Cola", shake: "Milkshake", water: "Sparkle water", popcorn: "Popcorn", crackers: "Fish crackers", candy: "Cotton candy" })[k] || k;

  /* the stands */
  const stands = STANDS.map((d, si) => { const g = new THREE.Group(); g.position.copy(P(25.3, d.a, DECK)); g.rotation.y = -d.a; group.add(g);
    const c1 = new THREE.Color(d.colours[0]);
    const box = (w, h, dd, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat); m.position.set(x, y, z); g.add(m); return m; };
    box(3.0, 1.0, 0.7, 0, 0.5, 0, std(c1.clone().multiplyScalar(0.35).getHex(), 0.5));               // the counter
    box(3.1, 0.06, 0.8, 0, 1.02, 0.02, std(0xf4efe4, 0.35));                                      // its top
    box(3.0, 0.05, 0.05, 0, 0.98, 0.37, glow(c1.getHex()));                                       // a light along its edge
    box(3.4, 3.2, 0.2, 0, 1.6, -1.25, std(0x241430, 0.8));                                         // the back wall
    for (const x of [-1.55, 1.55]) box(0.12, 3.0, 0.12, x, 1.5, 0.3, std(0xc9c3d6, 0.3, 0.9));     // posts
    box(3.6, 0.14, 1.9, 0, 3.0, -0.35, std(0x2a1838, 0.6));                                        // the canopy
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.69), new THREE.MeshBasicMaterial({ map: sign(d.title, d.colours), transparent: true, toneMapped: false, fog: false }));
    sg.position.set(0, 3.45, 0.45); g.add(sg);
    const mb = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), new THREE.MeshBasicMaterial({ map: menu(d.items, d.colours[0]), toneMapped: false })); mb.position.set(0.75, 2.0, -1.14); g.add(mb);
    d.items.forEach((k, i) => { const t = new THREE.CanvasTexture(itemCanvas(k)); t.colorSpace = THREE.SRGBColorSpace;   // the goods, standing on the counter
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3 })); m.position.set(-0.8 + i * 0.8, 1.27, 0.15); g.add(m); });
    /* a Prancer behind the counter, one of the fans, dancing */
    const vt = fanTex.clone(); vt.repeat.set(1 / fanMeta.cols, 1 / fanMeta.rows); vt.needsUpdate = true;
    const vendor = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.53), new THREE.MeshBasicMaterial({ map: vt, transparent: true, alphaTest: 0.35 })); vendor.position.set(-0.75, 1.05, -0.65); g.add(vendor);   // standing behind the counter, head and shoulders above it
    const light = new THREE.PointLight(c1, 6, 6, 1.8); light.position.set(0, 2.6, 0.6); g.add(light);
    const front = P(23.9, d.a, DECK); colliders.push({ x: g.position.x, z: g.position.z, r: 1.75 });
    return { ...d, group: g, front, vendor: { tex: vt, kind: (si * 7 + 3) % fanMeta.fronts }, next: 0 }; });

  /* the archway at the top of the aisle */
  { const ag = new THREE.Group(); ag.position.copy(P(R_IN + 0.2, 0, DECK)); group.add(ag);
    for (const x of [-AISLE - 0.15, AISLE + 0.15]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.0, 0.16), std(0xc9c3d6, 0.3, 0.9)); p.position.set(x, 1.5, 0); ag.add(p);
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.8, 0.05), glow(0xff5fa8)); l.position.set(x, 1.5, -0.09); ag.add(l); }
    const sgn = new THREE.Mesh(new THREE.PlaneGeometry(AISLE * 2 + 0.5, 0.55), new THREE.MeshBasicMaterial({ map: sign("To the stage", ["#ffd36e", "#ff5fa8"]), transparent: true, toneMapped: false, fog: false, side: THREE.DoubleSide }));
    sgn.position.set(0, 3.25, 0); ag.add(sgn); }

  /* the mixing desk, front of house, off to one side of the aisle */
  const FOH = P(15.6, 0.42, floorAt(15.6)), fohG = new THREE.Group(); fohG.position.copy(FOH); group.add(fohG);
  const desk = canvasTex(512, 256, (g, w, h) => { g.fillStyle = "#15131a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 24; i++) { const x = 16 + i * 20; g.fillStyle = "#2a2833"; g.fillRect(x, 60, 8, 170); g.fillStyle = ["#ff5fa8", "#ffd36e", "#7fe6ff"][i % 3]; g.fillRect(x - 3, 90 + ((i * 37) % 110), 14, 10);
      for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + 4, 14 + k * 11, 4, 0, 7); g.fillStyle = "#9aa1aa"; g.fill(); } } });
  const add = (geo, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.x = rx; fohG.add(m); return m; };
  add(new THREE.BoxGeometry(3.4, 0.25, 2.4), std(0x221a2a, 0.7), 0, 0.12, 0);                  // the riser
  add(new THREE.BoxGeometry(2.6, 0.9, 0.9), std(0x111016, 0.6), 0, 0.7, 0.2);                   // the desk
  add(new THREE.PlaneGeometry(2.5, 0.85), new THREE.MeshBasicMaterial({ map: desk, toneMapped: false }), 0, 1.17, 0.12, -Math.PI / 2 + 0.25);
  add(new THREE.BoxGeometry(0.9, 0.55, 0.06), glow(0x2a6fd6), -0.7, 1.55, -0.2);                // a screen
  for (const x of [-1.6, 1.6]) add(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), std(0xc9c3d6, 0.3, 0.9), x, 1.3, -1.1);
  add(new THREE.BoxGeometry(3.4, 0.08, 0.08), std(0xc9c3d6, 0.3, 0.9), 0, 2.6, -1.1);
  fohG.rotation.y = Math.PI - 0.42; colliders.push({ x: FOH.x, z: FOH.z, r: 2.0 });                     // the engineer faces the stage

  /* the Prancer Art Hall: the Purranchise on the back wall at the left end of the concourse, each piece lit, with a plaque */
  const HALL = [["01-prancers", "Prancers", "Chapter 01 · Aleatory"], ["02-pads", "Prancer Pads", "Chapter 02 · Aleatory"], ["03-pfp", "Prancer PFP", "Chapter 03 · Aleatory"],
    ["04-wild-ride", "Wild Ride", "Chapter 04 · with scuni"], ["05-prance-trance", "Prance Trance", "Prancers On Objkt"], ["06-post", "Prancer Post", "Chapter 05 · Aleatory"],
    ["07-prance-or-treat", "Prance Or Treat!", "Prancers On Objkt"]];   // the Purranchise only (heART Tarot stays out, Yoeshi 2026-11-01)
  const loader = new THREE.TextureLoader(), A0 = -1.38, A1 = -1.03;
  const hs = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.62), new THREE.MeshBasicMaterial({ map: sign("Prancer Art Hall", ["#c38bff", "#7fe6ff"]), transparent: true, toneMapped: false, fog: false }));
  hs.position.copy(P(R_OUT - 0.05, (A0 + A1) / 2, DECK + 3.15)); hs.rotation.y = -(A0 + A1) / 2; group.add(hs);
  HALL.forEach(([file, title, line], i) => { const a = A0 + (i + 0.5) * (A1 - A0) / HALL.length, g = new THREE.Group(); g.position.copy(P(R_OUT - 0.08, a, DECK)); g.rotation.y = -a; group.add(g);
    const tex = loader.load(`assets/hall/${file}.jpg`); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.12, 0.06), std(0xd9b45a, 0.35, 0.8)); fr.position.set(0, 1.75, 0); g.add(fr);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); art.position.set(0, 1.75, 0.035); g.add(art);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.2), new THREE.MeshBasicMaterial({ map: canvasTex(512, 114, (c, w, h) => { c.fillStyle = "#1a0b24"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#ffd36e"; c.font = 'bold 40px "Arial Rounded MT Bold", sans-serif'; c.textAlign = "center"; c.fillText(title, w / 2, 48); c.fillStyle = "#fff7ef"; c.font = '28px "Arial Rounded MT Bold", sans-serif'; c.fillText(line, w / 2, 92); }), toneMapped: false }));
    pl.position.set(0, 1.02, 0.03); g.add(pl);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.12), glow(0xfff1c4)); lamp.position.set(0, 2.42, 0.12); g.add(lamp); });
  const hallLight = new THREE.PointLight(0xfff1c4, 10, 9, 1.4); hallLight.position.copy(P(R_OUT - 2.5, (A0 + A1) / 2, DECK + 2.8)); group.add(hallLight);

  /* the band pins: one per player, hidden round the venue; walk into one to collect it */
  const PINS = [["me", 9.0, 0], ["nylon", 9.3, -1.15], ["upright", 9.3, 1.15], ["congas", 15.6, 0.42, 2.0], ["sax", 23.4, -1.36], ["violin", 23.4, 1.36], ["keys", 22.0, -0.52], ["beats", 22.0, 0.52]];
  const pins = PINS.map(([who, r, a, up = 0], i) => { const tex = new THREE.CanvasTexture(pinFaces[i]); tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, toneMapped: false })); s.scale.set(0.55, 0.55, 1);
    const p = P(r, a, floorAt(r) + 1.25 + up); s.position.copy(p); group.add(s);
    const halo = new THREE.PointLight(0xffd36e, 3, 2.5, 2); halo.position.copy(p); group.add(halo); return { who, sprite: s, halo, base: p, got: false }; });

  function update(t, now) { const k = now / 1000;
    for (const s of stands) { const f = s.vendor.kind * fanMeta.frames + Math.floor(k * 10) % fanMeta.frames;   // the vendors dance
      s.vendor.tex.offset.set((f % fanMeta.cols) / fanMeta.cols, 1 - (Math.floor(f / fanMeta.cols) + 1) / fanMeta.rows); }
    for (const p of pins) if (!p.got) { p.sprite.position.y = p.base.y + 0.12 * Math.sin(k * 2 + p.base.x); p.sprite.material.rotation = 0.15 * Math.sin(k * 1.5 + p.base.z); } }
  /* fans step out of the aisle and the pocket (and off the desk and the stands) */
  const keepClear = (x, z) => { const r = Math.hypot(x - STAGE.x, z - STAGE.z); if (z < STAGE.z && Math.abs(x - STAGE.x) < AISLE + 0.35 && r < R_IN + 0.5) return true;
    if (P(9.9, 0).setY(0).distanceTo(new THREE.Vector3(x, 0, z)) < POCKET + 0.3) return true; return colliders.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 0.3); };
  return { group, stands, pins, colliders, FOH, P, update, keepClear, hall: { a0: A0, a1: A1 } };
}

/* round pin faces for the band: each player's cell from the band video (colour, with its alpha from below), on a gold pin */
export function makePinFaces(video, out) { const ORDER = 8;
  const tmp = Object.assign(document.createElement("canvas"), { width: 320, height: 245 }), tg = tmp.getContext("2d", { willReadFrequently: true });
  for (let i = 0; i < ORDER; i++) { const cx = (i % 4) * 320, cy = Math.floor(i / 4) * 245;
    tg.clearRect(0, 0, 320, 245); tg.drawImage(video, cx, cy + 490, 320, 245, 0, 0, 320, 245); const al = tg.getImageData(0, 0, 320, 245);
    tg.drawImage(video, cx, cy, 320, 245, 0, 0, 320, 245); const im = tg.getImageData(0, 0, 320, 245);
    for (let p = 0; p < im.data.length; p += 4) { const a = al.data[p]; im.data[p + 3] = a; if (a > 8) for (let k = 0; k < 3; k++) im.data[p + k] = Math.min(255, im.data[p + k] * 255 / a); }
    tg.putImageData(im, 0, 0);
    const c = out[i], g = c.getContext("2d"); g.clearRect(0, 0, 256, 256);
    const gr = g.createRadialGradient(128, 110, 10, 128, 128, 120); gr.addColorStop(0, "#5a2a8a"); gr.addColorStop(1, "#1a0b24");
    g.beginPath(); g.arc(128, 128, 118, 0, 7); g.fillStyle = gr; g.fill(); g.lineWidth = 14; g.strokeStyle = "#ffd36e"; g.stroke();
    g.save(); g.beginPath(); g.arc(128, 128, 108, 0, 7); g.clip(); g.drawImage(tmp, 60, 0, 200, 150, 8, 40, 240, 180); g.restore();   // head and shoulders
  }
  return out; }
