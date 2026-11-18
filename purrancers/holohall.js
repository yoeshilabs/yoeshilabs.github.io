/* The Art Hall as holograms (a study, 2026-11-18). Yoeshi, on seeing the hall as glass screens: "i think we can work with these stands,
   in fact maybe we do fancy holograms of the actual generators or at least showcase the interactive nature of them this way (make them
   feel like what its like to interact with them on aleatory somehow". On the first study (one cat in 3D, the rest square pictures): "have
   the one 3D hologram with the rest being square flat images isnt working, if we are going to do holograms they need to get more creative
   and feel like representations of each piece without the "crop", even in 2d".
   So no stand shows a square picture. Each piece stands in its stand's light as a thing with depth, its backdrop gone:
     - a generator that draws in SVG (Prancers, Pads, Portraits, Wild Ride) is taken apart along its own drawing: its backdrop becomes a
       faint glow far behind, and the rest is cut into slices by the order the generator drew them, each slice a plane of its own a little
       nearer than the last. The slices drift apart and back together, so the piece is seen as it was built, and from the side it has depth;
     - a piece with no layers to take apart (Prancer Post draws to a canvas; the films and the one of one are pictures) becomes a relief of
       light: thousands of points, each standing out by how bright it is, a plain background keyed away, a round edge where a frame was;
     - Prancer 3D's stand holds the cat itself, made from a new seed by the generator's own code.
   For the generators the stand runs the chapter's own page, the one the Purranchise site embeds, with a fresh seed in a hidden frame of this
   site, waits for the piece to say it is ready, and takes it apart there; its seed and the traits it reports go under it. The next stand
   rolls in turn, round the hall, while someone stands near; nobody near, nothing runs. One frame, one generator at a time. If a generator's
   page cannot be reached or read (another site's sandbox may refuse it), the stand keeps its relief of the chapter's own picture.
   Then (his word: "lets keep refining the chapter holograms to really feel intentional and futuristic"): the films play as moving holograms
   of their own footage (Prance Trance as a tunnel of light, its rings stepping away into depth; Prance Or Treat!, the Debut's concert and
   Prancer Park as reliefs that move), and every stand shares one projector's language: a scan of light sweeping up through the piece, a
   rare flicker where the signal slips, motes rising in the beam, a ring that rises round the cat, and the seed typing itself out under a
   new piece as a mint's does.
     holoHall({ THREE, group, P, R, DECK, hall, cat3d, film }) -> { stands, roll(i), rollAll(), update(t, dt, me) } */
const PAGES = { "01-prancers": "prancers.html", "02-pads": "pads.html", "03-pfp": "pfp.html", "04-wild-ride": "ride.html", "06-post": "post.html" };
const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.port !== "8778";
const BASE = LOCAL ? "/prancers/site/" : "/prancers-site/";   /* the Purranchise site's own pages: on this Mac from the repo, live from the same host */
const SIZE = 1.06, SLICES = 6, CLOUD = 210;
const TILT = { "10-prancer-park": -0.95 };
const FILMS = { "05-prance-trance": 1, "07-prance-or-treat": 0, "08-purrancers-debut": 0, "10-prancer-park": 0 };   /* a film's own loop (assets/hall/<file>.mp4) as a moving hologram; 1: a tunnel */   /* Prancer Park is a world seen from above: its relief lies back like a map on a table */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const FX = `float scanAt(float y, float t){ float s = fract(t / 4.5) * 1.3 - 0.15; return exp(-pow((y - s) / 0.022, 2.0)); }
  float glitchAt(float y, float t){ float k = floor(t * 7.0), g = step(0.955, fract(sin(k * 12.9898) * 43758.5453)), b = fract(sin(k * 78.233) * 9631.17); return g * step(abs(y - b), 0.035) * (fract(sin(k * 3.7) * 437.5) - 0.5); }`;
const VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
/* a slice of a piece: its own colours, a projector's lines, its edges lit in the stand's colour, resolving slice by slice from the back */
const SLICE = `uniform sampler2D map; uniform float uT, uMix, uBack, uOn; uniform vec3 uCol; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } ${FX}
  void main(){ vec2 uv = vUv; uv.x += glitchAt(uv.y, uT) * 0.12; vec4 c = texture2D(map, uv); float n = h(floor(uv * 60.0)); float sc = scanAt(uv.y, uT);
    float show = smoothstep(0.0, 0.08, uMix * 1.3 - (1.0 - uv.y) * 0.9 - n * 0.3);
    float sq = max(abs(uv.x - 0.5), abs(uv.y - 0.5)) * 2.0, edge = 1.0 - smoothstep(0.86, 1.0, sq);   // no hard square: whatever reaches the edge fades into the light
    float a = c.a * edge; if (uBack > 0.5) a *= 0.2 * (1.0 - smoothstep(0.2, 0.95, length(uv - 0.5) * 2.0));   // the backdrop: a faint glow far behind
    float rim = clamp(fwidth(c.a) * 5.0, 0.0, 1.0);
    vec3 col = c.rgb * (0.9 + 0.1 * sin(uv.y * 420.0 + uT * 6.0)) + uCol * (0.1 + rim * 0.9) + uCol * sc * 1.2 * c.a;
    col = vec3(texture2D(map, uv + vec2(0.003, 0.0)).r, col.g, texture2D(map, uv - vec2(0.003, 0.0)).b) * 0.35 + col * 0.65;   // a little colour fringe, as a projected picture has
    float spark = step(0.8, fract(n * 7.0 + uT * 6.0)) * 0.45 * (1.0 - show) * c.a;
    gl_FragColor = vec4(mix(uCol * 1.3, col, show), mix(spark, a * 0.93, show) * uOn); }`;
/* a relief of light: one point a sample of the picture, standing out by its brightness; a plain background keyed away; a round edge */
const CLOUD_V = `uniform sampler2D map; uniform float uT, uMix, uPx, uKeyOn, uOn, uAsp, uShape; uniform vec3 uKey, uCol; attribute vec2 aUv; attribute float aR; varying vec3 vC; varying float vA; ${FX}
  void main(){ vec2 uv = aUv; uv.x += glitchAt(uv.y, uT) * 0.1; vec3 c = texture2D(map, uv).rgb; float lum = dot(c, vec3(0.3, 0.59, 0.11));
    float key = uKeyOn > 0.5 ? smoothstep(0.05, 0.2, distance(c, uKey)) : 1.0;
    vec2 q = aUv - 0.5, wh = vec2(min(1.0, uAsp), min(1.0, 1.0 / uAsp)) * ${SIZE.toFixed(2)};
    float e = max(abs(q.x), abs(q.y)) * 2.0, fade = 1.0 - smoothstep(0.84, 1.0, e);   // the whole frame kept, its edge soft: nothing cut away
    float show = smoothstep(0.0, 0.1, uMix * 1.3 - (1.0 - aUv.y) * 0.9 - aR * 0.3), sc = scanAt(aUv.y, uT);
    float z = (lum - 0.35) * 0.15 + 0.006 * sin(uT * 1.4 + aR * 40.0);
    if (uShape > 0.5) { float r = length(q) * 2.0; z = -(1.0 - min(r, 1.0)) * 0.75 + lum * 0.06; }   // a tunnel: the middle far away, each ring of the picture a step nearer
    vec3 p = vec3(q * wh, z + sc * 0.03);
    p.z += (1.0 - show) * (aR - 0.5) * 0.6; p.y += (1.0 - show) * (aR - 0.3) * 0.25;   // not yet made: scattered light drawing together
    vC = c * (0.92 + 0.08 * sin(aUv.y * 300.0 + uT * 6.0)) + uCol * sc * 0.9; vA = key * fade * smoothstep(0.04, 0.2, lum) * mix(0.25, 1.0, show) * uOn * (1.0 + sc * 0.6);   // a hologram is light: where the picture is black there is nothing, so a dark frame falls away
    vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = uPx * 8.5 / -mv.z; gl_Position = projectionMatrix * mv; }`;
const CLOUD_F = `uniform vec3 uCol; varying vec3 vC; varying float vA;
  void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5 || vA < 0.02) discard; gl_FragColor = vec4(vC * 1.12 + uCol * 0.06, vA * smoothstep(0.5, 0.15, d)); }`;
const CONE = `uniform float uT, uK; uniform vec3 uCol; varying vec2 vUv;
  void main(){ float a = pow(1.0 - vUv.y, 1.3) * (0.5 + 0.1 * sin(uT * 3.0 + vUv.x * 40.0)) * (0.7 + 0.3 * sin(vUv.x * 90.0)) * uK; gl_FragColor = vec4(uCol * a, a); }`;

export function holoHall({ THREE, group, P, R, DECK, hall, cat3d = null, film = false }) {
  const N = hall.pieces.length, LINE = ["#c38bff", "#7fe6ff"], stands = [], uT = { value: 0 }, uPx = { value: 1 };
  const std = (hex, rough, metal) => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal }), glow = (hex) => new THREE.MeshBasicMaterial({ color: hex, toneMapped: false, fog: false });
  const plinthG = new THREE.CylinderGeometry(0.46, 0.52, 0.14, 40), ringG = new THREE.TorusGeometry(0.47, 0.016, 6, 48).rotateX(Math.PI / 2), discG = new THREE.CircleGeometry(0.4, 40).rotateX(-Math.PI / 2);
  const coneG = new THREE.CylinderGeometry(0.66, 0.36, 1.95, 40, 1, true), sliceG = new THREE.PlaneGeometry(SIZE, SIZE), capG = new THREE.PlaneGeometry(1.06, 0.62), metal = std(0x0b0910, 0.25, 0.8);
  /* the relief's points, shared by every stand: a grid, each point its own small random */
  const cloudG = new THREE.BufferGeometry(); { const uv = new Float32Array(CLOUD * CLOUD * 2), rr = new Float32Array(CLOUD * CLOUD), pos = new Float32Array(CLOUD * CLOUD * 3); let z = 20261118;
    for (let j = 0; j < CLOUD; j++) for (let i = 0; i < CLOUD; i++) { const k = j * CLOUD + i; z = (z * 1664525 + 1013904223) >>> 0; uv.set([(i + 0.5) / CLOUD, (j + 0.5) / CLOUD], k * 2); rr[k] = z / 4294967296; }
    cloudG.setAttribute("position", new THREE.BufferAttribute(pos, 3)); cloudG.setAttribute("aUv", new THREE.BufferAttribute(uv, 2)); cloudG.setAttribute("aR", new THREE.BufferAttribute(rr, 1)); cloudG.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.2); }
  const caption = (st) => { const c = st.cap, g = c.getContext("2d"), w = c.width; g.clearRect(0, 0, w, c.height); g.textAlign = "center";
    const fit = (t, px, weight = "") => { let s = px; g.font = `${weight} ${s}px "Arial Rounded MT Bold", sans-serif`; while (g.measureText(t).width > w - 24 && s > 12) g.font = `${weight} ${(s -= 2)}px "Arial Rounded MT Bold", sans-serif`; };
    const sub = st.name ? st.title + " · " + st.line.split(" · ")[0] : st.line;
    g.fillStyle = "#ffd36e"; fit(st.name || st.title, 46, "bold"); g.fillText(st.name || st.title, w / 2, 50); g.fillStyle = "#e9f6ff"; fit(sub, 26); g.fillText(sub, w / 2, 90);
    if (st.seed) { g.fillStyle = st.col; g.font = '20px ui-monospace, Menlo, monospace'; const full = st.seed.slice(0, 10) + "…" + st.seed.slice(-4), nn = Math.min(full.length, Math.floor(st.typed));
      g.fillText("seed " + full.slice(0, nn) + (nn < full.length ? "█" : ""), w / 2, 128); if (nn < full.length) { st.capTex.needsUpdate = true; return; }   /* the seed types itself out first, then the traits */
      const tr = Object.entries(st.traits || {}).filter(([, v]) => v !== undefined && v !== null && v !== "" && String(v) !== "None").slice(0, 6);
      g.font = '21px "Arial Rounded MT Bold", sans-serif'; tr.forEach(([k, v], j) => { const x = j % 2 ? w * 0.75 : w * 0.25, y = 166 + Math.floor(j / 2) * 38, t = `${k}: ${v}`; g.fillStyle = "rgba(255,255,255,0.09)"; g.fillRect(x - w * 0.235, y - 24, w * 0.47, 32);
        g.fillStyle = "#fff7ef"; let s = t; while (g.measureText(s).width > w * 0.45 && s.length > 6) s = s.slice(0, -2); g.fillText(s === t ? t : s + "…", x, y); }); }
    st.capTex.needsUpdate = true; };
  const texOf = (img, w = 768) => { const c = Object.assign(document.createElement("canvas"), { width: w, height: w }), x = c.getContext("2d"), s = Math.min(w / img.width, w / img.height);   /* the whole piece, never cropped */
    x.drawImage(img, (w - img.width * s) / 2, (w - img.height * s) / 2, img.width * s, img.height * s); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { t, c }; };
  const keyOf = (c) => { const x = c.getContext("2d"), w = c.width, P4 = [[2, 2], [w - 14, 2], [2, w - 14], [w - 14, w - 14]].map(([a, b]) => { const d = x.getImageData(a, b, 12, 12).data; let r = 0, g = 0, bl = 0, n = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; } return n ? [r / n / 255, g / n / 255, bl / n / 255] : null; });
    if (P4.some((p) => !p)) return null; const m = [0, 1, 2].map((k) => P4.reduce((s, p) => s + p[k], 0) / 4); return P4.every((p) => Math.hypot(p[0] - m[0], p[1] - m[1], p[2] - m[2]) < 0.12) ? m : null; };   /* a plain background (all four corners one colour) is keyed away */

  hall.pieces.forEach(([file, title, line], i) => { const a = hall.a0 + (i + 0.5) * (hall.a1 - hall.a0) / N, g = new THREE.Group(), col = LINE[i % 2], C = new THREE.Color(col); g.position.copy(P(R, a, DECK)); g.rotation.y = -a; group.add(g);
    const pl = new THREE.Mesh(plinthG, metal); pl.position.y = 0.07; g.add(pl); const rg = new THREE.Mesh(ringG, glow(col)); rg.position.y = 0.145; g.add(rg);
    const dc = new THREE.Mesh(discG, new THREE.MeshBasicMaterial({ color: C.clone().multiplyScalar(0.55), toneMapped: false })); dc.position.y = 0.146; g.add(dc);
    const cone = new THREE.Mesh(coneG, new THREE.ShaderMaterial({ uniforms: { uT, uK: { value: 0.8 }, uCol: { value: C } }, vertexShader: VERT, fragmentShader: CONE, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); cone.position.y = 0.15 + 0.975; cone.renderOrder = 4; g.add(cone);
    /* motes rising in the beam */
    { const n = 46, pos = new Float32Array(n * 3), ph = new Float32Array(n); for (let k = 0; k < n; k++) { const a2 = k * 2.39996, r2 = 0.12 + 0.3 * ((k * 0.618) % 1); pos.set([Math.cos(a2) * r2, 0, Math.sin(a2) * r2], k * 3); ph[k] = (k * 0.137) % 1; }
      const mg = new THREE.BufferGeometry(); mg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); mg.setAttribute("ph", new THREE.BufferAttribute(ph, 1));
      const mm = new THREE.ShaderMaterial({ uniforms: { uT, uPx, uCol: { value: C } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: "uniform float uT, uPx; attribute float ph; varying float vA; void main(){ float k = fract(uT * 0.12 + ph); vec3 p = position * (1.0 + k * 0.7); p.y = 0.2 + k * 2.4; vA = sin(k * 3.14159) * 0.8; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = uPx * 5.0 / -mv.z; gl_Position = projectionMatrix * mv; }",
        fragmentShader: "uniform vec3 uCol; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uCol * 1.6, vA * smoothstep(0.5, 0.0, d)); }" });
      const motes = new THREE.Points(mg, mm); motes.frustumCulled = false; motes.renderOrder = 6; g.add(motes); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.008, 6, 64).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: C, toneMapped: false, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); ring.visible = false; g.add(ring);
    const piece = new THREE.Group(); piece.position.y = 1.86; g.add(piece); const tiltG = new THREE.Group(); tiltG.rotation.x = TILT[file] || 0; piece.add(tiltG);
    /* the slices (a backdrop plane far behind, then up to SLICES planes nearer and nearer) */
    const slices = []; for (let k = 0; k <= SLICES; k++) { const m = new THREE.ShaderMaterial({ uniforms: { map: { value: null }, uT, uMix: { value: 0 }, uBack: { value: k === 0 ? 1 : 0 }, uOn: { value: 1 }, uCol: { value: C } }, vertexShader: VERT, fragmentShader: SLICE, transparent: true, depthWrite: false, side: THREE.DoubleSide, extensions: { derivatives: true } });
      const s = new THREE.Mesh(sliceG, m); s.visible = false; s.renderOrder = 5 + k; tiltG.add(s); slices.push(s); }
    const cloud = new THREE.Points(cloudG, new THREE.ShaderMaterial({ uniforms: { map: { value: null }, uT, uMix: { value: 0 }, uPx, uKeyOn: { value: 0 }, uKey: { value: new THREE.Vector3() }, uOn: { value: 1 }, uAsp: { value: 1 }, uShape: { value: FILMS[file] || 0 }, uCol: { value: C } }, vertexShader: CLOUD_V, fragmentShader: CLOUD_F, transparent: true, depthWrite: false }));
    cloud.visible = false; cloud.renderOrder = 5; cloud.frustumCulled = false; tiltG.add(cloud);
    const cap = Object.assign(document.createElement("canvas"), { width: 512, height: 300 }), capTex = new THREE.CanvasTexture(cap); capTex.colorSpace = THREE.SRGBColorSpace; capTex.anisotropy = 4;
    const cm = new THREE.Mesh(capG, new THREE.MeshBasicMaterial({ map: capTex, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide })); cm.position.y = 0.94; cm.renderOrder = 5; g.add(cm);
    const st = { file, title, line, col, g, piece, slices, cloud, cap, capTex, ring, typed: 0, video: null, page: PAGES[file] || null, is3d: file === "09-prancer-3d", mix: 0, to: 0, n: 0, seed: null, traits: null, name: null, cat: null, fails: 0, texs: [] };
    st.relief = (img) => { for (const t of st.texs) t.dispose(); const { t, c } = texOf(img, 512); st.texs = [t]; const key = keyOf(c), u = cloud.material.uniforms; u.map.value = t; u.uKeyOn.value = key ? 1 : 0; if (key) u.uKey.value.set(...key);
      for (const s of slices) s.visible = false; cloud.visible = true; st.n = 0; st.mix = 0; st.to = 1; };
    st.layered = (imgs) => { for (const t of st.texs) t.dispose(); st.texs = []; cloud.visible = false;
      slices.forEach((s, k) => { const img = imgs[k]; s.visible = !!img; if (!img) return; const { t } = texOf(img); st.texs.push(t); s.material.uniforms.map.value = t; }); st.n = imgs.filter(Boolean).length - 1; st.mix = 0; st.to = 1; };
    const im = new Image(); im.onload = () => { if (!st.seed && !st.cat && !st.video) st.relief(im); }; im.src = `assets/hall/${file}.jpg`;
    if (file in FILMS) { const v = Object.assign(document.createElement("video"), { src: `assets/hall/${file}.mp4`, muted: true, loop: true, playsInline: true, preload: "auto", crossOrigin: "anonymous" });
      v.addEventListener("loadeddata", () => { const t = new THREE.VideoTexture(v); t.colorSpace = THREE.SRGBColorSpace; const u = cloud.material.uniforms; u.map.value = t; u.uKeyOn.value = 0; u.uAsp.value = v.videoWidth / v.videoHeight;
        for (const s2 of slices) s2.visible = false; cloud.visible = true; st.video = v; st.texs = [t]; st.to = 1; if (!film) v.play().catch(() => {}); }, { once: true }); v.load(); }   /* the chapter's own picture, as a relief, until a piece is made (and always, for a film or a one of one) */
    caption(st); stands.push(st); });

  /* one generator at a time, in a frame of this site off the screen: the chapter's own page with a seed, taken apart when it says it is ready */
  let frame = null, busy = false, turn = 0, nextAt = 0, n = 0;
  const seedOf = () => { let s = "oo"; if (film) { let z = (++n * 2654435761) >>> 0; for (let k = 0; k < 49; k++) { z = (z * 1664525 + 1013904223) >>> 0; s += "0123456789abcdef"[z >>> 28]; } } else for (let k = 0; k < 49; k++) s += "0123456789abcdef"[(Math.random() * 16) | 0]; return s; };
  const loadImg = async (markup) => { const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" })), img = new Image();
    try { await new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error("a slice would not load")); img.src = url; }); } finally { setTimeout(() => URL.revokeObjectURL(url), 2000); } return img; };
  /* an SVG piece in slices: its backdrop (the full-size rectangles it opens with), then the rest cut in the order it was drawn into slices of
     about equal weight, so the nearest slice is what was drawn last (the cat in front of its room, the rider over the road) */
  async function slicesOf(d) { const svg = d.querySelector("svg"), SK = /^(defs|style|title|desc|metadata|linearGradient|radialGradient|clipPath|mask|filter|pattern|symbol)$/i, box = svg.getBoundingClientRect(), A = box.width * box.height || 1;
    /* the drawing as a list of parts in the order drawn: a group that holds a large share of it is opened, so a piece drawn as one big group
       (a Pad's house) still comes apart into its walls, its furniture and its cats */
    const weight = (c) => 1 + c.querySelectorAll("*").length; let parts = [...svg.children].filter((c) => !SK.test(c.tagName));
    for (let pass = 0; pass < 3; pass++) { const total = parts.reduce((s, c) => s + weight(c), 0); parts = parts.flatMap((c) => (/^g$/i.test(c.tagName) && weight(c) > total * 0.3 && c.children.length > 1 && !c.getAttribute("clip-path") && !c.getAttribute("mask") ? [...c.children].filter((x) => !SK.test(x.tagName)) : [c])); }
    /* its backdrop: the parts it opens with that cover most of the frame (a sky, a wall, a floor), however they are drawn */
    const covers = (c) => { const r = c.getBoundingClientRect(); return (Math.min(r.right, box.right) - Math.max(r.left, box.left)) * (Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top)) / A > 0.6; };
    let b = 0; while (b < parts.length - 1 && covers(parts[b])) b++;
    const rest = parts.slice(b), wt = rest.map(weight), total = wt.reduce((s, x) => s + x, 0) || 1, bands = []; let acc = 0, cur = [];
    rest.forEach((c, k) => { cur.push(c); acc += wt[k]; if (acc >= total * (bands.length + 1) / SLICES && bands.length < SLICES - 1) { bands.push(cur); cur = []; } }); if (cur.length) bands.push(cur);
    const styles = [...d.querySelectorAll("style")].map((s) => s.textContent).join("\n");
    /* one slice: the whole drawing cloned with every part not in it hidden (its groups, transforms and references stay as they were) */
    const all = [...svg.querySelectorAll("*")], idx = new Map(all.map((x, k) => [x, k]));
    const draw = async (keep) => { const keepSet = new Set(), anc = new Set(); for (const p of keep) { keepSet.add(idx.get(p)); for (const x of p.querySelectorAll("*")) keepSet.add(idx.get(x)); for (let q = p.parentElement; q && q !== svg; q = q.parentElement) anc.add(idx.get(q)); }
      const c = svg.cloneNode(true), call = [...c.querySelectorAll("*")];
      call.forEach((x, k) => { if (keepSet.has(k) || anc.has(k)) return; let inSk = false; for (let q = all[k]; q && q !== svg; q = q.parentElement) if (SK.test(q.tagName)) inSk = true; if (inSk) return; if (!keepSet.has(k)) x.setAttribute("visibility", "hidden"); });
      for (const k of keepSet) if (call[k]) call[k].removeAttribute("visibility");
      for (const k of anc) if (call[k]) call[k].setAttribute("visibility", "visible");
      c.setAttribute("xmlns", "http://www.w3.org/2000/svg"); c.setAttribute("width", "768"); c.setAttribute("height", "768");
      if (styles) { const e = d.createElementNS("http://www.w3.org/2000/svg", "style"); e.textContent = styles; c.insertBefore(e, c.firstChild); } return loadImg(new XMLSerializer().serializeToString(c)); };
    const out = [b ? await draw(parts.slice(0, b)) : null]; for (const band of bands) out.push(await draw(band)); return out; }
  async function roll(st) { if (busy || !st.page || st.fails > 2) return false; busy = true; const seed = seedOf();
    try { if (!frame) { frame = document.createElement("iframe"); frame.setAttribute("aria-hidden", "true"); frame.tabIndex = -1; frame.style.cssText = "position:fixed;left:-3000px;top:0;width:640px;height:640px;border:0;opacity:0;pointer-events:none"; document.body.appendChild(frame); }
      /* ready: the page's own harness says so (_ready). Wild Ride's harness, as scuni sent it, keeps no such mark and no record of its traits: the
         piece has drawn by the time the page has loaded, so a moment after that will do, and its stand shows the seed alone */
      await new Promise((ok, no) => { const to = setTimeout(() => no(new Error("no answer")), 12000); frame.onload = () => { let k = 0; const poll = () => { try { const A = frame.contentWindow.$alea; if (A && (A._ready || k > 10)) { clearTimeout(to); ok(); return; } } catch (e) { clearTimeout(to); no(e); return; } if (++k < 70) setTimeout(poll, 150); }; poll(); }; frame.src = BASE + st.page + "?seed=" + seed; });
      await wait(450); const w = frame.contentWindow, d = frame.contentDocument;
      if (d.querySelector("svg")) st.layered(await slicesOf(d));
      else { const cv = [...d.querySelectorAll("canvas")].filter((c) => c.width > 64).sort((x, y) => y.width * y.height - x.width * x.height)[0]; if (!cv) throw new Error("nothing drawn");
        const img = new Image(); await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = cv.toDataURL("image/png"); }); st.relief(img); }
      st.seed = w.$alea.seed || seed; st.traits = w.$alea._features || {}; st.typed = 0; caption(st); return true;
    } catch (e) { st.fails++; if (LOCAL) console.warn("[hall]", st.file, e.message || e); return false; } finally { if (frame) { frame.onload = null; frame.src = "about:blank"; } busy = false; } }
  /* Prancer 3D: the cat itself, from a new seed, on the stand */
  const TR3 = ["LEGEND", "MYTH", "PATTERN", "OUTFIT", "HAT", "EYEWEAR", "NECK", "ROLE", "HELD"], box = new THREE.Box3(), V2 = new THREE.Vector2();
  function cat(st) { if (!cat3d) return false; try { const seed = seedOf(), made = cat3d(seed), root = made.cat.root, holder = new THREE.Group(); holder.add(root);
      made.cat.update({ t: 0, dt: 1 / 60, speed: 0, phase: 0, air: 0, vy: 0, land: 0, look: V2 }); holder.updateMatrixWorld(true); box.setFromObject(root); const k = 1.0 / Math.max(0.01, box.max.y - box.min.y); holder.scale.setScalar(k); holder.position.y = -(box.min.y + box.max.y) / 2 * k;
      /* (it floats in the beam where the other pieces hang, at their height, not standing on the plinth: Yoeshi, 2026-11-18, "the prancer 3D should still be above the beam and aligned with the other displays") */
      if (st.cat) st.piece.remove(st.cat.holder); st.piece.add(holder); for (const s2 of st.slices) s2.visible = false; st.cloud.visible = false; st.cat = { holder, av: made.cat, born: uT.value }; st.ring.visible = true; st.seed = seed; st.typed = 0; st.name = made.G.NAME || null;
      st.traits = Object.fromEntries(TR3.filter((k2) => made.G[k2] && made.G[k2] !== "None" && typeof made.G[k2] !== "object").map((k2) => [k2[0] + k2.slice(1).toLowerCase(), made.G[k2] === true ? "Yes" : made.G[k2]])); caption(st); return true;
    } catch (e) { st.fails = 9; if (LOCAL) console.warn("[hall] the cat", e.message || e); return false; } }
  const mid = P(R, (hall.a0 + hall.a1) / 2, DECK), gens = stands.filter((s) => s.page), three = stands.find((s) => s.is3d);
  let catAt = 0;
  return { stands,
    async roll(i) { const st = stands[i]; if (!st) return false; return st.is3d ? cat(st) : roll(st); },   /* (one stand made now: for a film of the hall) */
    async rollAll() { for (const st of gens) await roll(st); if (three) cat(three); for (const st of stands) { st.mix = 1; st.to = 1; st.typed = 99; caption(st); } },   /* (for a still: every stand made at once) */
    update(t, dt, me, px = 1) { uT.value = t; uPx.value = px;
      for (const [i, st] of stands.entries()) { st.piece.position.y = 1.86 + 0.018 * Math.sin(t * 1.1 + i * 1.7); st.piece.rotation.y = 0.16 * Math.sin(t * 0.37 + i);   /* it hangs in the light and turns a little, so its depth shows */
        if (st.mix < st.to) st.mix = Math.min(st.to, st.mix + dt / 1.8);
        if (st.seed && st.typed < 16) { const before = Math.floor(st.typed); st.typed += dt * 18; if (Math.floor(st.typed) !== before) caption(st); }
        if (st.ring.visible) { const k = (t * 0.35 + i * 0.3) % 1; st.ring.position.y = 1.32 + k * 1.08; st.ring.material.opacity = 0.85 * Math.sin(k * Math.PI); st.ring.scale.setScalar(0.9 + 0.2 * Math.sin(k * Math.PI)); }
        if (st.video && film && st.video.readyState >= 2) { const d = st.video.duration || 1, want = t % d; if (Math.abs(st.video.currentTime - want) > 0.02) st.video.currentTime = want; if (st.texs[0]) st.texs[0].needsUpdate = true; }   /* (a film steps the clock: the loop is sought to it, and the picture taken again) */
        st.cloud.material.uniforms.uMix.value = st.mix;
        const gap = 0.07 * (1 + 0.55 * Math.sin(t * 0.6 + i * 0.9)) * Math.min(1, st.mix * 1.5);   /* the slices drift apart and back together */
        st.slices.forEach((s, k) => { if (!s.visible) return; s.position.z = k === 0 ? -0.16 : (k - 1 - st.n / 2) * gap; s.material.uniforms.uMix.value = Math.min(1, Math.max(0, st.mix * 1.6 - k * 0.1)); });
        if (st.cat) { st.cat.holder.rotation.y += dt * 0.6; st.cat.av.update({ t, dt, speed: 0, phase: 0, air: 0, vy: 0, land: 0, look: V2 }); const b = Math.min(1, (t - st.cat.born) / 0.6); st.cat.holder.scale.y = st.cat.holder.scale.x * (0.2 + 0.8 * b * (2 - b)); } }
      const near = me && Math.hypot(me.x - mid.x, me.z - mid.z) < 15; if (!near || film) return;   /* nobody near: nothing runs (a film asks with roll and rollAll) */
      if (!busy && t > nextAt && gens.length) { const st = gens[turn++ % gens.length], first = turn <= gens.length; nextAt = t + (first ? 1.4 : 8); roll(st); }
      if (three && cat3d && t > catAt && three.fails < 9) { catAt = t + 16; cat(three); } } };
}
