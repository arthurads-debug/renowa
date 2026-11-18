// Meta Marketing API (Facebook/Instagram Ads) — insights por campanha e por dia + alcance do período.
// Docs: https://developers.facebook.com/docs/marketing-api/insights
import crypto from "node:crypto";
import { metaAuth } from "./connections.js";

const VERSION = () => process.env.META_API_VERSION || "v21.0";

const sumActions = (list, types) =>
  (list || []).filter((a) => types.includes(a.action_type)).reduce((s, a) => s + Number(a.value || 0), 0);

const actId = (id) => (String(id).startsWith("act_") ? id : `act_${id}`);

// tk: token alternativo (ex.: token de página). Padrão: Usuário do Sistema (env) ou o login feito no painel.
// clientId: usa o login do Facebook do próprio cliente, se ele tiver conectado.
export async function graphGet(path, params = new URLSearchParams(), tk, ref) {
  const auth = await metaAuth(ref);
  tk = tk || auth.token;
  if (auth.secret) params.set("appsecret_proof", crypto.createHmac("sha256", auth.secret).update(tk).digest("hex"));
  let url = `https://graph.facebook.com/${VERSION()}/${path}?${params}`;
  const out = [];
  let first = null;
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${tk}` } });
    if (!res.ok) throw new Error(`Meta API (${res.status}): ${await res.text()}`);
    const data = await res.json();
    if (!first) first = data;
    if (Array.isArray(data.data)) out.push(...data.data);
    url = Array.isArray(data.data) ? data.paging?.next || null : null;
  }
  return Array.isArray(first?.data) ? out : first;
}

// Linhas dia × campanha
export async function fetchMetaAds(account, from, to, clientId) {
  const resultTypes = account.resultActionTypes?.length ? account.resultActionTypes : ["lead"];
  const revenueTypes = account.revenueActionTypes?.length ? account.revenueActionTypes : ["purchase"];
  const params = new URLSearchParams({
    level: "campaign",
    time_increment: "1",
    time_range: JSON.stringify({ since: from, until: to }),
    fields: "campaign_id,campaign_name,spend,impressions,clicks,actions,action_values",
    limit: "500",
  });
  const data = await graphGet(`${actId(account.adAccountId)}/insights`, params, undefined, clientId);
  return data.map((r) => ({
    date: r.date_start,
    platform: "meta",
    campaignId: String(r.campaign_id),
    campaign: r.campaign_name,
    spend: Number(r.spend || 0),
    impressions: Number(r.impressions || 0),
    clicks: Number(r.clicks || 0),
    results: sumActions(r.actions, resultTypes),
    revenue: sumActions(r.action_values, revenueTypes),
    engagement: sumActions(r.actions, ["post_engagement"]),
    videoViews: sumActions(r.actions, ["video_view"]),
  }));
}

// Alcance (pessoas únicas) e frequência do período inteiro.
// Alcance diário NÃO pode ser somado — por isso é uma consulta separada, sem quebra por dia.
export async function fetchMetaSummary(account, from, to, clientId) {
  const params = new URLSearchParams({
    time_range: JSON.stringify({ since: from, until: to }),
    fields: "reach,frequency,impressions",
  });
  const data = await graphGet(`${actId(account.adAccountId)}/insights`, params, undefined, clientId);
  const r = data[0] || {};
  return { reach: Number(r.reach || 0), frequency: Number(r.frequency || 0) };
}

/* ---------- Listas para o painel da agência ---------- */
const AD_STATUS = { 1: "Ativa", 2: "Desativada", 3: "Pagamento pendente", 7: "Em análise", 9: "Período de carência", 101: "Encerrada" };

export async function listMetaAdAccounts(clientId) {
  const rows = await graphGet("me/adaccounts", new URLSearchParams({ fields: "account_id,name,account_status,currency,business{name}", limit: "200" }), undefined, clientId);
  return rows.map((a) => ({
    id: `act_${a.account_id}`, name: a.name, currency: a.currency,
    status: AD_STATUS[a.account_status] || "—", business: a.business?.name || "",
  })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

// Páginas do Facebook + Instagram ligado a cada uma
export async function listPages(clientId) {
  const rows = await graphGet("me/accounts", new URLSearchParams({ fields: "id,name,instagram_business_account{id,username,followers_count}", limit: "200" }), undefined, clientId);
  return rows.map((p) => ({
    id: p.id, name: p.name,
    instagram: p.instagram_business_account ? { id: p.instagram_business_account.id, username: p.instagram_business_account.username, followers: p.instagram_business_account.followers_count || 0 } : null,
  })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
