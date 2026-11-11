/* The sign-in window. The show's doors inside TezTowers open it (ticket.js windowSignIn) for wallets that cannot connect
   inside another site's frame, Temple first among them. Here, at the top of a tab of the show's own, the wallet connects
   and signs the same free, off-chain sign-in message as at the doors; the result goes back to the doors that opened this
   window (this site only), where it is checked. The window's address carries only that visit's random code. */
import { walletSign, quiet } from "./ticket.js";

const $ = (id) => document.getElementById(id), msg = $("msg"), go = $("go");
const P = new URLSearchParams(location.hash.slice(1)), code = P.get("c") || "";
const why = P.get("w") === "p" ? "Sign in to bring your own Prancer." : "Sign in to show your ticket.";
const doors = window.opener;
const send = (m) => { try { doors.postMessage({ type: "purrancers-signin", ...m }, location.origin); } catch (e) {} };
const ui = { status(text) { msg.textContent = text; } };

async function signIn() {
  go.hidden = true; ui.status("Opening your wallet…");
  try {
    const r = await walletSign(ui, why, code);
    send(r); ui.status("Signed in. Back to the show…"); setTimeout(() => window.close(), 700);
  } catch (e) {
    ui.status(quiet(e) ? "No problem. Connect again whenever you are ready." : (e?.message || "Something went wrong. Try again."));
    go.textContent = "Try again"; go.hidden = false; } }

if (!/^[0-9a-f]{16}$/.test(code) || !doors || doors.closed) ui.status("Open this from the show's doors in TezTowers.");
else { go.onclick = signIn; signIn(); }
