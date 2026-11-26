// Utilitários de interface: criação de elementos, ícones, logotipos e formatação.
import { FOTOS } from "./config.js";

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(tag === "svg" || attrs.__svg ? "http://www.w3.org/2000/svg" : "http://www.w3.org/1999/xhtml", tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false || k === "__svg") continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(String(k)));
  return el;
}
export const svg = (markup, cls = "") => { const t = document.createElement("template"); t.innerHTML = markup.trim(); const s = t.content.firstChild; if (cls) s.setAttribute("class", cls); return s; };

export const brl = (v, d = 0) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: d, maximumFractionDigits: d });
export const num = (v, d = 0) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
export const foto = (k) => FOTOS[k] || k;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const reduced = () => document.documentElement.classList.contains("is-paused") || matchMedia("(prefers-reduced-motion: reduce)").matches;

// Contador animado (respeita pausa)
export function countTo(el, to, { dur = 1.4, fmt = (v) => num(v), from = 0 } = {}) {
  if (reduced() || !window.gsap) { el.textContent = fmt(to); return; }
  const o = { v: from };
  return gsap.to(o, { v: to, duration: dur, ease: "power3.out", onUpdate: () => (el.textContent = fmt(o.v)) });
}

/* ---------- Ícones (traço 1.6, estilo Lucide) ---------- */
const P = {
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
  corn: '<path d="M12 21c-2.2-1.6-3.5-4.6-3.5-8.5C8.5 7.6 10 4 12 3c2 1 3.5 4.6 3.5 9.5 0 3.9-1.3 6.9-3.5 8.5Z"/><path d="M9 9h6M8.6 12.5h6.8M9 16h6M12 4v16"/><path d="M8.5 13C6 14 4.5 16.5 4.5 20M15.5 13c2.5 1 4 3.5 4 7"/>',
  sorgo: '<path d="M12 22V11"/><circle cx="12" cy="5" r="1.6"/><circle cx="9.5" cy="7.5" r="1.6"/><circle cx="14.5" cy="7.5" r="1.6"/><circle cx="12" cy="9.5" r="1.6"/><path d="M12 16c-2.5-.5-4.5-2-5.5-4M12 18c2.5-.5 4.5-2 5.5-4"/>',
  grass: '<path d="M3 20h18"/><path d="M6 20c0-4-1-7-3-9M9 20c0-5 .5-9 2-12M13 20c0-4 1-7 3.5-9.5M17 20c0-3 1.5-5 4-6"/>',
  sun: '<circle cx="12" cy="10" r="3.5"/><path d="M12 2v2M4.9 4.9l1.4 1.4M19.1 4.9l-1.4 1.4M2 10h2M20 10h2"/><path d="M3 19c3-2.5 6-3.5 9-3.5s6 1 9 3.5M6 22c2-1.3 4-2 6-2s4 .7 6 2"/>',
  handshake: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5.1 5.1 0 0 1 6.4-.6l.5.3a3 3 0 0 0 2.3.4L21 4"/><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.6-.8 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1.1 0-.9.8-1.7 1.7-1.7H16a6 6 0 0 0 6-6C22 6 17.5 2 12 2Z"/>',
  insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
  camera: '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  pen: '<path d="M12 19l7-7 3 3-7 7-3-3Z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z"/><path d="m2 2 7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>',
  bot: '<rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4M8 4h8"/><circle cx="9" cy="14" r="1.2" fill="currentColor"/><circle cx="15" cy="14" r="1.2" fill="currentColor"/>',
  brain: '<path d="M12 5a3 3 0 1 0-6 .1 4 4 0 0 0-2.5 5.8A4 4 0 0 0 6 18a4 4 0 0 0 6 1.5V5Z"/><path d="M12 5a3 3 0 1 1 6 .1 4 4 0 0 1 2.5 5.8A4 4 0 0 1 18 18a4 4 0 0 1-6 1.5"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  wa: '<path d="M3 21l1.7-4.6A8.5 8.5 0 1 1 8 19.6L3 21Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-1.9-1-1 .8a4 4 0 0 1-2.2-2.2l.8-1-1-1.9L9 9.5Z"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  play: '<path d="M7 4v16l13-8L7 4Z"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  cursor: '<path d="m4 4 7 17 2.5-7.5L21 11 4 4Z"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7 7-7Z"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  reel: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 8h18M8 3l3 5M14 3l3 5"/><path d="m10 12 5 3-5 3v-6Z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  smartphone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  google: '<path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9.1L6.4 14Z"/><path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5L6.4 10C7.2 7.7 9.4 6 12 6Z"/>',
  fb: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z"/>',
  yt: '<path d="M22.5 6.4a2.8 2.8 0 0 0-2-2C18.8 4 12 4 12 4s-6.8 0-8.5.4a2.8 2.8 0 0 0-2 2C1 8.1 1 12 1 12s0 3.9.5 5.6a2.8 2.8 0 0 0 2 2c1.7.4 8.5.4 8.5.4s6.8 0 8.5-.4a2.8 2.8 0 0 0 2-2c.5-1.7.5-5.6.5-5.6s0-3.9-.5-5.6Z"/><path d="m9.8 15.5 5.7-3.5-5.7-3.5v7Z"/>',
  home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z"/><path d="M9 22V12h6v10"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
};
export const icon = (name, cls = "ic") => svg(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.leaf}</svg>`, cls);

/* ---------- Logotipos ----------
   PrioSafra: reconstrução vetorial a partir do material da proposta (anel dourado + duas folhas formando um "check").
   Substituir pelo arquivo oficial (SVG/PNG em alta) assim que a PrioSafra enviar: basta trocar `markPrio`. */
export function markPrio({ cls = "pmark", ring = "#B8955B", dark = "#0B4A32", light = "#1F8F4E", draw = false } = {}) {
  return svg(`<svg viewBox="0 0 124 124" ${draw ? 'data-draw="1"' : ""} aria-hidden="true">
    <circle cx="56" cy="66" r="47" fill="none" stroke="${ring}" stroke-width="7.5" class="pm-ring"/>
    <circle cx="56" cy="66" r="37.5" fill="none" stroke="${ring}" stroke-width="1.6" opacity=".9" class="pm-ring2"/>
    <path class="pm-leaf2" fill="${light}" d="M52 101C38 97 23 86 15 64c15-1 31 6 37 20.5 1.4 3.6 1.6 9 0 16.5Z"/>
    <path class="pm-leaf2s" fill="${dark}" opacity=".35" d="M52 101c-6-9-16-21-37-37 15 9 29 17 37 37Z"/>
    <path class="pm-leaf1" fill="${dark}" d="M52 101C45 72 62 30 121 6c-4 33-17 62-42 82-8 6-17 10-27 13Z"/>
  </svg>`, cls);
}
export function logoPrio({ tone = "dark", cls = "plogo" } = {}) {
  const ink = tone === "light" ? "#F5F4EE" : "#0B4A32";
  const sub = tone === "light" ? "rgba(245,244,238,.72)" : "#5B625E";
  return h("div", { class: `${cls} plogo--${tone}`, role: "img", "aria-label": "PrioSafra Agronegócio" },
    markPrio({ light: tone === "light" ? "#3FB56E" : "#1F8F4E", dark: tone === "light" ? "#E9F2EC" : "#0B4A32" }),
    h("div", { class: "plogo__type" },
      h("span", { class: "plogo__w", style: { color: ink } }, "PRÍO", h("br"), "SAFRA"),
      h("span", { class: "plogo__s", style: { color: sub } }, "AGRONEGÓCIO")));
}
// Renowa: símbolo "R" geométrico (mesmo do site da agência)
export function logoRenowa({ tone = "light", cls = "rlogo" } = {}) {
  return h("div", { class: `${cls} rlogo--${tone}`, role: "img", "aria-label": "Renowa" },
    svg(`<svg viewBox="0 0 1060 724" aria-hidden="true"><path fill="#FA4802" d="M412 0H837L717.6 210H547L255 723H1Z M717.6 210H970L1059 367L978 509H765L887 723H667L467 369H807Z"/></svg>`),
    h("span", {}, "Renowa"));
}

/* ---------- Dispositivos ---------- */
export function phone(content, { cls = "", label = "", dark = false } = {}) {
  return h("div", { class: `phone ${dark ? "phone--dark" : ""} ${cls}` },
    h("div", { class: "phone__frame" },
      h("div", { class: "phone__island" }),
      h("div", { class: "phone__screen" }, content)),
    label ? h("p", { class: "phone__label" }, label) : null);
}
export function statusBar(dark = false) {
  return h("div", { class: `sbar ${dark ? "sbar--dark" : ""}` }, h("span", {}, "9:41"),
    h("span", { class: "sbar__r" }, svg('<svg viewBox="0 0 18 12"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>'),
      svg('<svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor"/><rect x="2.5" y="2.5" width="16" height="7" rx="1.5"/><rect x="23.5" y="4" width="2" height="4" rx="1"/></svg>')));
}

// Entrada coreografada: elementos com data-in aparecem em sequência (ordem do DOM ou data-in="n")
export function reveal(scope, { delay = 0.15, stagger = 0.09 } = {}) {
  const els = [...scope.querySelectorAll("[data-in]")].sort((a, b) => (+a.dataset.in || 0) - (+b.dataset.in || 0));
  if (!window.gsap || reduced()) { els.forEach((e) => { e.style.opacity = 1; e.style.transform = "none"; e.classList.add("is-shown"); }); return null; }
  gsap.killTweensOf(els);
  return gsap.fromTo(els, { opacity: 0, y: 28, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "expo.out", stagger, delay, clearProps: "filter", onComplete: () => els.forEach((e) => e.classList.add("is-shown")) });
}
export function unreveal(scope) {
  const els = scope.querySelectorAll("[data-in]");
  if (window.gsap) gsap.killTweensOf(els);
  els.forEach((e) => { e.style.opacity = ""; e.style.transform = ""; e.classList.remove("is-shown"); });
}

// Rótulo padrão para o que é demonstração
export const demoTag = (t = "Demonstração") => h("span", { class: "demo-tag" }, icon("info", "ic ic--xs"), t);
