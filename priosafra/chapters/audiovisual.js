// Capítulo 5 — Produção audiovisual: processo e reels demonstrativos em celulares.
import { h, icon, phone, foto, reveal, unreveal, demoTag, reduced, markPrio } from "../lib.js";
import { AUDIOVISUAL } from "../config.js";

const ROTEIROS = {
  "Captação em lavouras": ["A equipe PrioSafra está no campo hoje", "acompanhando a lavoura de perto", "conteúdo real, feito na região"],
  "Visitas a propriedades": ["Visita técnica em uma propriedade parceira", "conversa direta com o produtor", "relacionamento que vira conteúdo"],
  "Conteúdo técnico": ["Você sabe o que avaliar", "antes de escolher a semente?", "a gente explica em 30 segundos"],
  "Filmagens aéreas": ["Vista de cima da lavoura", "drone quando planejado e autorizado", "escala e beleza do campo"],
  Bastidores: ["Bastidores da operação", "do atendimento à entrega", "quem está por trás da PrioSafra"],
  "Reels comerciais": ["Planejando a próxima safra?", "fale com a equipe PrioSafra", "atendimento pelo WhatsApp"],
};
const PIPE_IC = ["calendar", "file", "camera", "pen", "send", "megaphone"];

function reel(f, i) {
  const cap = h("p", { class: "reel__cap" });
  return {
    el: h("div", { class: "reel" },
      h("div", { class: "reel__ph kb", style: { backgroundImage: `url(${foto(f.foto).replace("w=2000", "w=900")})`, animationDelay: `${-i * 7}s` } }),
      h("div", { class: "reel__shade" }),
      h("div", { class: "reel__top" }, h("span", { class: "reel__rec" }, h("i"), "REC"), h("span", {}, "Reels")),
      h("div", { class: "reel__side" }, ["heart", "msg", "send", "bookmark"].map((n) => icon(n))),
      h("div", { class: "reel__bot" },
        h("span", { class: "reel__cat" }, f.nome),
        cap,
        h("div", { class: "reel__user" }, h("span", { class: "reel__av" }, markPrio({ cls: "pmark" })), h("b", {}, "priosafra"), h("span", { class: "reel__fol" }, "Seguir")),
        h("div", { class: "reel__bar" }, h("span")))),
    cap, nome: f.nome,
  };
}

export const audiovisual = {
  id: "audiovisual", title: "Produção audiovisual", theme: "dark", duration: 22,
  build() {
    const F = AUDIOVISUAL.formatos;
    this._sel = [0, 1, 2];
    this._reels = [0, 1, 2].map((k) => reel(F[k], k));
    const phones = h("div", { class: "av__phones", "data-in": "" }, this._reels.map((r, k) => phone(r.el, { dark: true, cls: `av__phone av__phone--${k}` })));
    const chips = h("div", { class: "av__formats", role: "group", "aria-label": "Formatos de conteúdo" }, F.map((f, i) => h("button", { type: "button", class: "av__fmt", "aria-pressed": String(i < 3), onclick: () => this.pick(i) }, h("span", { class: "av__fmtn" }, String(i + 1).padStart(2, "0")), h("span", {}, h("b", {}, f.nome), h("small", {}, f.texto)))));
    this._chips = chips;
    const pipe = h("ol", { class: "av__pipe", "data-in": "" }, AUDIOVISUAL.processo.map((p, i) => h("li", { style: { "--i": i } }, h("span", { class: "av__pi" }, icon(PIPE_IC[i])), h("span", { class: "av__pt" }, p))));
    return h("div", { class: "ch__in av" },
      h("div", { class: "av__bg photo", style: { backgroundImage: `url(${foto("trator")})` } }),
      h("div", { class: "av__text" },
        h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "05"), "Produção audiovisual"),
        h("h2", { class: "display display--md", "data-in": "" }, "Transformamos o conhecimento da PrioSafra em ", h("em", {}, "conteúdo que gera confiança.")),
        pipe,
        h("div", { class: "av__deliver glass", "data-in": "" },
          h("div", { class: "av__big" }, h("strong", {}, "6"), h("span", {}, "vídeos por mês", h("br"), "com captação profissional")),
          h("div", { class: "av__split" }, h("p", {}, h("b", {}, "4"), " conteúdos principais previstos no planejamento editorial"), h("p", {}, h("b", {}, "2"), " conteúdos complementares"))),
        h("div", { "data-in": "" }, chips)),
      phones,
      h("div", { class: "av__tag" }, demoTag("Demonstração · imagens ilustrativas até a captação própria")));
  },
  pick(i) {
    const F = AUDIOVISUAL.formatos;
    if (this._sel.includes(i)) return;
    this._sel = [this._sel[1], this._sel[2], i];
    this._reels.forEach((r, k) => {
      const f = F[this._sel[k]];
      r.el.querySelector(".reel__ph").style.backgroundImage = `url(${foto(f.foto).replace("w=2000", "w=900")})`;
      r.el.querySelector(".reel__cat").textContent = f.nome;
      r.nome = f.nome;
      if (window.gsap && !reduced()) gsap.fromTo(r.el, { opacity: 0.2, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.7, ease: "expo.out", delay: k * 0.06 });
    });
    this._chips.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-pressed", String(this._sel.includes(j))));
    this.captions(true);
  },
  captions(reset) {
    clearInterval(this._cap);
    let t = 0;
    const tick = () => {
      if (document.documentElement.classList.contains("is-paused")) return;
      this._reels.forEach((r, k) => {
        const lines = ROTEIROS[r.nome] || [];
        const line = lines[(t + k) % lines.length] || "";
        r.cap.textContent = line;
        if (window.gsap && !reduced()) gsap.fromTo(r.cap, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
      });
      t++;
    };
    tick();
    this._cap = setInterval(tick, 2600);
  },
  enter(el) {
    reveal(el);
    this.captions();
    if (window.gsap && !reduced()) {
      gsap.fromTo(el.querySelectorAll(".av__pipe li"), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.12, delay: 0.6, ease: "power3.out" });
      gsap.fromTo(el.querySelectorAll(".av__phone"), { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.12, delay: 0.3, ease: "expo.out" });
    }
  },
  leave(el) { clearInterval(this._cap); unreveal(el); },
};
