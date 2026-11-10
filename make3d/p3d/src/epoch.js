/* Prancer 3D: while the arm solver runs (avatar.reach, avatar.settle) nothing it measures against moves, so each
   collision shape works out where it is once per solve instead of once per test (thousands of times a frame).
   on: inside a solve; n: which solve. Outside a solve every test measures afresh, as before. */
export const SDF = { n: 0, on: false };
