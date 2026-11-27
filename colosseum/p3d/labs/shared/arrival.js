

import { COLOR, TYPE, alpha, fontFaceCSS } from "./tokens.js";

export function arrival({ name, line = "", expect = 60, fade = 0.7, doc = globalThis.document, perf = globalThis.performance } = {}) {
  if (!doc) throw new Error("arrival needs a document");
  if (!doc.getElementById("tokens-fonts")) { const st = doc.createElement("style"); st.id = "tokens-fonts"; st.textContent = fontFaceCSS(); doc.head.appendChild(st); }
  const el = doc.createElement("div"), h = doc.createElement("div"), l = doc.createElement("div"), pill = doc.createElement("div"), fill = doc.createElement("i");
  el.id = "arrival"; el.setAttribute("role", "status"); el.setAttribute("aria-label", name + " is loading");
  el.style.cssText = `position:fixed;inset:0;z-index:99;display:grid;place-content:center;justify-items:center;gap:18px;background:${COLOR.night};transition:opacity ${fade}s;text-align:center;padding:24px`;
  h.textContent = name; h.style.cssText = `font:400 clamp(56px,11vw,112px)/1 ${TYPE.display};letter-spacing:1px;color:${COLOR.gold};text-transform:uppercase`;
  l.textContent = line; l.style.cssText = `font:400 17px/1.4 ${TYPE.ui};color:${COLOR.ink};opacity:.8;max-width:34em` + (line ? "" : ";display:none");
  pill.style.cssText = `width:min(260px,60vw);height:10px;border-radius:6px;background:${alpha("ink", "glass")};overflow:hidden`;
  fill.style.cssText = `display:block;height:100%;width:4%;border-radius:6px;background:${COLOR.pink};transition:width .35s ease-out`;
  pill.appendChild(fill); el.append(h, l, pill); (doc.body || doc.documentElement).appendChild(el);
  let k = 0.04, told = false, gone = false, timer = null;
  const show = (v) => { k = Math.max(k, Math.min(1, v)); fill.style.width = (k * 100).toFixed(1) + "%"; };
   
  const tick = () => { if (gone) return; if (!told && perf && perf.getEntriesByType) show(Math.min(0.95, 0.04 + 0.91 * perf.getEntriesByType("resource").length / Math.max(1, expect))); timer = setTimeout(tick, 150); };
  tick();
  return { el,
    set(v) { told = true; if (!gone) show(Math.min(0.99, v)); },
    done() { if (gone) return; gone = true; clearTimeout(timer); k = 1; fill.style.width = "100%"; el.setAttribute("aria-label", name);
      if (fade <= 0) { el.remove(); return; } setTimeout(() => { el.style.opacity = "0"; el.style.pointerEvents = "none"; }, 200); setTimeout(() => el.remove(), 200 + fade * 1000 + 100); },
    get progress() { return k; }, get gone() { return gone; } };
}
