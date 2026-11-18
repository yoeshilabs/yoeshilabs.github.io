/* The lower wall open: the Sphere's screen all the way down, in both shows (the 3D show's show3d.js and the first show's show.js; ?open=0 is
   the room as it was). First a study for Yoeshi (2026-11-17: "the inner half wall that goes
   around the bottom of the sphere and gets taller behind the vendors ... slightly breaks the immersion how it cuts off projections. maybe,
   as an alternative it is all screen and in the gallery section showcasing chapters it becomes a more digital display of them within that
   dedicated space").
   What cut the picture off was two things: a black drape 5 m high all round, just inside the dome (venue3d.js), and the concourse's own back
   wall, 6 m high behind the stands (show/venue.js). The dome's picture is already painted down to the floor behind both (dev/wall.html: every
   mode down to the horizon, the light bars standing on it), so here they are simply put away and the dome is the wall:
     - the drape and the back wall (and its strip of light) are hidden;
     - the concourse becomes a balcony before the screen: a rail along its back edge with a line of light at its foot, and its back face
       closed; the screen goes on down behind it to the floor;
     - the Prancer Art Hall, which hung on that wall as framed pictures under lamps, becomes digital: a row of tall glass screens standing
       where the frames hung, each chapter lit from within over its name, a line of light round each, the dome's picture between them.
   Nothing is added to the dome's own picture, so a guest's piece on the whole sky is whole. The stands keep their own backs.
   His word on 2026-11-18: "the lower wall is a huge improvement"; "definitely an upgrade to add across the shows".
     openWall({ THREE, sphere, venue, STAGE })   sphere: the 3D show's (its drape), or null */
import { R_OUT, DECK, A_MAX } from "./venue.js";
import { holoHall } from "./holohall.js";

export function openWall({ THREE, sphere, venue, STAGE, holo = false, cat3d = null, film = false }) {
  const P = venue.P, group = new THREE.Group(); group.name = "open wall"; venue.group.add(group);
  const std = (hex, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
  const glow = (hex) => new THREE.MeshBasicMaterial({ color: hex, toneMapped: false, fog: false });
  const drape = sphere && sphere.group.getObjectByName("drape"); if (drape) drape.visible = false;   // (the first show's room has no drape: its dome already comes down to the floor behind the concourse's wall)
  venue.group.traverse((o) => { if (o.name === "backwall" || o.name === "backwall light" || o.name === "hall frame") o.visible = false; });

  /* the balcony's back: its face down to the floor, a rail, a line of light along its foot */
  const A = A_MAX + 0.06, R = R_OUT + 0.12;
  const face = new THREE.Mesh(new THREE.CylinderGeometry(R_OUT + 0.02, R_OUT + 0.02, DECK, 120, 1, true, Math.PI - A, 2 * A), std(0x120a18, 0.85));
  face.material.side = THREE.DoubleSide; face.position.set(STAGE.x, DECK / 2, STAGE.z); group.add(face);
  class Arc extends THREE.Curve { constructor(r, y) { super(); this.r = r; this.y = y; } getPoint(u) { return P(this.r, -A + u * 2 * A, this.y); } }
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new Arc(R, DECK + 1.0), 200, 0.035, 8), std(0xc9c3d6, 0.3, 0.9)));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new Arc(R, DECK + 0.03), 200, 0.03, 6), glow(0x7fe6ff)));
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6), std(0xc9c3d6, 0.3, 0.9), 96), M = new THREE.Matrix4();
  for (let i = 0; i < 96; i++) posts.setMatrixAt(i, M.setPosition(P(R, -A + i * 2 * A / 95, DECK + 0.5))); group.add(posts);
  /* glass between the posts: barely there, a sheen */
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.86, 120, 1, true, Math.PI - A, 2 * A), new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.set(STAGE.x, DECK + 0.5, STAGE.z); group.add(glass);

  /* the Art Hall. holo: each chapter a hologram that its own generator makes (holohall.js, a study); else digital: one glass screen a chapter */
  const hall = venue.hall, N = hall.pieces.length, loader = new THREE.TextureLoader(), LINE = [0xc38bff, 0x7fe6ff];
  const holos = holo ? holoHall({ THREE, group, P, R: R_OUT - 0.55, DECK, hall, cat3d, film }) : null;
  if (holos) venue.group.traverse((o) => { if (o.isPointLight && o.color.getHex() === 0xfff1c4 && o.intensity === 10) o.intensity = 2.5; });   /* the hall's own lamp light, low: the stands light themselves, and a cat on one was washed white */
  if (!holos) {
  const caption = (title, line) => { const c = Object.assign(document.createElement("canvas"), { width: 512, height: 150 }), g = c.getContext("2d");
    g.textAlign = "center"; g.fillStyle = "#ffd36e"; let fs = 44; g.font = `bold ${fs}px "Arial Rounded MT Bold", sans-serif`; while (g.measureText(title).width > 488) g.font = `bold ${(fs -= 2)}px "Arial Rounded MT Bold", sans-serif`; g.fillText(title, 256, 56);
    g.fillStyle = "#e9f6ff"; let fl = 28; g.font = `${fl}px "Arial Rounded MT Bold", sans-serif`; while (g.measureText(line).width > 488) g.font = `${(fl -= 2)}px "Arial Rounded MT Bold", sans-serif`; g.fillText(line, 256, 106);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const body = new THREE.BoxGeometry(1.0, 2.4, 0.07), bodyM = new THREE.MeshStandardMaterial({ color: 0x06050a, roughness: 0.12, metalness: 0.7 });
  const artG = new THREE.PlaneGeometry(0.9, 0.9), capG = new THREE.PlaneGeometry(0.9, 0.264);
  hall.pieces.forEach(([file, title, line], i) => { const a = hall.a0 + (i + 0.5) * (hall.a1 - hall.a0) / N, g = new THREE.Group(); g.position.copy(P(R_OUT - 0.2, a, DECK)); g.rotation.y = -a; group.add(g);
    const b = new THREE.Mesh(body, bodyM); b.position.set(0, 1.2, 0); g.add(b);
    const tex = loader.load(`assets/hall/${file}.jpg`); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const art = new THREE.Mesh(artG, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); art.position.set(0, 1.78, 0.037); g.add(art);
    const cap = new THREE.Mesh(capG, new THREE.MeshBasicMaterial({ map: caption(title, line), transparent: true, toneMapped: false })); cap.position.set(0, 1.08, 0.037); g.add(cap);
    /* a line of light round the screen, and its number at the foot */
    const col = glow(LINE[i % 2]); for (const [w, h, x, y] of [[1.0, 0.022, 0, 2.4], [1.0, 0.022, 0, 0.012], [0.022, 2.4, -0.5, 1.2], [0.022, 2.4, 0.5, 1.2]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.09), col); m.position.set(x, y, 0); g.add(m); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.012, 0.012), col); bar.position.set(0, 0.84, 0.04); g.add(bar); }); }
  /* its sign stands on two posts over the middle of the row (the sign itself is the hall's own) */
  venue.group.traverse((o) => { if (o.name === "hall sign") { const a = (hall.a0 + hall.a1) / 2; o.position.copy(P(R_OUT - 0.2, a, DECK + 3.0)); o.rotation.y = -a;
    for (const dx of [-2.2, 2.2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.3, 6), std(0xc9c3d6, 0.3, 0.9)); p.position.copy(o.position).add(new THREE.Vector3(dx * Math.cos(a), -1.35, dx * Math.sin(a))); p.position.y = DECK + 1.65; group.add(p); } } });
  return { group, hall: holos, update(t, dt, me) { if (holos) holos.update(t, dt, me); } };
}
