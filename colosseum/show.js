/* The walkable Colosseum's show (2026-11-24, his decision: "the walkable version can match the way the sphere works, the full rock remix of the song
   starting when you enter"; plan: COLOSSEUM-PLAN.md). The door, the song, the clock and the programme, as the 3D show does them (prancer-band
   show.js, read, not edited): the door's button plays the song's audio element, the show's clock is that audio's own currentTime, and a sound gate
   asks for one more tap if the click was spent. The venue performs on that clock: The Purrancers through the whole song (data/band-song-remix.json),
   the beam fights through it, the joust passing on the choruses and the outro, the crowd's cheer following the sections. At the end the crowd
   applauds and the door comes back: Enter again to start over.
     startShow({ THREE, arena, ACT, cam, renderer, song: url, setCheer })   (arena.html ?walk=1)
   Milestone one: the spectator stands at the south rail and looks round by dragging. The walk is the next milestone. */
export function startShow({ THREE, arena, cam, renderer, song, setCheer, title = "The Colosseum", beta = "beta" }) {
  /* the page follows its window (a phone turned, a window resized, a page opened while hidden): the drawing size and the camera's shape */
  const fit = () => { const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight); renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  addEventListener("resize", fit); if (window.visualViewport) visualViewport.addEventListener("resize", fit); fit();
  renderer.domElement.style.touchAction = "none"; document.title = title;
  const SECTIONS = [["intro", 0, 0.35], ["verse", 30.0, 0.5], ["chorus", 45.5, 0.95], ["verse", 65.9, 0.55], ["chorus", 86.4, 1], ["break", 127.1, 0.6], ["verse", 169.3, 0.6], ["outro", 192.0, 1], ["ending", 207.4, 0.9]];
  const JOUST = [46.0, 56.0, 88.0, 99.0, 110.0, 121.0, 193.0, 200.5], PASS = 6.5;   // each pass: the knights at the lists' ends, then the charge (they meet 2.8 s in)
  const section = (t) => SECTIONS.filter((s) => s[1] <= t).at(-1) || SECTIONS[0];
  /* the schedule: each act's own time from the song's (null: not stepped) */
  const schedule = (name, t) => { if (name === "joust") { const p = JOUST.filter((s) => s <= t).at(-1); return p === undefined || t - p > PASS ? 0 : t - p; } return t; };
  /* the door */
  const css = document.createElement("style"); css.textContent = `
    #door{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(circle at 50% 40%,rgba(40,20,50,.55),rgba(10,6,14,.92));color:#f6f2ee;font-family:Helvetica,Arial,sans-serif;z-index:10;text-align:center;padding:16px}
    #door h1{margin:0;font-size:clamp(34px,7vw,68px);letter-spacing:.04em}#door .b{font-size:14px;letter-spacing:.2em;text-transform:uppercase;opacity:.75}
    #door p{margin:0;max-width:34em;opacity:.85;line-height:1.45}#door p.s{font-size:14px;opacity:.7}#door button,#gate{font:600 20px Helvetica,Arial,sans-serif;padding:14px 34px;border-radius:999px;border:0;background:#ffd36e;color:#1c1622;cursor:pointer}
    #gate{position:fixed;left:50%;bottom:40px;transform:translateX(-50%);z-index:11}#door[hidden],#gate[hidden]{display:none}`;   /* (a display rule beats the hidden attribute: said again for hidden) */
  document.head.appendChild(css);
  const door = document.createElement("div"); door.id = "door";
  door.innerHTML = `<div class="b">${beta}</div><h1>Explore the Colosseum</h1><p>The Purrancers on the centre stage, a joust on every chorus.</p><p class="s">For now you watch from the stands: drag to look around. Walking the building opens soon. Sound on.</p><button id="enter">Enter</button>`;
  document.body.appendChild(door);
  const audio = new Audio(song); audio.preload = "auto"; audio.crossOrigin = "anonymous";
  const gate = document.createElement("button"); gate.id = "gate"; gate.textContent = "Tap for sound"; gate.hidden = true; document.body.appendChild(gate);
  let live = false;
  let AC = null, GAIN = null;   // (an iPhone ignores audio.volume: the song goes through a GainNode, made inside the Enter tap, as the Lounge learned)
  door.querySelector("#enter").onclick = async () => { door.hidden = true; live = true; audio.currentTime = 0;
    try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); GAIN = AC.createGain(); AC.createMediaElementSource(audio).connect(GAIN).connect(AC.destination); } await AC.resume(); } catch (e) { /* plain audio element then */ }
    try { await audio.play(); } catch (e) { gate.hidden = false; await new Promise((r) => gate.addEventListener("click", r, { once: true })); gate.hidden = true; await audio.play().catch(() => {}); } };
  audio.addEventListener("ended", () => { live = false; door.querySelector("p").textContent = "Thank you for coming. Enter again to hear it from the start."; door.querySelector("p.s").hidden = true; door.querySelector("#enter").textContent = "Enter again"; door.hidden = false; });
  /* the spectator's place at the south rail; drag to look round */
  const EYE = new THREE.Vector3(0, 15, 53), V = { yaw: Math.PI, pitch: -0.32 }; let drag = null;   // (standing at the back of the lower bowl, above the seated crowd's heads: the place at the rail comes with the walk) let drag = null;
  addEventListener("pointerdown", (e) => { drag = [e.clientX, e.clientY]; }); addEventListener("pointerup", () => { drag = null; });
  addEventListener("pointermove", (e) => { if (!drag) return; V.yaw -= (e.clientX - drag[0]) * 0.004; V.pitch = Math.max(-0.7, Math.min(0.5, V.pitch - (e.clientY - drag[1]) * 0.004)); drag = [e.clientX, e.clientY]; });
  cam.fov = 55; cam.updateProjectionMatrix();
  /* the shadows redrawn every third frame (the sun is still; the cats' shadows move at 20 a second), and a quality that lowers itself: slow frames
     for two seconds shrink the picture a step (to 0.6 at least), and it grows back only after five quiet seconds (the Lounge's rule) */
  renderer.shadowMap.autoUpdate = false; let n = 0, last = performance.now(), ema = 16, slowSince = 0, quietSince = 0, ratio = 1;
  const govern = (ms) => { const now = performance.now(); ema = ema * 0.9 + ms * 0.1;
    if (ema > 20) { quietSince = 0; if (!slowSince) slowSince = now; else if (now - slowSince > 2000 && ratio > 0.6) { ratio = Math.max(0.6, ratio - 0.15); renderer.setPixelRatio(ratio); fit(); slowSince = now; } }
    else if (ema < 13) { slowSince = 0; if (!quietSince) quietSince = now; else if (now - quietSince > 5000 && ratio < 1) { ratio = Math.min(1, ratio + 0.15); renderer.setPixelRatio(ratio); fit(); quietSince = now; } }
    else { slowSince = 0; quietSince = 0; } };
  function frame() { const now = performance.now(); govern(now - last); last = now; if (n++ % 3 === 0) renderer.shadowMap.needsUpdate = true;
    const t = live ? audio.currentTime : 0, s = section(t);
    setCheer(live ? s[2] : 0.2);
    cam.position.copy(EYE); cam.lookAt(EYE.x + Math.sin(V.yaw) * Math.cos(V.pitch), EYE.y + Math.sin(V.pitch), EYE.z + Math.cos(V.yaw) * Math.cos(V.pitch));
    arena.at(t); requestAnimationFrame(frame); }
  frame();
  return { schedule, audio, section, gain: () => GAIN };
}
