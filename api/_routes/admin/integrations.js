// /api/admin/integrations — status das conexões, configuração dos apps e desconectar.
// GET: o que está conectado (nunca devolve tokens nem segredos)
// POST { provider, ...campos }: salva App ID/Secret (Meta) ou Client ID/Secret/Developer token (Google)
// DELETE ?provider=[&cliente=]: desconecta
// Por cliente: GET ?cliente=id → status das conexões dele + teste dos últimos 30 dias
//              POST { action: "convite", cliente } → link para o cliente conectar sozinho
import { json, readBody, fail } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/admin.js";
import { apps, saveApps, getConn, delConn, getClientConn, delClientConn } from "../../_lib/connections.js";
import { findById } from "../../_lib/clients.js";
import { storeEnabled } from "../../_lib/store.js";
import { listGoogleAccounts, googleSnapshot, explainGoogleError } from "../../_lib/google-ads.js";
import { listMetaAdAccounts, listPages, graphGet } from "../../_lib/meta-ads.js";
import { redirectUri, makeInvite } from "../oauth.js";

const mask = (v) => (v ? `••••${String(v).slice(-4)}` : "");

async function counts(provider) {
  try {
    if (provider === "meta") {
      const [ads, pages] = await Promise.all([listMetaAdAccounts(), listPages()]);
      return { adAccounts: ads.length, pages: pages.length, instagram: pages.filter((p) => p.instagram).length, sample: [...ads.slice(0, 4).map((x) => x.name), ...pages.slice(0, 3).map((x) => x.name)] };
    }
    const g = await listGoogleAccounts();
    return { adAccounts: g.length, sample: g.slice(0, 6).map((x) => x.name) };
  } catch (e) {
    const m = String(e.message || e);
    if (provider === "google") return { error: explainGoogleError(e) };
    return { error: m.slice(0, 300) };
  }
}

const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const n = (v) => Math.round(v || 0).toLocaleString("pt-BR");

// Status de um cliente: quem está conectado e se os números chegam (últimos 30 dias)
async function clientStatus(c) {
  const [g, m] = await Promise.all([getClientConn("google", c.id), getClientConn("meta", c.id)]);
  const out = {
    google: { own: !!g?.refreshToken, since: g?.connectedAt || null, by: g?.by || null, account: c.googleAds?.customerId ? { id: c.googleAds.customerId, name: c.googleAds.name || "" } : null },
    meta: { own: !!m?.accessToken, since: m?.connectedAt || null, by: m?.by || null, name: m?.name || "", account: c.metaAds?.adAccountId ? { id: c.metaAds.adAccountId, name: c.metaAds.name || "" } : null },
  };
  const jobs = [];
  if (c.googleAds?.customerId) jobs.push(googleSnapshot(c.googleAds, c.id)
    .then((t) => { out.google.test = { ok: true, text: `Últimos 30 dias: ${brl(t.spend)} investidos · ${n(t.impressions)} impressões · ${n(t.clicks)} cliques${t.results ? ` · ${n(t.results)} conversões` : ""}` }; })
    .catch((e) => { out.google.test = { ok: false, text: explainGoogleError(e) }; }));
  if (c.metaAds?.adAccountId) jobs.push(graphGet(`${c.metaAds.adAccountId}/insights`, new URLSearchParams({ date_preset: "last_30d", fields: "spend,impressions,clicks" }), undefined, c.id)
    .then((rows) => { const r = rows?.[0] || {}; out.meta.test = { ok: true, text: `Últimos 30 dias: ${brl(r.spend)} investidos · ${n(Number(r.impressions))} impressões · ${n(Number(r.clicks))} cliques` }; })
    .catch((e) => { out.meta.test = { ok: false, text: /não conectado/i.test(e.message) ? "Facebook ainda não conectado para este cliente." : "A Meta não liberou os números dessa conta. Clique em Conectar de novo." }; }));
  await Promise.all(jobs);
  return out;
}

export default async function handler(req, res) {
  try {
    if (!requireAdmin(req, res)) return;
    const url = new URL(req.url, "http://x");
    const cid = url.searchParams.get("cliente");

    if (cid && req.method === "GET") {
      const c = await findById(cid);
      if (!c) return json(res, 404, { error: "Cliente não encontrado." });
      const a = await apps();
      return json(res, 200, { ready: { google: !!(a.google.clientId && a.google.developerToken), meta: !!(a.meta.appId && a.meta.appSecret) }, ...(await clientStatus(c)) });
    }
    if (cid && req.method === "DELETE") {
      const p = url.searchParams.get("provider");
      if (!["meta", "google"].includes(p)) return json(res, 400, { error: "Integração desconhecida." });
      await delClientConn(p, cid);
      return json(res, 200, { ok: true });
    }

    if (req.method === "GET") {
      const a = await apps();
      const [m, g] = await Promise.all([getConn("meta"), getConn("google")]);
      const withCounts = url.searchParams.get("counts") === "1";
      const metaConnected = !!(process.env.META_ACCESS_TOKEN || m?.accessToken);
      const googleConnected = !!(process.env.GOOGLE_ADS_REFRESH_TOKEN || g?.refreshToken);
      return json(res, 200, {
        store: storeEnabled(),
        meta: {
          redirectUri: redirectUri(req, "meta"),
          appReady: !!(a.meta.appId && a.meta.appSecret), appId: a.meta.appId, appSecret: mask(a.meta.appSecret), fromEnv: a.meta.fromEnv,
          connected: metaConnected, source: process.env.META_ACCESS_TOKEN ? "env" : m ? "login" : null,
          name: m?.name || (process.env.META_ACCESS_TOKEN ? "Usuário do Sistema (variável de ambiente)" : ""),
          since: m?.connectedAt || null, expiresAt: m?.expiresAt || null,
          ...(withCounts && metaConnected ? { found: await counts("meta") } : {}),
        },
        google: {
          redirectUri: redirectUri(req, "google"),
          appReady: !!(a.google.clientId && a.google.clientSecret), clientId: a.google.clientId, clientSecret: mask(a.google.clientSecret),
          developerToken: mask(a.google.developerToken), devReady: !!a.google.developerToken, loginCustomerId: a.google.loginCustomerId, fromEnv: a.google.fromEnv,
          connected: googleConnected, source: process.env.GOOGLE_ADS_REFRESH_TOKEN ? "env" : g ? "login" : null,
          name: g?.email || (process.env.GOOGLE_ADS_REFRESH_TOKEN ? "Conta configurada por variável de ambiente" : ""),
          since: g?.connectedAt || null,
          ...(withCounts && googleConnected && a.google.developerToken ? { found: await counts("google") } : {}),
        },
      });
    }

    if (req.method === "POST") {
      const b = await readBody(req);
      if (b.action === "convite") {
        const c = await findById(b.cliente);
        if (!c) return json(res, 404, { error: "Cliente não encontrado." });
        const host = req.headers["x-forwarded-host"] || req.headers.host;
        return json(res, 200, { url: `https://${host}/conectar/?t=${encodeURIComponent(makeInvite(c.id))}`, name: c.name });
      }
      if (b.provider === "meta") {
        if (b.appId && !/^\d{6,20}$/.test(String(b.appId).trim())) return json(res, 400, { error: "O App ID da Meta tem só números." });
        await saveApps("meta", { appId: b.appId, appSecret: b.appSecret });
      } else if (b.provider === "google") {
        if (b.clientId && !/\.apps\.googleusercontent\.com$/.test(String(b.clientId).trim())) return json(res, 400, { error: "O Client ID do Google termina com .apps.googleusercontent.com" });
        await saveApps("google", { clientId: b.clientId, clientSecret: b.clientSecret, developerToken: b.developerToken, loginCustomerId: String(b.loginCustomerId || "").replace(/[^\d-]/g, "") });
      } else return json(res, 400, { error: "Integração desconhecida." });
      return json(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      const p = url.searchParams.get("provider");
      if (!["meta", "google"].includes(p)) return json(res, 400, { error: "Integração desconhecida." });
      await delConn(p);
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { error: "Método não permitido" });
  } catch (err) {
    return fail(res, err);
  }
}
