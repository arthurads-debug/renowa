// Vídeo Renowa × PrioSafra — 11 cenas, 180 s, 1920×1080.
// Mesmos componentes visuais da apresentação (/priosafra): logotipos, ícones, artes do Instagram, site, assistente, painel.
import { h, icon, markPrio, logoPrio, logoRenowa, statusBar, foto } from "./shared/lib.js";
import { ARTES, DESTAQUES, BIO_NOVA, EMPRESA, MARCAS, PILARES, REGIAO, PRODUTOS, FOTOS } from "./shared/config.js";
import { art, highlight } from "./shared/arts.js";
import { box, show, key, move, fn, ink, count, type, kin, svgLayer, sv, path, render, seg, mix } from "./motor.js";
import { CENAS, warp } from "./roteiro.js";
import { cenasFinais } from "./cenas2.js";

const stage = document.getElementById("stage");
const C = Object.fromEntries(CENAS.map((c) => [c.id, c]));
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const GREEN = "#0B4A32", LEAF = "#1F8F4E", GOLD = "#B8955B";

// Cada cena é uma camada que entra e sai com um respiro curto (continuidade sem cortes secos)
export function scene(id, { bg, inT = "fade", outT = "fade" } = {}) {
  const c = C[id];
  const el = h("div", { class: `a scene scene--${id}` });
  if (bg) el.append(h("div", { class: bg }));
  stage.append(el);
  show(el, c.t0 - (c.t0 ? 0.35 : 0), c.t1 + 0.35, { in: c.t0 ? inT : "none", out: outT, di: 0.6, dout: 0.5 });
  return { el, t0: c.t0, t1: c.t1 };
}
export const kick = (parent, text, t0, t1, light = false, x = 120, y = 72) => show(box(parent, { x, y, cls: `kicker2 ${light ? "kicker2--light" : ""}` }, text), t0, t1, { in: "left" });

// Fotografias usadas no vídeo: pré-carregadas para o render esperar por elas
const pre = document.getElementById("preload");
Object.values(FOTOS).forEach((u) => pre.append(h("img", { src: u.replace("w=2000", "w=900"), alt: "" })));
["assets/instagram-atual-grade.jpg", "assets/instagram-atual-foto.jpg"].forEach((u) => pre.append(h("img", { src: u, alt: "" })));

/* ============================== 01 · SEMENTE ============================== */
{
  const { el, t0 } = scene("semente");
  const s = svgLayer(el);
  // linhas da lavoura em perspectiva
  const rows = [];
  for (let i = -9; i <= 9; i++) rows.push(path(s, `M${960 + i * 150} 1120 L${960 + i * 16} 610`, "ink ink--thin"));
  rows.forEach((r, i) => ink(r, 4.6 + Math.abs(i - 9) * 0.07, 1.6));
  const hz = ink(path(s, "M240 610 L1680 610", "ink ink--thin"), 4.4, 1.4);
  const fieldG = [hz, ...rows];
  // nós e conexões digitais sobre as linhas
  const nodes = [];
  for (let i = -8; i <= 8; i += 2) for (const k of [0.25, 0.55, 0.85]) {
    const yy = 610 + k * 470, xx = 960 + i * (16 + (150 - 16) * k);
    const n = sv(s, "circle", { cx: xx, cy: yy, r: 6, class: "fill-gold" });
    nodes.push(n);
  }
  const links = [];
  for (let i = 0; i < nodes.length - 3; i += 2) {
    const a = nodes[i], b = nodes[i + 3];
    links.push(ink(path(s, `M${a.getAttribute("cx")} ${a.getAttribute("cy")} Q 960 ${+a.getAttribute("cy") - 120} ${b.getAttribute("cx")} ${b.getAttribute("cy")}`, "ink ink--gold ink--thin"), 7.2 + i * 0.03, 1.2));
  }
  fn(6.9, 1.2, (p) => nodes.forEach((n, i) => n.setAttribute("r", String(6 * seg(p * 1.2, i * 0.01, 0.5, "back.out(2)")))));
  // semente, solo e broto
  const soil = ink(path(s, "M760 650 Q 960 636 1160 650"), 0.2, 1.2);
  const seed = ink(path(s, "M960 588 C 985 596 990 640 960 648 C 930 640 935 596 960 588 Z"), 0.4, 1.3);
  const stem = ink(path(s, "M960 600 C 956 560 964 520 960 474"), 1.6, 1.4);
  // folhas = as folhas do logotipo (mesmas formas): o broto vira a marca
  const leafG = sv(s, "g", {});
  const l2 = path(leafG, "M52 101C38 97 23 86 15 64c15-1 31 6 37 20.5 1.4 3.6 1.6 9 0 16.5Z", "ink", { "stroke-width": "1.6" });
  const l1 = path(leafG, "M52 101C45 72 62 30 121 6c-4 33-17 62-42 82-8 6-17 10-27 13Z", "ink", { "stroke-width": "1.6" });
  const f2 = path(leafG, "M52 101C38 97 23 86 15 64c15-1 31 6 37 20.5 1.4 3.6 1.6 9 0 16.5Z", "fill-leaf");
  const f1 = path(leafG, "M52 101C45 72 62 30 121 6c-4 33-17 62-42 82-8 6-17 10-27 13Z", "fill-forest");
  const ring = sv(leafG, "circle", { cx: 56, cy: 66, r: 47, class: "ink ink--gold", "stroke-width": "7.5" });
  const ring2 = sv(leafG, "circle", { cx: 56, cy: 66, r: 37.5, class: "ink ink--gold", "stroke-width": "1.6" });
  ink(l2, 2.6, 1.2); ink(l1, 2.9, 1.3); ink(ring, 8.9, 1.5, "power3.inOut"); ink(ring2, 9.2, 1.3, "power3.inOut");
  fn(3.6, 0.9, (p) => { f1.style.opacity = p; f2.style.opacity = p; }); f1.style.opacity = 0; f2.style.opacity = 0;
  // broto (escala 1.6 na ponta do caule) → marca (escala 2.3, à esquerda do nome)
  fn(0, 11, (_, t) => {
    const p = seg(t, 8.4, 1.6, "power3.inOut");
    const sc = mix(1.6, 2.3, p), bx = mix(960, 700, p), by = mix(474, 492, p);
    leafG.setAttribute("transform", `translate(${bx - 52 * sc} ${by - 101 * sc}) scale(${sc})`);
  });
  fn(8.2, 0.9, (p) => [...fieldG, ...links, soil, seed, stem, ...nodes].forEach((n) => (n.style.opacity = String(1 - p))));
  // nome
  const word = box(el, { x: 900, y: 250, cls: "v-word" }, h("span", { class: "v-word__w" }, "PRÍO", h("br"), "SAFRA"), h("span", { class: "v-word__s" }, "AGRONEGÓCIO"));
  show(word, 10, 13.7, { in: "left", out: "fade" });
  // palavras de impacto
  ["ESTRATÉGIA.", "TECNOLOGIA.", "CRESCIMENTO."].forEach((w, i) => kin(el, w, { x: 120, y: 170 + i * 104, size: 88, cls: "kin--caps", t0: 5.0 + i * 0.9, t1: 8.2 }));
  // assinatura e título
  show(box(el, { x: 690, y: 690, cls: "v-sig" }, h("span", {}, "Uma estratégia"), logoRenowa({ tone: "dark", cls: "rlogo v-sig__r" })), 11, 13.7, { in: "up" });
  kin(el, ["O futuro digital ", h("em", {}, "da PrioSafra.")], { x: 0, y: 800, w: 1920, align: "center", size: 92, t0: 11.6, t1: 13.8 });
}

/* ============================== 02 · POSICIONAMENTO ============================== */
{
  const { el, t0 } = scene("posicionamento");
  kick(el, "Passo 01 · Posicionamento", t0, 27.6);
  // peças soltas → quadro de identidade organizado
  const P = [
    { c: box(el, { w: 330, hgt: 230, cls: "card v-ph", style: { backgroundImage: `url(${FOTOS.milhoCeu.replace("w=2000", "w=900")})` } }), a: [180, 260, -9], b: [120, 200, 0] },
    { c: box(el, { w: 300, hgt: 230, cls: "card v-logo" }, logoPrio({ cls: "plogo v-logo__l" })), a: [660, 150, 7], b: [470, 200, 0] },
    { c: box(el, { w: 300, hgt: 230, cls: "card v-type" }, h("b", {}, "Aa"), h("span", {}, "Outfit · títulos"), h("i", {}, "Fraunces · destaques")), a: [980, 300, -5], b: [790, 200, 0] },
    { c: box(el, { w: 330, hgt: 190, cls: "card v-pal" }, ["#0B4A32", "#1F8F4E", "#B8955B", "#F5F4EE"].map((c) => h("i", { style: { background: c } }))), a: [260, 640, 6], b: [120, 450, 0] },
    { c: box(el, { w: 300, hgt: 375, cls: "v-art" }, art(ARTES[3])), a: [620, 560, -11], b: [470, 450, 0] },
    { c: box(el, { w: 300, hgt: 190, cls: "card v-ico" }, ["corn", "sorgo", "grass", "sun"].map((n) => h("span", {}, icon(n)))), a: [1000, 680, 9], b: [790, 450, 0] },
  ];
  P.forEach(({ c, a, b }, i) => {
    show(c, t0 + 0.3 + i * 0.35, 27.6, { in: "pop" });
    move(c, t0 + 4.6 + i * 0.12, 1.5, { x: a[0], y: a[1], r: a[2] }, { x: b[0], y: b[1], r: b[2] }, "expo.inOut");
    fn(t0 + 4.6 + i * 0.12, 1.5, (p) => (c.style.filter = `grayscale(${(1 - p) * 0.75}) blur(var(--ib, 0px))`), "power2.inOut");
    c.style.left = "0px"; c.style.top = "0px";
  });
  // grade dourada de alinhamento
  const g = svgLayer(el);
  ["M100 180 H1110", "M100 860 H1110", "M100 180 V860", "M1110 180 V860", "M450 180 V860", "M770 180 V860"].forEach((d, i) => ink(path(g, d, "ink ink--gold ink--thin ink--dash"), t0 + 5.4 + i * 0.1, 1.2));
  fn(t0 + 7.8, 0.6, (p) => g.querySelectorAll("path").forEach((n) => (n.style.opacity = String(1 - p * 0.75))));
  ["CREDIBILIDADE.", "AUTORIDADE.", "PRESENÇA."].forEach((w, i) => kin(el, w, { x: 1190, y: 300 + i * 120, size: 80, cls: "kin--caps", t0: t0 + 8 + i * 1.3, t1: 27.6 }));
  show(box(el, { x: 1214, y: 700, w: 600, cls: "note" }, "A qualidade do campo, comunicada com a mesma consistência no digital."), t0 + 11.6, 27.6, { in: "up" });
}

/* ============================== 03 · INSTAGRAM ============================== */
const P0 = EMPRESA.perfilAtual;
const igTop = () => h("div", { class: "ig__top" }, icon("arrowL", "ic ic--xs"), h("b", {}, "priosafra"), h("span", { class: "ig__topr" }, icon("bookmark", "ic ic--xs"), h("span", { class: "ig__dots" }, "•••")));
const igStats = () => h("div", { class: "ig__stats" }, [[P0.posts, "posts"], [P0.seguidores, "seguidores"], [P0.seguindo, "seguindo"]].map(([n, t]) => h("div", {}, h("b", {}, n), h("span", {}, t))));
const igTabs = () => h("div", { class: "ig__tabs" }, h("span", { class: "is-on" }, icon("grid", "ic ic--xs")), h("span", {}, icon("reel", "ic ic--xs")), h("span", {}, icon("users", "ic ic--xs")));
export function phoneShell(content, cls = "") {
  return h("div", { class: `phone ${cls}` }, h("div", { class: "phone__frame" }, h("div", { class: "phone__island" }), h("div", { class: "phone__screen" }, content)));
}
{
  const { el, t0 } = scene("instagram");
  kick(el, "Passo 02 · O novo Instagram", t0, 46.6, false, 120, 34);
  // celular desenhado a traço, depois a tela acende
  const s = svgLayer(el);
  const out = ink(path(s, "M580 70 H930 Q990 70 990 130 V950 Q990 1010 930 1010 H580 Q520 1010 520 950 V130 Q520 70 580 70 Z"), t0 + 0.2, 1.6);
  fn(t0 + 2, 0.6, (p) => (out.style.opacity = String(1 - p)));
  const atual = h("div", { class: "ig ig--atual" }, statusBar(), igTop(),
    h("div", { class: "ig__head" }, h("div", { class: "ig__pic ig__pic--ring", style: { backgroundImage: "url(assets/instagram-atual-foto.jpg)" } }), igStats()),
    h("div", { class: "ig__bio" }, P0.bio.map((l, i) => h("p", { class: i === 0 ? "ig__name" : "" }, l))),
    h("div", { class: "ig__btns" }, h("span", { class: "ig__b ig__b--blue" }, "Seguir"), h("span", { class: "ig__b" }, "Mensagem")),
    igTabs(), h("div", { class: "ig__shot", style: { backgroundImage: `url(${P0.grade})` } }));
  const cells = [11, 0, 3, 6, 2, 4, 8, 1, 10].map((i) => h("div", { class: "ig__cell" }, art(ARTES[i])));
  const hls = DESTAQUES.map((d) => highlight(d));
  const nova = h("div", { class: "ig ig--nova" }, statusBar(), igTop(),
    h("div", { class: "ig__head" }, h("div", { class: "ig__pic ig__pic--brand" }, markPrio({ cls: "pmark" })), igStats()),
    h("div", { class: "ig__bio" }, BIO_NOVA.map((l, i) => h("p", { class: i === 0 ? "ig__name" : i === BIO_NOVA.length - 1 ? "ig__cta" : "" }, l))),
    h("div", { class: "ig__btns" }, h("span", { class: "ig__b ig__b--green" }, "Seguir"), h("span", { class: "ig__b" }, "Mensagem"), h("span", { class: "ig__b" }, "Orçamento")),
    h("div", { class: "ig__hls ig__hls--new" }, hls), igTabs(), h("div", { class: "ig__grid" }, cells));
  const layA = h("div", { class: "v-lay" }, atual), layB = h("div", { class: "v-lay" }, nova);
  const ph = box(el, { x: 520, y: 70, w: 470, hgt: 940, cls: "v-phone" }, phoneShell(h("div", { class: "v-lays" }, layB, layA), "v-phone__p"));
  show(ph, t0 + 1.4, 46.6, { in: "fade", di: 0.9 });
  const tagA = show(box(el, { x: 550, y: 1018, cls: "note" }, `Perfil atual · captura pública de ${P0.consultadoEm}`), t0 + 2.2, t0 + 5.2, { in: "up" });
  const tagB = show(box(el, { x: 580, y: 1018, cls: "note v-gold" }, "Proposta visual da Renowa"), t0 + 6.4, 46.6, { in: "up" });
  // cortina da transformação: o perfil atual sai da direita para a esquerda
  fn(t0 + 5, 1.5, (p) => (layA.style.clipPath = `inset(0 ${p * 100}% 0 0)`), "power3.inOut");
  hls.forEach((hl, i) => { hl.classList.add("a"); show(hl, t0 + 6.6 + i * 0.12, 46.6, { in: "pop", di: 0.6 }); });
  cells.forEach((c, i) => { c.classList.add("a"); c.style.position = "relative"; show(c, t0 + 7.4 + i * 0.55, 46.6, { in: "pop", di: 0.7 }); });
  // lista do que muda, sincronizada com a fala
  ["Nova biografia estratégica", "Destaques personalizados", "Feed com identidade consistente", "Conteúdo técnico, comercial e institucional", "Capas de reels padronizadas", "Milho · Sorgo · Pastagens"].forEach((t, i) =>
    show(box(el, { x: 1080, y: 230 + i * 88, cls: "chipv" }, icon("check"), t), t0 + 6.8 + i * 0.9, t0 + 12.6, { in: "left", out: "fade" }));
  // três publicações saem do celular e crescem
  [[0, 1210, 150, -4], [6, 1500, 120, 2], [10, 1770, 170, 5]].forEach(([ai, x, y, r], i) => {
    const c = box(el, { w: 270, hgt: 338, cls: "v-fly" }, art(ARTES[ai]));
    c.style.left = "0"; c.style.top = "0";
    show(c, t0 + 13 + i * 0.35, 46.6, { in: "fade", di: 0.3 });
    move(c, t0 + 13 + i * 0.35, 1.4, { x: 620 + i * 120, y: 760, s: 0.42, r: 0 }, { x: x - 135, y, s: 1, r }, "expo.out");
  });
  kin(el, "Uma marca mais forte.", { x: 1060, y: 610, size: 50, t0: t0 + 15, t1: 46.6 });
  kin(el, ["Uma comunicação ", h("em", {}, "mais profissional.")], { x: 1060, y: 676, size: 50, t0: t0 + 16, t1: 46.6 });
  show(box(el, { x: 1084, y: 800, w: 760, cls: "note" }, "Números do perfil mantidos como estão hoje. Artes conceituais; fotos ilustrativas."), t0 + 16.6, 46.6, { in: "up" });
}

/* ============================== 04 · CONTEÚDO ============================== */
const ICONS = {
  cal: "M-60 -46 H60 Q70 -46 70 -36 V56 Q70 66 60 66 H-60 Q-70 66 -70 56 V-36 Q-70 -46 -60 -46 Z M-70 -14 H70 M-36 -62 V-32 M36 -62 V-32 M-44 10 H-24 M-10 10 H10 M24 10 H44 M-44 38 H-24 M-10 38 H10",
  cam: "M-76 -34 H-30 L-18 -54 H22 L34 -34 H76 Q84 -34 84 -26 V56 Q84 64 76 64 H-76 Q-84 64 -84 56 V-26 Q-84 -34 -76 -34 Z M0 -18 A 34 34 0 1 0 0.1 -18 M0 2 A 14 14 0 1 0 0.1 2 M56 -18 H66",
  edit: "M-90 -56 H90 V44 H-90 Z M-20 44 V64 M20 44 V64 M-40 64 H40 M-74 -40 H-10 V-6 H-74 Z M6 -40 H74 M6 -26 H60 M6 -12 H70 M-74 16 H74 M-60 8 V24 M-20 8 V24 M30 8 V24",
  pub: "M-44 -76 H44 Q56 -76 56 -64 V64 Q56 76 44 76 H-44 Q-56 76 -56 64 V-64 Q-56 -76 -44 -76 Z M-12 -62 H12 M-40 -44 H40 V20 H-40 Z M-40 34 H10 M-40 48 H24 M30 40 L40 50 L56 30",
};
{
  const { el, t0 } = scene("conteudo");
  kick(el, "Passo 03 · Conteúdo profissional", t0, 62.6);
  const s = svgLayer(el);
  const pts = [[330, "cal", "Planejamento"], [750, "cam", "Captação"], [1170, "edit", "Edição"], [1590, "pub", "Publicação"]];
  const flow = [];
  pts.forEach(([x, k, label], i) => {
    const g = sv(s, "g", { transform: `translate(${x} 420)` });
    flow.push(ink(path(g, ICONS[k]), t0 + 0.4 + i * 1.1, 1.3));
    const lb = show(box(el, { x: x - 150, y: 530, w: 300, cls: "v-flab" }, label), t0 + 1 + i * 1.1, t0 + 6.4, { in: "up" });
    if (i < 3) flow.push(ink(path(s, `M${x + 110} 420 L${x + 300} 420 M${x + 284} 408 L${x + 300} 420 L${x + 284} 432`, "ink ink--gold"), t0 + 1.2 + i * 1.1, 0.7));
  });
  fn(t0 + 6.2, 0.6, (p) => flow.forEach((n) => (n.style.opacity = String(1 - p))));
  // calendário sendo preenchido (mesmo plano da apresentação)
  const PLANO = [[0, 0, "institucional", "Vídeo"], [0, 2, "tecnico", "Carrossel"], [0, 4, "produto", "Arte"], [1, 0, "campo", "Vídeo"], [1, 2, "produto", "Vídeo"], [1, 4, "comercial", "Arte"], [2, 0, "tecnico", "Vídeo"], [2, 2, "produto", "Carrossel"], [2, 4, "institucional", "Arte"], [3, 0, "produto", "Vídeo"], [3, 2, "tecnico", "Arte"], [3, 4, "comercial", "Vídeo"]];
  const PIL = Object.fromEntries(PILARES.map((p) => [p.id, p]));
  const cal = box(el, { x: 120, y: 170, w: 900, cls: "v-cal" });
  show(cal, t0 + 6.5, 62.6, { in: "up" });
  const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  cal.append(h("div", { class: "v-cal__h" }, h("b", {}, "Mês modelo"), h("span", {}, "3 publicações por semana")));
  const grid = h("div", { class: "v-cal__g" }, DIAS.map((d) => h("span", { class: "v-cal__dh" }, d)));
  cal.append(grid);
  let k = 0;
  for (let w = 0; w < 4; w++) for (let d = 0; d < 7; d++) {
    const it = PLANO.find((x) => x[0] === w && x[1] === d);
    const cell = h("div", { class: `v-cal__d ${it ? "is-post" : ""}`, style: it ? { "--c": PIL[it[2]].cor } : {} }, h("span", { class: "v-cal__n" }, w * 7 + d + 1));
    grid.append(cell);
    if (it) {
      const tag = h("div", { class: "a v-cal__p" }, h("b", {}, it[3]), h("span", {}, PIL[it[2]].nome));
      cell.append(tag);
      show(tag, t0 + 7.2 + (k++) * 0.32, 62.6, { in: "pop", di: 0.5 });
    }
  }
  // pilares
  PILARES.forEach((p, i) => show(box(el, { x: 1110, y: 175 + i * 74, w: 690, cls: "v-pil", style: { "--c": p.cor } }, h("b", {}, p.nome), h("span", {}, p.texto.split(",")[0])), t0 + 10 + i * 0.4, 62.6, { in: "left" }));
  // contadores
  const n1 = h("b", {}, "0"), n2 = h("b", {}, "0");
  show(box(el, { x: 1110, y: 590, w: 330, cls: "v-big" }, n1, h("span", {}, "PUBLICAÇÕES", h("br"), "POR SEMANA")), t0 + 11.6, 62.6, { in: "up" });
  show(box(el, { x: 1470, y: 590, w: 330, cls: "v-big" }, n2, h("span", {}, "VÍDEOS", h("br"), "MENSAIS")), t0 + 12.4, 62.6, { in: "up" });
  count(n1, t0 + 11.8, 1, 0, 3); count(n2, t0 + 12.6, 1.2, 0, 6);
  show(box(el, { x: 1112, y: 800, w: 690, cls: "note" }, "Os 6 vídeos fazem parte do calendário: 4 principais e 2 complementares."), t0 + 13.4, 62.6, { in: "up" });
}

/* ============================== 05 · SITE ============================== */
function siteHome(compact = false) {
  const p = (id) => PRODUTOS[id];
  return h("div", { class: "s-root v-site" },
    h("header", { class: "s-head" }, logoPrio({ cls: "plogo s-plogo" }),
      h("nav", { class: "s-nav" }, ["Início", "Milho", "Sorgo", "Pastagens", "A PrioSafra", "Parceiros", "Contato"].map((t, i) => h("button", { type: "button", class: i === 0 ? "is-on" : "", "data-n": t }, t))),
      h("span", { class: "s-btn s-btn--sm s-head__cta" }, "Solicitar atendimento"), h("span", { class: "s-burger" }, icon("menu"))),
    h("div", { class: "s-view v-sview" },
      h("section", { class: "s-hero" }, h("div", { class: "s-hero__ph", style: { backgroundImage: `url(${FOTOS.milhoCeu.replace("w=2000", "w=1600")})` } }),
        h("div", { class: "s-hero__c" }, h("p", { class: "s-eyebrow" }, "Milho · Sorgo · Pastagens"), h("h1", {}, "Grandes safras começam com grandes escolhas."), h("p", {}, "Sementes de milho, sorgo e pastagens, com atendimento próximo e soluções para o produtor rural."), h("div", { class: "s-row" }, h("span", { class: "s-btn" }, "Solicitar atendimento"), h("span", { class: "s-btn s-btn--wa" }, icon("wa", "ic ic--xs"), "WhatsApp")))),
      h("section", { class: "s-brands" }, h("p", { class: "s-eyebrow" }, "Marcas representadas"), h("div", {}, MARCAS.map((m) => h("span", {}, m.nome)))),
      h("section", { class: "s-sec" }, h("h2", {}, "Nossas sementes"), h("div", { class: "s-cats" }, ["milho", "sorgo", "pastagens"].map((id) => h("div", { class: "s-cat" }, h("div", { class: "s-cat__ph", style: { backgroundImage: `url(${p(id).foto.replace("w=2000", "w=800")})` } }), h("div", { class: "s-cat__b" }, h("h4", {}, id[0].toUpperCase() + id.slice(1)), h("p", {}, p(id).texto), h("span", {}, "Ver catálogo")))))),
      h("section", { class: "s-band" }, h("h3", {}, "Planejando a próxima safra?"), h("p", {}, "Fale com a equipe e receba seu orçamento."), h("div", { class: "s-row" }, h("span", { class: "s-btn" }, "Solicitar orçamento"), h("span", { class: "s-btn s-btn--wa" }, "WhatsApp")))));
}
function siteMilho() {
  const p = PRODUTOS.milho;
  return h("div", { class: "s-view v-sview" },
    h("section", { class: "s-pagehero", style: { backgroundImage: `linear-gradient(90deg, rgba(5,42,29,.92), rgba(5,42,29,.4)), url(${p.capa.replace("w=2000", "w=1600")})` } }, h("p", { class: "s-eyebrow" }, "Catálogo"), h("h1", {}, p.titulo), h("p", {}, p.texto)),
    h("section", { class: "s-sec" }, h("div", { class: "s-filter" }, h("span", {}, "Marcas:"), p.marcas.map((m, i) => h("button", { class: i === 0 ? "is-on" : "" }, m))),
      h("div", { class: "s-prods" }, p.marcas.flatMap((m) => [1, 2].map((n) => h("article", { class: "s-prod" }, h("div", { class: "s-prod__ph", style: { backgroundImage: `url(${(n === 1 ? p.foto : p.capa).replace("w=2000", "w=700")})` } }, h("span", {}, m)), h("div", { class: "s-prod__b" }, h("h4", {}, `Milho · ${m}`), h("p", { class: "s-prod__ph-t" }, "Informações após validação"), h("span", { class: "s-btn s-btn--sm" }, "Consultar"))))))));
}
export { siteHome };
{
  const { el, t0 } = scene("site");
  kick(el, "Passo 04 · Um site exclusivo", t0, 81.6);
  const s = svgLayer(el);
  // monitor desenhado a traço
  const mon = [path(s, "M400 96 H1520 Q1540 96 1540 116 V744 Q1540 764 1520 764 H400 Q380 764 380 744 V116 Q380 96 400 96 Z"), path(s, "M900 764 L880 836 H1040 L1020 764 M820 840 H1100")];
  mon.forEach((m, i) => ink(m, t0 + 0.2 + i * 0.6, 1.3));
  const monG = [s];
  // site dentro da tela (componentes do protótipo da apresentação)
  const screen = box(el, { x: 396, y: 112, w: 1128, hgt: 636, cls: "v-screen" });
  const home = siteHome();
  const milho = siteMilho();
  milho.classList.add("v-page2");
  home.append(milho);
  screen.append(home);
  show(screen, t0 + 1.3, 81.6, { in: "fade", di: 0.6 });
  const head = home.querySelector(".s-head"), secs = [...home.querySelectorAll(".v-sview")[0].children];
  [head, ...secs].forEach((n, i) => { n.classList.add("a"); n.style.position = "relative"; show(n, t0 + 1.6 + i * 0.7, 81.6, { in: "up", di: 0.8, dist: 30 }); });
  // navegação: o cursor clica em "Milho" e a página troca
  const cur = box(el, { cls: "v-cursor" }, icon("cursor"));
  cur.style.left = "0"; cur.style.top = "0";
  show(cur, t0 + 6.4, t0 + 12.2, { in: "fade" });
  move(cur, t0 + 6.6, 1.3, { x: 1300, y: 600 }, { x: 830, y: 140 }, "power3.inOut");
  fn(t0 + 8.1, 0.25, (p) => cur.style.setProperty("--s", String(1 - 0.25 * Math.sin(p * Math.PI))));
  const navMilho = home.querySelector('[data-n="Milho"]'), navInicio = home.querySelector('[data-n="Início"]');
  fn(t0 + 8.2, 0.1, (p) => { navMilho.classList.toggle("is-on", p > 0.5); navInicio.classList.toggle("is-on", p <= 0.5); });
  fn(t0 + 8.3, 0.7, (p) => (milho.style.clipPath = `inset(0 0 ${100 - p * 100}% 0)`), "power3.inOut");
  milho.style.clipPath = "inset(0 0 100% 0)";
  fn(t0 + 9.6, 2.4, (p) => (milho.scrollTop = p * 260), "power2.inOut");
  // versão celular ao lado
  move(screen, t0 + 12, 1.4, { x: 0, s: 1 }, { x: -230, s: 0.78 }, "expo.inOut");
  move(s, t0 + 12, 1.4, { x: 0, s: 1 }, { x: -230, s: 0.78 }, "expo.inOut");
  s.style.transformOrigin = "960px 430px"; screen.style.transformOrigin = "564px 318px";
  const mob = box(el, { x: 1360, y: 110, w: 330, hgt: 680, cls: "v-mob" }, phoneShell(h("div", { class: "v-mobsite" }, statusBar(), siteHome(true))));
  show(mob, t0 + 12.6, 81.6, { in: "right" });
  kin(el, "Seu negócio disponível na internet,", { x: 0, y: 880, w: 1920, align: "center", size: 60, t0: t0 + 15, t1: 81.6 });
  kin(el, h("em", {}, "a qualquer momento."), { x: 0, y: 956, w: 1920, align: "center", size: 60, t0: t0 + 15.6, t1: 81.6 });
}

/* ============================== 06 · ATENDENTE ============================== */
{
  const { el, t0 } = scene("atendente");
  kick(el, "Passo 05 · Atendimento 24 horas", t0, 100.6, false, 120, 34);
  // chat (mesma interface da Assistente PrioSafra)
  const log = h("div", { class: "as__log" });
  const chat = box(el, { x: 150, y: 210, w: 560, hgt: 740, cls: "v-chat" },
    h("div", { class: "as" }, h("div", { class: "as__head" }, h("span", { class: "as__av" }, markPrio({ cls: "pmark" })), h("div", {}, h("b", {}, "Assistente PrioSafra"), h("span", { class: "as__on" }, h("i"), "Online agora"))), log,
      h("form", { class: "as__form" }, h("span", { class: "as__in" }), h("span", { class: "as__send" }, icon("send")))));
  show(chat, t0 + 0.4, 100.6, { in: "pop", di: 0.9 });
  const msgs = [["user", "Olá, gostaria de comprar sementes de milho.", 2.6], ["bot", "Olá! Em qual município fica sua propriedade?", 4.6], ["user", "Ulianópolis.", 6.4], ["bot", "Vou encaminhar você para nosso responsável comercial.", 8.2]];
  msgs.forEach(([w, t, at]) => {
    if (w === "bot") { const ty = h("div", { class: "a as__msg as__msg--bot as__typing v-typ" }, h("i"), h("i"), h("i")); log.append(ty); show(ty, t0 + at - 1, t0 + at, { in: "fade", out: "none", di: 0.2 }); }
    const m = h("div", { class: `a as__msg as__msg--${w} v-msg` }, h("p", {}, t));
    log.append(m);
    show(m, t0 + at, 100.6, { in: "up", di: 0.5, dist: 16 });
  });
  // resumo organizado
  const sum = box(el, { x: 800, y: 380, w: 380, cls: "card v-sum" }, h("p", { class: "v-sum__k" }, "Atendimento organizado"));
  show(sum, t0 + 9.4, 100.6, { in: "pop" });
  [["Produto", "Milho"], ["Município", "Ulianópolis"], ["Interesse", "Orçamento"]].forEach(([k, v], i) => {
    const row = h("div", { class: "a v-sum__r" }, h("span", {}, k), h("b", {}, v));
    row.style.position = "relative";
    sum.append(row);
    show(row, t0 + 10 + i * 0.5, 100.6, { in: "left", di: 0.6 });
  });
  // linha até o WhatsApp e mensagem chegando
  const s = svgLayer(el);
  ink(path(s, "M1180 520 C 1260 520 1260 400 1340 400", "ink ink--gold ink--dash"), t0 + 12, 1.2);
  const waLog = h("div", { class: "wa__log" });
  const wa = box(el, { x: 1340, y: 150, w: 400, hgt: 800, cls: "v-wa" }, phoneShell(h("div", { class: "wa" }, statusBar(), h("div", { class: "wa__head" }, icon("arrowL", "ic ic--xs"), h("span", { class: "wa__av" }, markPrio({ cls: "pmark" })), h("div", {}, h("b", {}, "PrioSafra · Comercial"), h("span", {}, "WhatsApp Business"))), waLog)));
  show(wa, t0 + 11.4, 100.6, { in: "right" });
  const msg = h("div", { class: "a wa__msg v-wamsg" }, h("p", {}, "Olá! Vim pelo site da PrioSafra.", h("br"), h("b", {}, "• Produto: Sementes de milho"), h("br"), h("b", {}, "• Município: Ulianópolis (PA)"), h("br"), h("b", {}, "• Interesse: Orçamento"), h("br"), "Gostaria de falar com o responsável comercial."), h("span", { class: "wa__t" }, "agora ✓✓"));
  msg.style.position = "relative";
  waLog.append(h("div", { class: "wa__day" }, "Hoje"), msg);
  show(msg, t0 + 13.4, 100.6, { in: "pop", di: 0.8 });
  const notif = box(el, { x: 1366, y: 190, w: 348, cls: "v-notif" }, icon("wa"), h("div", {}, h("b", {}, "Nova solicitação de atendimento"), h("span", {}, "Milho · Ulianópolis · Orçamento")));
  show(notif, t0 + 13.1, t0 + 15.6, { in: "down", out: "up" });
  // tipografia
  kin(el, ["24 HORAS · ", h("em", {}, "7 dias por semana")], { x: 150, y: 92, size: 66, t0: t0 + 14.4, t1: 100.6 });
  show(box(el, { x: 800, y: 760, w: 420, cls: "v-tag" }, "ATENDIMENTO INICIAL AUTOMATIZADO"), t0 + 15.4, 100.6, { in: "up" });
  show(box(el, { x: 800, y: 830, w: 420, cls: "note" }, "A assistente organiza e encaminha. A conversa comercial e a orientação técnica continuam com a equipe da PrioSafra."), t0 + 16, 100.6, { in: "up" });
}

cenasFinais({ scene, kick, phoneShell, siteHome });

// relógio único
window.STUDIO.play((t) => render(warp(t)), { loop: false });
