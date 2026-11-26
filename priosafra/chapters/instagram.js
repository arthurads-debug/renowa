// Capítulo 4 — O novo Instagram da PrioSafra: antes × depois (arrastar), as 12 artes e o padrão de destaques/capas.
import { h, icon, markPrio, phone, statusBar, reveal, unreveal, demoTag, reduced } from "../lib.js";
import { EMPRESA, ARTES, DESTAQUES, BIO_NOVA } from "../config.js";
import { art, highlight } from "../arts.js";

const P = EMPRESA.perfilAtual;
const igTop = (user) => h("div", { class: "ig__top" }, icon("arrowL", "ic ic--xs"), h("b", {}, user), h("span", { class: "ig__topr" }, icon("bookmark", "ic ic--xs"), h("span", { class: "ig__dots" }, "•••")));
const stats = () => h("div", { class: "ig__stats" }, [[P.posts, "posts"], [P.seguidores, "seguidores"], [P.seguindo, "seguindo"]].map(([n, t]) => h("div", {}, h("b", {}, n), h("span", {}, t))));
const tabs = () => h("div", { class: "ig__tabs" }, h("span", { class: "is-on" }, icon("grid", "ic ic--xs")), h("span", {}, icon("reel", "ic ic--xs")), h("span", {}, icon("users", "ic ic--xs")));

function telaAtual() {
  return h("div", { class: "ig ig--atual" }, statusBar(), igTop("priosafra"),
    h("div", { class: "ig__head" }, h("div", { class: "ig__pic ig__pic--ring", style: { backgroundImage: `url(assets/instagram-atual-foto.jpg)` } }), stats()),
    h("div", { class: "ig__bio" }, P.bio.map((l, i) => h("p", { class: i === 0 ? "ig__name" : "" }, l))),
    h("div", { class: "ig__btns" }, h("span", { class: "ig__b ig__b--blue" }, "Seguir"), h("span", { class: "ig__b" }, "Mensagem"), h("span", { class: "ig__b ig__b--sq" }, icon("plus", "ic ic--xs"))),
    h("div", { class: "ig__hls" }, ["", ""].map(() => h("span", { class: "ig__hlr" }, h("span", { style: { backgroundImage: `url(assets/instagram-atual-foto.jpg)` } })))),
    tabs(),
    h("div", { class: "ig__shot", style: { backgroundImage: `url(${P.grade})` } }),
    h("span", { class: "ig__stamp" }, "Perfil atual · captura de ", P.consultadoEm));
}
function telaNova() {
  const grid = [11, 0, 3, 6, 2, 4, 8, 1, 10].map((i) => h("div", { class: "ig__cell" }, art(ARTES[i])));
  return h("div", { class: "ig ig--nova" }, statusBar(), igTop("priosafra"),
    h("div", { class: "ig__head" }, h("div", { class: "ig__pic ig__pic--brand" }, markPrio({ cls: "pmark" })), stats()),
    h("div", { class: "ig__bio" }, BIO_NOVA.map((l, i) => h("p", { class: i === 0 ? "ig__name" : i === BIO_NOVA.length - 1 ? "ig__cta" : "" }, l)), h("p", { class: "ig__link" }, icon("globe", "ic ic--xs"), "priosafra.com.br · atendimento")),
    h("div", { class: "ig__btns" }, h("span", { class: "ig__b ig__b--green" }, "Seguir"), h("span", { class: "ig__b" }, "Mensagem"), h("span", { class: "ig__b" }, "Orçamento")),
    h("div", { class: "ig__hls ig__hls--new" }, DESTAQUES.map((d) => highlight(d))),
    tabs(),
    h("div", { class: "ig__grid" }, grid),
    h("span", { class: "ig__stamp ig__stamp--gold" }, "Proposta visual · Renowa"));
}

function lightbox(a, i) {
  const close = () => { box.remove(); document.removeEventListener("keydown", onKey, true); };
  const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
  const box = h("div", { class: "lb", role: "dialog", "aria-modal": "true", "aria-label": a.titulo, onclick: (e) => { if (e.target === box) close(); } },
    h("div", { class: "lb__card" },
      h("div", { class: "lb__art" }, art(a, { cls: "art--xl" })),
      h("div", { class: "lb__info" },
        h("p", { class: "kicker" }, `Arte ${String(i + 1).padStart(2, "0")} · ${a.tipo}`),
        h("h3", { class: "lb__t" }, a.titulo),
        h("p", { class: "lb__k" }, "Legenda demonstrativa"),
        h("p", { class: "lb__cap" }, a.legenda, h("br"), h("span", { class: "lb__tags" }, "#priosafra #paragominas #agronegocio")),
        h("p", { class: "lb__k" }, "Objetivo estratégico"),
        h("p", { class: "lb__obj" }, icon("target"), a.objetivo),
        h("div", { class: "lb__foot" }, demoTag("Proposta visual · foto ilustrativa"), h("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: close }, icon("x"), "Fechar"))),
      h("button", { class: "lb__x", type: "button", "aria-label": "Fechar", onclick: close }, icon("x"))));
  document.body.append(box);
  document.addEventListener("keydown", onKey, true);
  box.querySelector(".lb__x").focus();
  if (window.gsap && !reduced()) gsap.fromTo(box.querySelector(".lb__card"), { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "expo.out" });
}

export const instagram = {
  id: "instagram", title: "O novo Instagram", theme: "light", duration: 26,
  build() {
    // ---- painel 1: comparação
    const handle = h("div", { class: "cmp__handle", role: "slider", tabindex: "0", "aria-label": "Comparar perfil atual e proposta", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "50" }, h("span", {}, icon("arrowL", "ic ic--xs"), icon("arrowR", "ic ic--xs")));
    const cmp = h("div", { class: "cmp", "data-noswipe": "", style: { "--x": "50%" } },
      phone(h("div", { class: "cmp__layers" }, h("div", { class: "cmp__b" }, telaNova()), h("div", { class: "cmp__a" }, telaAtual()), handle,
        h("span", { class: "cmp__lab cmp__lab--a" }, "Atual"), h("span", { class: "cmp__lab cmp__lab--b" }, "Proposta")), { cls: "cmp__phone" }));
    const setX = (pct) => { pct = Math.max(0, Math.min(100, pct)); cmp.style.setProperty("--x", `${pct}%`); cmp.querySelector(".cmp__handle").setAttribute("aria-valuenow", String(Math.round(pct))); seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.v === "a" && pct > 95) || (b.dataset.v === "b" && pct < 5) || (b.dataset.v === "c" && pct >= 5 && pct <= 95)))); };
    this._setX = setX;
    const anim = (to) => { if (!window.gsap || reduced()) return setX(to); const o = { v: parseFloat(cmp.style.getPropertyValue("--x")) || 50 }; gsap.to(o, { v: to, duration: 1.1, ease: "expo.inOut", onUpdate: () => setX(o.v) }); };
    this._anim = anim;
    let drag = false;
    const move = (e) => { if (!drag) return; const r = cmp.querySelector(".phone__screen").getBoundingClientRect(); setX(((e.clientX - r.left) / r.width) * 100); };
    cmp.addEventListener("pointerdown", (e) => { drag = true; cmp.setPointerCapture(e.pointerId); move(e); });
    cmp.addEventListener("pointermove", move);
    cmp.addEventListener("pointerup", () => (drag = false));
    cmp.querySelector(".cmp__handle").addEventListener("keydown", (e) => { const v = parseFloat(cmp.style.getPropertyValue("--x")); if (e.key === "ArrowLeft") { e.stopPropagation(); e.preventDefault(); setX(v - 5); } if (e.key === "ArrowRight") { e.stopPropagation(); e.preventDefault(); setX(v + 5); } });
    const seg = h("div", { class: "seg" }, [["a", "Atual"], ["c", "Comparar"], ["b", "Proposta"]].map(([v, t]) => h("button", { type: "button", "data-v": v, "aria-pressed": String(v === "c"), onclick: () => anim(v === "a" ? 100 : v === "b" ? 0 : 50) }, t)));

    const p1 = h("div", { class: "igp igp--cmp" },
      h("div", { class: "igp__col" },
        h("h3", { class: "igp__h" }, "Do perfil atual ao novo posicionamento"),
        h("p", { class: "muted" }, "Arraste o controle sobre o celular para comparar. À esquerda, o perfil como está hoje; à direita, a proposta da Renowa."),
        seg,
        h("ul", { class: "igp__checks" }, ["Logotipo aplicado com destaque", "Nova biografia estratégica", "Destaques personalizados", "Feed com identidade consistente", "Publicações técnicas, comerciais e institucionais", "Chamadas para contato e orçamento"].map((t) => h("li", {}, icon("check", "ic ic--xs"), t))),
        h("p", { class: "fine" }, "Números do perfil: os mesmos de hoje (", P.seguidores, " seguidores, ", P.posts, " posts, consultado em ", P.consultadoEm, "). Não projetamos crescimento.")),
      cmp,
      h("div", { class: "igp__col igp__bio" },
        h("p", { class: "igp__k" }, "Biografia proposta"),
        h("div", { class: "card-l igp__biocard" }, BIO_NOVA.map((l, i) => h("p", { class: i === 0 ? "b" : "" }, l))),
        h("p", { class: "igp__k" }, "Destaques"),
        h("div", { class: "igp__hls" }, DESTAQUES.map((d) => highlight(d, "hl--md")))));

    // ---- painel 2: as 12 artes
    const p2 = h("div", { class: "igp igp--arts", hidden: true },
      h("div", { class: "arts" }, ARTES.map((a, i) => h("button", { class: "arts__it", type: "button", "aria-label": `Abrir arte: ${a.titulo}`, onclick: () => lightbox(a, i) }, art(a), h("span", { class: "arts__n" }, String(i + 1).padStart(2, "0"), " · ", a.tipo)))),
      h("p", { class: "fine arts__note" }, icon("cursor", "ic ic--xs"), " Toque em uma arte para abrir a prévia com legenda e objetivo. Artes conceituais exclusivas · fotos ilustrativas até a captação própria."));

    // ---- painel 3: padrão de capas
    const reels = [ARTES[6], ARTES[10], ARTES[3]];
    const p3 = h("div", { class: "igp igp--std", hidden: true },
      h("div", {},
        h("h3", { class: "igp__h" }, "Capas de destaque"),
        h("p", { class: "muted" }, "Sete capas no mesmo padrão: fundo verde-floresta, anel dourado e ícones finos. O visitante encontra o que procura em um toque."),
        h("div", { class: "std__hls" }, DESTAQUES.map((d) => highlight(d, "hl--lg")))),
      h("div", {},
        h("h3", { class: "igp__h" }, "Capas de reels padronizadas"),
        h("p", { class: "muted" }, "Mesma tipografia, mesma faixa e mesma posição do título: o feed fica organizado mesmo com vídeos de temas diferentes."),
        h("div", { class: "std__reels" }, reels.map((a) => h("div", { class: "std__reel" }, art({ ...a, layout: "reel" }))))));

    const panels = [p1, p2, p3];
    const tabsEl = h("div", { class: "seg igtabs", role: "tablist" }, ["Antes e depois", "As 12 artes", "Destaques e capas"].map((t, i) => h("button", { type: "button", role: "tab", "aria-selected": String(i === 0), onclick: () => this.tab(i) }, t)));
    this._panels = panels; this._tabs = tabsEl;
    return h("div", { class: "ch__in igc" },
      h("div", { class: "igc__head" },
        h("div", {},
          h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "04"), "O novo Instagram da PrioSafra"),
          h("h2", { class: "display display--sm", "data-in": "" }, "Não vamos só reorganizar o Instagram. ", h("em", {}, "Mostramos exatamente como ele vai ficar."))),
        h("div", { class: "igc__tools", "data-in": "" }, tabsEl, demoTag("Proposta visual"))),
      h("div", { class: "igc__body", "data-in": "" }, panels));
  },
  tab(i) {
    this._i = i;
    this._panels.forEach((p, j) => (p.hidden = j !== i));
    this._tabs.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-selected", String(j === i)));
    const p = this._panels[i];
    if (window.gsap && !reduced()) gsap.fromTo(p.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.08 });
    if (i === 1 && window.gsap && !reduced()) gsap.fromTo(p.querySelectorAll(".arts__it"), { opacity: 0, y: 30, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "expo.out", stagger: 0.045 });
    return true;
  },
  step(el, d) {
    if (d > 0 && (this._i ?? 0) < 2) return this.tab((this._i ?? 0) + 1);
    if (d < 0 && (this._i ?? 0) > 0) return this.tab(this._i - 1);
    return false;
  },
  enter(el) {
    reveal(el);
    this.tab(0);
    this._setX(100);
    clearTimeout(this._t);
    this._t = setTimeout(() => el.classList.contains("is-active") && this._anim(0), reduced() ? 0 : 1600);
  },
  leave(el) { clearTimeout(this._t); unreveal(el); },
};
