/* Temple's own way in (Yoeshi, 2026-11-18: "the error where it doesn't recognize the temple extension is still pretty annoying, and i cant even
   get in the traditional route the alternate path is for phone it seems"). The wallet library's chooser does not always see the Temple
   extension (it misses it when a sign-in starts as the library starts, and after a sign-in in the same tab), and then offers only a phone. Temple
   answers a page of its own directly, by window messages (the protocol of its dapp package, @temple-wallet/dapp 12.0.0, read from its source):
   a PING it answers with PONG, a permission request that returns the address and public key, and a sign request for one payload. Only those
   three are ever sent: no operation, no broadcast. Inside another site's frame Temple does not answer (its rule since 2 November), so there the
   doors keep the sign-in window of their own (signin.html), where this works. */
const REQ = "TEMPLE_PAGE_REQUEST", RES = "TEMPLE_PAGE_RESPONSE", ERR = "TEMPLE_PAGE_ERROR_RESPONSE";
const id = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => b.toString(16).padStart(2, "0")).join("");
/* is Temple here, in this page? (it answers within half a second) */
export function available(ms = 600) { return new Promise((res) => { let done = false;
  const on = (e) => { if (e.source === window && e.data && e.data.type === RES && e.data.payload === "PONG") fin(true); };
  const fin = (v) => { if (done) return; done = true; removeEventListener("message", on); clearTimeout(t); res(v); };
  addEventListener("message", on); window.postMessage({ type: REQ, payload: "PING" }, "*"); const t = setTimeout(() => fin(false), ms); }); }
function ask(payload, ms = 180000) { return new Promise((res, rej) => { const reqId = id();
  const on = (e) => { const d = e.data; if (e.source !== window || !d || d.reqId !== reqId) return;
    if (d.type === RES) { end(); res(d.payload); } else if (d.type === ERR) { end(); rej(new Error(d.payload === "NOT_GRANTED" ? "Declined in Temple." : d.payload === "NOT_FOUND" ? "Temple has no account open. Unlock it and try again." : "Temple could not do that. Try again.")); } };
  const end = () => { removeEventListener("message", on); clearTimeout(t); };
  addEventListener("message", on); window.postMessage({ type: REQ, payload, reqId }, "*"); const t = setTimeout(() => { end(); rej(new Error("Temple did not answer. Open it and try again.")); }, ms); }); }
const hexOf = (s) => Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join("");
/* one sign-in: Temple shares the address (and its key), then signs the text made for that address, as a Micheline string (05 01, the length,
   the text), as a Tezos wallet signs a message. Returns { address, publicKey, payload, signature }, checked by the caller as any other */
export async function signIn(name, textFor, ui) {
  const p = await ask({ type: "PERMISSION_REQUEST", network: "mainnet", appMeta: { name }, force: false });
  if (!p || !/^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/.test(p.pkh || "")) throw new Error("No address came back from Temple.");
  if (ui) ui.status("Sign the message in Temple. It is free and moves nothing.");
  const hex = hexOf(textFor(p.pkh)), payload = "0501" + (hex.length / 2).toString(16).padStart(8, "0") + hex;
  const s = await ask({ type: "SIGN_REQUEST", sourcePkh: p.pkh, payload });
  return { address: p.pkh, publicKey: p.publicKey, payload, signature: s && s.signature }; }
