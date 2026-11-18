// Utilidades compartilhadas: DOM seguro, formatos pt-BR e datas.

/* ---------- DOM ---------- */
// h("div", { class: "x", onclick }, "texto", filho) — texto entra sempre como textContent (seguro)
export function h(tag, props = {}, ...children) {
  const n = tag === "svg" ? document.createElementNS("http://www.w3.org/2000/svg", "svg") : document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") n.setAttribute("class", v);
    else if (k === "style" && typeof v === "object") for (const [p, val] of Object.entries(v)) p.startsWith("--") ? n.style.setProperty(p, val) : (n.style[p] = val);
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (k === "html") n.innerHTML = v; // só para SVG estático do próprio código
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return n;
}
export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const ICONS = {
  home: '<path d="M4 11.5 12 5l8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>',
  ads: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15v-4M12 15V8M16 15v-6"/>',
  social: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6" fill="currentColor"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/>',
  history: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>',
  whatsapp: '<path d="M5 19l1.2-3.4A7.5 7.5 0 1 1 9 18.3z"/><path d="M9.5 9.5c.3 2 2 3.8 4 4.2l1-1.2 1.6.8c-.2 1-1 1.7-2 1.7-3 0-5.8-2.8-5.8-5.8 0-1 .7-1.8 1.7-2l.8 1.6z"/>',
  logout: '<path d="M14 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="M15 6l-6 6 6 6"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  external: '<path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  edit: '<path d="M5 19h4L19 9l-4-4L5 15z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  heart: '<path d="M12 19s-7-4.4-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 2.5C19 14.6 12 19 12 19z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  rocket: '<path d="M12 15l-3-3c1.5-4.5 4.5-7 9-7 0 4.5-2.5 7.5-7 9z"/><path d="M9 12l-3 .5L4.5 15M12 15l-.5 3L9 19.5M14.5 9.5h.01"/>',
};
export const icon = (name, cls = "ico") =>
  h("svg", { class: cls, viewBox: "0 0 24 24", "aria-hidden": "true", html: ICONS[name] || "" });

/* ---------- Formatos ---------- */
let currency = "BRL";
export const setCurrency = (c) => (currency = c || "BRL");
export const money = (v, compact) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency, notation: compact ? "compact" : "standard", maximumFractionDigits: compact ? 1 : 2, minimumFractionDigits: compact ? 0 : 2 }).format(v || 0);
export const int = (v, compact) => new Intl.NumberFormat("pt-BR", { notation: compact ? "compact" : "standard", maximumFractionDigits: compact ? 1 : 0 }).format(v || 0);
export const dec = (v, d = 1) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v || 0);
export const pct = (v, d = 1) => `${dec((v || 0) * 100, d)}%`;
export const times = (v) => (v > 0 ? `${dec(v, 1)}x` : "—");
export const safeDiv = (a, b) => (b > 0 ? a / b : 0);
export const singular = (label) => label.toLowerCase().replace(/ões\b/, "ão").replace(/(?<=\w)s\b/g, "");

/* ---------- Datas ---------- */
export const parseISO = (s) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const today = () => iso(new Date());
export const addDays = (d, n) => { const x = new Date(typeof d === "string" ? parseISO(d) : d); x.setDate(x.getDate() + n); return x; };
export const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5) + 1;
export function dateList(from, to) {
  const out = [];
  for (let d = parseISO(from); iso(d) <= to; d.setDate(d.getDate() + 1)) out.push(iso(d));
  return out;
}
export const fmtDay = (s) => { const d = parseISO(s); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`; };
export const fmtDayLong = (s) => parseISO(s).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
export const fmtFull = (s) => parseISO(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
export const fmtMonth = (ym, style = "long") => new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1).toLocaleDateString("pt-BR", style === "short" ? { month: "short", year: "2-digit" } : { month: "long", year: "numeric" });
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
