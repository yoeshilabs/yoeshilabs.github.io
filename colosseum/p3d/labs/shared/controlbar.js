

import { COLOR, TYPE, WEIGHT, KEYS, alpha, fontFaceCSS } from "./tokens.js";

const NAME = { ShiftLeft: "Shift", ShiftRight: "Shift", Space: "Space", Enter: "Enter", Escape: "Esc", Tab: "Tab", ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓" };
const WORD = { move: "walk", run: "run", jump: "jump", use: "use", firstPerson: "first person" };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const keyName = (code) => NAME[code] || String(code).replace(/^Key|^Digit/, "");

export function controlBar({ show = ["move", "run", "jump", "use", "firstPerson"], words = {}, extra = [], only = {}, touch = "hide", doc = globalThis.document, coarse } = {}) {
  if (!doc) throw new Error("controlBar needs a document");
  if (!doc.getElementById("tokens-fonts")) { const st = doc.createElement("style"); st.id = "tokens-fonts"; st.textContent = fontFaceCSS(); doc.head.appendChild(st); }
  const isTouch = coarse ?? !!(globalThis.matchMedia && globalThis.matchMedia("(pointer: coarse)").matches);
  const el = doc.createElement("div"); el.id = "controlbar";
  el.style.cssText = `position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2;max-width:calc(100vw - 190px);padding:9px 18px;border-radius:22px;white-space:nowrap;pointer-events:none;` +
    `font:${WEIGHT.control} 15px/1.4 ${TYPE.ui};color:${COLOR.ink};background:${alpha("night", "panel")};border:1px solid ${alpha("ink", "line")};text-shadow:0 2px 10px ${alpha("night", "shadow")}`;
  const KBD = `display:inline-block;min-width:1.2em;padding:0 .35em;margin:0 .1em;border-radius:6px;background:${alpha("ink", "glass")};border:1px solid ${alpha("ink", "line")};font:inherit;text-align:center`;
  const kbd = (k) => `<kbd style="${KBD}">${esc(k)}</kbd>`;
  const chips = (action) => [...new Set((KEYS[action] || []).filter((c) => !only[action] || only[action].includes(c)).map(keyName))].map(kbd).join("");
  let hidden = false, own = null;
  const draw = () => { el.style.display = hidden || (isTouch && touch === "hide") ? "none" : "block";
    el.innerHTML = own != null ? own : [...show.map((a) => chips(a) + " " + esc(words[a] || WORD[a] || a)), ...extra.map((x) => x.keys.map(kbd).join("") + " " + esc(x.word))].join(" &nbsp; "); };
  (doc.body || doc.documentElement).appendChild(el); draw();
  return { el, chips, kbd, draw,
    show(a) { show = a; own = null; draw(); }, words(w) { words = w; draw(); }, extra(x) { extra = x; own = null; draw(); },
    say(html) { own = html; draw(); }, hide(h = true) { hidden = !!h; draw(); },
    get text() { return el.innerHTML.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); } };
}
