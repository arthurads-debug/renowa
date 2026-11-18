// Instagram (orgânico) via Graph API — usa o mesmo token de Usuário do Sistema da Meta.
// Permissões necessárias no token: instagram_basic, instagram_manage_insights, pages_read_engagement.
import { graphGet } from "./meta-ads.js";

const FORMAT = (m) => {
  if (m.media_product_type === "REELS") return "Reels";
  if (m.media_product_type === "STORY") return "Stories";
  if (m.media_type === "CAROUSEL_ALBUM") return "Carrossel";
  if (m.media_type === "VIDEO") return "Vídeo";
  return "Imagem";
};

async function insights(id, clientId) {
  // As métricas aceitas mudam por formato; tenta o conjunto completo e cai para o básico.
  for (const metric of ["reach,saved,shares,views,total_interactions", "reach,saved,total_interactions", "reach"]) {
    try {
      const rows = await graphGet(`${id}/insights`, new URLSearchParams({ metric }), undefined, clientId);
      return Object.fromEntries(rows.map((r) => [r.name, Number(r.values?.[0]?.value ?? r.total_value?.value ?? 0)]));
    } catch { /* tenta o próximo conjunto */ }
  }
  return {};
}

// Novos seguidores no período (a Meta só guarda os últimos 30 dias, dia a dia)
async function followersGained(userId, from, to, clientId) {
  const min = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const f = from < min ? min : from;
  if (f > to) return null;
  try {
    const rows = await graphGet(`${userId}/insights`, new URLSearchParams({ metric: "follower_count", period: "day", since: String(Math.floor(Date.parse(`${f}T00:00:00Z`) / 1000)), until: String(Math.floor(Date.parse(`${to}T23:59:59Z`) / 1000)) }), undefined, clientId);
    const values = rows?.[0]?.values || [];
    return { value: values.reduce((s, v) => s + Number(v.value || 0), 0), since: f };
  } catch { return null; }
}

export async function fetchInstagram(account, from, to, clientId) {
  const profile = await graphGet(account.userId, new URLSearchParams({ fields: "username,followers_count,media_count" }), undefined, clientId);
  const since = Math.floor(Date.parse(`${from}T00:00:00Z`) / 1000);
  const until = Math.floor(Date.parse(`${to}T23:59:59Z`) / 1000);
  const media = await graphGet(`${account.userId}/media`, new URLSearchParams({
    fields: "id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count",
    since: String(since), until: String(until), limit: "50",
  }), undefined, clientId);

  const list = media.slice(0, 40);
  const stats = await Promise.allSettled(list.map((m) => insights(m.id, clientId)));
  const posts = list.map((m, i) => {
    const s = stats[i].status === "fulfilled" ? stats[i].value : {};
    const likes = Number(m.like_count || 0), comments = Number(m.comments_count || 0);
    return {
      id: m.id,
      date: m.timestamp,
      format: FORMAT(m),
      caption: (m.caption || "").slice(0, 280),
      permalink: m.permalink,
      thumbnail: m.thumbnail_url || (m.media_type !== "VIDEO" ? m.media_url : null),
      likes, comments,
      saves: s.saved || 0,
      shares: s.shares || 0,
      reach: s.reach || 0,
      views: s.views || 0,
      interactions: s.total_interactions || likes + comments + (s.saved || 0) + (s.shares || 0),
    };
  });
  return { username: profile.username, followers: profile.followers_count || 0, posts, gained: await followersGained(account.userId, from, to, clientId) };
}
