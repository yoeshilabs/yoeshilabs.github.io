

export function startShow({ THREE, arena, cam, renderer, song, setCheer, walk = null, tok = null, title = "The Colosseum", beta = "beta" }) {
  const C = tok ? tok.COLOR : { night: "#1c1622", gold: "#ffd36e", ink: "#f6f2ee", pink: "#ff5fa8" }, UI = tok ? tok.TYPE.ui : "Helvetica,Arial,sans-serif", DISPLAY = tok ? tok.TYPE.display : UI, NIGHT_A = tok ? tok.alpha("night", "panel") : "rgba(10,6,14,.92)";    
  let WALK = null; if (walk) walk.then((w) => { WALK = w; }).catch((e) => { console.error("the walk did not load", e);    
    const n = document.createElement("div"); n.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);padding:8px 14px;border-radius:10px;background:" + NIGHT_A + ";color:" + C.ink + ";font:14px " + UI + ";z-index:3";
    n.textContent = "Walking could not load in this browser. You can watch the show from the stands: drag to look around."; document.body.appendChild(n); });    
   
  const fit = () => { const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight); renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  addEventListener("resize", fit); if (window.visualViewport) visualViewport.addEventListener("resize", fit); fit();
  renderer.domElement.style.touchAction = "none"; document.title = title;
  const SECTIONS = [["intro", 0, 0.35], ["verse", 30.0, 0.5], ["chorus", 45.5, 0.95], ["verse", 65.9, 0.55], ["chorus", 86.4, 1], ["break", 127.1, 0.6], ["verse", 169.3, 0.6], ["outro", 192.0, 1], ["ending", 207.4, 0.9]];
  const JOUST = [46.0, 56.0, 88.0, 99.0, 110.0, 121.0, 193.0, 200.5], PASS = 6.5;    
  const section = (t) => SECTIONS.filter((s) => s[1] <= t).at(-1) || SECTIONS[0];
   
  const schedule = (name, t) => { if (name === "joust") { const p = JOUST.filter((s) => s <= t).at(-1); return p === undefined || t - p > PASS ? 0 : t - p; } return t; };
   
  const css = document.createElement("style"); css.textContent = `
    #door{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(circle at 50% 40%,${tok ? tok.alpha("night", 0.55) : "rgba(40,20,50,.55)"},${NIGHT_A});color:${C.ink};font-family:${UI};z-index:10;text-align:center;padding:16px}
    #door h1{margin:0;font-size:clamp(46px,9vw,92px);font-weight:400;letter-spacing:.03em;color:${C.gold};font-family:${DISPLAY}}#door .b{font-size:14px;letter-spacing:.2em;text-transform:uppercase;opacity:.75}
    #door p{margin:0;max-width:34em;opacity:.85;line-height:1.45}#door p.s{font-size:14px;opacity:.7}#door button,#gate{font:${tok && tok.WEIGHT ? tok.WEIGHT.control : 600} 20px ${UI};padding:14px 34px;border-radius:999px;border:0;background:${C.gold};color:${C.night};cursor:pointer}
    #gate{position:fixed;left:50%;bottom:40px;transform:translateX(-50%);z-index:11}#door[hidden],#gate[hidden]{display:none}`;    
  document.head.appendChild(css);
  const door = document.createElement("div"); door.id = "door";
  door.innerHTML = `<div class="b">${beta}</div><h1>Explore the Colosseum</h1><p>The Purrancers on the center stage, a joust on every chorus. You come in as a cat of your own, at the mouth of an aisle.</p><p class="s">W A S D to walk, Shift to run, click and move the mouse to look, You see through your cat's eyes; C or V steps out behind it. Walk down the stair to the ring corridor: it runs all the way round, with an aisle up to the stands in every section, a gate out to the plaza on every side, and a glass lift at each corner up to the concourse and its food stalls (E takes it). More of the building opens as it is finished. Sound on.</p><button id="enter">Enter</button>`;
  document.body.appendChild(door); document.getElementById("cover")?.remove(); window.__arrival?.done();    
  const audio = new Audio(song); audio.preload = "auto"; audio.crossOrigin = "anonymous";
  const gate = document.createElement("button"); gate.id = "gate"; gate.textContent = "Tap for sound"; gate.hidden = true; document.body.appendChild(gate);
  let live = false;
  let AC = null, GAIN = null;    
  door.querySelector("#enter").onclick = async () => { door.hidden = true; live = true; audio.currentTime = 0;
    try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); GAIN = AC.createGain(); AC.createMediaElementSource(audio).connect(GAIN).connect(AC.destination); } await AC.resume(); } catch (e) {   }
     
    try { await audio.play(); setTimeout(() => { if (live && audio.paused) audio.play().catch(() => { gate.hidden = false; }); }, 600); } catch (e) { gate.hidden = false; await new Promise((r) => gate.addEventListener("click", r, { once: true })); gate.hidden = true; await audio.play().catch(() => {}); } };
  audio.addEventListener("ended", () => { live = false; door.querySelector("p").textContent = "Thank you for coming. Enter again to hear it from the start."; door.querySelector("p.s").hidden = true; door.querySelector("#enter").textContent = "Enter again"; door.hidden = false; });
   
  const EYE = new THREE.Vector3(0, 15, 53), V = { yaw: Math.PI, pitch: -0.32 }; let drag = null;    
  addEventListener("pointerdown", (e) => { if (!WALK) drag = [e.clientX, e.clientY]; }); addEventListener("pointerup", () => { drag = null; });
  addEventListener("pointermove", (e) => { if (!drag) return; V.yaw -= (e.clientX - drag[0]) * 0.004; V.pitch = Math.max(-0.7, Math.min(0.5, V.pitch - (e.clientY - drag[1]) * 0.004)); drag = [e.clientX, e.clientY]; });
  cam.fov = 55; cam.updateProjectionMatrix();
  

  renderer.shadowMap.autoUpdate = false; let n = 0, last = performance.now(), ema = 16, slowSince = 0, quietSince = 0, ratio = 1;
  const govern = (ms) => { const now = performance.now(); ema = ema * 0.9 + ms * 0.1;
    if (ema > 20) { quietSince = 0; if (!slowSince) slowSince = now; else if (now - slowSince > 2000 && ratio > 0.6) { ratio = Math.max(0.6, ratio - 0.15); renderer.setPixelRatio(ratio); fit(); slowSince = now; } }
    else if (ema < 13) { slowSince = 0; if (!quietSince) quietSince = now; else if (now - quietSince > 5000 && ratio < 1) { ratio = Math.min(1, ratio + 0.15); renderer.setPixelRatio(ratio); fit(); quietSince = now; } }
    else { slowSince = 0; quietSince = 0; } };
  function frame() { const now = performance.now(); govern(now - last); last = now; if (n++ % 3 === 0) renderer.shadowMap.needsUpdate = true;
    const t = live ? audio.currentTime : 0, s = section(t);
    setCheer(live ? s[2] : 0.2);
    if (WALK && live) WALK.frame(now); else { cam.position.copy(EYE); cam.lookAt(EYE.x + Math.sin(V.yaw) * Math.cos(V.pitch), EYE.y + Math.sin(V.pitch), EYE.z + Math.cos(V.yaw) * Math.cos(V.pitch)); }
    arena.at(t); requestAnimationFrame(frame); }
  frame();
  return { schedule, audio, section, gain: () => GAIN, get walk() { return WALK; } };
}
