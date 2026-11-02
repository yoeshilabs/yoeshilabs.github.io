/* Prancer Band: the performance, as a reusable piece. Given the song's map (stem envelopes, word times) and beat
   times, it says where every cat is in the beat and how its face and body move at any moment of the song.
     PERFORM.load(mapUrl, beatsUrl) -> Promise
     PERFORM.beat(ts)                -> fractional beat count at song time ts
     PERFORM.rig(role, ph, ts)       -> { rig, bob, sway } for a cat of that role (ph: the cat's own 0..1 offset)
   Roles: vocals (lip sync), choir (sings on the choruses), fan / fan1 / clap (the audience singing along), and every
   instrument (a nod on the beat, a sway every two bars). */
(function () {
"use strict";
const TAU = Math.PI * 2;
let MAP = null, B = null, mouthS = 0, lastTs = -1;
const CHORUS = [[54, 82], [119, 147], [184, 211]], inChorus = (ts) => CHORUS.some(([a, z]) => ts >= a && ts < z);
const env = (k, ts, lag = 0) => { const i = Math.round((ts - lag) * MAP.fps); return ((MAP.env[k] || [])[Math.max(0, i)] || 0) / 255; };
const wordAt = (ts) => { for (const w of MAP.words) if (ts >= w[0] - 0.04 && ts <= w[1] + 0.02) return w; return null; };
const sylls = (w) => Math.max(1, (w.toLowerCase().match(/[aeiouy]+/g) || []).length);
const roundOf = (w) => { w = w.toLowerCase(); return /oo|ou|ow|you|o$|u/.test(w) && !/ea|ee|i/.test(w) ? 0.8 : /o/.test(w) ? 0.4 : 0; };
const bump = (x) => Math.max(0, 1 - Math.abs(x));
function beat(ts) { if (ts <= B[0]) return (ts - B[0]) / (B[1] - B[0]); for (let i = 0; i < B.length - 1; i++) if (ts < B[i + 1]) return i + (ts - B[i]) / (B[i + 1] - B[i]);
  return B.length - 1 + (ts - B[B.length - 1]) / (B[B.length - 1] - B[B.length - 2]); }
/* the sung mouth: loudness of the vocal, chopped into the syllables of the word on the clock */
function voice(ts) { const v = env("vocals", ts), w = wordAt(ts); let open = 0, round = 0, held = 0;
  if (w && v > 0.08) { const ph = (ts - w[0]) / Math.max(0.08, w[1] - w[0]), n = sylls(w[2]); open = v * (0.35 + 0.65 * Math.abs(Math.sin(Math.PI * n * Math.min(1, ph)))); round = roundOf(w[2]); held = Math.min(1, Math.max(0, (w[1] - w[0] - 0.45) / 0.5)) * Math.min(1, ph * 2); }
  else if (v > 0.25) open = v * 0.6;
  return { v, w, open, round, held }; }
function rig(role, ph, ts) {
  const b = beat(ts), pulse = Math.exp(-((b % 1 + 1) % 1) * 5), half = Math.sin(TAU * b / 8), V = voice(ts), chorus = inChorus(ts);
  if (role === "vocals" || role === "singer") { if (ts !== lastTs) { mouthS += (Math.min(1.25, V.open * 1.35) - mouthS) * (V.open > mouthS ? 0.75 : 0.45); lastTs = ts; }
    const blink = bump(((ts * 0.31 + ph) % 3.7) / 0.09 - 1) * (V.held > 0.5 ? 0 : 1);
    return { rig: { mouth: mouthS, round: V.round, lid: Math.max(0.06, 1 - 0.9 * V.held) * (1 - 0.9 * blink), head: 3 + 10 * V.held + 4 * V.v, tilt: 6 * half - 4 * V.held, yaw: 0.35 * Math.sin(TAU * b / 16), smile: chorus && !V.w ? 0.6 : 0, gx: 0.2 * Math.sin(TAU * b / 16), gy: -0.15 * V.held },
      bob: (3 + 4 * V.v) * pulse, sway: 1.6 * Math.sin(TAU * (b / 4 + ph)) }; }
  if (role === "choir" || role === "fan" || role === "fan1" || role === "clap") {   // they sing along: a little behind the singer, softer
    const sing = role === "choir" ? (chorus ? 1 : 0) : (chorus ? 0.9 : 0.35), lag = 0.05 + ph * 0.12, Vl = voice(ts - lag), blink = bump(((ts * 0.27 + ph * 3) % 4.1) / 0.09 - 1);
    return { rig: { mouth: Math.min(1.1, Vl.open * 1.2 * sing), round: Vl.round, lid: (chorus ? 0.55 + 0.4 * (1 - Vl.held) : 0.85) * (1 - 0.9 * blink), head: -2 + 5 * pulse + 6 * Vl.held * sing, tilt: 6 * Math.sin(TAU * (b / 4 + ph)), smile: 0.4 * (1 - Vl.open) },
      bob: (role === "choir" ? 3 : 7) * Math.pow(Math.max(0, Math.sin(Math.PI * (((b + ph * 0.2) % 1 + 1) % 1))), 2), sway: 2.5 * Math.sin(TAU * (b / 4 + ph)) }; }
  const blink = bump(((ts * 0.31 + ph) % 3.7) / 0.09 - 1);
  return { rig: { head: -6 * pulse + 2, tilt: 4 * Math.sin(TAU * (b / 8 + ph)), lid: 0.72 * (1 - 0.9 * blink), ear: 6 * pulse, yaw: 0.25 * Math.sin(TAU * (b / 16 + ph)) }, bob: 4 * pulse, sway: 2.2 * Math.sin(TAU * (b / 4 + ph)) };
}
window.PERFORM = { load: (m, bt) => Promise.all([fetch(m).then((r) => r.json()), fetch(bt).then((r) => r.json())]).then(([a, c]) => { MAP = a; B = c.beats; }), beat, rig, env: (k, ts) => env(k, ts), inChorus };
})();
