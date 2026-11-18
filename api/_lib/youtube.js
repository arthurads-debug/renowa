// YouTube: canal (inscritos, visualizações, vídeos) pela YouTube Data API v3 e estatísticas do período
// (visualizações, tempo assistido, inscritos ganhos, público, origem do tráfego) pela YouTube Analytics API v2.
// Usa um login do Google feito com as permissões youtube.readonly + yt-analytics.readonly.
import { apps, getLogin } from "./connections.js";

const DATA = "https://www.googleapis.com/youtube/v3";
const ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports";
export const YT_SCOPES = ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/yt-analytics.readonly"];

const tokens = new Map();
async function accessToken(loginId) {
  const L = await getLogin(loginId);
  if (!L?.refreshToken) throw Object.assign(new Error("YouTube não conectado — conecte de novo em Conexões."), { status: 503 });
  const hit = tokens.get(L.refreshToken);
  if (hit && hit.exp > Date.now() + 60_000) return { token: hit.value, login: L };
  const a = (await apps()).google;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: a.clientId, client_secret: a.clientSecret, refresh_token: L.refreshToken }),
  });
  if (!res.ok) throw new Error(`Google OAuth falhou (${res.status}): ${await res.text()}`);
  const d = await res.json();
  tokens.set(L.refreshToken, { value: d.access_token, exp: Date.now() + d.expires_in * 1000 });
  return { token: d.access_token, login: L };
}

async function get(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`YouTube API (${res.status}): ${await res.text()}`);
  return res.json();
}

const thumb = (t) => t?.maxres?.url || t?.high?.url || t?.medium?.url || t?.default?.url || null;

// Canais do login (o próprio canal e, se for conta de marca escolhida no login, o dela)
export async function listChannels(loginId) {
  const { token } = await accessToken(loginId);
  const d = await get(`${DATA}/channels?${new URLSearchParams({ part: "snippet,statistics", mine: "true", maxResults: "50" })}`, token);
  return (d.items || []).map((c) => ({
    id: c.id, name: c.snippet?.title || "Canal", handle: c.snippet?.customUrl || "", thumbnail: thumb(c.snippet?.thumbnails),
    subscribers: Number(c.statistics?.subscriberCount || 0), views: Number(c.statistics?.viewCount || 0), videos: Number(c.statistics?.videoCount || 0),
    status: "Ativa",
  }));
}

// "PT4M13S" → segundos
const dur = (s) => { const m = String(s || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); return m ? (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0) : 0; };

async function videoDetails(ids, token) {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const d = await get(`${DATA}/videos?${new URLSearchParams({ part: "snippet,statistics,contentDetails", id: ids.slice(i, i + 50).join(",") })}`, token);
    for (const v of d.items || []) {
      out[v.id] = {
        id: v.id, title: v.snippet?.title || "", publishedAt: v.snippet?.publishedAt || "", thumbnail: thumb(v.snippet?.thumbnails),
        duration: dur(v.contentDetails?.duration), short: dur(v.contentDetails?.duration) <= 60,
        totalViews: Number(v.statistics?.viewCount || 0), totalLikes: Number(v.statistics?.likeCount || 0), totalComments: Number(v.statistics?.commentCount || 0),
      };
    }
  }
  return out;
}

async function report(token, channelId, from, to, params) {
  const d = await get(`${ANALYTICS}?${new URLSearchParams({ ids: `channel==${channelId}`, startDate: from, endDate: to, ...params })}`, token);
  const cols = (d.columnHeaders || []).map((c) => c.name);
  return (d.rows || []).map((r) => Object.fromEntries(r.map((v, i) => [cols[i], v])));
}

const sum = (rows, k) => rows.reduce((s, r) => s + Number(r[k] || 0), 0);

// Tudo que a página do YouTube mostra, para o período e o período anterior
export async function fetchYouTube(channel, from, to, prevFrom, prevTo) {
  const { token } = await accessToken(channel.login);
  const ch = await get(`${DATA}/channels?${new URLSearchParams({ part: "snippet,statistics,contentDetails,brandingSettings", id: channel.channelId })}`, token);
  const c = ch.items?.[0];
  if (!c) throw new Error("Canal não encontrado para este login.");
  const out = {
    channel: {
      id: c.id, name: c.snippet?.title || channel.name, handle: c.snippet?.customUrl || "", description: (c.snippet?.description || "").slice(0, 280),
      thumbnail: thumb(c.snippet?.thumbnails), banner: c.brandingSettings?.image?.bannerExternalUrl || null,
      subscribers: Number(c.statistics?.subscriberCount || 0), hiddenSubscribers: !!c.statistics?.hiddenSubscriberCount,
      views: Number(c.statistics?.viewCount || 0), videos: Number(c.statistics?.videoCount || 0), since: c.snippet?.publishedAt || null,
    },
    analytics: false,
  };

  const METRICS = "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares";
  try {
    const [daily, prevRows, top, traffic, devices, demo, geo] = await Promise.all([
      report(token, c.id, from, to, { metrics: METRICS, dimensions: "day", sort: "day" }),
      prevFrom ? report(token, c.id, prevFrom, prevTo, { metrics: METRICS }) : Promise.resolve([]),
      report(token, c.id, from, to, { metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained", dimensions: "video", sort: "-views", maxResults: "12" }),
      report(token, c.id, from, to, { metrics: "views,estimatedMinutesWatched", dimensions: "insightTrafficSourceType", sort: "-views" }).catch(() => []),
      report(token, c.id, from, to, { metrics: "views,estimatedMinutesWatched", dimensions: "deviceType", sort: "-views" }).catch(() => []),
      report(token, c.id, from, to, { metrics: "viewerPercentage", dimensions: "ageGroup,gender" }).catch(() => []),
      report(token, c.id, from, to, { metrics: "views", dimensions: "country", sort: "-views", maxResults: "8" }).catch(() => []),
    ]);
    // pago x orgânico: visualizações vindas de anúncios (origem ADVERTISING), por dia e por vídeo
    const [paidDaily, paidPrev, videoSplit] = await Promise.all([
      report(token, c.id, from, to, { metrics: "views", dimensions: "day,insightTrafficSourceType", sort: "day" })
        .then((rows) => rows.filter((r) => r.insightTrafficSourceType === "ADVERTISING")).catch(() => null),
      prevFrom ? report(token, c.id, prevFrom, prevTo, { metrics: "views", dimensions: "insightTrafficSourceType" }).catch(() => null) : Promise.resolve(null),
      Promise.all(top.map((r) => report(token, c.id, from, to, { metrics: "views", dimensions: "insightTrafficSourceType", filters: `video==${r.video}` })
        .then((rows) => sum(rows.filter((x) => x.insightTrafficSourceType === "ADVERTISING"), "views")).catch(() => null))),
    ]);
    const details = await videoDetails(top.map((r) => r.video), token);
    const tot = (rows) => ({
      views: sum(rows, "views"), minutes: sum(rows, "estimatedMinutesWatched"),
      avgDuration: rows.length ? sum(rows.map((r) => ({ x: r.averageViewDuration * r.views })), "x") / Math.max(1, sum(rows, "views")) : 0,
      avgPercent: rows.length ? sum(rows.map((r) => ({ x: r.averageViewPercentage * r.views })), "x") / Math.max(1, sum(rows, "views")) : 0,
      gained: sum(rows, "subscribersGained"), lost: sum(rows, "subscribersLost"),
      likes: sum(rows, "likes"), comments: sum(rows, "comments"), shares: sum(rows, "shares"),
    });
    out.analytics = true;
    out.current = tot(daily);
    out.previous = prevRows.length ? tot(prevRows) : null;
    // total pago do período: origem "Anúncios" no relatório de origem do tráfego
    const paidTotal = sum(traffic.filter((r) => r.insightTrafficSourceType === "ADVERTISING"), "views");
    const share = out.current.views ? paidTotal / out.current.views : 0;
    // por dia: relatório dia × origem; se o YouTube não entregar, distribui na proporção do período
    const paidByDay = paidDaily ? Object.fromEntries(paidDaily.map((r) => [r.day, +r.views || 0])) : Object.fromEntries(daily.map((r) => [r.day, Math.round((+r.views || 0) * share)]));
    out.split = traffic.length > 0;
    out.current.paidViews = paidTotal;
    if (out.previous && paidPrev) out.previous.paidViews = sum(paidPrev.filter((x) => x.insightTrafficSourceType === "ADVERTISING"), "views");
    out.daily = daily.map((r) => ({ date: r.day, paidViews: paidByDay[r.day] || 0, views: +r.views || 0, minutes: +r.estimatedMinutesWatched || 0, gained: +r.subscribersGained || 0, lost: +r.subscribersLost || 0, likes: +r.likes || 0, comments: +r.comments || 0, shares: +r.shares || 0 }));
    out.top = top.map((r, i) => ({ ...(details[r.video] || { id: r.video, title: "" }), views: +r.views || 0, paidViews: videoSplit[i] ?? null, minutes: +r.estimatedMinutesWatched || 0, avgDuration: +r.averageViewDuration || 0, avgPercent: +r.averageViewPercentage || 0, likes: +r.likes || 0, comments: +r.comments || 0, shares: +r.shares || 0, gained: +r.subscribersGained || 0 }));
    out.traffic = traffic.map((r) => ({ source: r.insightTrafficSourceType, views: +r.views || 0, minutes: +r.estimatedMinutesWatched || 0 }));
    out.devices = devices.map((r) => ({ device: r.deviceType, views: +r.views || 0 }));
    out.audience = demo.map((r) => ({ age: r.ageGroup, gender: r.gender, pct: +r.viewerPercentage || 0 }));
    out.countries = geo.map((r) => ({ country: r.country, views: +r.views || 0 }));
  } catch (e) {
    // sem a permissão de estatísticas (ou API desativada): mostra os vídeos recentes com os números públicos
    out.analyticsError = String(e.message || e).slice(0, 300);
  }

  // Vídeos publicados recentemente (os últimos 30), com os totais desde a publicação
  // e, quando há permissão de estatísticas, o desempenho no período selecionado
  const uploads = c.contentDetails?.relatedPlaylists?.uploads;
  if (uploads) {
    const pl = await get(`${DATA}/playlistItems?${new URLSearchParams({ part: "contentDetails", playlistId: uploads, maxResults: "30" })}`, token).catch(() => ({ items: [] }));
    const ids = (pl.items || []).map((i) => i.contentDetails.videoId);
    const det = await videoDetails(ids, token).catch(() => ({}));
    let period = {};
    if (out.analytics && ids.length) {
      const rows = await report(token, c.id, from, to, { metrics: "views,estimatedMinutesWatched,averageViewPercentage,likes,comments,shares,subscribersGained", dimensions: "video", filters: `video==${ids.join(",")}`, maxResults: String(ids.length) }).catch(() => []);
      period = Object.fromEntries(rows.map((r) => [r.video, { views: +r.views || 0, minutes: +r.estimatedMinutesWatched || 0, avgPercent: +r.averageViewPercentage || 0, likes: +r.likes || 0, comments: +r.comments || 0, shares: +r.shares || 0, gained: +r.subscribersGained || 0 }]));
    }
    out.recent = ids.map((id) => det[id] && { ...det[id], period: period[id] || null }).filter(Boolean).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }
  return out;
}
