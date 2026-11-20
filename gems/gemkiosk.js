/* A little teia.art on the stage, where the Jukebox stood (Yoeshi, 2026-11-20: "where the jukebox is, we can instead create a little virtual
   teia.art interface", then, after walking it: "we can go bigger and grander with the teia interface, it could literally be an all in one place
   to browse the events mints as they go live. instead of being a repeat of whats around the room, make it actually teia.art"). Our own browser
   in Teia's style, read only, live from Teia's indexer:
   - the screen in the room shows the newest mints under the events' tags (the theme's event when a work is tapped), and tapping it opens
   - the browser: a panel over the room with a tab for every event, each mint whole at its own shape, its title exactly as minted, who made it,
     its editions and when it was minted, and "View on teia.art" (a new tab) to collect it there.
   Rules it keeps: no prices or sales anywhere (nothing financial is even asked of the indexer); titles as minted; works contained, never
   cropped; everything about a mint from the indexer; no wallet, no forms. Teia's own moderation lists apply as on teia.art: restricted and
   under-review accounts and restricted objkts are left out, mature work is left out, flashing work shows as a still with a note.
   Load: one query when the room loads, one when the browser opens, then every 60 s while it is open; nothing while it is closed.

   gem.js imports this through the gem file's paths:
     makeKiosk({ THREE, works, logo, conf }) -> { group, screen, update(T), setTheme(colors | null), select(i), pick(uv) -> -1, open(), close(), isOpen }
   conf is the gem file's "kiosk" object; its events name each work's tags (from the posters and Mal's timeline). */
const API = "https://teztok.teia.rocks/v1/graphql", IPFS = "https://cache.teia.rocks/ipfs/", LISTS = "https://lists.teia.art/", HEN = "KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton";
const EVENTS = [   /* used only when the gem file names none */
  { work: "ZERO on Teia", tags: ["ZEROonTeia"] }, { work: "Teia Onboarder", tags: ["TeiaOnboarder"] }, { work: "Letters To The Machine", tags: ["LTTMTeia"] },
  { work: "Teia Africa: Sip and Paint", tags: ["TeiaAfrica"] }, { work: "Circus Maximus", tags: ["PostAmericana"] }, { work: "The Wall Today", tags: ["TheWallToday", "XmassClash"] }, { work: "Cross Pollination", tags: ["CrossPollination"] }, { work: "26POV", tags: ["26POV"] }];
const FONT = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const TZ = /^(tz[1-4]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/, cid = (u) => { const m = typeof u === "string" && u.match(/^ipfs:\/\/([A-Za-z0-9]{40,80})(\/[\w.\-\/%]*)?$/); return m ? IPFS + m[1] + (m[2] || "") : ""; };
const short = (a) => (TZ.test(a || "") ? a.slice(0, 5) + "…" + a.slice(-4) : "");
const when = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); };

export function makeKiosk({ THREE, works, logo, conf }) {
  const list = (works || []).slice(0, 8);
  const EV = ((conf && Array.isArray(conf.events) && conf.events.length ? conf.events : EVENTS)).map((e) => ({ work: String(e.work || ""), tags: (Array.isArray(e.tags) ? e.tags : []).map(String).filter((t) => /^[\w-]{1,40}$/.test(t)) }))
    .filter((e) => e.tags.length).map((e) => ({ ...e, i: list.findIndex((w) => w.title === e.work), low: e.tags.map((t) => t.toLowerCase()) })).map((e) => ({ ...e, w: list[e.i] || null }));
  const ALLTAGS = [...new Set(EV.flatMap((e) => e.tags))];
  /* ---- the data: one query for every event's tags; Teia's moderation lists once */
  const D = { tokens: [], at: 0, busy: null, mod: null };
  const mod = () => (D.mod ??= Promise.all(["restricted.json", "under_review.json", "restricted_objkt.json", "nsfw.json", "photosensitive.json"].map((f) => fetch(LISTS + f).then((r) => (r.ok ? r.json() : [])).catch(() => [])))
    .then(([a, b, o, n, p]) => ({ wallet: new Set([...a, ...b].map(String)), objkt: new Set(o.map(String)), nsfw: new Set(n.map(String)), flash: new Set(p.map(String)) })));
  /* (the tags are plain words, checked above, so they sit in the query as they are) */
  const Q = `{ tokens(where: { fa2_address: { _eq: "${HEN}" }, editions: { _gt: 0 }, tags: { _or: [${ALLTAGS.map((t) => `{ tag: { _ilike: "${t}" } }`).join(", ")}] } }, order_by: { minted_at: desc }, limit: 240) {
    token_id name description editions minted_at mime_type thumbnail_uri display_uri artist_address artist_profile { name } teia_meta { content_rating accessibility } tags { tag } } }`;
  let filmed = false;   /* a film freezes the data once it has it, so every take is the same */
  const load = () => (filmed && D.at ? Promise.resolve() : D.busy ??= (async () => { try {
      const m = await mod(), r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: Q }) });
      const j = await r.json(), T = (j && j.data && j.data.tokens) || [];
      D.tokens = T.filter((t) => t && /^\d+$/.test(String(t.token_id)) && !m.wallet.has(t.artist_address) && !m.objkt.has(String(t.token_id)) && !m.nsfw.has(String(t.token_id)) && !(t.teia_meta && t.teia_meta.content_rating === "mature"))
        .map((t) => { const tags = (t.tags || []).map((x) => String(x.tag || "").toLowerCase()), hz = t.teia_meta && t.teia_meta.accessibility && t.teia_meta.accessibility.hazards;
          return { id: String(t.token_id), name: typeof t.name === "string" ? t.name : "", about: typeof t.description === "string" ? t.description.slice(0, 2000) : "", editions: +t.editions || 0, at: t.minted_at, mime: String(t.mime_type || ""),
            thumb: cid(t.display_uri) || cid(t.thumbnail_uri), still: cid(t.thumbnail_uri), artist: TZ.test(t.artist_address || "") ? t.artist_address : "", by: (t.artist_profile && typeof t.artist_profile.name === "string" && t.artist_profile.name.trim()) || short(t.artist_address),
            flash: m.flash.has(String(t.token_id)) || (Array.isArray(hz) && hz.includes("flashing")), ev: EV.map((e, k) => (e.low.some((x) => tags.includes(x)) ? k : -1)).filter((k) => k >= 0) }; });
      D.at = Date.now(); screenDirty = true; if (ui) ui.render();
    } catch (e) { D.err = true; if (ui) ui.render(); } finally { D.busy = null; } })());
  const of = (k) => (k < 0 ? D.tokens : D.tokens.filter((t) => t.ev.includes(k)));

  /* ---- the screen in the room: the newest mints, nine at a time */
  const W = 1920, H = 1080, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  let accent = "#ffffff", sel = -1, last = -1, screenDirty = true, page = 0, pageT = 0;
  const pics = new Map(), pic = (u) => { if (!u) return null; if (!pics.has(u)) { const im = new Image(); im.crossOrigin = "anonymous"; im.decoding = "async"; im.onload = () => { screenDirty = true; }; im.src = u; pics.set(u, im); } return pics.get(u); };
  const fit = (s, max, font) => { g.font = font; if (g.measureText(s).width <= max) return s; while (s.length > 1 && g.measureText(s + "…").width > max) s = s.slice(0, -1); return s + "…"; };
  const curEv = () => EV.findIndex((e) => e.i === sel && sel >= 0);
  /* wide, to fill the arch behind the dais: a header, then ten mints in two rows of five, then the bar that asks for a tap */
  const draw = (T) => {
    g.fillStyle = "#0a0a0a"; g.fillRect(0, 0, W, H);
    let lx = 36; if (logo && (logo.naturalWidth || logo.width)) { const lw = logo.naturalWidth || logo.width, lh = logo.naturalHeight || logo.height, h = 110; g.drawImage(logo, 36, 30, h * lw / lh, h); lx += h * lw / lh + 30; }
    const k = curEv(), e = EV[k], toks = of(k);
    g.textBaseline = "middle"; g.fillStyle = "#f2f2f2"; g.fillText(fit(e ? e.work : "Teia winter events", W - lx - 300, `700 52px ${FONT}`), lx, 66);
    g.fillStyle = accent; g.fillText(fit((e ? e.tags : ALLTAGS).map((t) => "#" + t).join("  "), W - lx - 300, `400 30px ${FONT}`), lx, 120);
    g.fillStyle = "#f2f2f2"; g.font = `600 44px ${FONT}`; g.textAlign = "right"; g.fillText("teia.art", W - 36, 66); g.fillStyle = "#9a9a9a"; g.font = `400 24px ${FONT}`; g.fillText("live mints · beta", W - 36, 116); g.textAlign = "left";
    g.fillStyle = "#2a2a2a"; g.fillRect(36, 166, W - 72, 2);
    const PER = 10, pages = Math.max(1, Math.ceil(toks.length / PER)), p = page % pages, CW = (W - 72 - 4 * 20) / 5, CH = 350;
    if (!toks.length) { g.fillStyle = "#9a9a9a"; g.font = `400 40px ${FONT}`; g.fillText(D.at ? "No mints under this tag yet" : D.err ? "Teia's indexer did not answer" : "Loading the newest mints…", 36, 260); }
    toks.slice(p * PER, p * PER + PER).forEach((t, i) => { const x = 36 + (i % 5) * (CW + 20), y = 190 + Math.floor(i / 5) * (CH + 18), im = pic(t.flash ? t.still : t.thumb), IH = CH - 80;
      g.fillStyle = "#151515"; g.fillRect(x, y, CW, IH);
      if (im && im.complete && im.naturalWidth) { const s = Math.min((CW - 12) / im.naturalWidth, (IH - 12) / im.naturalHeight), iw = im.naturalWidth * s, ih = im.naturalHeight * s; g.drawImage(im, x + (CW - iw) / 2, y + (IH - ih) / 2, iw, ih); }
      g.fillStyle = "#f2f2f2"; g.textBaseline = "alphabetic"; g.fillText(fit(t.name || "Untitled", CW, `700 26px ${FONT}`), x, y + IH + 34);
      g.fillStyle = "#9a9a9a"; g.fillText(fit(t.by, CW, `400 22px ${FONT}`), x, y + IH + 66); g.textBaseline = "middle"; });
    /* few mints yet: the rest of the screen tells the event, from its plaque */
    if (e && e.w && e.w.about && toks.length <= 5) { const y0 = toks.length ? 190 + CH + 40 : 230, words = e.w.about.split(/\s+/), lines = []; let ln = ""; g.font = `400 38px ${FONT}`;
      for (const w of words) { const t = ln ? ln + " " + w : w; if (g.measureText(t).width > W - 72 && ln) { lines.push(ln); ln = w; } else ln = t; } if (ln) lines.push(ln);
      g.fillStyle = accent; g.fillRect(36, y0, 6, Math.min(5, lines.length) * 54 + 6); g.fillStyle = "#e8e8e8"; lines.slice(0, 5).forEach((l, j) => g.fillText(l, 64, y0 + 30 + j * 54)); }
    g.fillStyle = accent; g.fillRect(0, H - 120, W, 120); g.fillStyle = lum(accent) > 140 ? "#0a0a0a" : "#ffffff"; g.font = `700 44px ${FONT}`; g.textAlign = "left";
    g.fillText("Tap to browse the events' mints", 36, H - 60); g.font = `400 28px ${FONT}`; g.textAlign = "right"; g.fillText(`${toks.length} mint${toks.length === 1 ? "" : "s"} · live from Teia${pages > 1 ? ` · page ${p + 1} of ${pages}` : ""}`, W - 36, H - 60); g.textAlign = "left";
    tex.needsUpdate = true; screenDirty = false;
  };
  function lum(h) { const n = parseInt(h.slice(1), 16); return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255); }
  function sat(h) { const n = parseInt(h.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); return mx ? (mx - mn) / mx * (mx / 255) : 0; }

  /* ---- the stand: a wide screen filling the arch on two posts, a lit frame round it and a teia.art marquee over it, both in the theme's colour */
  const group = new THREE.Group(), SW = 5.5, SH = SW * H / W, BASE = 0.75, CY = BASE + SH / 2 + 0.08;
  const dark = new THREE.MeshStandardMaterial({ color: 0x141018, roughness: 0.45, metalness: 0.6 }), trim = new THREE.MeshStandardMaterial({ color: 0x2a2433, roughness: 0.3, metalness: 0.8 });
  const add = (geo, mat, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.castShadow = true; group.add(m); return m; };
  add(new THREE.BoxGeometry(4.0, 0.14, 1.0), dark, [0, 0.07, 0]); for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.2, BASE + 0.4, 0.2), trim, [sx * 1.6, 0.14 + (BASE + 0.4) / 2 - 0.07, -0.08]);
  add(new THREE.BoxGeometry(SW + 0.16, SH + 0.16, 0.12), dark, [0, CY, -0.05]);
  const screen = add(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [0, CY, 0.02]); screen.castShadow = false;
  const lit = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), FR = 0.045;
  for (const [w, h, x, y] of [[SW + 0.3, FR, 0, CY + SH / 2 + 0.12], [SW + 0.3, FR, 0, CY - SH / 2 - 0.12], [FR, SH + 0.28, -SW / 2 - 0.13, CY], [FR, SH + 0.28, SW / 2 + 0.13, CY]]) add(new THREE.BoxGeometry(w, h, FR), lit, [x, y, 0.02]).castShadow = false;
  const mc = document.createElement("canvas"); mc.width = 1024; mc.height = 192; const mx = mc.getContext("2d"), mtex = new THREE.CanvasTexture(mc); mtex.colorSpace = THREE.SRGBColorSpace;
  const marquee = () => { mx.clearRect(0, 0, 1024, 192); mx.fillStyle = "#0a0a0a"; mx.beginPath(); mx.roundRect(4, 4, 1016, 184, 30); mx.fill(); mx.strokeStyle = accent; mx.lineWidth = 8; mx.stroke();
    for (let i = 0; i < 26; i++) { mx.fillStyle = i % 2 ? accent : "#fff6e8"; mx.beginPath(); mx.arc(40 + i * 37.7, 22, 6, 0, Math.PI * 2); mx.arc(40 + i * 37.7, 170, 6, 0, Math.PI * 2); mx.fill(); }
    mx.shadowColor = accent; mx.shadowBlur = 28; mx.fillStyle = "#ffffff"; mx.font = `700 104px ${FONT}`; mx.textAlign = "center"; mx.textBaseline = "middle"; mx.fillText("teia.art", 512, 100); mx.shadowBlur = 0; mtex.needsUpdate = true; };
  const sign = add(new THREE.PlaneGeometry(2.8, 0.525), new THREE.MeshBasicMaterial({ map: mtex, transparent: true, toneMapped: false }), [0, CY + SH / 2 + 0.48, 0.03]); sign.castShadow = false;
  marquee();

  /* ---- the browser: DOM over the room, Teia's dark look */
  let ui = null, poll = 0;
  const css = `#tk{position:fixed;inset:3vh 3vw;z-index:30;display:flex;flex-direction:column;background:#0a0a0a;color:#f2f2f2;font:14px/1.4 ${FONT};border:1px solid #333;border-radius:6px;box-shadow:0 20px 80px #000c;overflow:hidden}
    #tk a{color:inherit} #tk button{font:inherit;color:inherit;background:none;border:1px solid #444;border-radius:4px;padding:6px 12px;cursor:pointer} #tk button:hover{border-color:#aaa}
    #tk .hd{display:flex;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid #222} #tk .hd img{height:34px} #tk .hd .ad{opacity:.85} #tk .hd .sp{flex:1} #tk .beta{font-size:11px;font-weight:700;letter-spacing:.12em;padding:3px 7px;border:1px solid var(--ac);color:var(--ac);border-radius:3px} #tk .bn{font-size:12px;opacity:.6} @media (max-width:900px){#tk .bn{display:none}}
    #tk .tabs{display:flex;gap:6px;padding:10px 18px;overflow-x:auto;border-bottom:1px solid #222;flex:none} #tk .tab{white-space:nowrap} #tk .tab small{opacity:.6;margin-left:6px}
    #tk .tab.on{background:var(--ac);color:var(--on);border-color:var(--ac)} #tk .st{padding:8px 18px;opacity:.6;font-size:12px} #tk .ev{grid-column:1/-1;border:1px solid #333;border-left:4px solid var(--ac);padding:12px 16px;border-radius:4px;max-width:900px} #tk .ev b{font-size:16px} #tk .ev p{margin:6px 0 8px;opacity:.85;white-space:pre-wrap}
    #tk .grid{flex:1;overflow:auto;padding:6px 18px 24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px;align-content:start}
    #tk .card{cursor:pointer} #tk .card .im{aspect-ratio:1;background:#151515;display:grid;place-items:center;overflow:hidden} #tk .card img{max-width:100%;max-height:100%;object-fit:contain}
    #tk .card .t{margin-top:8px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap} #tk .card .b{opacity:.65;overflow:hidden;text-overflow:ellipsis;white-space:nowrap} #tk .card:hover .t{text-decoration:underline}
    #tk .note{font-size:11px;opacity:.7;margin-top:2px} #tk .one{flex:1;overflow:auto;display:grid;grid-template-columns:minmax(0,3fr) minmax(260px,2fr);gap:24px;padding:18px}
    #tk .one .m{background:#111;display:grid;place-items:center;height:calc(94vh - 200px);min-height:240px} #tk .one .m img,#tk .one .m video{max-width:100%;max-height:calc(94vh - 220px);object-fit:contain}
    #tk .one h2{margin:0 0 6px;font-size:22px} #tk .one .ab{white-space:pre-wrap;opacity:.85;max-height:30vh;overflow:auto;margin:14px 0} #tk .one .go{display:inline-block;margin-top:10px;padding:10px 16px;background:var(--ac);color:var(--on);text-decoration:none;border-radius:4px;font-weight:700}
    @media (max-width:700px){#tk{inset:0;border-radius:0}#tk .one{grid-template-columns:1fr}}`;
  const el = (tag, cls, txt, parent) => { const d = document.createElement(tag); if (cls) d.className = cls; if (txt != null) d.textContent = txt; if (parent) parent.appendChild(d); return d; };
  const build = () => { const st = el("style", null, css, document.head), root = el("div"); root.id = "tk"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Teia winter events: mints");
    for (const ev of ["keydown", "keyup", "keypress"]) root.addEventListener(ev, (e) => { if (ev === "keydown" && e.key === "Escape") api.close(); e.stopPropagation(); });
    for (const ev of ["pointerdown", "pointerup", "click", "wheel"]) root.addEventListener(ev, (e) => e.stopPropagation());
    const hd = el("div", "hd", null, root); if (logo && logo.src) { const im = el("img", null, null, hd); im.src = logo.src; im.alt = "Teia"; } el("span", "ad", "teia.art", hd); el("span", "beta", "BETA", hd); el("span", "bn", "An experimental build in beta: it may change frequently.", hd); el("span", "sp", null, hd);
    const x = el("button", null, "Close (Esc)", hd); x.addEventListener("click", () => api.close());
    const tabs = el("div", "tabs", null, root), stl = el("div", "st", null, root), body = el("div", "grid", null, root);
    const S = { tab: -1, one: null };
    const render = () => { root.style.setProperty("--ac", accent); root.style.setProperty("--on", lum(accent) > 140 ? "#0a0a0a" : "#ffffff");
      tabs.innerHTML = ""; [[-1, "All events", ALLTAGS.length + " tags"], ...EV.map((e, k) => [k, e.work, e.tags.map((t) => "#" + t).join(" ")])].forEach(([k, name, sub]) => { const b = el("button", "tab" + (S.tab === k ? " on" : ""), name, tabs); el("small", null, `${sub} · ${of(k).length}`, b); b.addEventListener("click", () => { S.tab = k; S.one = null; render(); }); });
      stl.textContent = D.at ? `Live from Teia's indexer · updated ${new Date(D.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · collect on teia.art` : D.err ? "Teia's indexer did not answer. Trying again shortly." : "Loading…";
      body.innerHTML = ""; body.className = S.one ? "one" : "grid";
      if (S.one) return one(S.one);
      const e = EV[S.tab]; if (e && e.w) { const box = el("div", "ev", null, body); el("b", null, e.w.title, box); if (e.w.by) box.append("  ·  " + e.w.by); if (e.w.about) el("p", null, e.w.about, box);   /* the event, from its plaque */
        if (e.w.link) { const a = el("a", null, `Read the announcement${e.w.platform ? " on " + e.w.platform : ""}`, box); a.href = e.w.link; a.target = "_blank"; a.rel = "noopener noreferrer"; } }
      const toks = of(S.tab); if (D.at && !toks.length) el("div", "note", "No mints under this tag yet.", body);
      for (const t of toks) { const c = el("div", "card", null, body), box = el("div", "im", null, c), im = el("img", null, null, box); im.loading = "lazy"; im.decoding = "async"; im.alt = t.name; im.src = t.flash ? t.still || t.thumb : t.thumb;
        el("div", "t", t.name || "Untitled", c); el("div", "b", t.by, c); el("div", "note", [`${t.editions} edition${t.editions === 1 ? "" : "s"}`, when(t.at), t.flash ? "flashing: still shown" : ""].filter(Boolean).join(" · "), c);
        c.tabIndex = 0; c.addEventListener("click", () => { S.one = t; render(); }); c.addEventListener("keydown", (e) => { if (e.key === "Enter") { S.one = t; render(); } }); } };
    const one = (t) => { const m = el("div", "m", null, body), side = el("div", null, null, body);
      if (/^video\//.test(t.mime) && !t.flash && t.video) { const v = el("video", null, null, m); v.muted = true; v.loop = true; v.playsInline = true; v.controls = true; v.poster = t.thumb; v.src = t.video; v.play().catch(() => {}); }
      else { const im = el("img", null, null, m); im.src = t.flash ? t.still || t.thumb : t.thumb; im.alt = t.name; if (/^video\//.test(t.mime) && !t.flash && t.video === undefined) video(t).then(() => { if (ui && ui.S.one === t && t.video) render(); }); }
      const back = el("button", null, "← Back", side); back.addEventListener("click", () => { S.one = null; render(); });
      el("h2", null, t.name || "Untitled", side); const by = el("div", null, "by ", side); if (t.artist) { const a = el("a", null, t.by, by); a.href = "https://teia.art/tz/" + t.artist; a.target = "_blank"; a.rel = "noopener noreferrer"; } else by.append(t.by);
      el("div", "note", [`OBJKT #${t.id}`, `${t.editions} edition${t.editions === 1 ? "" : "s"}`, "minted " + when(t.at), t.mime].filter(Boolean).join(" · "), side);
      if (t.flash) el("div", "note", "Flagged for flashing images: shown as a still here. Open it on teia.art to see it in full.", side);
      else if (!/^(image|video)\//.test(t.mime)) el("div", "note", "This work is interactive or another kind of file: open it on teia.art to see it in full.", side);
      el("div", "ab", t.about, side); const go = el("a", "go", "View on teia.art", side); go.href = "https://teia.art/objkt/" + t.id; go.target = "_blank"; go.rel = "noopener noreferrer"; };
    return { root, st, render, S }; };
  /* a video mint plays from its artifact; asked for only when it is opened, so the grid stays light */
  const video = async (t) => { if (t.video !== undefined) return; t.video = ""; try { const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: `{ tokens(where: { fa2_address: { _eq: "${HEN}" }, token_id: { _eq: "${t.id}" } }) { artifact_uri } }` }) }); const j = await r.json(); t.video = cid(j.data.tokens[0].artifact_uri); } catch (e) {} };

  const esc = (e) => { if (e.key === "Escape") api.close(); };
  const api = { group, screen, isOpen: false,
    update(T) { if (T - pageT > 12) { pageT = T; page++; screenDirty = true; } if (!screenDirty && T - last < 1) return; last = T; draw(T); },
    setTheme(c) { const ok = Array.isArray(c) && c.every((h) => /^#[0-9a-f]{6}$/i.test(h)); accent = ok ? c.slice().sort((a, b) => sat(b) - sat(a))[0] : "#ffffff"; lit.color.set(accent); marquee();
      sel = ok ? list.findIndex((w) => w.theme && Array.isArray(w.theme.colors) && w.theme.colors.join() === c.join()) : -1; page = 0; screenDirty = true; if (ui) { ui.S.tab = Math.max(-1, curEv()); ui.render(); } },
    select(i) { sel = i; page = 0; screenDirty = true; },
    pick(uv) { return -1; },
    /* for a film (?film=1): the room hands over the kiosk's state each frame; tab is an event's index or -1, one a mint's OBJKT id or null */
    film(st, T) { filmed = true; if (!ui || !st) return; const tab = typeof st.tab === "number" ? st.tab : -1, one = st.one ? D.tokens.find((t) => t.id === String(st.one)) || null : null;
      if (tab !== ui.S.tab || one !== ui.S.one) { ui.S.tab = tab; ui.S.one = one; ui.render(); } },
    /* true once the data is in and the screen's current page of pictures has loaded */
    settled() { if (!D.at) return false; const k = curEv(), toks = of(k), pages = Math.max(1, Math.ceil(toks.length / 10)), p = page % pages; return toks.slice(p * 10, p * 10 + 10).every((t) => { const im = pic(t.flash ? t.still : t.thumb); return !im || im.complete; }); },   /* the whole screen opens the browser */
    open() { if (api.isOpen) return; ui ??= build(); document.addEventListener("keydown", esc, true); ui.S.tab = curEv(); ui.S.one = null; document.body.appendChild(ui.root); api.isOpen = true; ui.render(); load(); clearInterval(poll); if (!filmed) poll = setInterval(load, 60000); },
    close() { if (!api.isOpen) return; api.isOpen = false; document.removeEventListener("keydown", esc, true); clearInterval(poll); poll = 0; ui.root.querySelectorAll("video").forEach((v) => v.pause()); ui.root.remove(); } };
  load(); draw(0);
  return api;
}
