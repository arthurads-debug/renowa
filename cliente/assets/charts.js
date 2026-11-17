// Gráficos em SVG puro — barras empilhadas e linhas, com tooltip, teclado e tabela.
// Regras: um eixo só, barras finas com topo arredondado de 4px ancoradas na base,
// 2px de folga entre segmentos, linhas de 2px, legenda sempre presente (>= 2 séries).
const NS = "http://www.w3.org/2000/svg";
const tip = () => document.getElementById("tooltip");

function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function h(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function niceScale(max, count = 4) {
  if (!(max > 0)) return { top: 1, ticks: [0, 1] };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return { top, ticks };
}

function roundedTop(x, yTop, w, yBottom, r) {
  r = Math.max(0, Math.min(r, w / 2, yBottom - yTop));
  return `M${x},${yBottom}L${x},${yTop + r}Q${x},${yTop} ${x + r},${yTop}L${x + w - r},${yTop}Q${x + w},${yTop} ${x + w},${yTop + r}L${x + w},${yBottom}Z`;
}

/* ---------- Tooltip ---------- */
function showTip(title, rows, total, at) {
  const t = tip();
  t.replaceChildren();
  t.append(h("div", "tooltip__title", title));
  rows.forEach((r) => {
    const row = h("div", "tooltip__row");
    const s = h("span");
    const key = h("i");
    key.style.background = r.color;
    s.append(key, document.createTextNode(r.label));
    row.append(h("b", null, r.value), s);
    t.append(row);
  });
  if (total) {
    const row = h("div", "tooltip__row tooltip__total");
    row.append(h("b", null, total.value), h("span", null, total.label));
    t.append(row);
  }
  t.hidden = false;
  const r = t.getBoundingClientRect();
  let x = at.x + 16, y = at.y - r.height - 12;
  if (x + r.width > innerWidth - 8) x = at.x - r.width - 16;
  if (y < 8) y = at.y + 16;
  t.style.left = `${Math.max(8, x)}px`;
  t.style.top = `${y}px`;
}
const hideTip = () => { const t = tip(); if (t) t.hidden = true; };

/* ---------- Tabela acessível ---------- */
function buildTable(cfg) {
  const wrap = h("div", "chart-table");
  const table = h("table", "table");
  const thead = h("thead");
  const tr = h("tr");
  tr.append(Object.assign(h("th", "is-text", "Data"), { scope: "col" }));
  cfg.series.forEach((s) => tr.append(Object.assign(h("th", null, s.label), { scope: "col" })));
  if (cfg.series.length > 1) tr.append(Object.assign(h("th", null, "Total"), { scope: "col" }));
  thead.append(tr);
  const tbody = h("tbody");
  cfg.labels.forEach((d, i) => {
    const row = h("tr");
    row.append(h("td", "is-text", cfg.fmtDate(d)));
    let sum = 0;
    cfg.series.forEach((s) => { sum += s.values[i]; row.append(h("td", null, cfg.fmt(s.values[i]))); });
    if (cfg.series.length > 1) row.append(h("td", null, cfg.fmt(sum)));
    tbody.append(row);
  });
  table.append(thead, tbody);
  wrap.append(table);
  return wrap;
}

/* ---------- Render ---------- */
export function renderChart(container, cfg) {
  const { type, labels, series, fmt, fmtAxis = fmt, fmtDate, fmtDateLong, height = 260 } = cfg;
  container.replaceChildren();
  container.classList.remove("is-hovering");
  container._cfg = cfg;

  const total = series.reduce((s, x) => s + x.values.reduce((a, b) => a + b, 0), 0);
  if (!labels.length || total === 0) {
    container.append(h("div", "chart-empty", "Sem dados no período selecionado."));
    return;
  }

  // Legenda (sempre que houver 2+ séries)
  if (series.length > 1) {
    const lg = h("div", "legend");
    series.forEach((s) => {
      const span = h("span");
      const key = h("i", type === "lines" ? "is-line" : "");
      key.style.background = s.color;
      span.append(key, document.createTextNode(s.label));
      lg.append(span);
    });
    container.append(lg);
  }

  const W = Math.max(280, container.clientWidth);
  const n = labels.length;
  const max = type === "bars"
    ? Math.max(...labels.map((_, i) => series.reduce((s, x) => s + x.values[i], 0)))
    : Math.max(...series.flatMap((s) => s.values));
  const { top, ticks } = niceScale(max);
  const axisW = Math.max(...ticks.map((t) => fmtAxis(t).length)) * 6.6 + 10;
  const endLabels = type === "lines" && series.length > 1 && series.length <= 4;
  const m = { t: 8, r: endLabels ? 84 : 8, b: 26, l: axisW };
  const iw = W - m.l - m.r, ih = height - m.t - m.b;
  const y = (v) => m.t + ih - (v / top) * ih;
  const band = iw / n;
  const xc = (i) => m.l + band * (i + 0.5);

  const svg = el("svg", { viewBox: `0 0 ${W} ${height}`, height, role: "img", "aria-label": cfg.ariaLabel || "" });
  const grid = el("g", { class: "grid" }, svg);
  const axis = el("g", { class: "axis" }, svg);
  ticks.forEach((t) => {
    if (t > 0) el("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t) }, grid);
    const tx = el("text", { x: m.l - 8, y: y(t) + 4, "text-anchor": "end" }, axis);
    tx.textContent = fmtAxis(t);
  });
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));
  labels.forEach((d, i) => {
    if (i % every !== 0 && i !== n - 1) return;
    if (i === n - 1 && i % every !== 0 && (n - 1) % every < every * 0.6) return;
    const tx = el("text", { x: xc(i), y: height - 6, "text-anchor": "middle" }, axis);
    tx.textContent = fmtDate(d);
  });

  const marks = el("g", {}, svg);
  const hover = el("g", { opacity: 0 }, svg);
  const groups = [];

  if (type === "bars") {
    const bw = Math.max(2, Math.min(band * 0.64, 26));
    labels.forEach((_, i) => {
      const g = [];
      let acc = 0;
      const lastIdx = series.map((s) => s.values[i] > 0).lastIndexOf(true);
      series.forEach((s, si) => {
        const v = s.values[i];
        if (!(v > 0)) return;
        const yb = y(acc) - (acc > 0 ? 2 : 0);
        acc += v;
        const yt = y(acc);
        if (yb - yt < 0.5) return;
        const x = xc(i) - bw / 2;
        const d = si === lastIdx ? roundedTop(x, yt, bw, yb, 4) : `M${x},${yb}L${x},${yt}L${x + bw},${yt}L${x + bw},${yb}Z`;
        g.push(el("path", { d, fill: s.color, class: "bar" }, marks));
      });
      groups.push(g);
    });
  } else {
    series.forEach((s) => {
      const d = s.values.map((v, i) => `${i ? "L" : "M"}${xc(i)},${y(v)}`).join("");
      el("path", { d, stroke: s.color, class: "line" }, marks);
      if (n === 1) el("circle", { cx: xc(0), cy: y(s.values[0]), r: 4, fill: s.color, class: "dot" }, marks);
    });
    if (endLabels) {
      const ys = series.map((s) => ({ s, y: y(s.values[n - 1]) })).sort((a, b) => a.y - b.y);
      for (let k = 1; k < ys.length; k++) if (ys[k].y - ys[k - 1].y < 15) ys[k].y = ys[k - 1].y + 15;
      ys.forEach(({ s, y: yy }) => {
        const t = el("text", { x: xc(n - 1) + 10, y: yy + 4, class: "end-label" }, marks);
        t.textContent = s.label;
      });
    }
    el("line", { class: "hairline", y1: m.t, y2: m.t + ih }, hover);
    series.forEach((s) => el("circle", { r: 4, fill: s.color, class: "dot", "data-key": s.key }, hover));
  }
  el("line", { class: "baseline", x1: m.l, x2: W - m.r, y1: y(0), y2: y(0) }, svg);

  // Camada de interação: maior que as marcas, focável pelo teclado
  const hit = el("rect", { x: m.l, y: m.t, width: iw, height: ih + m.b, class: "hit", tabindex: 0, "aria-label": "Use as setas para navegar pelos dias" }, svg);
  let active = -1;
  const activate = (i, at) => {
    if (i < 0 || i >= n) return;
    active = i;
    container.classList.add("is-hovering");
    if (type === "bars") {
      groups.flat().forEach((b) => b.classList.remove("is-active"));
      groups[i].forEach((b) => b.classList.add("is-active"));
    } else {
      hover.setAttribute("opacity", 1);
      hover.querySelector(".hairline").setAttribute("x1", xc(i));
      hover.querySelector(".hairline").setAttribute("x2", xc(i));
      series.forEach((s) => {
        const c = hover.querySelector(`[data-key="${s.key}"]`);
        c.setAttribute("cx", xc(i));
        c.setAttribute("cy", y(s.values[i]));
      });
    }
    const rows = series.map((s) => ({ label: s.label, color: s.color, value: fmt(s.values[i]) }));
    const sum = series.reduce((a, s) => a + s.values[i], 0);
    const box = svg.getBoundingClientRect();
    const scale = box.width / W;
    const point = at || { x: box.left + xc(i) * scale, y: box.top + (type === "bars" ? y(sum) : y(Math.max(...series.map((s) => s.values[i])))) * scale };
    showTip(fmtDateLong(labels[i]), rows, series.length > 1 ? { label: "Total", value: fmt(sum) } : null, point);
  };
  const clear = () => {
    active = -1;
    container.classList.remove("is-hovering");
    hover.setAttribute("opacity", 0);
    groups.flat().forEach((b) => b.classList.remove("is-active"));
    hideTip();
  };
  hit.addEventListener("pointermove", (e) => {
    const box = svg.getBoundingClientRect();
    const px = (e.clientX - box.left) * (W / box.width);
    activate(Math.min(n - 1, Math.max(0, Math.floor((px - m.l) / band))), { x: e.clientX, y: e.clientY });
  });
  hit.addEventListener("pointerleave", clear);
  hit.addEventListener("blur", clear);
  hit.addEventListener("focus", () => activate(active < 0 ? n - 1 : active));
  hit.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); activate(Math.min(n - 1, active + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); activate(Math.max(0, active - 1)); }
    if (e.key === "Escape") clear();
  });

  container.append(svg);
  if (container._showTable) container.append(buildTable(cfg));
}

export function toggleTable(container) {
  container._showTable = !container._showTable;
  if (container._cfg) renderChart(container, container._cfg);
  return container._showTable;
}

// Redesenha ao mudar a largura
const ro = new ResizeObserver((entries) => {
  for (const e of entries) {
    const c = e.target;
    const w = Math.round(e.contentRect.width);
    if (c._cfg && c._w !== w) { c._w = w; renderChart(c, c._cfg); }
  }
});
export const observe = (c) => ro.observe(c);
