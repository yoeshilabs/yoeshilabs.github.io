/* Prancer 3D: the USDZ a holder opens in AR on an iPhone or iPad (AR Quick Look: no app), beside the GLB (glb.js).
   Made from the very GLB the holder downloads, so the two match: exportGLB bakes the coat and the eyes into ordinary
   textures, three's GLTFLoader reads it back as plain MeshStandardMaterial parts, and three's USDZExporter (r184,
   lib/jsm/exporters) writes it for Quick Look, the cat standing on the floor it finds, at a real cat's size.
   Alive in the room (Yoeshi, 2026-11-10, on his own phone: "I expected the cat to load with more life"): three's exporter
   writes a still, so the cat's parts (rigid pieces on its bones, no skin) are given their places over time afterwards:
   a loop of its own clips (LIFE: it idles, waves, idles, raises its paws), sampled 15 times a second and written as
   time samples on each part that moves, with the stage set to play and loop by itself in Quick Look.
     exportUSDZ(avatar, renderer, THREE, { coat: COAT glsl, name, height, life = true }) -> Promise<Uint8Array>
   On a page: <a rel="ar" href="(a blob URL of it)"><img ...></a>; Safari on iOS opens the link in Quick Look.
   Not part of the generator (the on-chain piece ships no export). */
import { exportGLB, prancerClips } from "./glb.js";
import { GLTFLoader } from "../lib/jsm/loaders/GLTFLoader.js";
import { USDZExporter } from "../lib/jsm/exporters/USDZExporter.js";
import { unzipSync, zipSync, strToU8, strFromU8 } from "../lib/jsm/libs/fflate.module.js";

/* the loop it lives in the room: [clip, seconds] */
const LIFE = [["Idle", 4], ["Wave", 2.4], ["Idle", 3], ["Paws Up", 2.2], ["Idle", 2.4]], RATE = 15;
const num = (x) => (Math.abs(x) < 1e-6 ? "0" : String(+x.toFixed(5))), mat = (e) => `( (${num(e[0])}, ${num(e[1])}, ${num(e[2])}, ${num(e[3])}), (${num(e[4])}, ${num(e[5])}, ${num(e[6])}, ${num(e[7])}), (${num(e[8])}, ${num(e[9])}, ${num(e[10])}, ${num(e[11])}), (${num(e[12])}, ${num(e[13])}, ${num(e[14])}, ${num(e[15])}) )`;

export async function exportUSDZ(avatar, renderer, T, { coat, name = "Prancer", height = 0.32, life = true } = {}) {
  /* one still moment of the cat at rest: the idle clip held at its first frame, so exportGLB poses and restores the rig
     as it does for the download */
  const all = prancerClips(avatar), idle = all[0], still = { ...idle, name: "Rest", duration: 0 };
  const glb = exportGLB(avatar, renderer, T, { clips: life ? [still, ...all.filter((c) => LIFE.some(([n]) => n === c.name))] : [still], coat, name });
  const gltf = await new GLTFLoader().parseAsync(glb, "");
  const cat = gltf.scene; cat.name = name.replace(/[^A-Za-z0-9_]/g, "_") || "Prancer";
  /* AR Quick Look reads metres: scale the cat to a real cat's height, its paws on the floor and centred on the spot */
  const box = new T.Box3().setFromObject(cat), size = box.getSize(new T.Vector3()), k = height / Math.max(size.y, 1e-6);
  const holder = new T.Group(); holder.name = "Prancer3D"; holder.add(cat);
  cat.scale.multiplyScalar(k); cat.position.set(-(box.min.x + box.max.x) / 2 * k, -box.min.y * k, -(box.min.z + box.max.z) / 2 * k);
  /* what Quick Look cannot show well: glTF's blended transparency on solid parts, and unlit bits (USDZ is lit) */
  cat.traverse((o) => { if (!o.isMesh) return; const ms = [].concat(o.material);
    ms.forEach((m, i) => { if (!m.isMeshStandardMaterial) { const s = new T.MeshStandardMaterial({ color: m.color || 0xffffff, map: m.map || null, emissive: m.color || 0, emissiveMap: m.map || null, roughness: 1 });
      if (Array.isArray(o.material)) o.material[i] = s; else o.material = s; } else if (m.transparent && m.opacity >= 0.99) m.transparent = false; }); });
  const scene = new T.Scene(); scene.add(holder);
  /* the loop, sampled: every part's own place at each step (the parts are named so each can be found in the file) */
  const parts = []; cat.traverse((o) => { if (o !== cat) parts.push(o); }); const tracks = parts.map(() => []); let steps = 0;   /* (named after the sampling: the clips find their parts by their own names) */
  if (life && gltf.animations.length > 1) { const mixer = new T.AnimationMixer(cat), acts = Object.fromEntries(gltf.animations.map((c) => [c.name, mixer.clipAction(c)]));
    for (const [nm, secs] of LIFE) { const act = acts[nm]; if (!act) continue; mixer.stopAllAction(); act.reset().play(); const n = Math.round(secs * RATE), dur = Math.max(1e-3, act.getClip().duration);
      for (let i = 0; i < n; i++) { mixer.setTime(nm === "Idle" ? (i / RATE) % dur : Math.min(dur - 1e-3, (i / n) * dur)); parts.forEach((o, k) => { o.updateMatrix(); tracks[k].push(mat(o.matrix.elements)); }); steps++; } }
    mixer.stopAllAction(); acts.Rest && acts.Rest.reset().play(); mixer.setTime(0); mixer.stopAllAction(); parts.forEach((o, k) => { if (tracks[k].length) { o.matrix.fromArray(JSON.parse("[" + tracks[k][0].replace(/[()]/g, "") + "]")); o.matrix.decompose(o.position, o.quaternion, o.scale); } }); }
  parts.forEach((o, k) => (o.name = "p" + k)); scene.updateMatrixWorld(true);
  const bytes = await new USDZExporter().parseAsync(scene, { quickLookCompatible: true, maxTextureSize: 1024,
    ar: { anchoring: { type: "plane" }, planeAnchoring: { alignment: "horizontal" } } });
  if (!steps) return bytes;
  /* into the file: the stage plays and loops by itself, and each part that moves carries its samples */
  const files = unzipSync(bytes), key = Object.keys(files).find((k) => /\.usda?$/.test(k)); let usd = strFromU8(files[key]), moved = 0;
  usd = usd.replace(/^\(\n/m, `(\n\tautoPlay = true\n\tplaybackMode = "loop"\n\tstartTimeCode = 0\n\tendTimeCode = ${steps - 1}\n\ttimeCodesPerSecond = ${RATE}\n\tframesPerSecond = ${RATE}\n`);
  parts.forEach((o, k) => { const tr = tracks[k]; if (!tr.length || tr.every((m) => m === tr[0])) return; const at = usd.indexOf(`def Xform "p${k}"`); if (at < 0) return;
    const a0 = usd.indexOf("matrix4d xformOp:transform = ", at), a1 = usd.indexOf("\n", a0); if (a0 < 0 || a0 - at > 400) return;
    usd = usd.slice(0, a0) + "matrix4d xformOp:transform.timeSamples = {\n" + tr.map((m, i) => `\t\t\t${i}: ${m},`).join("\n") + "\n\t\t}" + usd.slice(a1); moved++; });
  const out = {}; let offset = 0; files[key] = strToU8(usd);
  for (const fn of Object.keys(files)) { const f = files[fn]; offset += 34 + fn.length; const mod = offset & 63; out[fn] = mod !== 4 ? [f, { extra: { 12345: new Uint8Array(64 - mod) } }] : f; offset = f.length; }   // every file's data on a 64-byte boundary, as three's exporter lays them
  return zipSync(out, { level: 0 });
}
