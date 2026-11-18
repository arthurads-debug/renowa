// RESUMO — a página que o dono da empresa abre: uma frase, poucos números, o que vem por aí.
import { h, icon, int, money, pct, safeDiv, today, fmtMonth, cap, daysBetween } from "../util.js";
import { context, kpisFor, narrative, PROFILE_TEXT } from "../model.js";
import { card, kpiGrid, statusChip, loadingState, dayLabel, postThumb, accountsStrip } from "../components.js";
import { funnelCard } from "../funnel3d.js";
import { mixFor } from "../mix.js";
import { renderChart, observe } from "../charts.js";
import { fmtDay, fmtDayLong, dec } from "../util.js";

const PAID = "#1E12EA", ORG = "#FA4802";
const ui = { mix: "acc" };

export function renderOverview(view, state, helpers) {
  if (!state.metrics) { view.replaceChildren(loadingState()); return; }
  const c = state.client;
  const ctx = context(state, "all");
  const days = daysBetween(state.from, state.to);
  const kpis = kpisFor(ctx);

  // ---------- Herói: a frase do período ----------
  const hero = h("section", { class: "hero-card" },
    h("p", { class: "mono hero-card__kicker" }, PROFILE_TEXT[c.profile].lead),
    heroText(narrative(ctx, days)));
  const reach = ctx.reach?.current?.reach;
  if (c.profile === "awareness" && c.city?.population && reach) {
    const share = Math.min(1, reach / c.city.population);
    hero.append(h("div", { class: "hero-call" },
      h("strong", {}, share >= 1 ? "100%+" : pct(share, 0)),
      h("span", {}, "da população de ", h("b", {}, c.city.name), " alcançada pelos anúncios", h("small", {}, `${int(reach)} pessoas diferentes de ${int(c.city.population)} habitantes`))));
    hero.append(h("div", { class: "pop" },
      h("div", { class: "pop__bar", role: "img", "aria-label": `${pct(share, 0)} da população alcançada` }, h("span", { style: { width: `${share * 100}%` } })),
      h("p", { class: "pop__legend" }, "Estimativa: a Meta conta todas as pessoas na região segmentada, inclusive visitantes e moradores de cidades vizinhas.")));
  }

  // ---------- Coluna de conteúdo ----------
  const cal = state.content?.calendar || [];
  const t = today();
  const upcoming = cal.filter((p) => p.date >= t && p.status !== "publicado").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const waiting = cal.filter((p) => p.status === "aprovacao" && p.date >= t).length;

  const nextCard = c.has.calendar ? card({
    title: "Próximas publicações",
    sub: waiting ? `${waiting} ${waiting === 1 ? "post aguarda" : "posts aguardam"} sua aprovação` : "Tudo em dia por aqui",
    tools: h("a", { class: "link", href: "#calendario" }, "Ver calendário"),
  }, upcoming.length
    ? h("ul", { class: "agenda" }, upcoming.map((p) => h("li", { class: "agenda__item" },
        h("span", { class: "agenda__date" }, dayLabel(p.date)),
        h("span", { class: "agenda__title" }, p.title, h("small", {}, `${p.format} · ${p.network}`)),
        statusChip(p.status, true))))
    : h("p", { class: "muted" }, state.content ? "Nenhuma publicação programada." : "Carregando calendário…")) : null;

  // ---------- Comentário + relatório ----------
  const report = state.content?.reports?.[0];
  const noteCard = (c.note || report) ? h("section", { class: "note-card" },
    c.note ? [h("p", { class: "mono note-card__label" }, "Recado da agência"), h("p", { class: "note-card__text" }, c.note)] : null,
    report ? h("div", { class: "note-card__report" },
      h("p", { class: "mono note-card__label" }, `Relatório de ${fmtMonth(report.month)}`),
      h("p", {}, report.summary),
      report.next.length ? h("p", { class: "note-card__next" }, h("strong", {}, "Próximos passos: "), report.next.join(" · ")) : null,
      h("a", { class: "link link--light", href: "#historico" }, "Ver relatórios anteriores")) : null) : null;

  // ---------- Registro de vendas (perfil loja física) ----------
  let salesCta = null;
  if (c.profile === "leads") {
    const last = (state.content?.sales || []).map((x) => x.date).sort().pop();
    const stale = !last || daysBetween(last, t) > 8;
    salesCta = h("section", { class: `cta-card${stale ? " is-warn" : ""}` },
      icon("plus", "ico ico--lg"),
      h("div", {},
        h("strong", {}, stale ? "Registre as vendas desta semana" : "Vendas da semana registradas"),
        h("p", {}, "Quem compra pelo WhatsApp ou na loja não aparece nas plataformas. Ao informar as vendas (quantidade e valor), o painel calcula o retorno real dos anúncios.")),
      c.salesFormUrl ? h("a", {
        class: "btn btn--primary btn--sm", href: c.salesFormUrl, target: "_blank", rel: "noopener",
        onclick: (e) => { if (c.salesFormUrl === "#demo") { e.preventDefault(); helpers.toast("No painel real, este botão abre o formulário de vendas da sua empresa."); } },
      }, "Registrar vendas") : null);
  }

  // ---------- Funil 3D (mantido entre as atualizações ao vivo se os números não mudarem) ----------
  const stages = funnelStages(state, ctx);
  const fkey = stages.map((s) => Math.round(s.value)).join("|");
  if (view._funnelKey !== fkey || !view._funnel) { view._funnelKey = fkey; view._funnel = funnelCard(stages); }

  const mix = mixFor(state);
  const mixCard = mixSection(mix, state);
  const channels = channelsSection(state, ctx);
  const adsOn = c.platforms.google || c.platforms.meta;

  view.replaceChildren(...[
    accountsStrip(c),
    hero,
    mixCard,
    channels,
    adsOn ? h("h2", { class: "sec-title" }, h("span", { class: "dot dot--paid" }), "Anúncios em detalhe") : null,
    adsOn ? kpiGrid(kpis, { partial: false }) : null,
    adsOn ? view._funnel : null,
    salesCta,
    h("div", { class: "grid-2" }, [nextCard, noteCard].filter(Boolean)),
    h("p", { class: "fineprint" }, footnote(c), " Pago x orgânico: visualizações pagas são impressões dos anúncios e views do YouTube vindas de anúncios; orgânicas são o alcance dos posts do Instagram e do Facebook e as demais views do YouTube."),
  ].filter(Boolean));
  if (mixCard?._draw) { mixCard._draw(); observe(mixCard._chart); }
  requestAnimationFrame(() => view.querySelectorAll(".mix__bar span, .mix__cmp i").forEach((el) => el.classList.add("is-in")));
}

/* ---------- Funil: do anúncio ao aumento de base ----------
   Etapas em ordem lógica; uma etapa só entra se for menor que a anterior (para ser um funil de verdade).
   A última é o crescimento total da base (Instagram + Facebook + YouTube), pago e orgânico. */
function funnelStages(state, ctx) {
  const c = state.client, cur = ctx.cur;
  const cand = [
    { label: "Impressões", value: cur.impressions },
    { label: "Pessoas alcançadas", value: ctx.reach?.current?.reach || 0 },
    { label: "Visualizações de vídeo", value: cur.videoViews },
    { label: "Interações com os anúncios", value: cur.engagement },
    { label: "Cliques", value: cur.clicks },
    c.resultLabel && !/intera/i.test(c.resultLabel) ? { label: c.resultLabel, value: cur.results } : null,
    ctx.sales?.cur?.count ? { label: "Vendas informadas", value: ctx.sales.cur.count } : null,
  ].filter((x) => x && x.value > 0);
  // do maior para o menor: cada etapa é um pedaço da anterior (impressões no topo)
  const out = [];
  for (const st of cand.sort((a, b) => b.value - a.value)) if (!out.length || st.value < out[out.length - 1].value) out.push(st);
  const base = baseGrowth(state);
  if (base.total > 0) out.push({ label: "Aumento da base", value: base.total, note: `novos seguidores e inscritos · pago + orgânico · ${base.parts.join(" · ")}` });
  return out;
}

export function baseGrowth(state) {
  const s = state.social || {}, y = state.youtube;
  const parts = [];
  let total = 0;
  const add = (label, v) => { if (v > 0) { total += v; parts.push(`${label} +${int(v)}`); } };
  add("Instagram", s.instagram?.gained?.value || 0);
  add("Facebook", s.facebook?.gained?.value || 0);
  if (y?.connected && y.current) add("YouTube", y.current.gained - y.current.lost);
  return { total, parts };
}

/* ---------- Pago x orgânico ---------- */
function mixSection(mix, state) {
  const total = mix.paid.views + mix.organic.views;
  if (!total) return null;
  const sp = mix.paid.views / total;
  const big = (cls, label, v, sub) => h("div", { class: `mix__big mix__big--${cls}` }, h("p", { class: "mix__lbl" }, h("span", { class: `dot dot--${cls}` }), label), h("p", { class: "mix__num" }, int(v)), h("p", { class: "mix__sub" }, sub));
  const cmp = (label, a, b, fmt = int) => {
    const m = Math.max(1, a, b);
    return h("li", {}, h("span", { class: "mix__cmp-l" }, label),
      h("div", { class: "mix__cmp" }, h("i", { class: "is-paid", style: { "--w": `${(a / m) * 100}%` } }), h("b", {}, fmt(a))),
      h("div", { class: "mix__cmp" }, h("i", { class: "is-org", style: { "--w": `${(b / m) * 100}%` } }), h("b", {}, fmt(b))));
  };
  const chart = h("div", { class: "chart" });
  const draw = () => {
    let acc = [0, 0];
    const paid = ui.mix === "day" ? mix.series.map((d) => d.paid) : mix.series.map((d) => (acc[0] += d.paid));
    const org = ui.mix === "day" ? mix.series.map((d) => d.organic) : mix.series.map((d) => (acc[1] += d.organic));
    renderChart(chart, { type: ui.mix === "day" ? "bars" : "lines", labels: mix.dates, height: 240,
      series: [{ label: "Pago", color: PAID, values: paid }, { label: "Orgânico", color: ORG, values: org }],
      fmt: (v) => int(v), fmtAxis: (v) => int(v, true), fmtDate: fmtDay, fmtDateLong: fmtDayLong,
      ariaLabel: ui.mix === "day" ? "Visualizações pagas e orgânicas por dia" : "Visualizações acumuladas no período" });
  };
  const seg = h("div", { class: "seg", role: "radiogroup", "aria-label": "Gráfico" }, [["acc", "Crescimento acumulado"], ["day", "Por dia"]].map(([v, l]) =>
    h("button", { role: "radio", "aria-checked": String(ui.mix === v), onclick: (e) => { ui.mix = v; e.currentTarget.parentElement.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b === e.currentTarget))); draw(); } }, l)));
  const growth = mix.prevPaid ? (mix.paid.views - mix.prevPaid) / mix.prevPaid : null;
  const box = card({ title: "Pago e orgânico", sub: "Quantas vezes as pessoas viram sua marca — pelos anúncios e pelo conteúdo publicado", cls: "mix" },
    h("div", { class: "mix__top" },
      big("paid", "Pelos anúncios", mix.paid.views, `${pct(sp, 0)} do total${growth != null ? (Math.abs(growth) < 0.005 ? " · estável vs. período anterior" : ` · ${growth > 0 ? "+" : ""}${dec(growth * 100, 0)}% vs. período anterior`) : ""}`),
      big("org", "Pelo conteúdo orgânico", mix.organic.views, `${pct(1 - sp, 0)} do total · sem custo de mídia`),
      h("div", { class: "mix__total" }, h("p", {}, "Total no período"), h("strong", {}, int(total, true)), h("small", {}, "visualizações"))),
    h("div", { class: "mix__bar", role: "img", "aria-label": `${pct(sp, 0)} pago, ${pct(1 - sp, 0)} orgânico` }, h("span", { class: "is-paid", style: { "--w": `${sp * 100}%` } }), h("span", { class: "is-org", style: { "--w": `${(1 - sp) * 100}%` } })),
    h("div", { class: "mix__grid" },
      h("ul", { class: "mix__rows" },
        h("li", { class: "mix__head" }, h("span"), h("span", {}, h("span", { class: "dot dot--paid" }), "Pago"), h("span", {}, h("span", { class: "dot dot--org" }), "Orgânico")),
        cmp("Visualizações", mix.paid.views, mix.organic.views, (v) => int(v, true)),
        cmp("Interações", mix.paid.interactions, mix.organic.interactions, (v) => int(v, true)),
        mix.paid.clicks ? h("li", { class: "mix__note" }, `${int(mix.paid.clicks)} cliques nos anúncios · ${money(mix.paid.spend)} investidos`) : null),
      h("div", { class: "mix__chart" }, h("div", { class: "mix__charthead" }, seg), chart)));
  box._draw = draw; box._chart = chart;
  return box;
}

/* ---------- Seus canais (um cartão por canal conectado) ---------- */
function channelsSection(state, ctx) {
  const c = state.client;
  const rows = state.metrics?.rows || [];
  const s = state.social || {};
  const y = state.youtube;
  const cards = [];
  const tile = (net, name, sub, nums, href, kind) => h("a", { class: `chan chan--${net}`, href },
    h("header", {}, h("span", { class: `chan__ico chan__ico--${net}`, "aria-hidden": "true" }), h("div", {}, h("strong", {}, name), h("small", {}, sub)), h("span", { class: `chan__kind chan__kind--${kind}` }, kind === "paid" ? "Pago" : kind === "mix" ? "Pago + orgânico" : "Orgânico")),
    h("dl", {}, nums.map(([k, v]) => h("div", {}, h("dt", {}, k), h("dd", {}, v)))),
    h("span", { class: "chan__more" }, "Ver detalhes →"));
  const tot = (p) => rows.filter((r) => r.platform === p).reduce((t, r) => ({ spend: t.spend + r.spend, imp: t.imp + r.impressions, clicks: t.clicks + r.clicks, res: t.res + r.results }), { spend: 0, imp: 0, clicks: 0, res: 0 });
  if (c.platforms.google) { const t = tot("google"); cards.push(tile("google", "Google Ads", "Pesquisa, YouTube e Display", [["Investido", money(t.spend)], ["Impressões", int(t.imp, true)], ["Cliques", int(t.clicks)], [c.resultLabel || "Resultados", int(t.res)]], "#anuncios", "paid")); }
  if (c.platforms.meta) { const t = tot("meta"); const reach = ctx.reach?.current?.reach; cards.push(tile("meta", "Meta Ads", "Facebook e Instagram", [["Investido", money(t.spend)], reach ? ["Pessoas alcançadas", int(reach, true)] : ["Impressões", int(t.imp, true)], ["Cliques", int(t.clicks)], [c.resultLabel || "Resultados", int(t.res)]], "#anuncios", "paid")); }
  for (const n of ["instagram", "facebook"]) {
    const d = s[n];
    if (!d?.connected || d.error) continue;
    const posts = (d.posts || []).filter((p) => String(p.date).slice(0, 10) >= state.from);
    const reach = posts.reduce((a, p) => a + p.reach, 0), inter = posts.reduce((a, p) => a + p.interactions, 0);
    cards.push(tile(n, n === "instagram" ? "Instagram" : "Facebook", n === "instagram" ? `@${d.username || ""}` : d.username || "Página",
      [["Seguidores", int(d.followers)], ["Posts", int(posts.length)], ["Alcance dos posts", int(reach, true)], ["Engajamento", reach ? pct(safeDiv(inter, reach), 1) : "—"]], "#social", "org"));
  }
  if (y?.connected && y.channel) {
    const cur = y.current;
    cards.push(tile("youtube", "YouTube", y.channel.handle || y.channel.name,
      [["Inscritos", int(y.channel.subscribers)], ["Visualizações", cur ? int(cur.views, true) : "—"], ["Horas assistidas", cur ? int(cur.minutes / 60) : "—"], ["Novos inscritos", cur ? `${cur.gained - cur.lost >= 0 ? "+" : ""}${int(cur.gained - cur.lost)}` : "—"]], "#youtube", y.split && cur?.paidViews ? "mix" : "org"));
  }
  if (!cards.length) return null;
  return h("section", { class: "chans-wrap" }, h("h2", { class: "sec-title" }, "Seus canais"), h("div", { class: "chans" }, cards));
}

// Frase do período com os números em destaque (dinheiro, quantidades e porcentagens)
function heroText(text) {
  const main = text.split(" — ")[0].replace(/\.$/, "") + ".";
  const parts = main.split(/(R\$\s?[\d.]+,\d{2}|\d+(?:,\d+)?%|\d{1,3}(?:\.\d{3})+(?:,\d+)?)/);
  return h("p", { class: "hero-card__text" }, parts.map((p, i) => (i % 2
    ? h("mark", { class: `hl${/^R\$/.test(p) ? " hl--money" : /%$/.test(p) ? " hl--pct" : ""}` }, p)
    : p)));
}

const stat = (v, l) => h("div", { class: "mini-stat" }, h("strong", {}, v), h("span", {}, l));

function footnote(c) {
  if (c.profile === "awareness") return "Pessoas alcançadas vêm da Meta Ads (pessoas diferentes no período). O Google não informa pessoas únicas, só exibições. Os números do dia atual ainda podem mudar.";
  if (c.profile === "leads") return "Conversas e cliques vêm das plataformas. Vendas são as informadas pela sua equipe: nem toda venda tem origem nos anúncios, e nem toda venda vinda dos anúncios é registrada, por isso o retorno é uma estimativa.";
  return "Vendas e receita vêm do rastreamento das plataformas, que pode atribuir a mesma venda ao Google e à Meta. Use o painel da sua loja como fonte oficial do faturamento.";
}
