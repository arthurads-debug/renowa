// Capítulo 8 — Distribuição e tráfego pago: caminho do conteúdo, mapa da estratégia regional e etapas.
import { h, icon, svg, reveal, unreveal, reduced, brl } from "../lib.js";
import { REGIAO, REFERENCIAS_MAPA, VALORES } from "../config.js";

// Projeção simples (equiretangular) da região para o quadro do mapa
const B = { w: -49.5, e: -46.2, n: -1.15, s: -5.75 };
const W = 600, H = 920;
const px = (lng, lat) => [((lng - B.w) / (B.e - B.w)) * W, ((B.n - lat) / (B.n - B.s)) * H];
// Traçado aproximado da BR-010 (Belém–Brasília) para referência visual
const BR010 = [[-48.15, -1.30], [-47.92, -1.62], [-47.63, -2.13], [-47.50, -2.56], [-47.35, -3.00], [-47.43, -3.40], [-47.49, -3.75], [-47.55, -4.29], [-47.48, -5.00], [-47.48, -5.53]];

function mapa() {
  const base = REGIAO.find((r) => r.base);
  const [bx, by] = px(base.lng, base.lat);
  const road = BR010.map(([lng, lat], i) => `${i ? "L" : "M"}${px(lng, lat).map((v) => v.toFixed(1)).join(" ")}`).join(" ");
  const dots = [];
  for (let x = 20; x < W; x += 30) for (let y = 20; y < H; y += 30) dots.push(`<circle cx="${x}" cy="${y}" r="1"/>`);
  const cities = REGIAO.map((c) => { const [x, y] = px(c.lng, c.lat); const left = c.lng < -47.8; return `<g class="mp__city ${c.base ? "is-base" : ""}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><line class="mp__ray" x1="0" y1="0" x2="${(bx - x).toFixed(1)}" y2="${(by - y).toFixed(1)}"/><circle class="mp__pin" r="${c.base ? 11 : 7}"/><circle class="mp__pin2" r="${c.base ? 4.5 : 3}"/><text x="${left ? -16 : 16}" y="5" text-anchor="${left ? "end" : "start"}">${c.nome}</text></g>`; }).join("");
  const refs = REFERENCIAS_MAPA.map((c) => { const [x, y] = px(c.lng, c.lat); return `<g class="mp__ref" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="3"/><text x="9" y="4">${c.nome}</text></g>`; }).join("");
  return svg(`<svg class="mp" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa da estratégia regional: Paragominas, Ipixuna do Pará, Tomé-Açu, Ulianópolis e Dom Eliseu">
    <defs><radialGradient id="mpg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#3FB56E" stop-opacity=".35"/><stop offset="1" stop-color="#3FB56E" stop-opacity="0"/></radialGradient></defs>
    <g class="mp__dots">${dots.join("")}</g>
    <circle cx="${bx}" cy="${by}" r="330" fill="url(#mpg)"/>
    <g class="mp__waves" transform="translate(${bx} ${by})">${[0, 1, 2, 3].map((i) => `<circle class="mp__wave" r="60" style="animation-delay:${i * 1.1}s"/>`).join("")}</g>
    <path class="mp__road" d="${road}"/><text class="mp__roadt" x="${px(-47.25, -3.25)[0]}" y="${px(-47.25, -3.25)[1]}">BR-010</text>
    ${refs}${cities}
  </svg>`);
}

const FLOW = [["camera", "Produção"], ["megaphone", "Anúncios"], ["users", "Público regional"], ["globe", "Site ou Instagram"], ["wa", "WhatsApp"], ["handshake", "Oportunidade comercial"]];
const ETAPAS = [
  { n: "01", t: "Reconhecimento", d: "Fortalecer a presença regional e ampliar a visibilidade da PrioSafra." },
  { n: "02", t: "Consideração", d: "Distribuir conteúdos técnicos, institucionais e comerciais para públicos relevantes." },
  { n: "03", t: "Conversão", d: "Estimular visitas ao site, solicitações de orçamento e contatos pelo WhatsApp." },
];

export const trafego = {
  id: "trafego", title: "Distribuição e tráfego pago", theme: "dark", duration: 22,
  build() {
    return h("div", { class: "ch__in tr" },
      h("div", { class: "tr__text" },
        h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "08"), "Distribuição e tráfego pago"),
        h("h2", { class: "display display--sm", "data-in": "" }, "Produzir conteúdo é metade do trabalho. ", h("em", {}, "A outra metade é fazê-lo chegar a quem compra.")),
        h("div", { class: "tr__plats", "data-in": "" }, [["fb", "Facebook Ads", ""], ["insta", "Instagram Ads", ""], ["google", "Google Ads", "quando estratégico"], ["yt", "YouTube Ads", "quando estratégico"]].map(([i, t, s]) => h("span", { class: "tr__plat" }, icon(i), h("b", {}, t), s ? h("small", {}, s) : null))),
        h("div", { class: "tr__flow", "data-in": "" },
          h("div", { class: "tr__track" }, h("span", { class: "tr__pulse" })),
          FLOW.map(([i, t], k) => h("div", { class: "tr__step", style: { "--k": k } }, h("span", { class: "tr__si" }, icon(i)), h("span", { class: "tr__st" }, t)))),
        h("div", { class: "tr__stages", "data-in": "" }, ETAPAS.map((e) => h("div", { class: "tr__stage" }, h("span", {}, e.n), h("b", {}, e.t), h("p", {}, e.d)))),
        h("p", { class: "tr__note", "data-in": "" }, icon("info", "ic ic--xs"), h("span", {}, "O investimento direto nas plataformas de anúncio é definido separadamente e ", h("b", {}, `não está incluso nos ${brl(VALORES.pacote)} mensais`), "."))),
      h("div", { class: "tr__map", "data-in": "" }, mapa(),
        h("p", { class: "tr__maplab" }, h("b", {}, "Estratégia geográfica pretendida"), "Ondas de alcance a partir de Paragominas. Representa o plano, não resultados alcançados.")));
  },
  enter(el) {
    reveal(el);
    if (!window.gsap || reduced()) return;
    gsap.fromTo(el.querySelectorAll(".mp__city"), { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.15, delay: 0.6 });
    gsap.fromTo(el.querySelectorAll(".mp__ray"), { strokeDasharray: 400, strokeDashoffset: 400 }, { strokeDashoffset: 0, duration: 1.6, stagger: 0.15, delay: 0.8, ease: "power2.out" });
    gsap.fromTo(el.querySelector(".mp__road"), { strokeDasharray: 1400, strokeDashoffset: 1400 }, { strokeDashoffset: 0, duration: 2.4, delay: 0.3, ease: "power2.inOut" });
  },
  leave(el) { unreveal(el); },
};
