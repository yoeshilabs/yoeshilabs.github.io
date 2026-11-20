/* The Lounge floor for the Teia Winter Events curation (Yoeshi, 2026-11-20: "instead of the current floor projection, a generative visualizer
   using the teia logos (there are tons to choose from)"). Teia's rotating logos, the ones teia.art cycles through (each by the artist its file is
   named for), turn in rings round the dance floor, a great logo breathing at its heart and changing every few seconds, ripples running outward.
   When a work's theme is set the colours change ring by ring from the middle out.

   gem.js imports this through the gem file's paths (the room's code stays in prancer-3d; this file is the gem's own):
     makeFloor({ THREE, images, colors }) -> { texture, update(T, beat), setTheme(colors | null) }
   images: the logos as loaded images, white on clear. The texture is square and mapped in plan: its top toward the stage. */
export function makeFloor({ THREE, images, colors }) {
  const N = 1024, C = N / 2, TAU = Math.PI * 2, cv = document.createElement("canvas"); cv.width = cv.height = N;
  const g = cv.getContext("2d"), texture = new THREE.CanvasTexture(cv); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; texture.center.set(0.5, 0.5);   /* the floor turns by the texture's own rotation, on the GPU: the canvas is redrawn only when a logo changes (Yoeshi, 2026-11-20: "the graphics move a bit too fast and the room feels heavy on my mac") */
  const L = (images || []).filter((im) => im && (im.naturalWidth || im.width));
  const ROOM = ["#140a26", "#fff6e8", "#ffd76a", "#a98bff"];   /* before any theme: the Lounge's own purple and gold */
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255); };
  const ok = (c) => Array.isArray(c) && c.length >= 2 && c.every((h) => /^#[0-9a-f]{6}$/i.test(h));
  /* a theme as a floor: its darkest colour (darkened further) for the ground, the rest for the logos */
  const pal = (c) => { const s = (ok(c) ? c : ROOM).slice().sort((a, b) => lum(a) - lum(b)), d = parseInt(s[0].slice(1), 16), k = lum(s[0]) > 60 ? 0.25 : 0.6;
    const bg = `rgb(${Math.round((d >> 16) * k)},${Math.round(((d >> 8) & 255) * k)},${Math.round((d & 255) * k)})`; return { bg, ink: s.slice(1).reverse() }; };
  /* each logo tinted once per colour */
  const tint = new Map(), tinted = (i, col) => { const key = i + col; if (tint.has(key)) return tint.get(key); const im = L[i], w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, s = 256 / Math.max(w, h);
    const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s)); const x = c.getContext("2d"); x.drawImage(im, 0, 0, c.width, c.height); x.globalCompositeOperation = "source-in"; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); tint.set(key, c); return c; };
  /* the rings: radius (of the texture's half width), how many logos, which way they turn, how fast */
  const RINGS = [[0.3, 7, 1, 0.05], [0.44, 11, -1, 0.035], [0.58, 15, 1, 0.025], [0.72, 19, -1, 0.02], [0.86, 24, 1, 0.015]];
  let rnd = 9; const r = () => ((rnd = (rnd * 1664525 + 1013904223) >>> 0) / 4294967296);
  const seats = RINGS.map(([, n]) => Array.from({ length: n }, () => Math.floor(r() * Math.max(1, L.length))));
  let cur = pal(colors), prev = cur, t0 = -99, last = -1;
  const draw = (T) => {
    const wave = (T - t0) / 1.6;   /* the new colours run out from the middle over 1.6 s */
    const P = (rad) => (wave >= rad ? cur : prev);
    g.globalCompositeOperation = "source-over"; g.fillStyle = P(0).bg; g.fillRect(0, 0, N, N);
    if (wave < 1.2) { g.save(); g.beginPath(); g.arc(C, C, Math.max(0, wave) * C, 0, TAU); g.clip(); g.fillStyle = cur.bg; g.fillRect(0, 0, N, N); g.restore(); }
    /* a faint web of spokes and rings, as the dance floor's grid */
    g.strokeStyle = P(0.5).ink[2] || P(0.5).ink[0]; g.globalAlpha = 0.12; g.lineWidth = 2;
    for (const [rr] of RINGS) { g.beginPath(); g.arc(C, C, rr * C, 0, TAU); g.stroke(); }
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + T * 0.01; g.beginPath(); g.moveTo(C + 0.2 * C * Math.cos(a), C + 0.2 * C * Math.sin(a)); g.lineTo(C + C * Math.cos(a), C + C * Math.sin(a)); g.stroke(); }
    g.globalAlpha = 1;
    if (!L.length) { texture.needsUpdate = true; return; }
    /* ripples: a swell running outward every 4 s lifts the logos as it passes */
    const swell = () => 1;
    RINGS.forEach(([rad, n, dir, sp], k) => { const p = P(rad), col = p.ink[k % p.ink.length], h = C * rad * TAU / n * 0.32 * swell(rad);
      for (let i = 0; i < n; i++) { const a = i / n * TAU + dir * Math.floor(T / 2) * sp * 0.5, x = C + rad * C * Math.cos(a), y = C + rad * C * Math.sin(a);
        /* every 6 s a logo in each ring gives way to another */
        const swap = Math.floor(T / 10 + i * 0.37 + k), idx = (seats[k][i] + swap * 7) % L.length, im = tinted(idx, col), w = Math.min(h * im.width / im.height, C * rad * TAU / n * 0.92), hh = w * im.height / im.width;
        g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.globalAlpha = 0.9; g.drawImage(im, -w / 2, -hh / 2, w, hh); g.restore(); } });
    /* the heart: one logo, large, breathing, changing every 4 s with a crossfade, read from the stage side and turning slowly */
    const n = Math.floor(T / 8), f = (T / 8) % 1, k2 = Math.min(1, f / 0.15), p = P(0.1), rot = 0;
    for (const [i, a] of [[n - 1, 1 - k2], [n, k2]]) { if (a <= 0) continue; const im = tinted(((i * 13) % L.length + L.length) % L.length, p.ink[0]), w = C * 0.36, hh = Math.min(w * im.height / im.width, C * 0.3), ww = hh * im.width / im.height;
      g.save(); g.translate(C, C); g.rotate(rot); g.globalAlpha = a; g.drawImage(im, -ww / 2, -hh / 2, ww, hh); g.restore(); }
    g.globalAlpha = 1;
    /* the rim fades into the room's floor */
    const v = g.createRadialGradient(C, C, C * 0.82, C, C, C); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.55)"); g.fillStyle = v; g.fillRect(0, 0, N, N);
    texture.needsUpdate = true;
  };
  draw(0);
  return { texture,
    /* the canvas is redrawn twice a second, ten times a second only while the heart's logo or a theme is crossfading */
    update(T, beat) { texture.rotation = -T * 0.012; const fading = (T / 8) % 1 < 0.17 || T - t0 < 1.8; if (T - last < (fading ? 0.1 : 0.5)) return; last = T; draw(T); },
    setTheme(c) { const next = pal(c); if (next.bg === cur.bg && next.ink.join() === cur.ink.join()) return; prev = cur; cur = next; t0 = last < 0 ? 0 : last; } };
}
