// Artes conceituais do novo Instagram da PrioSafra — montadas em código (escalam em qualquer tamanho).
// Cada arte usa a identidade da marca (verde-floresta, dourado, marfim) e fotografia real ilustrativa.
import { h, icon, markPrio, foto } from "./lib.js";
import { MARCAS } from "./config.js";

const mini = (tone = "light") => h("div", { class: `art__logo art__logo--${tone}` }, markPrio({ cls: "pmark", dark: tone === "light" ? "#E9F2EC" : "#0B4A32", light: tone === "light" ? "#3FB56E" : "#1F8F4E" }), h("span", {}, "PRÍO", h("br"), "SAFRA"));
const split = (t) => { const i = t.indexOf(":"); return i > 0 ? [t.slice(0, i + 1), t.slice(i + 1).trim()] : [t, ""]; };

export function art(a, { cls = "" } = {}) {
  const bg = { backgroundImage: `url(${foto(a.foto).replace("w=2000", "w=900")})` };
  const [t1, t2] = split(a.titulo);
  const tag = a.tag ? h("span", { class: "art__tag" }, a.tag) : h("span", { class: "art__tag art__tag--soft" }, a.tipo);
  let body;
  switch (a.layout) {
    case "split":
      body = [h("div", { class: "art__ph art__ph--top", style: bg }), h("div", { class: "art__panel" }, tag, h("p", { class: "art__h" }, t1, t2 ? h("em", {}, " ", t2) : null), h("span", { class: "art__rule" })), mini("light")];
      break;
    case "card":
      body = [h("div", { class: "art__ivory" }, mini("dark"), tag, h("p", { class: "art__h art__h--ink" }, t1, t2 ? h("em", {}, " ", t2) : null), h("div", { class: "art__frame", style: bg }))];
      break;
    case "quote":
      body = [h("div", { class: "art__forest" }, h("span", { class: "art__q" }, "“"), h("p", { class: "art__h art__h--serif" }, a.titulo), h("div", { class: "art__round", style: bg }), mini("light"))];
      break;
    case "reel":
      body = [h("div", { class: "art__ph", style: bg }), h("div", { class: "art__shade" }), h("span", { class: "art__reel" }, icon("reel"), "REELS"), h("div", { class: "art__bot" }, h("span", { class: "art__tag art__tag--line" }, a.tipo), h("p", { class: "art__h art__h--big" }, a.titulo)), h("span", { class: "art__play" }, icon("play"))];
      break;
    case "carousel":
      body = [h("div", { class: "art__ivory art__ivory--car" }, h("span", { class: "art__count" }, "01 / 04"), h("p", { class: "art__h art__h--ink art__h--big" }, a.titulo), h("div", { class: "art__strip" }, h("div", { style: bg }), h("div", { style: bg }), h("div", { style: bg })), h("span", { class: "art__swipe" }, "Arraste para o lado", icon("arrowR")), mini("dark"))];
      break;
    case "brands":
      body = [h("div", { class: "art__ph", style: bg }), h("div", { class: "art__shade art__shade--full" }), h("div", { class: "art__center" }, tag, h("p", { class: "art__h" }, a.titulo), h("ul", { class: "art__brands" }, MARCAS.map((m) => h("li", {}, h("b", {}, m.nome), h("span", {}, m.linha))))), mini("light")];
      break;
    case "cta":
      body = [h("div", { class: "art__ph", style: bg }), h("div", { class: "art__shade art__shade--full" }), mini("light"), h("div", { class: "art__bot" }, h("p", { class: "art__h art__h--big" }, a.titulo), h("span", { class: "art__btn" }, icon("wa"), "Solicite seu atendimento"))];
      break;
    default: // full
      body = [h("div", { class: "art__ph", style: bg }), h("div", { class: "art__shade" }), mini("light"), h("div", { class: "art__bot" }, tag, h("p", { class: "art__h art__h--big" }, t1, t2 ? h("em", {}, " ", t2) : null), h("span", { class: "art__rule" }))];
  }
  return h("div", { class: `art art--${a.layout} ${cls}` }, body);
}

export const highlight = (d, size = "") => h("div", { class: `hl ${size}` }, h("span", { class: "hl__c" }, icon(d.icone)), h("span", { class: "hl__t" }, d.nome));
