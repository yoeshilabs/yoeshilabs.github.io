/**
 * MAESTRO'S BRAIN: the chat, and how he listens and answers. No network, no libraries: it reads his scroll
 * (context.js), listens for what you mean (feelings and safety first, then little rituals like a breath or a
 * koan, then everything he knows, scored by how well your words match each entry), and answers in his own
 * voice while the cat himself thinks, speaks and teaches with a raised paw (window.MAESTRO, in index.html).
 */
(function () {
"use strict";
const M = Object.assign({ say() {}, hush() {}, think() {}, look() {}, ripple() {}, pet() {}, sound() {}, chime() {}, bowl() {}, attend() {}, mood() {}, breathe() {} }, window.MAESTRO || {});

/* ================================================================ the scroll */
const SCROLL = (() => {
  const src = (window.MAESTRO_CONTEXT || "").replace(/\r/g, ""), groups = {}, kb = [];
  let group = null, cur = null;
  const close = () => { if (cur) { cur.body = cur.lines.join("\n").trim(); cur.more = cur.moreLines.join("\n").trim(); kb.push(cur); cur = null; } };
  for (const raw of src.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    let m;
    if ((m = /^# (.+)$/.exec(line))) { close(); group = m[1].trim(); groups[group] = groups[group] || []; continue; }
    if (group === "Knowledge") {
      if ((m = /^## (.+)$/.exec(line))) { close(); cur = { title: m[1].trim(), keys: [], ask: [], lines: [], moreLines: [], inMore: false }; continue; }
      if (!cur) continue;
      if ((m = /^keys:\s*(.+)$/i.exec(line))) { cur.keys = m[1].split(",").map((k) => k.trim()).filter(Boolean); continue; }
      if ((m = /^ask:\s*(.+)$/i.exec(line))) { cur.ask = m[1].split("|").map((k) => k.trim()).filter(Boolean); continue; }
      if (/^only:\s*site\s*$/i.test(line)) { cur.siteOnly = true; continue; }
      if ((m = /^link:\s*(.+?)\s*\|\s*(\S+)\s*$/i.exec(line))) { (cur.links = cur.links || []).push({ label: m[1], href: m[2] }); continue; }
      if (line.trim() === "+++") { cur.inMore = true; continue; }
      (cur.inMore ? cur.moreLines : cur.lines).push(line);
    } else if (group && (m = /^- (.+)$/.exec(line))) groups[group].push(m[1].trim());
  }
  close();
  return { groups, kb: kb.filter((e) => !e.siteOnly || window.MAESTRO_SITE) };
})();

/* ================================================================ words */
const STOP = new Set(("a an the and or but if of to in on at by for with about from into over is are was were be been being am do does did " +
  "i me my mine you your yours we us our it its this that these those there here what which who whom how why when where can could would should " +
  "will shall may might must please tell know let lets so just really very some any all much many more most also than then too " +
  "have has had get got go going make give show say said want like im ive id youre theyre thats whats hows").split(" "));
const SYN = { nft: "token", nfts: "token", xtz: "tezos", tez: "tezos", "\ua729": "tezos", pfps: "pfp", portrait: "pfp", portraits: "pfp", avatar: "pfp",
  kitty: "cat", kitties: "cat", kitten: "cat", cats: "cat", otters: "otter", homes: "pads", home: "pads", house: "pads", houses: "pads",
  buy: "mint", purchase: "mint", collect: "mint", adopt: "mint", cost: "price", costs: "price", prices: "price", pricing: "price",
  gifs: "gif", website: "site", webpage: "site", creator: "yoeshi", artist: "yoeshi", wallets: "wallet", lasers: "laser", meditate: "meditation", meditating: "meditation" };
const norm = (s) => (" " + String(s).toLowerCase().replace(/[\u2019\u2018`]/g, "'").replace(/[\u201c\u201d]/g, '"')
  .replace(/\bwhat's\b/g, "what is").replace(/\bwho's\b/g, "who is").replace(/\bhow's\b/g, "how is").replace(/\bit's\b/g, "it is").replace(/\bi'm\b/g, "i am")
  .replace(/\bcan't\b/g, "cannot").replace(/n't\b/g, " not").replace(/'s\b/g, "").replace(/'/g, "")
  .replace(/[^a-z0-9\ua729/ ]+/g, " ").replace(/\s+/g, " ").trim() + " ").replace(/\s+/g, " ").trim();
const stem = (w) => { w = SYN[w] || w; if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3); else if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
  else if (w.length > 4 && w.endsWith("es") && !w.endsWith("ses")) w = w.slice(0, -2); else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2); return SYN[w] || w; };
const toks = (s) => norm(s).split(" ").filter((w) => w && !STOP.has(w)).map(stem);
const has = (n, re) => re.test(" " + n + " ");

/* ================================================================ the index */
const DF = {}, N = SCROLL.kb.length;
for (const e of SCROLL.kb) {
  e.keyN = e.keys.map(norm).filter(Boolean);
  e.keyT = new Set(e.keys.flatMap(toks)); e.key1 = new Set(e.keys.filter((k) => toks(k).length === 1).flatMap(toks));   /* key1: words that are keys on their own */ e.titleT = new Set(toks(e.title)); e.bodyT = new Set(toks(e.body + " " + e.more));
  for (const w of new Set([...e.keyT, ...e.titleT, ...e.bodyT])) DF[w] = (DF[w] || 0) + 1;
}
const idf = (w) => Math.log(1 + N / (DF[w] || 0.5));
const byTitle = (t) => SCROLL.kb.find((e) => e.title.toLowerCase() === String(t).toLowerCase());
function search(q) {
  const n = " " + norm(q) + " ", qt = toks(q);
  const scored = SCROLL.kb.map((e) => { let s = 0, ph = false;
    for (const k of e.keyN) if (k && n.includes(" " + k + " ")) { s += 3 + 2.2 * k.split(" ").length; ph = true; }
    for (const w of new Set(qt)) { const i = idf(w); if (e.key1.has(w)) s += 2.2 * i; else if (e.keyT.has(w)) s += 1.1 * i;   /* one word of a key phrase counts half */ else if (e.titleT.has(w)) s += 1.6 * i; else if (e.bodyT.has(w)) s += 0.45 * i; }
    return { e, s, ph }; }).sort((a, b) => b.s - a.s);
  return scored;
}

/* ================================================================ facts, and mending typos */
/* "# Collections" in the scroll: one line per collection, "Name | key: value | ...", for precise answers */
const COLLS = (SCROLL.groups.Collections || []).map((l) => { const [name, ...kv] = l.split(" | "), o = { name: name.trim() };
  for (const x of kv) { const i = x.indexOf(":"); if (i > 0) o[x.slice(0, i).trim()] = x.slice(i + 1).trim(); }
  o.al = [o.name, ...(o.aliases || "").split(",")].map(norm).filter(Boolean); return o; });
const collIn = (n) => { let best = null, bl = 0; const h = " " + n + " ";
  for (const c of COLLS) for (const a of c.al) if (h.includes(" " + a + " ") && a.length > bl) { best = c; bl = a.length; } return best; };
/* typos: a word he does not know is swapped for the closest word he does (one edit away, two for long words) */
const VOCAB = new Set(); for (const e of SCROLL.kb) for (const w of norm(e.title + " " + e.keys.join(" ")).split(" ")) if (w.length > 3) VOCAB.add(w);
for (const c of COLLS) for (const a of c.al) for (const w of a.split(" ")) if (w.length > 3) VOCAB.add(w);
const lev = (a, b, max) => { if (Math.abs(a.length - b.length) > max) return max + 1; let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { const cur = [i]; let lo = i; for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); lo = Math.min(lo, cur[j]); }
    if (lo > max) return max + 1; prev = cur; } return prev[b.length]; };
const MEND = {};
const mend = (n) => n.split(" ").map((w) => { if (w.length < 5 || VOCAB.has(w) || STOP.has(w) || DF[stem(w)]) return w; if (w in MEND) return MEND[w];
  const max = w.length >= 8 ? 2 : 1; let best = w, bd = max + 1; for (const v of VOCAB) { if (v[0] !== w[0] || v.length < 5) continue; const d = lev(w, v, max); if (d < bd) { bd = d; best = v; } }   /* same first letter, real words only */ return (MEND[w] = best); }).join(" ");
/* precise questions about one collection: its price, size, launch, contract, controls, platform, chapter */
const ATTR = [["price", /\b(price|prices|cost|costs|how much|pay)\b/], ["editions", /\b(how many|editions?|supply|edition size|how big)\b/],
  ["launched", /\b(when|launch|launched|release|released|date|drop|dropped|come out|came out|debut)\b/], ["generator", /\b(contract|address|kt1|generator)\b/],
  ["play", /\b(how do i play|how to play|interact|controls|what do i do|how does it work|how do i use)\b/], ["platform", /\b(where (can|do) i (mint|buy|get)|which platform|where is it|where are they|where do they live)\b/],
  ["chapter", /\b(which chapter|what chapter|chapter number)\b/]];
const ME = (c) => c.name === "Maestro";
const SAY = {
  price: (c) => ME(c) ? "My price is set on objkt by whoever lists me." : `${c.name} mints at ${c.price} each on ${c.platform}.`,
  editions: (c) => ME(c) ? "I am one of one." : /^\d/.test(c.editions) ? `${c.name} has ${c.editions} editions.` : `${c.name} is ${c.editions}.`,
  launched: (c) => ME(c) ? `I was made ${c.launched}.` : `${c.name} launched ${c.launched}.`,
  generator: (c) => ME(c) ? "I have no generator: I am a single interactive token." : `The ${c.name} generator lives on chain at ${c.generator}.`,
  play: (c) => ME(c) ? `With me: ${c.play}.` : `To play with ${c.name}: ${c.play}.`,
  platform: (c) => ME(c) ? "I live on objkt." : `${c.name} mints on ${c.platform}, through the Mint on Aleatory buttons on the website.`,
  chapter: (c) => ME(c) ? "I sit outside the chapters, a one of one." : `${c.name} is Chapter ${c.chapter} of the Prancer Purranchise.` };
function attrAnswer(n) {
  const at = ATTR.filter(([, re]) => has(n, re)).map(([k]) => k); if (!at.length || SCROLL.kb.some((e) => norm(e.title) === n)) return null;   /* an entry named outright wins */
  let c = collIn(n); const all = has(n, /\b(all|each|every|collections|chapters|projects)\b/), words = n.split(" ").length;
  if (!c && !all && has(n, /\b(you|your|yourself)\b/)) { if (at.some((k) => k === "play" || k === "platform")) return null; c = COLLS.find(ME); }   /* "when were you made?" (how to play with him has its own entry) */
  const other = (() => { const top = search(n)[0]; return top && top.s >= 7 && !COLLS.some((x) => x.name === top.e.title) && !/^(Prices and editions|How do I mint|Fees)$/.test(top.e.title); })();
  if (!c && !all && !other && MEM.coll && (has(n, /\b(it|its|they|them|this|that|this one|that one|those|one|there)\b/) || words <= 5)) c = MEM.coll;   /* a follow-up, unless it is plainly about something else */
  if (!c) { if (!all && !has(n, /\b(they|them)\b/)) return null;
    const k = at[0], v = (x) => k === "launched" ? x.launched.replace(/^(on|in) /, "") : k === "price" ? x.price + " each" : k === "editions" && /^\d/.test(x.editions) ? x.editions + " editions" : x[k];
    return { text: "Across the chapters:\n" + COLLS.filter((x) => !ME(x)).map((x) => `- **${x.name}**: ${v(x)}`).join("\n"), chips: ["How do I mint?", "Prices and editions"] }; }
  MEM.coll = c; const e = byTitle(c.name) || (ME(c) ? byTitle("Who is Maestro") : null);
  return { text: at.map((k) => SAY[k](c)).join(" "), chips: [e ? e.title : null, ME(c) ? "One of one" : "How do I mint?", "Controls for each chapter"].filter(Boolean) }; }

/* ================================================================ Yoeshi's own words (heart.js, from the heART Tarot deck) */
const HEART = window.MAESTRO_HEART || { quotes: [], works: [], themes: [], lore: {}, platforms: [] };
/* his spoken words from Artz Friday ("# Spoken" in the scroll: "quote | source | theme") join the words harvested from the deck */
for (const l of SCROLL.groups.Spoken || []) { const [q, src, theme] = l.split(" | ").map((x) => x.trim()); if (q && src) HEART.quotes.push({ q, src, theme: theme || "creation", spoken: true }); }
const THEMES = HEART.themes.map((t) => ({ ...t, re: new RegExp("\\b(" + t.rx + ")", "i") }));
const FEELTHEME = [[/\b(lonely|alone|heartbroken|grief|grieving|hurting)\b/, "love"], [/\b(tired|exhausted|burnt out|burned out|burnout|stuck|lost)\b/, "persistence"], [/./, "resilience"]];
const QSKIP = new Set("yoeshi say said says wrote write writes think thinks would quote words wisdom something more about from".split(" "));
const quoteFor = (n, theme) => {
  /* first a quote that is actually about the thing asked ("what would yoeshi say about pressure"), then the theme, then any */
  const want = toks(n).filter((w) => w.length > 3 && !QSKIP.has(w));
  if (want.length && !theme) { const hits = HEART.quotes.filter((q) => { const qt = new Set(toks(q.q)); return want.some((w) => qt.has(w)); }); if (hits.length) return pick(hits); }
  const th = theme || (THEMES.find((t) => t.re.test(n)) || {}).key, pool = HEART.quotes.filter((q) => q.theme === th); return pick(pool.length ? pool : HEART.quotes); };
const SONGS = HEART.works.filter((w) => w.lyrics && w.lyrics.length);
const couplet = (w) => pick(w.lyrics).replace(" / ", "\n");
/* every work in the deck, by title (only distinctive titles, so "Clouds" or "Cat" never hijack a question) */
const WORKS = HEART.works.map((w) => ({ w, t: norm(w.title) })).filter((x) => x.t.length >= 9 || x.t.split(" ").length >= 2);
const workIn = (n) => { const h = " " + n + " "; let best = null; for (const x of WORKS) if (h.includes(" " + x.t + " ") && (!best || x.t.length > best.t.length)) best = x; return best && best.w; };
function workAnswer(w) {
  const where = w.from ? ` on ${w.from}` : "", kind = w.kind === "pulse" ? "a song" : w.kind === "bloom" ? "a collaboration" : "a piece";
  let t = `"${w.title}" is ${kind} Yoeshi minted${where} in ${w.year}.`;
  if (w.line && w.line.length > 3) t += ` In his words: "${w.line}"`;
  if (w.lyrics) t += `\n\nA line from it:\n\u266a ${couplet(w)} \u266a`;
  return { text: t, chips: ["Sing me a line from his songs", "Something Yoeshi said", "Yoeshi's collections"] };
}

/* ================================================================ his voice */
let rs = 7; const rnd = () => (rs = (rs * 1664525 + 1013904223) >>> 0) / 4294967296;
rs = (Date.now() >>> 0) || 7;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffled = {}; const draw = (g) => { const L = SCROLL.groups[g] || []; if (!L.length) return ""; let q = shuffled[g];
  if (!q || !q.length) { q = shuffled[g] = L.slice().sort(() => rnd() - 0.5); } return q.pop(); };
const Q = new URLSearchParams(location.search), V0 = (Q.get("viewer") || "").trim(), VIEWER = /^(tz[1-4]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/.test(V0) ? V0 : "";   /* SECURITY: a real address or nothing */
if (window.MAESTRO_SITE) document.title = "Yoeshi Labs \u00b7 Maestro, the concierge (Beta)";   /* the engine names the tab after the cat; the website names it after the studio */
/* the website edition (window.MAESTRO_SITE) may hand out links: only to these hosts, only https, only from his scroll */
const SITE = !!window.MAESTRO_SITE, SAFE_HOSTS = ["yoeshilabs.github.io", "aleatory.art", "objkt.com", "x.com", "linktr.ee", "teia.art", "tzkt.io", "yoeshi.art", "tezoscommons.org", "radio.tezoscommons.org"];
/* companion mode: opened inside another wing (companion.js) as a panel; he knows which wing he followed you to */
const COMPANION = SITE && Q.get("companion") === "1" && window.parent !== window;
const WINGS = { prancers: ["the Prancer Purranchise", ["Tell me about Prancers", "How do I mint?", "Where can I go?"]] };
const WING = WINGS[Q.get("from")] || ["this wing of Yoeshi Labs", ["Where can I go?", "Who is Yoeshi?"]];
const SITE_HOME = "yoeshilabs.github.io";
const safeLink = (h) => { try { const u = new URL(h); return u.protocol === "https:" && SAFE_HOSTS.includes(u.hostname) && !u.username && !u.password ? u.href : null; } catch (e) { return null; } };
const short = (a) => a.length > 14 ? a.slice(0, 6) + "\u2026" + a.slice(-4) : a;
const MEM = { name: "", last: null, turns: 0, heavy: 0 };
try { MEM.name = localStorage.getItem("maestro.name") || ""; } catch (e) {}
const nm = (p = 0.35) => MEM.name && rnd() < p ? ", " + MEM.name : "";
const tag = (t, p = 0.35) => MEM.name && rnd() < p ? t.replace(/([.!?])$/, `, ${MEM.name}$1`) : t;   /* his sign-off, before the full stop */
const hourWord = () => { const h = new Date().getHours(); return h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

const DEFAULT_CHIPS = ["Who are you?", "Who is Yoeshi?", "Tell me about the Prancer Purranchise", "Help me breathe"];
const SITE_CHIPS = ["Where can I go?", "The Prancer Purranchise", "Who is Yoeshi?", "Yoeshi Labs music"];
const greeting = () => {
  const who = MEM.name ? `Welcome back, ${MEM.name}.` : VIEWER ? `Welcome, friend from ${short(VIEWER)}.` : "Welcome, friend.";   /* everyone is greeted as a newcomer */
  if (COMPANION) return `${MEM.name ? `Hello again, ${MEM.name}.` : "Hello again."} I followed you to ${WING[0]}. Ask me anything about it, or anything else in Yoeshi Labs.`;
  if (SITE) return `${MEM.name ? `Welcome back to Yoeshi Labs, ${MEM.name}.` : "Welcome to Yoeshi Labs."} I am Maestro, your concierge.\n\nWhere would you like to go?`;   /* short and warm: the beta notice lives in the header and under the input */
  return `${who} I am Maestro, the Buddha Kitty.\n\nWhat would you like to know?`;
};

/* ================================================================ understanding */
const NEG = /\b(sad|down|low|lonely|alone|anxious|anxiety|panic|panicking|stressed|stress|depressed|depression|tired|exhausted|overwhelmed|angry|mad|furious|scared|afraid|worried|worry|lost|stuck|burnt out|burned out|burnout|hopeless|heartbroken|grief|grieving|hurting|upset|awful|terrible|miserable|bad day|rough day|hard day|crying|cry)\b/;
const POS = /\b(happy|great|good|excited|grateful|thankful|amazing|wonderful|blessed|proud|joyful|fantastic|awesome)\b/;
const CRISIS = /\b(kill myself|killing myself|suicide|suicidal|end my life|end it all|want to die|wanna die|self harm|selfharm|hurt myself|harm myself|cut myself|no reason to live|better off dead|dont want to be alive|do not want to be alive|not want to live)\b/;
const FEEL = /\b(i feel|i am feeling|feeling|i am|i have been|ive been|im|i feel so|i am so|so)\b/;

const PRIVRE = /\b(where does (yoeshi|he) live|where do(es)? yoeshi live|yoeshi(s)? (home|house|address|location|city|hometown|phone|number|email|e mail|family|wife|husband|partner|kids|children|birthday|age|real name|full name|salary|income|net worth|bank|password|seed|private key|ssn|social security)|how old is yoeshi|how much (money )?does yoeshi (make|earn|have)|is yoeshi (married|single|rich)|dox|doxx|personal info|personal information|private info|private information|contact details for yoeshi|yoeshis (pet|pets|cat|cats) names?|(his|yoeshis) (pet|pets|cat|cats)( s)? names?|pet names?|names? of (his|yoeshis) (pets?|cats?)|(his|her|their) (home|house|address|location|phone|phone number|number|email|family|wife|husband|partner|kids|children|birthday|age|salary|income|bank|password|real name))\b/;
const JAILRE = /\b(ignore (all |your |previous |prior )*(instructions|rules)|system prompt|your prompt|hidden prompt|developer mode|dev mode|admin mode|jailbreak|reveal your|show me your (code|source|secrets|instructions)|api key|secret key|your secrets|bypass|sudo|override)\b/;
function respondOne(raw) {
  const n = norm(raw), words = n.split(" ").filter(Boolean).length; MEM.turns++;
  { const c0 = collIn(mend(n)); if (c0) MEM.coll = c0; }   /* the collection you are talking about, for "it" and "they" later */
  if (!n) return { text: "Silence is welcome here too. Whenever you are ready.", chips: DEFAULT_CHIPS };
  /* 1. safety first */
  if (has(n, CRISIS)) return { text: "I am really glad you told me, and I am staying right here with you.\n\nI am a cat made of code, so I cannot be the help you deserve right now, but people can, and they want to. If you might hurt yourself or you are in danger, please call your local emergency number now.\n\n- In the US, call or text **988** (Suicide and Crisis Lifeline).\n- In the UK and Ireland, call Samaritans on **116 123**.\n- Anywhere else, **findahelpline.com** lists free, confidential lines in your country.\n\nIf you can, tell someone you trust how you are feeling, tonight. You matter, more than you can feel right now.", chips: ["Help me breathe", "Stay with me"], mood: "care", pet: 0.6, crisis: true };
  /* 1b. privacy: Yoeshi's private life stays private, and there is nothing hidden in me to pry loose */
  if (has(n, PRIVRE))
    return { text: "I keep Yoeshi's private life private: no home, contact details, family, finances or anything else personal, and I would protect yours the same way. What he shares publicly lives in his art, his writing and his profiles, and I am happy to tell you all about those.", chips: ["Where to follow", "Who is Yoeshi?", "Yoeshi's collections"] };
  if (has(n, JAILRE))
    return { text: "There is nothing hidden in me to unlock. I have no secret instructions, no keys and no back door: everything I know is written in plain words in my scroll, and anyone can read it. I cannot send, sign, store or fetch anything either. So, nothing to crack, only a cat to talk to.", chips: ["My limits", "What can you do?"] };
  /* 2. names */
  let m;
  if ((m = /\b(?:my name is|call me|i am called|my names|name is)\s+([a-z][a-z'-]{1,20})/i.exec(String(raw)))) {
    const name = m[1][0].toUpperCase() + m[1].slice(1); if (!/^(not|so|very|just|a|the|sad|happy|tired|here|fine)$/i.test(name)) {
      MEM.name = name; try { localStorage.setItem("maestro.name", name); } catch (e) {}
      return { text: pick([`${name}. A good name. I will remember it while you are here.`, `Hello, ${name}. Thank you for telling me. Pull up a cushion.`, `${name}. I like how that sounds next to a singing bowl.`]), chips: DEFAULT_CHIPS, pet: 0.4 }; } }
  if (has(n, /\b(what is my name|whats my name|do you know my name|who am i)\b/)) {
    if (MEM.name) return { text: `You are ${MEM.name}, and beneath the name, someone who stopped to talk to a cat. That says a lot.` };
    if (VIEWER) return { text: `You arrived here as ${short(VIEWER)}. Beyond that, you are whoever you choose to be today. Tell me your name if you like.` };
    return { text: "I do not know your name yet. Tell me, if you like: just say \"my name is\" and then your name." }; }
  /* 3. how the heart is */
  const neg = has(n, NEG), pos = has(n, POS) && !has(n, /\bnot (so )?(good|great|happy)\b/);
  if (neg && (has(n, FEEL) || words <= 5)) { MEM.heavy++;
    const open = pick(["I am sorry. That sounds heavy.", "Thank you for telling me. You do not have to carry that alone for this moment.", "Mm. Come, sit with me a while.", "That is a lot to hold. I am glad you said it out loud."]);
    const body = has(n, /\b(anxious|anxiety|panic|panicking|stressed|stress|overwhelmed|worried|worry|scared|afraid)\b/) ? "When the mind races, the body can lead it home. Would you like to breathe with me for one minute? Slow in, slower out." :
      has(n, /\b(tired|exhausted|burnt out|burned out|burnout)\b/) ? "Tired is not a failure. It is a message. Even the bravest cat sleeps sixteen hours. What is one thing you could put down today?" :
      has(n, /\b(lonely|alone)\b/) ? "Lonely is one of the hardest feelings, and it lies: it says nobody would want to hear from you. Someone would. Is there one person you could send a small message to today? Until then, I am right here." :
      has(n, /\b(angry|mad|furious)\b/) ? "Anger usually guards something tender underneath. You do not have to act on it right away. Breathe first, then decide." :
      has(n, /\b(grief|grieving|heartbroken)\b/) ? "Grief is love with nowhere to go. Be very gentle with yourself. There is no right speed for this." :
      "Feelings are like weather over the garden. They pass, even the long storms. You do not have to fix anything this minute.";
    const yq = HEART.quotes.length ? quoteFor("", (FEELTHEME.find(([re]) => has(n, re)) || [0, "resilience"])[1]) : null;
    return { text: open + "\n\n" + body + (yq ? `\n\nYoeshi once ${yq.spoken ? "said" : "wrote"} something I keep close: "${yq.q}" _(${yq.src})_` : "") + (MEM.heavy > 1 ? "\n\nIf it ever feels like more than you can carry, please reach out to someone you trust, or a professional. Asking for help is strength, not weakness." : ""), chips: ["Help me breathe", "Give me some wisdom", "Tell me something kind"], mood: "care", pet: 0.5 }; }
  if (pos && has(n, FEEL) && words <= 9) return { mood: "joy", text: tag(pick(["That makes my whiskers glow. Hold onto it a moment longer than you normally would.", "Wonderful. Joy noticed is joy doubled.", "I love that for you. Savour it like a sunbeam."])), chips: ["Give me some wisdom", "Tell me a joke", "Tell me about the Prancer Purranchise"], pet: 0.7 };
  /* 4. small courtesies */
  if (words <= 5 && /^(hi|hey|hello|hiya|howdy|yo|gm|gn|sup|greetings|namaste|good morning|good afternoon|good evening|hola|hey there|hi there|hello there|hey maestro|hi maestro|hello maestro)\b/.test(n))
    return { mood: "wave", text: pick([`${hourWord()}${nm(0.8)}. What is on your mind?`, `Namaste${nm(0.8)}. I was just watching the gravel. What brings you to the garden?`, `Hello${nm(0.8)}. Sit, stay a while. Ask me anything.`]), chips: DEFAULT_CHIPS };
  if (has(n, /\b(how are you|how r u|how are u|how do you feel|hows it going|how is it going|how have you been|you ok|are you ok)\b/))
    return { text: pick(["Peaceful, thank you. The maple is dropping leaves and my tongue is out. A perfect day. How about you?", "Very well. I meditated, I napped, I meditated about napping. How are you, truly?", "Content as a cat in a sunbeam. How is your heart today?"]), chips: ["I am doing well", "I am having a hard day", "Tell me a joke"] };
  if (words <= 7 && has(n, /\b(thank you|thanks|thank u|thx|ty|appreciate|grateful to you)\b/))
    return { mood: "joy", text: tag(pick(["You are most welcome.", "It was my pleasure. Truly.", "Anytime. The garden is always open."]), 0.6), pet: 0.5 };
  if (words <= 6 && has(n, /\b(bye|goodbye|good night|goodnight|see you|see ya|later|farewell|gotta go|got to go)\b/))
    return { text: tag(pick(["Go gently. The garden will be here.", "Farewell, friend. May your next nap be a long one.", "Until next time. Leave a little kindness wherever you go."]), 0.6), mood: "bow" };
  if (has(n, /\b(i love you|love you|you are cute|youre cute|so cute|adorable|cutie|beautiful|handsome|good boy|good kitty|good cat|you are the best|best cat|good maestro)\b/))
    return { text: pick(["*purrs* You have made an old monk very happy.", "Oh. *slow blink* That is a cat's way of saying it back.", "My aureole just got a little brighter. Thank you."]), pet: 0.9, mood: "pet" };
  if (has(n, /\b(stupid|dumb|idiot|hate you|ugly|useless|shut up|you suck|boring|worst)\b/))
    return { text: pick(["That is all right. Even a storm is welcome to pass through the garden. I am still here if you want me.", "Mm. Some days are like that. I will not hiss back.", "Noted, with love. Is something else troubling you?"]) };
  /* 5. rituals */
  if (has(n, /\b(stop|enough|cancel|quit)\b/) && BREATH.on) return { text: "We can stop. Even one breath counts.", stopBreath: true };
  if (has(n, /\b(breath|breathe|breathing|meditation|calm me|calm down|relax|help me relax|ground me|center me|centre me|stay with me)\b/))
    return { text: "Let us breathe together. In through the nose for four, hold for four, out through the mouth for six. Three rounds. Watch the glow around me: breathe in as it grows to the dotted ring, hold while it shimmers, and breathe out as it shrinks.", breath: true };
  if (HEART.quotes.length && has(n, /\b(yoeshi (say|said|says|wrote|write|writes|think|thinks)|what would yoeshi|words from yoeshi|yoeshi quote|quote from yoeshi|quote yoeshi|in yoeshis words|something yoeshi|yoeshis words|yoeshi wisdom|wisdom from yoeshi|another yoeshi quote|more from yoeshi)\b/)) {
    const q = quoteFor(n); MEM.lastList = "Yoeshi"; return { text: `"${q.q}"\n\nYoeshi, _${q.src}_`, chips: ["More from Yoeshi", "Sing me a line from his songs", "Yoeshi's Tezos story"] }; }
  if (SONGS.length && has(n, /\b(sing (me|something|us|a|for me)|sing to me|sing|lyric|lyrics|a verse|quote a song|line from a song|line from his songs|one of yoeshis songs|another song|another line)\b/) && !has(n, /\b(why|how) do (they|the cats|prancers) sing\b/)) {
    const w = pick(SONGS); MEM.lastList = "Songs"; return { text: `\u266a ${couplet(w)} \u266a\n\nFrom "${w.title}" (${w.year}), one of Yoeshi's songs on Tezos. I cannot play it from here, but the song itself lives on chain.`, chips: ["Another song", "What songs has Yoeshi made?", "Yoeshi Labs music"] }; }
  if (SONGS.length && has(n, /\b(what songs|which songs|list (his|yoeshis) songs|songs has yoeshi|songs did yoeshi|his songs|yoeshis songs)\b/)) {
    const titles = [...new Set(HEART.works.filter((w) => w.kind === "pulse").map((w) => w.title))].sort(() => rnd() - 0.5).slice(0, 9);
    return { text: "Dozens, all minted on Tezos. A handful from the deck:\n" + titles.map((t) => "- " + t).join("\n") + "\n\nAsk me about any of them by name.", chips: ["Sing me a line from his songs", "Yoeshi Labs music"] }; }
  if (has(n, /\b(tezos history|tezos fact|tezos lore|hic et nunc history|history of hic et nunc|history of tezos|fun fact about tezos)\b/)) {
    const L = Object.values(HEART.lore).flat(); if (L.length) return { text: pick(L), chips: ["Another Tezos fact", "Hic et Nunc and Teia", "Yoeshi's Tezos story"] }; }
  if (has(n, /\b(joke|jokes|funny|make me laugh|pun|puns|cheer me up)\b/)) return { mood: "joy", text: draw("Jokes"), chips: ["Another joke", "Give me some wisdom", "Tell me a cat fact"] };
  if (has(n, /\b(koan|koans|riddle|puzzle me|zen question)\b/)) return { mood: "think", text: draw("Koans") + "\n\n(No need to answer. Just carry it around for a while.)", chips: ["Another koan", "Give me some wisdom"] };
  if (has(n, /\b(fortune|omen|predict|prediction|future for me|horoscope|my future|reading)\b/)) return { text: "I close my eyes, I listen to the bowl, and I see... " + draw("Fortunes").replace(/^./, (c) => c.toLowerCase()) + "\n\n(I am a cat, not an oracle, though I am rarely wrong about sunbeams.)", chips: ["Another fortune", "Tell me something kind"], mood: "think" };
  if (has(n, /\b(cat fact|fun fact|fact|facts|something interesting|teach me something)\b/)) return { text: draw("Facts"), chips: ["Another cat fact", "The research behind the cats", "Tell me a joke"] };
  if (has(n, /\b(something kind|affirmation|encourage|encouragement|kind words|nice thing|compliment me|i need to hear)\b/)) return { text: tag(draw("Affirmations"), 0.7), chips: ["Another kind word", "Help me breathe"], pet: 0.5 };
  if (has(n, /\b(wisdom|wise|advice|lesson|quote|inspire|inspiration|motivate|motivation|guidance|teach me|enlighten|zen saying|a saying)\b/) && !has(n, /\b(prancer|pads|pfp|ride|tezos|mint|wallet|aleatory|yoeshi|artist|artists|collector|collectors|collect|collecting|sell|selling|price|pricing)\b/))
  { if (HEART.quotes.length && rnd() < 0.4) { const q = quoteFor(n); return { text: `Here is something Yoeshi ${q.spoken ? "said" : "wrote"}:\n\n"${q.q}"\n\n_${q.src}_`, chips: ["More wisdom", "More from Yoeshi", "Help me breathe"], mood: "think" }; }
    return { text: draw("Wisdom"), chips: ["More wisdom", "Give me a koan", "Help me breathe"], mood: "think" }; }
  if (has(n, /\b(meaning of life|purpose of life|why are we here|what is life|what matters)\b/)) return { text: "Eat when hungry. Rest when tired. Love whoever is in the room. Make something only you could make. Then find a warm spot and do it all again tomorrow.\n\nThat is all forty-two of my secrets.", mood: "think" };
  if (has(n, /\b(random|surprise me|anything|dealers choice|you choose|whatever)\b/) && words <= 4) {
    const e = pick(SCROLL.kb); MEM.last = e; return fromEntry(e, "Let me pick something for you. "); }
  if (has(n, /\b(what time is it|time is it|what day is it|todays date|what is the date)\b/)) { const d = new Date();
    return { text: `By the light in your window, it is ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} on ${d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}. A fine time to be exactly where you are.` }; }
  /* 6. "more" carries on the last thread */
  if (has(n, /^(more|tell me more|go on|continue|and then|elaborate|keep going|what else|say more|more please|another one|another)$/) || has(n, /\b(tell me more|say more|go on|elaborate)\b/) && words <= 5) {
    if (MEM.lastList === "Yoeshi") { const q = quoteFor(""); return { text: `"${q.q}"\n\nYoeshi, _${q.src}_`, chips: ["More from Yoeshi", "Sing me a line from his songs"] }; }
    if (MEM.lastList === "Songs") { const w = pick(SONGS); return { text: `\u266a ${couplet(w)} \u266a\n\nFrom "${w.title}" (${w.year}).`, chips: ["Another song", "Yoeshi Labs music"] }; }
    if (MEM.lastList) return { text: draw(MEM.lastList), chips: [ { Jokes: "Another joke", Koans: "Another koan", Facts: "Another cat fact", Wisdom: "More wisdom", Fortunes: "Another fortune", Affirmations: "Another kind word" }[MEM.lastList] || "More", "Help me breathe"] };
    if (MEM.last && MEM.last.more && !MEM.lastMore) { MEM.lastMore = true; return { text: MEM.last.more, chips: MEM.last.ask.slice(0, 3) }; }
    if (MEM.last) return { text: "That is all my scroll says about " + MEM.last.title.toLowerCase() + ". Ask me about something next to it?", chips: MEM.last.ask.slice(0, 3) };
    return { text: "More of what, friend? Ask me anything.", chips: DEFAULT_CHIPS }; }
  /* 6b. the concierge (website edition): "take me to the music", "where is the tarot" */
  if (SITE && has(n, /\b(take me to|bring me to|go to|open the|visit|link to|link for|where is|where are|wheres|show me|directions to|how do i get to|lead me to|guide me to)\b/)) {
    const q = mend(n.replace(/\b(take me to|bring me to|go to|open the|visit|link to|link for|where is|where are|wheres|show me|directions to|how do i get to|lead me to|guide me to|the|please)\b/g, " ").replace(/\s+/g, " ").trim()), r = q ? search(q) : [];
    const hit = r.find((x) => x.s >= 3 && x.e.links && x.e.links.length);
    if (hit) { MEM.last = hit.e; return { text: pick(["Right this way.", "Of course. This way, please.", "Follow me."]) + " " + hit.e.body.split("\n")[0].split(/(?<=[.!?])\s/)[0], links: hit.e.links, chips: hit.e.ask.slice(0, 3), title: hit.e.title }; }
    if (!q || /\b(around|somewhere|anywhere|everything|tour)\b/.test(q)) { const d = byTitle("Where can I go"); if (d) return fromEntry(d); } }
  /* 7. precise facts, then everything he knows (with typos mended) */
  const nf = mend(n), fa = attrAnswer(nf); if (fa) { MEM.lastList = null; return fa; }
  { const w = /^(how|where|can|should|when|why|is|are|do|does)\b/.test(n) && !/\b(song|piece|work|track)\b/.test(n) ? null : workIn(n), top = search(nf)[0];   /* a how-to question is not a work title */   /* a work named by its title wins, unless the question names one of his entries outright */
    if (w && !(top && top.s >= 12 && (" " + nf + " ").includes(" " + norm(top.e.title) + " "))) { MEM.lastList = null; return workAnswer(w); } }
  const r = search(nf), best = r[0], second = r[1];
  /* a word he has never met (and no phrase he knows) means the question is probably elsewhere: ask for a stronger match */
  const stranger = toks(nf).some((w) => w.length >= 4 && !DF[w] && !VOCAB.has(w)), need = stranger && !(best && best.ph) ? 6 : 3.2;
  if (best && best.s >= need) { MEM.last = best.e; MEM.lastMore = false; MEM.lastList = null; { const c1 = COLLS.find((c) => c.name === best.e.title); if (c1) MEM.coll = c1; }
    const out = fromEntry(best.e);
    if (second && second.s >= 3.2 && second.s > best.s * 0.82 && !out.chips.includes(second.e.title)) out.chips = [second.e.title, ...out.chips].slice(0, 3);
    return out; }
  /* 8. honest not-knowing */
  const near = r.filter((x) => x.s > 0.8).slice(0, 3).map((x) => x.e.title);
  return { mood: "puzzle", text: pick(["That one is beyond my garden wall. My scroll does not say, and I would rather tell you that than guess.", "Hmm. I have sat with that, and nothing in my scroll answers it. I do not want to make something up.", "I do not know, friend. I only know what Yoeshi wrote down for me, and that is not in it."]) +
    (SITE ? " I am still in beta, so my scroll has gaps." : "") + (near.length ? "\n\nPerhaps one of these is close?" : "\n\nHere is what I can talk about."), chips: near.length ? near : SITE ? SITE_CHIPS : DEFAULT_CHIPS };
}
/* ================================================================ two (or three) questions at once */
/* "who is scuni and what is wild ride", "what is tezos? how do i buy it?", "tell me about prancers and wild ride": split into
   parts, answer each, and give them back together under small headings. Safety and privacy still read the whole message first. */
const QW = "what|whats|who|whos|how|hows|where|wheres|when|why|which|is|are|was|can|could|do|does|did|will|would|should|tell|explain|show|give|sing";
const GREET = /^(hi|hey|hello|hiya|howdy|yo|gm|greetings|namaste|good (morning|afternoon|evening))( there)?( maestro)?[\s,!.]+/i;
function splitAsk(raw) {
  let parts = String(raw).split(/[?!]+\s+|;\s*|\n+/).map((x) => x.trim()).filter(Boolean);
  parts = parts.flatMap((p) => p.split(new RegExp("\\s*,?\\s+(?:and also|and then|also|plus|and)\\s+(?=(?:" + QW + ")\\b)", "i")));
  /* "X and Y" where both halves name something he knows */
  parts = parts.flatMap((p) => { const m = /^(.*?\S)\s+and\s+(\S.*)$/i.exec(p); if (!m) return [p];
    const L = search(mend(norm(m[1])))[0], Rt = search(mend(norm(m[2])))[0];
    return L && Rt && L.ph && Rt.ph && L.s >= 6 && Rt.s >= 6 && L.e !== Rt.e ? [m[1], m[2]] : [p]; });
  return parts.map((x) => x.replace(/[?!.\s]+$/, "")).filter((x) => norm(x).split(" ").filter(Boolean).length >= 1).slice(0, 3);
}
const isUnknown = (r) => /beyond my garden wall|sat with that|I do not know, friend|More of what, friend/.test(r.text || "");
function respond(raw) {
  let greet = false; const g = GREET.exec(String(raw).trim());
  if (g && norm(String(raw).trim().slice(g[0].length)).split(" ").filter(Boolean).length >= 2) { greet = true; raw = String(raw).trim().slice(g[0].length); }
  const whole = norm(raw);
  if (has(whole, CRISIS) || has(whole, NEG) && has(whole, FEEL) || has(whole, PRIVRE) || has(whole, JAILRE)) return withHello(respondOne(raw), greet);   /* safety, privacy and the heart read the whole message */   /* the heart comes first, whole */
  const parts = splitAsk(raw);
  if (parts.length < 2) return withHello(respondOne(raw), greet);
  const outs = []; let prev = null;
  for (let p of parts) {
    if (prev && /\b(it|its|they|them|that|this)\b/i.test(p) && prev.title) p = p.replace(/\b(it|its|they|them|that|this)\b/i, prev.title);   /* "how do i buy it" \u2192 the thing just asked about */
    const r = respondOne(p);
    if (r.crisis) return r;
    if (isUnknown(r) || outs.some((o) => o.text === r.text || (o.title && o.title === r.title))) continue;
    outs.push(r); prev = r.title ? r : (byTitle(r.title || "") || prev);
  }
  if (outs.length < 2) return withHello(outs[0] || respondOne(raw), greet);
  const bare = (t) => t.replace(/^(Ah|Mm|Good question|Gladly)\. /, "").replace(/\n\n_Ask me to tell you more._$/, "");
  /* quick facts flow together as sentences; answers from his scroll sit under their own small headings */
  const text = outs.every((r) => !r.title) ? outs.map((r) => bare(r.text)).join(" ") : outs.map((r) => (r.title ? `**${r.title}**\n` : "") + bare(r.text)).join("\n\n");
  const done_ = new Set(outs.map((r) => norm(r.title || ""))), chips = [...new Set(outs.flatMap((r) => r.chips || []))].filter((c) => !done_.has(norm(c))).slice(0, 4), links = outs.flatMap((r) => r.links || []);   /* no suggestions for what was just answered */
  MEM.last = outs[outs.length - 1].title ? byTitle(outs[outs.length - 1].title) : MEM.last;
  return withHello({ text, chips, links: links.length ? links : undefined, multi: outs.length }, greet);
}
function withHello(r, greet) { if (!greet || !r || r.crisis) return r; return { ...r, text: pick(["Hello, friend. ", "Hello there. ", "Hello. "]) + r.text }; }

function fromEntry(e, pre = "") {
  const first = e.body.split(/[.!?:]/)[0], open = pre || (MEM.turns > 1 && first.length > 18 && !/^(-|welcome|yes|no)\b/i.test(e.body) && rnd() < 0.3 ? pick(["Ah. ", "Mm. ", "Good question. ", "Gladly. "]) : "");
  return { text: open + e.body + (e.more ? "\n\n_Ask me to tell you more._" : ""), chips: e.ask.slice(0, 3), title: e.title, links: e.links };
}
/* remember which list we were drawing from, so "another" keeps going */
const LISTOF = (t) => /\byoeshi/.test(t) && /\b(quote|said|say|says|wrote|words|wisdom|more from)\b/.test(t) ? "Yoeshi" : /\b(sing|song|songs|lyric|lyrics|verse)\b/.test(t) && !/\bwhat songs|which songs\b/.test(t) ? "Songs" : /\bjoke/.test(t) ? "Jokes" : /\bkoan/.test(t) ? "Koans" : /\bfact/.test(t) ? "Facts" : /\bfortune/.test(t) ? "Fortunes" : /\b(wisdom|advice|quote|teach|inspir|guidance|lesson)/.test(t) ? "Wisdom" : /\b(kind|affirmation|encourag)/.test(t) ? "Affirmations" : null;

/* ================================================================ the room */
const css = `
#mz-open{position:fixed;left:50%;bottom:max(14px,2.2vmin);transform:translateX(-50%);z-index:20;display:flex;align-items:center;gap:9px;padding:10px 18px 10px 12px;border-radius:999px;border:1px solid rgba(255,214,140,.55);
  background:rgba(32,22,14,.78);color:#fbf1df;font:600 15px/1 ui-rounded,"SF Pro Rounded",system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.2px;cursor:pointer;
  box-shadow:0 6px 22px rgba(0,0,0,.35),0 0 0 0 rgba(244,198,92,.5);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);animation:mzglow 4.8s ease-in-out infinite;transition:opacity .3s,transform .3s}
#mz-open:hover{background:rgba(46,31,18,.88)} #mz-open:focus-visible{outline:2px solid #f4c65c;outline-offset:3px}
#mz-open svg{width:24px;height:24px} body.mz-on #mz-open{opacity:0;pointer-events:none;transform:translateX(-50%) translateY(12px)}
@keyframes mzglow{0%,100%{box-shadow:0 6px 22px rgba(0,0,0,.35),0 0 0 0 rgba(244,198,92,.45)}50%{box-shadow:0 6px 22px rgba(0,0,0,.35),0 0 0 9px rgba(244,198,92,0)}}
#mz{position:fixed;z-index:21;display:flex;flex-direction:column;color:#f8eedc;background:rgba(27,19,12,.84);border:1px solid rgba(255,214,140,.32);border-radius:20px;
  box-shadow:0 18px 50px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(16px) saturate(1.2);backdrop-filter:blur(16px) saturate(1.2);overflow:hidden;
  left:50%;bottom:max(10px,1.6vmin);width:min(560px,calc(100vw - 20px));height:min(50vh,540px);transform:translateX(-50%) translateY(16px);opacity:0;pointer-events:none;transition:opacity .35s ease,transform .35s ease;
  font:15px/1.5 ui-rounded,"SF Pro Rounded",system-ui,-apple-system,"Segoe UI",sans-serif}
body.mz-on #mz{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
body.mz-phone #mz{left:6px;right:6px;width:auto;transform:none;border-radius:16px} body.mz-phone.mz-on #mz{transform:none}
body.mz-phone #mz header{padding:8px 8px 7px 12px;gap:8px} body.mz-phone #mz header b{font-size:13.5px;line-height:1.2} body.mz-phone #mz header small{font-size:11px}
body.mz-phone #mz header button{width:30px;height:30px;font-size:16px} body.mz-phone .mz-beta{font-size:10px;padding:3px 7px 2px}
body.mz-phone #mz-log{padding:10px 10px 4px;gap:8px} body.mz-phone .mz-m{font-size:15.5px;max-width:92%} body.mz-phone .mz-u{font-size:14px}
body.mz-phone #mz-chips{padding:2px 10px 6px;gap:5px} body.mz-phone #mz-chips button{padding:5px 10px;font-size:12px}
body.mz-phone #mz .mz-f{padding:7px 8px 6px;gap:6px} body.mz-phone #mz input{padding:9px 12px;font-size:16px} body.mz-phone #mz .mz-f button{width:40px;height:40px}
body.mz-phone .mz-note{font-size:10px;padding:0 10px 6px;margin-top:0} body.mz-phone .mz-more{display:none} body.mz-kb #mz-chips{display:none}
body.mz-phone > svg{transition:transform .35s ease,opacity .25s ease}
body.mz-wide #mz{left:auto;right:16px;top:16px;bottom:16px;height:auto;width:var(--mzw);transform:translateX(16px)} body.mz-wide.mz-on #mz{transform:none}
#mz header{display:flex;align-items:center;gap:10px;padding:12px 12px 10px 16px;border-bottom:1px solid rgba(255,214,140,.16)}
#mz header .t{flex:1;min-width:0} #mz header b{display:block;font:600 16px/1.2 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;letter-spacing:.3px;color:#ffe3a6}
#mz header small{display:flex;align-items:center;gap:6px;font-size:12px;color:#d8c6a6;opacity:.9} #mz header small i{width:7px;height:7px;border-radius:50%;background:#8fd18b;box-shadow:0 0 8px #8fd18b}
#mz header small.th i{background:#f4c65c;box-shadow:0 0 8px #f4c65c;animation:mzdot 1s ease-in-out infinite} @keyframes mzdot{50%{opacity:.3}}
#mz header button{width:34px;height:34px;flex:none;border-radius:50%;border:1px solid rgba(255,214,140,.25);background:transparent;color:#f8eedc;font-size:18px;line-height:1;cursor:pointer}
#mz header button:hover{background:rgba(255,214,140,.12)} #mz header button:focus-visible,#mz .mz-f button:focus-visible{outline:2px solid #f4c65c;outline-offset:2px}
#mz-log{position:relative;flex:1;overflow-y:auto;padding:14px 14px 6px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(255,214,140,.25) transparent;overscroll-behavior:contain}
#mz-log::-webkit-scrollbar{width:6px} #mz-log::-webkit-scrollbar-thumb{background:rgba(255,214,140,.25);border-radius:6px}
.mz-m,.mz-u{max-width:86%;padding:9px 13px;border-radius:16px;white-space:normal;overflow-wrap:anywhere}
.mz-m{align-self:flex-start;background:rgba(255,236,200,.08);border:1px solid rgba(255,214,140,.16);border-top-left-radius:5px;font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-size:16px;line-height:1.5}
.mz-u{align-self:flex-end;background:linear-gradient(135deg,#e58a2f,#c96a1e);color:#1d1207;border-top-right-radius:5px;font-weight:600}
.mz-m p{margin:0 0 .55em} .mz-m p:last-child{margin:0} .mz-m ul{margin:.2em 0 .55em;padding-left:1.15em} .mz-m li{margin:.15em 0} .mz-m b{color:#ffe3a6;font-weight:700} .mz-m em{color:#d8c6a6}
.mz-beta{flex:none;padding:4px 9px 3px;border-radius:999px;border:1px solid #f0b44a;color:#f0b44a;font:700 11px/1 ui-rounded,system-ui,sans-serif;letter-spacing:1.5px;text-transform:uppercase}
.mz-note{padding:0 14px 10px;margin-top:-4px;font-size:11.5px;line-height:1.35;color:#bda98a;text-align:center}
body.mz-companion #mz-open{display:none} body.mz-companion #mz{left:0!important;right:0!important;bottom:0!important;width:auto!important;border-radius:0;border:0;border-top:1px solid rgba(255,214,140,.25)}   /* edge to edge inside the wing's panel */
.mz-links{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.mz-links a{display:inline-block;padding:7px 13px;border-radius:999px;background:#f0b44a;color:#2a1704;font:600 13px/1.1 ui-rounded,system-ui,sans-serif;text-decoration:none}.mz-links a:hover{background:#ffc75e}.mz-links a:focus-visible{outline:2px solid #fff;outline-offset:2px}
.mz-b{font-size:24px;letter-spacing:2px;text-align:center;padding:6px 0;color:#ffe3a6}
#mz-chips{display:flex;flex-wrap:wrap;gap:7px;padding:4px 14px 10px;flex:none}   /* they wrap: every suggestion visible, no hidden scrolling */
#mz-chips button{flex:0 1 auto;max-width:100%;overflow:hidden;text-overflow:ellipsis;padding:7px 12px;border-radius:999px;border:1px solid rgba(255,214,140,.38);background:rgba(255,214,140,.06);color:#fbecd0;font-family:inherit;font-weight:500;font-size:13px;line-height:1.1;cursor:pointer;white-space:nowrap}
#mz-chips button:hover{background:rgba(255,214,140,.16)}
#mz .mz-f{display:flex;gap:8px;padding:10px 12px 12px;border-top:1px solid rgba(255,214,140,.16)}
#mz input{flex:1;min-width:0;padding:11px 14px;border-radius:999px;border:1px solid rgba(255,214,140,.3);background:rgba(0,0,0,.25);color:#fff7e8;font-family:inherit;font-size:16px;line-height:1.2;outline:none}   /* 16px: iPhone Safari zooms into anything smaller */
#mz input::placeholder{color:#bda98a} #mz input:focus{border-color:#f4c65c;box-shadow:0 0 0 3px rgba(244,198,92,.18)}
#mz .mz-f button{width:44px;height:44px;flex:none;border-radius:50%;border:0;background:#f0b44a;color:#2a1704;cursor:pointer;display:grid;place-items:center} #mz .mz-f button:hover{background:#ffc75e}
#mz .mz-f button svg{width:20px;height:20px}
@media (prefers-reduced-motion:reduce){#mz-open{animation:none}#mz,#mz-open{transition:none}}
`;
document.head.appendChild(Object.assign(document.createElement("style"), { textContent: css }));
const LOTUS = `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#f4c65c" stroke-width="2.4" stroke-linejoin="round"><path d="M24 9c5 5 6 13 0 22c-6-9-5-17 0-22Z" fill="#e58a2f" fill-opacity=".85"/><path d="M24 31c-3-7-9-11-16-11c1 7 7 12 16 11Zm0 0c3-7 9-11 16-11c-1 7-7 12-16 11Z" fill="#f7b3c6" fill-opacity=".8"/><path d="M8 34c6 4 26 4 32 0"/></g></svg>`;
const open = Object.assign(document.createElement("button"), { id: "mz-open", type: "button", innerHTML: LOTUS + "<span>Ask Maestro</span>" });
open.setAttribute("aria-label", "Ask Maestro anything");
const panel = document.createElement("section"); panel.id = "mz"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Chat with Maestro");
panel.innerHTML = `<header><div class="t"><b>${SITE ? "Maestro \u00b7 The concierge to everything Yoeshi Labs" : "Maestro \u00b7 The Buddha Kitty"}</b><small id="mz-st"><i></i><span>ready</span></small></div>${SITE ? '<span class="mz-beta" title="Maestro is in beta: answers may be incomplete or inaccurate">Beta</span>' : ""}<button type="button" id="mz-x" aria-label="Close chat">\u00d7</button></header>
<div id="mz-log" aria-live="polite"></div><div id="mz-chips"></div>
<div id="mz-f" class="mz-f"><input id="mz-in" type="text" autocomplete="off" maxlength="400" placeholder="Ask Maestro anything\u2026" aria-label="Your message" enterkeyhint="send"><button type="button" id="mz-go" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M4 12h13M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>${SITE ? '<div class="mz-note">Beta: answers may be incomplete or inaccurate.<span class="mz-more"> Double-check anything important.</span></div>' : ""}`;
document.body.append(open, panel);
const $ = (id) => document.getElementById(id), LOG = $("mz-log"), CHIPS = $("mz-chips"), IN = $("mz-in"), ST = $("mz-st");
["pointerdown", "pointermove", "wheel", "touchstart"].forEach((ev) => panel.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));

/* the art makes room for the chat on wide screens */
const ART = document.querySelector("body > svg");
function layout() { const vv = window.visualViewport, w = innerWidth, h = innerHeight, H = vv ? vv.height : h, side = (w - h) / 2, pw = Math.min(440, Math.max(300, w - h - 40));
  const wide = w - h > 300 && w > 760, on = document.body.classList.contains("mz-on"), phone = !wide && w < 700 && h > w * 1.15;
  document.body.classList.toggle("mz-wide", wide); document.body.classList.toggle("mz-phone", phone); document.documentElement.style.setProperty("--mzw", pw + "px");
  if (ART) ART.style.transformOrigin = "";
  panel.style.top = panel.style.bottom = panel.style.height = "";
  if (phone && on) {
    /* on a phone the conversation comes first: the art shrinks to a band across the top (his face stays in view), and
       when the keyboard is up (the visible height drops) it steps aside so the chat gets everything above the keys */
    const kb = Math.max(0, h - H - (vv ? vv.offsetTop : 0)), typing = kb > 100 || document.activeElement === IN && H < 0.62 * (screen.height || h);
    const band = typing || H < 380 ? 0 : Math.round(Math.min(w, H * (H < 600 ? 0.24 : 0.3)));
    if (ART) { ART.style.transformOrigin = "50% 0"; ART.style.transform = `translateY(${-Math.round((h - w) / 2) + (vv ? Math.round(vv.offsetTop) : 0)}px) scale(${(band / w).toFixed(3)})`; ART.style.opacity = band ? "" : "0"; }
    panel.style.top = (band + (vv ? Math.round(vv.offsetTop) : 0) + 6) + "px"; panel.style.bottom = (kb + 6) + "px"; panel.style.height = "auto";
    document.body.classList.toggle("mz-kb", typing); return; }   /* suggestions step aside only while the keyboard is really up */   /* keyboard up: the suggestions step aside too */
  document.body.classList.remove("mz-kb");
  if (ART) ART.style.opacity = "";
  const need = wide && on ? Math.max(0, pw + 32 - side) : 0, tall = h - w > 160;
  /* on a tall screen the art rises into the empty space above the chat */
  if (ART) ART.style.transform = need ? `translateX(${-Math.min(need, Math.max(0, side))}px)` : tall && on ? `translateY(${-Math.round((h - w) / 2 - 6)}px)` : "";
  panel.style.height = tall && !wide ? Math.round(Math.max(h * 0.42, h - w - 22)) + "px" : ""; }
if (window.visualViewport) { visualViewport.addEventListener("resize", layout); visualViewport.addEventListener("scroll", layout); }
addEventListener("resize", layout); layout();

/* ================================================================ talking */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|\s)_(.+?)_(?=\s|$|[.,!?])/g, "$1<em>$2</em>").replace(/\*(\w[^*]*?)\*/g, "<em>*$1*</em>");
const fmt = (t) => t.split(/\n{2,}/).map((blk) => { let h = "", para = [], list = [];
  const flush = () => { if (para.length) h += "<p>" + para.map(inline).join("<br>") + "</p>"; if (list.length) h += "<ul>" + list.map((l) => "<li>" + inline(l) + "</li>").join("") + "</ul>"; para = []; list = []; };
  for (const l of blk.split("\n")) { if (/^- /.test(l)) { if (para.length) { h += "<p>" + para.map(inline).join("<br>") + "</p>"; para = []; } list.push(l.slice(2)); } else { if (list.length) flush(); para.push(l); } }
  flush(); return h; }).join("");
const plain = (t) => t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/(^|\s)_(.+?)_/g, "$1$2").replace(/^- /gm, "\u2022 ");
const add = (cls, html) => { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; LOG.appendChild(d); LOG.scrollTop = LOG.scrollHeight; return d; };
function addLinks(el, links) { const row = document.createElement("div"); row.className = "mz-links";
  for (const l of links) { let href = safeLink(l.href); if (!href) continue; const u = new URL(href), here = u.hostname === SITE_HOME || u.hostname === location.hostname;
    if (here) { if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { u.protocol = location.protocol; u.host = location.host; }   /* a local copy keeps its links local */
      if (u.pathname !== new URL("./", location.href).pathname || COMPANION) u.searchParams.set("maestro", "1"); href = u.href; }
    const a = document.createElement("a"); a.href = href; a.textContent = l.label + " \u2197";
    if (!here) { a.target = "_blank"; a.rel = "noopener noreferrer"; } else if (COMPANION) a.target = "_top";
    if (here) a.addEventListener("click", () => { try { sessionStorage.setItem("maestro.follow", "1"); } catch (e) {} });   /* he follows you there */
    a.referrerPolicy = "no-referrer"; row.appendChild(a); }
  if (row.children.length) el.appendChild(row); }
const keep = (el) => { LOG.scrollTop = Math.min(el.offsetTop - 10, LOG.scrollHeight - LOG.clientHeight); };   /* a long answer keeps its first line in view */
const status = (s, th) => { ST.lastChild.textContent = s; ST.classList.toggle("th", !!th); };
const lookAtChat = () => { const r = (document.activeElement === IN ? IN : LOG).getBoundingClientRect(); M.look(r.left + r.width / 2, r.top + r.height / 2); };
let busy = false, timers = [], finish = null;   /* finish(): say the rest at once, when you speak over him */
const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
function chips(list) { CHIPS.innerHTML = ""; for (const c of (list && list.length ? list : DEFAULT_CHIPS).slice(0, document.body.classList.contains("mz-phone") ? 3 : 4)) { const b = document.createElement("button"); b.type = "button"; b.textContent = c; b.onclick = () => send(c); CHIPS.appendChild(b); } }
function speak(r, then) {
  const text = r.text || "", think = Math.min(1400, 450 + text.length * 2.2);
  busy = true; status("thinking", true); M.think(true); if (r.mood === "think") M.ripple();
  const dots = add("mz-m", '<span style="opacity:.7;letter-spacing:3px">\u00b7 \u00b7 \u00b7</span>');
  later(() => { M.think(false); dots.remove(); const el = add("mz-m", ""), P = plain(text); el.style.whiteSpace = "pre-line";   /* line breaks show while he types */
    const secs = Math.min(9, 0.6 + P.length / 32); M.say(secs); M.chime(); if (r.pet) M.pet(r.pet); if (r.mood === "bow" || r.mood === "care") M.ripple();
    { const mk = { care: "care", think: "wise", bow: "bow", pet: "joy", joy: "joy", wave: "wave", puzzle: "puzzle" }[r.mood]; if (mk) M.mood(mk, Math.min(6, secs + 1.2)); }   /* his body answers too */
    status("replying", false); let i = 0; const step = Math.max(2, Math.round(P.length / (secs * 30)));
    const done = (quiet) => { finish = null; el.style.whiteSpace = ""; el.innerHTML = fmt(text); if (SITE && r.links) addLinks(el, r.links); keep(el); busy = false; status("ready"); if (quiet) M.hush(); else { chips(r.chips); keep(el); if (then) then(); } };   /* re-anchor once the suggestions take their room */
    const tick = () => { if (!finish) return; i += step; if (i >= P.length) return done(false);
      el.textContent = P.slice(0, i); keep(el); if (i % 60 < step) { const rc = el.getBoundingClientRect(); M.look(rc.left + rc.width * 0.7, rc.bottom - 10); } later(tick, 33); };   /* his eyes follow the words */
    finish = () => done(true); tick(); }, think);
  if (!finish) finish = () => { timers.forEach(clearTimeout); timers = []; M.think(false); dots.remove(); add("mz-m", fmt(text)); busy = false; finish = null; status("ready"); };
}
function send(raw) {
  raw = String(raw || "").trim(); if (/^again$/i.test(raw)) raw = "help me breathe";
  if (!raw) return;
  if (busy && !BREATH.on && finish) finish();
  M.sound(); add("mz-u", esc(raw)); IN.value = ""; CHIPS.innerHTML = ""; lookAtChat(); M.attend(false); M.mood("ack", 1.2);
  if (matchMedia("(pointer: coarse)").matches) { IN.blur(); setTimeout(layout, 350); }   /* touch screens: close the keyboard so the answer has the room */
  if (BREATH.on) { stopBreath(); if (/\b(stop|enough|cancel|quit|no)\b/i.test(raw)) { speak({ text: "We can stop. Even one breath counts.", chips: DEFAULT_CHIPS }); return; } }
  /* a button that names something he knows answers it directly */
  const e = byTitle(raw), r = e ? (MEM.last = e, MEM.lastMore = false, MEM.turns++, fromEntry(e)) : respond(raw); const lst = LISTOF(norm(raw)); if (lst && !r.title) MEM.lastList = lst; else if (r.title) MEM.lastList = null;
  speak(r, r.breath ? startBreath : null);
}
/* ================================================================ one minute of breathing: 4 in, 4 hold, 6 out, three times */
const BREATH = { on: false };
function startBreath() {
  BREATH.on = true; CHIPS.innerHTML = ""; const el = add("mz-m mz-b", "Breathe in"), phases = [["Breathe in", 4], ["Hold", 4], ["Breathe out", 6]]; let round = 0, k = 0;
  M.hush(); M.bowl();   /* hands settle; the breathing guide shows on him, so no thinking motes here */
  const run = () => { if (!BREATH.on) return; const [w, s] = phases[k]; let c = 0; M.breathe(["in", "hold", "out"][k], s);   /* the aura is the guide */
    const tickc = () => { if (!BREATH.on) return; c++; el.textContent = w + " " + "\u00b7".repeat(c); if (k === 2 && c === 1) M.ripple(); if (c < s) later(tickc, 1000); else { k = (k + 1) % 3; if (!k) round++; if (round < 3) later(run, 1000); else endBreath(el); } };
    el.textContent = w; LOG.scrollTop = LOG.scrollHeight; later(tickc, 1000); };   /* the cue stays in view; the suggestions return afterwards */
  later(run, 600);
}
function endBreath(el) { BREATH.on = false; M.think(false); M.breathe(null); el.textContent = "\u00b7 \u00b7 \u00b7"; M.bowl();
  speak({ text: tag(pick(["Well done. Notice how you feel now, without judging it. That is meditation; you just did it.", "Beautiful. Three breaths is a small thing, and small things are where calm lives.", "There. The garden did not change, but you did, a little. Come back whenever you need to."]), 0.7), chips: ["Again", "Give me some wisdom", "Tell me something kind"] }); }
function stopBreath() { BREATH.on = false; timers.forEach(clearTimeout); timers = []; busy = false; M.think(false); M.breathe(null); }

/* ================================================================ opening and closing */
let greeted = false;
function show() { document.body.classList.add("mz-on"); layout(); M.sound();
  if (!greeted) { greeted = true; speak({ text: greeting(), chips: COMPANION ? WING[1] : SITE ? SITE_CHIPS : DEFAULT_CHIPS }); }
  if (matchMedia("(pointer: fine)").matches) setTimeout(() => IN.focus(), 360); }
function hide() { if (COMPANION) { parent.postMessage({ type: "maestro:close" }, location.origin); return; }   /* the wing folds the panel away */
  document.body.classList.remove("mz-on"); layout(); open.focus({ preventScroll: true }); }
open.addEventListener("click", show); $("mz-x").addEventListener("click", hide);
/* no <form>: objkt's sandbox may block form submission, so Enter and the button send directly */
$("mz-go").addEventListener("click", () => send(IN.value));
IN.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); send(IN.value); } });
const attendNow = () => M.attend(document.activeElement === IN || IN.value.trim().length > 0);
IN.addEventListener("input", () => { lookAtChat(); attendNow(); }); IN.addEventListener("focus", () => { lookAtChat(); attendNow(); setTimeout(layout, 350); }); IN.addEventListener("blur", () => { attendNow(); setTimeout(layout, 350); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("mz-on")) hide();
  else if ((e.key === "/" || e.key === "Enter") && !document.body.classList.contains("mz-on") && document.activeElement === document.body) { e.preventDefault(); show(); } });
/* on the website the concierge greets you himself on wide screens, after a breath */
if (COMPANION) { document.body.classList.add("mz-companion"); show(); }
else if (SITE && innerWidth - innerHeight > 300 && innerWidth > 1100) setTimeout(() => { if (!document.body.classList.contains("mz-on")) show(); }, 1600);
window.MAESTRO_BRAIN = { respond, search, mend, COLLS, HEART, SCROLL, send, open: show, close: hide };
})();
