// HISTÓRICO — evolução mês a mês e os relatórios mensais da agência.
import { h, int, money, safeDiv, fmtMonth, cap, iso, parseISO, today } from "../util.js";
import { COLORS, NAMES, totals, primaryMetric } from "../model.js";
import { card, loadingState, emptyState } from "../components.js";
import { renderChart, observe } from "../charts.js";

export function renderHistory(view, state, helpers) {
  helpers.loadHistory();
  if (!state.history) { view.replaceChildren(loadingState()); return; }
  const c = state.client;
  const metric = primaryMetric(c);

  // Meses (12)
  const t = parseISO(today());
  const months = [];
  for (let i = 11; i >= 0; i--) { const d = new Date(t.getFullYear(), t.getMonth() - i, 1); months.push(iso(d).slice(0, 7)); }
  const plats = ["google", "meta"].filter((p) => c.platforms[p]);
  const by = {};
  state.history.rows.forEach((r) => { (by[r.date.slice(0, 7)] ||= []).push(r); });
  const monthTotals = months.map((m) => ({ month: m, ...totals(by[m] || []) }));
  const sales = state.content?.sales || [];
  const salesBy = {};
  sales.forEach((s) => { const k = s.date.slice(0, 7); (salesBy[k] ||= { count: 0, value: 0 }); salesBy[k].count += s.count; salesBy[k].value += s.value; });

  const series = (key) => plats.map((p) => ({ key: p, label: NAMES[p], color: COLORS[p], values: months.map((m) => Math.round((by[m] || []).filter((r) => r.platform === p).reduce((a, r) => a + r[key], 0) * 100) / 100) }));
  const fmtM = (m) => cap(fmtMonth(m, "short").replace(".", ""));
  const fmtL = (m) => cap(fmtMonth(m));

  const spendChart = h("div", { class: "chart" });
  const metricChart = h("div", { class: "chart" });

  const cols = [["Investimento", (x) => money(x.spend)], [metric.label, (x) => int(x[metric.key])]];
  if (c.profile === "awareness") cols.push(["Custo/mil exib.", (x) => money(x.cpm)]);
  else cols.push(["Custo/result.", (x) => (x.results ? money(x.cpr) : "—")]);
  if (c.profile === "leads" && c.has.sales) cols.push(["Vendas informadas", (x) => (salesBy[x.month] ? money(salesBy[x.month].value) : "—")]);
  if (c.profile === "sales") cols.push(["Receita", (x) => money(x.revenue)]);

  const reports = state.content?.reports || [];

  view.replaceChildren(...[
    h("div", { class: "grid-2" },
      card({ title: "Investimento por mês", sub: "Mídia paga, por plataforma" }, spendChart),
      card({ title: `${metric.label} por mês`, sub: c.profile === "awareness" ? "Vezes que os anúncios apareceram" : "Registrados pelas plataformas" }, metricChart)),
    card({ title: "Mês a mês" },
      h("div", { class: "table-wrap" }, h("table", { class: "table" },
        h("thead", {}, h("tr", {}, h("th", { class: "is-text", scope: "col" }, "Mês"), cols.map(([l]) => h("th", { scope: "col" }, l)))),
        h("tbody", {}, [...monthTotals].reverse().filter((x) => x.spend > 0).map((x) => h("tr", {}, h("td", { class: "is-text" }, fmtL(x.month), x.month === months[11] ? h("small", { class: "muted" }, " (em andamento)") : null), cols.map(([, f]) => h("td", {}, f(x))))))))),
    card({ title: "Relatórios mensais", sub: "O que fizemos, o que aprendemos e o que vem a seguir" },
      reports.length ? h("div", { class: "reports" }, reports.map((r, i) => h("details", { class: "report", open: i === 0 },
        h("summary", {}, h("strong", {}, fmtL(r.month)), h("span", { class: "muted" }, r.summary)),
        h("div", { class: "report__body" },
          r.highlights.length ? h("div", {}, h("p", { class: "mono muted" }, "Destaques"), h("ul", {}, r.highlights.map((x) => h("li", {}, x)))) : null,
          r.next.length ? h("div", {}, h("p", { class: "mono muted" }, "Próximos passos"), h("ul", {}, r.next.map((x) => h("li", {}, x)))) : null))))
        : emptyState("Nenhum relatório ainda", c.has.reports ? "Os relatórios aparecem aqui assim que a agência publicar." : "Peça à agência para ativar os relatórios mensais.")),
  ].filter(Boolean));

  const common = { labels: months, fmtDate: fmtM, fmtDateLong: fmtL };
  renderChart(spendChart, { ...common, type: "bars", series: series("spend"), fmt: (v) => money(v), fmtAxis: (v) => money(v, true), ariaLabel: "Investimento por mês" });
  renderChart(metricChart, { ...common, type: "bars", series: series(metric.key), fmt: metric.fmt, fmtAxis: metric.axis, ariaLabel: `${metric.label} por mês` });
  observe(spendChart); observe(metricChart);
}
