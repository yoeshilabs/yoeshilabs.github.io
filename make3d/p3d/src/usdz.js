/* Prancer 3D: the USDZ a holder opens in AR on an iPhone or iPad (AR Quick Look: no app), beside the GLB (glb.js).
   Made from the very GLB the holder downloads, so the two match: exportGLB bakes the coat and the eyes into ordinary
   textures, three's GLTFLoader reads it back as plain MeshStandardMaterial parts, and three's USDZExporter (r184,
   lib/jsm/exporters) writes it for Quick Look, the cat standing on the floor it finds, at a real cat's size.
   USDZ from three is still: the cat stands in its rest pose (the moves stay in the GLB).
     exportUSDZ(avatar, renderer, THREE, { coat: COAT glsl, name, height }) -> Promise<Uint8Array>
   On a page: <a rel="ar" href="(a blob URL of it)"><img ...></a>; Safari on iOS opens the link in Quick Look.
   Not part of the generator (the on-chain piece ships no export). */
import { exportGLB, prancerClips } from "./glb.js";
import { GLTFLoader } from "../lib/jsm/loaders/GLTFLoader.js";
import { USDZExporter } from "../lib/jsm/exporters/USDZExporter.js";

export async function exportUSDZ(avatar, renderer, T, { coat, name = "Prancer", height = 0.32 } = {}) {
  /* one still moment of the cat at rest: the idle clip held at its first frame, so exportGLB poses and restores the rig
     as it does for the download */
  const idle = prancerClips(avatar)[0], still = { ...idle, name: "Rest", duration: 0 };
  const glb = exportGLB(avatar, renderer, T, { clips: [still], coat, name });
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
  const scene = new T.Scene(); scene.add(holder); scene.updateMatrixWorld(true);
  return new USDZExporter().parseAsync(scene, { quickLookCompatible: true, maxTextureSize: 1024,
    ar: { anchoring: { type: "plane" }, planeAnchoring: { alignment: "horizontal" } } });
}
