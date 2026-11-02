/* What the stands sell (all free with your ticket, all just for fun) and how each thing is drawn: on the counters, and in
   your own paw. draw(g, s, used) paints the item centred on (0, 0), about s pixels tall; used (0..1) is how much has been
   eaten or drunk, so bites come out of food and drinks run low. */
const INK = "#120d16";
const outline = (g, s) => { g.lineWidth = Math.max(1.5, s * 0.035); g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
function bites(g, s, used, cx = 0.3, cy = -0.3) {   // round bites out of the top right, one per third eaten
  g.save(); g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < Math.round(used * 3); i++) { g.beginPath(); g.arc(s * (cx - i * 0.24), s * (cy + i * 0.05), s * 0.17, 0, Math.PI * 2); g.fill(); }
  g.restore(); }
function sprinkles(g, s, n, r, seed) { let z = seed; const rnd = () => (z = (z * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, d = r * (0.35 + rnd() * 0.6); g.save(); g.translate(Math.cos(a) * d * s, Math.sin(a) * d * s); g.rotate(rnd() * 3);
    g.fillStyle = ["#fff36e", "#7fe6ff", "#ffffff", "#b6f28a", "#c38bff"][i % 5]; g.fillRect(-s * 0.035, -s * 0.01, s * 0.07, s * 0.022); g.restore(); } }

export const ITEMS = {
  donut: { name: "Donut", kind: "food", crumbs: "#d9a066", draw(g, s, used) { g.save();
    g.beginPath(); g.ellipse(0, 0, s * 0.5, s * 0.42, 0, 0, Math.PI * 2); g.fillStyle = "#d9a066"; g.fill(); outline(g, s);
    g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, r = 0.42 + 0.035 * Math.sin(i * 1.7); g.lineTo(Math.cos(a) * r * s, Math.sin(a) * r * 0.86 * s - s * 0.03); }
    g.fillStyle = "#ff7fb5"; g.fill(); sprinkles(g, s, 16, 0.4, 7);
    g.globalCompositeOperation = "destination-out"; g.beginPath(); g.ellipse(0, -s * 0.02, s * 0.15, s * 0.12, 0, 0, Math.PI * 2); g.fill(); g.restore();
    g.beginPath(); g.ellipse(0, -s * 0.02, s * 0.15, s * 0.12, 0, 0, Math.PI * 2); outline(g, s); bites(g, s, used); } },
  pizza: { name: "Pizza slice", kind: "food", crumbs: "#ffd25e", draw(g, s, used) {
    g.beginPath(); g.moveTo(0, s * 0.5); g.lineTo(-s * 0.4, -s * 0.36); g.quadraticCurveTo(0, -s * 0.52, s * 0.4, -s * 0.36); g.closePath(); g.fillStyle = "#ffd25e"; g.fill(); outline(g, s);
    rr(g, -s * 0.44, -s * 0.5, s * 0.88, s * 0.16, s * 0.08); g.fillStyle = "#d98a3a"; g.fill(); outline(g, s);
    for (const [x, y] of [[-0.12, -0.18], [0.14, -0.1], [0, 0.12], [-0.02, -0.32]]) { g.beginPath(); g.arc(x * s, y * s, s * 0.07, 0, Math.PI * 2); g.fillStyle = "#d63a3a"; g.fill(); }
    bites(g, s, used, 0.0, 0.42); } },
  taco: { name: "Fish taco", kind: "food", crumbs: "#f2c14e", draw(g, s, used) {   // a dome of shell, round fold on top, flat along the bottom; the filling peeks out from behind the curve
    const cy = s * 0.28, arch = (r, sx = 1) => { g.beginPath(); g.ellipse(0, cy, s * 0.46 * r * sx, s * 0.58 * r, 0, Math.PI, 0); };
    for (const [a, rr] of [[-2.55, 0.11], [-1.95, 0.12], [-1.2, 0.12], [-0.6, 0.11]]) { const x = Math.cos(a) * s * 0.5, y = cy + Math.sin(a) * s * 0.62;   // tucked in tight: a stuffed taco   // tomatoes, behind
      g.beginPath(); g.arc(x, y, s * rr, 0, Math.PI * 2); g.fillStyle = "#e8513a"; g.fill(); outline(g, s); }
    g.beginPath(); for (let i = 0; i <= 28; i++) { const a = Math.PI + i * Math.PI / 28, r = 1.13 + 0.06 * (i % 2);   // the lettuce: a frilly band just outside the shell's curve
      g.lineTo(Math.cos(a) * s * 0.46 * r, cy + Math.sin(a) * s * 0.58 * r); } g.lineTo(s * 0.46, cy); g.lineTo(-s * 0.46, cy); g.closePath();
    g.fillStyle = "#2fa85a"; g.fill(); outline(g, s);
    arch(1); g.closePath(); g.fillStyle = "#f6c453"; g.fill(); outline(g, s);   // the shell
    g.lineWidth = Math.max(1.5, s * 0.022); g.lineCap = "round"; g.strokeStyle = "#1a1016";   // its toasty marks, as in a drawn taco
    for (const [x, y, r, a0] of [[0.1, -0.08, 0.06, 0.3], [-0.22, 0.12, 0.05, 2.2], [0.22, 0.12, 0.05, 0.6]]) { g.beginPath(); g.arc(x * s, y * s, r * s, a0, a0 + 2.6); g.stroke(); }
    for (const [x, y] of [[-0.05, -0.2], [0.02, 0.14], [-0.3, 0.0]]) { g.beginPath(); g.arc(x * s, y * s, s * 0.015, 0, Math.PI * 2); g.fillStyle = "#1a1016"; g.fill(); }
    bites(g, s, used, 0.3, -0.12); } },
  cola: { name: "Catnip Cola", kind: "drink", crumbs: "#7a2b1a", draw(g, s, used) {
    g.beginPath(); g.moveTo(-s * 0.3, -s * 0.36); g.lineTo(s * 0.3, -s * 0.36); g.lineTo(s * 0.22, s * 0.5); g.lineTo(-s * 0.22, s * 0.5); g.closePath(); g.fillStyle = "#d62f5a"; g.fill(); outline(g, s);
    rr(g, -s * 0.26, -s * 0.04, s * 0.52, s * 0.18, 2); g.fillStyle = "#fff"; g.fill(); g.fillStyle = "#d62f5a"; g.font = `bold ${s * 0.12}px sans-serif`; g.textAlign = "center"; g.fillText("CATNIP", 0, s * 0.1);
    rr(g, -s * 0.34, -s * 0.44, s * 0.68, s * 0.1, s * 0.04); g.fillStyle = "#f4efe4"; g.fill(); outline(g, s);
    g.save(); g.translate(s * 0.08, -s * 0.44); g.rotate(0.25); rr(g, -s * 0.03, -s * 0.36, s * 0.06, s * 0.38, 2); g.fillStyle = "#7fe6ff"; g.fill(); outline(g, s); g.restore(); } },
  shake: { name: "Milkshake", kind: "drink", crumbs: "#ffc0dc", draw(g, s, used) {
    g.beginPath(); g.moveTo(-s * 0.24, -s * 0.2); g.lineTo(s * 0.24, -s * 0.2); g.lineTo(s * 0.16, s * 0.5); g.lineTo(-s * 0.16, s * 0.5); g.closePath(); g.fillStyle = "#ffc0dc"; g.fill(); outline(g, s);
    if (used < 0.9) { g.beginPath(); for (let i = 0; i < 5; i++) g.arc(-s * 0.2 + i * s * 0.1, -s * 0.24, s * 0.1, Math.PI, 0); g.fillStyle = "#fffaf2"; g.fill(); outline(g, s);
      g.beginPath(); g.arc(0, -s * 0.38, s * 0.07, 0, Math.PI * 2); g.fillStyle = "#e0234b"; g.fill(); outline(g, s); } } },
  water: { name: "Sparkle water", kind: "drink", crumbs: "#bfe9ff", draw(g, s, used) {
    rr(g, -s * 0.16, -s * 0.3, s * 0.32, s * 0.8, s * 0.1); g.fillStyle = "rgba(127,230,255,.55)"; g.fill(); outline(g, s);
    rr(g, -s * 0.16, -s * 0.3 + s * 0.8 * Math.min(0.9, used), s * 0.32, s * 0.8 * (1 - Math.min(0.9, used)), s * 0.1); g.fillStyle = "rgba(127,230,255,.9)"; g.fill();
    rr(g, -s * 0.1, -s * 0.44, s * 0.2, s * 0.14, 3); g.fillStyle = "#4a8ae8"; g.fill(); outline(g, s); } },
  popcorn: { name: "Popcorn", kind: "food", crumbs: "#fff7d6", draw(g, s, used) {
    g.beginPath(); g.moveTo(-s * 0.32, -s * 0.1); g.lineTo(s * 0.32, -s * 0.1); g.lineTo(s * 0.24, s * 0.5); g.lineTo(-s * 0.24, s * 0.5); g.closePath(); g.fillStyle = "#fff"; g.fill();
    g.save(); g.clip(); for (let i = -3; i <= 3; i += 2) { g.fillStyle = "#e0234b"; g.fillRect(i * s * 0.09, -s * 0.2, s * 0.09, s * 0.8); } g.restore(); g.stroke();
    g.beginPath(); g.moveTo(-s * 0.32, -s * 0.1); g.lineTo(s * 0.32, -s * 0.1); g.lineTo(s * 0.24, s * 0.5); g.lineTo(-s * 0.24, s * 0.5); g.closePath(); outline(g, s);
    const n = Math.round(9 * (1 - used)); for (let i = 0; i < n; i++) { g.beginPath(); g.arc((i % 5 - 2) * s * 0.12, -s * 0.14 - Math.floor(i / 5) * s * 0.1 - (i % 2) * s * 0.03, s * 0.08, 0, Math.PI * 2); g.fillStyle = "#fff7d6"; g.fill(); outline(g, s); } } },
  crackers: { name: "Fish crackers", kind: "food", crumbs: "#ff9a3a", draw(g, s, used) {
    rr(g, -s * 0.28, -s * 0.42, s * 0.56, s * 0.9, s * 0.06); g.fillStyle = "#3a6fd6"; g.fill(); outline(g, s);
    for (let i = 0; i < 3; i++) { g.save(); g.translate(0, -s * 0.2 + i * s * 0.22); g.beginPath(); g.ellipse(0, 0, s * 0.12, s * 0.06, 0, 0, Math.PI * 2); g.moveTo(s * 0.1, 0); g.lineTo(s * 0.2, -s * 0.06); g.lineTo(s * 0.2, s * 0.06); g.closePath(); g.fillStyle = "#ff9a3a"; g.fill(); g.restore(); }
    bites(g, s, used, 0.2, -0.42); } },
  candy: { name: "Cotton candy", kind: "food", crumbs: "#ff9ccb", draw(g, s, used) {
    g.beginPath(); g.moveTo(-s * 0.04, s * 0.5); g.lineTo(s * 0.04, s * 0.5); g.lineTo(s * 0.02, -s * 0.05); g.lineTo(-s * 0.02, -s * 0.05); g.closePath(); g.fillStyle = "#f4efe4"; g.fill(); outline(g, s);
    const r = 0.36 * (1 - used * 0.7); g.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; g.arc(Math.cos(a) * r * 0.5 * s, -s * 0.22 + Math.sin(a) * r * 0.45 * s, r * 0.5 * s, 0, Math.PI * 2); }
    g.fillStyle = "#ff9ccb"; g.fill(); } },
  tee: { name: "Tour tee", kind: "wear", draw(g, s) {
    g.beginPath(); g.moveTo(-s * 0.18, -s * 0.42); g.lineTo(-s * 0.48, -s * 0.28); g.lineTo(-s * 0.38, -s * 0.06); g.lineTo(-s * 0.3, -s * 0.12); g.lineTo(-s * 0.3, s * 0.46); g.lineTo(s * 0.3, s * 0.46);
    g.lineTo(s * 0.3, -s * 0.12); g.lineTo(s * 0.38, -s * 0.06); g.lineTo(s * 0.48, -s * 0.28); g.lineTo(s * 0.18, -s * 0.42); g.quadraticCurveTo(0, -s * 0.3, -s * 0.18, -s * 0.42); g.closePath();
    g.fillStyle = "#ff5fa8"; g.fill(); outline(g, s); g.fillStyle = "#ffd36e"; g.font = `bold ${s * 0.085}px sans-serif`; g.textAlign = "center"; g.fillText("THE", 0, s * 0.02); g.fillText("PURRANCERS", 0, s * 0.13); } },
  glow: { name: "Glow stick", kind: "hold", draw(g, s, used, t = 0) { const col = `hsl(${(t * 60) % 360} 100% 65%)`;
    g.save(); g.shadowColor = col; g.shadowBlur = s * 0.35; rr(g, -s * 0.05, -s * 0.48, s * 0.1, s * 0.96, s * 0.05); g.fillStyle = col; g.fill(); g.restore(); rr(g, -s * 0.05, -s * 0.48, s * 0.1, s * 0.96, s * 0.05); outline(g, s); } },
  cap: { name: "Tour cap", kind: "wear", draw(g, s) {
    g.beginPath(); g.arc(0, s * 0.05, s * 0.36, Math.PI, 0); g.closePath(); g.fillStyle = "#ff5fa8"; g.fill(); outline(g, s);
    g.beginPath(); g.ellipse(s * 0.22, s * 0.08, s * 0.32, s * 0.08, 0, 0, Math.PI * 2); g.fillStyle = "#d9437f"; g.fill(); outline(g, s);
    g.beginPath(); g.arc(0, -s * 0.31, s * 0.04, 0, Math.PI * 2); g.fillStyle = "#ffd36e"; g.fill(); } },
};

/* the stands round the concourse (angle: radians round the bowl, 0 straight back from the stage) */
export const STANDS = [
  { key: "food", a: -0.78, title: "Purrfect Bites", colours: ["#ff7fb5", "#ffd36e"], items: ["donut", "pizza", "taco"] },
  { key: "drinks", a: -0.26, title: "Catnip Bar", colours: ["#7fe6ff", "#c38bff"], items: ["cola", "shake", "water"] },
  { key: "snacks", a: 0.26, title: "Snack Shack", colours: ["#ffd36e", "#ff9a3a"], items: ["popcorn", "crackers", "candy"] },
  { key: "merch", a: 0.78, title: "The Purrancers Merch", colours: ["#ff5fa8", "#ffd36e"], items: ["tee", "glow", "cap"] },
];

/* a small canvas with one item on it, for the counters */
export function itemCanvas(key, px = 256) { const c = Object.assign(document.createElement("canvas"), { width: px, height: px }), g = c.getContext("2d");
  g.translate(px / 2, px / 2); ITEMS[key].draw(g, px * 0.8, 0, 0); return c; }
