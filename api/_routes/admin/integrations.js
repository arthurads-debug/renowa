// /api/admin/integrations — status das conexões, configuração dos apps e desconectar.
// GET: o que está conectado (nunca devolve tokens nem segredos)
// POST { provider, ...campos }: salva App ID/Secret (Meta) ou Client ID/Secret/Developer token (Google)
// DELETE ?provider=: desconecta
import { json, readBody, fail } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/admin.js";
import { apps, saveApps, getConn, delConn } from "../../_lib/connections.js";
import { storeEnabled } from "../../_lib/store.js";
import { listGoogleAccounts } from "../../_lib/google-ads.js";
import { listMetaAdAccounts, listPages } from "../../_lib/meta-ads.js";
import { redirectUri } from "../oauth.js";

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
    if (/SCOPE_INSUFFICIENT|insufficient authentication scopes/i.test(m)) return { error: "O login do Google foi feito sem a permissão do Google Ads. Clique em Reconectar e marque a caixa do Google Ads na tela de permissões." };
    if (/DEVELOPER_TOKEN_NOT_APPROVED|only approved for use with test accounts/i.test(m)) return { error: "O token de desenvolvedor ainda está no nível “Conta de teste”. Peça o Acesso básico na Central de API do Google Ads; quando o Google aprovar, os números aparecem sozinhos." };
    if (/DEVELOPER_TOKEN_INVALID|developer token/i.test(m)) return { error: "O token de desenvolvedor não foi aceito pelo Google. Confira se copiou o token inteiro da Central de API." };
    if (/USER_PERMISSION_DENIED|CUSTOMER_NOT_FOUND/i.test(m)) return { error: "O e-mail conectado não tem acesso a essa conta do Google Ads (ou à MCC informada). Confira o ID da MCC ou conecte com o e-mail que administra as contas." };
    return { error: m.slice(0, 300) };
  }
}

export default async function handler(req, res) {
  try {
    if (!requireAdmin(req, res)) return;
    const url = new URL(req.url, "http://x");

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
