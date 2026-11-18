/* The ticket check at the doors. Holding the concert film is the ticket.
     1. connect: the wallet shares its address (and its public key)
     2. sign: one plain, readable sign-in message, free and off chain, with the address, the time and a random code in
        it, so a signature cannot be reused; this proves the visitor holds that wallet (an address alone can be typed in
        by anyone). Never a transaction or an operation: every Beacon request that could ask for one is switched off on
        this client, and the only scope asked for is signing.
     3. verify: the signature is checked here against the wallet's public key, and the key against the address
     4. hold: a read-only TzKT lookup confirms the wallet holds the ticket token (ticket.json)
   Then the connection is dropped. A pass is kept for this browser tab's session, so "See it again" does not ask twice.
   An honest limit: a check that runs in the page keeps casual visitors out, not a determined one; for a concert that
   is the right trade. ticket.json with an empty contract leaves the doors open to everyone. */
const OFF = ["requestOperation", "requestEncryptPayload", "requestBroadcast", "requestProofOfEventChallenge", "requestSimulatedProofOfEventChallenge"];
const PASS = "purrancers-pass";
/* on this Mac (localhost or 127.0.0.1) the doors open without a ticket, for testing (a wallet cannot sign in the app's
   own browser); ?ticket=check tries the real door here. The published show is never on these addresses. */
export const testDoor = () => /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).get("ticket") !== "check";
/* Inside another site's frame (TezTowers' Sphere, for now the only public way in), browser wallets such as Temple cannot
   connect: since Temple 2.0.34 (2026-11-02) its extension answers only the site open in the tab itself, and the show is
   another site inside it (visitors at the door, 2026-11-08 and 2026-11-11: Temple's "Install Temple Wallet" screen).
   Phones and other wallets still connect through the wallet window. frameNote(after, cfg, door) puts a short line under
   the door's ticket link saying so, with a button that signs in through a small window of the show's own (signin.html),
   where Temple works: that window signs the same free message and hands it back here, where it is checked as if it had
   been signed in the frame (windowSignIn, below). door: { ui, done(address) }, done going on through the doors.
   Nothing happens outside a frame or with the doors open to everyone. */
export const framed = () => { try { return window.top !== window.self && !window.top.location.href; } catch (e) { return true; } };   // (another site's frame: reading where the top page is throws)
export function frameNote(after, cfg, door) {
  if (!framed() || !cfg || !cfg.contract || !after || document.getElementById("framenote")) return;
  const p = document.createElement("p"); p.id = "framenote"; p.style.cssText = "margin:10px 0 0;font-size:13px;opacity:.85";
  const b = document.createElement("button"); b.type = "button"; b.textContent = "Sign in with Temple in a new window";
  b.style.cssText = "display:block;margin:8px auto;font-size:14px;padding:7px 16px;background:transparent;color:var(--gold);border:1px solid var(--gold);box-shadow:none";   // quieter than the doors' own button
  b.onclick = () => windowSignIn(door.ui, "Sign in to show your ticket.", door.done);
  p.append("Using Temple? It cannot connect inside TezTowers (a Temple safety rule since 2 November).", b, "Or choose your phone in the wallet window.");
  after.after(p); }
const session = { get() { try { return JSON.parse(sessionStorage.getItem(PASS)); } catch (e) { return null; } }, set(v) { try { sessionStorage.setItem(PASS, JSON.stringify(v)); } catch (e) {} } };

/* ticket.json: { tickets: [{ name, contract, tokenId }], need, get }; holding any one of them is a ticket. ticket.contract is
   kept true while any ticket is set, so the doors know to ask */
export async function loadTicket() { let c = {}; try { c = await (await fetch("ticket.json", { cache: "no-store" })).json(); } catch (e) {}
  c.tickets = (c.tickets || (c.contract ? [{ name: c.name, contract: c.contract, tokenId: c.tokenId }] : [])).filter((t) => t.contract);
  c.contract = c.tickets.map((t) => `${t.contract}:${t.tokenId ?? ""}`).join(","); return c; }

async function holds(cfg, address) {   // read-only: does this wallet hold any of the tickets?
  const one = async (t) => { const q = new URLSearchParams({ account: address, "token.contract": t.contract, "balance.gt": "0", select: "balance", limit: "1" });
    if (t.tokenId !== "" && t.tokenId != null) q.set("token.tokenId", String(t.tokenId));
    const r = await fetch(`https://api.tzkt.io/v1/tokens/balances?${q}`); if (!r.ok) throw new Error("The ticket lookup did not answer. Try again in a moment.");
    return (await r.json()).length > 0; };
  return (await Promise.all(cfg.tickets.map(one))).some(Boolean); }

/* a Micheline string, as Tezos wallets expect a signed message: 05 01, the length, then the text */
function micheline(text, stringToBytes) { const hex = stringToBytes(text); return "0501" + (hex.length / 2).toString(16).padStart(8, "0") + hex; }

/* sign in: the wallet shares its address, signs one free off-chain message, and the signature is checked here against
   the wallet's public key and the key against the address. The proven address is kept for this tab's session, so the
   doors ask once whatever asks first (bringing your own Prancer, or the ticket). ui: { status(text, stop) }.
   Returns the address, or null (ui has been told why). */
const WHO = "purrancers-who", ADDR = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
const who = { get() { try { const v = JSON.parse(sessionStorage.getItem(WHO)); return v && ADDR.test(v.address || "") ? v : null; } catch (e) { return null; } }, set(v) { try { sessionStorage.setItem(WHO, JSON.stringify(v)); } catch (e) {} } };
/* Some browsers offer the Web Locks API and then refuse it: Firefox inside another site's frame (the TezTowers Sphere),
   with strict tracking protection, or in a private window ("LockManager.query: query() is not allowed in this context",
   a holder at the door, 2026-11-07). The wallet library's tab coordination (broadcast-channel) uses Web Locks whenever
   they are offered, so the door stopped there. Ask once; if they are refused, hide them, and the library falls back to
   its other way of coordinating tabs. Where the locks work, nothing changes. */
let locksChecked = false;
async function guardLocks() {
  if (locksChecked) return; locksChecked = true;
  try { if (!navigator.locks || typeof navigator.locks.query !== "function") return; await navigator.locks.query(); return; } catch (e) {}
  try { Object.defineProperty(navigator, "locks", { value: undefined, configurable: true }); } catch (e) {}
  try { if (navigator.locks) Object.defineProperty(Object.getPrototypeOf(navigator), "locks", { get: () => undefined, configurable: true }); } catch (e) {}
}
const nonce = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");
/* connect, then one signed message (in this page). One wallet client at a time: it is destroyed when it is done, so a
   second try starts clean (a client left running beside a new one was what Beacon warned about on "Try again",
   2026-11-11). Returns { address, publicKey, payload, signature }, or throws. Also used by the sign-in window. */
export async function walletSign(ui, why, code) {
  await guardLocks();
  const W = await import("./lib/ticket-wallet.js");
  const client = new W.DAppClient({ name: "The Purrancers, live in the Sphere", iconUrl: new URL("assets/purrancers-title.png", import.meta.url).href, appUrl: location.origin + location.pathname, network: { type: W.NetworkType.MAINNET } });
  for (const m of OFF) client[m] = () => Promise.reject(new Error("The show only asks for a sign-in message."));
  try {
    await client.clearActiveAccount();
    const perm = await client.requestPermissions({ scopes: [W.PermissionScope.SIGN] });
    const address = perm && (perm.address || perm.accountInfo?.address); let publicKey = perm && (perm.publicKey || perm.accountInfo?.publicKey);
    if (!ADDR.test(address || "")) throw new Error("No address came back from the wallet.");
    if (!publicKey) { const r = await fetch(`https://api.tzkt.io/v1/accounts/${address}?select=publicKey`); publicKey = r.ok ? await r.json() : null; }
    ui.status("Sign the message in your wallet. It is free and moves nothing.");
    const text = `Tezos Signed Message: ${location.origin} ${new Date().toISOString()} The Purrancers, live in the Sphere. ${why} This is free and does not move anything. Address: ${address} Code: ${code}`;   // the site and the time first, the way Tezos sign-in messages name where they come from
    const payload = micheline(text, W.stringToBytes);
    const { signature } = await client.requestSignPayload({ signingType: W.SigningType.MICHELINE, payload, sourceAddress: address });
    return { address, publicKey, payload, signature };
  } finally { try { await client.clearActiveAccount(); } catch (e) {} try { await client.destroy(); } catch (e) {}
    try { for (const k of Object.keys(localStorage)) if (k.startsWith("beacon:")) localStorage.removeItem(k); } catch (e) {} } }   /* nothing of a pairing is left in the browser after a sign-in (the wallet library's advisory of 2026-11-13) */

/* the check, the same wherever the message was signed: the text is this site's sign-in with this visit's code and the
   address in it, the key belongs to the address, and the signature is the key's */
async function proven(r, code) {
  if (!r || !ADDR.test(r.address || "") || typeof r.payload !== "string" || typeof r.signature !== "string" || !/^0501[0-9a-f]{8}([0-9a-f]{2})+$/.test(r.payload)) return false;
  const bytes = new Uint8Array(r.payload.slice(12).match(/../g).map((h) => parseInt(h, 16)));
  if (parseInt(r.payload.slice(4, 12), 16) !== bytes.length) return false;
  const text = new TextDecoder().decode(bytes);
  if (!text.startsWith(`Tezos Signed Message: ${location.origin} `) || !text.endsWith(` Address: ${r.address} Code: ${code}`)) return false;
  const W = await import("./lib/ticket-wallet.js");
  try { return !!r.publicKey && W.getPkhfromPk(r.publicKey) === r.address && W.verifySignature(r.payload, r.publicKey, r.signature); } catch (e) { return false; } }

export const quiet = (e) => /abort|reject|declin|cancel/i.test(e?.message || e?.errorType || "");
export async function signIn(ui, why = "Sign in to show your ticket.") {
  const known = who.get(); if (known) return known.address;
  ui.status("Opening your wallet…");
  const code = nonce();
  try {
    const r = await walletSign(ui, why, code);
    if (!(await proven(r, code))) throw new Error("That signature did not match the wallet. Try again.");
    who.set({ address: r.address, at: Date.now() }); return r.address;
  } catch (e) { ui.status(quiet(e) ? "No problem. Connect again whenever you are ready." : (e?.message || "Something went wrong. Try again."), true); return null; } }

/* the sign-in window (for the frame): signin.html, a page of the show's own, opened on the visitor's click, signs at the
   top of its own tab where Temple works, and posts the result back to this page only (its own site). It is checked here
   with this visit's code, as above; then done(address). The window's address carries only that random code. */
let signWin = null;
export function windowSignIn(ui, why, done) {
  if (signWin && !signWin.closed) { signWin.focus(); return; }
  const known = who.get(); if (known) { done(known.address); return; }
  const code = nonce(), url = new URL("signin.html", import.meta.url);
  url.hash = new URLSearchParams({ c: code, w: /Prancer/.test(why) ? "p" : "t" }).toString();
  const w = signWin = window.open(url.href, "purrancers-signin", "popup,width=460,height=680");
  if (!w) { ui.status("Your browser blocked the sign-in window. Allow pop-ups for this page, then try again.", true); return; }
  ui.status("Sign in in the new window. This page waits for you.");
  let got = false;
  const on = async (e) => {
    if (e.source !== w || e.origin !== location.origin || !e.data || e.data.type !== "purrancers-signin") return;
    got = true; removeEventListener("message", on);
    if (e.data.error) { ui.status(e.data.quiet ? "No problem. Connect again whenever you are ready." : e.data.error, true); return; }
    if (!(await proven(e.data, code))) { ui.status("That signature did not match the wallet. Try again.", true); return; }
    who.set({ address: e.data.address, at: Date.now() }); ui.status("Signed in. Opening the doors…"); done(e.data.address); };
  addEventListener("message", on);
  const watch = setInterval(() => { if (!w.closed) return; clearInterval(watch);
    setTimeout(() => { if (got) return; removeEventListener("message", on); ui.status("The sign-in window closed. Try again whenever you are ready.", true); }, 1500); }, 700); }

/* Invite passes (Yoeshi, 2026-11-18: "i'd like to be able to generate an invite link to the sphere concerts so people I know that are just
   not going to learn tezos can still see the show when I want them to. kind of like vip pass, or maybe even easier to have a reference code
   they can enter at the door"). He makes a code on his Mac (tools/invite.mjs); a friend types it at the doors, or opens his link, which
   carries it after a # (the part of an address no server is sent). invites.json, beside this file, holds only each code's hash and the day it
   ends: no names, nothing about a guest, and the code itself is not in the page. A pass is kept for this tab's session, as a ticket's is. The
   same honest limit as the ticket: a check in the page keeps casual visitors out, and a code can be passed on, so a code ends on its day and
   he can take one back early (tools/invite.mjs revoke). No wallet, nothing signed, nothing sent anywhere. */
const INV = "purrancers-invite";
const normCode = (c) => String(c || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
/* SHA-256 of the code. The browser's own where it gives it (only to a secure page: inside a frame whose top page is plain http it does not),
   else this plain one, so the doors never hang */
function sha256hex(bytes) { const K = [], H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  for (let n = 2, c = 0; c < 64; n++) { let p = true; for (let i = 2; i * i <= n; i++) if (n % i === 0) { p = false; break; } if (p) K[c++] = (Math.cbrt(n) % 1) * 2 ** 32 | 0; }
  const l = bytes.length, m = new Uint8Array(((l + 9 + 63) >> 6) << 6); m.set(bytes); m[l] = 0x80; const dv = new DataView(m.buffer); dv.setUint32(m.length - 4, l * 8); dv.setUint32(m.length - 8, Math.floor(l / 2 ** 29));
  const r = (x, n) => (x >>> n) | (x << (32 - n)), w = new Array(64);
  for (let o = 0; o < m.length; o += 64) { for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const a = w[i - 15], b = w[i - 2]; w[i] = (w[i - 16] + (r(a, 7) ^ r(a, 18) ^ (a >>> 3)) + w[i - 7] + (r(b, 17) ^ r(b, 19) ^ (b >>> 10))) | 0; }
    let [A, B, C, D, E, F, G, Hh] = H;
    for (let i = 0; i < 64; i++) { const t1 = (Hh + (r(E, 6) ^ r(E, 11) ^ r(E, 25)) + ((E & F) ^ (~E & G)) + K[i] + w[i]) | 0, t2 = ((r(A, 2) ^ r(A, 13) ^ r(A, 22)) + ((A & B) ^ (A & C) ^ (B & C))) | 0;
      Hh = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0; }
    H[0] = (H[0] + A) | 0; H[1] = (H[1] + B) | 0; H[2] = (H[2] + C) | 0; H[3] = (H[3] + D) | 0; H[4] = (H[4] + E) | 0; H[5] = (H[5] + F) | 0; H[6] = (H[6] + G) | 0; H[7] = (H[7] + Hh) | 0; }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join(""); }
async function inviteHash(code) { const bytes = new TextEncoder().encode("purrancers-pass:" + normCode(code));
  if (globalThis.crypto && crypto.subtle) { try { const d = await crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join(""); } catch (e) {} }
  return sha256hex(bytes); }
let invitesP = null;
const loadInvites = () => invitesP || (invitesP = fetch(new URL("invites.json", import.meta.url), { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).then((j) => (Array.isArray(j.passes) ? j.passes : [])).catch(() => []));
/* the code good tonight? -> the pass's id, or null */
export async function tryInvite(code) {
  if (normCode(code).length < 8) return null;
  const [list, h] = await Promise.all([loadInvites(), inviteHash(code)]), now = Date.now();
  const p = list.find((x) => x && x.h === h && (!x.until || Date.parse(x.until) > now) && (!x.from || Date.parse(x.from) <= now));
  if (!p) return null;
  try { sessionStorage.setItem(INV, JSON.stringify({ id: p.id, until: p.until || null })); } catch (e) {}
  return p.id; }
export const hasInvite = () => !!invitePass();
const invitePass = () => { try { const v = JSON.parse(sessionStorage.getItem(INV)); return v && v.id && (!v.until || Date.parse(v.until) > Date.now()) ? v : null; } catch (e) { return null; } };
/* the doors' invite line: "Have an invite code?" under the ticket link, opening a field; a link's #pass= fills it in and goes straight
   in. open() is the doors' own way in (the button's click). Shown only while the doors ask for a ticket. */
export function inviteDoor(after, cfg, open) {
  if (!cfg || !cfg.contract || !after || document.getElementById("invitedoor")) return;
  const wrap = document.createElement("div"); wrap.id = "invitedoor"; wrap.style.cssText = "margin:12px 0 0;font-size:14px";
  const ask = document.createElement("button"); ask.type = "button"; ask.textContent = "Have an invite code?";
  ask.style.cssText = "background:transparent;border:none;box-shadow:none;color:var(--gold);text-decoration:underline;font-size:14px;padding:2px 6px;cursor:pointer";
  const form = document.createElement("form"); form.hidden = true; form.style.cssText = "margin:8px 0 0;display:flex;gap:8px;justify-content:center;flex-wrap:wrap";
  const inp = document.createElement("input"); inp.type = "text"; inp.autocomplete = "off"; inp.spellcheck = false; inp.placeholder = "XXXX-XXXX"; inp.setAttribute("aria-label", "Invite code"); inp.maxLength = 24;
  inp.style.cssText = "font:inherit;font-size:16px;letter-spacing:.12em;text-transform:uppercase;text-align:center;width:11em;padding:7px 10px;border-radius:8px;border:1px solid var(--gold);background:rgba(0,0,0,.35);color:inherit";
  const go = document.createElement("button"); go.type = "submit"; go.textContent = "Come in"; go.style.cssText = "font-size:14px;padding:7px 16px";
  const msg = document.createElement("p"); msg.hidden = true; msg.style.cssText = "margin:8px 0 0;font-size:13px;opacity:.9";
  form.append(inp, go); wrap.append(ask, form, msg); after.after(wrap);   // (the 3D doors keep it beside the ticket link, in their links row)
  ask.onclick = () => { ask.hidden = true; form.hidden = false; inp.focus(); };
  const attempt = async (code) => { go.disabled = true; msg.hidden = false; msg.textContent = "Checking your code…";
    const id = await tryInvite(code); go.disabled = false;
    if (!id) { msg.textContent = "That code is not open tonight. Check it with the person who gave it to you."; return; }
    msg.textContent = "Welcome. Opening the doors…"; open(); };
  form.onsubmit = (e) => { e.preventDefault(); attempt(inp.value); };
  const m = /(?:^|[#&])pass=([^&]+)/.exec(location.hash || "");
  if (m) { const code = decodeURIComponent(m[1]); try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}   // the code off the address bar
    ask.hidden = true; form.hidden = false; inp.value = code; attempt(code); } }

/* ui: { status(text, stop) }; returns true when the visitor may enter */
export async function checkTicket(cfg, ui) {
  if (!cfg.contract) return true;                                                               // no ticket set yet: doors open
  if (testDoor()) return true;   // testing on this Mac
  if (invitePass()) return true;   // a friend with his invite code
  const pass = session.get(); if (pass && pass.contract === cfg.contract) return true;
  const address = await signIn(ui); if (!address) return false;
  try {
    ui.status("Checking your ticket…");
    if (!(await holds(cfg, address))) { ui.status(`This wallet does not hold a ticket yet: ${cfg.need || "the concert film"}.`, true); return false; }
    session.set({ contract: cfg.contract, address, at: Date.now() });
    return true;
  } catch (e) { ui.status(e?.message || "Something went wrong. Try again.", true); return false; } }
