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
   another site inside it (a visitor at the door, 2026-11-08). Phones and other wallets still connect through the
   wallet window. frameNote(after) puts a short line under the door's ticket link saying so, with the show in its own tab
   (where Temple works) as the other way in. Nothing happens outside a frame or with the doors open to everyone. */
export function frameNote(after, cfg) {
  let framed = false; try { framed = window.top !== window.self && !window.top.location.href; } catch (e) { framed = true; }   // (another site's frame: reading where the top page is throws)
  if (!framed || !cfg || !cfg.contract || !after || document.getElementById("framenote")) return;
  const p = document.createElement("p"); p.id = "framenote"; p.style.cssText = "margin:10px 0 0;font-size:13px;opacity:.85";
  const a = document.createElement("a"); a.href = location.href.split("#")[0]; a.target = "_blank"; a.rel = "noopener"; a.textContent = "open the show in its own tab"; a.style.color = "var(--gold)";
  p.append("Using Temple? It cannot connect inside TezTowers (a Temple safety rule since 2 November). Choose your phone in the wallet window, or ", a, ".");
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
export async function signIn(ui, why = "Sign in to show your ticket.") {
  const known = who.get(); if (known) return known.address;
  ui.status("Opening your wallet…");
  await guardLocks();
  const W = await import("./lib/ticket-wallet.js");
  const client = new W.DAppClient({ name: "The Purrancers, live in the Sphere", iconUrl: new URL("assets/purrancers-title.png", location.href).href, appUrl: location.origin + location.pathname, network: { type: W.NetworkType.MAINNET } });
  for (const m of OFF) client[m] = () => Promise.reject(new Error("The show only asks for a sign-in message."));
  try {
    await client.clearActiveAccount();
    const perm = await client.requestPermissions({ scopes: [W.PermissionScope.SIGN] });
    const address = perm && (perm.address || perm.accountInfo?.address); let publicKey = perm && (perm.publicKey || perm.accountInfo?.publicKey);
    if (!ADDR.test(address || "")) throw new Error("No address came back from the wallet.");
    if (!publicKey) { const r = await fetch(`https://api.tzkt.io/v1/accounts/${address}?select=publicKey`); publicKey = r.ok ? await r.json() : null; }
    ui.status("Sign the message in your wallet. It is free and moves nothing.");
    const code = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");
    const text = `Tezos Signed Message: ${location.origin} ${new Date().toISOString()} The Purrancers, live in the Sphere. ${why} This is free and does not move anything. Address: ${address} Code: ${code}`;   // the site and the time first, the way Tezos sign-in messages name where they come from
    const payload = micheline(text, W.stringToBytes);
    const { signature } = await client.requestSignPayload({ signingType: W.SigningType.MICHELINE, payload, sourceAddress: address });
    if (!publicKey || W.getPkhfromPk(publicKey) !== address || !W.verifySignature(payload, publicKey, signature)) throw new Error("That signature did not match the wallet. Try again.");
    who.set({ address, at: Date.now() }); return address;
  } catch (e) { ui.status(/abort|reject|declin|cancel/i.test(e?.message || e?.errorType || "") ? "No problem. Connect again whenever you are ready." : (e?.message || "Something went wrong. Try again."), true); return null; }
  finally { try { await client.clearActiveAccount(); await client.disconnect?.(); } catch (e) {} } }

/* ui: { status(text, stop) } — returns true when the visitor may enter */
export async function checkTicket(cfg, ui) {
  if (!cfg.contract) return true;                                                               // no ticket set yet: doors open
  if (testDoor()) return true;   // testing on this Mac
  const pass = session.get(); if (pass && pass.contract === cfg.contract) return true;
  const address = await signIn(ui); if (!address) return false;
  try {
    ui.status("Checking your ticket…");
    if (!(await holds(cfg, address))) { ui.status(`This wallet does not hold a ticket yet: ${cfg.need || "the concert film"}.`, true); return false; }
    session.set({ contract: cfg.contract, address, at: Date.now() });
    return true;
  } catch (e) { ui.status(e?.message || "Something went wrong. Try again.", true); return false; } }
