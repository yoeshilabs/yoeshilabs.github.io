import*as THREE from"three";export const PATTERNS=["Solid","Mackerel","Classic","Spotted","Ticked","Marbled","Shaded","Rosetted","Tortie","Brindle","Colorpoint","Lynx Point","Stripes","Spots","Rosettes","Jaguar Rosettes","Freckles","Clouds","Chain","King","Plain","Constellations","Embers","Gilded","Circuits","Facets","Void"];export const WHITES=["None","Locket","Mitts","Tuxedo","Bicolor","Harlequin","Van","Solid White","Blaze"];export const PART={torso:0,head:1,ear:2,upper:3,lower:4,paw:5,tail:6,muzzle:7,lid:8};export const NOISE=`
float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
vec3 h33(vec3 p) { return vec3(h31(p), h31(p + 17.1), h31(p + 41.7)); }
float vnoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
vec2 worley(vec3 p) { vec3 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec3 g = vec3(x, y, z), o = h33(i + g); float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; } return vec2(d1, d2); }
`;export const COAT=`
uniform vec3 uBody, uMark, uPatch, uPoint, uWhite, uMuz, uRim, uEmis, uEar;
uniform float uMarkO, uHasMark, uHasPatch, uHasPoint, uRimK, uFurLen, uShells, uAlong, uTime, uNeon;
uniform int uPat, uWhiteMode, uPart;
uniform vec4 uCheek;   // the Portraits' Cheeks: x 1 blush, 2 freckles; y the cheek's centre across, z its height (on the head)
varying vec3 vCat, vLoc, vBase; varying float vShell;
${NOISE}
float band(float x, float w) { return smoothstep(w, 0.0, abs(x)); }
/* a tabby's head: the M on the brow, thin lines back over the crown, two lines out across each cheek; -1 elsewhere */
float headLines(vec3 l, float n) {
  float brow = step(0.32, l.y) * step(abs(l.x), 0.42) * step(0.15, l.z), crown = step(0.2, l.y) * step(l.z, 0.35);
  float cheek = step(0.62, abs(l.x)) * step(-0.38, l.y) * step(l.y, 0.02) * step(0.0, l.z);
  float v = -1.0;
  if (brow > 0.5) v = sin(l.x * 26.0 + n * 1.5);
  else if (crown > 0.5) v = sin(l.x * 13.0 + n * 2.0) * 0.98;
  else if (cheek > 0.5) v = sin((l.y + 0.18 * abs(l.x)) * 30.0 + n);
  return v; }
/* where the tabby, wild and spirit marks fall, 0..1, in the cat's rest space p (feet at y 0, facing +z) */
float marks(vec3 p, vec3 l) {
  bool limb = uPart == 3 || uPart == 4 || uPart == 5 || uPart == 6; float n = fbm(p * 1.7);
  float ang = atan(p.x, p.z), ring = sin(l.y * 15.0 + n * 2.0);
  if (uPat == 1 || uPat == 11 || uPat == 12) {   // mackerel, lynx point, tiger: narrow stripes round the body, rings on legs and tail, lines on the brow
    float w = uPart == 1 ? 0.2 : uPat == 12 ? 0.42 : 0.3, f = limb ? ring : uPart == 1 ? headLines(l, n) : sin(ang * (uPat == 12 ? 7.0 : 8.0) + p.y * 1.5 + n * 3.0);
    return smoothstep(1.0 - w - 0.12, 1.0 - w, f * 0.5 + 0.5) * (uPat == 12 ? step(0.32, vnoise(p * 3.0)) : 1.0); }
  if (uPat == 2) {   // classic: bullseyes on the flanks, a stripe down the spine
    float d = length(vec2(p.y - 1.45, p.z + 0.05)) * 1.0; float f = limb ? ring : uPart == 1 ? sin(l.x * 14.0 + n * 2.0) * step(0.25, l.y) : sin(d * 15.0 + n * 2.5);
    float spine = band(p.x, 0.08) * step(p.z, -0.2) * step(0.9, p.y);
    return max(smoothstep(0.35, 0.55, f * 0.5 + 0.5), spine); }
  if (uPat == 3 || uPat == 13 || uPat == 16) { vec2 w = worley(p * (uPat == 16 ? 9.0 : 5.0)); return smoothstep(uPat == 16 ? 0.24 : 0.34, uPat == 16 ? 0.16 : 0.24, w.x); }   // spots, freckles
  if (uPat == 4) return smoothstep(0.55, 0.85, vnoise(p * 38.0)) * 0.55 + (limb ? 0.35 * smoothstep(0.6, 0.9, ring * 0.5 + 0.5) : 0.0);   // ticked: agouti grain
  if (uPat == 5) return smoothstep(0.75, 0.95, abs(sin(fbm(p * 1.3) * 9.0)));   // marbled
  if (uPat == 6) return smoothstep(-0.1, 0.6, (p.y - 1.4) * 0.6 - p.z * 0.9 + (uPart == 1 ? l.y * 0.6 : 0.0)) * 0.85;   // shaded: darker over the back and crown
  if (uPat == 7 || uPat == 14 || uPat == 15 || uPat == 18) {   // rosettes: broken rings, a darker centre for the jaguar, long links for the ocelot's chain
    vec3 q = uPat == 18 ? p * vec3(4.0, 7.0, 4.0) : p * 4.6; vec2 w = worley(q); float r = smoothstep(0.08, 0.0, abs(w.x - 0.3)) * step(0.35, vnoise(q * 2.3));
    return max(r, uPat == 15 ? smoothstep(0.12, 0.06, w.x) * 0.9 : 0.0); }
  if (uPat == 17) { vec2 w = worley(p * 2.6); return max(smoothstep(0.07, 0.0, w.y - w.x) * 1.0, smoothstep(0.5, 0.2, w.x) * 0.35); }   // clouds: big blotches, dark rims
  if (uPat == 19) { vec2 w = worley(p * 3.2); return max(smoothstep(0.32, 0.22, w.x), band(p.x, 0.07) * step(p.z, -0.2)); }   // king: blotches and a spine stripe
  return 0.0;
}
/* where white spotting falls */
float whiteMask(vec3 p, vec3 l) {
  bool paw = uPart == 5, lower = uPart == 4, muz = uPart == 7, front = p.z > 0.12;
  float face = uPart == 1 ? smoothstep(0.42, 0.2, length(vec2(l.x * 1.3, l.y + 0.35))) * step(0.2, l.z) : 0.0;
  if (uWhiteMode == 1) return uPart == 0 ? smoothstep(0.22, 0.14, length(vec3(p.x, p.y - 1.85, p.z - 0.45) * vec3(1.0, 0.8, 2.0))) : 0.0;   // locket
  if (uWhiteMode == 2) return paw ? 1.0 : 0.0;   // mitts
  ${globalThis.PRANCER_GEN?"":"if (uWhiteMode == 8 && uPart == 1 && l.z > 0.25) { float w = mix(0.06, 0.3, smoothstep(0.1, -0.42, l.y)), b = smoothstep(w + 0.05, w, abs(l.x)) * smoothstep(0.8, 0.62, l.y); if (b > 0.01) return b; }"}
  if (uWhiteMode == 3 || uWhiteMode == 8) return paw || muz ? 1.0 : lower ? step(0.5, uAlong) : uPart == 0 ? smoothstep(0.32, 0.2, abs(p.x)) * smoothstep(0.0, 0.2, p.z) * step(p.y, 2.05) : uPart == 1 ? face * 0.0 + smoothstep(0.25, 0.1, length(vec2(l.x, l.y + 0.55))) : 0.0;   // tuxedo
  if (uWhiteMode == 4) return paw || muz || lower ? 1.0 : uPart == 3 ? smoothstep(0.3, 0.7, uAlong) : uPart == 0 ? max(smoothstep(1.45, 1.1, p.y), smoothstep(0.35, 0.2, abs(p.x)) * smoothstep(0.0, 0.25, p.z)) : face;   // bicolor
  if (uWhiteMode == 5) { float v = uPart == 6 || uPart == 2 ? 0.0 : uPart == 1 ? step(l.y, 0.25) : 1.0; return uPart == 0 ? min(v, 1.0 - smoothstep(0.55, 0.6, fbm(p * 1.4 + 3.0))) : v; }   // harlequin: a van (colour on the crown, ears and tail) with a few patches on the body, as the Portraits draw it
  if (uWhiteMode == 6) return uPart == 6 ? 0.0 : uPart == 1 ? step(l.y, 0.25) + step(0.25, l.y) * step(0.55, abs(l.x)) * 0.0 : uPart == 2 ? 0.0 : 1.0;   // van: colour only on the crown and tail
  return 0.0;
}
/* where colourpoints darken: ears, face mask, paws, legs going down, the tail going out */
float pointMask(vec3 p, vec3 l) {
  if (uPart == 2 || uPart == 5) return 1.0; if (uPart == 6) return smoothstep(0.0, 0.6, uAlong); if (uPart == 4) return 0.55 + 0.45 * uAlong; if (uPart == 3) return 0.3 * uAlong;
  if (uPart == 7) return 0.9; if (uPart == 1) return smoothstep(0.75, 0.35, length(vec2(l.x * 1.05, l.y + 0.2))) * smoothstep(0.0, 0.5, l.z) * 0.95; return 0.0;
}
vec3 coat(out vec3 emis) {
  vec3 p = vCat, l = vLoc, c = uBody; emis = vec3(0.0);
  if (uPart == 7 && uWhiteMode == 0 && uHasPoint < 0.5) c = uMuz;
  if (uPat >= 21) {   // the spirits
    if (uPat == 21) { float s = step(0.985, h31(floor(p * 40.0))); vec3 neb = mix(vec3(0.18, 0.1, 0.42), vec3(0.08, 0.35, 0.6), fbm(p * 1.2));
      c = mix(uBody, neb, 0.7 * fbm(p * 2.0)); emis = vec3(s) * 2.0 + neb * 0.25; }
    else if (uPat == 22) { vec2 w = worley(p * 3.5); float cr = smoothstep(0.06, 0.0, w.y - w.x); emis = uMark * cr * (1.6 + 0.6 * sin(uTime * 3.0 + p.y * 4.0)); c = mix(uBody, uMark, cr * 0.5); }
    else if (uPat == 23) { float g = smoothstep(0.85, 0.95, abs(sin(fbm(p * 1.6) * 7.0))); c = mix(uBody, uMark, g); emis = uMark * g * 0.25; }
    else if (uPat == 24) { vec3 q = fract(p * 5.0) - 0.5; float ln = max(band(q.x, 0.035) * step(0.5, h31(floor(p * 5.0) + 3.0)), band(q.y, 0.035) * step(0.5, h31(floor(p * 5.0) + 9.0)));
      float pulse = 0.5 + 0.5 * sin(uTime * 4.0 - p.y * 6.0); emis = uMark * ln * (0.8 + 1.4 * pulse); c = mix(uBody, uMark, ln * 0.6); }
    else if (uPat == 25) { c = uBody * (0.75 + 0.5 * h31(floor(p * 6.0))); }
    else if (uPat == 26) { c = uBody; }
  } else {
    // the patches first, then the stripes over both colours, darker red within a patch, as a torbie's run (Yoeshi 2026-11-07: the patches had erased them)
    float t = 0.0; if (uHasPatch > 0.5) { t = uPat == 9 ? smoothstep(0.45, 0.6, fbm(p * 7.0)) : smoothstep(0.48, 0.56, fbm(p * 1.8 + 7.0)); c = mix(c, uPatch, t); }
    float m = uHasMark > 0.5 && uPart != 7 ? marks(p, l) * uMarkO : 0.0;   // no stripes on the muzzle
    if (uPat == 11 || uPat == 10) m *= pointMask(p, l);   // lynx points carry their stripes on the points only
    c = mix(c, mix(uMark, uPatch * 0.5, t), m); if (uNeon > 0.5) emis += uMark * m * 0.9;
    if (uHasPoint > 0.5) c = mix(c, uPoint, pointMask(p, l));
  }
  if (uWhiteMode > 0 && uWhiteMode != 7) c = mix(c, uWhite, clamp(whiteMask(p, l), 0.0, 1.0));
  if (uPart == 2 && (uWhiteMode == 5 || uWhiteMode == 6)) c = uEar;   /* a van's or harlequin's ears: the Portraits' ear colour, plain */
  if (uPart == 7 && (uWhiteMode == 3 || uWhiteMode == 4 || uWhiteMode == 6 || uWhiteMode == 8)) c = uWhite;
  /* cheeks, painted into the face's fur: a soft pink blush on each cheek; or freckles on the whisker pads either side of
     the nose, in the head's own colour darkened by 45% (as drawn in 2D; there the eyes are smaller, so they sat higher) */
  if (uPart == 1 && uCheek.x > 0.5 && uCheek.x < 1.5 && l.z > 0.25) c = mix(c, vec3(1.0, 0.42, 0.56), 0.6 * smoothstep(1.0, 0.2, length(vec2((abs(l.x) - uCheek.y) / 0.22, (l.y - uCheek.z) / 0.12))));
  if (uPart == 7 && uCheek.x > 1.5 && l.z > 0.02) { vec2 q = vec2(abs(l.x), l.y); float f = max(max(smoothstep(0.03, 0.019, length(q - vec2(0.075, 0.07))), smoothstep(0.03, 0.019, length(q - vec2(0.0, 0.115)))), smoothstep(0.03, 0.019, length(q - vec2(0.045, -0.005))));
    c = mix(c, uBody * 0.55, 0.85 * f); }
  return c;
}
`;const FUR_FRAG=`
if (vShell > 0.0) {   /* a shell: the vertex shader knows it is instanced, the fragment shader learns it from vShell */
  { vec3 q = vBase * 70.0; vec3 cell = floor(q), o = h33(cell) * 0.6 + 0.2; float d = length((fract(q) - o).xz + (fract(q) - o).y * 0.3);
    float len = 0.55 + 0.45 * h31(cell + 5.0); if (vShell > len || d > 0.55 * (1.0 - vShell / len) + 0.05) discard; }
}
`;export function coatMaterial(g,part,opts={}){const u={uBody:{value:new THREE.Color(g.body)},uMark:{value:new THREE.Color(g.mark||g.body)},uPatch:{value:new THREE.Color(g.patch||g.body)},uPoint:{value:new THREE.Color(g.point||g.body)},uWhite:{value:new THREE.Color(g.white)},uMuz:{value:new THREE.Color(g.muz||g.body)},uEar:{value:new THREE.Color(g.ear||g.body)},uRim:{value:new THREE.Color(g.rim)},uEmis:{value:new THREE.Color(0)},uMarkO:{value:g.markO},uHasMark:{value:g.mark?1:0},uHasPatch:{value:g.patch?1:0},uHasPoint:{value:g.point?1:0},uRimK:{value:g.rimK},uNeon:{value:g.neon?1:0},uFurLen:{value:opts.fur??g.furLen},uShells:{value:g.shells},uAlong:{value:opts.along??0},uTime:{value:0},uPat:{value:PATTERNS.indexOf(g.pattern)},uWhiteMode:{value:WHITES.indexOf(g.whiteMode)},uPart:{value:part},uRest:{value:new THREE.Matrix4},uDroop:{value:g.droop},uCovC:g.cov.c,uCovH:g.cov.h,uCovN:g.cov.n,uCheek:{value:new THREE.Vector4(g.cheeks||0,.6*(g.cw||1),-.2,0)},uGrip:{value:new THREE.Vector4(0,-.08,0,2.3)}};const mat=new THREE.MeshPhysicalMaterial({roughness:g.rough,metalness:g.metal,sheen:g.metal?0:.6,sheenRoughness:.6,sheenColor:new THREE.Color(g.body).lerp(new THREE.Color("#ffffff"),.5),iridescence:g.irid||0,transparent:!!g.ghost,opacity:g.ghost?.82:1,flatShading:!!g.facets});mat.userData.u=u;const B=!globalThis.PRANCER_GEN&&opts.batch;if(B)Object.assign(u,{uGripL:{value:new THREE.Vector4(0,-.08,0,2.3)},uGripR:{value:new THREE.Vector4(0,-.08,0,2.3)},uGripRL:{value:new THREE.Matrix3},uGripRR:{value:new THREE.Matrix3}});const cov=`float fl = FUR; for (int i = 0; i < 12; i++) { if (i >= uCovN) break; vec3 q = abs(vCat - uCovC[i].xyz) - uCovH[i]; fl = min(fl, length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - uCovC[i].w); }
      fl = max(fl, 0.004);   /* under a hat, round an eye: the fur lies pressed flat, as thick as the gap */`;mat.onBeforeCompile=s=>{Object.assign(s.uniforms,u);if(globalThis.PRANCER_GEN||!B)s.vertexShader=s.vertexShader.replace("#include <common>",`#include <common>
      uniform mat4 uRest; uniform float uFurLen, uShells, uDroop; varying vec3 vCat, vLoc, vBase; varying float vShell;
      uniform vec4 uCovC[12]; uniform vec3 uCovH[12]; uniform int uCovN; uniform vec4 uGrip;
      /* the paw closing (uGrip, avatar.grip): below y the toes swing toward the pad about a hinge at (y, z), the turn
         growing with the distance down the toe (x: per unit) up to w; th is the turn at this vertex (its normal turns with it) */
      vec3 gripBend(vec3 p, out float th) { th = 0.0; if (uGrip.x == 0.0 || p.y >= uGrip.y) return p; th = min((uGrip.y - p.y) * uGrip.x, uGrip.w);
        float s = sin(th), c = cos(th); vec2 q = vec2(p.y - uGrip.y, p.z - uGrip.z); return vec3(p.x, uGrip.y + q.x * c - q.y * s, uGrip.z + q.x * s + q.y * c); }`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>
      { float th; gripBend(position, th); float gs = sin(th), gc = cos(th); objectNormal.yz = vec2(objectNormal.y * gc - objectNormal.z * gs, objectNormal.y * gs + objectNormal.z * gc); }`).replace("#include <begin_vertex>",`#include <begin_vertex>
      { float th; transformed = gripBend(position, th); }
      vBase = position; vLoc = position; vCat = (uRest * vec4(position, 1.0)).xyz; vShell = 0.0;
      ${cov.replace("FUR","uFurLen")}
      #ifdef USE_INSTANCING
        vShell = (float(gl_InstanceID) + 1.0) / uShells; transformed += objectNormal * fl * vShell; transformed.y -= uDroop * fl * vShell * vShell;
      #endif`);else s.vertexShader=s.vertexShader.replace("#include <common>",`#include <common>
      attribute vec3 aRest, aLoc, aOff; attribute float aFur, aAlong, aPart, aGrip; varying float vFur, vAlong, vPart;
      uniform vec4 uGripL, uGripR; uniform mat3 uGripRL, uGripRR;
      vec3 gripBendB(vec3 p, vec4 G, out float th) { th = 0.0; if (G.x == 0.0 || p.y >= G.y) return p; th = min((G.y - p.y) * G.x, G.w);
        float s = sin(th), c = cos(th); vec2 q = vec2(p.y - G.y, p.z - G.z); return vec3(p.x, G.y + q.x * c - q.y * s, G.z + q.x * s + q.y * c); }
      uniform float uShells, uDroop; varying vec3 vCat, vLoc, vBase; varying float vShell;
      uniform vec4 uCovC[12]; uniform vec3 uCovH[12]; uniform int uCovN;`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>
      if (aGrip > 0.5) { vec4 G = aGrip < 1.5 ? uGripL : uGripR; mat3 R = aGrip < 1.5 ? uGripRL : uGripRR; float th; gripBendB(aLoc, G, th);
        vec3 nl = transpose(R) * objectNormal; float gs = sin(th), gc = cos(th); nl.yz = vec2(nl.y * gc - nl.z * gs, nl.y * gs + nl.z * gc); objectNormal = R * nl; }`).replace("#include <begin_vertex>",`#include <begin_vertex>
      if (aGrip > 0.5) { vec4 G = aGrip < 1.5 ? uGripL : uGripR; mat3 R = aGrip < 1.5 ? uGripRL : uGripRR; float th; transformed += R * (gripBendB(aLoc, G, th) - aLoc); }   /* a hand paw closing: bent in its own frame, carried into the coat's */
      vBase = aLoc; vLoc = aLoc; vCat = aRest; vFur = aFur; vAlong = aAlong; vPart = aPart; vShell = 0.0;
      ${cov.replace("FUR","aFur")}
      ${B==="shells"?"vShell = (float(gl_InstanceID) + 1.0) / uShells; transformed += aOff * fl * vShell; transformed.y -= uDroop * fl * vShell * vShell;":""}`);const C=globalThis.PRANCER_GEN||!B?COAT:COAT.replace("uRimK, uFurLen, uShells, uAlong, uTime","uRimK, uShells, uTime").replace("uniform int uPat, uWhiteMode, uPart;","uniform int uPat, uWhiteMode;\nvarying float vFur, vAlong, vPart;\n#define uFurLen vFur\n#define uAlong vAlong\n#define uPart int(vPart + 0.5)");s.fragmentShader=s.fragmentShader.replace("#include <common>",`#include <common>
${C}`).replace("#include <color_fragment>",`#include <color_fragment>
      ${FUR_FRAG}
      vec3 coatEmis; vec3 coatCol = coat(coatEmis); diffuseColor.rgb *= coatCol;
      if (vShell > 0.0) diffuseColor.rgb *= mix(0.62, 1.08, vShell);   /* darker at the roots, bright at the tips */
      else if (uFurLen > 0.0) diffuseColor.rgb *= 0.62;`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
      float fres = pow(max(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 0.0), 3.0);
      totalEmissiveRadiance += coatEmis + uRim * fres * uRimK;`)};mat.customProgramCacheKey=()=>globalThis.PRANCER_GEN?"coat":"coat"+(B||"");return mat}export function furry(geo,mat,shells){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;if(shells>0&&mat.userData.u.uFurLen.value>0){const s=new THREE.InstancedMesh(geo,mat,shells);s.frustumCulled=false;s.castShadow=false;s.receiveShadow=true;const I=new THREE.Matrix4;for(let i=0;i<shells;i++)s.setMatrixAt(i,I);m.add(s);m.userData.shells=s}return m}
