// Capítulos 1–3: abertura, potencial da PrioSafra e o ecossistema Renowa.
import { h, icon, svg, markPrio, logoPrio, logoRenowa, reveal, unreveal, reduced, sleep } from "../lib.js";
import { FOTOS, MODULOS, EMPRESA } from "../config.js";

/* =========================== 01 · ABERTURA =========================== */
export const abertura = {
  id: "abertura", title: "O futuro da PrioSafra", theme: "dark", duration: 14,
  build({ next }) {
    return h("div", { class: "op" },
      h("div", { class: "op__media" },
        h("div", { class: "photo op__photo", style: { backgroundImage: `url(${FOTOS.abertura})` } }),
        h("div", { class: "op__haze" }),
        h("div", { class: "op__sweep" })),
      svg(`<svg class="op__grid" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
        <g fill="none" stroke="rgba(217,189,134,.22)" stroke-width="1">
          <path class="op__ln" d="M0 640 C 400 600, 900 700, 1600 610"/>
          <path class="op__ln" d="M0 700 C 500 660, 1000 760, 1600 690"/>
          <path class="op__ln" d="M0 770 C 420 735, 980 820, 1600 770"/>
        </g></svg>`),
      h("div", { class: "scrim-l op__scrim" }),
      h("div", { class: "ch__in op__in" },
        h("div", { class: "op__logo", "data-in": "0" }, logoPrio({ tone: "light", cls: "plogo op__plogo" })),
        h("p", { class: "kicker", "data-in": "1" }, "Renowa apresenta"),
        h("h1", { class: "display display--xl op__title", "data-in": "2" }, "O futuro da PrioSafra ", h("em", {}, "começa agora.")),
        h("p", { class: "lead op__lead", "data-in": "3" }, "Uma nova fase de posicionamento, autoridade, tecnologia e crescimento comercial."),
        h("div", { class: "op__foot", "data-in": "4" },
          h("button", { class: "btn btn--gold", type: "button", onclick: next }, "Iniciar a apresentação", icon("arrowR")),
          h("p", { class: "op__sign" }, "Uma estratégia desenvolvida exclusivamente pela ", h("b", {}, "Renowa"), " para a ", h("b", {}, EMPRESA.nome), "."))),
      h("p", { class: "photo-credit" }, "Foto ilustrativa · Unsplash"));
  },
  enter(el) {
    reveal(el, { delay: 0.9, stagger: 0.14 });
    if (!window.gsap || reduced()) return;
    const m = el.querySelector(".pmark");
    const ring = m.querySelectorAll(".pm-ring, .pm-ring2");
    ring.forEach((r) => { const L = 2 * Math.PI * +r.getAttribute("r"); r.style.strokeDasharray = L; r.style.strokeDashoffset = L; });
    const tl = gsap.timeline();
    tl.fromTo(el.querySelector(".op__photo"), { scale: 1.32, xPercent: 3, yPercent: 4, filter: "brightness(.35) saturate(.8)" }, { scale: 1.08, xPercent: 0, yPercent: 0, filter: "brightness(1) saturate(1)", duration: 7, ease: "power2.out" }, 0)
      .to(ring, { strokeDashoffset: 0, duration: 1.8, ease: "power3.inOut", stagger: 0.2 }, 0.5)
      .fromTo(m.querySelectorAll(".pm-leaf2, .pm-leaf2s"), { scale: 0, transformOrigin: "42% 82%" }, { scale: 1, duration: 1.1, ease: "back.out(1.6)" }, 1.4)
      .fromTo(m.querySelector(".pm-leaf1"), { scale: 0, rotate: -18, transformOrigin: "42% 82%" }, { scale: 1, rotate: 0, duration: 1.3, ease: "back.out(1.4)" }, 1.6)
      .fromTo(el.querySelectorAll(".op__ln"), { strokeDasharray: 1800, strokeDashoffset: 1800 }, { strokeDashoffset: 0, duration: 3.2, ease: "power2.inOut", stagger: 0.25 }, 0.8);
    // voo de drone contínuo depois da entrada
    this._drone = gsap.to(el.querySelector(".op__photo"), { scale: 1.2, xPercent: -2.5, yPercent: -1.5, duration: 26, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 7 });
  },
  leave(el) { this._drone?.kill(); unreveal(el); },
};

/* =========================== 02 · POTENCIAL =========================== */
const ATIVOS = [
  { t: "Produtos de qualidade", i: "leaf" }, { t: "Experiência no campo", i: "sun" }, { t: "Conhecimento técnico", i: "bulb" },
  { t: "Marcas representadas", i: "handshake" }, { t: "Relacionamento", i: "users" }, { t: "Instagram", i: "insta" }, { t: "WhatsApp", i: "wa" },
];
const OPORTUNIDADES = ["Padronização da presença digital", "Fortalecimento do posicionamento", "Maior exploração da autoridade técnica", "Valorização das marcas representadas", "Ampliação da presença regional", "Organização dos canais de atendimento", "Geração de novas oportunidades comerciais"];

export const potencial = {
  id: "potencial", title: "O potencial da PrioSafra", theme: "light", duration: 18,
  build() {
    const stage = h("div", { class: "pot__stage", "data-state": "frag" },
      svg(`<svg class="pot__lines" viewBox="0 0 600 600" aria-hidden="true">${ATIVOS.map((_, i) => { const a = (i / ATIVOS.length) * Math.PI * 2 - Math.PI / 2; return `<line x1="300" y1="300" x2="${300 + Math.cos(a) * 225}" y2="${300 + Math.sin(a) * 225}"/>`; }).join("")}<circle cx="300" cy="300" r="225" class="pot__orbit"/></svg>`),
      h("div", { class: "pot__core" }, markPrio({ cls: "pmark" }), h("span", {}, "PrioSafra")),
      ATIVOS.map((a, i) => h("div", { class: "pot__chip", style: { "--i": i } }, icon(a.i), h("span", {}, a.t))));
    const btn = h("button", { class: "btn btn--forest btn--sm pot__btn", type: "button", onclick: () => this.toggle(stage, btn) }, icon("layers"), "Integrar a presença");
    return h("div", { class: "ch__in pot" },
      h("div", { class: "pot__text" },
        h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "02"), "O potencial da PrioSafra"),
        h("h2", { class: "display display--md", "data-in": "" }, "A qualidade que existe no campo precisa ser ", h("em", {}, "percebida também no digital.")),
        h("p", { class: "lead", "data-in": "" }, "A PrioSafra já tem o que é mais difícil construir: bons produtos, experiência, conhecimento técnico e relacionamento comercial. O próximo passo é comunicar todo esse valor de forma estratégica."),
        h("ul", { class: "pot__list", "data-in": "" }, OPORTUNIDADES.map((o, i) => h("li", { style: { "--i": i } }, h("span", { class: "pot__dot" }), o))),
        h("p", { class: "pot__note", "data-in": "" }, icon("leaf"), "A proposta é potencializar o que a PrioSafra já construiu.")),
      h("div", { class: "pot__right", "data-in": "" }, stage,
        h("div", { class: "pot__legend" }, h("span", { class: "pot__state" }, "Presença fragmentada"), btn)));
  },
  toggle(stage, btn, force) {
    const on = force ?? stage.dataset.state !== "int";
    stage.dataset.state = on ? "int" : "frag";
    stage.parentElement.querySelector(".pot__state").textContent = on ? "Ecossistema integrado" : "Presença fragmentada";
    btn.lastChild.textContent = on ? "Ver como está hoje" : "Integrar a presença";
    return true;
  },
  step(el, d) {
    const stage = el.querySelector(".pot__stage");
    if (d > 0 && stage.dataset.state !== "int") return this.toggle(stage, el.querySelector(".pot__btn"), true);
    return false;
  },
  async enter(el) {
    reveal(el);
    const stage = el.querySelector(".pot__stage");
    this.toggle(stage, el.querySelector(".pot__btn"), false);
    await sleep(reduced() ? 0 : 2600);
    if (el.classList.contains("is-active")) this.toggle(stage, el.querySelector(".pot__btn"), true);
  },
  leave(el) { unreveal(el); },
};

/* =========================== 03 · ECOSSISTEMA =========================== */
const MOD_ICON = { estrategia: "target", identidade: "palette", social: "insta", audiovisual: "camera", design: "pen", trafego: "megaphone", site: "globe", atendimento: "bot", dados: "brain", dashboard: "gauge", oportunidades: "spark" };

export const ecossistema = {
  id: "ecossistema", title: "O ecossistema Renowa", theme: "dark", duration: 18,
  build() {
    const N = MODULOS.length;
    const pos = MODULOS.map((_, i) => { const a = (i / N) * Math.PI * 2 - Math.PI / 2; return { x: 50 + Math.cos(a) * 41, y: 50 + Math.sin(a) * 41 }; });
    const panel = h("div", { class: "eco__panel glass", "aria-live": "polite" });
    const show = (i) => {
      const m = MODULOS[i];
      el.querySelectorAll(".eco__node").forEach((n, j) => n.setAttribute("aria-pressed", String(i === j)));
      el.querySelectorAll(".eco__link").forEach((n, j) => n.classList.toggle("is-on", i === j));
      panel.replaceChildren(h("span", { class: "eco__pi" }, icon(MOD_ICON[m.id], "ic ic--lg")), h("div", {}, h("p", { class: "eco__pk" }, `Módulo ${String(i + 1).padStart(2, "0")} de ${N}`), h("h3", {}, m.nome), h("p", {}, m.texto)));
      if (window.gsap && !reduced()) gsap.fromTo(panel.children, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" });
    };
    const links = pos.map((p) => `<line class="eco__link" x1="50" y1="50" x2="${p.x}" y2="${p.y}"/>`).join("");
    const ring = pos.map((p, i) => { const q = pos[(i + 1) % N]; return `<line class="eco__ring" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`; }).join("");
    const orbit = h("div", { class: "eco__orbit", "data-in": "" },
      svg(`<svg class="eco__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${ring}${links}<circle class="eco__halo" cx="50" cy="50" r="13"/><circle class="eco__halo eco__halo--2" cx="50" cy="50" r="22"/></svg>`),
      h("div", { class: "eco__core" }, markPrio({ cls: "pmark", dark: "#E9F2EC", light: "#3FB56E" }), h("strong", {}, "PrioSafra"), h("span", {}, "Agronegócio")),
      MODULOS.map((m, i) => h("button", { class: "eco__node", type: "button", style: { left: `${pos[i].x}%`, top: `${pos[i].y}%`, "--i": i }, "aria-pressed": "false", onclick: () => show(i) }, h("span", { class: "eco__ni" }, icon(MOD_ICON[m.id])), h("span", { class: "eco__nt" }, m.nome))));
    const el = h("div", { class: "ch__in eco" },
      h("div", { class: "eco__text" },
        h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "03"), "O ecossistema Renowa"),
        h("h2", { class: "display display--md", "data-in": "" }, "Não são serviços separados. ", h("em", {}, "É uma estrutura completa trabalhando pelo mesmo objetivo.")),
        h("p", { class: "lead", "data-in": "" }, "A Renowa não será apenas sua agência de marketing. Será o departamento de marketing, tecnologia e inteligência comercial da PrioSafra."),
        h("div", { "data-in": "" }, panel),
        h("p", { class: "fine eco__tip", "data-in": "" }, icon("cursor", "ic ic--xs"), " Toque em cada módulo para ver a função dele.")),
      orbit);
    this._show = show;
    return el;
  },
  enter(el) {
    reveal(el);
    this._show(0);
    if (!window.gsap || reduced()) return;
    gsap.fromTo(el.querySelectorAll(".eco__node > *"), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)", stagger: 0.06, delay: 0.5 });
    gsap.fromTo(el.querySelectorAll(".eco__link, .eco__ring"), { strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.out", stagger: 0.03, delay: 0.4 });
    let i = 0;
    clearInterval(this._auto);
    this._auto = setInterval(() => { if (!el.classList.contains("is-active") || document.documentElement.classList.contains("is-paused")) return; i = (i + 1) % MODULOS.length; this._show(i); }, 3800);
    el.querySelector(".eco__orbit").addEventListener("pointerdown", () => clearInterval(this._auto), { once: true });
  },
  leave(el) { clearInterval(this._auto); unreveal(el); },
};
