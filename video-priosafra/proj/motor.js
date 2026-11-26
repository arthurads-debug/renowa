// Motor de animação determinístico: tudo é função do tempo t (mesmo t → mesmo quadro).
// Sem timers, sem Math.random, sem animações de CSS. O STUDIO (studio.js) chama render(t) a cada quadro.
import { h, svg } from "./shared/lib.js";

const E = {};
export const ease = (name) => E[name] || (E[name] = name === "none" ? (p) => p : gsap.parseEase(name));
export const seg = (t, t0, d, e = "power3.out") => (d <= 0 ? (t >= t0 ? 1 : 0) : ease(e)(Math.min(1, Math.max(0, (t - t0) / d))));
export const mix = (a, b, p) => a + (b - a) * p;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const SHOWS = [], KEYS = new Map(), FNS = [];
export const STAGE = { W: 1920, H: 1080 };

// Elemento absoluto no palco (ou dentro de outro), já preparado para as variáveis de animação
export function box(parent, { x = 0, y = 0, w, hgt, cls = "", style = {}, origin } = {}, ...kids) {
  const el = h("div", { class: `a ${cls}`, style: { left: `${x}px`, top: `${y}px`, ...(w != null ? { width: `${w}px` } : {}), ...(hgt != null ? { height: `${hgt}px` } : {}), ...(origin ? { transformOrigin: origin } : {}), ...style } }, ...kids);
  parent.append(el);
  return el;
}

// Entrada/saída: tipos up, down, left, right, pop, fade, mask, blur, scale, none
export function show(el, t0, t1 = Infinity, o = {}) {
  SHOWS.push({ el, t0, t1, tin: o.in || "up", tout: o.out || "fade", di: o.di ?? 0.8, dout: o.dout ?? 0.45, ein: o.ein || (o.in === "pop" ? "back.out(1.6)" : "expo.out"), d: o.dist ?? 40 });
  return el;
}
// Movimento por variável (--x, --y, --s, --r, --o) com quadros-chave
export function key(el, v, t0, d, from, to, e = "power3.inOut") {
  if (!KEYS.has(el)) KEYS.set(el, {});
  const m = KEYS.get(el);
  (m[v] = m[v] || []).push({ t0, d, from, to, e });
  m[v].sort((a, b) => a.t0 - b.t0);
  return el;
}
export const move = (el, t0, d, from, to, e) => { for (const k of Object.keys(to)) key(el, k, t0, d, from[k], to[k], e); return el; };
// Função livre a cada quadro (p = progresso 0..1 com easing)
export function fn(t0, d, f, e = "none") { FNS.push({ t0, d, f, e }); }
// Traço SVG que se desenha (pathLength="1" no elemento)
export function ink(el, t0, d, e = "power2.inOut") { el.setAttribute("pathLength", "1"); el.style.strokeDasharray = "1 1"; fn(t0 - 0.0001, d + 0.0001, (p) => (el.style.strokeDashoffset = String(1 - p)), e); el.style.strokeDashoffset = "1"; return el; }
// Contador
export function count(el, t0, d, from, to, fmt = (v) => Math.round(v).toLocaleString("pt-BR")) { fn(t0, d, (p) => (el.textContent = fmt(mix(from, to, p))), "power3.out"); el.textContent = fmt(from); return el; }
// Digitação
export function type(el, t0, d, text) { fn(t0, d, (p) => (el.textContent = text.slice(0, Math.round(text.length * p)))); el.textContent = ""; return el; }

// Texto cinético com máscara (sobe de trás da linha)
export function kin(parent, text, { x, y, size = 72, cls = "", w, align = "left", t0, t1, out = "mask" } = {}) {
  const inner = h("span", { class: "kin__i" }, ...(Array.isArray(text) ? text : [text]));
  const el = box(parent, { x, y, w, cls: `kin ${cls}`, style: { fontSize: `${size}px`, textAlign: align } }, inner);
  if (t0 != null) show(el, t0, t1, { in: "mask", out });
  return el;
}

const SVGNS = "http://www.w3.org/2000/svg";
export function svgLayer(parent, { x = 0, y = 0, w = 1920, hh = 1080, vb, cls = "" } = {}) {
  const s = document.createElementNS(SVGNS, "svg");
  s.setAttribute("viewBox", vb || `0 0 ${w} ${hh}`);
  s.setAttribute("class", `a svgl ${cls}`);
  Object.assign(s.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${hh}px` });
  parent.append(s);
  return s;
}
export function sv(parent, tag, attrs = {}) { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.append(n); return n; }
export const path = (parent, d, cls = "ink", extra = {}) => sv(parent, "path", { d, class: cls, ...extra });

// Aplica um quadro
export function render(t) {
  for (const s of SHOWS) {
    const pin = s.tin === "none" ? (t >= s.t0 ? 1 : 0) : seg(t, s.t0, s.di, s.ein);
    const pout = s.t1 === Infinity || s.tout === "none" && t < s.t1 ? 0 : s.tout === "none" ? 1 : seg(t, s.t1, s.dout, "power2.in");
    const st = s.el.style;
    const vis = pin > 0 && pout < 1;
    st.visibility = vis ? "" : "hidden";
    if (!vis) continue;
    let o = 1, x = 0, y = 0, sc = 1, b = 0;
    const a = 1 - pin;
    switch (s.tin) {
      case "up": y = a * s.d; o = pin; break;
      case "down": y = -a * s.d; o = pin; break;
      case "left": x = -a * s.d * 1.5; o = pin; break;
      case "right": x = a * s.d * 1.5; o = pin; break;
      case "pop": sc = 0.82 + 0.18 * pin; o = Math.min(1, pin * 2); break;
      case "scale": sc = 1.06 - 0.06 * pin; o = pin; break;
      case "blur": b = a * 14; o = pin; break;
      case "fade": o = pin; break;
      case "mask": s.el.firstChild.style.transform = `translateY(${a * 112}%)`; break;
    }
    switch (s.tout) {
      case "fade": o *= 1 - pout; break;
      case "up": y -= pout * s.d * 0.6; o *= 1 - pout; break;
      case "down": y += pout * s.d * 0.6; o *= 1 - pout; break;
      case "blur": b += pout * 14; o *= 1 - pout; break;
      case "scale": sc *= 1 - 0.08 * pout; o *= 1 - pout; break;
      case "mask": if (pout > 0) s.el.firstChild.style.transform = `translateY(${-pout * 112}%)`; break;
    }
    st.setProperty("--io", o.toFixed(4));
    st.setProperty("--ix", `${x.toFixed(2)}px`);
    st.setProperty("--iy", `${y.toFixed(2)}px`);
    st.setProperty("--is", sc.toFixed(4));
    st.setProperty("--ib", `${b.toFixed(2)}px`);
  }
  for (const [el, m] of KEYS) {
    for (const v in m) {
      const segs = m[v];
      let val = segs[0].from;
      for (const k of segs) if (t >= k.t0) val = mix(k.from, k.to, seg(t, k.t0, k.d, k.e));
      const unit = v === "x" || v === "y" ? "px" : v === "r" ? "deg" : "";
      el.style.setProperty(`--${v}`, `${val.toFixed(3)}${unit}`);
    }
  }
  for (const f of FNS) {
    if (t < f.t0 && f._p === 0) continue;
    const p = seg(t, f.t0, f.d, f.e);
    if (p === f._p) continue;
    f._p = p;
    f.f(p, t);
  }
}
export { h, svg };
