import*as THREE from"three";import{mergeGeometries}from"../lib/jsm/utils/BufferGeometryUtils.js";const P={body:0,head:1,ear:2,earIn:3,eye:4,pupil:5,glint:6,arm:7,paw:8,tail:9,leg:10,phone:11,screen:12,shades:13,nose:14,muzzle:15};function fanGeometry(detail,far=false){const parts=[],s=n=>Math.max(4,Math.round(n*detail)),TINY=new Set([P.glint,P.nose,P.earIn,P.muzzle,P.pupil]);const add=(geo,part,grp,pivot,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1])=>{if(far&&TINY.has(part))return;const g2=(geo.index?geo:geo).clone();g2.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),new THREE.Vector3(...scale)));const n=g2.attributes.position.count;g2.setAttribute("part",new THREE.Float32BufferAttribute(new Float32Array(n).fill(part),1));g2.setAttribute("grp",new THREE.Float32BufferAttribute(new Float32Array(n).fill(grp),1));g2.setAttribute("pivot",new THREE.Float32BufferAttribute(new Float32Array(n*3).map((_,i)=>pivot[i%3]),3));if(!g2.attributes.uv)g2.setAttribute("uv",new THREE.Float32BufferAttribute(new Float32Array(n*2),2));parts.push(g2)};const sph=(r,w,h)=>new THREE.SphereGeometry(r,s(w),s(h)),cap=(r,l,a)=>new THREE.CapsuleGeometry(r,l,Math.max(2,s(4)),s(a)),O=[0,0,0];const NECK=[0,.5,0],SH=[[.16,.46,0],[-.16,.46,0]],TAIL=[0,.16,-.15];for(const x of[.08,-.08])add(cap(.07,.05,10),P.leg,0,O,[x,.07,.01]);add(sph(.2,18,14),P.body,0,O,[0,.31,0],O,[1.02,1.25,.92]);add(sph(.245,26,18),P.head,1,NECK,[0,.71,0],O,[1.12,.94,1]);for(const x of[1,-1]){add(new THREE.ConeGeometry(.09,.2,s(10)),P.ear,1,NECK,[.155*x,.915,-.02],[0,0,-.34*x]);add(new THREE.ConeGeometry(.056,.14,s(8)),P.earIn,1,NECK,[.152*x,.9,.012],[0,0,-.34*x]);add(sph(.056,12,8),P.muzzle,1,NECK,[.044*x,.645,.215],O,[1.1,.85,.9]);add(sph(.068,16,12),P.eye,1,NECK,[.098*x,.73,.185],O,[1,1.05,.62]);const[sx,sy,sz]=SH[x>0?0:1],grp=x>0?2:3;add(cap(.055,.24,10),P.arm,grp,SH[x>0?0:1],[sx+.012*x,sy-.155,sz]);add(sph(.066,12,8),P.paw,grp,SH[x>0?0:1],[sx+.014*x,sy-.305,sz+.012])}add(sph(.024,8,6),P.nose,1,NECK,[0,.68,.25],O,[1.2,.8,.8]);for(const x of[-1,1])add(sph(.083,14,10),P.shades,1,NECK,[.098*x,.735,.2],O,[1.08,.86,.5]);add(new THREE.BoxGeometry(.05,.014,.014),P.shades,1,NECK,[0,.755,.245]);add(cap(.04,.26,8),P.tail,4,TAIL,[0,.28,-.27],[-.65,0,0]);add(new THREE.BoxGeometry(.075,.13,.014),P.phone,3,SH[1],[-.174,.13,.05]);add(new THREE.BoxGeometry(.062,.112,.004),P.screen,3,SH[1],[-.174,.13,.058]);const g=mergeGeometries(parts.map(p=>p.index?p:p),false);parts.forEach(p=>p.dispose());return g}const SHADER_V=`
attribute float part, grp; attribute vec3 pivot; attribute vec4 iA, iB;
uniform float uT, uBeat, uHype, uSee; uniform vec3 uYou, uCam;
varying vec3 vLoc; varying float vPart; varying vec4 vA, vB; varying float vSee;
mat3 rX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
mat3 cR, cS; float cHide;
void fanPose() {
  float ph = iA.x, mode = iA.z, en = iA.w, beat = uBeat + ph * 0.08, hype = uHype, w = 6.2832;
  cR = mat3(1.0); cHide = 0.0;
  if (grp > 0.5 && grp < 1.5) cR = rY(sin(uT * 0.6 + ph * w) * 0.28) * rX(-0.1 * sin(w * beat) * en * (0.4 + hype));   // the head: looking round, nodding on the beat
  else if (grp > 1.5 && grp < 3.5) { float sd = grp < 2.5 ? 1.0 : -1.0;   // the arms (2: left, 3: right)
    float up = 0.15 + 0.08 * sin(uT * 1.7 + ph * w), spread = 0.12, yw = 0.0;
    /* raised arms open out to the sides (a V), so a paw never passes through the head: measured against the head's
       ellipsoid with the arm's and paw's thickness, the narrowest point of the wave still clears it */
    if (mode > 0.5 && mode < 1.5) { spread = mix(spread, 2.25 + 0.15 * sin(w * beat + sd + ph * w), hype); up = mix(up, 0.15, hype); }   // both up, waving in a V
    else if (mode > 1.5 && mode < 2.5) { if (sd < 0.0) { float k = smoothstep(0.1, 0.5, hype); up = mix(0.4, 2.0, k); spread = 0.0; yw = 0.55 * k; } }   // filming: the right paw out in front and to the side, the phone at eye level
    else if (mode > 2.5) { up = mix(up, 1.2, hype); spread = -0.18 + 0.16 * (0.5 + 0.5 * cos(w * beat * 2.0)); }   // clapping in front of the chest
    cR = rY(sd * yw) * rZ(sd * spread) * rX(-up); }
  else if (grp > 3.5) cR = rY(0.55 * sin(uT * 2.1 + ph * w)) * rX(0.15 * sin(uT * 1.3 + ph * 4.0));   // the tail
  cS = rY(0.13 * sin(uT * 1.25 + ph * w) * (0.4 + en * hype));   // the whole body sways
  if ((part > 10.5 && part < 12.5 && (mode < 1.5 || mode > 2.5)) || (part > 12.5 && part < 13.5 && iB.w < 1.5)) cHide = 1.0;   // the phone only when filming; shades only on some (iB.w: 1 a tee, 2 shades, 3 both)
}`;export const SHADER_F=`
uniform sampler2D uCoats; uniform float uT, uBeat, uHype;
varying vec3 vLoc; varying float vPart; varying vec4 vA, vB; varying float vSee;
float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
vec4 C(int k) { return texelFetch(uCoats, ivec2(k, int(vA.y + 0.5)), 0); }
vec3 coat(vec3 l, float part, out vec3 em) {
  vec4 body = C(0), mark = C(1), ptc = C(2), point = C(3), white = C(4), muz = C(5); em = vec3(0.0);
  float pat = body.a, wm = white.a; vec3 c = body.rgb; bool limb = part > 6.5 && part < 10.5 || part > 1.5 && part < 2.5, face = part > 0.5 && part < 1.5 && l.z > 0.12;
  float a = atan(l.x, l.z + 1e-5), n = vn(l * 9.0);   /* (atan of 0, 0 at a sphere's pole is undefined: it can be NaN) */
  float m = 0.0;   /* the markings, by family */
  if (pat > 0.5 && pat < 2.5 || pat > 11.5 && pat < 12.5 || pat > 18.5 && pat < 19.5 || pat > 10.5 && pat < 11.5) m = smoothstep(0.55, 0.7, 0.5 + 0.5 * sin((limb ? l.y * 42.0 : a * 7.0 + l.y * 9.0) + n * 3.0));   // stripes
  else if (pat > 2.5 && pat < 3.5 || pat > 12.5 && pat < 18.5 || pat > 6.5 && pat < 7.5) m = smoothstep(0.62, 0.72, vn(l * 26.0 + 3.0));   // spots and rosettes
  else if (pat > 3.5 && pat < 4.5) m = 0.35 * smoothstep(0.5, 0.9, vn(l * 60.0));   // ticked
  else if (pat > 4.5 && pat < 5.5) m = smoothstep(0.75, 0.95, abs(sin(vn(l * 5.0) * 9.0)));   // marbled
  else if (pat > 5.5 && pat < 6.5) m = smoothstep(0.3, 0.9, l.y + (l.z < 0.0 ? 0.3 : 0.0)) * 0.7;   // shaded
  else if (pat > 20.5) { float s = step(0.93, h31(floor(l * 60.0))); m = 0.35 * vn(l * 6.0); em = mark.rgb * (s * 1.6 + (pat > 21.5 && pat < 22.5 ? smoothstep(0.48, 0.5, vn(l * 14.0)) * 0.9 : 0.0)); }   // the spirits: stars, embers
  c = mix(c, mark.rgb, m * mark.a);
  if (ptc.a > 0.5) c = mix(c, ptc.rgb, smoothstep(0.48, 0.56, vn(l * 5.0 + 7.0)));   // tortie patches
  if (point.a > 0.5) c = mix(c, point.rgb, part > 1.5 && part < 2.5 || part > 7.5 && part < 8.5 || part > 8.5 && part < 9.5 ? 1.0 : face ? smoothstep(0.2, 0.05, length(vec2(l.x, l.y - 0.64))) : 0.0);   // colourpoint
  float wh = 0.0;   /* white spotting (Locket, Mitts, Tuxedo, Bicolor, Harlequin, Van) */
  bool paw = part > 7.5 && part < 8.5, chest = part < 0.5 && l.z > 0.08;
  if (wm > 0.5 && wm < 1.5) wh = chest && l.y > 0.35 && abs(l.x) < 0.07 ? 1.0 : 0.0;
  else if (wm > 1.5 && wm < 2.5) wh = paw ? 1.0 : 0.0;
  else if (wm > 2.5 && wm < 3.5 || wm > 7.5) wh = paw || (chest && abs(l.x) < 0.11) || part > 14.5 ? 1.0 : 0.0;
  else if (wm > 3.5 && wm < 4.5) wh = paw || chest || part > 9.5 && part < 10.5 || part > 14.5 || face && l.y < 0.66 ? 1.0 : 0.0;
  else if (wm > 4.5 && wm < 5.5) wh = 1.0 - smoothstep(0.55, 0.6, vn(l * 7.0 + 2.0));
  else if (wm > 5.5 && wm < 6.5) wh = part > 0.5 && part < 3.5 || part > 8.5 && part < 9.5 ? 0.0 : 1.0;
  else if (wm > 6.5 && wm < 7.5) wh = 1.0;
  c = mix(c, white.rgb, wh);
  if (part > 14.5 && wm < 0.5) c = muz.rgb;
  return c;
}
vec3 fanColour(out vec3 em) { float p = vPart; em = vec3(0.0); vec4 eyes = C(6), extra = C(7);
  if (p > 2.5 && p < 3.5) return extra.rgb;                                   // inside the ears
  if (p > 3.5 && p < 4.5) {   /* an eye, as the Prancers' are drawn: the iris lighter low down, a big round pupil, a dark rim,
       two catchlights (the light from the same side in both eyes), the upper lid in the coat's colour, a blink now and then */
    float sd = vLoc.x > 0.0 ? 1.0 : -1.0; vec2 q = (vLoc.xy - vec2(sd * 0.098, 0.73)) / 0.068; float r = length(q);
    vec3 iris = vLoc.x > 0.0 ? eyes.rgb : C(8).rgb, c = mix(iris * 1.3, iris * 0.65, smoothstep(-0.8, 0.8, q.y));
    c = mix(c, vec3(0.015), smoothstep(0.58, 0.5, length(q - vec2(0.0, -0.04)) - 0.06 * uHype));   // the pupil, wider when the room is loud
    c = mix(c, vec3(0.03, 0.02, 0.03), smoothstep(0.84, 0.95, r));
    float gl = smoothstep(0.25, 0.18, length(q - vec2(-0.3, 0.32))) + smoothstep(0.11, 0.07, length(q - vec2(0.24, -0.3)));
    c = mix(c, vec3(1.0), clamp(gl, 0.0, 1.0)); em = vec3(clamp(gl, 0.0, 1.0) * 0.7);
    float blink = step(fract(uT * 0.23 + vA.x * 7.0), 0.025), lid = mix(0.6, -1.2, blink);
    if (q.y > lid) { vec3 e2; c = coat(vec3(vLoc.x, vLoc.y + 0.02, vLoc.z), 1.0, e2) * 0.9; em = vec3(0.0); }
    return c; }
  if (p > 10.5 && p < 11.5) return vec3(0.03, 0.03, 0.035);
  if (p > 11.5 && p < 12.5) { em = vec3(0.75, 0.85, 1.0) * (1.2 + 0.8 * uHype); return vec3(0.0); }   // a phone screen, glowing
  if (p > 12.5 && p < 13.5) { vec2 q = (vLoc.xy - vec2(sign(vLoc.x) * 0.098, 0.735)) / 0.083;   // a dark lens, a sheen across it
    float sh = smoothstep(0.16, 0.0, abs(q.x + q.y * 0.9 + 0.25)) * step(length(q), 0.95); em = vec3(sh * 0.25); return mix(vec3(0.03, 0.03, 0.05), vec3(0.6), sh * 0.4); }
  if (p > 13.5 && p < 14.5) return C(9).rgb;
  float tee = mod(vB.w, 2.0) > 0.5 ? 1.0 : 0.0;   // a tee over the body and the tops of the arms
  if (tee > 0.5 && (p < 0.5 && vLoc.y > 0.14 || p > 6.5 && p < 7.5 && vLoc.y > 0.36)) return vB.rgb;
  return coat(vLoc, p, em);
}`;export function makeCrowd({scene,fans,stage,height=1.2,coats,quality="mid"}){const W=10,tex=new THREE.DataTexture(new Float32Array(W*coats.length*4),W,coats.length,THREE.RGBAFormat,THREE.FloatType);const PAT=["Solid","Mackerel","Classic","Spotted","Ticked","Marbled","Shaded","Rosetted","Tortie","Brindle","Colorpoint","Lynx Point","Stripes","Spots","Rosettes","Jaguar Rosettes","Freckles","Clouds","Chain","King","Plain","Constellations","Embers","Gilded","Circuits","Facets","Void"];const WH=["None","Locket","Mitts","Tuxedo","Bicolor","Harlequin","Van","Solid White","Blaze"];const col=(h,d="#888888")=>new THREE.Color(h&&/^#/.test(h)?h:d);coats.forEach((L,r)=>{const row=[[col(L.body),Math.max(0,PAT.indexOf(L.pattern))],[col(L.mark||L.body),L.mark?L.markO??1:0],[col(L.patch||L.body),L.patch?1:0],[col(L.point||L.body),L.point?1:0],[col(L.white,"#f4f6fb"),Math.max(0,WH.indexOf(L.whiteMode))],[col(L.muz||L.body),0],[col(L.eyes&&L.eyes[0],"#f6c52e"),0],[col(L.earIn,"#ff8fb3"),0],[col(L.eyes&&L.eyes[1],"#f6c52e"),0],[col(L.nose,"#ff8fb3"),0]];row.forEach(([c,a],k)=>tex.image.data.set([c.r,c.g,c.b,a],(r*W+k)*4))});tex.needsUpdate=true;const U={uT:{value:0},uBeat:{value:0},uHype:{value:0},uCoats:{value:tex},uSee:{value:0},uYou:{value:new THREE.Vector3},uCam:{value:new THREE.Vector3}};const mat=new THREE.MeshStandardMaterial({roughness:.78,metalness:0,envMapIntensity:.25});mat.onBeforeCompile=s=>{Object.assign(s.uniforms,U);s.vertexShader=s.vertexShader.replace("#include <common>","#include <common>\n"+SHADER_V).replace("#include <beginnormal_vertex>","#include <beginnormal_vertex>\n fanPose(); objectNormal = cS * (cR * objectNormal);").replace("#include <begin_vertex>",`#include <begin_vertex>
        vLoc = position; vPart = part; vA = iA; vB = iB;
        transformed = cS * (cR * (position - pivot) + pivot); transformed.y += abs(sin(3.1416 * (uBeat + iA.x * 0.08))) * 0.045 * iA.w * (0.25 + uHype);
        if (cHide > 0.5) transformed = pivot;
        /* a fan standing between the camera and you (the third person) is seen through, so your own cat stays in view */
        vSee = 0.0; if (uSee > 0.5) { vec2 fo = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz, a = uCam.xz, ab = uYou.xz - a;
          float tt = clamp(dot(fo - a, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0); float dc = length(fo - a); if (dc < 1.3) vSee = 2.0; else if ((tt > 0.02 && tt < 0.97 && length(a + ab * tt - fo) < 0.62) || dc < 1.8) vSee = 1.0; }`);s.fragmentShader=s.fragmentShader.replace("#include <common>","#include <common>\n"+SHADER_F).replace("#include <color_fragment>","#include <color_fragment>\n if (vSee > 1.5 ? (mod(floor(gl_FragCoord.x), 4.0) + mod(floor(gl_FragCoord.y), 4.0) > 0.0) : (vSee > 0.5 && mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y) * 2.0, 4.0) != 0.0)) discard;\n vec3 fanEm; diffuseColor.rgb = fanColour(fanEm) * 0.68;").replace("#include <emissivemap_fragment>","#include <emissivemap_fragment>\n totalEmissiveRadiance += fanEm;")};mat.customProgramCacheKey=()=>"crowd3d";const R=(z=>()=>(z=z*1664525+1013904223>>>0)/4294967296)(20261105),N=fans.length;const A=new Float32Array(N*4),Bt=new Float32Array(N*4),mats=[];const TEES=["#111114","#f1e9d6","#ff5fa8","#3fd6ff","#ffd36e","#7a1c2b","#2f6b4f","#b48cff","#e8e4dc","#ff8a3c"];fans.forEach((f,i)=>{const yaw=Math.atan2(stage.x-f.p.x,stage.z-f.p.z)+(R()-.5)*.3,s=height*f.s;mats.push(new THREE.Matrix4().compose(f.p,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(s,s,s)));const front=Math.max(0,1-f.row/10),r=R(),mode=r<.38+.2*front?1:r<.62+.1*front?2:r<.8?3:0;A.set([R(),Math.floor(R()*coats.length),mode,.35+.65*R()*(.6+.4*front)],i*4);const tee=R()<.55,shades=R()<.18,t=new THREE.Color(TEES[Math.floor(R()*TEES.length)]);Bt.set([t.r,t.g,t.b,(tee?1:0)+(shades?2:0)],i*4)});const lod=(detail,far2)=>{const geo=fanGeometry(detail,far2);geo.setAttribute("iA",new THREE.InstancedBufferAttribute(new Float32Array(N*4),4));geo.setAttribute("iB",new THREE.InstancedBufferAttribute(new Float32Array(N*4),4));const m=new THREE.InstancedMesh(geo,mat,N);m.frustumCulled=false;m.count=0;scene.add(m);return m};const near=lod(quality==="low"?.5:.72),far=lod(quality==="low"?.22:.26,true);let lastAt=new THREE.Vector3(1e9,0,0),NEAR=quality==="low"?6:9;function split(cam){const r2=NEAR**2;let a=0,b=0;const ia=near.geometry.attributes.iA,ib=near.geometry.attributes.iB,fa=far.geometry.attributes.iA,fb=far.geometry.attributes.iB;for(let i=0;i<N;i++){const p=fans[i].p,d=(p.x-cam.x)**2+(p.z-cam.z)**2,[m,k,X,Y]=d<r2?[near,a++,ia,ib]:[far,b++,fa,fb];m.setMatrixAt(k,mats[i]);X.array.set(A.subarray(i*4,i*4+4),k*4);Y.array.set(Bt.subarray(i*4,i*4+4),k*4)}near.count=a;far.count=b;for(const m of[near,far]){m.instanceMatrix.needsUpdate=true;m.geometry.attributes.iA.needsUpdate=m.geometry.attributes.iB.needsUpdate=true}}return{near,far,material:mat,uniforms:U,fans:{mats,A,Bt,n:N},tris:()=>({near:near.geometry.index.count/3,far:far.geometry.index.count/3,nearCount:near.count,reach:NEAR}),setReach(m){NEAR=m;lastAt.set(1e9,0,0)},reach:()=>NEAR,see(camPos,youPos){U.uSee.value=camPos?1:0;if(camPos){U.uCam.value.copy(camPos);U.uYou.value.copy(youPos)}},update(camera,t,beat,hype){U.uT.value=t;U.uBeat.value=(beat%1+1)%1;U.uHype.value+=(hype-U.uHype.value)*.05;if(camera.position.distanceToSquared(lastAt)>.25){lastAt.copy(camera.position);split(camera.position)}}}}
