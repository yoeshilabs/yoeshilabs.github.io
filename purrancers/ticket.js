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

/* ui: { status(text), done() } — returns true when the visitor may enter */
export async function checkTicket(cfg, ui) {
  if (!cfg.contract) return true;                                                               // no ticket set yet: doors open
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).get("ticket") === "skip") return true;   // checking the show locally
  const pass = session.get(); if (pass && pass.contract === cfg.contract) return true;
  ui.status("Opening your wallet…");
  const W = await import("./lib/ticket-wallet.js");
  const client = new W.DAppClient({ name: "The Purrancers, live in the Sphere", iconUrl: new URL("assets/purrancers-title.png", location.href).href, appUrl: location.origin + location.pathname, network: { type: W.NetworkType.MAINNET } });
  for (const m of OFF) client[m] = () => Promise.reject(new Error("The show only asks for a sign-in message."));
  try {
    await client.clearActiveAccount();
    const perm = await client.requestPermissions({ scopes: [W.PermissionScope.SIGN] });
    const address = perm && (perm.address || perm.accountInfo?.address); let publicKey = perm && (perm.publicKey || perm.accountInfo?.publicKey);
    if (!/^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/.test(address || "")) throw new Error("No address came back from the wallet.");
    if (!publicKey) { const r = await fetch(`https://api.tzkt.io/v1/accounts/${address}?select=publicKey`); publicKey = r.ok ? await r.json() : null; }
    ui.status("Sign the message in your wallet. It is free and moves nothing.");
    const code = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");
    const text = `Tezos Signed Message: The Purrancers, live in the Sphere. Sign in to show your ticket. This is free and does not move anything. Address: ${address} Time: ${new Date().toISOString()} Code: ${code}`;
    const payload = micheline(text, W.stringToBytes);
    const { signature } = await client.requestSignPayload({ signingType: W.SigningType.MICHELINE, payload, sourceAddress: address });
    if (!publicKey || W.getPkhfromPk(publicKey) !== address || !W.verifySignature(payload, publicKey, signature)) throw new Error("That signature did not match the wallet. Try again.");
    ui.status("Checking your ticket…");
    if (!(await holds(cfg, address))) { ui.status(`This wallet does not hold a ticket yet: ${cfg.need || "the concert film"}.`, true); return false; }
    session.set({ contract: cfg.contract, address, at: Date.now() });
    return true;
  } catch (e) { ui.status(/abort|reject|declin|cancel/i.test(e?.message || e?.errorType || "") ? "No problem. Connect again whenever you are ready." : (e?.message || "Something went wrong. Try again."), true); return false; }
  finally { try { await client.clearActiveAccount(); await client.disconnect?.(); } catch (e) {} } }
