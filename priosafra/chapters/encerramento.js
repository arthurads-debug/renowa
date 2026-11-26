// Capítulo 17 — Encerramento.
import { h, icon, logoRenowa, markPrio, reveal, unreveal, reduced } from "../lib.js";
import { FOTOS } from "../config.js";

const PASSOS = ["Aprovação da proposta", "Coleta de materiais e briefing final", "Desenvolvimento visual e estrutural", "Produção do banco de conteúdo", "Início da operação digital"];

export const encerramento = {
  id: "encerramento", title: "Toda grande colheita começa com uma decisão", theme: "dark", duration: 24,
  build() {
    const next = h("div", { class: "fim__next", hidden: true },
      h("p", { class: "kicker" }, "Próximos passos"),
      h("ol", {}, PASSOS.map((p, i) => h("li", {}, h("span", {}, String(i + 1)), p))));
    const btn = h("button", { class: "btn btn--ghost fim__btn", type: "button", onclick: () => { next.hidden = false; btn.hidden = true; if (window.gsap && !reduced()) gsap.fromTo(next.querySelectorAll("li"), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.12, ease: "power3.out" }); } }, "Vamos construir essa nova fase?", icon("arrowR"));
    return h("div", { class: "fim" },
      h("div", { class: "photo fim__ph", style: { backgroundImage: `url(${FOTOS.encerramento})` } }),
      h("div", { class: "fim__scrim" }),
      h("div", { class: "ch__in fim__in" },
        h("h2", { class: "display display--xl fim__t", "data-in": "1" }, "Toda grande colheita ", h("em", {}, "começa com uma decisão.")),
        h("p", { class: "lead fim__lead", "data-in": "2" }, "A PrioSafra já atua em um dos setores mais importantes da nossa economia. Agora é hora de construir uma presença digital à altura daquilo que a empresa representa no campo."),
        h("ul", { class: "fim__mais", "data-in": "3" }, ["Mais autoridade.", "Mais presença.", "Mais tecnologia.", "Mais oportunidades."].map((t) => h("li", {}, t))),
        h("p", { class: "fim__sub", "data-in": "4" }, "Uma estrutura completa, trabalhando todos os dias para fortalecer a sua marca."),
        h("div", { class: "fim__sig", "data-in": "5" },
          h("div", { class: "fim__lock" }, markPrio({ cls: "pmark", dark: "#E9F2EC", light: "#3FB56E" }), h("b", {}, "PrioSafra"), h("span", {}, "×"), logoRenowa({ tone: "light", cls: "rlogo fim__rl" })),
          h("p", { class: "serif fim__tag" }, "Cultivando autoridade. Construindo oportunidades.")),
        h("div", { "data-in": "6" }, btn, next)),
      h("p", { class: "photo-credit" }, "Foto ilustrativa · Unsplash"));
  },
  enter(el) {
    reveal(el, { delay: 0.8, stagger: 0.35 });
    if (window.gsap && !reduced()) {
      gsap.fromTo(el.querySelector(".fim__ph"), { scale: 1.25, filter: "brightness(.3)" }, { scale: 1.06, filter: "brightness(1)", duration: 6, ease: "power2.out" });
      gsap.fromTo(el.querySelectorAll(".fim__mais li"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.3, delay: 2.2, ease: "expo.out" });
    }
  },
  leave(el) { unreveal(el); el.querySelector(".fim__next").hidden = true; el.querySelector(".fim__btn").hidden = false; },
};
