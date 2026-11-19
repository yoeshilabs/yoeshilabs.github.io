/* Guest artists on the Sphere's wall: another artist's piece (their code, or a still, a loop, a GIF) playing on the
   inner wall during a stretch of a song, credited on the wall itself.

   Booked by the show: window.__guests([{ slug, from, to, fit }]) with song times in seconds; each piece is read from
   guests/<slug>/dist/ (made by tools/guest.mjs build, from the files exactly as the artist sent them). One piece at a
   time: it fades in over the wall's own modes, which carry on beneath it, and fades out at the end of its stretch.
   Made for endless animation: a piece starts running a few seconds before its stretch (its pre-roll, 4 s unless the
   artist asks for more), so a piece that builds up from nothing is already alive when it fades in.

   Fits: sky       the whole Sphere: the piece as a dome master (its middle overhead, leaning toward the stage, its
                   edges down to the horizon all round), so any full-frame animation surrounds the crowd
         screen    a giant screen above the stage in the piece's own shape
         equirect  the whole sky from a 2:1 equirectangular frame, the stage at its centre (for 360 work)
         wrap      wrapped round the dome above the light bars, repeated to keep its shape
   While a guest is on, the singer's big picture makes way; the light bars, the beams and the band carry on (a booking
   may ask the wall's light bars down while its piece is on, bars: 0 to 1, for a piece that fills the whole sky).

   The credit: signed in lights along the dome's own curve, centred on the back of the Sphere over the walkway (clear of the band),
   "VISUALS BY", the artist's name, then the title and their handle; bright as the piece arrives and as it leaves,
   softer in between, there for the whole stretch like a signature. The show reads __guestNow(t) to credit them on
   screen too, with their link.

   Code pieces are sealed: a sandboxed frame of their own (scripts only: no same-origin, no network by a content policy
   set ahead of the piece, no storage, popups, forms, navigation, camera or microphone), fed only the song's clock and
   the band's levels, never anything about the show or who is watching it. All that comes back is a picture: an
   ImageBitmap, accepted only from that frame, only as the answer to a step the wall asked for, and only up to 2048 px.
   A piece that runs slow is drawn smaller (its frame shrunk to 75%, then 50%, which a piece that fits its window draws
   faster); one that stalls or is still too slow fades out, and the wall's own show carries on. No piece runs before the
   show says it is live (__guestOn): never at the doors, so never while a wallet is connected for the ticket. */
window.GUESTWALL = function (gl, U) {
"use strict";
const BASE = "../guests/", CSP = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; worker-src blob:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";
const FITS = { screen: 0, equirect: 1, wrap: 2, sky: 3 }, FADE = 1.5, PREROLL = 4, CREDIT_IN = 1.0, CREDIT_LEN = 6.5, MAXPX = 2048;
let BOOKED = [], MODE = "live", SONG = "internet-friend", SECTION = "", KIT = null, seq = 0, current = null, ON = false;   // ON: only once the show is live (past the doors and the wallet)

/* the two textures: the piece (unit 4) and its credit (unit 5) */
const tex = (unit) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0])); return t; };
const guestTex = tex(4), creditTex = tex(5); gl.uniform1i(U("GUEST"), 4); gl.uniform1i(U("CREDIT"), 5);
/* what the wall did with a guest's frames, for a check from the page (window.__guestDebug(): read only, nothing about a visitor) */
const DBG = { frames: 0, uploads: 0, uploadErr: "", glErr: 0, last: null, w: 0, h: 0, alphaZero: null, capMs: null, stepMs: null };
/* ?capfast=1 on the show's address (a test switch, 2026-11-19): the kit captures the piece's canvas as it is (premultiplied, no colour conversion, no
   resize at full size), which Chrome can do on the card; the kit's own time for the capture and for the piece's step come back in DBG (capMs, stepMs) */
const CAPFAST = (() => { let v = null; try { v = new URLSearchParams(parent.location.search).get("capfast"); } catch (e) {} if (v === "1") return true; if (v === "0") return false;
  return !/Firefox\//.test(navigator.userAgent); })();   // the default since the PC's table (2026-11-19: the capture from about 20 ms to 0.03 in Chrome and Edge, his piece drawn every frame); not yet in Firefox (one crash in two runs with it there, cause unknown)
const upload = (unit, t, src) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); } catch (e) { DBG.uploadErr = String(e && e.message || e).slice(0, 200); }
  const er = gl.getError(); if (er) DBG.glErr = er; if (unit === 4) { DBG.uploads++; DBG.w = src.width || src.videoWidth || 0; DBG.h = src.height || src.videoHeight || 0; } };

/* ------------------------------------------------------------------ the credit, drawn once per booking */
const CREDIT = Object.assign(document.createElement("canvas"), { width: 2048, height: 256 });
function drawCredit(c) { const x = CREDIT.getContext("2d"), cx = 1024; x.clearRect(0, 0, 2048, 256); x.textAlign = "center"; x.textBaseline = "middle";
  const line = (txt, font, fill, glow, y, sp = 0) => { if (!txt) return; x.font = font; if ("letterSpacing" in x) x.letterSpacing = sp + "px";
    x.shadowColor = "rgba(4, 2, 10, 0.9)"; x.shadowBlur = 26; x.fillStyle = "rgba(4, 2, 10, 0.75)"; for (let k = 0; k < 2; k++) x.fillText(txt, cx, y, 1960);   // the halo: dark, soft, only round the letters
    x.shadowColor = glow; x.shadowBlur = 16; x.fillStyle = fill; x.fillText(txt, cx, y, 1960); x.shadowBlur = 0; if ("letterSpacing" in x) x.letterSpacing = "0px"; };
  line((c.role || "VISUALS BY").toUpperCase(), "700 40px 'Avenir Next', 'Helvetica Neue', Arial, sans-serif", "#ffc27a", "rgba(255,140,40,0.9)", 36, 14);
  line(c.name, "900 104px 'Arial Rounded MT Bold', 'Arial Black', sans-serif", "#fff4e2", "rgba(255,150,60,0.95)", 122);
  line([c.title ? `\u201C${c.title}\u201D` : "", c.handle || ""].filter(Boolean).join("   \u00B7   "), "italic 600 48px 'Avenir Next', 'Helvetica Neue', Arial, sans-serif", "#efe2ff", "rgba(170,110,255,0.9)", 212);
  upload(5, creditTex, CREDIT); }

/* ------------------------------------------------------------------ loading a piece */
async function load(bk) {
  const g = bk.g = await (await fetch(`${BASE}${bk.slug}/dist/guest.json`)).json(), dir = `${BASE}${bk.slug}/dist/`;
  bk.fitName = bk.fitName || (typeof bk.fit === "string" ? bk.fit : "") || g.fit || "screen";   // (kept by name: a piece loaded again, after a restart or a set change, once read its own number as a name and came back as a flat band behind the stage: LoveFromGaia's test, 2026-11-19)
  bk.fit = FITS[bk.fitName] ?? 0; bk.asp = bk.fit === 1 ? 2 : bk.fit === 3 ? 1 : g.aspect || 1; bk.credit = { ...g.credit, ...(bk.credit || {}) };
  bk.pre = bk.pre ?? g.preroll ?? PREROLL; bk.scale = bk.startScale || 1;   // (a piece back after a slow spell starts at half size)
  const [w, h] = g.size || (bk.fit === 1 ? [2048, 1024] : bk.fit === 3 ? [1024, 1024] : bk.asp >= 1 ? [1024, Math.round(1024 / bk.asp)] : [Math.round(1024 * bk.asp), 1024]); bk.w = w; bk.h = h;
  if (g.kind === "image") { bk.img = new Image(); bk.img.src = dir + g.file; await bk.img.decode().catch(() => {}); bk.fresh = true; return; }
  if (g.kind === "video") { const v = bk.video = Object.assign(document.createElement("video"), { muted: true, loop: true, playsInline: true, preload: "auto", crossOrigin: "anonymous" });
    v.src = dir + g.file; await new Promise((r) => { v.onloadeddata = r; v.onerror = r; setTimeout(r, 8000); }); return; }
  /* code: the piece's page, the kit ahead of it, in a sealed frame */
  KIT = KIT || await (await fetch(`${BASE}kit/wall-kit.js`)).text();
  const page = await (await fetch(dir + g.file)).text(), files = g.files ? await (await fetch(dir + g.files)).json() : {};
  const cfg = { width: w, height: h, seed: g.seed || bk.slug, hash: g.hash || "", live: MODE === "live", ...(g.query ? { query: g.query } : {}), ...(g.keys ? { keys: g.keys } : {}) };
  const head = `<meta http-equiv="Content-Security-Policy" content="${CSP}"><meta http-equiv="x-dns-prefetch-control" content="off"><script>window.__WALL_CFG=${JSON.stringify(cfg)};window.__WALL_FILES=${JSON.stringify(files).replace(/</g, "\\u003c")};<\/script><script>${KIT}<\/script>`;
  const doc = /<!--WALL-->/.test(page) ? page.replace("<!--WALL-->", head) : /<head[^>]*>/i.test(page) ? page.replace(/<head[^>]*>/i, (m) => m + head) : `<!doctype html><html><head>${head}</head><body>${page}</body></html>`;
  const f = bk.frame = document.createElement("iframe");
  f.setAttribute("sandbox", "allow-scripts"); f.setAttribute("allow", "camera 'none'; microphone 'none'; geolocation 'none'; display-capture 'none'; usb 'none'; serial 'none'; bluetooth 'none'; payment 'none'; clipboard-read 'none'; clipboard-write 'none'");
  f.setAttribute("referrerpolicy", "no-referrer"); f.setAttribute("aria-hidden", "true"); f.tabIndex = -1;
  f.style.cssText = `position:fixed;left:0;top:0;width:${Math.round(w * bk.scale)}px;height:${Math.round(h * bk.scale)}px;border:0;opacity:1;z-index:-1;pointer-events:none;`;   // drawn, under the wall's own canvas: Chrome slows a frame it takes to be hidden (opacity 0), and his piece stood still until DevTools was opened
  const hello = new Promise((r) => { bk.hello = r; setTimeout(r, 10000); });
  f.srcdoc = doc; document.body.appendChild(f); await hello; }
function unload(bk) { if (bk.frame) bk.frame.remove(); if (bk.video) { bk.video.pause(); bk.video.removeAttribute("src"); bk.video.load(); } if (bk.bmp) bk.bmp.close();
  bk.frame = bk.video = bk.img = bk.bmp = null; bk.loading = null; bk.wait = null; }

/* the only messages taken: from a booked piece's own frame, a hello, an error (logged), or the frame it was asked for */
addEventListener("message", (e) => { const bk = BOOKED.find((b) => b.frame && e.source === b.frame.contentWindow); if (!bk || !e.data) return; const d = e.data;
  if (d.bmp && d.bmp.close && !(d.type === "wall:frame" && bk.wait && d.id === bk.wait.id)) d.bmp.close();   // a picture nobody asked for is let go at once
  if (d.type === "wall:hello") bk.hello && bk.hello();
  else if (d.type === "wall:error") { if ((bk.errs = (bk.errs || 0) + 1) <= 5) console.warn(`[guest ${bk.slug}]`, String(d.msg).slice(0, 300)); }
  else if (d.type === "wall:frame" && bk.wait && d.id === bk.wait.id) { const b = d.bmp, ok = b instanceof ImageBitmap && b.width <= (MODE === "film" ? 2 * MAXPX : MAXPX) && b.height <= (MODE === "film" ? 2 * MAXPX : MAXPX);   // a film may take a piece at twice the live show's size
    if (b && !ok && b.close) b.close(); bk.n = (bk.n || 0) + 1; const w = bk.wait; bk.wait = null; bk.ms = (bk.ms ?? 30) * 0.8 + (performance.now() - w.at) * 0.2;
    DBG.frames++; if (typeof d.cap === "number") DBG.capMs = DBG.capMs == null ? d.cap : DBG.capMs * 0.9 + d.cap * 0.1; if (typeof d.step === "number") DBG.stepMs = DBG.stepMs == null ? d.step : DBG.stepMs * 0.9 + d.step * 0.1; if (ok && DBG.alphaZero === null && b.width) { try { const c = new OffscreenCanvas(8, 8), x = c.getContext("2d"); x.drawImage(b, 0, 0, 8, 8); const px = x.getImageData(0, 0, 8, 8).data; let a = 0, rgb = 0; for (let i = 0; i < px.length; i += 4) { a += px[i + 3]; rgb += px[i] + px[i + 1] + px[i + 2]; } DBG.alphaZero = a === 0; DBG.rgbSum = rgb; } catch (e) { DBG.alphaZero = "?"; } }
    if (ok) { if (bk.bmp) bk.bmp.close(); bk.bmp = b; bk.fresh = true; } else DBG.rejected = (DBG.rejected || 0) + 1; w.done(); } });

/* one step of a code piece to song time ts: the clock and the band's levels in, a frame back */
function step(bk, ts, info) { if (!bk.frame || bk.wait) return bk.wait ? bk.wait.p : Promise.resolve();
  const id = ++seq; let done; const p = new Promise((r) => (done = r)); bk.wait = { id, at: performance.now(), done, p };
  bk.frame.contentWindow.postMessage({ type: "wall:step", id, live: MODE === "live", fast: CAPFAST, info: { ...info, ...(bk.sound === false ? { bands: null, feed: null } : {}), local: ts - bk.from, clock: Math.max(0, ts - (bk.from - bk.pre)), dur: bk.to - bk.from, t: ts } }, "*");   // sound: false books a piece without the song's three bands (to see what its sound feed does)
  return p; }

/* which booking shows at ts, and how far in or out it is (a piece let go mid-stretch fades out from its last frame);
   a piece runs from its pre-roll to the end of its stretch */
const pre = (b) => b.pre ?? b.preroll ?? PREROLL, running = (b, ts) => !b.dead && ts >= b.from - pre(b) && ts < b.to;
const active = (ts) => { let on = null; for (const b of BOOKED) if (ts >= b.from && ts < b.to && (!b.dead || ts - b.deadAt < FADE)) on = b; return on; };
const fadeOf = (b, ts) => Math.max(0, Math.min(1, (ts - b.from) / FADE, (b.to - ts) / FADE, b.dead ? 1 - (ts - b.deadAt) / FADE : 1));
/* a piece let go comes back (live only): a slow spell (a busy computer, a tab in the background) took his art off the wall for the rest of the
   song (Yoeshi, 2026-11-18: "it feels like LFG's generator is not up for a lot of the song and the equalizer bars are back"). It tries again
   12 s later at half size, up to three times; after that the wall carries on without it */
/* a piece that stopped answering is started again behind its last picture, which stays on the wall meanwhile */
function restart(b, ts) { console.warn(`[guest ${b.slug}] stopped answering: started again, its last picture on the wall meanwhile`); if (b.frame) b.frame.remove(); b.frame = null; b.wait = null; b.n = 0; b.ms = 30; b.bornAt = 0;
  b.loading = load(b).then(() => (b.ready = true)).catch((e) => { console.warn(`[guest ${b.slug}] did not load again:`, e.message); }); }
function kill(b, ts, why) { const again = MODE === "live" && (b.revives || 0) < 3 && ts < b.to - 18;
  console.warn(`[guest ${b.slug}] ${why}: ${again ? "the wall carries on and tries it again in a moment" : "the wall carries on without it"}`); b.dead = true; b.deadAt = ts; b.reviveAt = again ? ts + 12 : null;
  if (b.frame) b.frame.remove(); b.frame = null; b.wait = null; }
const creditOf = (b, ts) => { const k = (a, z) => (ts < a || ts > z ? 0 : Math.min(1, (ts - a) / 0.6, (z - ts) / 0.6)), len = b.to - b.from;   // bright on arriving and leaving, a signature's glow between
  return Math.max(0.55 * Math.min(1, (ts - b.from - CREDIT_IN) / 1.2), k(b.from + CREDIT_IN, b.from + CREDIT_IN + CREDIT_LEN), len > 2 * CREDIT_LEN + 6 ? k(b.to - CREDIT_LEN - 1, b.to - 1) : 0); };

/* keep pieces loaded near their stretch (a few seconds ahead), and let go of them after */
function keep(ts) { for (const b of BOOKED) { const near = ts >= b.from - pre(b) - 8 && ts < b.to + 2;
  if (b.dead && b.reviveAt != null && ts >= b.reviveAt) { b.dead = false; b.reviveAt = null; b.revives = (b.revives || 0) + 1; b.startScale = b.shrink === false ? 1 : 0.5; b.loading = null; b.ready = false; b.n = 0; b.ms = 30; b.bornAt = 0; console.info(`[guest ${b.slug}] back on the wall (try ${b.revives})`); }
  if (near && !b.loading && !b.dead) b.loading = load(b).then(() => (b.ready = true)).catch((e) => { console.warn(`[guest ${b.slug}] did not load:`, e.message); b.dead = true; b.deadAt = -1e9; });
  else if (!near && b.loading) { unload(b); b.ready = false; } } }

function info(ts, lv) { return { beat: lv.beat, bar: lv.beat / 4, phase: ((lv.beat % 1) + 1) % 1, kick: lv.kick, levels: lv.levels, energy: lv.energy, bands: lv.bands || null, feed: lv.feed || null, section: SECTION, song: SONG }; }

/* the frame's part: called by the wall's __frame with the song's levels; returns the uniforms' values */
/* live: each running piece stepped once a frame (every other frame while it is slow); a slow piece drawn smaller, then let go */
/* A slow piece is asked for fewer frames first (every 2nd, 3rd, then 4th of the show's): a painting that changes at 15 frames a second still
   reads as his, where a piece dropped leaves the wall's own bars for the rest of the song. A booking with shrink: false is never drawn
   smaller (a piece that sizes its own canvas from its window keeps painting at its old size in a smaller frame, and only a strip of it came
   through: Yoeshi, 2026-11-18, "errors on the screen"). Its first seconds (its shaders building) are not judged. Let go only when it stalls or
   is far too slow even then. */
function govern(b, ts, lv) { const now = performance.now(); if (!b.bornAt) b.bornAt = now; const young = now - b.bornAt < 6000;
  if (b.wait && now - b.wait.at > (young ? 8000 : 3000)) return restart(b, ts);   // (live, a piece is never let go: the show sheds its own load first, show3d.js)
  if (!young && b.n > 12 && b.ms > 45 && b.shrink !== false && b.scale > 0.5) { b.scale -= 0.25; b.n = 0; b.frame.style.width = `${Math.round(b.w * b.scale)}px`; b.frame.style.height = `${Math.round(b.h * b.scale)}px`; console.info(`[guest ${b.slug}] drawn at ${b.scale * 100}% to keep up`); }
  const every = young || b.ms <= 40 ? 1 : b.ms <= 90 ? 2 : b.ms <= 180 ? 3 : 4;
  if (every !== b.every) { if (every > 1 && every > (b.every || 1)) console.info(`[guest ${b.slug}] one frame in ${every} to keep up (${b.ms.toFixed(0)} ms a frame)`); b.every = every; }
  b.tick = (b.tick || 0) + 1;
  if (!b.wait && b.tick % every === 0) step(b, ts, { ...info(ts, lv), fade: ts >= b.from ? fadeOf(b, ts) : 0 }); }

function frame(ts, lv) { if (!ON) { DBG.last = { ts: +ts.toFixed(2), why: "guests off" }; for (const x of BOOKED) if (x.loading) { unload(x); x.ready = false; } return { mGuest: 0, mCredit: 0, yieldFace: 0 }; }
  keep(ts); if (MODE === "live") for (const x of BOOKED) if (x.ready && x.frame && running(x, ts)) govern(x, ts, lv);
  const b = active(ts);
  if (!b || !b.ready) { DBG.last = { ts: +ts.toFixed(2), why: !b ? "no booking on at this time" : "not ready", on: ON }; return { mGuest: 0, mCredit: 0, yieldFace: 0 }; }
  if (current !== b) { current = b; drawCredit(b.credit); if (b.bmp || b.img) b.fresh = true; else upload(4, guestTex, new ImageData(1, 1)); }
  const fade = fadeOf(b, ts), cr = creditOf(b, ts);
  if (b.video && b.video.readyState >= 2) { const d = b.video.duration || 1, want = (ts - b.from) % d;
    if (MODE === "live") { if (b.video.paused) b.video.play().catch(() => {}); if (Math.abs(b.video.currentTime - want) > 0.3) b.video.currentTime = want; }
    upload(4, guestTex, b.video); }
  else if (b.fresh) { upload(4, guestTex, b.bmp || b.img); b.fresh = false; }
  gl.uniform1f(U("GFIT"), b.fit); gl.uniform1f(U("GASP"), b.asp);
  DBG.last = { ts: +ts.toFixed(2), mGuest: +fade.toFixed(3), fit: b.fit, ready: !!b.ready, hasBmp: !!b.bmp };
  return { mGuest: fade, mCredit: cr * fade, yieldFace: fade, bars: b.bars ?? 1 }; }   // the singer's big picture makes way while a guest is on (half of him under a band of art reads as a mistake)

/* the film's part: everything at ts drawn and in hand before the wall draws (seeking a loop, stepping a piece) */
async function sync(ts, lv) { if (!ON) return; keep(ts);
  for (const b of BOOKED.filter((x) => running(x, ts))) { await b.loading; if (b.dead || !b.ready) continue;
    if (b.frame) { if (b.wait) await b.wait.p; await Promise.race([step(b, ts, { ...info(ts, lv), fade: ts >= b.from ? fadeOf(b, ts) : 0 }), new Promise((r) => setTimeout(r, 5000))]); }
    if (b.video && ts >= b.from) { const d = b.video.duration || 1; b.video.pause(); b.video.currentTime = (ts - b.from) % d; await new Promise((r) => { b.video.onseeked = r; setTimeout(r, 3000); }); } } }

return {
  book(list) { BOOKED.forEach(unload); current = null; BOOKED = (list || []).map((b) => ({ ...b })); return Promise.resolve(); },
  mode(m) { MODE = m; }, song(name) { SONG = name; }, section(s) { SECTION = s || ""; }, on(v) { ON = !!v; },
  now(ts) { const b = active(ts); return b && b.ready ? { ...b.credit, slug: b.slug, fade: fadeOf(b, ts) } : null; },
  debug() { return { ...DBG, booked: BOOKED.map((b) => ({ slug: b.slug, from: b.from, to: b.to, ready: !!b.ready, dead: !!b.dead, ms: b.ms && Math.round(b.ms), every: b.every, frame: !!b.frame })), on: ON, mode: MODE, maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE), renderer: (() => { const x = gl.getExtension("WEBGL_debug_renderer_info"); return x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : "?"; })() }; },
  load() { const b = current; return b && b.ready && !b.dead && b.frame ? { ms: b.ms ?? 0, every: b.every || 1, young: !b.bornAt || performance.now() - b.bornAt < 6000 } : null; },   /* how hard a running piece is working, for the show's own guard */
  get any() { return BOOKED.length > 0; },
  frame, sync };
};
