/* Prancer 3D: how finely the round parts are cut (1: as designed). A crowd scene (the Sphere's band) builds its cats at
   less detail; the generator never changes it. Counts of six or fewer (a tie's three sides) are kept. */
export let DETAIL = 1;
export const setDetail = (k) => { DETAIL = k; };
export const seg = (n) => (DETAIL === 1 || n <= 6 ? n : Math.max(6, Math.round(n * DETAIL)));
