

const D = 64 - 46, GT = (a, t) => [a * Math.cos(t), (a - D) * Math.sin(t)];
const TS = Math.PI / 2, T4 = (4 + 0.5) / 16 * Math.PI * 2;

export function placeBarriers({ THREE, scene }) {
  const g = new THREE.Group(); g.name = "barriers"; scene.add(g); const lamps = [];
  const sign = (() => { const c = document.createElement("canvas"); c.width = 512; c.height = 160; const x = c.getContext("2d");
    x.fillStyle = "#1c1622"; x.fillRect(0, 0, 512, 160); x.strokeStyle = "#ffd36e"; x.lineWidth = 8; x.strokeRect(6, 6, 500, 148);
    x.fillStyle = "#ffd36e"; x.textAlign = "center"; x.font = "700 52px Helvetica, Arial, sans-serif"; x.fillText("UNDER", 256, 70); x.fillText("MAINTENANCE", 256, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
  const stripes = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 32; const x = c.getContext("2d"); x.fillStyle = "#f2efe8"; x.fillRect(0, 0, 256, 32); x.fillStyle = "#d8342c";
    for (let i = -2; i < 12; i++) { x.beginPath(); x.moveTo(i * 32, 32); x.lineTo(i * 32 + 16, 32); x.lineTo(i * 32 + 32, 0); x.lineTo(i * 32 + 16, 0); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t; })();
  const leg = new THREE.MeshStandardMaterial({ color: 0x2a2630, roughness: 0.6, metalness: 0.4 }), signM = new THREE.MeshStandardMaterial({ map: sign, roughness: 0.7, emissive: 0xffffff, emissiveMap: sign, emissiveIntensity: 0.25 });
   
  function barrier(p0, p1, y = 0) { const dx = p1[0] - p0[0], dz = p1[1] - p0[1], L = Math.hypot(dx, dz), b = new THREE.Group();
    const st = stripes.clone(); st.repeat.set(L / 1.6, 1); st.needsUpdate = true; const bar = new THREE.MeshStandardMaterial({ map: st, roughness: 0.55 });
    for (const h of [0.55, 1.05]) { const m = new THREE.Mesh(new THREE.BoxGeometry(L, 0.2, 0.06), bar); m.position.y = h; m.castShadow = true; b.add(m); }
    for (const u of [-0.5, 0.5]) for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.25, 8), leg); l.position.set(u * (L - 0.2), 0.6, s * 0.18); l.rotation.x = s * 0.15; b.add(l); }
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.47), signM); sg.position.set(0, 1.55, 0.04); b.add(sg); const back = sg.clone(); back.rotation.y = Math.PI; back.position.z = -0.04; b.add(back);
    for (const u of [-0.5, 0.5]) { const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffb030, emissive: 0xffa020, emissiveIntensity: 1 })); lamp.position.set(u * (L - 0.2), 1.32, 0); b.add(lamp); lamps.push(lamp); }
    b.position.set((p0[0] + p1[0]) / 2, y, (p0[1] + p1[1]) / 2); b.rotation.y = -Math.atan2(dz, dx); g.add(b); return b; }
   
  barrier(GT(87.1, TS - 0.016), GT(92.3, TS - 0.016)); barrier(GT(87.1, T4 + 0.021), GT(92.3, T4 + 0.021));
   
  { const a = 86.7, h = 3.6 / a; barrier(GT(a, TS - h), GT(a, TS + h)); }
   
  const post = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.8 }), rope = new THREE.MeshStandardMaterial({ color: 0x9c1d2a, roughness: 0.8 });
  const across = (a, w) => { const t = TS + w / Math.hypot(a * Math.sin(TS), (a - D) * Math.cos(TS)); return GT(a, t); };
  const edge = []; for (let a = 97; a <= 123.6; a += 3) edge.push(across(a, -15.6)); for (let w = -15.6; w <= 15.6; w += 3.12) edge.push(across(123.6, w)); for (let a = 123.6; a >= 97; a -= 3) edge.push(across(a, 15.6));
  const P = new THREE.CylinderGeometry(0.05, 0.07, 0.95, 10), top = new THREE.SphereGeometry(0.08, 10, 8);
  edge.forEach((p, i) => { const m = new THREE.Mesh(P, post); m.position.set(p[0], 0.47, p[1]); g.add(m); const k = new THREE.Mesh(top, post); k.position.set(p[0], 0.97, p[1]); g.add(k);
    const q = edge[i + 1]; if (!q) return; const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, L, 6), rope); r.position.set((p[0] + q[0]) / 2, 0.78, (p[1] + q[1]) / 2); r.rotation.set(0, -Math.atan2(dz, dx), Math.PI / 2); g.add(r); });
  return { group: g, tick(t) { const k = 0.6 + 0.6 * (0.5 + 0.5 * Math.sin(t * 3)); for (const l of lamps) l.material.emissiveIntensity = k; } };
}
