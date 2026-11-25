/* The floor's acts (2026-11-24, his ask on the Circus Maximus film's cut 5: "the courses all feel empty. we need to bring in Prancelot jousting
   against an opponent, 3D prancers racing electric unicycles (use "Inmotion P6" as inspo for design as reference for model", gladiator and other
   mythic cats battling on the balance beem. etc"): who performs on each floor, kept apart from the building as the dress is (dress.js).
     ?act=joust      (mode=tournament) Prancelot (Pepper Yarnmore, Prancers On Objkt #4, built by the minted knight's own code, read only) and a
                     rival tilting at the barrier, lances couched; the rival's lance breaks on Prancelot's shield and the rival rocks back
     ?act=beam       (mode=tournament) two balance beams raised on lifts, the four Mythics on them: the Gladiator against the Star Monk, the Sword
                     Knight against the CIB Agent (its blaster's bolts turned on the blade)
     ?act=chariots   (mode=circus) four chariots in the four factions' colours round the spina, each drawn by a pony with a Prancer at the reins
     ?act=euc        (mode=euc) Prancers racing electric unicycles round the course: a tall wheel after the Inmotion P6 (a big knobbly tyre, a
                     tall shell with a carry handle on top, power pads, a suspension's sliders and springs, wide pinned pedals, a headlight and
                     a light bar), each cat on its pedals, knees bent, arms out
     ?act=speedway   (mode=speedway) the Sky Circus cars racing round the banking, drivers at the wheel
   stageActs(name, ctx) -> { tick(t) }   ctx: { THREE, scene, MODE, FA, FB, car, seatCat, setJets, TEAMS, glow, mat }. Cats are Prancer 3D's own
   (makeCat, or the Avatar for the knights), at the venue's cat scale (0.58); the props are made here, for the venue. */
export async function stageActs(name, ctx) {
  if (name.includes(",")) { const names = name.split(","), parts = []; for (const n of names) parts.push(await stageActs(n, ctx));   /* (several acts at once: ?act=joust,band; ctx.schedule(name, t) gives each its own time, or null to leave it as it is) */
    return { tick: (t) => parts.forEach((p, i) => { const lt = ctx.schedule ? ctx.schedule(names[i], t) : t; if (lt !== null && lt !== undefined) p.tick(lt); }), focus: parts[0].focus, probe: parts[0].probe, parts: Object.fromEntries(names.map((n, i) => [n, parts[i]])) }; }
  const { THREE, scene, FA, FB, TEAMS, glow, mat } = ctx, P = (x, y, z) => new THREE.Vector3(x, y, z), TAU = Math.PI * 2, S = 0.58;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }, lerp = (a, b, k) => a + (b - a) * k;
  const { makeCat } = await import("./home/next/cats/cast.js"), ZERO = new THREE.Vector2(0, 0);
  const box = (parent, w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };
  const rodTo = (o, a, b) => { const d = b.clone().sub(a); o.position.copy(a).addScaledVector(d, 0.5); o.scale.set(1, d.length(), 1); o.quaternion.setFromUnitVectors(P(0, 1, 0), d.normalize()); };
  const rod = (parent, r, m) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8), m); o.castShadow = true; parent.add(o); return o; };
  const cat = async (seed) => { const c = await makeCat({ seed, shells: ctx.shells || 10 }); c.holder.scale.setScalar(S); for (let k = 0; k < 20; k++) c.step(1 / 60, ZERO); c.holder.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return c; };
  const legsTo = (av, side, target, pole) => av.reach(side, target, pole, 0, [], { bones: ["th" + side, "kn" + side, "an" + side], len: [0.46, 0.47], soft: 0.8, lift: 1 });
  let last = null; const clock = (t) => { const dt = last === null || t < last || t - last > 0.5 ? 1 / 24 : t - last; last = t; return dt; };
  const W0 = (o) => o.getWorldPosition(P(0, 0, 0));

  /* ---------- the electric unicycle, after the Inmotion P6 (avatar units: the cat's knee comes to the top of the shell) ---------- */
  function makeEUC(acc) {
    const g = new THREE.Group(), wheel = new THREE.Group(), R = 0.46; wheel.position.y = R; g.add(wheel);
    const rub = mat("#18181c", { roughness: 0.9 }), shellM = mat("#ece9f1", { roughness: 0.22, metalness: 0.15 }), edgeM = mat("#8d93a0", { roughness: 0.2, metalness: 0.8 }), padM = mat("#111114", { roughness: 0.95 }), chrome = mat("#e3e8ee", { roughness: 0.12, metalness: 0.9 }), accM = glow(acc, 2.2);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(R - 0.085, 0.09, 14, 56), rub); tire.rotation.y = Math.PI / 2; tire.castShadow = true; wheel.add(tire);
    for (let i = 0; i < 30; i++) { const a = i / 30 * TAU; box(wheel, 0.16, 0.035, 0.05, rub, (i % 2 ? 1 : -1) * 0.015, Math.cos(a) * (R - 0.005), Math.sin(a) * (R - 0.005), a); }   // the knobbly tread, staggered
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.15, 32), edgeM); hub.rotation.z = Math.PI / 2; wheel.add(hub);
    for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.014, 6, 40), accM); ring.rotation.y = Math.PI / 2; ring.position.x = s * 0.078; wheel.add(ring); }
    /* the shell: two tall side plates, broad over the wheel and rounding in to the top, a cap with the carry handle across them */
    const sh = new THREE.Shape(); sh.moveTo(-0.33, 0.34); sh.quadraticCurveTo(-0.42, 0.62, -0.31, 0.93); sh.quadraticCurveTo(-0.26, 1.04, -0.14, 1.05); sh.lineTo(0.16, 1.05); sh.quadraticCurveTo(0.29, 1.04, 0.33, 0.92); sh.quadraticCurveTo(0.43, 0.62, 0.33, 0.34); sh.lineTo(-0.33, 0.34);
    const plateG = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 16 }); plateG.rotateY(Math.PI / 2);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(plateG, shellM); p.position.x = s > 0 ? 0.13 : -0.19; p.castShadow = true; g.add(p);
      box(g, 0.05, 0.3, 0.24, padM, s * 0.235, 0.74, 0.01);                                          // the power pads, where the calves lean
      for (const z of [-0.09, 0.09]) { const sl = rod(g, 0.022, chrome); rodTo(sl, P(s * 0.215, 0.4, z), P(s * 0.215, 0.6, z)); }   // the suspension's sliders
      const spring = [], n = 40; for (let i = 0; i <= n; i++) { const a = i / n * TAU * 6; spring.push(P(s * 0.215 + Math.cos(a) * 0.035, 0.42 + 0.17 * i / n, Math.sin(a) * 0.035)); }
      const sp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spring), 160, 0.008, 5), accM); g.add(sp);
      box(g, 0.15, 0.035, 0.32, edgeM, s * 0.31, 0.19, 0.0);                                         // the pedals, wide, with their pins
      for (let i = 0; i < 6; i++) box(g, 0.012, 0.025, 0.012, chrome, s * 0.31 + (i % 2 ? 0.045 : -0.045), 0.215, -0.12 + Math.floor(i / 2) * 0.12);
      box(g, 0.06, 0.08, 0.08, edgeM, s * 0.22, 0.21, 0);                                          // the pedal's hinge
      const strip = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(0, 0.4, 0.37), P(0, 0.62, 0.42), P(0, 0.9, 0.34), P(0, 1.03, 0.2)].map((v) => v.setX(s > 0 ? 0.2 : -0.2))), 30, 0.012, 5), accM); g.add(strip); }   // the light bar down the front edge
    box(g, 0.42, 0.07, 0.34, shellM, -0.03, 1.07, 0.01); box(g, 0.32, 0.04, 0.12, padM, -0.03, 1.1, -0.06);   // the cap, and the carry handle's grip slot
    box(g, 0.3, 0.09, 0.03, glow("#fff6e0", 3), -0.03, 0.96, 0.345);                               // the headlight
    box(g, 0.26, 0.04, 0.03, glow("#ff3a4a", 2.4), -0.03, 0.98, -0.345);                           // the taillight
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return { g, wheel, R };
  }

  /* ---------- the chariot: two spoked wheels, a curved front in the faction's colour, gold rails, two shafts to its pony ---------- */
  function makeChariot(col, trim, axleZ, shaftX, chestY, shoulderZ) {
    const g = new THREE.Group(), C = mat(col, { roughness: 0.3, metalness: 0.2 }), T = mat(trim, { roughness: 0.25, metalness: 0.8 }), wood = mat("#6b4a2e", { roughness: 0.7 }), wheels = [];
    for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 0.95, 0.85, axleZ); g.add(w); wheels.push(w);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 8, 40), T); rim.rotation.y = Math.PI / 2; w.add(rim);
      for (let i = 0; i < 8; i++) { const sp = rod(w, 0.03, wood); const a = i / 8 * TAU; rodTo(sp, P(0, 0, 0), P(0, Math.cos(a) * 0.78, Math.sin(a) * 0.78)); }
      const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 12), T); hb.rotation.z = Math.PI / 2; w.add(hb); }
    box(g, 2.0, 0.08, 0.06, wood, 0, 0.85, axleZ);                                                          // the axle
    box(g, 1.5, 0.08, 1.0, C, 0, 0.9, axleZ + 0.1);                                                       // the floor
    const front = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.7, 1.0, 28, 1, true, -Math.PI * 0.62, Math.PI * 1.24), C); front.material.side = THREE.DoubleSide; front.position.set(0, 1.42, axleZ + 0.15); front.scale.set(1, 1, 0.75); g.add(front);   // its curved front, open behind
    const rail = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.04, 6, 40, Math.PI * 1.24), T); rail.rotation.set(Math.PI / 2, 0, Math.PI * 0.12 + Math.PI / 2 - Math.PI * 0.62 + Math.PI * 0.38); rail.position.set(0, 1.92, axleZ + 0.15); rail.scale.set(1, 0.75, 1); g.add(rail);
    for (const s of [-1, 1]) { const sh2 = rod(g, 0.045, wood); rodTo(sh2, P(s * 0.5, 1.0, axleZ + 0.6), P(s * shaftX, chestY, shoulderZ)); }   // the shafts
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return { g, wheels };
  }

  /* ---------- the knights, by the minted knight's own code: Prancelot, and a rival ---------- */
  async function makeKnightRider(seed, { cape = null, coat, mane } = {}) {
    const [{ Avatar }, { roll }, { makeKnight }, { makePony }] = await Promise.all([import("./p3d/src/avatar.js"), import("./p3d/gen/src/traits.js"), import("./p3d/src/knight.js"), import("./p3d/src/pony.js")]);
    function xmur3(s) { for (var i = 0, h = 1779033703 ^ s.length; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return function () { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^= h >>> 16) >>> 0; }; }
    function sfc32(a, b, c, d) { return function () { a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; var t = (a + b) | 0; a = b ^ b >>> 9; b = c + (c << 3) | 0; c = c << 21 | c >>> 11; d = d + 1 | 0; t = t + d | 0; c = c + t | 0; return (t >>> 0) / 4294967296; }; }
    const hh = xmur3(seed), R = sfc32(hh(), hh(), hh(), hh()), G = roll(R);
    Object.assign(G, { BW: 0.9, BUILD: "Slim", OUTFIT: "Knight", SLEEVE: "#c9d1dc", JACKET: "#c9d1dc", TEE: "#c9d1dc", PANTS: "#bcc5d1", SHORTSLEEVE: false, HAT: "None", INSTR: "None", HOLD: "None", MYTH: false, EYEWEAR: "None", TEMP: "Curious" });   // as the minted page sets it
    const av = new Avatar(G, { shells: ctx.shells || 10, rand: R, armK: 1.3 }); av.b.head.scale.setScalar(1.2);
    const kn = makeKnight(av), pony = makePony(av.L, { coat, mane });
    kn.cape.cols.push((Q) => pony.dist(Q)); pony.seat.add(av.root); av.root.position.set(0, -0.69, 0.04);
    if (cape) kn.cape.mesh.material.color.set(cape);
    /* the lance in place of the great sword: the sword's own frame carries it, couched under the arm */
    const sw = kn.sword; sw.g.children.forEach((o) => (o.visible = false));
    const lance = new THREE.Group(); sw.g.add(lance);
    const stripes = document.createElement("canvas"); stripes.width = 64; stripes.height = 512; { const x = stripes.getContext("2d"); for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? (cape || "#2f3f9a") : "#f6f2ee"; x.save(); x.translate(0, i * 32); x.transform(1, 0.5, 0, 1, 0, 0); x.fillRect(-64, -32, 192, 32); x.restore(); } }
    const st = new THREE.CanvasTexture(stripes); st.colorSpace = THREE.SRGBColorSpace; st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(2, 3);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.13, 6.2, 16), new THREE.MeshStandardMaterial({ map: st, roughness: 0.4 })); shaft.position.y = 3.3; lance.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 12), mat("#e2b44a", { roughness: 0.25, metalness: 1 })); tip.position.y = 6.55; lance.add(tip);
    const vamp = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.55, 24, 1, true), mat("#cdd5df", { roughness: 0.3, metalness: 1, side: THREE.DoubleSide })); vamp.rotation.x = Math.PI; vamp.position.y = 0.45; lance.add(vamp);   // the vamplate guarding the paw
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 12), mat("#5a3a22", { roughness: 0.7 })); grip.position.y = -0.1; lance.add(grip);
    const root = new THREE.Group(), mount = new THREE.Group(); mount.add(pony.root); root.add(mount); root.add(kn.cape.mesh);   // (the pony's update puts its own root back at rest each frame: it is carried in a mount)
    root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const legR = { up: 0.22 * Math.min(av.L.bw, 1.25) + (av.L.furLen || 0), fore: 0.19, paw: 0.21 };
    const couch = new THREE.Quaternion().setFromUnitVectors(P(0, 1, 0), P(0.2, 0.06, 1).normalize());
    let warm = false, rock = 0, rockV = 0;
    return { root, mount, pony, av, kn, shaft, tip, lance,
      hit() { rockV = -3.2; },
      update(t, dt, look) {   // in the root's own unit frame: the caller sets the root's scale to 1 for this
        rockV += (-rock * 30 - rockV * 4) * dt; rock += rockV * dt;
        pony.update(t, dt, { rear: -1, trot: 1, graze: 0 });
        av.root.rotation.set(pony.up * 0.55 + rock * 0.6, 0, 0); av.root.position.y = -0.69 + Math.abs(Math.sin(t * 7.5)) * 0.06;
        av.update({ t, dt, speed: 0, phase: 0, air: 0, vy: 0, land: 0, emote: null, emoteT: 0, emoteLen: 0, look }); av.root.updateMatrixWorld(true);
        kn.update(t, dt, { swing: -1, rest: 0 });
        kn.hold.position.set(-0.4 * av.L.bw, 0.82, 0.5); kn.hold.quaternion.copy(couch); kn.hold.updateMatrixWorld(true);   // couched: level, forward, across the pony's neck
        const q = av.root.getWorldQuaternion(new THREE.Quaternion());
        av.reach("R", sw.g.localToWorld(P(0, -0.15, 0)), P(-1, -0.6, -0.2).applyQuaternion(q), 0.3, [], { touch: 0.08 });
        av.reach("L", av.b.hips.localToWorld(P(0.12, 0.95, 0.85)), P(1, -0.6, -0.2).applyQuaternion(q), 0.3, [], { touch: 0.08 });   // the reins
        const pq = pony.root.getWorldQuaternion(new THREE.Quaternion());
        av.tail.forEach((l, i) => { l.rotation.x = i ? 0.1 + 0.03 * Math.sin(t * 1.3 - i) : -1.62; l.rotation.z = Math.sin(t * 2 - i * 0.5) * 0.08; }); av.root.updateMatrixWorld(true);
        for (const [s, side] of [[1, "L"], [-1, "R"]]) av.reach(side, pony.stirrup(s), P(s, 0.3, 1.0).applyQuaternion(pq), 0, [(Q) => pony.dist(Q, true)], { bones: ["th" + side, "kn" + side, "an" + side], len: [0.46, 0.47], r: legR, soft: 0.8, touch: 0.12, lift: 1 });
        if (!warm) { warm = true; kn.cape.settle(160, t - 5); } kn.cape.step(dt, t); } };
  }

  const acts = { tick() {} };
  const bx = (o) => { const b = new THREE.Box3().setFromObject(o); return [b.min, b.max].map((v) => v.toArray().map((x) => +x.toFixed(2))); };

  if (name === "euc") {
    /* the course's own line (as the floor draws it) */
    const pts = []; for (let i = 0; i < 12; i++) { const t = (i / 12) * TAU; pts.push(P((FA - 10) * Math.sin(t), 0, (FB - 8) * Math.sin(t) * Math.cos(t) * (ctx.EUCZ || 1.8))); }
    const cur = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5), LEN = cur.getLength(), yAt = (u) => 0.4 + Math.max(0, Math.sin(u * Math.PI * 6)) ** 3 * 3.2;
    const ACC = ["#6fd3ff", "#ff5fa8", "#ffd36e", "#3fcf86", "#9b7bff", "#ff8a3d", "#f6f2ee", "#3f8cff"], R = [];
    for (let i = 0; i < 8; i++) { const e = makeEUC(ACC[i]), rig = new THREE.Group(); rig.add(e.g); rig.scale.setScalar(S); scene.add(rig);
      const c = await cat("euc-rider" + i); c.holder.scale.setScalar(1); rig.add(c.holder); rig.updateMatrixWorld(true);
      /* the wheel made to the cat: the shell's cap comes to the hips, the pads to the thighs (a Prancer's legs are short), the cat stands on the pedals */
      const hipY = rig.worldToLocal(W0(c.av.b.hips)).y, k = (hipY * 0.95) / (1.07 - 0.21); e.g.scale.setScalar(k); e.k = k; c.holder.position.y = 0.21 * k;
      R.push({ rig, e, c, u0: 0.31 - i * 0.011 - (i % 3) * 0.003, lat: [-1.1, 0.2, 1.1, -0.4, 0.8, -0.9, 0.5, -0.2][i], v: 10.5 + (i % 4) * 0.25, ph: i * 1.7 }); }
    acts.focus = () => ({ p: W0(R[0].rig), yaw: R[0].rig.rotation.y });
    acts.probe = () => R.slice(0, 2).map((r) => ({ k: r.e.k, rig: bx(r.rig), euc: bx(r.e.g), cat: bx(r.c.holder), hips: W0(r.c.av.b.hips).toArray().map((x) => +x.toFixed(2)), avScale: r.c.av.root.scale.x, holderScale: r.c.holder.scale.x }));
    acts.tick = (t) => { const dt = clock(t);
      for (const r of R) { const s = r.u0 * LEN + r.v * t, u = ((s / LEN) % 1 + 1) % 1, p = cur.getPointAt(u), tg = cur.getTangentAt(u), nr = P(-tg.z, 0, tg.x).normalize();
        const du = 2 / LEN, t2 = cur.getTangentAt((u + du) % 1), turn = Math.atan2(tg.x * t2.z - tg.z * t2.x, tg.x * t2.x + tg.z * t2.z) / 2;   // heading change per metre
        const y = yAt(u), y2 = yAt((u + du) % 1), pitch = Math.atan2(y2 - y, 2), lean = clamp(turn * r.v * r.v / 9.8, -0.45, 0.45);   /* (into the turn: his word on cut 6) */
        r.rig.position.copy(p).addScaledVector(nr, r.lat).setY(y + 0.05); r.rig.rotation.order = "YXZ"; r.rig.rotation.set(-pitch * 0.6 - 0.05, Math.atan2(tg.x, tg.z), lean);
        r.e.wheel.rotation.x = s / (r.e.R * r.e.k * S);
        const av = r.c.av; r.c.step(dt, ZERO); r.rig.updateMatrixWorld(true);
        const H = r.c.holder, sway = Math.sin(t * 2.2 + r.ph);
        for (const [sd, side] of [[1, "L"], [-1, "R"]]) { legsTo(av, side, r.e.g.localToWorld(P(sd * 0.31, 0.3, 0.03)), av.root.localToWorld(P(sd * 0.6, 0.6, 2)).sub(W0(av.root)).normalize());
          av.reach(side, av.root.localToWorld(P(sd * (1.05 + 0.1 * sway * sd), 1.55 + 0.12 * sway * sd, 0.2)), av.root.localToWorld(P(sd, -1, -0.4)).sub(W0(av.root)).normalize(), 0, [], { soft: 0.4 }); } }
      /* ?follow=x,y,z,i: the camera rides beside rider i (metres, in its heading's frame, never its lean), looking a little ahead of it */
      if (ctx.follow) { const [ox, oy, oz, ri = 1, fov = 50] = ctx.follow.split(",").map(Number), r = R[ri], c = ctx.cam, p0 = W0(r.rig), yw = r.rig.rotation.y, fw = P(Math.sin(yw), 0, Math.cos(yw)), rt = P(Math.cos(yw), 0, -Math.sin(yw));
        c.position.copy(p0).addScaledVector(rt, ox).addScaledVector(fw, oz).add(P(0, oy, 0)); c.up.set(0, 1, 0); c.lookAt(p0.clone().addScaledVector(fw, 2).add(P(0, 0.9, 0))); c.fov = fov; c.updateProjectionMatrix(); } };
  }

  else if (name === "chariots") {
    const CH = [];
    for (let i = 0; i < 4; i++) { const [col, trim] = TEAMS[i], driver = await cat("charioteer" + i), rig = new THREE.Group(); rig.scale.setScalar(S); scene.add(rig);
      const { makePony } = await import("./p3d/src/pony.js"), pony = makePony(driver.av.L, { coat: ["#f4efe7", "#3a2c28", "#c98a5e", "#9a9aa6"][i], mane: col }); rig.add(pony.root);
      pony.root.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(pony.root), half = (bb.max.x - bb.min.x) / 2;
      const ch = makeChariot(col, trim === "#ffffff" ? "#e2b44a" : trim, bb.min.z - 1.25, half * 0.62, (bb.min.y + bb.max.y) * 0.5, bb.min.z + (bb.max.z - bb.min.z) * 0.62); rig.add(ch.g);
      driver.holder.scale.setScalar(1); driver.holder.position.set(0, 0.94, bb.min.z - 1.1); rig.add(driver.holder);
      const reins = [rod(rig, 0.02, mat("#3a2418")), rod(rig, 0.02, mat("#3a2418"))];
      pony.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      CH.push({ rig, pony, ch, driver, reins, lane: i, th0: -0.25 - i * 0.16 + (i % 2) * 0.05, w: 0, ph: i * 0.9 }); }
    acts.focus = () => ({ p: W0(CH[0].rig), yaw: CH[0].rig.rotation.y });
    acts.tick = (t) => { const dt = clock(t);
      for (const c of CH) { const a = 50 + c.lane * 2.4, b = 28 + c.lane * 2.2, v = 9.2 - c.lane * 0.25, th = c.th0 + v * t / ((a + b) / 2);   // counterclockwise, as the Romans ran
        const x = a * Math.cos(th), z = -b * Math.sin(th), dx = -a * Math.sin(th), dz = -b * Math.cos(th);
        c.rig.position.set(x, 0.3, z); c.rig.rotation.set(0, Math.atan2(dx, dz), 0); c.rig.updateMatrixWorld(true);
        c.pony.update(t + c.ph, dt, { rear: -1, trot: 1, graze: 0 }); c.ch.wheels.forEach((w) => (w.rotation.x = v * t / (0.8 * S)));
        const av = c.driver.av; c.driver.step(dt, ZERO, { emote: null }); c.rig.updateMatrixWorld(true); const H = c.driver.holder;
        av.b.hips.rotation.x += 0.18;   // leaning into the reins
        const head = c.pony.headWorld()[0];
        for (const [sd, side, k] of [[1, "L", 0], [-1, "R", 1]]) { const paw = av.root.localToWorld(P(sd * 0.35, 1.55, 0.75)); av.reach(side, paw, av.root.localToWorld(P(sd, -1, -0.5)).sub(W0(av.root)).normalize(), 0, [], { soft: 0.4 });
          rodTo(c.reins[k], c.rig.worldToLocal(av.b["wr" + side].getWorldPosition(P(0, 0, 0))), c.rig.worldToLocal(head.clone()).add(P(sd * 0.15, -0.2, -0.3))); c.reins[k].scale.x = c.reins[k].scale.z = 1; } } };
  }

  else if (name === "joust") {
    /* the tilt: a barrier down the floor's long axis, in the two teams' colours, the lists' ends marked by tall lamps */
    const ZB = 24, X0 = -36, X1 = 36, BL = mat("#3f8cff", { roughness: 0.35 }), RD = mat("#ff4f7a", { roughness: 0.35 }), WH = mat("#f6f2ee", { roughness: 0.3 }), GD = mat("#e2b44a", { roughness: 0.25, metalness: 1 }), tilt = new THREE.Group(); scene.add(tilt);
    for (let x = X0, i = 0; x < X1; x += 2, i++) box(tilt, 2.0, 0.7, 0.16, i % 2 ? WH : (x < 0 ? BL : RD), x + 1, 0.95, ZB);
    for (let x = X0; x <= X1; x += 4) { box(tilt, 0.22, 1.5, 0.22, GD, x, 0.75, ZB); }
    box(tilt, X1 - X0, 0.08, 0.3, GD, 0, 1.34, ZB);
    for (const x of [X0 - 2, X1 + 2]) { box(tilt, 0.3, 6, 0.3, GD, x, 3, ZB); const l = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), glow("#ffd36e", 2.4)); l.position.set(x, 6.3, ZB); tilt.add(l); }
    const K = [await makeKnightRider("tux7"), await makeKnightRider("rival-knight", { cape: "#b3263f", coat: "#3a2c28", mane: "#b3263f" })];
    for (const k of K) scene.add(k.root);
    const SPL = [], look = new THREE.Vector2(); let broke = false;
    acts.probe = () => ({ tilt: bx(tilt), knights: K.map((k) => ({ pony: W0(k.pony.root).toArray().map((x) => +x.toFixed(2)), local: k.pony.root.position.toArray().map((x) => +x.toFixed(2)), rootScale: k.root.scale.x, box: bx(k.root), parent: k.root.parent && k.root.parent.type })) });
    acts.focus = () => ({ p: W0(K[0].pony.root).lerp(W0(K[1].pony.root), 0.5).setY(1.5), yaw: 0 });
    let lastJ = -1; const reset = () => { broke = false; K[1].tip.visible = true; K[1].shaft.scale.y = 1; K[1].shaft.position.y = 3.3; for (const s2 of SPL) scene.remove(s2.m || s2.flash); SPL.length = 0; };   // (a new pass: the rival's lance whole again)
    let idle = false;   // (between passes the knights wait at the lists' ends: posed once, then left as they are, nothing stepped)
    acts.tick = (t) => { if (t === 0 && lastJ === 0 && idle) return; idle = t === 0; if (t < lastJ - 0.01) reset(); lastJ = t; const dt = clock(t), v = 5.6, xs = [-15.5 + v * t, 15.5 - v * t];
      for (let i = 0; i < 2; i++) { const k = K[i], x = xs[i], dir = i ? -1 : 1, z = ZB + (i ? -2.3 : 2.3);
        k.root.scale.setScalar(1); k.root.position.set(0, 0, 0); k.root.updateMatrixWorld(true);
        k.mount.position.set(x / S, 0.3 / S, z / S); k.mount.rotation.set(0, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0); k.mount.updateMatrixWorld(true);
        k.update(t, dt, look); k.root.scale.setScalar(S); k.root.updateMatrixWorld(true); }
      if (!broke && xs[1] - xs[0] < 3.4) { broke = true; K[1].hit(); K[1].tip.visible = false; K[1].shaft.scale.y = 0.35; K[1].shaft.position.y = 1.2;
        const at = K[0].tip.getWorldPosition(P(0, 0, 0)); for (let n = 0; n < 26; n++) { const m = box(scene, 0.06, 0.06, 0.4 + Math.random() * 0.5, n % 2 ? RD : WH, at.x, at.y, at.z, Math.random() * 3, Math.random() * 3, 0);
          SPL.push({ m, v: P((Math.random() - 0.3) * 6, 2 + Math.random() * 5, (Math.random() - 0.5) * 7), w: P(Math.random() * 9, Math.random() * 9, 0) }); }
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), new THREE.MeshBasicMaterial({ color: "#fff3c4", transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })); fl.position.copy(at); scene.add(fl); SPL.push({ flash: fl, age: 0 }); }
      for (const s of SPL) { if (s.flash) { s.age += dt; s.flash.scale.setScalar(1 + s.age * 5); s.flash.material.opacity = Math.max(0, 0.9 - s.age * 5);   /* (a quick bright burst, gone in a fifth of a second) */ continue; }
        s.v.y -= 9.8 * dt; s.m.position.addScaledVector(s.v, dt); if (s.m.position.y < 0.35) { s.m.position.y = 0.35; s.v.set(0, 0, 0); s.w.set(0, 0, 0); } s.m.rotation.x += s.w.x * dt; s.m.rotation.y += s.w.y * dt; } };
  }

  else if (name === "beam") {
    /* two balance beams, each raised on a pair of lifts, padded below in the teams' colours */
    const BEAMS = [{ cx: -9.5, z: 21 }, { cx: 9.5, z: 21 }], L = 10, BY = 3.0, wood = mat("#e9dcc4", { roughness: 0.45 }), suede = mat("#cdb48a", { roughness: 0.95 }), GD = mat("#e2b44a", { roughness: 0.25, metalness: 1 });
    for (const [i, B] of BEAMS.entries()) { box(scene, L, 0.26, 0.5, suede, B.cx, BY - 0.13, B.z); box(scene, L + 0.1, 0.06, 0.54, wood, B.cx, BY - 0.29, B.z);
      for (const s of [-1, 1]) { box(scene, 0.7, BY - 0.3, 0.7, mat("#f4f0ec", { roughness: 0.3 }), B.cx + s * (L / 2 - 0.8), (BY - 0.3) / 2 + 0.3, B.z); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 8, 32), glow(i ? "#ff5fa8" : "#6fd3ff", 1.8)); ring.rotation.x = Math.PI / 2; ring.position.set(B.cx + s * (L / 2 - 0.8), 0.36, B.z); scene.add(ring); }
      box(scene, L + 2, 0.5, 4, mat(i ? "#ff4f7a" : "#3f8cff", { roughness: 0.9 }), B.cx, 0.55, B.z); }
    /* the four Mythics, each the first seed the generator rolls as that Mythic */
    const gen = await import("./p3d/gen/src/cat.js"), seedOf = (k) => { for (let i = 0; i < 20000; i++) { const g = gen.rollSeed("myth" + i); if (g[k] && !g.SPK && g.LASER === "None") return "myth" + i; } return "myth0"; };
    const pairs = [["GLAD", "MONK"], ["KNIGHT", "CIB"]], F = [];
    for (const [i, [a, b]] of pairs.entries()) { const B = BEAMS[i]; for (const [j, k] of [[0, a], [1, b]]) { const seed = seedOf(k), c = await cat(seed); scene.add(c.holder); F.push({ c, seed, beam: B, side: j ? 1 : -1, kind: k, pair: i }); } }
    console.log("beam seeds: " + F.map((f) => f.kind + "=" + f.seed).join(", "));
    const bolts = []; for (let n = 0; n < 3; n++) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.5, 4, 8), glow("#ff3a4a", 3)); m.visible = false; scene.add(m); bolts.push(m); }
    const [{ placeHeld }, { pocket }] = await Promise.all([import("./p3d/src/wardrobe.js"), import("./p3d/src/avatar.js")]);
    /* the blade swung as the generator holds a thing (holdPose): the paw at a point on the chest's frame, the thing's line along a direction in
       the cat's frame, the arm solved round its grip by the avatar's own hold(), the thing set in the paw by placeHeld() */
    const wield = (av, hp, dir, dt) => { const h = av.held; if (!h || !h.userData.grip) return; const G = h.userData.grip, rq = av.root.getWorldQuaternion(new THREE.Quaternion()), K = av.k;
      const HP = av.b.chest.localToWorld(hp.clone()), d = dir.clone().normalize().applyQuaternion(rq), from = P(...(G.from || [-0.9, -0.1, 0.35])).applyQuaternion(rq); from.addScaledVector(d, -from.dot(d)).normalize();
      const A = HP.clone().addScaledVector(from, -pocket(G.r * 1.5).z * K).addScaledVector(d, -0.25), B = A.clone().addScaledVector(d, 0.5);
      av.hold("R", { axis: [A, B], at: 0.5, r: G.r * 1.5 * K, from, pole: P(-1, -0.6, -0.2).applyQuaternion(rq).normalize(), cols: [] }); placeHeld(av, 0, dt); };
    const KEY = (k, pts) => { const n = pts.length - 1, i = Math.min(n - 1, Math.floor(clamp(k, 0, 0.9999) * n)), f = ease(k * n - i); return [pts[i][0].clone().lerp(pts[i + 1][0], f), pts[i][1].clone().lerp(pts[i + 1][1], f).normalize()]; };
    const READY = [P(-0.42, -0.3, 0.8), P(-0.3, 0.5, 0.82)], UP = [P(-0.5, 0.35, 0.3), P(-0.15, 0.95, -0.3)], CUT = [P(-0.2, -0.25, 0.98), P(0.15, -0.3, 1)], GUARD = [P(-0.3, 0.05, 0.85), P(1, 0.35, 0.15)];
    const AIM = [P(-0.3, -0.02, 0.98), P(0.15, 0.95, 0.3)], FIRE = [P(-0.3, 0.06, 0.9), P(0.1, 0.95, 0.5)];
    acts.focus = () => ({ p: P(BEAMS[0].cx, BY + 1, BEAMS[0].z), yaw: 0 });
    acts.tick = (t) => { const dt = clock(t);
      for (const f of F) { const per = 1.5, ph = f.pair * 0.55, cyc = Math.floor((t + ph) / per), u = ((t + ph) % per) / per, attacking = (cyc % 2 === 0) === (f.side < 0), lunge = attacking ? Math.sin(Math.PI * clamp((u - 0.2) / 0.5, 0, 1)) : -0.6 * Math.sin(Math.PI * clamp((u - 0.35) / 0.45, 0, 1));
        const x = f.beam.cx + f.side * (1.9 - 0.6 * lunge) + 0.35 * Math.sin(t * 0.7 + f.pair);
        const H = f.c.holder; H.position.set(x, BY, f.beam.z); H.rotation.order = "YXZ"; H.rotation.set(attacking ? 0.12 * lunge : -0.18 * Math.max(0, -lunge), f.side < 0 ? Math.PI / 2 : -Math.PI / 2, 0.07 * Math.sin(t * 3.1 + f.side + f.pair));
        f.c.step(dt, ZERO); H.updateMatrixWorld(true); const av = f.c.av, q = H.getWorldQuaternion(new THREE.Quaternion());
        const block = attacking ? 0 : Math.sin(Math.PI * clamp((u - 0.25) / 0.5, 0, 1));
        if (av.shield) av.reach("L", av.b.chest.localToWorld(P(0.62, -0.55, 0.42).lerp(P(0.5, -0.1, 0.75), block)), P(1, -0.6, -0.2).applyQuaternion(q), 0, []);   // the scutum carried, raised to meet the blow
        else av.reach("L", av.root.localToWorld(P(0.95, 1.7 + 0.15 * Math.sin(t * 2.6 + f.side), 0.1)), P(1, -0.8, -0.3).applyQuaternion(q), 0, [], { soft: 0.4 });   // the other paw out, for balance
        const [hp, dir] = f.kind === "CIB" ? (attacking ? KEY(u, [AIM, AIM, FIRE, AIM]) : KEY(block, [AIM, AIM])) : attacking ? KEY(u, [READY, UP, CUT, READY]) : KEY(block, [READY, GUARD]);
        wield(av, hp, dir, dt);
        if (f.kind === "CIB" && attacking) { const k = clamp((u - 0.5) / 0.3, 0, 1), m = bolts[0], from = av.held.getWorldPosition(P(0, 0, 0)).add(P(0, 0.1, 0)), foe = F.find((g) => g.pair === f.pair && g !== f).c.av.root.localToWorld(P(0, 1.9, 0.6));
          m.visible = k > 0 && k < 1; m.position.lerpVectors(from, foe, k); m.quaternion.setFromUnitVectors(P(0, 1, 0), foe.clone().sub(from).normalize()); } } };
  }

  else if (name === "speedway") {
    const CARS = [], QU = [null, "surf", null, "luggage", "tv", null];
    for (let i = 0; i < 6; i++) { const [body, trim] = TEAMS[i % 4], c = ctx.car(body, trim, { num: i + 1, quirk: QU[i] }); c.rotation.order = "YXZ"; scene.add(c); const d = await cat("speedway" + i); CARS.push({ c, d, k: [0.42, 0.62, 0.52, 0.36, 0.68, 0.48][i], th0: 0.6 - i * 0.075, v: 26 - i * 0.35 }); }
    const A0 = FA - 20, B0 = FB - 18, A1 = FA - 1, B1 = FB - 1, Y0 = 0.3, Y1 = 6, bank = Math.atan2(Y1 - Y0, A1 - A0);
    acts.focus = () => ({ p: W0(CARS[0].c), yaw: Math.atan2(1, 0) });
    acts.tick = (t) => { const dt = clock(t);
      for (const r of CARS) { const a = lerp(A0, A1, r.k), b = lerp(B0, B1, r.k), th = r.th0 + r.v * t / ((a + b) / 2), x = a * Math.cos(th), z = -b * Math.sin(th), dx = -a * Math.sin(th), dz = -b * Math.cos(th), y = lerp(Y0, Y1, r.k);
        r.c.position.set(x, y + 1.15, z); r.c.rotation.set(bank, -Math.atan2(dz, dx), 0); ctx.setJets(r.c, { boost: 0.55 + 0.2 * Math.sin(t * 9 + r.k * 7) }); r.c.updateMatrixWorld(true);
        ctx.seatCat(r.d, r.c, -0.12, t, dt); } };
  }

  else if (name === "band") {
    /* The Purrancers on the centre stage (his ask, 2026-11-24: "put the band as rock start in the center part of the stadium during all the chaos",
       "front cat and band need special rockstar gear for this"): the band of the 3D show (prancer-3d band3d.js, read only, the newest cat), on the
       tournament floor's platform, playing the film's song as events (data/band-song.json, tools/band-song.py) in a rock lineup; dressed for the
       night here (the generator's code never changes): black leather with silver studs, the Frontcat in gold sequins; a drum riser, speaker
       stacks, a light truss whose lamps turn slowly through the teams' colours (no flashing: the call says no photosensitive content), and flame
       jets that fire on the crash at each fourth bar */
    const song = await (await fetch(new URL(ctx.songFile || "./data/band-song.json", import.meta.url))).json(), { makeBand3D } = await import("./p3d/src/band3d.js");
    const Y = 2.5, at = (x, z) => P(x, Y, z), SP = { beats: P(0, Y + 0.45, -4.2),   /* (the drummer on the riser's top: on the platform's floor he and his kit stood inside it) */ keys: at(-4.2, -3.2), upright: at(4.2, -3.2), congas: at(-6.6, -0.6), violin: at(6.6, -0.6), sax: at(-3.2, 1.6), nylon: at(3.2, 1.6), me: at(0, 3.6) };
    const band = makeBand3D({ scene, song, spots: SP, height: 2.15, facing: () => 0, tier: ctx.bandTier || "high", bake: false, detail: 1 });
    const BLACK = mat("#16131a", { roughness: 0.3, metalness: 0.15 }), CHROME = mat("#e3e8ee", { roughness: 0.12, metalness: 0.95 }), GOLDS = mat("#d8a632", { roughness: 0.25, metalness: 0.85 });
    const sparkle = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); x.fillStyle = "#808080"; x.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 260; i++) { x.fillStyle = `rgb(${100 + (i * 53) % 155},${100 + (i * 97) % 155},255)`; x.beginPath(); x.arc((i * 37) % 128, (i * 61) % 128, 2.4, 0, TAU); x.fill(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t; })();
    const SEQ = new THREE.MeshPhysicalMaterial({ color: "#d8a632", metalness: 0.9, roughness: 0.22, normalMap: sparkle, normalScale: new THREE.Vector2(0.9, 0.9), clearcoat: 0.5 });
    const LEATHER = new THREE.MeshPhysicalMaterial({ color: "#141217", roughness: 0.34, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.25 });
    for (const m of band.members) { const b = m.av.b, front = m.role === "singer";   // (the Frontcat, found by his part, not his label)
      for (const k of ["chest", "hips", "shL", "shR", "elL", "elR", "thL", "thR", "knL", "knR"]) if (b[k]) for (const o of b[k].children) if (o.isMesh && o.material && o.material.sheen === 1) o.material = front && !/^th|^kn/.test(k) ? SEQ : LEATHER;   // their clothes become stage leather; the Frontcat's top gold sequins
      for (const [sh, sd] of [[b.shL, 1], [b.shR, -1]]) if (sh) for (let i = 0; i < 9; i++) { const a2 = (i / 8 - 0.5) * 2.2, st = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 8), CHROME);   // studs along each shoulder
        st.position.set(sd * (0.06 + Math.cos(a2) * 0.2), 0.12 + Math.abs(Math.sin(a2)) * 0.02, Math.sin(a2) * 0.24); st.rotation.z = -sd * 0.9; sh.add(st); }
      if (b.hips) { const belt = new THREE.Mesh(new THREE.TorusGeometry(0.62 * (m.av.L.bw || 1) * 1.02, 0.045, 8, 48), front ? GOLDS : BLACK); belt.rotation.x = Math.PI / 2; belt.scale.set(1, 0.87, 1); belt.position.y = 0.1; b.hips.add(belt);
        for (let i = 0; i < 16; i++) { const a2 = i / 16 * TAU, st = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), CHROME); st.position.set(Math.cos(a2) * 0.64 * (m.av.L.bw || 1), 0.1, Math.sin(a2) * 0.55 * (m.av.L.bw || 1)); b.hips.add(st); } } }
    /* the stage's dressing */
    const STAGE = new THREE.Group(); scene.add(STAGE);
    box(STAGE, 3.6, 0.45, 2.8, BLACK, 0, Y + 0.22, -4.2); for (const s2 of [-1, 1]) box(STAGE, 3.6, 0.06, 0.06, glow("#ffd36e", 2), 0, Y + 0.45, -4.2 + s2 * 1.4);   // the drum riser
    const grille = mat("#2a2630", { roughness: 0.9 });
    for (const sx of [-1, 1]) for (const [dz, dy] of [[0, 0], [0, 1.25], [1.3, 0]]) { const cab = box(STAGE, 1.3, 1.2, 1.0, BLACK, sx * 8.4, Y + 0.6 + dy, -2.2 + dz); box(STAGE, 1.1, 1.0, 0.04, grille, sx * 8.4, Y + 0.6 + dy, -2.2 + dz + 0.52);
      for (const cy of [-0.22, 0.22]) { const cone = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), mat("#0c0b0e", { roughness: 0.6 })); cone.position.set(sx * 8.4, Y + 0.6 + dy + cy, -2.2 + dz + 0.55); STAGE.add(cone); } }
    const TR = mat("#c9ced6", { roughness: 0.3, metalness: 0.8 }), truss = (a2, b2) => { for (const [ox, oz] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) { const r = rod(STAGE, 0.05, TR); rodTo(r, a2.clone().add(P(ox, 0, oz)), b2.clone().add(P(ox, 0, oz))); } };
    const TOP = Y + 8.5; truss(P(-9, Y, -6), P(-9, TOP, -6)); truss(P(9, Y, -6), P(9, TOP, -6)); truss(P(-9, TOP, -6), P(9, TOP, -6));
    const PARS = [], COLS = ["#ff4f7a", "#ffd36e", "#3f8cff", "#3fcf86", "#9b7bff"];
    for (let i = 0; i < 7; i++) { const x = -7.2 + i * 2.4, can = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.6, 14), BLACK); can.position.set(x, TOP - 0.5, -5.6); can.rotation.x = 0.9; STAGE.add(can);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.26, 16), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false })); lens.position.set(x, TOP - 0.78, -5.4); lens.rotation.x = 0.9 - Math.PI / 2; STAGE.add(lens);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 9, 20, 1, true), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beam.position.set(x, TOP - 4.6, -2.2); beam.rotation.x = -0.75; STAGE.add(beam); PARS.push({ lens, beam, i }); }
    const FL = []; for (const a2 of [-0.9, -0.3, 0.3, 0.9]) { const p = P(Math.sin(a2) * 9.4, Y, Math.cos(a2) * 9.4), base = box(STAGE, 0.5, 0.35, 0.5, BLACK, p.x, Y + 0.17, p.z);
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.55, 4.5, 16, 1, true), new THREE.MeshBasicMaterial({ color: "#ffb347", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      fl.position.set(p.x, Y + 2.6, p.z); fl.rotation.x = Math.PI; STAGE.add(fl); FL.push(fl); }
    const crashes = song.parts.beats.filter((e) => e.k === "crash").map((e) => e.t);
    /* the Frontcat's microphone on its stand */
    const front = band.members.find((m) => m.role === "singer"), mic = new THREE.Group(); scene.add(mic); { const r = rod(mic, 0.025, CHROME); rodTo(r, P(0, 0, 0), P(0, 1.55, 0)); const h = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mat("#2a2a30", { roughness: 0.5 })); h.position.y = 1.6; mic.add(h); const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 16), CHROME); mic.add(ft); }
    mic.position.set(0, Y, 4.75);
    acts.focus = () => ({ p: P(0, Y + 1.2, 1), yaw: 0 });
    acts.tick = (t0) => { clock(t0); const t = t0 + (ctx.clock0 || 0);   /* (the song's own time: a film's take runs its own clock from 0, so it says where in the film it starts, ?clock0=; his word, 2026-11-24: "the band isn't actually paying their instruments") */
      band.update(t, (t - song.lead) / song.beat, ctx.cam, ctx.viewH ? ctx.viewH() : 720);   // (its own detail by size on screen: the real picture height)
      for (const p of PARS) { const c = new THREE.Color(COLS[Math.floor(t / 2.586 + p.i) % COLS.length]).lerp(new THREE.Color(COLS[Math.floor(t / 2.586 + p.i + 1) % COLS.length]), ease((t / 2.586) % 1)); p.lens.material.color.copy(c).multiplyScalar(2.2); p.beam.material.color.copy(c); }   // a slow turn through the colours, a bar each
      const since = Math.min(...crashes.map((c) => (t >= c ? t - c : 99))); FL.forEach((fl, i) => { const k = since < 0.9 ? Math.sin(Math.PI * since / 0.9) : 0; fl.material.opacity = 0.75 * k; fl.scale.set(1, 0.3 + 0.9 * k, 1); });   // the flames, on the crash, for under a second
    };
  }

  else if (name === "plaza") {
    /* the plaza alive (his word on cut 7: "we should also have a crowd moving around when panning the outside of the colosseum"): Prancers walking to
       the South Gate and across in front of it, each on its own line, looping, at a stroll, in the generator's own walk */
    const B0 = ctx.B || 78, W = [];
    for (let i = 0; i < 26; i++) { const c = await makeCat({ seed: "plaza" + i, shells: 6 }); c.holder.scale.setScalar(S); scene.add(c.holder);
      const across = i % 3 === 0, x0 = across ? -36 : -24 + (i * 7.3) % 48, z0 = across ? B0 + 8 + (i * 5.1) % 24 : B0 + 80, x1 = across ? 36 : (x0 > 0 ? 1 : -1) * (1 + (i % 3)), z1 = across ? z0 + ((i % 2) * 2 - 1) * 4 : B0 - 8;   // (from behind the camera or past the frame's edges, into the gate's shadow: none appears or vanishes in sight)
      W.push({ c, a: P(x0, 0.05, z0), b: P(x1, 0.05, z1), v: 1.1 + (i % 5) * 0.12, u0: ((i * 0.618) % 1), back: across && i % 2 === 1 }); }
    acts.focus = () => ({ p: P(0, 2, B0 + 20), yaw: 0 });
    acts.tick = (t) => { const dt = clock(t);
      for (const w of W) { const L = w.a.distanceTo(w.b), u = ((w.u0 + w.v * t / L) % 1), from = w.back ? w.b : w.a, to = w.back ? w.a : w.b, p = from.clone().lerp(to, u), d = to.clone().sub(from).normalize();
        w.c.holder.position.copy(p); w.c.holder.rotation.y = Math.atan2(d.x, d.z);
        w.c.step(dt, ZERO, { speed: 1, phase: (u * L) / 0.9 }); } };
  }
  return acts;
}
