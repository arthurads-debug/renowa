// Página do Facebook (orgânico) via Graph API.
// O token de Usuário do Sistema precisa ter a página atribuída e as permissões
// pages_read_engagement, pages_show_list e read_insights.
import { graphGet } from "./meta-ads.js";

const pageTokens = new Map();

// Métricas de página exigem o token da própria página, obtido com o token do sistema
async function pageToken(pageId, clientId) {
  const key = `${JSON.stringify(clientId)}:${pageId}`;
  const hit = pageTokens.get(key);
  if (hit && hit.exp > Date.now()) return hit.token;
  const data = await graphGet(pageId, new URLSearchParams({ fields: "access_token" }), undefined, clientId);
  if (!data?.access_token) throw new Error("Sem acesso à página (atribua a página ao Usuário do Sistema).");
  pageTokens.set(key, { token: data.access_token, exp: Date.now() + 50 * 60_000 });
  return data.access_token;
}

const FORMAT = (p) => {
  const t = p.attachments?.data?.[0]?.media_type || "";
  if (/video/i.test(t)) return "Vídeo";
  if (/album/i.test(t)) return "Carrossel";
  if (/photo/i.test(t)) return "Imagem";
  return "Post";
};

async function postReach(id, token, clientId) {
  // A Meta vem trocando nomes de métricas; tenta as atuais e cai para as antigas.
  for (const metric of ["post_impressions_unique", "post_total_media_view_unique"]) {
    try {
      const rows = await graphGet(`${id}/insights`, new URLSearchParams({ metric }), token, clientId);
      const v = rows?.[0]?.values?.[0]?.value;
      if (v != null) return Number(v);
    } catch { /* tenta a próxima */ }
  }
  return 0;
}

// Novos seguidores da página no período (a Meta troca o nome dessas métricas: tenta a atual e as antigas)
async function followsGained(pageId, from, to, token, clientId) {
  const since = String(Math.floor(Date.parse(`${from}T00:00:00Z`) / 1000)), until = String(Math.floor(Date.parse(`${to}T23:59:59Z`) / 1000) + 1);
  for (const metric of ["page_daily_follows_unique", "page_follows", "page_fan_adds_unique"]) {
    try {
      const rows = await graphGet(`${pageId}/insights`, new URLSearchParams({ metric, period: "day", since, until }), token, clientId);
      const values = rows?.[0]?.values;
      if (values?.length) return { value: values.reduce((s, v) => s + Number(v.value || 0), 0), since: from };
    } catch { /* tenta a próxima */ }
  }
  return null;
}

export async function fetchFacebook(account, from, to, clientId) {
  const token = await pageToken(account.pageId, clientId);
  const page = await graphGet(account.pageId, new URLSearchParams({ fields: "name,followers_count,fan_count" }), token, clientId);
  const since = Math.floor(Date.parse(`${from}T00:00:00Z`) / 1000);
  const until = Math.floor(Date.parse(`${to}T23:59:59Z`) / 1000);
  const posts = await graphGet(`${account.pageId}/published_posts`, new URLSearchParams({
    fields: "id,message,created_time,permalink_url,full_picture,attachments{media_type},shares,reactions.summary(true).limit(0),comments.summary(true).limit(0)",
    since: String(since), until: String(until), limit: "50",
  }), token, clientId);

  const list = posts.slice(0, 40);
  const reach = await Promise.allSettled(list.map((p) => postReach(p.id, token, clientId)));
  const gained = await followsGained(account.pageId, from, to, token, clientId);
  return {
    username: page.name,
    gained,
    followers: Number(page.followers_count || page.fan_count || 0),
    posts: list.map((p, i) => {
      const likes = Number(p.reactions?.summary?.total_count || 0);
      const comments = Number(p.comments?.summary?.total_count || 0);
      const shares = Number(p.shares?.count || 0);
      return {
        id: p.id, network: "facebook", date: p.created_time, format: FORMAT(p),
        caption: (p.message || "").slice(0, 280), permalink: p.permalink_url, thumbnail: p.full_picture || null,
        likes, comments, shares, saves: 0, views: 0,
        reach: reach[i].status === "fulfilled" ? reach[i].value : 0,
        interactions: likes + comments + shares,
      };
    }),
  };
}
