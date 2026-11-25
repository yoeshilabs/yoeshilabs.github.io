

export const stickVector = (dx, dy, radius = 50) => ({ x: Math.max(-1, Math.min(1, dx / radius)), y: -Math.max(-1, Math.min(1, dy / radius)) });    

 
export function steerTo(point, me, yaw, reach = 0.25, push = 0.8) {
  const dx = point.x - me.x, dz = point.z - me.z, d = Math.hypot(dx, dz); if (d < reach) return null;
  const s = Math.sin(yaw), c = Math.cos(yaw); return { x: (-c * dx + s * dz) / d * push, y: (s * dx + c * dz) / d * push };
}

export function makeStick({ parent = document.body, side = "left", bottom = 70, size = 120, show = "touch" } = {}) {
  const el = document.createElement("div"), nub = document.createElement("i"), k = size / 120, touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  el.style.cssText = `position:fixed;${side}:22px;bottom:${bottom}px;width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,246,232,.1);border:1px solid rgba(255,246,232,.25);touch-action:none;z-index:2;display:${show === true || (show === "touch" && touch) ? "block" : "none"}`;
  nub.style.cssText = `position:absolute;left:${40 * k}px;top:${40 * k}px;width:${40 * k}px;height:${40 * k}px;border-radius:50%;background:rgba(255,215,106,.7)`; el.appendChild(nub); parent.appendChild(el);
  let id = null, v = { x: 0, y: 0 }, target = null;
  const set = (e) => { const r = el.getBoundingClientRect(); v = stickVector(e.clientX - r.left - size / 2, e.clientY - r.top - size / 2, 50 * k); nub.style.transform = `translate(${v.x * 34 * k}px, ${-v.y * 34 * k}px)`; target = null; };
  const down = (e) => { id = e.pointerId; el.setPointerCapture(id); set(e); }, move = (e) => { if (e.pointerId === id) set(e); }, up = () => { id = null; v = { x: 0, y: 0 }; nub.style.transform = ""; };
  el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  return { el,
    input(me, yaw) { if (id !== null || Math.hypot(v.x, v.y) > 0.1) return v; if (!target) return { x: 0, y: 0 };
      const m = steerTo(target.point, me, yaw, target.reach); if (m) return m; const done = target.arrived; target = null; if (done) done(); return { x: 0, y: 0 }; },
    goTo(point, reach = 0.25, arrived = null) { target = { point: { x: point.x, z: point.z }, reach, arrived }; }, stop() { target = null; },
    get busy() { return id !== null || !!target; },
    dispose() { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.remove(); } };
}
