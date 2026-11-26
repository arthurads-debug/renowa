// Gráficos leves em SVG: linhas/áreas com cruz de leitura e barras horizontais.
// Um eixo só, traço fino, rótulos em cor de texto (a cor fica na marca).
import { h, svg, num, reduced } from "./lib.js";

export function lineChart({ labels, series, height = 220, fmt = (v) => num(v), area = true, yTicks = 3 }) {
  const W = 800, H = height, P = { l: 44, r: 12, t: 12, b: 26 };
  const max = Math.max(1, ...series.flatMap((s) => s.values)) * 1.12;
  const n = labels.length;
  const x = (i) => P.l + (i / Math.max(1, n - 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const grid = Array.from({ length: yTicks + 1 }, (_, i) => { const v = (max / yTicks) * i; return `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end">${fmtShort(v)}</text>`; }).join("");
  const step = Math.ceil(n / 7);
  const xl = labels.map((l, i) => (i % step === 0 || i === n - 1 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${l}</text>` : "")).join("");
  const paths = series.map((s, k) => {
    const d = s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const a = `${d} L${x(n - 1).toFixed(1)} ${y(0)} L${x(0)} ${y(0)} Z`;
    return `${area ? `<path class="lc__area" d="${a}" fill="${s.color}" opacity="${k ? 0.12 : 0.18}"/>` : ""}<path class="lc__line" d="${d}" stroke="${s.color}"/>`;
  }).join("");
  const el = svg(`<svg class="lc" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g class="lc__grid">${grid}${xl}</g><g class="lc__plot">${paths}</g><line class="lc__x" y1="${P.t}" y2="${H - P.b}" x1="-10" x2="-10"/>${series.map((s) => `<circle class="lc__dot" r="4.5" fill="${s.color}" cx="-10" cy="-10"/>`).join("")}<rect class="lc__hit" x="${P.l}" y="0" width="${W - P.l - P.r}" height="${H}" fill="transparent"/></svg>`);
  const tip = h("div", { class: "lc__tip", hidden: true });
  const wrap = h("div", { class: "lc__wrap" }, el, tip,
    series.length > 1 ? h("div", { class: "lc__leg" }, series.map((s) => h("span", {}, h("i", { style: { background: s.color } }), s.name))) : null);
  el.querySelector(".lc__hit").addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const fx = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round(((fx - P.l) / (W - P.l - P.r)) * (n - 1))));
    const ln = el.querySelector(".lc__x"); ln.setAttribute("x1", x(i)); ln.setAttribute("x2", x(i));
    el.querySelectorAll(".lc__dot").forEach((d, k) => { d.setAttribute("cx", x(i)); d.setAttribute("cy", y(series[k].values[i])); });
    tip.hidden = false;
    tip.replaceChildren(h("b", {}, labels[i]), ...series.map((s) => h("span", {}, h("i", { style: { background: s.color } }), `${s.name}: `, h("strong", {}, fmt(s.values[i])))));
    const left = (x(i) / W) * r.width;
    tip.style.left = `${Math.min(r.width - 160, Math.max(0, left + 12))}px`;
  });
  el.querySelector(".lc__hit").addEventListener("pointerleave", () => { tip.hidden = true; el.querySelector(".lc__x").setAttribute("x1", -10); el.querySelector(".lc__x").setAttribute("x2", -10); el.querySelectorAll(".lc__dot").forEach((d) => d.setAttribute("cx", -10)); });
  return wrap;
}
export function drawIn(scope) {
  if (!window.gsap || reduced()) return;
  scope.querySelectorAll(".lc__plot").forEach((g) => gsap.fromTo(g, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.6, ease: "power2.inOut" }));
  scope.querySelectorAll(".bl__bar i").forEach((b) => gsap.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "expo.out", transformOrigin: "left" }));
}
export function barList(items, { fmt = (v) => num(v), color = "#1E12EA" } = {}) {
  const max = Math.max(1, ...items.map((i) => i[1]));
  return h("ul", { class: "bl" }, items.map(([label, v]) => h("li", { title: `${label}: ${fmt(v)}` }, h("span", { class: "bl__l" }, label), h("span", { class: "bl__bar" }, h("i", { style: { width: `${(v / max) * 100}%`, background: color } })), h("b", {}, fmt(v)))));
}
export function fmtShort(v) { return v >= 1e6 ? `${num(v / 1e6, 1)} mi` : v >= 1e3 ? `${num(v / 1e3, v >= 1e4 ? 0 : 1)} mil` : num(v); }
