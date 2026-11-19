/* The Sphere wall kit: runs inside a guest artist's piece, before any of the artist's own code, when the piece plays
   on the inner wall of The Purrancers' Sphere (dev/guest.js puts it there). The piece runs as it is, in a sealed frame:

   - its clock is the song's: requestAnimationFrame, setTimeout and setInterval, performance.now and Date.now all run on
     the show's time, so a filmed concert draws the piece exactly as the live one does, frame for frame;
   - Math.random is a seeded stream (the same piece draws the same way every show), and Aleatory's $alea and fxhash's
     $fx are there for pieces made for those platforms (a minted piece drops in unchanged);
   - each frame, the piece's canvas (the one it sets as wall.canvas, else its largest canvas, else its SVG) is copied
     and handed to the wall: nothing else ever leaves the frame;
   - it sees the music: window.wall carries the song's clock and the band's levels (see guests/README.md).

   The frame is sealed by the host (sandbox, no network, no storage, no access to the show or its visitors). This file
   only makes a piece feel at home inside it. */
(function () {
"use strict";
const CFG = window.__WALL_CFG || {}, FILES = window.__WALL_FILES || {}, HOST = window.parent, TICK = 1000 / 60, realNow = performance.now.bind(performance);
const W = CFG.width || 1024, H = CFG.height || 1024, EPOCH = Date.UTC(2026, 10, 3, 20, 0, 0);   // the clock starts at the band's debut

/* ------------------------------------------------------------------ the seeded stream (Aleatory's own: xmur3 -> sfc32) */
function xmur3(s) { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^= h >>> 16) >>> 0; }; }
function sfc32(a, b, c, d) { return () => { a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; let t = (a + b) | 0;
  a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11); d = (d + 1) | 0; t = (t + d) | 0; c = (c + t) | 0; return (t >>> 0) / 4294967296; }; }
const stream = (s) => { const h = xmur3(String(s)); return sfc32(h(), h(), h(), h()); };
const SEED = String(CFG.seed || "purrancers"), R = stream(SEED);
Math.random = stream(SEED + ":math");
/* crypto's random values are seeded too (a piece that seeds itself from them draws the same way every show) */
try { const C = stream(SEED + ":crypto"); Object.defineProperty(crypto, "getRandomValues", { configurable: true, value: (a) => { const b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); for (let i = 0; i < b.length; i++) b[i] = Math.floor(C() * 256); return a; } }); } catch (e) { /* leave it */ }
/* a piece that reads options from its own address (?q=2&seed=7) gets the ones its credit asks for (credit.json options):
   the sealed frame has no address of its own, so the piece's question about its address is answered here */
if (CFG.query) { const Real = window.URLSearchParams, mine = String(CFG.query).replace(/^\?/, "");
  const Wrapped = function (init) { return new Real(init === undefined || init === location.search ? mine : init); }; Wrapped.prototype = Real.prototype; window.URLSearchParams = Wrapped; }

/* ------------------------------------------------------------------ the show's clock */
let now = 0, lastCost = 0;   // ms since the piece began (its pre-roll, a few seconds before its stretch); what the last step really took
const raf = new Map(), timers = new Map(); let rafId = 0, timerId = 0;
window.requestAnimationFrame = (cb) => { const id = ++rafId; raf.set(id, cb); return id; };
window.cancelAnimationFrame = (id) => { raf.delete(id); };
window.setTimeout = (fn, ms, ...a) => { const id = ++timerId; if (typeof fn === "function") timers.set(id, { at: now + Math.max(0, +ms || 0), fn, a, every: 0 }); return id; };
window.setInterval = (fn, ms, ...a) => { const id = ++timerId, e = Math.max(4, +ms || 0); if (typeof fn === "function") timers.set(id, { at: now + e, fn, a, every: e }); return id; };
window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
try { performance.now = () => now; } catch (e) { Object.defineProperty(performance, "now", { value: () => now }); }
Date.now = () => EPOCH + Math.floor(now);
function runTimers() { for (let n = 0; n < 2000; n++) { let next = null;
    for (const [id, tm] of timers) if (tm.at <= now && (!next || tm.at < next[1].at)) next = [id, tm];
    if (!next) return; const [id, tm] = next; if (tm.every) tm.at += tm.every; else timers.delete(id);
    try { tm.fn(...tm.a); } catch (e) { report(e); } } }
/* (wall.firstFrame: the clock, in ms, at the first frame the piece drew. A piece that counts its own time from its first frame, as LoveFromGaia's v3 does for its
   moments of the song, runs that much behind the song: the wall reads this to know, and the show has the piece loaded and waiting before the song starts) */
function runFrames() { const cbs = [...raf.values()]; raf.clear(); if (cbs.length && wall.firstFrame == null) wall.firstFrame = now; for (const cb of cbs) { try { cb(now); } catch (e) { report(e); } } }

/* ------------------------------------------------------------------ what the piece can read: the music */
const wall = window.wall = { firstFrame: null,
  t: 0, local: 0, dur: 0, beat: 0, bar: 0, phase: 0, kick: 0, energy: 0, fade: 0, section: "", song: "",
  levels: { vocals: 0, drums: 0, bass: 0, other: 0, piano: 0, guitar: 0 },
  bands: null,   // { bass, mid, high }: the song's own sound in three bands, 0 to 1, where the song has them (tools/bands.py)
  feed: null,    // the wider feed (beat, beatPhase, barPhase, drums, percussion, synth, hit, riser, pulse, wave), where the song has it (tools/feed.py)
  width: W, height: H, live: !!CFG.live, seed: SEED, random: R, canvas: null,
  _on: [], on(fn) { this._on.push(fn); return this; },
};

/* ------------------------------------------------------------------ platforms a minted piece may expect */
if (!window.$alea) { const A = window.$alea = { seed: SEED, random: R, rand: R,
    randInt: (l, h) => l + Math.floor(R() * (h - l + 1)), randBetween: (l, h) => l + R() * (h - l), pick: (a) => a[Math.floor(R() * a.length)], chance: (p) => R() < p,
    params: {}, paramsSchema: [], param: (n, f) => f, features: (o) => { A._features = o; }, ready: () => { A._ready = true; } }; }
if (!window.$fx) { const FX = stream(SEED + ":fx"), hash = CFG.hash || ("oo" + Array.from({ length: 49 }, () => "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(FX() * 58)]).join("")), F = stream(hash);   // its own stream: $alea's draws stay exactly the piece's own
  window.$fx = { hash, rand: F, minter: CFG.minter || "", iteration: 1, context: "standalone", isPreview: false, params: () => {}, getParam: () => undefined,
    getParams: () => ({}), getRawParam: () => undefined, features: () => {}, getFeatures: () => ({}), preview: () => {}, on: () => () => {}, emit: () => {} };
  window.fxhash = hash; window.fxrand = F; }

/* ------------------------------------------------------------------ the piece's own files, from inside the frame */
const local = (u) => { if (typeof u !== "string" || /^(data:|blob:)/.test(u)) return null; const k = u.replace(/^\.?\//, "").split(/[?#]/)[0]; return FILES[k] || null; };
const realFetch = window.fetch && window.fetch.bind(window);
window.fetch = (u, o) => { const d = local(typeof u === "string" ? u : u && u.url); if (d && realFetch) return realFetch(d, o); return Promise.reject(new TypeError("the wall has no network: only the piece's own files")); };
const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
Object.defineProperty(HTMLImageElement.prototype, "src", { configurable: true, get() { return src.get.call(this); }, set(v) { src.set.call(this, local(v) || v); } });
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear(), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } }; };
for (const k of ["localStorage", "sessionStorage"]) { try { void window[k].length; } catch (e) { try { Object.defineProperty(window, k, { value: mem(), configurable: true }); } catch (e2) { /* leave it */ } } }

/* a piece with a mode behind a key (a test grid, another view) is given the keys its credit asks for, once, as it starts
   (credit.json keys: nobody can press a key on the wall) */
let keysDue = String(CFG.keys || "");
const pressKeys = () => { for (const ch of keysDue) { try { window.dispatchEvent(new KeyboardEvent("keydown", { key: ch, bubbles: true })); } catch (e) { report(e); } } keysDue = ""; };

/* ------------------------------------------------------------------ handing frames to the wall */
let errs = 0;
function report(e) { if (errs++ < 20) HOST.postMessage({ type: "wall:error", msg: String((e && e.message) || e).slice(0, 300) }, "*"); }
addEventListener("error", (e) => report(e.error || e.message));
addEventListener("unhandledrejection", (e) => report(e.reason));
function biggest() { let best = null, area = 0; for (const c of document.querySelectorAll("canvas")) { const a = c.width * c.height; if (a > area) { area = a; best = c; } } return best; }
let svgImg = null, svgBusy = false;
async function svgFrame(svg) {   // an SVG piece: drawn to a canvas through an image of its own markup
  const c = svgFrame.c || (svgFrame.c = Object.assign(document.createElement("canvas"), { width: W, height: H }));
  if (!svgBusy) { svgBusy = true; const im = new Image(), xml = new XMLSerializer().serializeToString(svg);
    await new Promise((r) => { im.onload = r; im.onerror = r; src.set.call(im, "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml)); }); svgImg = im; svgBusy = false; }
  const g = c.getContext("2d"); g.clearRect(0, 0, W, H); if (svgImg && svgImg.width) g.drawImage(svgImg, 0, 0, W, H); return c; }
async function capture() {
  let cv = wall.canvas || biggest();
  if (!cv || !cv.width) { const svg = document.querySelector("svg"); if (!svg) return null; cv = await svgFrame(svg); }
  const k = Math.min(1, cv.width / W);   // never upscaled: a piece drawn smaller to keep up hands over its own size
  try { return await createImageBitmap(cv, { resizeWidth: Math.max(1, Math.round(W * k)), resizeHeight: Math.max(1, Math.round(H * k)), resizeQuality: "medium", premultiplyAlpha: "none", colorSpaceConversion: "none" }); }
  catch (e) { report(e); return null; } }
addEventListener("message", async (e) => {
  if (e.source !== HOST || !e.data || e.data.type !== "wall:step") return;
  const m = e.data; Object.assign(wall, m.info); if (m.info.levels) wall.levels = m.info.levels;
  /* a piece made to hear sound in three bands through window.sphereAudio(bass, mid, high) (the convention of the first
     piece made for this Sphere, 2026-11-14) is fed the song's own, before every frame it draws */
  const audio = wall.bands && typeof window.sphereAudio === "function" ? () => { try { window.sphereAudio(wall.bands.bass, wall.bands.mid, wall.bands.high); } catch (er) { report(er); } } : null;
  /* a piece that hears more (window.sphereFeed: the beat, the kit, the congas, the synth and its notes, the build into a drop, a shape for its
     lines: LoveFromGaia's v2, 2026-11-16) is fed the song's own (src/perform.js PERFORM.feed, from tools/feed.py) in the same step */
  const more = wall.feed && typeof window.sphereFeed === "function" ? () => { try { window.sphereFeed(wall.feed); } catch (er) { report(er); } } : null;
  const feed = audio || more ? () => { if (audio) audio(); if (more) more(); } : null;
  const target = Math.max(0, (m.info.clock ?? m.info.local) * 1000), c0 = realNow();
  wall.width = innerWidth; wall.height = innerHeight; if (keysDue) pressKeys();
  if (target > now) {   // the piece's clock only runs forward; a step back (a film's retake) shows the last frame again
    const ticks = Math.min(m.live ? (lastCost > 12 ? 1 : 2) : 8, Math.max(1, Math.round((target - now) / TICK)));   // live, a heavy piece draws once a frame
    for (let k = 1; k <= ticks; k++) { now = k === ticks ? target : now + (target - now) / (ticks - k + 1); runTimers(); if (feed) feed(); for (const fn of wall._on) { try { fn(wall); } catch (er) { report(er); } } runFrames(); } }
  lastCost = realNow() - c0; const bmp = await capture();
  HOST.postMessage({ type: "wall:frame", id: m.id, bmp }, "*", bmp ? [bmp] : []);
});
addEventListener("load", () => HOST.postMessage({ type: "wall:hello" }, "*"));
})();
