/* The Arena's dress for an event (2026-11-24): what is hung on the building for one occasion and taken down after, kept apart from the building
   itself so the Colosseum stays itself and a dress is a template (a concert's, a holiday's). arena.html loads it with ?dress=<name>.
   The first dress is for Circus Maximus, the #PostAmericana call on Teia (December 2026; its themes and rules are in the Codex,
   threads/teia-winter-entries.md): the call's colours (yellow, red, orange, blue) against the pearl, and its themes made into things a fair would
   hang: sponsor banners and ads (advertising as fantasy), fuel pumps that are really chargers (petroleum and plastic), an inflatable cat (plastic),
   a toy ad (toys as Jr. propaganda), chasing-bulb marquees and pennants (pre-internet icons), comic bursts at the jumps (the daredevils).
   The absurdity is in what is hung; the making stays refined: real geometry, lit, nothing flashing (the call bars photosensitive work).
   Sponsor names and slogans are working names, his to change.
     dressArena(name, ctx)   ctx: { THREE, scene, FAB, A, B, ell, MODE, STATIONS, TOP }   -> { tick(t) } */
export function dressArena(name, ctx) { if (name !== "postamericana") return { tick() {} };
  const { THREE, scene, FAB, A, B, ell, MODE, STATIONS, TOP } = ctx, TAU = Math.PI * 2;
  const C = { yellow: "#ffd23c", red: "#e0262b", orange: "#ff9a2e", blue: "#1f5fe0", cream: "#fff4dc", ink: "#2a1a12" }, PAL = [C.yellow, C.red, C.orange, C.blue];
  const lamp = (c, k = 2.2) => new THREE.MeshStandardMaterial({ color: "#111", emissive: c, emissiveIntensity: k, roughness: 0.4 });
  const metal = FAB ? FAB.metal : new THREE.MeshStandardMaterial({ color: "#e4e8ef", roughness: 0.34, metalness: 0.55 });
  const plastic = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.22, metalness: 0.05, emissive: c, emissiveIntensity: 0.08 });
  const canvasTex = (w, h, draw) => { const k = document.createElement("canvas"); k.width = w; k.height = h; draw(k.getContext("2d"), w, h); const t = new THREE.CanvasTexture(k); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const lit = (tx, k = 0.75) => new THREE.MeshStandardMaterial({ map: tx, emissive: "#ffffff", emissiveMap: tx, emissiveIntensity: k, roughness: 0.5 });
  const put = (parent, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  const at = (a, b, t, y = 0, face = "in") => { const p = ell(a, b, t), g = new THREE.Group(); g.position.set(p.x, y, p.y); g.lookAt(face === "in" ? 0 : p.x * 2, y, face === "in" ? 0 : p.y * 2); scene.add(g); return g; };
  const ticks = [];

  /* the sponsors (working names) and their banners: hung on the second tier's piers, every fourth bay, none over a gate's bay */
  const SP = [["PURR OIL", "fill her up with sunshine", C.red, C.yellow], ["KIBBLE KOLA", "the taste of tomorrow", C.blue, C.cream], ["TUNA TOWN MOTORS", "freedom, financed", C.yellow, C.red],
    ["PAWSITIVE PLASTICS", "forever, guaranteed", C.orange, C.ink], ["LUCKY WHISKERS", "insure all nine", C.cream, C.blue]];
  const banner = (s) => canvasTex(256, 1024, (x, w, h) => { const [nm, sub, bg, fg] = s; x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.fillRect(0, 0, w, 26); x.fillRect(0, h - 26, w, 26);
    x.save(); x.translate(w / 2 + 18, h / 2); x.rotate(-Math.PI / 2); x.textAlign = "center"; x.textBaseline = "middle"; x.font = "bold 118px Helvetica, Arial, sans-serif"; x.fillText(nm, 0, -34, h - 120);
    x.font = "italic 44px Georgia, serif"; x.fillText(sub, 0, 66, h - 160); x.restore(); });
  const BT = SP.map(banner), N = 80;
  for (let i = 2, n = 0; i < N; i += 4) { if ([0, 1, 19].includes(i % 20)) continue; const t = i / N * TAU, g = at(A + 1.95, B + 1.95, t, 0, "out");
    const s = n++ % SP.length, m = lit(BT[s], 0.55); m.side = THREE.DoubleSide; const pl = put(g, new THREE.PlaneGeometry(2.4, 8.6), m, 0, 16.6, 0.3);
    put(g, new THREE.CylinderGeometry(0.07, 0.07, 2.9, 8), metal, 0, 20.95, 0.3).rotation.z = Math.PI / 2; put(g, new THREE.SphereGeometry(0.16, 10, 8), metal, 1.5, 20.95, 0.3); put(g, new THREE.SphereGeometry(0.16, 10, 8), metal, -1.5, 20.95, 0.3); }

  /* pennants on strings round the plaza, between thin masts, in the call's four colours */
  { const M = 40, R = 14, masts = [], pen = [];
    for (let k = 0; k < M; k++) { const t = (k + 0.5) / M * TAU, p = ell(A + R, B + R, t); masts.push(new THREE.Vector3(p.x, 9, p.y)); }
    const mm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.12, 9, 8), metal, M), o = new THREE.Object3D(); masts.forEach((p, k) => { o.position.set(p.x, 4.5, p.z); o.updateMatrix(); mm.setMatrixAt(k, o.matrix); }); scene.add(mm);
    const cap = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 10, 8), lamp(C.yellow, 1.6), M); masts.forEach((p, k) => { o.position.set(p.x, 9.1, p.z); o.updateMatrix(); cap.setMatrixAt(k, o.matrix); }); scene.add(cap);
    const tri = new THREE.BufferGeometry(); tri.setAttribute("position", new THREE.Float32BufferAttribute([-0.45, 0, 0, 0.45, 0, 0, 0, -1.1, 0], 3)); tri.computeVertexNormals();
    const pm = new THREE.MeshStandardMaterial({ roughness: 0.6, side: THREE.DoubleSide }), PER = 9, col = new THREE.Color(), cords = [];
    for (let k = 0; k < M; k++) { const a = masts[k], b = masts[(k + 1) % M]; const pts = [];
      for (let j = 0; j <= 16; j++) { const u = j / 16; pts.push(a.clone().lerp(b, u).add(new THREE.Vector3(0, -1.6 * 4 * u * (1 - u), 0))); } cords.push(new THREE.CatmullRomCurve3(pts));
      for (let j = 1; j <= PER; j++) { const u = j / (PER + 1), p = a.clone().lerp(b, u).add(new THREE.Vector3(0, -1.6 * 4 * u * (1 - u), 0)); pen.push({ p, d: b.clone().sub(a).setY(0).normalize(), c: PAL[(k * PER + j) % 4] }); } }
    const pi = new THREE.InstancedMesh(tri, pm, pen.length); pen.forEach((e, k) => { o.position.copy(e.p); o.lookAt(e.p.clone().add(new THREE.Vector3(-e.d.z, 0, e.d.x))); o.updateMatrix(); pi.setMatrixAt(k, o.matrix); pi.setColorAt(k, col.set(e.c)); }); scene.add(pi);
    const cg = cords.map((c) => new THREE.TubeGeometry(c, 16, 0.025, 4)); for (const g of cg) scene.add(new THREE.Mesh(g, metal)); }

  /* the marquee at each gate: a free-standing board on the plaza beside the gate, its name on cream, a border of bulbs that chase slowly */
  { const mq = canvasTex(1024, 384, (x, w, h) => { x.fillStyle = C.cream; x.fillRect(0, 0, w, h); x.fillStyle = C.red; x.fillRect(0, 0, w, 18); x.fillRect(0, h - 18, w, 18);
      x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = C.ink; x.font = "bold 64px Helvetica, Arial, sans-serif"; x.fillText("TONIGHT", w / 2, 82);
      x.fillStyle = C.red; x.font = "bold 150px Helvetica, Arial, sans-serif"; x.fillText("SKY CIRCUS", w / 2, 212, w - 60); x.fillStyle = C.blue; x.font = "italic 46px Georgia, serif"; x.fillText("eight cars, four jumps, one crowd", w / 2, 316); });
    const bulbs = [], bm = lamp("#fff1c8", 2.2), board = lit(mq, 0.5);
    for (const tg of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) for (const sd of [-1, 1]) { const g = at(A + 15, B + 15, tg + sd * 0.135, 0, "out");
      put(g, new THREE.BoxGeometry(9.6, 3.9, 0.5), metal, 0, 6.6, 0); put(g, new THREE.PlaneGeometry(9.0, 3.37), board, 0, 6.6, 0.26);
      for (const x of [-3.6, 3.6]) put(g, new THREE.CylinderGeometry(0.16, 0.2, 4.7, 10), metal, x, 2.35, 0);
      const ring = []; for (let k = 0; k < 22; k++) ring.push([-4.55 + 9.1 * k / 21, 8.5]); for (let k = 1; k < 8; k++) ring.push([4.55, 8.5 - 3.8 * k / 8]); for (let k = 21; k >= 0; k--) ring.push([-4.55 + 9.1 * k / 21, 4.7]); for (let k = 7; k >= 1; k--) ring.push([-4.55, 8.5 - 3.8 * k / 8]);
      ring.forEach(([x, y], k) => { bulbs.push({ g, x, y, k }); }); }
    const bi = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 8, 6), bm, bulbs.length), o = new THREE.Object3D(), col = new THREE.Color();
    bulbs.forEach((b, k) => { b.g.updateMatrixWorld(true); o.position.set(b.x, b.y, 0.3); o.updateMatrix(); o.matrix.premultiply(b.g.matrixWorld); bi.setMatrixAt(k, o.matrix); bi.setColorAt(k, col.setScalar(1)); }); scene.add(bi);
    let lastStep = null; const chase = (t) => { const st = Math.floor(t * 4); if (st === lastStep) return; lastStep = st; bulbs.forEach((b, k) => bi.setColorAt(k, col.setScalar(((b.k + Math.floor(t * 4)) % 3) === 0 ? 1 : 0.32))); bi.instanceColor.needsUpdate = true; };   // (4 steps a second, one bulb in three: a slow chase, nothing that flashes)
    chase(0); ticks.push(chase); }

  /* the pumps that are chargers: four islands on the plaza at the diagonals, three fifties pumps each under a canopy, a lit globe on each */
  { const globe = canvasTex(256, 256, (x, w, h) => { x.fillStyle = C.cream; x.fillRect(0, 0, w, h); x.fillStyle = C.red; x.beginPath(); x.arc(w / 2, h / 2, 104, 0, TAU); x.fill(); x.fillStyle = C.yellow; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "bold 54px Helvetica, Arial, sans-serif"; x.fillText("PURR", w / 2, h / 2 - 26); x.fillText("OIL", w / 2, h / 2 + 30); });
    const face = canvasTex(256, 512, (x, w, h) => { x.fillStyle = C.red; x.fillRect(0, 0, w, h); x.fillStyle = C.cream; x.fillRect(28, 60, w - 56, 150); x.fillStyle = C.ink; x.font = "bold 40px Helvetica, Arial, sans-serif"; x.textAlign = "center"; x.fillText("CHARGE", w / 2, 120); x.font = "28px Helvetica, Arial, sans-serif"; x.fillText("not petrol, honest", w / 2, 170);
      x.fillStyle = C.yellow; x.fillRect(0, 250, w, 22); x.fillStyle = C.cream; x.font = "bold 92px Helvetica, Arial, sans-serif"; x.fillText("12", w / 2, 400); x.font = "28px Helvetica, Arial, sans-serif"; x.fillText("LIVES PER CHARGE", w / 2, 452); });
    const body = plastic(C.red), gm = lit(globe, 0.9), fm = lit(face, 0.35);
    for (let k = 0; k < 4; k++) { const t = Math.PI / 4 + k * Math.PI / 2, g = at(A + 24, B + 24, t, 0, "out");
      put(g, new THREE.BoxGeometry(14, 0.35, 5), new THREE.MeshStandardMaterial({ color: "#e8e2dc", roughness: 0.5 }), 0, 0.18, 0);   // the island
      put(g, new THREE.BoxGeometry(16, 0.5, 7), metal, 0, 6.4, 0); put(g, new THREE.BoxGeometry(16.1, 0.16, 7.1), lamp(C.yellow, 1.8), 0, 6.1, 0);   // the canopy and its lit edge
      for (const x of [-6.5, 6.5]) put(g, new THREE.CylinderGeometry(0.2, 0.2, 6, 10), metal, x, 3.2, 0);
      for (const x of [-4, 0, 4]) { const p = put(g, new THREE.CapsuleGeometry(0.55, 1.5, 6, 12), body, x, 1.55, 0); p.scale.set(1.15, 1, 0.75); put(g, new THREE.PlaneGeometry(0.95, 1.9), fm, x, 1.5, 0.43);
        put(g, new THREE.SphereGeometry(0.42, 18, 14), gm, x, 3.0, 0); const h = put(g, new THREE.TorusGeometry(0.5, 0.05, 6, 16, Math.PI * 1.2), new THREE.MeshStandardMaterial({ color: "#222", roughness: 0.6 }), x + 0.62, 1.5, 0); h.rotation.y = Math.PI / 2; } } }

  /* the inflatable cat at the south gate: a giant sitting cat in glossy plastic, tethered to the plaza */
  { const g = at(A + 10, B + 10, Math.PI / 2 + 0.33, 0, "out"); g.lookAt(g.position.x + 0.35, 0, g.position.z + 1);   // (it faces the plaza, a little toward the gate)
    const y = plastic(C.yellow), r = plastic(C.red), w = plastic(C.cream), ink = new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.3 });
    const s = (geo, m, x, yy, z, sx = 1, sy = 1, sz = 1) => { const o = put(g, geo, m, x, yy, z); o.scale.set(sx, sy, sz); return o; };
    s(new THREE.SphereGeometry(3.4, 32, 24), y, 0, 3.6, 0, 1, 1.15, 0.95);                       // the body, sitting
    s(new THREE.SphereGeometry(2.5, 32, 24), y, 0, 8.6, 0.4);                                   // the head
    for (const x of [-1.5, 1.5]) { const e = s(new THREE.ConeGeometry(0.9, 1.8, 20), y, x, 10.9, 0.2); e.rotation.z = -x * 0.18; s(new THREE.ConeGeometry(0.5, 1.0, 16), r, x * 0.98, 10.75, 0.45).rotation.z = -x * 0.18; }
    s(new THREE.SphereGeometry(1.3, 24, 16), w, 0, 7.9, 2.6, 1, 0.75, 0.6);                    // the muzzle
    for (const x of [-0.85, 0.85]) s(new THREE.SphereGeometry(0.42, 16, 12), ink, x, 9.05, 2.72, 1, 1.25, 0.5);   // the eyes
    s(new THREE.SphereGeometry(0.28, 12, 10), r, 0, 8.2, 3.32);                                // the nose
    for (const x of [-1.6, 1.6]) s(new THREE.SphereGeometry(1.1, 20, 14), w, x, 0.9, 2.6, 1, 0.7, 1.3);   // the paws
    { const tl = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.55, 14, 32, Math.PI * 1.1), y); tl.position.set(-3.2, 1.4, -1); tl.rotation.set(Math.PI / 2, 0, Math.PI * 0.35); g.add(tl); }   // the tail, curled
    s(new THREE.TorusGeometry(2.0, 0.32, 12, 40), r, 0, 6.6, 0.5, 1, 1, 1).rotation.x = Math.PI / 2 - 0.3;   // a red collar
    for (const [x, z] of [[-5, 4], [5, 4], [-4, -5], [4, -5]]) { const top = new THREE.Vector3(x * 0.45, 7, z * 0.3), bot = new THREE.Vector3(x, 0.05, z), mid = top.clone().add(bot).multiplyScalar(0.5);
      const ln = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, top.distanceTo(bot), 4), metal); ln.position.copy(mid); ln.lookAt(top); ln.rotateX(Math.PI / 2); g.add(ln); put(g, new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10), metal, x, 0.1, z); } }

  /* the two big screens run ads: the fuel that is not fuel, and a toy */
  { const ad1 = canvasTex(1400, 600, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, C.yellow); gr.addColorStop(1, C.orange); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.fillStyle = C.red; x.beginPath(); x.arc(250, 300, 190, 0, TAU); x.fill(); x.fillStyle = C.yellow; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "bold 92px Helvetica, Arial, sans-serif"; x.fillText("PURR", 250, 250); x.fillText("OIL", 250, 350);
      x.fillStyle = C.ink; x.textAlign = "left"; x.font = "bold 96px Helvetica, Arial, sans-serif"; x.fillText("Fill her up", 500, 210); x.fillText("with sunshine.", 500, 320); x.font = "italic 44px Georgia, serif"; x.fillText("It's electric. Don't tell Grandpa.", 500, 430); });
    const ad2 = canvasTex(1400, 600, (x, w, h) => { x.fillStyle = C.blue; x.fillRect(0, 0, w, h); for (let k = 0; k < 24; k++) { x.strokeStyle = "rgba(255,210,60,.22)"; x.lineWidth = 18; x.beginPath(); x.moveTo(w * 0.72, h * 0.5); x.lineTo(w * 0.72 + Math.cos(k / 24 * TAU) * 900, h * 0.5 + Math.sin(k / 24 * TAU) * 900); x.stroke(); }
      x.fillStyle = C.yellow; x.textAlign = "left"; x.textBaseline = "middle"; x.font = "bold 104px Helvetica, Arial, sans-serif"; x.fillText("SKY CIRCUS", 70, 170); x.fillText("RACER!", 70, 280);
      x.fillStyle = C.cream; x.font = "italic 46px Georgia, serif"; x.fillText("Wind it up. Watch it fly.", 74, 390); x.font = "bold 34px Helvetica, Arial, sans-serif"; x.fillText("BATTERIES AND BRAVERY NOT INCLUDED", 74, 480); x.fillText("AGES 3 AND UP", 74, 530);
      x.fillStyle = C.red; x.beginPath(); x.ellipse(w * 0.72, h * 0.5, 210, 90, -0.2, 0, TAU); x.fill(); x.fillStyle = "#bfe6ff"; x.beginPath(); x.ellipse(w * 0.72, h * 0.5 - 60, 90, 60, -0.2, Math.PI, TAU); x.fill(); });
    [ad1, ad2].forEach((tx, i) => { const s = i ? 1 : -1, g = new THREE.Group(); g.position.set(s * (A - 14), TOP + 12, 0); g.rotation.y = -s * Math.PI / 2; scene.add(g); put(g, new THREE.PlaneGeometry(28, 12), lit(tx, 0.9), 0, 0, 0.68); }); }

  /* comic bursts at the four jumps, carved and lit: a starburst in a metal rim on a mast beside each take-off lip */
  if (MODE === "skystart" && STATIONS) { const WORDS = ["CRASH!", "BANG!", "KABOOM!", "WHOOSH!"];
    STATIONS.forEach((J, k) => { const tx = canvasTex(512, 512, (x, w, h) => { const n = 14; x.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, rr = i % 2 ? 150 : 250; x.lineTo(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr); } x.closePath();
        x.fillStyle = [C.yellow, C.orange, C.yellow, C.orange][k]; x.fill(); x.lineWidth = 14; x.strokeStyle = C.red; x.stroke(); x.fillStyle = C.red; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "bold 100px Helvetica, Arial, sans-serif"; x.save(); x.translate(w / 2, h / 2); x.rotate(-0.12); x.fillText(WORDS[k], 0, 0, 380); x.restore(); });
      const m = new THREE.MeshStandardMaterial({ map: tx, transparent: true, alphaTest: 0.5, emissive: "#ffffff", emissiveMap: tx, emissiveIntensity: 0.8, roughness: 0.4 });   // (one-sided: a two-sided sheet read backwards from behind, "MOOBAK")
      const side = new THREE.Vector3(-J.dir.z, 0, J.dir.x), p = J.P.clone().add(side.multiplyScalar(9)), g = new THREE.Group(); g.position.copy(p); g.lookAt(p.clone().sub(J.dir)); scene.add(g);
      put(g, new THREE.CylinderGeometry(0.16, 0.22, 9, 8), metal, 0, -4.5, 0); for (const ry of [0, Math.PI]) { const f = put(g, new THREE.PlaneGeometry(7, 7), m, 0, 3.2, ry ? -0.01 : 0.01); f.rotation.y = ry; } }); }   // (a face each way, so the word reads right from both sides)

  return { tick: (t) => ticks.forEach((f) => f(t)) };
}
