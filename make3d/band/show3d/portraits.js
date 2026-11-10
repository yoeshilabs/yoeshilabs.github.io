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
export async function prancer3dOf(address) {
  if (!PRANCER_3D || !ADDR.test(address || "")) return [];
  const q = new URLSearchParams({ account: address, "token.contract": PRANCER_3D, "balance.gt": "0", select: "token.tokenId,token.metadata", "sort.asc": "id", limit: "500" });
  const r = await fetch(`https://api.tzkt.io/v1/tokens/balances?${q}`); if (!r.ok) throw new Error("The lookup did not answer. Try again in a moment.");
  const rows = await r.json(); if (!Array.isArray(rows)) return [];
  const out = [];
  for (const row of rows) { const m = row && row["token.metadata"], seed = m && m.aleaSeed; if (!isMintSeed(seed)) continue;
    const no = (String((m && m.name) || "").match(/#(\d{1,6})/) || [])[1] || String(+row["token.tokenId"] + 1); out.push({ id: String(row["token.tokenId"]), no, name: "", seed }); }
  return out.sort((a, b) => +a.no - +b.no); }
