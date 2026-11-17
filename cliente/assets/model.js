// Modelo de dados do painel: agregações e o que cada perfil de cliente deve ver.
import { money, int, dec, pct, times, safeDiv, singular } from "./util.js";

export const COLORS = { google: "#FA4802", meta: "#1E12EA" }; // par validado (daltonismo e contraste)
export const NAMES = { google: "Google Ads", meta: "Meta Ads" };

export const PROFILE_TEXT = {
  awareness: { name: "Divulgação", lead: "Quantas pessoas viram sua mensagem — e quanto custou para chegar até elas." },
  leads: { name: "Contatos e loja", lead: "Quantas pessoas chamaram sua empresa — e quanto custou cada contato." },
  sales: { name: "Vendas online", lead: "Quanto os anúncios venderam — e quanto voltou para cada real investido." },
};

export function totals(rows) {
  const t = { spend: 0, impressions: 0, clicks: 0, results: 0, revenue: 0, engagement: 0, videoViews: 0, metaSpend: 0 };
  for (const r of rows) {
    t.spend += r.spend; t.impressions += r.impressions; t.clicks += r.clicks; t.results += r.results;
    t.revenue += r.revenue; t.engagement += r.engagement || 0; t.videoViews += r.videoViews || 0;
    if (r.platform === "meta") t.metaSpend += r.spend;
  }
  t.cpr = safeDiv(t.spend, t.results);
  t.roas = safeDiv(t.revenue, t.spend);
  t.ctr = safeDiv(t.clicks, t.impressions);
  t.cpc = safeDiv(t.spend, t.clicks);
  t.cpm = safeDiv(t.spend, t.impressions) * 1000;
  return t;
}

export function salesTotals(sales, from, to) {
  const list = (sales || []).filter((s) => s.date >= from && s.date <= to);
  return { count: list.reduce((a, s) => a + s.count, 0), value: list.reduce((a, s) => a + s.value, 0), entries: list.length };
}

/*
  KPIs por perfil. Cada item: id, rótulo, valor formatado, valor numérico (para comparar), se subir é bom.
  ctx = { cur, prev, reach: {current, previous}, sales: {cur, prev}, client, platform }
*/
export function kpisFor(ctx) {
  const { cur, prev, client } = ctx;
  const R = client.resultLabel;
  const metaOn = ctx.platform !== "google" && client.platforms.meta;
  const reachCur = metaOn ? ctx.reach?.current : null;
  const reachPrev = metaOn ? ctx.reach?.previous : null;
  const k = [];
  const add = (o) => k.push(o);

  add({ id: "spend", label: "Investimento em anúncios", value: money(cur.spend), n: cur.spend, p: prev.spend, prevText: money(prev.spend), good: null, hero: true });

  if (client.profile === "awareness") {
    if (reachCur) add({ id: "reach", label: "Pessoas alcançadas", hint: "pessoas diferentes · Meta Ads", value: int(reachCur.reach), n: reachCur.reach, p: reachPrev?.reach, prevText: reachPrev ? int(reachPrev.reach) : null, good: true });
    add({ id: "impressions", label: "Vezes que os anúncios apareceram", value: int(cur.impressions), n: cur.impressions, p: prev.impressions, prevText: int(prev.impressions), good: true });
    if (reachCur) add({ id: "frequency", label: "Frequência média", hint: "vezes que cada pessoa viu", value: `${dec(reachCur.frequency, 1)}x`, n: reachCur.frequency, p: reachPrev?.frequency, prevText: reachPrev ? `${dec(reachPrev.frequency, 1)}x` : null, good: null });
    if (cur.videoViews > 0 || prev.videoViews > 0) add({ id: "video", label: "Visualizações de vídeo", value: int(cur.videoViews), n: cur.videoViews, p: prev.videoViews, prevText: int(prev.videoViews), good: true });
    if (reachCur?.reach) {
      const c = safeDiv(cur.metaSpend, reachCur.reach), pc = reachPrev?.reach ? safeDiv(prev.metaSpend, reachPrev.reach) : 0;
      add({ id: "cpp", label: "Custo por pessoa alcançada", hint: "Meta Ads", value: money(c), n: c, p: pc, prevText: pc ? money(pc) : null, good: false });
    } else {
      add({ id: "cpm", label: "Custo por mil exibições", value: money(cur.cpm), n: cur.cpm, p: prev.cpm, prevText: money(prev.cpm), good: false });
    }
    return k;
  }

  add({ id: "results", label: R, value: int(cur.results), n: cur.results, p: prev.results, prevText: int(prev.results), good: true });
  add({ id: "cpr", label: `Custo por ${singular(R).replace(/^(conversa|contato|venda|lead)\b.*/, "$1")}`, value: cur.results ? money(cur.cpr) : "—", n: cur.cpr, p: prev.cpr, prevText: prev.results ? money(prev.cpr) : null, good: false });

  if (client.profile === "leads") {
    if (reachCur) add({ id: "reach", label: "Pessoas alcançadas", hint: "pessoas diferentes · Meta Ads", value: int(reachCur.reach), n: reachCur.reach, p: reachPrev?.reach, prevText: reachPrev ? int(reachPrev.reach) : null, good: true });
    if (ctx.sales) {
      const s = ctx.sales.cur, sp = ctx.sales.prev;
      add({ id: "sales", label: "Vendas informadas", hint: `${int(s.count)} venda${s.count === 1 ? "" : "s"} registradas pela sua equipe`, value: money(s.value), n: s.value, p: sp.value, prevText: sp.value ? money(sp.value) : null, good: true });
      const r = safeDiv(s.value, cur.spend), rp = safeDiv(sp.value, prev.spend);
      add({ id: "return", label: "Retorno estimado", hint: "vendas informadas ÷ investimento", value: times(r), n: r, p: rp, prevText: rp ? times(rp) : null, good: true });
    } else {
      add({ id: "ctr", label: "Taxa de cliques", value: pct(cur.ctr, 2), n: cur.ctr, p: prev.ctr, prevText: pct(prev.ctr, 2), good: true });
    }
    return k;
  }

  // sales
  add({ id: "revenue", label: "Receita das vendas online", value: money(cur.revenue), n: cur.revenue, p: prev.revenue, prevText: money(prev.revenue), good: true });
  add({ id: "roas", label: "Retorno (ROAS)", hint: "receita ÷ investimento", value: times(cur.roas), n: cur.roas, p: prev.roas, prevText: times(prev.roas), good: true });
  return k;
}

// Métrica do 2º gráfico diário e da tabela de campanhas
export function primaryMetric(client) {
  if (client.profile === "awareness") return { key: "impressions", label: "Exibições", fmt: (v) => int(v), axis: (v) => int(v, true) };
  return { key: "results", label: client.resultLabel, fmt: (v) => dec(v, v % 1 ? 1 : 0), axis: (v) => int(v, true) };
}

export function campaignColumns(client) {
  const R = client.resultLabel;
  const base = [
    { key: "spend", label: "Investimento", fmt: (c) => money(c.spend) },
    { key: "impressions", label: "Exibições", fmt: (c) => int(c.impressions) },
    { key: "clicks", label: "Cliques", fmt: (c) => int(c.clicks) },
  ];
  if (client.profile === "awareness") return [...base,
    { key: "engagement", label: "Interações", fmt: (c) => int(c.engagement) },
    { key: "videoViews", label: "Visualiz. de vídeo", fmt: (c) => (c.videoViews ? int(c.videoViews) : "—") },
    { key: "cpm", label: "Custo/mil exib.", fmt: (c) => money(c.cpm) },
  ];
  const mid = [...base,
    { key: "ctr", label: "CTR", fmt: (c) => pct(c.ctr, 2) },
    { key: "results", label: R, fmt: (c) => int(c.results) },
    { key: "cpr", label: "Custo/result.", fmt: (c) => (c.results ? money(c.cpr) : "—") },
  ];
  if (client.profile === "leads") return mid;
  return [...mid,
    { key: "revenue", label: "Receita", fmt: (c) => money(c.revenue) },
    { key: "roas", label: "ROAS", fmt: (c) => times(c.roas) },
  ];
}

export function platformStats(client, t, reach) {
  const R = client.resultLabel;
  if (client.profile === "awareness") return [
    ["Investimento", money(t.spend)], ["Exibições", int(t.impressions)],
    reach ? ["Pessoas alcançadas", int(reach.reach)] : ["Cliques", int(t.clicks)],
    ["Interações", int(t.engagement)], ["Custo/mil exib.", money(t.cpm)],
    t.videoViews ? ["Visualiz. de vídeo", int(t.videoViews)] : ["CTR", pct(t.ctr, 2)],
  ];
  const s = [["Investimento", money(t.spend)], [R, int(t.results)], ["Custo/result.", t.results ? money(t.cpr) : "—"], ["CTR", pct(t.ctr, 2)], ["Custo por clique", money(t.cpc)]];
  s.push(client.profile === "sales" ? ["ROAS", times(t.roas)] : ["Exibições", int(t.impressions, true)]);
  return s;
}

// Frase-resumo em português claro, para quem não é do marketing
export function narrative(ctx, days) {
  const { cur, client } = ctx;
  const period = days === 1 ? "Hoje" : days === 30 ? "Nos últimos 30 dias" : `Nos últimos ${days} dias`;
  const reach = ctx.reach?.current?.reach;
  const parts = [`${period}, investimos ${money(cur.spend)} em anúncios`];
  if (client.profile === "awareness") {
    parts.push(`e sua mensagem apareceu ${int(cur.impressions)} vezes`);
    let s = parts.join(" ");
    if (reach) {
      s += `, chegando a ${int(reach)} pessoas diferentes`;
      if (client.city?.population) {
        const share = reach / client.city.population;
        s += share < 1
          ? ` — o equivalente a ${pct(share, 0)} da população de ${client.city.name}`
          : ` — mais do que a população de ${client.city.name}, porque inclui moradores da região e visitantes`;
      }
    }
    return s + ".";
  }
  let s = parts.join(" ");
  if (reach) s += `, alcançando ${int(reach)} pessoas`;
  s += `. Foram ${int(cur.results)} ${client.resultLabel.charAt(0).toLowerCase() + client.resultLabel.slice(1)}`;
  if (cur.results) s += `, a ${money(cur.cpr)} cada`;
  if (client.profile === "sales" && cur.revenue) s += `, gerando ${money(cur.revenue)} em vendas online`;
  if (client.profile === "leads" && ctx.sales?.cur.value) s += `. Sua equipe informou ${int(ctx.sales.cur.count)} vendas, somando ${money(ctx.sales.cur.value)}`;
  return s + ".";
}

// Contexto de comparação usado por Resumo e Anúncios
export function context(state, platform = state.platform) {
  const filt = (rows) => (platform === "all" ? rows : rows.filter((r) => r.platform === platform));
  const m = state.metrics;
  const c = state.client;
  const ctx = {
    client: c, platform,
    cur: totals(filt(m.rows)), prev: totals(filt(m.prev)),
    reach: m.summary || null, sales: null,
  };
  if (c.profile === "leads" && state.content?.sales) {
    ctx.sales = { cur: salesTotals(state.content.sales, state.from, state.to), prev: salesTotals(state.content.sales, state.prevFrom, state.prevTo) };
  }
  return ctx;
}
