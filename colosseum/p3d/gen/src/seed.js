/* Prancer 3D: a mint's genes from its seed, with no three.js (cat.js builds the cat from them).
     rollSeed(seed) -> G   (G.FEAT: the traits as Aleatory shows them)
   The harness is Aleatory's: xmur3 over the seed string, four words into sfc32. */
import { roll } from "./traits.js";

export function harness(seed) {
  let h = 1779033703 ^ seed.length; for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  const x = () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^= h >>> 16) >>> 0; };
  let a = x(), b = x(), c = x(), d = x();
  return () => { a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; let t = (a + b) | 0; a = b ^ b >>> 9; b = c + (c << 3) | 0; c = c << 21 | c >>> 11; d = d + 1 | 0; t = t + d | 0; c = c + t | 0; return (t >>> 0) / 4294967296; };
}
export const rollSeed = (seed) => roll(harness(seed));
