/* Your own Prancer Portraits at the doors: the Portraits a wallet holds, read from TzKT (read only: an address in, public
   token data out), each with the seed its mint drew from (aleaSeed in the token's metadata). The 3D genes roll the same
   cat from the same seed (checked against the minted names, hats and outfits), so the cat you walk in as is the cat you
   hold. The address comes from the doors' sign-in (ticket.js signIn), never typed in, outside testing on this Mac.
     portraitsOf(address) -> [{ id, no, name, seed }]      isMintSeed(seed)
   Prancer 3D mints the same way (the generator on Aleatory; PRANCER_3D is filled on launch day, any of its mints), each
   rolled by the generator's own buildCat (prancer-3d/gen/src/cat.js): same seed, same cat as its cover.
     prancer3dOf(address) -> [{ id, no, name: "", seed }]   (empty until PRANCER_3D is set) */
export const PORTRAITS = "KT1KD3b5LZQ8qaoXcN4ZM7w6sk1miapkZodY";   // Prancer Portraits, Chapter 03, on Aleatory
export const PRANCER_3D = "KT1AWMEruwAERUDcW2ppS8oXnEdjn6w4xqyn";   // Prancer 3D, the generator on Aleatory: its contract goes here on launch day (codex/launch.md), and in show/ticket.json
const ADDR = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
export const isMintSeed = (s) => /^o[1-9A-HJ-NP-Za-km-z]{50}$/.test(s || "");   // an operation hash: what Aleatory seeds a mint with
export async function portraitsOf(address) {
  if (!ADDR.test(address || "")) return [];
  const q = new URLSearchParams({ account: address, "token.contract": PORTRAITS, "balance.gt": "0", select: "token.tokenId,token.metadata", "sort.asc": "id", limit: "500" });
  const r = await fetch(`https://api.tzkt.io/v1/tokens/balances?${q}`); if (!r.ok) throw new Error("The lookup did not answer. Try again in a moment.");
  const rows = await r.json(); if (!Array.isArray(rows)) return [];
  const out = [];
  for (const row of rows) { const m = row && row["token.metadata"], seed = m && m.aleaSeed; if (!isMintSeed(seed)) continue;   // anything not shaped like a mint's seed is left out
    const full = typeof m.name === "string" ? m.name : "", no = (full.match(/#(\d{1,6})/) || [])[1] || String(+row["token.tokenId"] + 1);
    const attr = Array.isArray(m.attributes) ? m.attributes.find((x) => x && x.name === "Name") : null, name = String((attr && attr.value) || full.split("·").pop() || "").trim().slice(0, 60);
    out.push({ id: String(row["token.tokenId"]), no, name, seed }); }
  return out.sort((a, b) => +a.no - +b.no); }
/* TzKT can take hours to read a new mint's metadata (Prancer 3D #1 and #2 still had none an hour after they were minted,
   2026-11-11), so a mint without it takes its seed from the chain itself: the hash of the operation that minted it, which is
   what Aleatory seeds a mint with (aleaSeed equals it on every mint checked). Tokens minted together in one operation are left
   out until TzKT has their metadata (this way cannot tell their seeds apart). */
async function mintSeeds(contract, ids) {
  if (!ids.length) return {};
  const q = new URLSearchParams({ "token.contract": contract, "token.tokenId.in": ids.join(","), "from.null": "true", select: "token.tokenId,transactionId", limit: "500" });
  const r = await fetch(`https://api.tzkt.io/v1/tokens/transfers?${q}`); if (!r.ok) return {};
  const rows = await r.json(); if (!Array.isArray(rows)) return {};
  const byTx = {}; for (const x of rows) if (x && x.transactionId) (byTx[x.transactionId] ||= []).push(String(x["token.tokenId"]));
  const tx = Object.keys(byTx).filter((k) => byTx[k].length === 1); if (!tx.length) return {};
  const r2 = await fetch(`https://api.tzkt.io/v1/operations/transactions?${new URLSearchParams({ "id.in": tx.join(","), select: "id,hash", limit: "500" })}`); if (!r2.ok) return {};
  const ops = await r2.json(), out = {};
  for (const o of Array.isArray(ops) ? ops : []) { const id = o && byTx[o.id] && byTx[o.id][0]; if (id && isMintSeed(o.hash)) out[id] = o.hash; }
  return out; }
export async function prancer3dOf(address) {
  if (!PRANCER_3D || !ADDR.test(address || "")) return [];
  const q = new URLSearchParams({ account: address, "token.contract": PRANCER_3D, "balance.gt": "0", select: "token.tokenId,token.metadata", "sort.asc": "id", limit: "500" });
  const r = await fetch(`https://api.tzkt.io/v1/tokens/balances?${q}`); if (!r.ok) throw new Error("The lookup did not answer. Try again in a moment.");
  const rows = await r.json(); if (!Array.isArray(rows)) return [];
  const out = [], need = rows.filter((row) => !isMintSeed(row && row["token.metadata"] && row["token.metadata"].aleaSeed)).map((row) => String(row["token.tokenId"])), chain = await mintSeeds(PRANCER_3D, need).catch(() => ({}));
  for (const row of rows) { const m = row && row["token.metadata"], id = String(row["token.tokenId"]), seed = isMintSeed(m && m.aleaSeed) ? m.aleaSeed : chain[id]; if (!isMintSeed(seed)) continue;
    const no = (String((m && m.name) || "").match(/#(\d{1,6})/) || [])[1] || String(+id + 1); out.push({ id, no, name: "", seed }); }
  return out.sort((a, b) => +a.no - +b.no); }
