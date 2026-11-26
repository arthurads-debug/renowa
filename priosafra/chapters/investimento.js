// Capítulos 14–16: comparativo de investimento, a condição comercial e o simulador de economia.
// Valores da proposta comercial anterior (config.js). Cálculos conferidos em `calc()`.
import { h, icon, reveal, unreveal, reduced, brl, countTo, markPrio, logoRenowa } from "../lib.js";
import { VALORES, ESCOPO } from "../config.js";

const AV_MIN = VALORES.avulso.reduce((s, x) => s + x.min, 0); // 6.550
const AV_MAX = VALORES.avulso.reduce((s, x) => s + x.max, 0); // 7.250
const PAC = VALORES.pacote; // 3.900
const SITE = VALORES.siteDesenvolvimento; // 3.000
const range = (a, b) => (a === b ? brl(a) : `${brl(a)} a ${brl(b)}`);

// Economia estimada para m meses: (avulso × m + site) − (pacote × m)
export function calc(m) {
  const indMin = AV_MIN * m + SITE, indMax = AV_MAX * m + SITE, ren = PAC * m;
  return { indMin, indMax, ren, ecoMin: indMin - ren, ecoMax: indMax - ren };
}

/* =========================== 14 · COMPARATIVO =========================== */
export const comparativo = {
  id: "comparativo", title: "Comparativo de investimento", theme: "light", duration: 20,
  build() {
    const scale = AV_MAX * 1.04;
    const bar = (label, min, max, cls) => h("div", { class: `cp__row ${cls}` }, h("span", { class: "cp__lab" }, label),
      h("div", { class: "cp__track" }, h("i", { class: "cp__min", style: { width: `${(min / scale) * 100}%` } }), max > min ? h("i", { class: "cp__max", style: { left: `${(min / scale) * 100}%`, width: `${((max - min) / scale) * 100}%` } }) : null),
      h("b", {}, range(min, max), h("small", {}, "/mês")));
    return h("div", { class: "ch__in cp" },
      h("div", { class: "cp__l" },
        h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "14"), "Comparativo de investimento"),
        h("h2", { class: "display display--sm", "data-in": "" }, "O que custaria montar essa estrutura ", h("em", {}, "contratando cada parte separadamente.")),
        h("table", { class: "cp__t", "data-in": "" },
          h("tbody", {}, VALORES.avulso.map((x) => h("tr", {}, h("td", {}, h("b", {}, x.item), h("span", {}, x.nota)), h("td", {}, range(x.min, x.max), h("small", {}, "/mês"))))),
          h("tfoot", {}, h("tr", {}, h("td", {}, "Investimento recorrente estimado"), h("td", {}, range(AV_MIN, AV_MAX), h("small", {}, "/mês"))), h("tr", { class: "cp__site" }, h("td", {}, "Desenvolvimento do site (investimento inicial)"), h("td", {}, brl(SITE))))),
        h("p", { class: "fine", "data-in": "" }, "Estimativas comerciais da proposta anterior, não cotações independentes de mercado. Não atribuímos valores ao dashboard, ao atendimento virtual ou às demais tecnologias.")),
      h("div", { class: "cp__r", "data-in": "" },
        h("p", { class: "cp__k" }, "Investimento mensal comparado"),
        bar("Contratação individual", AV_MIN, AV_MAX, "cp__row--ind"),
        bar("Ecossistema Renowa", PAC, PAC, "cp__row--ren"),
        h("div", { class: "cp__legend" }, h("span", {}, h("i", { class: "cp__lg1" }), "Mínimo estimado"), h("span", {}, h("i", { class: "cp__lg2" }), "Faixa até o máximo")),
        h("div", { class: "cp__plus" }, icon("plus"), h("div", {}, h("b", {}, "+ ", brl(SITE), " de desenvolvimento do site"), h("span", {}, "na contratação individual"))),
        h("div", { class: "cp__eco" }, h("span", {}, "Diferença mensal estimada"), h("strong", { class: "cp__ecov" }, range(AV_MIN - PAC, AV_MAX - PAC)))));
  },
  enter(el) {
    reveal(el);
    if (window.gsap && !reduced()) {
      gsap.fromTo(el.querySelectorAll(".cp__track i"), { scaleX: 0 }, { scaleX: 1, transformOrigin: "left", duration: 1.4, stagger: 0.25, delay: 0.6, ease: "expo.out" });
      gsap.fromTo(el.querySelectorAll(".cp__t tbody tr"), { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, delay: 0.4, ease: "power3.out" });
    }
  },
  leave(el) { unreveal(el); },
};

/* =========================== 15 · CONDIÇÃO =========================== */
export const condicao = {
  id: "condicao", title: "A condição comercial", theme: "dark", duration: 24,
  build() {
    const price = h("div", { class: "of__price" },
      h("p", { class: "of__pk" }, "Ecossistema completo Renowa"),
      h("p", { class: "of__ps" }, "Desenvolvido exclusivamente para a PrioSafra Agronegócio."),
      h("div", { class: "of__val" }, h("span", { class: "of__cur" }, "R$"), h("strong", { class: "of__num" }, "3.900"), h("span", { class: "of__per" }, "por mês")),
      h("div", { class: "of__bonus" },
        h("p", { class: "of__bk" }, icon("gift"), "Bônus exclusivo da contratação"),
        h("div", { class: "of__brow" }, h("span", {}, "Desenvolvimento do site"), h("s", {}, brl(SITE)), h("b", {}, "R$ 0 adicionais")),
        h("div", { class: "of__brow" }, h("span", {}, "Manutenção mensal do site"), h("s", {}, brl(VALORES.siteManutencao)), h("b", {}, "R$ 0 adicionais")),
        h("p", { class: "of__bt" }, "O site completo é entregue como bônus da contratação do ecossistema. Não há cobrança separada pelo desenvolvimento nem pela manutenção dentro do escopo contratado.")),
      h("p", { class: "of__note" }, icon("info", "ic ic--xs"), "A verba de anúncios é definida separadamente e paga diretamente às plataformas."));
    const btn = h("button", { class: "btn btn--gold of__reveal", type: "button", onclick: () => this.show(true) }, icon("eye"), "Revelar o investimento");
    const el = h("div", { class: "ch__in of", "data-state": "scope" },
      h("div", { class: "of__l" },
        h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "15"), "A condição comercial"),
        h("h2", { class: "display display--sm", "data-in": "" }, "Tudo o que a PrioSafra recebe, ", h("em", {}, "em uma única operação.")),
        h("ul", { class: "of__scope", "data-in": "" }, ESCOPO.map((t, i) => h("li", { style: { "--i": i } }, icon("check", "ic ic--xs"), t))),
        h("div", { "data-in": "" }, btn)),
      h("div", { class: "of__r" }, h("div", { class: "of__veil" }, markPrio({ cls: "pmark", dark: "#E9F2EC", light: "#3FB56E" }), h("span", {}, "×"), logoRenowa({ tone: "light", cls: "rlogo of__rl" }), h("p", {}, "Pressione → para revelar")), price));
    this._el = el;
    return el;
  },
  show(on) {
    const el = this._el;
    if ((el.dataset.state === "price") === on) return false;
    el.dataset.state = on ? "price" : "scope";
    if (on && window.gsap && !reduced()) {
      const tl = gsap.timeline();
      tl.fromTo(el.querySelector(".of__veil"), { opacity: 1 }, { opacity: 0, scale: 0.94, duration: 0.6, ease: "power2.in" })
        .fromTo(el.querySelector(".of__price"), { opacity: 0, y: 40, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "expo.out" }, "-=.1")
        .add(() => countTo(el.querySelector(".of__num"), 3900, { from: 0, dur: 1.6, fmt: (v) => Math.round(v).toLocaleString("pt-BR") }), "-=.8")
        .fromTo(el.querySelectorAll(".of__brow"), { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.2, ease: "power3.out" }, "-=.6")
        .fromTo(el.querySelectorAll(".of__brow s"), { "--strike": "0%" }, { "--strike": "100%", duration: 0.6, stagger: 0.2 }, "-=.2");
    }
    return true;
  },
  step(el, d) { if (d > 0) return this.show(true); if (d < 0 && this._el.dataset.state === "price") return this.show(false); return false; },
  enter(el) {
    this.show(false);
    reveal(el);
    if (window.gsap && !reduced()) gsap.fromTo(el.querySelectorAll(".of__scope li"), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.07, delay: 0.5, ease: "power3.out" });
  },
  leave(el) { unreveal(el); },
};

/* =========================== 16 · ECONOMIA =========================== */
export const economia = {
  id: "economia", title: "Economia proporcionada", theme: "light", duration: 22,
  build() {
    const out = h("div", { class: "ec__out" });
    const chart = h("div", { class: "ec__chart", role: "img" });
    const seg = h("div", { class: "seg ec__seg", role: "group", "aria-label": "Período" }, [1, 3, 6, 12].map((m) => h("button", { type: "button", "aria-pressed": String(m === 12), onclick: () => this.set(m) }, m === 1 ? "1 mês" : `${m} meses`)));
    Object.assign(this, { out, chart, seg });
    return h("div", { class: "ch__in ec" },
      h("div", { class: "ec__l" },
        h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "16"), "Economia proporcionada"),
        h("h2", { class: "display display--sm", "data-in": "" }, "Simule a economia ", h("em", {}, "no período que preferir.")),
        h("div", { "data-in": "" }, seg),
        h("div", { "data-in": "" }, out),
        h("div", { class: "ec__fix", "data-in": "" },
          [["Economia recorrente estimada", `${range(AV_MIN - PAC, AV_MAX - PAC)} por mês`], ["Economia estimada no 1º mês", range(calc(1).ecoMin, calc(1).ecoMax)], ["Economia estimada em 12 meses", range(calc(12).ecoMin, calc(12).ecoMax)]].map(([t, v]) => h("div", {}, h("span", {}, t), h("b", {}, v))))),
      h("div", { class: "ec__r", "data-in": "" }, chart,
        h("p", { class: "fine ec__disc" }, "Contratação individual: R$ 6.550 a R$ 7.250 por mês + R$ 3.000 de desenvolvimento do site. Contratação Renowa: R$ 3.900 por mês. A projeção tem caráter comparativo, não determina o prazo do contrato e não representa garantia de retorno financeiro.")));
  },
  set(m) {
    this._m = m;
    this.seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.textContent.startsWith(String(m)) && (m !== 1 || b.textContent === "1 mês"))));
    const c = calc(m);
    const label = m === 1 ? "no 1º mês" : `em ${m} meses`;
    const minEl = h("strong", {}, brl(0)), maxEl = h("strong", {}, brl(0));
    this.out.replaceChildren(h("p", { class: "ec__ok" }, `Economia estimada ${label}`), h("p", { class: "ec__big" }, minEl, h("span", {}, " a "), maxEl));
    countTo(minEl, c.ecoMin, { fmt: (v) => brl(v), dur: 1.2 });
    countTo(maxEl, c.ecoMax, { fmt: (v) => brl(v), dur: 1.2 });
    const max = c.indMax * 1.05;
    const col = (label, v, v2, cls) => h("div", { class: `ec__col ${cls}` },
      h("div", { class: "ec__bars" }, h("i", { class: "ec__b1", style: { height: `${(v / max) * 100}%` } }), v2 ? h("i", { class: "ec__b2", style: { height: `${((v2 - v) / max) * 100}%`, bottom: `${(v / max) * 100}%` } }) : null),
      h("b", {}, v2 ? range(v, v2) : brl(v)), h("span", {}, label));
    this.chart.setAttribute("aria-label", `Contratação individual ${range(c.indMin, c.indMax)}; Renowa ${brl(c.ren)}; economia ${range(c.ecoMin, c.ecoMax)}`);
    this.chart.replaceChildren(h("p", { class: "ec__ck" }, `Investimento total ${label}`), h("div", { class: "ec__cols" }, col("Contratação individual", c.indMin, c.indMax, "ec__col--ind"), col("Ecossistema Renowa", c.ren, 0, "ec__col--ren")),
      h("div", { class: "ec__legend" }, h("span", {}, h("i", { class: "ec__lg1" }), "Mínimo estimado"), h("span", {}, h("i", { class: "ec__lg2" }), "Faixa até o máximo"), h("span", {}, h("i", { class: "ec__lg3" }), "Renowa")));
    if (window.gsap && !reduced()) gsap.fromTo(this.chart.querySelectorAll(".ec__bars i"), { scaleY: 0 }, { scaleY: 1, transformOrigin: "bottom", duration: 1.1, stagger: 0.12, ease: "expo.out" });
  },
  enter(el) { reveal(el); this.set(this._m || 12); },
  leave(el) { unreveal(el); },
};
