/* The Purrancers, live in the Sphere: the concert film's venue as a place you can walk through, in real time.
   Everything runs on the song's clock (the audio element), so the band, the wall, the lights and the confetti stay in
   sync with the music, the same way the film was made:
     the venue    assets/sphere.glb, exported from the film's Blender scene (tools/blender/sphere3d.py EXPORT=...)
     the wall     the film's own wall page (dev/wall.html) in a hidden frame, drawn each frame and wrapped on the dome;
                  the singer on it is composed from the band video
     the band     assets/band.mp4: all eight players in one video, colour above and alpha below (tools/bandatlas.sh)
     the crowd    assets/fans.webp: every fan, front and back, 16 frames of dancing each (tools/fanatlas.py); a fan
                  shows its face when you stand on the stage side of it and its back otherwise
     the sound    assets/show-audio.m4a: the song with the crowd recordings under it
   Coordinates: the layout (assets/sphere.json) is in Blender's (x, y, z up); here y is up: (x, z, -y). */
import * as THREE from "three";
import { GLTFLoader } from "./lib/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "./lib/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "./lib/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./lib/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "./lib/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "./lib/jsm/environments/RoomEnvironment.js";
import { buildVenue, makePinFaces, floorAt, A_MAX } from "./venue.js";
import { createGame, COATS } from "./game.js";
import { loadTicket, checkTicket } from "./ticket.js";

const $ = (id) => document.getElementById(id);
const B = ([x, y, z]) => new THREE.Vector3(x, z, -y);
const STAGE = new THREE.Vector3(0, 1, 3);                                   // the stage's centre (Blender 0, -3, 1)
const CUES = [54.45, 119.68, 184.13];                                       // the confetti cannons, on each chorus drop
const FACEBOX = [0.2, 0.0, 0.6, 0.97];                                      // the singer's whole figure inside his card

/* ------------------------------------------------------------------ renderer, scene, you */
/* quality: phones start lighter; a governor below steps down further if frames run slow, and back up when there is room */
const PHONE = matchMedia("(pointer: coarse)").matches;
const Q = { dpr: PHONE ? 1.25 : Math.min(devicePixelRatio, 2), bloom: true, wallW: PHONE ? 1536 : 2048 };
const renderer = new THREE.WebGLRenderer({ canvas: $("view"), antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Q.dpr); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0410); scene.fog = new THREE.FogExp2(0x1a0d24, 0.011);
const cam = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 200); cam.rotation.order = "YXZ";
const me = { x: 0.6, z: -11, yaw: Math.PI, pitch: 0.06, eye: 1.3, moving: 0 };      // you start mid-floor, facing the stage
scene.add(new THREE.HemisphereLight(0xb9a0ff, 0x2a1020, 1.4));
const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;   // soft reflections on metal and gloss

/* the glow of a real show: lights, the wall, beams and signs bloom a little */
const composer = new EffectComposer(renderer); composer.setPixelRatio(Q.dpr); composer.setSize(innerWidth, innerHeight);   // (multisampled targets render black in some browsers: edges are smoothed in the materials instead)
composer.addPass(new RenderPass(scene, cam));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.35, 0.93); composer.addPass(bloom); composer.addPass(new OutputPass());
addEventListener("resize", () => { renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });

/* ------------------------------------------------------------------ the song's clock */
const audio = new Audio("assets/show-audio.m4a"); audio.preload = "auto";
const beats = (await (await fetch("data/beats.json")).json()).beats;
const beatAt = (t) => { if (t <= beats[0]) return (t - beats[0]) / (beats[1] - beats[0]); let lo = 0, hi = beats.length - 1;
  if (t >= beats[hi]) return hi + (t - beats[hi]) / (beats[hi] - beats[hi - 1]);
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (beats[m] <= t) lo = m; else hi = m; } return lo + (t - beats[lo]) / (beats[lo + 1] - beats[lo]); };
let live = false; const songTime = () => (live ? audio.currentTime : 0);

/* ------------------------------------------------------------------ the venue */
const lay = await (await fetch("assets/sphere.json")).json();
const wallFrame = $("wallframe"); wallFrame.src = `wall/wall.html?w=${Q.wallW}`;
await new Promise((r) => wallFrame.addEventListener("load", r, { once: true }));
const W = wallFrame.contentWindow; await W.__ready; await W.__title("../assets/purrancers-title.png");
const wallTex = new THREE.CanvasTexture(wallFrame.contentDocument.getElementById("c")); wallTex.colorSpace = THREE.SRGBColorSpace; wallTex.flipY = false;
const gltf = await new GLTFLoader().loadAsync("assets/sphere.glb");
gltf.scene.traverse((o) => { if (!o.isMesh) return;
  if (o.name.startsWith("dome")) o.material = new THREE.MeshBasicMaterial({ map: wallTex, side: THREE.DoubleSide, fog: false });
  else if (o.material.emissive && o.material.emissiveIntensity > 0 && o.material.emissive.getHex()) { o.material.toneMapped = false; o.material.emissiveIntensity *= 0.3; }   // the glow pass does the rest
  else if (o.material.isMeshStandardMaterial) { const n = o.material.name || "";                                  // gloss where a real venue has it
    o.material.envMapIntensity = o.material.metalness > 0.5 ? 0.35 : 0.05;
    if (/stage|riser/.test(n)) { o.material.roughness = 0.3; o.material.metalness = 0.1; o.material.envMapIntensity = 0.08; } } });
scene.add(gltf.scene);

/* the light: a few real spots on the band, and visible beams through the haze from every fixture */
for (const s of lay.spots.slice(0, 8)) { const l = new THREE.SpotLight(new THREE.Color(...s.rgb), 90, 0, THREE.MathUtils.degToRad(s.size) / 2, 0.4, 1.2);
  l.position.copy(B(s.loc)); l.target.position.copy(B(s.aim)); scene.add(l, l.target); }
const beamMat = (rgb) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  uniforms: { col: { value: new THREE.Color(...rgb) }, gain: { value: 1 } },
  vertexShader: "varying float vy; varying vec3 vn, vv; void main() { vy = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vn = normalize(normalMatrix * normal); vv = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
  fragmentShader: "uniform vec3 col; uniform float gain; varying float vy; varying vec3 vn, vv; void main() { float edge = pow(abs(dot(vn, vv)), 1.6); gl_FragColor = vec4(col * edge * pow(vy, 1.4) * 0.22 * gain, 1.0); }" });
const beams = lay.spots.map((s) => { const a = B(s.loc), b = B(s.aim), L = a.distanceTo(b), r = L * Math.tan(THREE.MathUtils.degToRad(s.size) / 2) * 0.85;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, r, L, 32, 1, true), beamMat(s.rgb)); m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize()); scene.add(m); return m; });

/* ------------------------------------------------------------------ the band: one video, eight cells */
const band = document.createElement("video"); Object.assign(band, { src: "assets/band.mp4", muted: true, playsInline: true, preload: "auto", crossOrigin: "anonymous" });
const bandTex = new THREE.VideoTexture(band); bandTex.colorSpace = THREE.SRGBColorSpace;
const ORDER = ["me", "nylon", "upright", "congas", "sax", "violin", "keys", "beats"];
const CH = lay.card.h * lay.card.scale, CWD = lay.card.w * lay.card.scale;
const cardGeo = new THREE.PlaneGeometry(CWD, CH).translate(0, CH * 0.45, 0);   // origin at the feet (5% up the card)
const players = ORDER.map((nm, i) => { const mat = new THREE.ShaderMaterial({ transparent: true,
    uniforms: { map: { value: bandTex }, cell: { value: new THREE.Vector2(i % 4, Math.floor(i / 4)) } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform sampler2D map; uniform vec2 cell; varying vec2 vUv;
      void main() { vec2 c = vec2((cell.x + vUv.x) * 320.0 / 1280.0, 1.0 - (cell.y * 245.0 + (1.0 - vUv.y) * 245.0) / 992.0);
        float a = texture2D(map, c - vec2(0.0, 490.0 / 992.0)).r; if (a < 0.03) discard;
        vec3 col = texture2D(map, c).rgb / max(a, 0.25); gl_FragColor = vec4(min(col, 1.0), smoothstep(0.08, 0.6, a));
        #include <colorspace_fragment>
      }` });
  const m = new THREE.Mesh(cardGeo, mat); m.position.copy(B(lay.band[nm])); scene.add(m); return m; });

/* the singer for the wall, composed from his cell (colour, with the alpha from below it) */
const faceC = Object.assign(document.createElement("canvas"), { width: 320, height: 245 }), fx = faceC.getContext("2d", { willReadFrequently: true });
function composeFace() { fx.clearRect(0, 0, 320, 245); fx.drawImage(band, 0, 490, 320, 245, 0, 0, 320, 245); const al = fx.getImageData(0, 0, 320, 245);
  fx.drawImage(band, 0, 0, 320, 245, 0, 0, 320, 245); const im = fx.getImageData(0, 0, 320, 245);
  for (let p = 0; p < im.data.length; p += 4) { const a = al.data[p]; im.data[p + 3] = a; if (a > 8) for (let k = 0; k < 3; k++) im.data[p + k] = Math.min(255, im.data[p + k] * 255 / a); }
  fx.putImageData(im, 0, 0); W.__faceEl(faceC, FACEBOX); }

/* ------------------------------------------------------------------ the crowd: one sprite sheet, every fan in one draw */
const fanMeta = await (await fetch("assets/fans.json")).json();
const fanTex = await new THREE.TextureLoader().loadAsync("assets/fans.webp"); fanTex.colorSpace = THREE.SRGBColorSpace; fanTex.anisotropy = 4;
const pinCanvases = Array.from({ length: 8 }, () => Object.assign(document.createElement("canvas"), { width: 256, height: 256 }));
const venue = buildVenue({ scene, STAGE, fanTex, fanMeta, pinFaces: pinCanvases });
lay.fans = lay.fans.filter((f) => { const p = B([f.x, f.y, f.z]); return !venue.keepClear(p.x, p.z); });
const fanGeo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1).translate(0, 0.46, 0)); fanGeo.instanceCount = lay.fans.length;
const rnd = ((z) => () => (z = (z * 1664525 + 1013904223) >>> 0) / 4294967296)(20261101);
const att = (n, f) => new THREE.InstancedBufferAttribute(new Float32Array(lay.fans.flatMap(f)), n);
fanGeo.setAttribute("iPos", att(3, (f) => B([f.x, f.y, f.z]).toArray()));
fanGeo.setAttribute("iData", att(4, (f) => [f.s * (f.m ? -1 : 1), Math.floor(rnd() * fanMeta.fronts), fanMeta.fronts + Math.floor(rnd() * fanMeta.backs), rnd()]));
const fanMat = new THREE.ShaderMaterial({ fog: true,
  uniforms: { map: { value: fanTex }, t: { value: 0 }, size: { value: new THREE.Vector2(CWD / lay.card.scale, CH / lay.card.scale) }, stage: { value: STAGE },
    grid: { value: new THREE.Vector3(fanMeta.cols, fanMeta.rows, fanMeta.frames) }, ...THREE.UniformsLib.fog },
  vertexShader: `attribute vec3 iPos; attribute vec4 iData; uniform float t; uniform vec2 size; uniform vec3 stage, grid; varying vec2 vUv;
    #include <fog_pars_vertex>
    void main() { vec3 toCam = cameraPosition - iPos; vec3 right = normalize(vec3(toCam.z, 0.0, -toCam.x));
      vec2 face = normalize(stage.xz - iPos.xz); bool front = dot(toCam.xz, face) > 0.0;     // stand on the stage side of a fan and you see its face
      float s = abs(iData.x), kind = front ? iData.y : iData.z, fr = mod(floor(t * 10.0 + iData.w * grid.z), grid.z), idx = kind * grid.z + fr;
      vec2 uv0 = vec2(iData.x < 0.0 ? 1.0 - uv.x : uv.x, uv.y);
      vUv = vec2((mod(idx, grid.x) + uv0.x) / grid.x, 1.0 - (floor(idx / grid.x) + 1.0 - uv0.y) / grid.y);
      vec3 p = iPos + right * position.x * size.x * s + vec3(0.0, position.y * size.y * s, 0.0);
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv;
    #include <fog_pars_fragment>
    void main() { vec4 c = texture2D(map, vUv); if (c.a < 0.45) discard; gl_FragColor = vec4(c.rgb / max(c.a, 0.5), 1.0);
      #include <colorspace_fragment>
      #include <fog_fragment>
    }` });
const crowd = new THREE.Mesh(fanGeo, fanMat); crowd.frustumCulled = false; scene.add(crowd);

/* ------------------------------------------------------------------ grounding and atmosphere */
const softDisc = (inner, outer) => { const c = Object.assign(document.createElement("canvas"), { width: 128, height: 128 }), g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(255,255,255,${inner})`); gr.addColorStop(1, `rgba(255,255,255,${outer})`); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); };
{ const feet = [...lay.fans.map((f) => [B([f.x, f.y, f.z]), 0.55 * f.s]), ...ORDER.map((nm) => [B(lay.band[nm]), 0.7])];   // a soft shadow under every cat
  const sh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 0.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: softDisc(0.75, 0), transparent: true, depthWrite: false, opacity: 0.6 }), feet.length);
  feet.forEach(([p, r], i) => sh.setMatrixAt(i, new THREE.Matrix4().compose(p.clone().setY(p.y + 0.012), new THREE.Quaternion(), new THREE.Vector3(r * 2, 1, r * 2)))); scene.add(sh); }
const pools = lay.spots.slice(0, 8).map((s) => { const a = B(s.aim), r = B(s.loc).distanceTo(a) * Math.tan(THREE.MathUtils.degToRad(s.size) / 2);   // where each stage spot lands
  const m = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(...s.rgb), alphaMap: softDisc(0.5, 0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  m.position.copy(a).setY(Math.max(1.01, a.y - 0.19 + 0.012)); scene.add(m); return m; });
const NDUST = PHONE ? 700 : 1600, dg = new THREE.BufferGeometry(), dp = new Float32Array(NDUST * 3);
for (let i = 0; i < NDUST; i++) dp.set([(rnd() - 0.5) * 22, 0.5 + rnd() * 8, STAGE.z - 2 - rnd() * 18], i * 3);
dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
const dustMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { t: { value: 0 }, px: { value: Q.dpr } },
  vertexShader: "uniform float t, px; varying float va; void main() { vec3 p = position; float k = p.x * 1.7 + p.z * 0.9; p += vec3(sin(t * 0.13 + k) * 0.6, sin(t * 0.09 + k * 1.3) * 0.4, cos(t * 0.11 + k) * 0.6);\n vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = px * 22.0 / -mv.z; va = 0.35 * smoothstep(30.0, 4.0, -mv.z); }",
  fragmentShader: "varying float va; void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.0, 0.92, 0.98) * va * smoothstep(0.5, 0.0, d), 1.0); }" });
scene.add(Object.assign(new THREE.Points(dg, dustMat), { frustumCulled: false }));

/* ------------------------------------------------------------------ confetti: three blasts, worked out from song time */
const NCONF = 2600 * 2 * CUES.length, cg = new THREE.BufferGeometry(), cp = new Float32Array(NCONF * 3), cv = new Float32Array(NCONF * 4), cc = new Float32Array(NCONF * 3);
const PAL = [[1, 0.3, 0.6], [1, 0.85, 0.3], [0.4, 0.85, 1], [0.95, 0.95, 1], [0.7, 0.45, 1], [1, 0.45, 0.25]];
for (let i = 0; i < NCONF; i++) { const cue = Math.floor(i / 5200), side = (i % 5200) < 2600 ? -1 : 1, o = B(lay.cannons[side < 0 ? 0 : 1]);
  cp.set([o.x, o.y, o.z], i * 3); const a = rnd() * Math.PI * 2, sw = rnd() * 0.5;
  cv.set([side * (0.5 + rnd() * 2.5) + Math.cos(a) * sw * 14, 6 + rnd() * 5, -(7 + rnd() * 8), CUES[cue] + rnd() * 0.15], i * 4); cc.set(PAL[Math.floor(rnd() * 6)], i * 3); }   // as in the film: mostly up, then raining over the front rows
cg.setAttribute("position", new THREE.BufferAttribute(cp, 3)); cg.setAttribute("vel", new THREE.BufferAttribute(cv, 4)); cg.setAttribute("color", new THREE.BufferAttribute(cc, 3));
const confMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { t: { value: 0 }, px: { value: renderer.getPixelRatio() } },
  vertexShader: `attribute vec4 vel; attribute vec3 color; uniform float t, px; varying vec3 vc; varying float va;
    void main() { float dt = t - vel.w; if (dt < 0.0 || dt > 40.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
      float k = 1.2, vt = 0.8, e = (1.0 - exp(-k * dt)) / k;                          // drag, and a slow drift down once the push is spent
      vec3 p = position + vec3(vel.x, vel.y, vel.z) * e - vec3(0.0, vt * dt, 0.0); p.x += 0.25 * sin(dt * 3.0 + vel.x * 7.0); p.y = max(p.y, 0.04);
      vc = color * (0.75 + 0.25 * sin(dt * 9.0 + vel.z * 5.0)); va = 1.0 - smoothstep(30.0, 40.0, dt);
      vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = min(px * 110.0 / -mv.z, px * 12.0); }`,   // capped: never a big block when a piece drifts past your face
  fragmentShader: "varying vec3 vc; varying float va; void main() { vec2 q = gl_PointCoord - 0.5; if (abs(q.x) > 0.5 || abs(q.y) > 0.3) discard; gl_FragColor = vec4(vc, va); }" });
const confetti = new THREE.Points(cg, confMat); confetti.frustumCulled = false; scene.add(confetti);

/* ------------------------------------------------------------------ walking: keys and mouse, or a stick and a drag */
const keys = new Set(); addEventListener("keydown", (e) => keys.add(e.code)); addEventListener("keyup", (e) => keys.delete(e.code));
const view = $("view"); let drag = null; const stick = { x: 0, y: 0, id: null };
const lock = () => { try { view.requestPointerLock?.()?.catch?.(() => {}); } catch (e) {} };   // some embeds refuse pointer lock: then drag to look
view.addEventListener("click", () => { if (live && matchMedia("(pointer: fine)").matches) lock(); });
addEventListener("mousemove", (e) => { if (document.pointerLockElement === view) { me.yaw -= e.movementX * 0.0022; me.pitch = Math.max(-0.6, Math.min(0.9, me.pitch - e.movementY * 0.0022)); } });
const stickEl = $("stick"), knob = stickEl.firstElementChild;
stickEl.addEventListener("pointerdown", (e) => { stick.id = e.pointerId; stickEl.setPointerCapture(e.pointerId); });
stickEl.addEventListener("pointermove", (e) => { if (e.pointerId !== stick.id) return; const r = stickEl.getBoundingClientRect(), dx = e.clientX - r.left - 55, dy = e.clientY - r.top - 55, d = Math.min(45, Math.hypot(dx, dy)) / (Math.hypot(dx, dy) || 1);
  stick.x = dx * d / 45; stick.y = dy * d / 45; knob.style.transform = `translate(${dx * d}px, ${dy * d}px)`; });
const stickUp = () => { stick.id = null; stick.x = stick.y = 0; knob.style.transform = ""; }; stickEl.addEventListener("pointerup", stickUp); stickEl.addEventListener("pointercancel", stickUp);
view.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" || document.pointerLockElement !== view) drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
view.addEventListener("pointermove", (e) => { if (!drag || e.pointerId !== drag.id) return; me.yaw -= (e.clientX - drag.x) * 0.005; me.pitch = Math.max(-0.6, Math.min(0.9, me.pitch - (e.clientY - drag.y) * 0.005)); drag.x = e.clientX; drag.y = e.clientY; });
view.addEventListener("pointerup", () => (drag = null));
function walk(dt) { let f = 0, s = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) f += 1; if (keys.has("KeyS") || keys.has("ArrowDown")) f -= 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) s -= 1; if (keys.has("KeyD") || keys.has("ArrowRight")) s += 1;
  f -= stick.y; s += stick.x; const sp = 3.2 * dt * (keys.has("ShiftLeft") ? 1.8 : 1);
  me.x += (-Math.sin(me.yaw) * f + Math.cos(me.yaw) * s) * sp; me.z += (-Math.cos(me.yaw) * f - Math.sin(me.yaw) * s) * sp;
  /* the floor of the Sphere: from the barrier back to the last tier, round the bowl in front of the stage */
  let dx = me.x - STAGE.x, dz = me.z - STAGE.z, r = Math.hypot(dx, dz), a = Math.atan2(dx, -dz);
  r = Math.max(8.7, Math.min(26.0, r)); a = Math.max(-(A_MAX - 0.04), Math.min(A_MAX - 0.04, a)); me.x = STAGE.x + r * Math.sin(a); me.z = STAGE.z - r * Math.cos(a);
  for (const c of venue.colliders) { const ex = me.x - c.x, ez = me.z - c.z, d = Math.hypot(ex, ez); if (d < c.r && d > 0) { me.x = c.x + ex / d * c.r; me.z = c.z + ez / d * c.r; } }
  r = Math.hypot(me.x - STAGE.x, me.z - STAGE.z); me.eye += (floorAt(r) + 1.3 - me.eye) * Math.min(1, dt * 6);
  me.moving += ((Math.abs(f) + Math.abs(s) > 0.1 ? 1 : 0) - me.moving) * Math.min(1, dt * 8);
  cam.position.set(me.x, me.eye, me.z); cam.rotation.set(me.pitch, me.yaw, 0); }

/* ------------------------------------------------------------------ you: paws, the stands, badges (game.js) */
const game = createGame({ cam, me, venue, STAGE, keys, view, conf: { cp, cv, CUES, attr: cg.attributes.vel } });
const coatsEl = $("coats");
COATS.forEach((c, i) => { const b = document.createElement("button"); b.className = "coat"; b.title = c.name; b.setAttribute("aria-label", c.name);
  b.style.background = c.patch ? `conic-gradient(${c.arm} 0 50%, ${c.patch[0]} 0 75%, ${c.patch[1]} 0)` : `linear-gradient(135deg, ${c.arm} 60%, ${c.paw} 60%)`;
  b.onclick = () => { game.setCoat(i); [...coatsEl.children].forEach((x, j) => x.classList.toggle("on", j === i)); }; coatsEl.appendChild(b); });
coatsEl.children[game.coatIndex()]?.classList.add("on");

/* ------------------------------------------------------------------ doors, the show, and the end */
const START = +(new URLSearchParams(location.search).get("t") || 0);   // ?t=seconds: start partway in (for checking a moment)
const ticket = await loadTicket();   // ticket.js: a signed sign-in message, then the concert film in that wallet (no contract set: doors open)
const tmsg = $("ticketmsg"), tget = $("ticketget");
const ticketUi = { status(text, stop) { tmsg.textContent = text; tmsg.hidden = false; if (stop) { enter.disabled = false; enter.textContent = ticket.contract ? "Try again" : "Enter the show"; tget.hidden = !ticket.get; } } };
if (ticket.get) tget.href = ticket.get;
const enter = $("enter");
band.addEventListener("loadeddata", () => { band.addEventListener("seeked", () => { makePinFaces(band, pinCanvases); venue.pins.forEach((p) => (p.sprite.material.map.needsUpdate = true));
    band.currentTime = START; enter.disabled = false; enter.textContent = ticket.contract ? "Show your ticket" : "Enter the show"; }, { once: true }); band.currentTime = 70; }, { once: true }); band.load();
enter.addEventListener("click", async () => { enter.disabled = true; tget.hidden = true; if (!(await checkTicket(ticket, ticketUi))) return;
  $("doors").remove(); live = true; audio.currentTime = START; await audio.play(); band.currentTime = START; band.play().catch(() => {});
  if (matchMedia("(pointer: fine)").matches) lock(); });
audio.addEventListener("ended", () => { live = false; band.pause(); const v = game.recap();
  v.querySelector("button").onclick = () => { v.remove(); live = true; audio.currentTime = 0; audio.play(); band.currentTime = 0; band.play(); }; document.exitPointerLock?.(); });

/* the quality governor: average frame time over two seconds; too slow, step down (glow off, then fewer pixels); plenty of room, step back up */
let gT = 0, gN = 0; function govern(dt) { gT += dt; gN++; if (gT < 2) return; const ms = gT / gN * 1000; gT = gN = 0;
  if (ms > 24) { if (Q.bloom) Q.bloom = false; else if (Q.dpr > 0.75) { Q.dpr = Math.max(0.75, Q.dpr - 0.25); renderer.setPixelRatio(Q.dpr); composer.setPixelRatio(Q.dpr); } }
  else if (ms < 13 && !Q.bloom && Q.dpr >= (PHONE ? 1.25 : Math.min(devicePixelRatio, 2))) Q.bloom = true; }
const DOORS = { trance: 0.6, bloom: 0.3, title: 1, sym: 1 };            // before the show: the name in lights over the tunnel
const clock = $("clock"); let last = performance.now(), n = 0, synced = 0;
/* everything ready before the doors open: every shader compiled and every image on the graphics card now, so nothing
   stalls the first time it comes into view (a stand, the Art Hall, the confetti, a pin) */
scene.traverse((o) => { for (const m of [].concat(o.material || [])) for (const k of ["map", "alphaMap", "emissiveMap", "normalMap", "roughnessMap", "metalnessMap"]) if (m[k] && !m[k].isVideoTexture) renderer.initTexture(m[k]); });
await renderer.compileAsync(scene, cam);
renderer.setAnimationLoop(() => { const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; n++;
  const t = songTime(), b = beatAt(t), pulse = Math.exp(-(((b % 1) + 1) % 1) * 5);
  if (live && !band.seeking && now - synced > 1000 && Math.abs(band.currentTime - t) > 0.12) { band.currentTime = t + 0.05; synced = now; }   // keep the band on the song (at most once a second, so a seek can finish)
  W.__frame(live ? t : now / 1000 % 60, live ? undefined : DOORS); wallTex.needsUpdate = true;
  if (live && n % 2 === 0 && (W.__modeAt(t).face || 0) > 0.01 && band.readyState >= 2) composeFace();
  for (const p of players) p.rotation.y = Math.atan2(cam.position.x - p.position.x, cam.position.z - p.position.z);
  beams.forEach((m, i) => (m.material.uniforms.gain.value = 0.75 + 0.5 * pulse * (i % 2 ? 1 : 0.6)));
  pools.forEach((m, i) => (m.material.opacity = 0.16 + 0.14 * pulse * (i % 2 ? 1 : 0.6))); dustMat.uniforms.t.value = now / 1000;
  fanMat.uniforms.t.value = live ? t : now / 1000; confMat.uniforms.t.value = t;
  walk(dt); venue.update(t, now); game.update(t, dt, b, now, me.moving, live); if (Q.bloom) composer.render(); else renderer.render(scene, cam); govern(dt);
  if (live) clock.textContent = `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`; });
window.__show = { audio, band, cam, confMat, confetti, scene, me, venue, Q, composer, renderer };   // for checking a moment from the console
