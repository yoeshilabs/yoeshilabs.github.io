

const D = 64 - 46, GT = (a, t) => [a * Math.cos(t), (a - D) * Math.sin(t)];


export function placeBarriers({ THREE, scene, closed = [] }) {
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
   
  for (const [tg, half] of [[0, 4.5], [Math.PI / 2, 3.6], [Math.PI, 4.5], [Math.PI * 1.5, 3.6]]) { const a = 86.7, h = half / Math.hypot(a * Math.sin(tg), (a - D) * Math.cos(tg)); barrier(GT(a, tg - h), GT(a, tg + h)); }
   
  for (const c of closed) { const dx = c.x1 - c.x0, dz = c.z1 - c.z0, L = Math.hypot(dx, dz) || 1, ex = 0.4 / L; barrier([c.x0 - dx * ex, c.z0 - dz * ex], [c.x1 + dx * ex, c.z1 + dz * ex]); }
  

  { const post = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.8 }), rope = new THREE.MeshStandardMaterial({ color: 0x9c1d2a, roughness: 0.8 });
    const RA = 116 - 0.45, RB = 100 - 0.45, pts = []; let L = 0, prev = [RA, 0]; const fine = []; for (let i = 0; i <= 4000; i++) { const u = i / 4000 * Math.PI * 2, p = [RA * Math.cos(u), RB * Math.sin(u)]; L += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; fine.push([L, p]); }
    const n = Math.round(L / 3); let k = 0; for (let i = 0; i < n; i++) { const d = i / n * L; while (fine[k][0] < d) k++; pts.push(fine[k][1]); }
    const P = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.07, 1.0, 10), post, n), R = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6), rope, n), o = new THREE.Object3D();
    pts.forEach((p, i) => { o.position.set(p[0], 0.5, p[1]); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); P.setMatrixAt(i, o.matrix);
      const q = pts[(i + 1) % n], dx = q[0] - p[0], dz = q[1] - p[1], len = Math.hypot(dx, dz); o.position.set((p[0] + q[0]) / 2, 0.8, (p[1] + q[1]) / 2); o.rotation.set(0, -Math.atan2(dz, dx), Math.PI / 2); o.scale.set(1, len, 1); o.updateMatrix(); R.setMatrixAt(i, o.matrix); });
    g.add(P, R); }
  return { group: g, tick(t) { const k = 0.6 + 0.6 * (0.5 + 0.5 * Math.sin(t * 3)); for (const l of lamps) l.material.emissiveIntensity = k; } };
}
