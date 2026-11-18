// Pago x orgânico: junta anúncios (Google Ads + Meta Ads), redes sociais (Instagram + Facebook) e YouTube
// numa conta simples de entender. "Visualizações" = impressões dos anúncios + alcance dos posts + views do YouTube.
import { dateList } from "./util.js";

const sum = (list, k) => list.reduce((s, x) => s + (Number(x[k]) || 0), 0);

export function mixFor(state) {
  const rows = state.metrics?.rows || [];
  const prevRows = state.metrics?.prev || [];
  const s = state.social || {};
  const y = state.youtube?.connected && state.youtube.analytics ? state.youtube : null;
  const posts = ["instagram", "facebook"].flatMap((n) => (s[n]?.connected ? (s[n].posts || []).map((p) => ({ ...p, network: n })) : []));
  const inRange = (d, a, b) => d >= a && d <= b;
  const postsCur = posts.filter((p) => inRange(String(p.date).slice(0, 10), state.from, state.to));

  // YouTube: o que veio de anúncio é pago; o resto é orgânico. Interações divididas na mesma proporção.
  const ytViews = y ? y.current.views : 0;
  const ytPaid = y && y.split ? Math.min(ytViews, y.current.paidViews || 0) : 0;
  const ytShare = ytViews ? ytPaid / ytViews : 0;
  const ytEng = y ? y.current.likes + y.current.comments + y.current.shares : 0;

  const paid = {
    views: sum(rows, "impressions") + ytPaid,
    interactions: sum(rows, "engagement") + Math.round(ytEng * ytShare),
    clicks: sum(rows, "clicks"),
    results: sum(rows, "results"),
    spend: sum(rows, "spend"),
  };
  const organic = {
    views: sum(postsCur, "reach") + (ytViews - ytPaid),
    interactions: sum(postsCur, "interactions") + Math.round(ytEng * (1 - ytShare)),
    posts: postsCur.length + (y?.top?.length ? 0 : 0),
  };
  const prevPaid = sum(prevRows, "impressions") + (y?.previous?.paidViews || 0);

  // série diária (pago empilhado com orgânico)
  const dates = dateList(state.from, state.to);
  const byDate = (list, key, val) => { const m = {}; for (const x of list) { const d = String(x[key]).slice(0, 10); m[d] = (m[d] || 0) + (Number(x[val]) || 0); } return m; };
  const adsDay = byDate(rows, "date", "impressions");
  const postDay = byDate(postsCur, "date", "reach");
  const ytDay = Object.fromEntries((y?.daily || []).map((d) => [d.date, d]));
  const series = dates.map((d) => {
    const yd = ytDay[d];
    const yPaid = yd && y.split ? yd.paidViews || 0 : 0;
    return { date: d, paid: (adsDay[d] || 0) + yPaid, organic: (postDay[d] || 0) + (yd ? yd.views - yPaid : 0) };
  });

  return {
    paid, organic, prevPaid, series, dates,
    has: { ads: rows.length > 0 || (state.client.platforms.google || state.client.platforms.meta), social: posts.length > 0, youtube: !!y },
    ytSplit: !!(y && y.split),
  };
}
