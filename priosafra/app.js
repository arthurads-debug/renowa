// Motor da apresentação: capítulos, navegação (teclado, clique, toque), progresso,
// menu, tela cheia, pausa das animações e apresentação guiada.
import { h, icon, logoRenowa, markPrio } from "./lib.js";
import { abertura, potencial, ecossistema } from "./chapters/inicio.js";
import { instagram } from "./chapters/instagram.js";
import { audiovisual } from "./chapters/audiovisual.js";
import { site, atendente } from "./chapters/site.js";
import { trafego } from "./chapters/trafego.js";
import { dashboard, atualizacao } from "./chapters/dashboard.js";
import { conteudo, noventa, estrutura } from "./chapters/operacao.js";
import { comparativo, condicao, economia } from "./chapters/investimento.js";
import { encerramento } from "./chapters/encerramento.js";
import { video } from "./chapters/video.js";

const CHAPTERS = [abertura, potencial, ecossistema, instagram, audiovisual, site, atendente, trafego, dashboard, atualizacao, conteudo, noventa, estrutura, comparativo, condicao, economia, video, encerramento];

const $ = (s) => document.querySelector(s);
const deck = $("#deck");
const root = document.documentElement;
const state = { i: -1, busy: false, guided: null, built: new Map() };
const pad = (n) => String(n).padStart(2, "0");

/* ---------- Construção ---------- */
function section(ch, idx) {
  if (state.built.has(idx)) return state.built.get(idx);
  const el = h("section", { class: `ch ch--${ch.theme || "dark"} ch--${ch.id}`, id: `cap-${ch.id}`, "aria-label": `${pad(idx + 1)} · ${ch.title}`, "data-idx": idx });
  try {
    const inner = ch.build({ go, next, idx });
    el.append(inner);
  } catch (e) {
    console.error(e);
    el.append(h("div", { class: "ch-error" }, h("p", {}, "Não foi possível carregar este capítulo."), h("button", { class: "btn btn--ghost", onclick: () => location.reload() }, "Recarregar")));
  }
  deck.append(el);
  state.built.set(idx, el);
  return el;
}

/* ---------- Navegação ---------- */
async function go(idx, { instant = false } = {}) {
  idx = Math.max(0, Math.min(CHAPTERS.length - 1, idx));
  if (idx === state.i || state.busy) return;
  const from = state.i;
  const out = from >= 0 ? state.built.get(from) : null;
  const ch = CHAPTERS[idx];
  const el = section(ch, idx);
  state.busy = true;
  const dir = idx > from ? 1 : -1;
  if (out) { try { CHAPTERS[from].leave?.(out); } catch (e) { console.error(e); } }

  el.classList.add("is-active");
  el.scrollTop = 0;
  root.dataset.theme = ch.theme || "dark";
  const quick = instant || root.classList.contains("is-paused") || !window.gsap;
  if (!quick) {
    const tl = gsap.timeline();
    if (out) tl.to(out, { opacity: 0, scale: 0.985, y: -dir * 18, duration: 0.45, ease: "power2.in" }, 0);
    tl.fromTo(el, { opacity: 0, clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" }, { opacity: 1, clipPath: "inset(0 0 0 0%)", duration: 0.9, ease: "expo.inOut" }, out ? 0.15 : 0);
    await tl.then();
  } else {
    gsap?.set?.(el, { opacity: 1, clipPath: "none" });
    el.style.opacity = 1;
  }
  if (out) { out.classList.remove("is-active"); gsap?.set?.(out, { clearProps: "all" }); out.style.opacity = ""; }
  el.style.clipPath = "";
  state.i = idx;
  history.replaceState(null, "", `#${ch.id}`);
  chrome();
  try { ch.enter?.(el); } catch (e) { console.error(e); }
  state.busy = false;
  // pré-monta o próximo para a transição ficar leve
  if (idx + 1 < CHAPTERS.length) requestIdleCallback?.(() => section(CHAPTERS[idx + 1], idx + 1)) ?? setTimeout(() => section(CHAPTERS[idx + 1], idx + 1), 300);
}
function next() {
  const ch = CHAPTERS[state.i];
  const el = state.built.get(state.i);
  if (ch?.step && ch.step(el, 1)) return; // passos internos (revelações) primeiro
  go(state.i + 1);
}
function prev() {
  const ch = CHAPTERS[state.i];
  const el = state.built.get(state.i);
  if (ch?.step && ch.step(el, -1)) return;
  go(state.i - 1);
}

/* ---------- Interface ---------- */
function chrome() {
  $("#count").textContent = `${pad(state.i + 1)} / ${CHAPTERS.length}`;
  document.querySelectorAll(".prog__seg").forEach((s, i) => { s.classList.toggle("is-done", i < state.i); s.classList.toggle("is-on", i === state.i); s.setAttribute("aria-selected", String(i === state.i)); });
  document.querySelectorAll(".menu__list li").forEach((li, i) => li.classList.toggle("is-on", i === state.i));
  $("#prev").disabled = state.i === 0;
  $("#next").disabled = state.i === CHAPTERS.length - 1;
}

function setupChrome() {
  $("#lockup").append(logoRenowa({ tone: "light", cls: "rlogo rlogo--sm" }), h("span", { class: "lockup__x" }, "×"), markPrio({ cls: "pmark pmark--sm" }), h("span", { class: "lockup__t" }, "PrioSafra"));
  $("#lockup").addEventListener("click", () => go(0));
  $("#prev").append(icon("arrowL"));
  $("#next").append(icon("arrowR"));
  $("#prev").addEventListener("click", prev);
  $("#next").addEventListener("click", next);
  $("#t-guided .tool__ic").append(icon("play"));
  $("#t-pause .tool__ic").append(icon("pause"));
  $("#t-full .tool__ic").append(icon("expand"));
  $("#t-menu .tool__ic").append(icon("menu"));

  const prog = $("#prog");
  CHAPTERS.forEach((ch, i) => prog.append(h("button", { class: "prog__seg", type: "button", role: "tab", "aria-label": `${pad(i + 1)} · ${ch.title}`, title: ch.title, onclick: () => go(i) }, h("span"))));
  const list = $("#menu-list");
  CHAPTERS.forEach((ch, i) => list.append(h("li", {}, h("button", { type: "button", onclick: () => { toggleMenu(false); go(i); } }, h("span", { class: "menu__n" }, pad(i + 1)), h("span", {}, ch.title)))));

  $("#t-menu").addEventListener("click", () => toggleMenu());
  $("#menu").addEventListener("click", (e) => { if (e.target.id === "menu") toggleMenu(false); });
  $("#t-full").addEventListener("click", fullscreen);
  $("#t-pause").addEventListener("click", togglePause);
  $("#t-guided").addEventListener("click", () => guided(!state.guided));
}
function toggleMenu(open) {
  const m = $("#menu");
  const on = open ?? m.hidden;
  m.hidden = !on;
  $("#t-menu").setAttribute("aria-expanded", String(on));
  if (on) m.querySelector(".is-on button, button")?.focus();
}
function fullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
}
document.addEventListener("fullscreenchange", () => root.classList.toggle("is-full", !!document.fullscreenElement));
function togglePause() {
  const on = !root.classList.contains("is-paused");
  root.classList.toggle("is-paused", on);
  $("#t-pause").setAttribute("aria-pressed", String(on));
  $("#t-pause .tool__t").textContent = on ? "Pausadas" : "Animações";
  if (window.gsap) gsap.globalTimeline.paused(on);
  document.querySelectorAll("video").forEach((v) => (on ? v.pause() : v.play?.().catch(() => {})));
}
// Guiada: avança sozinho no tempo de cada capítulo; qualquer interação manual encerra
function guided(on) {
  clearTimeout(state.guided);
  state.guided = null;
  $("#t-guided").setAttribute("aria-pressed", String(!!on));
  root.classList.toggle("is-guided", !!on);
  if (!on) return;
  const tick = () => {
    if (state.i >= CHAPTERS.length - 1) return guided(false);
    const dur = (CHAPTERS[state.i].duration || 16) * 1000;
    root.style.setProperty("--guided-dur", `${dur}ms`);
    root.classList.remove("guided-run"); void root.offsetWidth; root.classList.add("guided-run");
    state.guided = setTimeout(() => { go(state.i + 1).then(tick); }, dur);
  };
  tick();
}

/* ---------- Teclado e toque ---------- */
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select, [contenteditable], video")) return;
  const k = e.key;
  if (["ArrowRight", "PageDown", " "].includes(k)) { e.preventDefault(); guided(false); next(); }
  else if (["ArrowLeft", "PageUp"].includes(k)) { e.preventDefault(); guided(false); prev(); }
  else if (k === "Home") go(0);
  else if (k === "End") go(CHAPTERS.length - 1);
  else if (k === "f" || k === "F") fullscreen();
  else if (k === "p" || k === "P") togglePause();
  else if (k === "g" || k === "G") guided(!state.guided);
  else if (k === "m" || k === "M") toggleMenu();
  else if (k === "Escape") toggleMenu(false);
});
let touch = null;
deck.addEventListener("touchstart", (e) => { if (e.touches.length === 1) touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; }, { passive: true });
deck.addEventListener("touchend", (e) => {
  if (!touch) return;
  const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
  const ok = Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - touch.t < 600 && !e.target.closest("[data-noswipe]");
  touch = null;
  if (ok) { guided(false); dx < 0 ? next() : prev(); }
}, { passive: true });

/* ---------- Início ---------- */
function start() {
  setupChrome();
  const hash = location.hash.slice(1);
  const at = Math.max(0, CHAPTERS.findIndex((c) => c.id === hash));
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) togglePause();
  go(at, { instant: at > 0 }).then(() => document.getElementById("boot")?.classList.add("is-gone"));
}
const waitGsap = () => (window.gsap ? start() : setTimeout(waitGsap, 30));
let tries = 0;
(function boot() { if (window.gsap || ++tries > 100) start(); else setTimeout(boot, 30); })();
window.__deck = { go, next, prev, chapters: CHAPTERS };
