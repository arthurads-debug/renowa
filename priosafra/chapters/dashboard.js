// Capítulos 9 e 10 — Painel oficial da Renowa (demonstração navegável) e a atualização dos dados acontecendo.
// Todos os números daqui são DEMONSTRATIVOS (gerados por semente fixa), nunca resultados da PrioSafra.
// A lógica de demonstração fica aqui; as integrações reais vivem no painel da Renowa (/cliente) e não são chamadas.
import { h, icon, logoRenowa, markPrio, reveal, unreveal, reduced, sleep, num, brl, countTo } from "../lib.js";
import { DEMO, EMPRESA } from "../config.js";
import { lineChart, barList, drawIn, fmtShort } from "../charts.js";

const BLUE = "#4B44FF", ORANGE = "#FA4802", GREEN = "#3FB56E", GRAY = "#8C90A6";
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const days = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); });
function serie(n, base, vol, seed, trend = 0.004) { const r = rng(seed); return Array.from({ length: n }, (_, i) => Math.max(0, Math.round(base * (1 + trend * i) * (0.75 + r() * vol) * (i % 7 === 0 ? 0.8 : 1)))); }
const sum = (a) => a.reduce((s, v) => s + v, 0);

function dataFor(n) {
  const L = days(n);
  const spend = serie(n, 32, 0.5, 11, 0.002).map((v) => v + 0.37);
  const reachPaid = serie(n, 2100, 0.6, 21), reachOrg = serie(n, 640, 0.7, 22);
  const impr = reachPaid.map((v) => Math.round(v * 1.6));
  const clicks = serie(n, 46, 0.6, 31);
  const wa = serie(n, 3.2, 0.9, 41), quotes = serie(n, 1.1, 1.2, 42), forms = serie(n, 0.5, 1.4, 43), chats = serie(n, 2.4, 1, 44);
  const visits = serie(n, 120, 0.6, 51), visitors = visits.map((v) => Math.round(v * 0.74));
  const gSpend = serie(n, 14, 0.5, 61).map((v) => v + 0.2), gClicks = serie(n, 18, 0.6, 62), gImpr = gClicks.map((v) => v * 21);
  const yt = serie(n, 190, 0.7, 71);
  const fbReach = serie(n, 310, 0.7, 81), igReach = serie(n, 520, 0.7, 82), igInter = serie(n, 38, 0.8, 83), fbInter = serie(n, 14, 0.8, 84);
  const T = { spend: sum(spend), reach: sum(reachPaid), impr: sum(impr), clicks: sum(clicks), wa: sum(wa), quotes: sum(quotes), forms: sum(forms), chats: sum(chats), visits: sum(visits), visitors: sum(visitors), gSpend: sum(gSpend), gClicks: sum(gClicks), gImpr: sum(gImpr), yt: sum(yt), fbReach: sum(fbReach), igReach: sum(igReach), igInter: sum(igInter), fbInter: sum(fbInter), reachOrg: sum(reachOrg) };
  return { n, L, spend, reachPaid, reachOrg, impr, clicks, wa, quotes, forms, chats, visits, visitors, gSpend, gClicks, gImpr, yt, fbReach, igReach, igInter, fbInter, T };
}

const kpi = (label, value, sub = "", accent = false) => h("div", { class: `dk ${accent ? "dk--acc" : ""}` }, h("span", { class: "dk__l" }, label), h("b", { class: "dk__v" }, value), sub ? h("span", { class: "dk__s" }, sub) : null);
const panel = (title, ...kids) => h("section", { class: "dp" }, h("header", { class: "dp__h" }, h("h4", {}, title)), ...kids);
const table = (cols, rows) => h("table", { class: "dt" }, h("thead", {}, h("tr", {}, cols.map((c) => h("th", {}, c)))), h("tbody", {}, rows.map((r) => h("tr", {}, r.map((c) => h("td", {}, c))))));
const pct = (v, d = 1) => `${num(v * 100, d)}%`;

const TABS = [
  ["geral", "Visão geral", "grid"], ["meta", "Meta Ads", "fb"], ["fb", "Facebook orgânico", "fb"], ["ig", "Instagram orgânico", "insta"], ["google", "Google Ads", "google"],
  ["yt", "YouTube", "yt"], ["site", "Desempenho do site", "globe"], ["ops", "Contatos e oportunidades", "handshake"], ["rel", "Relatórios", "file"],
];

function view(tab, D) {
  const T = D.T;
  const cpm = (T.spend / T.impr) * 1000, cpc = T.spend / T.clicks, ctr = T.clicks / T.impr;
  switch (tab) {
    case "geral": return [
      h("div", { class: "dk-row" }, kpi("Investimento em anúncios", brl(T.spend + T.gSpend, 2), "Meta + Google"), kpi("Alcance total", fmtShort(T.reach + T.reachOrg), "pago + orgânico"), kpi("Cliques no WhatsApp", num(T.wa), "intenção de contato"), kpi("Solicitações de orçamento", num(T.quotes), "registradas no site e na assistente", true)),
      h("div", { class: "dg dg--2-1" },
        panel("Alcance por dia", lineChart({ labels: D.L, series: [{ name: "Pago", color: BLUE, values: D.reachPaid }, { name: "Orgânico", color: ORANGE, values: D.reachOrg }] })),
        panel("Caminho até a oportunidade", h("ol", { class: "dfun" }, [["Impressões", T.impr + T.gImpr], ["Cliques", T.clicks + T.gClicks], ["Visitas ao site", T.visits], ["Conversas iniciadas", T.chats + T.wa], ["Solicitações de orçamento", T.quotes]].map(([l, v], i, a) => h("li", { style: { "--w": `${Math.max(18, 100 - i * 19)}%` } }, h("span", {}, l), h("b", {}, fmtShort(v)), i ? h("small", {}, pct(v / a[i - 1][1], 1)) : null))), h("p", { class: "dnote" }, "Clique no WhatsApp é intenção de contato, não venda."))),
      panel("Campanhas ativas", table(["Campanha", "Objetivo", "Investimento", "Resultados", "Custo por resultado"], DEMO.campanhas.map((c) => { const s = T.spend * c.peso, r = Math.max(1, Math.round((c.objetivo === "Alcance" ? T.reach : c.objetivo === "Engajamento" ? T.igInter * 3 : T.wa + T.chats) * c.peso)); return [c.nome, c.objetivo, brl(s, 2), c.objetivo === "Alcance" ? `${fmtShort(r)} pessoas` : num(r), c.objetivo === "Alcance" ? `${brl((s / r) * 1000, 2)} / mil` : brl(s / r, 2)]; })))];
    case "meta": return [
      h("div", { class: "dk-row dk-row--5" }, kpi("Investimento", brl(T.spend, 2)), kpi("Alcance", fmtShort(T.reach)), kpi("Impressões", fmtShort(T.impr)), kpi("Cliques", num(T.clicks)), kpi("CTR", pct(ctr, 2))),
      h("div", { class: "dk-row dk-row--4" }, kpi("CPM", brl(cpm, 2)), kpi("CPC", brl(cpc, 2)), kpi("Conversas iniciadas", num(T.wa + T.chats)), kpi("Custo por conversa", brl(T.spend / (T.wa + T.chats), 2), "", true)),
      h("div", { class: "dg dg--2-1" },
        panel("Investimento por dia", lineChart({ labels: D.L, series: [{ name: "Investimento", color: BLUE, values: D.spend }], fmt: (v) => brl(v, 2) })),
        panel("Desempenho por criativo", barList(DEMO.criativos.map((c, i) => [c, Math.round(T.clicks * [0.36, 0.27, 0.21, 0.16][i])]), { color: BLUE, fmt: (v) => `${num(v)} cliques` })))];
    case "fb": return [
      h("div", { class: "dk-row" }, kpi("Alcance orgânico", fmtShort(T.fbReach)), kpi("Visualizações", fmtShort(T.fbReach * 1.4)), kpi("Interações", num(T.fbInter)), kpi("Novos seguidores", `+${num(Math.round(T.fbInter / 9))}`, "", true)),
      panel("Alcance orgânico por dia", lineChart({ labels: D.L, series: [{ name: "Facebook", color: BLUE, values: D.fbReach }] })),
      panel("Publicações com maior alcance", barList([["Visita ao campo · vídeo", 0.31], ["Planejamento da safra · arte", 0.24], ["Marcas representadas · carrossel", 0.2], ["Dia da Agricultura · arte", 0.14]].map(([l, p]) => [l, Math.round(T.fbReach * p)]), { color: BLUE }))];
    case "ig": return [
      h("div", { class: "dk-row" }, kpi("Alcance orgânico", fmtShort(T.igReach)), kpi("Visualizações", fmtShort(T.igReach * 1.9)), kpi("Interações", num(T.igInter)), kpi("Crescimento do perfil", `+${num(Math.round(T.igInter / 6))}`, "seguidores no período", true)),
      h("div", { class: "dg dg--2-1" },
        panel("Alcance e interações", lineChart({ labels: D.L, series: [{ name: "Alcance", color: ORANGE, values: D.igReach }, { name: "Interações ×10", color: BLUE, values: D.igInter.map((v) => v * 10) }] })),
        panel("Desempenho de reels", barList([["Reel · Visita ao campo", 0.34], ["Reel · Pastagens", 0.26], ["Reel · Bastidores", 0.22], ["Reel · Próxima safra", 0.18]].map(([l, p]) => [l, Math.round(T.igReach * p * 1.6)]), { color: ORANGE, fmt: (v) => `${fmtShort(v)} views` })))];
    case "google": return [
      h("div", { class: "dk-row dk-row--5" }, kpi("Investimento", brl(T.gSpend, 2)), kpi("Impressões", fmtShort(T.gImpr)), kpi("Cliques", num(T.gClicks)), kpi("CTR", pct(T.gClicks / T.gImpr, 2)), kpi("CPC", brl(T.gSpend / T.gClicks, 2), "", true)),
      h("div", { class: "dg dg--2-1" },
        panel("Cliques por dia", lineChart({ labels: D.L, series: [{ name: "Cliques", color: BLUE, values: D.gClicks }] })),
        panel("Termos de pesquisa", table(["Termo", "Cliques"], [["semente de milho paragominas", 0.29], ["semente de capim pará", 0.23], ["semente de sorgo", 0.18], ["priosafra", 0.16], ["sementes pastagem", 0.14]].map(([t, p]) => [t, num(Math.round(T.gClicks * p))])), h("p", { class: "dnote" }, "Termos ilustrativos."))),
      h("p", { class: "dnote" }, "Conversões aparecem quando o acompanhamento de conversões estiver configurado e confirmado.")];
    case "yt": return [
      h("div", { class: "dk-row" }, kpi("Visualizações", fmtShort(T.yt)), kpi("Tempo assistido", `${num(Math.round(T.yt * 0.9 / 60))} h`), kpi("Inscritos ganhos", `+${num(Math.round(T.yt / 140))}`), kpi("Vídeos publicados", num(Math.round(D.n / 5)), "", true)),
      panel("Visualizações por dia", lineChart({ labels: D.L, series: [{ name: "YouTube", color: ORANGE, values: D.yt }] }))];
    case "site": return [
      h("div", { class: "dk-row dk-row--5" }, kpi("Visitas", num(T.visits)), kpi("Visitantes", num(T.visitors)), kpi("Cliques no WhatsApp", num(T.wa)), kpi("Formulários enviados", num(T.forms)), kpi("Conversas com a assistente", num(T.chats), "", true)),
      h("div", { class: "dg dg--3" },
        panel("Origem do tráfego", barList(DEMO.origens.map(([l, p]) => [l, Math.round(T.visits * p)]), { color: BLUE })),
        panel("Páginas mais visitadas", barList(DEMO.paginas.map(([l, p]) => [l, Math.round(T.visits * p)]), { color: ORANGE })),
        panel("Produtos mais consultados", barList([["Sementes de milho", 0.44], ["Sementes de pastagens", 0.33], ["Sementes de sorgo", 0.23]].map(([l, p]) => [l, Math.round(T.visits * 0.37 * p)]), { color: GREEN })))];
    case "ops": {
      const cities = [["Paragominas", 0.38], ["Ulianópolis", 0.21], ["Dom Eliseu", 0.17], ["Tomé-Açu", 0.13], ["Ipixuna do Pará", 0.11]];
      return [
        h("div", { class: "dk-row" }, kpi("Solicitações de atendimento", num(T.wa + T.forms)), kpi("Solicitações de orçamento", num(T.quotes), "", true), kpi("Pela assistente", num(Math.round(T.quotes * 0.46))), kpi("Pelo formulário", num(T.forms))),
        h("div", { class: "dg dg--3" },
          panel("Origem das oportunidades", barList([["Anúncios Meta", 0.42], ["Instagram orgânico", 0.27], ["Google", 0.18], ["Site direto", 0.13]].map(([l, p]) => [l, Math.round((T.quotes + T.forms) * p) || 1]), { color: BLUE })),
          panel("Cidades de interesse", barList(cities.map(([l, p]) => [l, Math.round((T.wa + T.forms) * p) || 1]), { color: ORANGE })),
          panel("Categorias mais procuradas", barList([["Milho", 0.45], ["Pastagens", 0.35], ["Sorgo", 0.2]].map(([l, p]) => [l, Math.round((T.wa + T.forms) * p) || 1]), { color: GREEN }))),
        h("p", { class: "dnote" }, "Vendas e receita só aparecem quando houver integração e confirmação comercial. Um clique no WhatsApp não é tratado como venda nem como lead qualificado.")];
    }
    case "rel": return [
      panel("Relatórios", h("ul", { class: "drep" }, ["Relatório mensal · visão geral", "Relatório de anúncios · Meta e Google", "Relatório de conteúdo · Instagram, Facebook e YouTube", "Relatório do site e das oportunidades"].map((t, i) => h("li", {}, icon("file"), h("div", {}, h("b", {}, t), h("span", {}, `Período selecionado · ${D.n} dias`)), h("button", { type: "button", class: "dbtn", onclick: (e) => { e.currentTarget.textContent = "Disponível no painel real"; } }, "Baixar PDF"))))),
      h("p", { class: "dnote" }, "No painel real, o relatório sai em PDF com o nome “Relatório Renowa (data)”, com os números das contas conectadas.")];
  }
  return [];
}

function dashboardApp({ compact = false } = {}) {
  let tab = "geral", per = "30";
  const content = h("div", { class: "db__content" });
  const upd = h("span", { class: "db__upd" });
  const nav = h("nav", { class: "db__nav" }, TABS.map(([id, t, i]) => h("button", { type: "button", "data-t": id, "aria-current": String(id === tab), onclick: () => { tab = id; render(); } }, icon(i), h("span", {}, t))));
  const perSeg = h("div", { class: "db__per" }, Object.keys(DEMO.periodos).map((p) => h("button", { type: "button", "aria-pressed": String(p === per), onclick: () => { per = p; render(); } }, `${p} dias`)));
  const now = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  function render(loading = true) {
    nav.querySelectorAll("button").forEach((b) => b.setAttribute("aria-current", String(b.dataset.t === tab)));
    perSeg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.textContent.startsWith(per))));
    const title = TABS.find((t) => t[0] === tab)[1];
    if (loading && !reduced()) {
      content.replaceChildren(h("div", { class: "db__title" }, h("h3", {}, title)), h("div", { class: "db__skel" }, h("i"), h("i"), h("i"), h("i"), h("span"), h("span")));
      clearTimeout(render._t);
      render._t = setTimeout(() => render(false), 380);
      return;
    }
    const D = dataFor(+per);
    content.replaceChildren(h("div", { class: "db__title" }, h("h3", {}, title), h("span", { class: "db__range" }, `${D.L[0]} a ${D.L[D.L.length - 1]}`)), ...view(tab, D));
    upd.replaceChildren(h("i"), `Última sincronização: hoje, ${now()}`);
    drawIn(content);
    if (window.gsap && !reduced()) gsap.fromTo(content.querySelectorAll(".dk, .dp"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, ease: "power3.out" });
  }
  const el = h("div", { class: `db ${compact ? "db--compact" : ""}`, "data-noswipe": "" },
    h("aside", { class: "db__side" }, logoRenowa({ tone: "light", cls: "rlogo db__logo" }),
      h("div", { class: "db__acc" }, h("span", { class: "db__accav" }, markPrio({ cls: "pmark", dark: "#E9F2EC", light: "#3FB56E" })), h("div", {}, h("b", {}, EMPRESA.nome), h("span", {}, "Área do cliente"))),
      nav),
    h("div", { class: "db__main" },
      h("div", { class: "db__top" }, h("div", { class: "db__demo" }, icon("info", "ic ic--xs"), DEMO.aviso), h("div", { class: "db__topr" }, upd, perSeg, h("button", { class: "db__ref", type: "button", "aria-label": "Atualizar", onclick: () => render() }, icon("refresh")))),
      content));
  render(false);
  return { el, setTab: (t) => { tab = t; render(); } };
}

export const dashboard = {
  id: "dashboard", title: "Dashboard oficial da Renowa", theme: "renowa", duration: 26,
  build() {
    const app = dashboardApp();
    this._app = app;
    const intro = h("div", { class: "dbx" },
      h("div", { class: "dbx__site" }, h("div", { class: "dbx__bar" }, h("i"), h("i"), h("i"), h("span", {}, "priosafra.com.br")), h("div", { class: "dbx__hero" }, markPrio({ cls: "pmark" }), h("b", {}, "PrioSafra"))),
      h("div", { class: "dbx__r" }, logoRenowa({ tone: "light", cls: "rlogo dbx__logo" }), h("p", { class: "dbx__t" }, "Entrando na área do cliente"), h("p", { class: "dbx__acc" }, h("i"), EMPRESA.nome), h("span", { class: "dbx__prog" }, h("i"))));
    this._intro = intro;
    return h("div", { class: "ch__in dbc" },
      h("div", { class: "dbc__head" },
        h("div", {},
          h("p", { class: "kicker dbc__k", "data-in": "" }, h("span", { class: "kicker__n" }, "09"), "Dashboard oficial da Renowa"),
          h("h2", { class: "display display--sm", "data-in": "" }, "Seus resultados em um só lugar, ", h("em", { class: "dbc__em" }, "dentro da área de clientes da Renowa."))),
        h("p", { class: "dbc__url", "data-in": "" }, icon("lock", "ic ic--xs"), "renowa · área do cliente")),
      h("div", { class: "dbc__body", "data-in": "" }, app.el, intro));
  },
  async enter(el) {
    reveal(el);
    const intro = this._intro;
    intro.classList.remove("is-done");
    if (reduced() || !window.gsap) { intro.classList.add("is-done"); return; }
    const tl = gsap.timeline();
    tl.set(intro, { opacity: 1 })
      .fromTo(intro.querySelector(".dbx__site"), { scale: 1, opacity: 1 }, { scale: 0.55, opacity: 0, duration: 1, ease: "expo.in", delay: 0.4 })
      .fromTo(intro.querySelector(".dbx__r"), { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }, "-=.2")
      .fromTo(intro.querySelector(".dbx__prog i"), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power2.inOut" })
      .to(intro, { opacity: 0, duration: 0.6, ease: "power2.out", onComplete: () => intro.classList.add("is-done") });
    await tl.then();
    drawIn(this._app.el);
  },
  leave(el) { unreveal(el); },
};

/* ---------------------- 10 · Atualização acontecendo ---------------------- */
const FONTES = [
  ["fb", "Meta Marketing API", "Anúncios do Facebook e Instagram · atualização periódica dentro dos limites da Meta"],
  ["insta", "Instagram Insights", "Alcance e interações conforme as permissões concedidas; algumas métricas chegam com atraso"],
  ["google", "Google Ads API", "Investimento, cliques e conversões · dados do dia chegam com algumas horas de atraso"],
  ["chart", "Google Analytics 4", "Visitas e origens do site · relatórios completos podem levar até 48 h"],
  ["yt", "YouTube Analytics API", "Visualizações e inscritos, quando houver canal · costuma ter 1 a 2 dias de atraso"],
  ["cursor", "Eventos próprios do site", "Cliques no WhatsApp, formulários e conversas com a assistente · registro na hora"],
  ["db", "Banco de dados Renowa", "Organiza, guarda o histórico e mostra a última sincronização real de cada fonte"],
];
const EVENTOS = [
  { i: "eye", t: "Um visitante acessa o site", d: "Origem: anúncio no Instagram · Paragominas", k: "visits" },
  { i: "corn", t: "O visitante consulta sementes de milho", d: "Página: Sementes de milho", k: "views" },
  { i: "bot", t: "Inicia uma conversa com a assistente", d: "Interesse identificado: milho · Ulianópolis", k: "chats" },
  { i: "wa", t: "Solicita atendimento via WhatsApp", d: "Pedido de orçamento organizado e encaminhado", k: "wa" },
  { i: "db", t: "O painel registra os eventos", d: "Contato e oportunidade adicionados à área do cliente", k: "ops" },
  { i: "file", t: "O relatório de desempenho é atualizado", d: "Campanha “Orçamento · WhatsApp” com nova conversa", k: "rep" },
];

export const atualizacao = {
  id: "atualizacao", title: "Os dados sendo atualizados", theme: "renowa", duration: 30,
  build() {
    const base = { visits: 1284, views: 412, chats: 37, wa: 58, ops: 21 };
    this._base = base;
    const counters = h("div", { class: "lv__kpis" }, [["visits", "Visitas no site"], ["views", "Consultas a produtos"], ["chats", "Conversas com a assistente"], ["wa", "Cliques no WhatsApp"], ["ops", "Oportunidades registradas"]].map(([k, l]) => h("div", { class: "lv__k", "data-k": k }, h("span", {}, l), h("b", {}, num(base[k])), h("em", {}, "+1"))));
    const pts = serieLive();
    this._pts = pts;
    const chartBox = h("div", { class: "lv__chart" });
    const feed = h("ol", { class: "lv__feed", "aria-live": "polite" }, h("li", { class: "lv__empty" }, "Aguardando eventos…"));
    const steps = h("ol", { class: "lv__steps" }, EVENTOS.map((e, i) => h("li", {}, h("span", { class: "lv__sn" }, String(i + 1)), h("span", {}, e.t))));
    const camp = h("div", { class: "lv__camp" }, h("span", { class: "lv__ck" }, "Campanha"), h("b", {}, "Orçamento · WhatsApp"), h("div", { class: "lv__cr" }, h("span", {}, "Conversas ", h("strong", { class: "lv__cv" }, "14")), h("span", {}, "Custo por conversa ", h("strong", { class: "lv__cc" }, brl(18.4, 2)))));
    const btn = h("button", { class: "btn lv__btn", type: "button", onclick: () => this.run() }, icon("play"), "Iniciar demonstração de atualização");
    Object.assign(this, { counters, chartBox, feed, steps, camp, btn });
    this.drawChart();
    return h("div", { class: "ch__in lv" },
      h("div", { class: "lv__text" },
        h("p", { class: "kicker dbc__k", "data-in": "" }, h("span", { class: "kicker__n" }, "10"), "Os dados sendo atualizados"),
        h("h2", { class: "display display--sm", "data-in": "" }, "Você não precisa esperar o final do mês ", h("em", { class: "dbc__em" }, "para entender o desempenho do seu investimento.")),
        h("p", { class: "lead", "data-in": "" }, "Acompanhe os indicadores da sua operação digital em uma plataforma centralizada, com transparência e organização."),
        h("div", { "data-in": "" }, btn),
        h("div", { "data-in": "" }, steps)),
      h("div", { class: "lv__board", "data-in": "", "data-noswipe": "" },
        h("div", { class: "lv__bar" }, logoRenowa({ tone: "light", cls: "rlogo lv__logo" }), h("span", { class: "lv__acc" }, "PrioSafra Agronegócio"), h("span", { class: "lv__live" }, h("i"), "Ao vivo"), h("span", { class: "lv__demo" }, icon("info", "ic ic--xs"), "Números demonstrativos")),
        counters,
        h("div", { class: "lv__grid" }, h("div", { class: "lv__panel" }, h("h4", {}, "Visitas no site · hoje"), chartBox), h("div", { class: "lv__panel" }, h("h4", {}, "Eventos"), feed)),
        camp),
      h("div", { class: "lv__arch", "data-in": "" },
        h("p", { class: "lv__ak" }, "De onde vêm os dados no painel real"),
        h("ul", {}, FONTES.map(([i, t, d]) => h("li", {}, icon(i), h("div", {}, h("b", {}, t), h("span", {}, d))))),
        h("p", { class: "lv__af" }, "As integrações respeitam permissões, limites de cada API e o intervalo de atualização de cada plataforma. O painel mostra a última sincronização real e eventuais atrasos.")));
  },
  drawChart() { this.chartBox.replaceChildren(lineChart({ labels: this._pts.map((p) => p[0]), series: [{ name: "Visitas", color: "#4B44FF", values: this._pts.map((p) => p[1]) }], height: 170 })); },
  async run() {
    if (this._running) return;
    this._running = true;
    this.btn.disabled = true;
    this.feed.replaceChildren();
    const lis = this.steps.querySelectorAll("li");
    lis.forEach((l) => l.classList.remove("is-on", "is-done"));
    for (let i = 0; i < EVENTOS.length; i++) {
      if (!this._el?.classList.contains("is-active")) break;
      const e = EVENTOS[i];
      lis.forEach((l, j) => { l.classList.toggle("is-on", j === i); l.classList.toggle("is-done", j < i); });
      const t = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const li = h("li", { class: "lv__ev" }, h("span", { class: "lv__evi" }, icon(e.i)), h("div", {}, h("b", {}, e.t), h("span", {}, e.d)), h("time", {}, t));
      this.feed.prepend(li);
      if (window.gsap && !reduced()) gsap.fromTo(li, { opacity: 0, x: 20, backgroundColor: "rgba(250,72,2,.25)" }, { opacity: 1, x: 0, backgroundColor: "rgba(255,255,255,0)", duration: 1.2, ease: "expo.out" });
      const card = this.counters.querySelector(`[data-k="${e.k}"]`);
      if (card) {
        const b = card.querySelector("b");
        const from = this._base[e.k];
        this._base[e.k] += 1;
        countTo(b, this._base[e.k], { from, dur: 0.8 });
        card.classList.remove("is-bump"); void card.offsetWidth; card.classList.add("is-bump");
      }
      if (e.k === "visits") { const last = this._pts[this._pts.length - 1]; this._pts.push([nextHour(last[0]), last[1] + 9]); this._pts.shift(); this.drawChart(); drawIn(this.chartBox); }
      if (e.k === "rep") {
        const cv = this.camp.querySelector(".lv__cv"), cc = this.camp.querySelector(".lv__cc");
        countTo(cv, 15, { from: 14, dur: 0.8 });
        countTo(cc, 17.2, { from: 18.4, dur: 1, fmt: (v) => brl(v, 2) });
        this.camp.classList.remove("is-bump"); void this.camp.offsetWidth; this.camp.classList.add("is-bump");
      }
      await sleep(reduced() ? 300 : 1700);
    }
    lis.forEach((l) => { l.classList.remove("is-on"); l.classList.add("is-done"); });
    this.btn.disabled = false;
    this.btn.lastChild.textContent = "Repetir demonstração";
    this._running = false;
  },
  enter(el) { this._el = el; reveal(el); drawIn(this.chartBox); },
  leave(el) { unreveal(el); },
};
function serieLive() { const r = rng(99); const out = []; for (let hr = 6; hr <= 15; hr++) out.push([`${String(hr).padStart(2, "0")}h`, Math.round(40 + hr * 6 + r() * 30)]); return out; }
function nextHour(l) { const n = (parseInt(l, 10) + 1) % 24; return `${String(n).padStart(2, "0")}h`; }
