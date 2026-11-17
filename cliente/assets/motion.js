// Movimento dos relatórios: números que contam até o valor (e de um valor para o outro quando
// os dados atualizam ao vivo), entrada em cascata dos cartões e inclinação 3D sob o mouse.
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const last = new Map(); // rótulo → último número mostrado

function parse(text) {
  const m = String(text).match(/-?\d{1,3}(?:\.\d{3})*(?:,\d+)?|-?\d+(?:,\d+)?/);
  if (!m) return null;
  const raw = m[0];
  const dec = raw.includes(",") ? raw.split(",")[1].length : 0;
  const value = Number(raw.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(value)) return null;
  return { value, dec, pre: text.slice(0, m.index), suf: text.slice(m.index + raw.length) };
}
const fmt = (v, dec) => v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export function countUp(root) {
  root.querySelectorAll(".kpi").forEach((card, i) => {
    const valEl = card.querySelector(".kpi__value");
    const label = card.querySelector(".kpi__label")?.textContent || `k${i}`;
    if (!valEl) return;
    const target = valEl.textContent;
    const p = parse(target);
    if (!p) return;
    const from = last.has(label) ? last.get(label) : 0;
    last.set(label, p.value);
    if (reduce() || from === p.value) return;
    const changed = last.size && from !== 0;
    if (changed) card.classList.add("is-tick");
    const dur = changed ? 700 : 1100, t0 = performance.now() + (changed ? 0 : i * 60);
    valEl.textContent = `${p.pre}${fmt(from, p.dec)}${p.suf}`;
    const step = (now) => {
      if (!valEl.isConnected) return;
      const k = Math.min(1, Math.max(0, (now - t0) / dur));
      const e = 1 - Math.pow(1 - k, 4);
      valEl.textContent = k >= 1 ? target : `${p.pre}${fmt(from + (p.value - from) * e, p.dec)}${p.suf}`;
      if (k < 1) requestAnimationFrame(step); else setTimeout(() => card.classList.remove("is-tick"), 600);
    };
    requestAnimationFrame(step);
  });
}

export function enter(root) {
  if (reduce()) return;
  [...root.children].forEach((el, i) => {
    el.classList.remove("m-in");
    el.style.setProperty("--d", `${Math.min(i, 8) * 70}ms`);
    void el.offsetWidth;
    el.classList.add("m-in");
  });
}

// Inclinação 3D suave nos cartões (só com mouse)
export function tilt(root) {
  if (root._tilt) return;
  root._tilt = true;
  const SEL = ".kpi, .hero-card, .card, .note-card";
  root.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || reduce()) return;
    const card = e.target.closest(SEL);
    root.querySelectorAll(".is-tilt").forEach((c) => c !== card && untilt(c));
    if (!card || card.querySelector("canvas, svg.chart-svg")) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    const strength = card.classList.contains("kpi") ? 9 : 3;
    card.classList.add("is-tilt");
    card.style.setProperty("--rx", `${(-y * strength).toFixed(2)}deg`);
    card.style.setProperty("--ry", `${(x * strength).toFixed(2)}deg`);
    card.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
    card.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
  });
  root.addEventListener("pointerleave", () => root.querySelectorAll(".is-tilt").forEach(untilt));
}
function untilt(c) { c.classList.remove("is-tilt"); c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); }
