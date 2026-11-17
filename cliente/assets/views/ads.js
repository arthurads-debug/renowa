// ANÚNCIOS — tráfego pago, com indicadores escolhidos pelo objetivo do cliente.
import { h, int, money, pct, dec, safeDiv, dateList, fmtDay, fmtDayLong, today } from "../util.js";
import { COLORS, NAMES, context, kpisFor, totals, primaryMetric, campaignColumns, platformStats } from "../model.js";
import { card, kpiGrid, loadingState, platformSwitch, emptyState } from "../components.js";
import { renderChart, toggleTable, observe } from "../charts.js";

const table = { sort: "spend", dir: "desc", search: "" };

export function renderAds(view, state, helpers) {
  if (!state.metrics) { view.replaceChildren(loadingState()); return; }
  const c = state.client;
  const ctx = context(state);
  const metric = primaryMetric(c);
  const partial = state.from === state.to && state.to === today();

  const spendChart = h("div", { class: "chart" });
  const metricChart = h("div", { class: "chart" });
  const tableBtn = (el) => h("button", { class: "link", onclick: (e) => { e.currentTarget.textContent = toggleTable(el) ? "Ocultar dados" : "Ver dados"; } }, "Ver dados");

  const blocks = [
    h("div", { class: "toolbar" }, platformSwitch(state, helpers.setPlatform)),
    kpiGrid(kpisFor(ctx), { partial }),
    h("div", { class: "grid-2" },
      card({ title: "Investimento por dia", sub: "Valor gasto em mídia, por plataforma", tools: tableBtn(spendChart) }, spendChart),
      card({ title: `${metric.label} por dia`, sub: c.profile === "awareness" ? "Quantas vezes os anúncios apareceram" : "Registrados pelas plataformas", tools: tableBtn(metricChart) }, metricChart)),
  ];

  if (c.profile === "leads") blocks.push(funnel(ctx, c), salesCard(state, ctx, helpers));
  blocks.push(platformsCard(state, c));
  blocks.push(campaignsCard(state, c));
  blocks.push(h("p", { class: "fineprint" }, "Dados das APIs do Google Ads e da Meta. As plataformas levam algumas horas para consolidar os números; os do dia atual ainda podem mudar."));
  view.replaceChildren(...blocks.filter(Boolean));

  // Gráficos (precisam estar no DOM para medir a largura)
  const dates = dateList(state.from, state.to);
  const idx = Object.fromEntries(dates.map((d, i) => [d, i]));
  const plats = ["google", "meta"].filter((p) => c.platforms[p] && (state.platform === "all" || state.platform === p));
  const series = (key) => plats.map((p) => {
    const v = new Array(dates.length).fill(0);
    state.metrics.rows.forEach((r) => { if (r.platform === p && idx[r.date] != null) v[idx[r.date]] += r[key]; });
    return { key: p, label: NAMES[p], color: COLORS[p], values: v.map((x) => Math.round(x * 100) / 100) };
  });
  renderChart(spendChart, { type: "bars", labels: dates, series: series("spend"), fmt: (v) => money(v), fmtAxis: (v) => money(v, true), fmtDate: fmtDay, fmtDateLong: fmtDayLong, ariaLabel: "Investimento diário por plataforma" });
  renderChart(metricChart, { type: "lines", labels: dates, series: series(metric.key), fmt: metric.fmt, fmtAxis: metric.axis, fmtDate: fmtDay, fmtDateLong: fmtDayLong, ariaLabel: `${metric.label} por dia` });
  observe(spendChart); observe(metricChart);
}

/* ---------- Funil (perfil loja física / WhatsApp) ---------- */
function funnel(ctx, c) {
  const steps = [];
  const reach = ctx.platform !== "google" ? ctx.reach?.current?.reach : null;
  if (reach) steps.push({ v: reach, label: "Pessoas alcançadas", src: "Meta Ads" });
  steps.push({ v: ctx.cur.clicks, label: "Cliques nos anúncios", src: "Google + Meta" });
  steps.push({ v: ctx.cur.results, label: c.resultLabel, src: "Plataformas" });
  if (ctx.sales) steps.push({ v: ctx.sales.cur.count, label: "Vendas informadas", src: "Sua equipe" });
  return card({ title: "Do anúncio até a venda", sub: "Cada etapa mostra quantas pessoas seguiram para a próxima" },
    h("ol", { class: "funnel" }, steps.map((s, i) => h("li", { class: "funnel__step" },
      h("div", { class: "funnel__bar", style: { "--w": `${Math.max(18, 100 - i * 22)}%` } },
        h("strong", {}, int(s.v)), h("span", {}, s.label)),
      h("small", { class: "funnel__meta" },
        i > 0 && steps[i - 1].v ? `${pct(safeDiv(s.v, steps[i - 1].v), steps[i - 1].v > 1000 ? 2 : 1)} da etapa anterior · ` : "",
        `fonte: ${s.src}`)))));
}

/* ---------- Vendas informadas ---------- */
function salesCard(state, ctx, helpers) {
  const c = state.client;
  if (!c.has.sales) {
    return card({ title: "Vendas na loja e no WhatsApp", sub: "Ainda não conectado" },
      emptyState("Mostre o retorno real dos anúncios", "Peça à agência para ativar o registro de vendas: sua equipe informa as vendas da semana num formulário simples, e o painel cruza com o investimento."));
  }
  const list = (state.content?.sales || []).filter((s) => s.date >= state.from && s.date <= state.to);
  const byChannel = {};
  list.forEach((s) => { const k = s.channel || "Outros"; byChannel[k] = byChannel[k] || { count: 0, value: 0 }; byChannel[k].count += s.count; byChannel[k].value += s.value; });
  const total = ctx.sales.cur;
  const ret = safeDiv(total.value, ctx.cur.spend);
  return card({
    title: "Vendas informadas pela sua equipe",
    sub: "WhatsApp, telefone e loja física · registradas no formulário de vendas",
    tools: c.salesFormUrl ? h("a", { class: "btn btn--ghost btn--sm", href: c.salesFormUrl, target: "_blank", rel: "noopener", onclick: (e) => { if (c.salesFormUrl === "#demo") { e.preventDefault(); helpers.toast("No painel real, este botão abre o formulário de vendas."); } } }, "Registrar vendas") : null,
  },
  h("div", { class: "sales" },
    h("div", { class: "sales__big" },
      h("p", { class: "muted" }, "Para cada R$ 1 investido em anúncios"),
      h("p", { class: "sales__ret" }, ret ? `R$ ${dec(ret, 2)}` : "—"),
      h("p", { class: "muted" }, `em vendas informadas (${money(total.value)} ÷ ${money(ctx.cur.spend)})`)),
    h("table", { class: "table table--compact" },
      h("thead", {}, h("tr", {}, h("th", { class: "is-text", scope: "col" }, "Canal"), h("th", { scope: "col" }, "Vendas"), h("th", { scope: "col" }, "Valor"), h("th", { scope: "col" }, "Ticket médio"))),
      h("tbody", {}, Object.entries(byChannel).sort((a, b) => b[1].value - a[1].value).map(([k, v]) =>
        h("tr", {}, h("td", { class: "is-text" }, k), h("td", {}, int(v.count)), h("td", {}, money(v.value)), h("td", {}, money(safeDiv(v.value, v.count)))))),
      h("tfoot", {}, h("tr", {}, h("td", { class: "is-text" }, "Total"), h("td", {}, int(total.count)), h("td", {}, money(total.value)), h("td", {}, money(safeDiv(total.value, total.count))))))),
  h("p", { class: "fineprint" }, "Estimativa: considera todas as vendas informadas no período. Parte delas viria mesmo sem anúncios, e parte das vendas geradas pelos anúncios pode não ter sido registrada."));
}

/* ---------- Google × Meta ---------- */
function platformsCard(state, c) {
  const plats = ["google", "meta"].filter((p) => c.platforms[p]);
  if (plats.length < 1) return null;
  const per = Object.fromEntries(plats.map((p) => [p, totals(state.metrics.rows.filter((r) => r.platform === p))]));
  const total = plats.reduce((a, p) => a + per[p].spend, 0);
  return card({ title: "Google Ads × Meta Ads", sub: "Como o investimento foi dividido e o que cada canal entregou" },
    plats.length > 1 ? h("div", { class: "split" },
      h("div", { class: "split__bar", role: "img", "aria-label": plats.map((p) => `${NAMES[p]} ${pct(safeDiv(per[p].spend, total), 0)} do investimento`).join(", ") },
        plats.map((p) => h("div", { class: "split__seg", style: { flexBasis: `${safeDiv(per[p].spend, total) * 100}%`, background: COLORS[p] } }))),
      h("div", { class: "split__legend" }, plats.map((p) => h("span", {}, h("i", { class: `key key--${p}` }), ` ${NAMES[p]} · ${pct(safeDiv(per[p].spend, total), 0)} · ${money(per[p].spend)}`)))) : null,
    h("div", { class: "platforms" }, plats.map((p) => h("article", { class: `pf${state.platform !== "all" && state.platform !== p ? " pf--off" : ""}` },
      h("div", { class: "pf__head" }, h("i", { style: { background: COLORS[p] } }), NAMES[p]),
      h("dl", { class: "pf__grid" }, platformStats(c, per[p], p === "meta" ? state.metrics.summary?.current : null).map(([k, v]) => h("div", {}, h("dt", {}, k), h("dd", {}, v))))))));
}

/* ---------- Campanhas ---------- */
function campaignsCard(state, c) {
  const cols = campaignColumns(c);
  const body = h("tbody");
  const foot = h("tfoot");
  const sub = h("p", { class: "card__sub" });
  const head = h("tr", {}, h("th", { scope: "col", class: "is-text", "data-sort": "campaign" }, "Campanha"), cols.map((col) => h("th", { scope: "col", "data-sort": col.key }, col.label)));

  const rows = () => {
    const map = new Map();
    state.metrics.rows.filter((r) => state.platform === "all" || r.platform === state.platform).forEach((r) => {
      const k = `${r.platform}:${r.campaignId}`;
      if (!map.has(k)) map.set(k, { platform: r.platform, campaign: r.campaign, list: [] });
      map.get(k).list.push(r);
    });
    let list = [...map.values()].map((x) => ({ platform: x.platform, campaign: x.campaign, ...totals(x.list) }));
    if (table.search) list = list.filter((x) => x.campaign.toLowerCase().includes(table.search));
    list.sort((a, b) => { const r = table.sort === "campaign" ? a.campaign.localeCompare(b.campaign, "pt-BR") : (a[table.sort] || 0) - (b[table.sort] || 0); return table.dir === "asc" ? r : -r; });
    return list;
  };

  const paint = () => {
    const list = rows();
    sub.textContent = `${list.length} campanha${list.length === 1 ? "" : "s"} com veiculação no período`;
    body.replaceChildren(...(list.length ? list.map((x) => h("tr", {},
      h("td", { class: "is-text" }, h("div", { class: "camp" }, h("i", { style: { background: COLORS[x.platform] } }), h("div", {}, x.campaign, h("small", {}, NAMES[x.platform])))),
      cols.map((col) => h("td", {}, col.fmt(x))))) : [h("tr", {}, h("td", { colspan: cols.length + 1, class: "empty" }, "Nenhuma campanha encontrada."))]));
    const t = totals(list);
    foot.replaceChildren(list.length ? h("tr", {}, h("td", { class: "is-text" }, "Total"), cols.map((col) => h("td", {}, col.fmt(t)))) : "");
    [...head.children].forEach((th) => th.dataset.sort === table.sort ? th.setAttribute("aria-sort", table.dir === "asc" ? "ascending" : "descending") : th.removeAttribute("aria-sort"));
  };
  [...head.children].forEach((th) => {
    th.tabIndex = 0;
    const go = () => { const k = th.dataset.sort; table.dir = table.sort === k && table.dir === "desc" ? "asc" : k === "campaign" ? "asc" : "desc"; table.sort = k; paint(); };
    th.addEventListener("click", go);
    th.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go()));
  });

  const csv = () => {
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [["Plataforma", "Campanha", ...cols.map((x) => x.label)].map(esc).join(";"),
      ...rows().map((x) => [NAMES[x.platform], x.campaign, ...cols.map((col) => col.fmt(x))].map(esc).join(";"))];
    const a = h("a", { href: URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" })), download: `campanhas_${state.from}_${state.to}.csv` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  paint();
  const c2 = card({
    title: "Campanhas",
    tools: [h("label", { class: "search" }, h("span", { class: "sr-only" }, "Buscar campanha"),
      h("input", { type: "search", placeholder: "Buscar campanha", value: table.search, oninput: (e) => { table.search = e.target.value.trim().toLowerCase(); paint(); } })),
      h("button", { class: "btn btn--ghost btn--sm", onclick: csv }, "Exportar CSV")],
  }, h("div", { class: "table-wrap" }, h("table", { class: "table" }, h("thead", {}, head), body, foot)));
  c2.querySelector(".card__head > div").append(sub);
  return c2;
}
