

export const TICK = 1 / 60, WALK = 0.62, RUN = 1.5, JUMP = 2.7, FALL = 7.2, TURN = 5, LAND = 3.5, STICK_DEAD = 0.12;
export const MOVES = { Digit1: "wave", Digit2: "pawsup", Digit3: "dance", Digit4: "clap", Digit5: "heart", Digit6: "spin" }, LEN = { wave: 2.6, pawsup: 3, dance: 6, clap: 3, heart: 3, spin: 1.6 };
const CODES = ["KeyW", "KeyS", "KeyA", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight", "Space", "KeyE", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6"];
export const bitsOf = (keys) => { let b = 0; CODES.forEach((c, i) => { if (keys.has(c)) b |= 1 << i; }); return b; };
export const keysOf = (bits) => new Set(CODES.filter((c, i) => bits & (1 << i)));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function makePlayer({ at = {}, scale = 0.133, lift = 0, ground = () => 0, may = () => true, solids = () => [], jumpOnce = false } = {}) {
  const me = { x: at.x || 0, z: at.z || 0, y: 0, vy: 0, air: false, face: at.face ?? Math.PI, shown: at.face ?? Math.PI, emote: null, e0: 0, walking: false, t: 0, phase: 0, land: 0, wasAir: false, lastX: null, lastZ: null, held: 0, seat: null };
  me.y = ground(me.x, me.z);
  function tick(input = {}) {
    const keys = typeof input.keys === "number" ? keysOf(input.keys) : input.keys || new Set(), yaw = input.yaw || 0, pace = input.pace ?? 1, dt = TICK, has = (c) => keys.has(c);
    const bits = bitsOf(keys), fresh = bits & ~me.held; me.held = bits; me.t += dt; let use = false, landed = false;
    if (me.seat) {    
      const h = input.hold || me.seat; me.x = h.x; me.y = h.y; me.z = h.z; me.face = me.shown = h.yaw; me.air = false; me.vy = 0; me.lastX = me.x; me.lastZ = me.z; me.wasAir = false; me.land = 0;
      use = !!(fresh & (1 << CODES.indexOf("KeyE")));
      return { x: me.x, y: me.y, z: me.z, yaw: me.shown, t: me.t, speed: 0, phase: 0, air: 0, vy: 0, land: 0, emote: h.emote || null, emoteT: h.emoteT || 0, emoteLen: h.emoteLen || 1e6, lookX: 0, lookY: 0, use, landed, mode: "seat" }; }
     
    for (const [code, name] of Object.entries(MOVES)) if (fresh & (1 << CODES.indexOf(code))) { me.emote = name; me.e0 = me.t; }
     
    me.walking = false; let f = (has("KeyW") || has("ArrowUp") ? 1 : 0) - (has("KeyS") || has("ArrowDown") ? 1 : 0), r = (has("KeyD") || has("ArrowRight") ? 1 : 0) - (has("KeyA") || has("ArrowLeft") ? 1 : 0), push = 1, ran = false;
    

    if (!f && !r && input.move) { const m = Math.hypot(input.move.x, input.move.y); if (m > STICK_DEAD) { r = input.move.x; f = input.move.y; ran = m > 0.9; push = ran ? 1 : Math.max(0.4, Math.min(1, m / 0.8)); } }
    if (f || r) { const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = -Math.cos(yaw), rz = Math.sin(yaw), l = Math.hypot(f, r), shift = has("ShiftLeft") || has("ShiftRight"), fast = ran || (input.run ? !shift : shift),     sp = (fast ? RUN : WALK * push) * dt * pace; me.walking = !fast;
      let nx = me.x + (fx * f + rx * r) / l * sp, nz = me.z + (fz * f + rz * r) / l * sp; me.face = Math.atan2(fx * f + rx * r, fz * f + rz * r); me.emote = null;
      for (const [sx, sz, sr] of solids()) { const d = Math.hypot(nx - sx, nz - sz), m = sr + 0.14; if (d < m && d > 1e-4) { nx = sx + (nx - sx) / d * m; nz = sz + (nz - sz) / d * m; } }
      if (may(nx, nz)) { me.x = nx; me.z = nz; } else if (may(nx, me.z)) me.x = nx; else if (may(me.x, nz)) me.z = nz; }
    const g = ground(me.x, me.z);
    const jmp = has("Space") || !!input.jump, jgo = jumpOnce ? jmp && !me.jheld : jmp; me.jheld = jmp;    
    if (jgo && !me.air) { me.air = true; me.vy = JUMP; me.emote = null; }
    if (me.air) { me.vy -= FALL * dt; me.y += me.vy * dt; if (me.y <= g) { me.y = g; me.air = false; me.vy = 0; } } else me.y = g;
    if (me.emote && me.t - me.e0 > LEN[me.emote]) me.emote = null;
    use = !!(fresh & (1 << CODES.indexOf("KeyE"))) && !me.air;
    

    me.shown += clamp(Math.atan2(Math.sin(me.face - me.shown), Math.cos(me.face - me.shown)), -TURN * dt, TURN * dt);
    const v = me.lastX === null ? 0 : Math.hypot(me.x - me.lastX, me.z - me.lastZ) / dt / scale; me.lastX = me.x; me.lastZ = me.z;
    const spd = me.emote ? undefined : me.walking && !me.air ? 1 : undefined, speed = spd !== undefined ? spd : me.air ? 1 : v < 0.05 ? 0 : v <= 2.8 ? v / 2.8 : 1 + (v - 2.8) / 3.4;
    me.phase += dt * Math.min(30, v * 2.3 + (speed > 1 ? 1.5 : 0));
    if (me.wasAir && !me.air) { me.land = 1; landed = true; } me.wasAir = me.air; me.land = Math.max(0, me.land - dt * LAND);
    const e = me.emote ? { emote: me.emote, emoteT: me.t - me.e0, emoteLen: LEN[me.emote] } : { emote: null, emoteT: 0, emoteLen: 0 }, base = { x: me.x, y: me.y + lift, z: me.z, yaw: me.shown, t: me.t, lookX: 0, lookY: 0, use, landed, mode: "walk", ...e };
    return !me.air && speed === 0 ? { ...base, speed: 0, phase: 0, air: 0, vy: 0, land: 0 }    
      : { ...base, speed: me.air ? 0.6 : speed, phase: me.phase, air: me.air ? 1 : 0, vy: me.vy / scale, land: me.land };
  }
  return { tick,
    sit(hold) { me.seat = { ...hold }; me.emote = null; me.air = false; me.vy = 0; },
    stand(p) { me.seat = null; me.x = p.x; me.z = p.z; me.y = ground(p.x, p.z); me.face = me.shown = p.face ?? me.shown; me.lastX = me.x; me.lastZ = me.z; me.phase = 0; },
    get seated() { return !!me.seat; }, get state() { return JSON.parse(JSON.stringify(me)); }, restore(s) { Object.assign(me, JSON.parse(JSON.stringify(s))); } };
}
