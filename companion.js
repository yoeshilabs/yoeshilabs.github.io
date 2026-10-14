/**
 * MAESTRO, SITE-WIDE: drop this on any Yoeshi Labs wing (same site as the front desk) and Maestro follows visitors who
 * arrived through one of his links. He waits in the bottom-left corner as a small portrait; a tap opens the real Maestro
 * (the front desk page in companion mode, loaded only then) in a panel. The \u00d7 sends him home for the rest of the visit.
 *   <script src="/companion.js" data-wing="prancers" defer></script>
 * Nothing shows for visitors who came another way. No network calls beyond loading Maestro's own page from this site.
 */
(function () {
  "use strict";
  const me = document.currentScript; if (!me || window.top !== window) return;
  const BASE = new URL("./", me.src), KEY = "maestro.follow", WING = (me.dataset.wing || "").replace(/[^a-z0-9-]/gi, "").slice(0, 24);
  if (BASE.origin !== location.origin) return;                         /* only ever runs Maestro from this same site */
  const store = { get() { try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; } }, set(v) { try { v ? sessionStorage.setItem(KEY, "1") : sessionStorage.removeItem(KEY); } catch (e) {} } };
  /* a Maestro link brings ?maestro=1: remember it for this tab, then tidy the address bar */
  const q = new URLSearchParams(location.search);
  if (q.get("maestro") === "1") { store.set(true); q.delete("maestro"); history.replaceState(history.state, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash); }
  if (!store.get()) return;

  const css = `
#mzc{position:fixed;left:max(14px,env(safe-area-inset-left));bottom:max(14px,env(safe-area-inset-bottom));z-index:2147483000;font:14px/1.3 ui-rounded,system-ui,-apple-system,"Segoe UI",sans-serif}
#mzc-btn{display:block;width:64px;height:64px;padding:0;border-radius:50%;border:2px solid #f0b44a;background:#12171a;overflow:hidden;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:mzcbob 4s ease-in-out infinite}
#mzc-btn img{width:100%;height:100%;display:block;object-fit:cover}
#mzc-btn:focus-visible,#mzc-x:focus-visible{outline:3px solid #f0b44a;outline-offset:3px}
#mzc-tip{position:absolute;left:74px;bottom:14px;white-space:nowrap;padding:7px 12px;border-radius:999px;background:rgba(27,19,12,.92);color:#f8eedc;border:1px solid rgba(255,214,140,.35);pointer-events:none;opacity:0;transform:translateX(-6px);transition:opacity .3s,transform .3s}
#mzc:hover #mzc-tip,#mzc.hello #mzc-tip{opacity:1;transform:none}
#mzc-x{position:absolute;left:46px;top:-6px;width:22px;height:22px;border-radius:50%;border:1px solid rgba(255,214,140,.5);background:#1b130c;color:#f8eedc;font-size:13px;line-height:1;cursor:pointer;opacity:.85}
#mzc-panel{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));width:min(400px,calc(100vw - 24px));height:min(660px,calc(100dvh - 24px));border:0;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.5);background:#12171a;display:none}
#mzc.open #mzc-panel{display:block} #mzc.open #mzc-btn,#mzc.open #mzc-x,#mzc.open #mzc-tip{display:none}
#mzc-panel iframe{width:100%;height:100%;border:0;display:block}
@keyframes mzcbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@media (prefers-reduced-motion:reduce){#mzc-btn{animation:none}}
@media (max-width:560px){#mzc-panel{left:0;right:0;bottom:0;width:100%;height:min(88dvh,720px);border-radius:18px 18px 0 0}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const root = document.createElement("div"); root.id = "mzc";
  const btn = document.createElement("button"); btn.id = "mzc-btn"; btn.type = "button"; btn.setAttribute("aria-label", "Ask Maestro, the concierge to everything Yoeshi Labs");
  const img = document.createElement("img"); img.src = new URL("maestro-face.png", BASE).href; img.alt = ""; btn.appendChild(img);
  const tip = document.createElement("span"); tip.id = "mzc-tip"; tip.textContent = "Maestro is here if you need him";
  const x = document.createElement("button"); x.id = "mzc-x"; x.type = "button"; x.textContent = "\u00d7"; x.setAttribute("aria-label", "Send Maestro home for this visit");
  const panel = document.createElement("div"); panel.id = "mzc-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Chat with Maestro");
  root.append(panel, btn, tip, x); document.body.appendChild(root);
  setTimeout(() => { root.classList.add("hello"); setTimeout(() => root.classList.remove("hello"), 3500); }, 900);   /* a quick hello */

  let frame = null;
  function open() { if (!frame) { frame = document.createElement("iframe"); frame.title = "Maestro"; frame.allow = "autoplay";
      const u = new URL("./", BASE); u.searchParams.set("companion", "1"); if (WING) u.searchParams.set("from", WING); frame.src = u.href; panel.appendChild(frame); }
    root.classList.add("open"); setTimeout(() => frame && frame.focus(), 300); }
  function close() { root.classList.remove("open"); btn.focus({ preventScroll: true }); }
  btn.addEventListener("click", open);
  x.addEventListener("click", () => { store.set(false); root.remove(); st.remove(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("open")) close(); });
  /* the panel asks to close itself; only this site's own Maestro frame is listened to */
  addEventListener("message", (e) => { if (e.origin !== location.origin || !frame || e.source !== frame.contentWindow) return;
    if (e.data && e.data.type === "maestro:close") close(); });
})();
