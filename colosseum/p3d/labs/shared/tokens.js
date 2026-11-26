


 
export const COLOR = Object.freeze({
  pink: "#ff5fa8",     
  gold: "#ffd36e",     
  night: "#120a1c",    
  ink: "#fff7ef",      
});
 
export const STRENGTH = Object.freeze({ panel: 0.88, glass: 0.16, line: 0.28, muted: 0.62, shadow: 0.9 });
export function alpha(name, a) { const h = COLOR[name] || TONE[name]; if (!h) throw new Error("not a palette color: " + name); const n = parseInt(h.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${typeof a === "string" ? STRENGTH[a] : a})`; }


export const TONE = Object.freeze({
  night2: "#1c1029",    
  paper: "#f5eee2",     
  paper2: "#ece2d1",    
  pen: "#1d1326",       
});
 
export const SIGNAL = Object.freeze({ live: "#2fd27a", warn: "#ff4d6a" });



export const TYPE = Object.freeze({
  display: '"League Gothic", "Oswald", "Arial Narrow", sans-serif',
  ui: '"Nunito", ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif',
  voice: '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif',
  mono: "ui-monospace, Menlo, Consolas, monospace",
});
export const FONT_FILES = Object.freeze({ "League Gothic": "fonts/league-gothic.woff2", Nunito: "fonts/nunito.woff2" });    
const FONT_WEIGHTS = { Nunito: "200 1000" };    
 
export const WEIGHT = Object.freeze({ text: 400, control: 650, name: 700 });
export function fontFaceCSS(base = new URL(".", import.meta.url).href) {
  return Object.entries(FONT_FILES).map(([f, p]) => `@font-face { font-family: "${f}"; src: url(${new URL(p, base).href}) format("woff2");${FONT_WEIGHTS[f] ? ` font-weight: ${FONT_WEIGHTS[f]};` : ""} font-display: swap; }`).join("\n"); }

 
export const KEYS = Object.freeze({
  move: ["KeyW", "KeyA", "KeyS", "KeyD"],
  run: ["ShiftLeft", "ShiftRight"],
  jump: ["Space"],
  use: ["KeyE"],                        
  firstPerson: ["KeyC", "KeyV"],
});
const LABEL = { ShiftLeft: "Shift", ShiftRight: "Shift", Space: "Space", Enter: "Enter", Escape: "Esc", Tab: "Tab" };
export function keyLabel(action) { const k = KEYS[action]; if (!k) throw new Error("no action " + action);
  const out = []; for (const c of k) { const l = LABEL[c] || c.replace(/^Key|^Digit/, ""); if (!out.includes(l)) out.push(l); } return out.join(action === "move" ? " " : " or "); }
export function isKey(action, code) { return (KEYS[action] || []).includes(code); }

 
export function cssVars() { return [...Object.entries({ ...COLOR, ...TONE }).map(([k, v]) => `--${k}: ${v};`), ...Object.entries(TYPE).map(([k, v]) => `--${k}: ${v};`), ...Object.entries(WEIGHT).map(([k, v]) => `--weight-${k}: ${v};`)].join(" "); }
