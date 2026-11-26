// Capítulo — O vídeo da proposta, exibido dentro de uma tela (TV/monitor), com legendas e tela cheia.
import { h, icon, reveal, unreveal } from "../lib.js";

export const video = {
  id: "video", title: "A proposta em vídeo", theme: "dark", duration: 190,
  build() {
    const v = h("video", { class: "tv__v", src: "media/proposta.mp4", poster: "media/proposta.jpg", preload: "metadata", playsinline: true, controls: true, crossorigin: "anonymous" },
      h("track", { kind: "subtitles", srclang: "pt-BR", label: "Português", src: "media/proposta.vtt" }));
    this._v = v;
    const play = h("button", { class: "tv__play", type: "button", "aria-label": "Reproduzir o vídeo", onclick: () => { v.play().catch(() => {}); } }, icon("play"));
    v.addEventListener("play", () => tv.classList.add("is-playing"));
    v.addEventListener("pause", () => tv.classList.remove("is-playing"));
    v.addEventListener("ended", () => tv.classList.remove("is-playing"));
    const err = h("p", { class: "tv__err", hidden: true }, "Não foi possível carregar o vídeo agora. Verifique a conexão e recarregue a página.");
    v.addEventListener("error", () => (err.hidden = false));
    const tv = h("div", { class: "tv", "data-noswipe": "" },
      h("div", { class: "tv__frame" }, h("div", { class: "tv__screen" }, v, play, err)),
      h("div", { class: "tv__stand" }));
    const cc = h("button", { class: "btn btn--ghost btn--sm", type: "button", "aria-pressed": "false", onclick: () => { const tr = v.textTracks[0]; if (!tr) return; const on = tr.mode !== "showing"; tr.mode = on ? "showing" : "hidden"; cc.setAttribute("aria-pressed", String(on)); cc.lastChild.textContent = on ? "Legendas ligadas" : "Legendas desligadas"; } }, icon("msg"), "Legendas desligadas");
    const full = h("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: () => (v.requestFullscreen?.() || v.webkitEnterFullscreen?.()) }, icon("expand"), "Vídeo em tela cheia");
    return h("div", { class: "ch__in vd" },
      h("div", { class: "vd__head" },
        h("div", {},
          h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "17"), "A proposta em vídeo"),
          h("h2", { class: "display display--sm", "data-in": "" }, "Dois minutos e meio para ver ", h("em", {}, "tudo funcionando junto."))),
        h("div", { class: "vd__tools", "data-in": "" }, cc, full)),
      h("div", { class: "vd__body", "data-in": "" }, tv),
      h("p", { class: "fine vd__note", "data-in": "" }, "Narração e efeitos sonoros incluídos. Interfaces, fotos e números do painel são demonstrativos."));
  },
  enter(el) { reveal(el); },
  leave(el) { this._v?.pause(); unreveal(el); },
};
