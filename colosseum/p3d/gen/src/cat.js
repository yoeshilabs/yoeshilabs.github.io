/* Prancer 3D: a mint's cat from its seed, exactly as the generator (piece.js) makes it. One function for the generator,
   the 3D show (walk in as your own mint) and the Lab (Make it 3D, src/glb.js): same seed, same cat.
     catFromSeed(seed, { mobile, shells, rand, instrument })  ->  { G, cat, inst, role, laser }
       seed:       the mint's Aleatory seed string ($alea.seed)
       mobile:     true for a phone (7 fur shells in place of 14); shells: set the count yourself
       rand:       the blink and glance stream (the generator passes its own; anything else may leave it out)
       instrument: false to build no instrument (a musician keeps its longer arms, so it still looks as minted)
       drape:      (av) => new Drape(av), from src/drape.js: capes and skirts as cloth the body moves; then call
                   cat.drape(dt, { t, wind }) each frame after cat.update() and whatever poses the cat. Left out, every
                   garment is as it was (the generator passes it; its skirts are cut a little differently for it)
       G: the rolled genes (G.FEAT: the traits as Aleatory shows them); cat: the Avatar (add cat.root to a scene, call
       cat.update(...) each frame; the hat and held thing ride on it); inst: the instrument or null; role: its part;
       laser: the laser-eye colour or null
     rollSeed(seed) -> G   (the genes only: seed.js, which needs no three.js) */
import { Avatar } from "../../src/avatar.js";
import { rollSeed } from "./seed.js";
export { harness, rollSeed } from "./seed.js";
import { addHat, addProp } from "../../src/wardrobe.js";
import { makeInstrument } from "../../src/instruments.js";

export const ROLES = { "Ruby Acoustic": "acoustic", "Nylon Guitar": "guitar", Ukulele: "ukulele", Violin: "violin", "Alto Sax": "sax", ...(globalThis.GEN_LAB ? { Flute: "flute" } : {}) };
export const LASERS = { Blue: "#3fa9ff", Red: "#ff2a3c", Green: "#3fff6a", Gold: "#ffcf3a" };

/* a musician plays from a loop of its own: strums, long notes, short phrases, at its temperament's tempo (no song in the generator; the motion is the music's) */
export function jam(bpm) { const beat = 60 / bpm, bar = beat * 4, P = { acoustic: [], guitar: [], violin: [], sax: [] }, chords = [], roots = [52, 47, 49, 45];
  for (let b = 0; b < 400; b++) { const root = roots[b % 4], t0 = 1 + b * bar; chords.push({ root, tones: [root, root + 4, root + 7, root + 11], sec: "verse" });
    for (const s of [0, 6, 8, 12, 14]) { const e = { t: t0 + s * beat / 4, d: beat * 0.6, n: [root, root + 7, root + 12], dir: s % 4 === 2 ? "u" : "d", v: 0.5 }; P.acoustic.push(e); P.guitar.push(e); }
    P.violin.push({ t: t0, d: bar * 0.95, n: root + 24, v: 0.5 }); if (b % 2 === 0) for (const s of [0, 3, 6, 10]) P.sax.push({ t: t0 + s * beat / 2, d: beat * 0.45, n: root + 19 + (s % 5), v: 0.6 });
    if (globalThis.GEN_LAB) for (const s of [0, 2, 3, 5, 6]) (P.flute || (P.flute = [])).push({ t: t0 + s * beat / 2, d: beat * 0.42, n: root + 24 + (s * 2) % 7, v: 0.6 }); }
  return { lead: 1, beat, bar, bars: 400, chords, parts: P }; }

/* the cat from its genes, as minted: its avatar, hat, held thing, laser eyes' glow and instrument */
export function buildCat(G, { mobile = false, shells, rand, instrument = true, drape = null } = {}) {
  const role = ROLES[G.INSTR] || null;
  const cat = new Avatar(G, { sig: [G.EYEWEAR, G.EARRING].filter((x) => x && x !== "None"), shells: shells || (mobile ? 7 : 14), rand, armK: role ? 1.45 : 1, drape });
  if (G.HAT !== "None") addHat(cat, G.HAT, [G.C1, G.C2]);
  if (G.HOLD !== "None") addProp(cat, G.HOLD, { col: G.PLC });   /* (a Star Monk's blade takes its colour) */
  const laser = LASERS[G.LASER] || null; if (laser) for (const e of cat.eyes) { e.userData.u.uIris.value.set(laser); e.userData.u.uGlow.value = 1; }   /* laser eyes glow in their colour, even in the cover */
  const inst = role && instrument ? makeInstrument(role, cat, jam(84 + ({ Playful: 20, Goofy: 16, Sleepy: -14, Zen: -12 }[G.TEMP] || 0))) : null;
  if (inst && inst.group) inst.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { cat, inst, role, laser };
}
export function catFromSeed(seed, opts = {}) { const G = rollSeed(seed); return { G, ...buildCat(G, opts) }; }
