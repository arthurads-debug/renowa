// Capítulos 11–13: estratégia de conteúdo (calendário interativo), os primeiros 90 dias e a estrutura por trás da PrioSafra.
import { h, icon, reveal, unreveal, reduced } from "../lib.js";
import { PILARES, VOLUME, CRONOGRAMA, COMPETENCIAS, ARTES } from "../config.js";
import { art } from "../arts.js";

/* =========================== 11 · CONTEÚDO =========================== */
// Mês modelo: 3 publicações por semana (seg, qua, sex). Os 6 vídeos fazem parte dessas publicações (não somam).
const PLANO = [
  { w: 0, d: 0, a: 10, p: "institucional", f: "Reel · vídeo principal" }, { w: 0, d: 2, a: 7, p: "tecnico", f: "Carrossel" }, { w: 0, d: 4, a: 2, p: "produto", f: "Arte" },
  { w: 1, d: 0, a: 6, p: "campo", f: "Reel · vídeo principal" }, { w: 1, d: 2, a: 3, p: "produto", f: "Reel · vídeo complementar" }, { w: 1, d: 4, a: 11, p: "comercial", f: "Arte" },
  { w: 2, d: 0, a: 1, p: "tecnico", f: "Reel · vídeo principal" }, { w: 2, d: 2, a: 8, p: "produto", f: "Carrossel" }, { w: 2, d: 4, a: 5, p: "institucional", f: "Arte" },
  { w: 3, d: 0, a: 4, p: "produto", f: "Reel · vídeo principal" }, { w: 3, d: 2, a: 9, p: "tecnico", f: "Arte" }, { w: 3, d: 4, a: 0, p: "comercial", f: "Reel · vídeo complementar" },
];
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const PIL = Object.fromEntries(PILARES.map((p) => [p.id, p]));

export const conteudo = {
  id: "conteudo", title: "Estratégia de conteúdo", theme: "light", duration: 22,
  build() {
    const prev = h("div", { class: "cal__prev card-l" });
    let filter = null;
    const cells = [];
    const show = (item) => {
      cells.forEach((c) => c.el.setAttribute("aria-pressed", String(c.item === item)));
      const a = ARTES[item.a];
      const p = PIL[item.p];
      prev.replaceChildren(
        h("div", { class: "cal__art" }, art(/Reel/.test(item.f) ? { ...a, layout: "reel" } : a)),
        h("div", { class: "cal__info" },
          h("p", { class: "cal__when" }, `Semana ${item.w + 1} · ${DIAS[item.d]}`),
          h("h4", {}, a.titulo),
          h("div", { class: "cal__tags" }, h("span", { class: "cal__pil", style: { "--c": p.cor } }, p.nome), h("span", { class: "chip" }, /Reel/.test(item.f) ? icon("reel", "ic ic--xs") : icon("grid", "ic ic--xs"), item.f)),
          h("p", { class: "cal__obj" }, h("b", {}, "Objetivo: "), a.objetivo),
          h("p", { class: "fine" }, "Prévia ilustrativa do conteúdo planejado.")));
      if (window.gsap && !reduced()) gsap.fromTo(prev.children, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" });
    };
    const grid = h("div", { class: "cal__grid", role: "grid", "aria-label": "Calendário editorial de um mês modelo" },
      DIAS.map((d) => h("div", { class: "cal__dh" }, d)),
      [0, 1, 2, 3].flatMap((w) => DIAS.map((_, d) => {
        const item = PLANO.find((x) => x.w === w && x.d === d);
        if (!item) return h("div", { class: "cal__d cal__d--empty" }, h("span", { class: "cal__n" }, w * 7 + d + 1), h("span", { class: "cal__st", title: "Stories" }));
        const p = PIL[item.p];
        const el = h("button", { class: "cal__d", type: "button", "aria-pressed": "false", style: { "--c": p.cor }, onclick: () => show(item) },
          h("span", { class: "cal__n" }, w * 7 + d + 1), h("span", { class: "cal__f" }, /Reel/.test(item.f) ? icon("reel", "ic ic--xs") : icon("grid", "ic ic--xs"), /principal/.test(item.f) ? "Vídeo" : /complementar/.test(item.f) ? "Vídeo" : item.f),
          h("span", { class: "cal__t" }, p.nome), h("span", { class: "cal__st", title: "Stories" }));
        cells.push({ el, item });
        return el;
      })));
    const pills = h("div", { class: "cal__filters" }, h("button", { type: "button", class: "is-on", onclick: (e) => setF(null, e.currentTarget) }, "Todos"), PILARES.map((p) => h("button", { type: "button", style: { "--c": p.cor }, onclick: (e) => setF(p.id, e.currentTarget) }, h("i"), p.nome)));
    function setF(id, btn) { filter = id; pills.querySelectorAll("button").forEach((b) => b.classList.toggle("is-on", b === btn)); cells.forEach((c) => c.el.classList.toggle("is-dim", !!id && c.item.p !== id)); }
    this._show = () => show(PLANO[0]);
    return h("div", { class: "ch__in cont" },
      h("div", { class: "cont__l" },
        h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "11"), "Estratégia de conteúdo"),
        h("h2", { class: "display display--sm", "data-in": "" }, "Cinco pilares, ", h("em", {}, "um calendário pensado para autoridade, relacionamento e vendas.")),
        h("div", { class: "cont__pils", "data-in": "" }, PILARES.map((p) => h("div", { class: "cont__pil", style: { "--c": p.cor } }, h("b", {}, p.nome), h("p", {}, p.texto)))),
        h("div", { class: "cont__vol", "data-in": "" }, VOLUME.map((v) => h("div", {}, h("strong", {}, v.n), h("span", {}, v.t, v.s ? h("small", {}, v.s) : null))),
          h("p", { class: "fine" }, "Inclusos: gestão de stories, design gráfico, capas de reels, carrosséis, planejamento e direção criativa. Os vídeos fazem parte do calendário, não somam às publicações."))),
      h("div", { class: "cont__r", "data-in": "" },
        h("div", { class: "cal__top" }, h("b", {}, "Mês modelo"), pills),
        h("div", { class: "cal" }, grid, prev),
        h("p", { class: "fine cal__leg" }, h("span", { class: "cal__st cal__st--leg" }), " Stories ao longo da semana · toque em um dia com publicação para ver a prévia. Até 2 conteúdos extras por mês em datas estratégicas.")));
  },
  enter(el) {
    reveal(el);
    this._show();
    if (window.gsap && !reduced()) gsap.fromTo(el.querySelectorAll(".cal__d"), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.015, delay: 0.5, ease: "power3.out" });
  },
  leave(el) { unreveal(el); },
};

/* =========================== 12 · 90 DIAS =========================== */
export const noventa = {
  id: "noventa", title: "Os primeiros 90 dias", theme: "dark", duration: 20,
  build() {
    return h("div", { class: "ch__in nv" },
      h("div", { class: "nv__head" },
        h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "12"), "Os primeiros 90 dias"),
        h("h2", { class: "display display--md", "data-in": "" }, "Uma transformação planejada, ", h("em", {}, "não uma sequência de ações isoladas."))),
      h("div", { class: "nv__line", "data-in": "" }, h("span", { class: "nv__fill" }), ["Contratação", "Dia 30", "Dia 60", "Dia 90"].map((t, i) => h("span", { class: "nv__mark", style: { left: `${(i / 3) * 100}%` } }, h("i"), t))),
      h("div", { class: "nv__cols" }, CRONOGRAMA.map((c, i) => h("article", { class: "nv__col", "data-in": "" },
        h("p", { class: "nv__k" }, c.fase), h("h3", {}, c.nome),
        h("ul", {}, c.itens.map((t) => h("li", {}, icon("check", "ic ic--xs"), t)))))),
      h("p", { class: "fine nv__note", "data-in": "" }, "Cronograma contado a partir da data de contratação. É um planejamento inicial, sujeito à aprovação dos materiais, ao fornecimento de acessos e às condições técnicas."));
  },
  enter(el) {
    reveal(el, { stagger: 0.12 });
    if (window.gsap && !reduced()) {
      gsap.fromTo(el.querySelector(".nv__fill"), { scaleX: 0 }, { scaleX: 1, duration: 2.6, delay: 0.5, ease: "power2.inOut" });
      gsap.fromTo(el.querySelectorAll(".nv__col li"), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.04, delay: 0.9, ease: "power3.out" });
    }
  },
  leave(el) { unreveal(el); },
};

/* =========================== 13 · ESTRUTURA =========================== */
const COMP_IC = ["target", "palette", "insta", "pen", "camera", "reel", "megaphone", "globe", "bot", "brain"];
export const estrutura = {
  id: "estrutura", title: "A estrutura por trás da PrioSafra", theme: "light", duration: 16,
  build() {
    return h("div", { class: "ch__in es" },
      h("div", { class: "es__head" },
        h("div", {},
          h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "13"), "A estrutura por trás da PrioSafra"),
          h("h2", { class: "display display--md", "data-in": "" }, "Uma estrutura completa, ", h("em", {}, "sem a necessidade de contratar diversos fornecedores."))),
        h("p", { class: "lead", "data-in": "" }, "Ao contratar a Renowa, a PrioSafra passa a contar com uma operação multidisciplinar trabalhando de forma integrada.")),
      h("div", { class: "es__grid" }, COMPETENCIAS.map((c, i) => h("article", { class: "es__card", "data-in": "" }, h("span", { class: "es__i" }, icon(COMP_IC[i])), h("span", { class: "es__n" }, String(i + 1).padStart(2, "0")), h("h3", {}, c.nome), h("p", {}, c.texto)))));
  },
  enter(el) { reveal(el, { stagger: 0.05 }); },
  leave(el) { unreveal(el); },
};
