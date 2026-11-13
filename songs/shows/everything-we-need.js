export const id="everything-we-need";export const beats=[.58,1.254,1.927,2.601,3.251,3.924,4.574,5.248,5.921,6.594,7.268,7.918,8.591,9.265,9.915,10.588,11.262,11.912,12.585,13.259,13.932,14.605,15.256,15.929,16.602,17.276,17.926,18.599,19.273,19.946,20.596,21.316,21.966,22.616,23.266,23.94,24.613,25.287,25.937,26.633,27.307,27.957,28.63,29.304,29.977,30.627,31.277,31.951,32.624,33.297,33.948,34.621,35.271,35.944,36.618,37.291,37.941,38.615,39.288,39.962,40.612,41.285,41.958,42.609,43.282,43.955,44.606,45.279,45.952,46.626,47.276,47.949,48.623,49.296,49.946,50.62,51.293,51.966,52.616,53.29,53.963,54.637,55.287,55.96,56.633,57.307,57.957,58.63,59.304,59.977,60.627,61.301,61.974,62.647,63.298,63.971,64.644,65.318,65.968,66.641,67.315,67.988,68.638,69.312,69.985,70.658,71.308,71.982,72.655,73.329,73.979,74.652,75.326,75.976,76.649,77.322,77.973,78.646,79.319,79.993,80.666,81.316,81.99,82.663,83.336,84.01,84.66,85.333,85.983,86.68,87.33,88.004,88.654,89.327,90.001,90.674,91.347,91.997,92.671,93.344,93.994,94.668,95.341,95.991,96.688,97.338,98.011,98.685,99.335,100.008,100.682,101.332,102.005,102.679,103.352,104.025,104.699,105.372,106.046,106.696,107.346,108.019,108.669,109.343,110.016,110.69,111.34,112.013,112.686,113.36,114.01,114.683,115.357,116.03,116.68,117.354,118.027,118.7,119.351,120.024,120.697,121.371,122.021,122.694,123.368,124.041,124.691,125.365,126.038,126.711,127.361,128.035,128.708,129.358,130.032,130.705,131.379,132.052,132.702,133.375,134.049,134.699,135.372,136.046,136.696,137.369,138.043,138.716,139.389,140.063,140.713,141.386,142.06,142.733,143.383,144.057,144.73,145.403,146.054,146.727,147.4,148.05,148.701,149.397,150.071,150.721,151.394,152.067,152.741,153.414,154.064,154.738,155.411,156.085,156.735,157.408,158.081,158.755,159.405,160.078,160.752,161.425,162.075,162.749,163.422,164.072,164.746,165.396,166.069,166.742,167.416,168.066,168.739,169.413,170.063,170.736,171.41,172.083,172.756,173.43,174.08,174.753,175.427,176.1,176.75,177.424,178.097,178.77,179.421,180.094,180.767,181.418,182.091,182.764,183.438,184.111,184.761,185.435,186.108,186.758,187.431,188.105,188.778,189.428,190.102,190.775,191.425];const MANTRAS=[21.48,25.06,31.78,34.98,53.18,57.44,89.34,91.94,106.8,109.92,115.5,122.88,125.7,131.36,138.76,142.04,147.2,154.78,157.84,163.46],TWELVE=MANTRAS.slice(-12),PER=.6734;const sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)},mix=(a,b,k)=>a+(b-a)*k;const env=(t,pts)=>{if(t<=pts[0][0])return pts[0][1];for(let i=1;i<pts.length;i++)if(t<pts[i][0])return mix(pts[i-1][1],pts[i][1],sm((t-pts[i-1][0])/(pts[i][0]-pts[i-1][0])));return pts[pts.length-1][1]};export const beatAt=t=>{const B=beats;if(t<=B[0])return(t-B[0])/PER;if(t>=B[B.length-1])return B.length-1+(t-B[B.length-1])/PER;let lo=0,hi=B.length-1;while(hi-lo>1){const m=lo+hi>>1;if(B[m]<=t)lo=m;else hi=m}return lo+(t-B[lo])/(B[lo+1]-B[lo])};export const pulse=t=>{let last=-99;for(const m of MANTRAS)if(m<=t)last=m;return Math.min(99,t-last)};const bays=t=>{let n=0;for(const m of TWELVE)n+=sm((t-m)/.7);return n*env(t,[[172,1],[189,0]])};export const mantras=MANTRAS,fireAt=t=>env(t,[[0,.14],[8,.3],[20,.5],[53,.6],[82,.75],[83.6,2],[86.2,1.9],[87.2,1.1],[90,.9],[105,.8],[123,1],[150,1.15],[157,.7],[170,.5],[188,.12],[198,.05]]);export const uniforms={uSt:0,uSBeat:0,uSFire:.5,uSCamp:1,uSRiver:.2,uSNight:0,uSMand:0,uSBays:0,uSHue:0,uSYin:0,uSPulse:99,uSWarp:0,uSStars:0,uSAur:0,uSSun:1,uSBlaze:0,uSRush:0,uSBass:0,uSLvl:0,uSDawn:0};export function at(t,hear={}){const c=v=>Math.max(0,Math.min(1,+v||0));return{uSt:t,uSBeat:beatAt(t),uSFire:fireAt(t),uSCamp:1,uSPulse:pulse(t),uSBays:bays(t),uSBass:c(hear.bass),uSLvl:c(hear.level),uSSun:env(t,[[0,1],[53,.4],[76,-.35]]),uSNight:env(t,[[48,0],[63,.4],[80,1],[172,1],[192,.2]]),uSStars:env(t,[[38,0],[53,.3],[78,1],[172,1],[188,0]]),uSBlaze:env(t,[[83,0],[84.2,1],[86.1,1],[87,0]]),uSRush:env(t,[[86.2,0],[86.9,1],[89,1],[91.5,.3],[98,0]]),uSRiver:env(t,[[0,.15],[53,.3],[80,.5],[87,1],[100,.6],[160,.5],[186,.2]]),uSYin:env(t,[[88.9,0],[91.2,1],[104,1],[107,.85],[157,.85],[174,0]]),uSMand:env(t,[[95,0],[100,1],[166,1],[188,0]]),uSAur:env(t,[[72,0],[79,.6],[83,0],[91,0],[97,.5],[123,1],[155,1],[170,.35],[183,0]]),uSWarp:env(t,[[89,0],[100,.25],[123,.45],[140,1],[152,1],[160,.2],[170,0]]),uSHue:env(t,[[100,0],[138,.1],[154,.5],[190,.5]]),uSDawn:env(t,[[170,0],[193,1]])}}export const glsl=`
uniform float uSt, uSBeat, uSFire, uSCamp, uSRiver, uSNight, uSMand, uSBays, uSHue, uSYin, uSPulse, uSWarp, uSStars, uSAur, uSSun, uSBlaze, uSRush, uSBass, uSLvl, uSDawn;
const float S_HZ = 3.1, S_TOP = 29.19, S_SUN = -1.5707963, S_TAU = 6.2831853;
float sH(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float sN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(sH(i), sH(i + vec3(1, 0, 0)), f.x), mix(sH(i + vec3(0, 1, 0)), sH(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(sH(i + vec3(0, 0, 1)), sH(i + vec3(1, 0, 1)), f.x), mix(sH(i + vec3(0, 1, 1)), sH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float sF(vec3 p) { float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * sN(p); p = p * 2.03 + vec3(17.1, 3.7, 9.2); a *= .5; } return v; }
float sF3(vec3 p) { float v = 0., a = .5; for (int i = 0; i < 3; i++) { v += a * sN(p); p = p * 2.07 + vec3(7.1, 13.7, 5.2); a *= .5; } return v; }
float sLn(float d, float w) { float ww = max(w, fwidth(d) * 1.4); return exp(-d * d / (ww * ww)) * min(1., w * 1.4 / ww); }
vec3 sRamp(float x) { x = clamp(x, 0., 1.5); return vec3(1.6, .34, .05) * smoothstep(0., .45, x) + vec3(.9, .62, .08) * smoothstep(.3, .85, x) + vec3(.6, .7, .9) * smoothstep(.8, 1.4, x); }   
vec3 sTurn(vec3 c, float h) { float a = h * S_TAU, cs = cos(a), sn = sin(a); vec3 k = vec3(.57735); return c * cs + cross(k, c) * sn + k * dot(k, c) * (1. - cs); }   

vec3 sSky(float e, float az, float th, float s) {
  float sun = .5 + .5 * az, glow = pow(sun, 3.);
  vec3 dusk = mix(mix(vec3(.95, .42, .5), vec3(1.25, .5, .22), glow), mix(vec3(.42, .2, .56), vec3(.62, .22, .5), sun), smoothstep(0., .34, e)); dusk = mix(dusk, vec3(.07, .05, .22), smoothstep(.3, 1., e));
  vec3 night = mix(vec3(.05, .07, .19), vec3(.006, .008, .035), smoothstep(0., .7, e)) + vec3(.2, .07, .12) * glow * exp(-e * 9.) * (1. - uSNight * .6);
  vec3 dawn = mix(mix(vec3(1.05, .62, .5), vec3(.5, .52, .85), smoothstep(0., .4, e)), vec3(.12, .16, .42), smoothstep(.3, 1., e));
  vec3 c = mix(mix(dusk, night, uSNight), dawn, uSDawn);
  
  vec3 q = vec3(cos(th) * 3.2, sin(th) * 3.2, s * .55); float cl = smoothstep(.5, .78, sF(q + vec3(uSt * .012, 0., uSt * .004))) * smoothstep(.02, .2, e) * smoothstep(.75, .3, e);
  c = mix(c, mix(mix(vec3(1.2, .55, .62), vec3(1.4, .7, .4), glow), vec3(.05, .05, .13), uSNight) + vec3(.9, .7, .8) * uSDawn * .5, cl * .8);
  return c; }
float sStars(vec3 d, float dens) { vec3 g = d * 150.; vec3 i = floor(g), f = fract(g) - .5; float h = sH(i); return step(1. - dens, h) * smoothstep(.42, .0, length(f)) * (.55 + .45 * sin(uSt * (1.5 + 5. * fract(h * 91.7)) + h * 40.)); }
vec3 showCol(vec3 vW, float th, float r, float s, float fl) {
  float t = uSt, beat = fract(uSBeat), thump = exp(-beat * 3.5);
  
  float wz = uSWarp * (sF3(vec3(cos(th) * 1.6, sin(th) * 1.6, s * .2 + t * .07)) - .5); th += wz * .5; float sw = s + wz * 2.4 * (1. - fl);
  float az = cos(th - S_SUN), bay = mod(floor(th / .5235988 + .5) + 15., 12.), bx = (fract(th / .5235988 + .5) - .5) * 2.;   
  
  float rho = fl > .5 ? r : 8.6 + s, ring = exp(-pow((rho - uSPulse * 9.) * .42, 2.)) * exp(-uSPulse * .55);
  vec3 col;
  if (fl > .5) {
    
    float ang = th + t * .05, flow = t * (.5 + 1.6 * uSRiver + 2.5 * uSRush);
    float n = sF(vec3(cos(ang) * (1.2 + r * .22), sin(ang) * (1.2 + r * .22), r * .55 - flow * .35)), n2 = sN(vec3(cos(ang * 2.) * r * .9, sin(ang * 2.) * r * .9, r * 1.7 - flow));
    float rip = sin(r * 3.4 - flow * 1.5 + n * 4.) * .5 + .5, crest = smoothstep(.72, 1., rip), glint = crest * smoothstep(.35, .8, n2);
    vec3 water = mix(vec3(.008, .022, .07), vec3(.02, .075, .17), n) * (1. - uSNight * .3) + sSky(.2, az, th, 4.) * (.05 + .06 * crest) * (1. - uSNight * .6);
    water += vec3(.3, .55, .85) * (crest * .1 + glint * (.12 + .4 * uSRiver + 1.0 * uSRush)) + vec3(.8, .95, 1.) * pow(n2, 5.) * uSRush * 1.6;
    
    float fk = .75 + .25 * sin(t * 9.1 + n * 6.) * sin(t * 5.3) + .35 * thump * uSBass; vec3 warm = vec3(1.1, .36, .07) * exp(-r * .42) * (.22 + uSFire * .42) * fk * (.7 + .6 * rip);
    col = water + warm;
    if (uSYin > .002) { float R = 8.2, a = -t * .22 - uSBeat * .05; vec2 p = mat2(cos(a), -sin(a), sin(a), cos(a)) * vW.xz; float d1 = length(p - vec2(0., R * .5)), d2 = length(p + vec2(0., R * .5)), yang = step(0., p.x);
      yang = mix(yang, 1., step(d1, R * .5)); yang = mix(yang, 0., step(d2, R * .5)); yang = mix(yang, 0., step(d1, R * .13)); yang = mix(yang, 1., step(d2, R * .13));
      float fn = sF(vec3(p * .7, t * .9) + vec3(0., -t * .6, 0.)), wn = sF(vec3(p * .8 + vec2(t * .5, 0.), t * .25));
      vec3 fireH = mix(vec3(.5, .05, .01), vec3(1.15, .5, .06), smoothstep(.25, .75, fn)) * (.6 + .25 * thump) + vec3(.5, .4, .15) * pow(fn, 5.) * 4., waterH = mix(vec3(.01, .05, .16), vec3(.1, .5, .85), wn) + vec3(.7, .9, 1.) * pow(wn, 4.) * 1.2;
      float edge = sLn(min(min(abs(d1 - R * .5) * step(p.x, 0.) + step(0., p.x) * 9., abs(d2 - R * .5) * step(0., p.x) + step(p.x, 0.) * 9.), min(abs(length(p) - R), min(abs(d1 - R * .13), abs(d2 - R * .13)))), .07);
      col = mix(col, mix(waterH, fireH, yang) * smoothstep(R + .2, R - .2, length(p)) + vec3(1., .9, .7) * edge * .9, uSYin * smoothstep(R + .4, R, length(p))); }
    
    if (uSCamp > .002) { float fr = r / (1.25 + .55 * uSFire), lick = sF(vec3(cos(th) * 2.4, sin(th) * 2.4, r * 1.7 - t * 2.4)), core = smoothstep(1., 0., fr + (lick - .5) * 1.1); vec3 cf = min(sRamp(core * 1.15 + .1 * thump), vec3(1.2)) * smoothstep(0., .3, core);
      col = mix(col, cf, clamp(core * 1.6, 0., 1.) * uSCamp) + vec3(1., .5, .12) * exp(-r * r * .9) * .35 * uSCamp; }
    col += (vec3(1., .8, .55) + sTurn(vec3(.6, .2, .2), uSHue)) * ring * .55;
  } else {
    float e = clamp((sw - S_HZ) / (S_TOP - S_HZ), 0., 1.), dome = smoothstep(8.3, 11., s);
    if (sw >= S_HZ) {
      col = sSky(e, az, th, sw);
      
      float sy = S_HZ + 1.9 * uSSun - .9, sd = length(vec2((th - S_SUN) * 13.6, sw - sy)); col += vec3(1.6, .75, .3) * (smoothstep(.95, .8, sd) + .5 * exp(-sd * .55)) * smoothstep(-.2, .5, uSSun) * (1. - uSNight);
      
      vec3 d = normalize(vec3(vW.x, max(vW.y - 2., 0.) * 1.4, vW.z)); float mw = exp(-pow(dot(d, normalize(vec3(.55, .25, -.8))) * 3.2, 2.));
      float st = sStars(d, .05 + .12 * mw) + .6 * sStars(d.zxy * 1.7, .04 + .1 * mw); vec3 neb = (vec3(.34, .3, .62) * sF(d * 5. + 3.) + vec3(.7, .32, .5) * pow(sF(d * 9.), 2.)) * mw;
      col += (vec3(1., .96, .9) * st * 1.5 + neb * .55) * uSStars * smoothstep(.02, .22, e);
      
      if (uSAur > .002) { float v = sin(th * 3. + sin(sw * .21 + t * .11) * 1.7 + t * .07), q = sw * .13 + v * .22 - t * .03, b = abs(fract(q) - .5) * 2., cur = exp(-b * b * 6.) * (.5 + .5 * sN(vec3(cos(th) * 14., sin(th) * 14., t * .4)));
        col += sTurn(mix(vec3(.1, .95, .5), vec3(.65, .2, .9), .5 + .5 * v), uSHue) * cur * uSAur * (.5 + .5 * uSLvl) * smoothstep(.05, .3, e) * .8; }
      
      if (uSMand > .002) { float m = (S_TOP - s) / 20.9, ph = abs(bx), rings = 2. + uSBays * .5, g = 0., hu = 0.;
        for (int i = 0; i < 8; i++) { float fi = float(i), on = smoothstep(fi - .2, fi + .8, rings); if (on < .01) break; float rr = .1 + fi * .105 + .012 * sin(t * .7 + fi) + .02 * thump * uSBass, pet = rr + .06 * (1. - ph * ph) * (mod(fi, 2.) < .5 ? 1. : -1.) * (1. + .35 * sin(t * .5 + fi * 1.3));
          float l = sLn((m - pet) * 20.9, .16) + .5 * sLn((m - rr) * 20.9, .07); g += l * on; hu += l * on * fi; }
        float spokes = sLn(ph * (m * 20.9 * .26) , .05) * smoothstep(.08, .2, m) * smoothstep(.1 + rings * .105, .1 + rings * .105 - .08, m);
        vec3 mc = sTurn(vec3(1., .5, .2), uSHue + m * .9 + (g > 0. ? hu / max(g, .001) * .07 : 0.)); col = mix(col, col * .55, uSMand * smoothstep(1., .5, m) * .5) + (mc * g + vec3(1., .85, .5) * spokes * .7) * uSMand * (.7 + .5 * uSLvl);
        col += vec3(1., .9, .7) * exp(-m * m * 260.) * uSMand * (1. + thump); }
    } else {
      
      float dep = (S_HZ - sw) / S_HZ, wob = (sN(vec3(cos(th) * 30., sin(th) * 30., sw * 5. + t * .8)) - .5) * (.05 + .25 * dep); float e2 = clamp((dep * 4.2 + wob * 3.) / (S_TOP - S_HZ) * 2.2, 0., 1.);
      col = sSky(e2, cos(th + wob * .4 - S_SUN), th + wob * .5, S_HZ + dep * 4.) * (.62 - .3 * dep);
      float gl = pow(sN(vec3(cos(th) * 60., sin(th) * 60., sw * 26. - t * 1.2)), 6.); col += (vec3(1.5, .7, .35) * (1. - uSNight) * pow(.5 + .5 * az, 6.) + vec3(.5, .6, .9) * uSStars * .4) * gl * 2.2;
      float sy = S_HZ + 1.9 * uSSun - .9, sdx = abs(th - S_SUN + wob * .35) * 13.6; col += vec3(1.5, .62, .25) * exp(-sdx * sdx * .9) * (.35 + .65 * gl * 3.) * smoothstep(-.2, .5, uSSun) * (1. - uSNight) * (1. - dep * .6);
    }
    
    float tn = th / S_TAU, hill = .25 + .55 * sN(vec3(cos(th) * 2.3, sin(th) * 2.3, 1.7)), tr = abs(fract(tn * 168.) - .5) * 2., th2 = sH(vec3(floor(tn * 168.), 3., 7.)), tree = hill + (1. - tr) * (.25 + .7 * th2) * .9, up = sw - S_HZ;
    float mask = up >= 0. ? smoothstep(tree + .04, tree - .04, up) : smoothstep(tree * .8 + .1, tree * .8 - .25, -up + (sN(vec3(cos(th) * 40., sin(th) * 40., sw * 9. + t)) - .5) * .5) * .8;
    col = mix(col, vec3(.012, .01, .03) + vec3(.05, .012, .03) * (1. - uSNight), mask);
    
    if (uSBays > .002) { float ord = bay < .5 ? 0. : (bay <= 6. ? 2. * bay - 1. : 2. * (12. - bay)), on = smoothstep(ord, ord + 1., uSBays), hu = bay / 12.; if (on > .003) { float arch = smoothstep(.97, .86, abs(bx)) * smoothstep(S_HZ - .1, S_HZ + .5, sw) * smoothstep(13.5, 8.6, sw + bx * bx * 1.5);   
        float rd = length(vec2(bx * 3.56, sw - 5.7)), inner = sLn(rd - 1.55 - .14 * thump * uSBass, .1) + .5 * sLn(rd - .78 - .1 * sin(t * .8 + bay), .06) + .35 * exp(-rd * rd * .9); vec3 bc = sTurn(vec3(.8, .14, .1), hu + uSHue);   
        float up = clamp((sw - S_HZ) / 6., 0., 1.); col = mix(col, col * .25 + bc * (.95 - .5 * up) * (.8 + .3 * thump * uSBass), arch * on * .92) + (bc * .8 + .3) * inner * arch * on * .55 + vec3(1., .95, .85) * sLn((abs(bx) - .9) * 3.4, .06) * on * smoothstep(S_HZ - .1, S_HZ + .5, sw) * smoothstep(9., 8.2, sw) * .6;
        if (sw < S_HZ) col += bc * on * exp(-pow(bx * 1.25 + (sN(vec3(th * 30., sw * 12., t * 1.5)) - .5) * .5, 2.)) * (.45 + .4 * sN(vec3(th * 9., sw * 22. - t * 2., 1.))) * 1.1; } }
    
    if (uSBlaze > .002) { float h = (sw - .2) / (4. + 20. * uSBlaze), fn = sF(vec3(cos(th) * 7., sin(th) * 7., sw * .55 - t * 2.6)), tongue = sF3(vec3(cos(th) * 19., sin(th) * 19., sw * 1.3 - t * 4.4));
      float f = clamp((fn * 1.45 + tongue * .5 - h * 1.15) * (1.2 + .5 * thump), 0., 1.5); vec3 fc = min(sRamp(f * 1.1), vec3(1.25)) * smoothstep(0., .25, f) * .8; col = mix(col, fc, clamp(f * 1.6, 0., 1.) * uSBlaze) + fc * .1 * uSBlaze; }
    
    if (uSRush > .002) { float fall = sF(vec3(cos(th) * 26., sin(th) * 26., sw * .33 + t * 3.2)), veil = sN(vec3(cos(th) * 70., sin(th) * 70., sw * .8 + t * 6.5)), body = smoothstep(.34, .7, fall) * (.55 + .45 * veil);
      vec3 wc = mix(vec3(.02, .16, .36), vec3(.55, .88, 1.05), body) + vec3(1.) * pow(veil, 6.) * .7; float mist = exp(-pow((sw - S_HZ) * .55, 2.)) * (.6 + .4 * sN(vec3(cos(th) * 9., sin(th) * 9., t * 1.3)));
      col = mix(col, wc, (.35 + .65 * body) * uSRush * smoothstep(S_TOP - 3., 14., sw + 0.)) + vec3(.8, .95, 1.) * mist * uSRush * .8; }
    col += (vec3(1., .78, .5) + sTurn(vec3(.7, .2, .25), uSHue)) * ring * .5;
    
    col += vec3(.5, .16, .04) * exp(-sw * .35) * (.2 + .5 * uSFire) * (.8 + .2 * sin(t * 7.3 + th * 3.));
  }
  return col * (.6 + .12 * uSLvl * uSMand); }
`;
