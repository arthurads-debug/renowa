// Google Ads API (REST) — investimento e resultados por campanha e por dia.
// Docs: https://developers.google.com/google-ads/api/rest/overview
// Cada cliente pode ter o próprio login do Google (clientId); sem ele, vale o login da agência.
import { googleAuth } from "./connections.js";

// Versão da API: o Google desliga cada versão cerca de 1 ano depois do lançamento.
// Sem GOOGLE_ADS_API_VERSION, descobre a mais nova ativa (a que responde 401 sem login; desligada responde 404).
let verCache = { v: null, at: 0 };
async function VER() {
  if (process.env.GOOGLE_ADS_API_VERSION) return process.env.GOOGLE_ADS_API_VERSION;
  if (verCache.v && Date.now() - verCache.at < 6 * 3600_000) return verCache.v;
  for (let n = 32; n >= 22; n--) {
    try {
      const r = await fetch(`https://googleads.googleapis.com/v${n}/customers:listAccessibleCustomers`, { signal: AbortSignal.timeout(4000) });
      if (r.status !== 404) { verCache = { v: `v${n}`, at: Date.now() }; return verCache.v; }
    } catch { /* tenta a próxima */ }
  }
  verCache = { v: "v26", at: Date.now() };
  return verCache.v;
}

const tokens = new Map(); // refresh token → access token

async function accessToken(g) {
  const hit = tokens.get(g.refreshToken);
  if (hit && hit.exp > Date.now() + 60_000) return hit.value;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: g.clientId, client_secret: g.clientSecret, refresh_token: g.refreshToken }),
  });
  if (!res.ok) throw new Error(`Google OAuth falhou (${res.status}): ${await res.text()}`);
  const data = await res.json();
  tokens.set(g.refreshToken, { value: data.access_token, exp: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

const digits = (id) => String(id || "").replace(/\D/g, "");
const fmtId = (id) => String(id).replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");
const STATUS = { ENABLED: "Ativa", CANCELED: "Cancelada", SUSPENDED: "Suspensa", CLOSED: "Encerrada" };

async function headers(g, loginCustomerId) {
  // Desde set/2026 o nível de acesso é do projeto do Google Cloud; o token de desenvolvedor é opcional (ignorado).
  const h = { Authorization: `Bearer ${await accessToken(g)}`, "Content-Type": "application/json" };
  if (g.developerToken) h["developer-token"] = g.developerToken;
  if (digits(loginCustomerId)) h["login-customer-id"] = digits(loginCustomerId);
  return h;
}

async function search(g, customerId, query, loginCustomerId) {
  const h = await headers(g, loginCustomerId);
  const url = `https://googleads.googleapis.com/${await VER()}/customers/${digits(customerId)}/googleAds:search`;
  const out = [];
  let pageToken;
  do {
    const res = await fetch(url, { method: "POST", headers: h, body: JSON.stringify({ query, pageToken }) });
    if (!res.ok) throw new Error(`Google Ads API (${res.status}): ${await res.text()}`);
    const data = await res.json();
    out.push(...(data.results || []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}

// Todas as contas de anúncio que o login enxerga — diretas e as que estão sob gerentes (MCC).
// Cada conta volta com o loginCustomerId certo (o gerente por onde ela é acessada), sem ninguém digitar ID.
export async function listGoogleAccounts(ref) {
  const g = await googleAuth(ref);
  const res = await fetch(`https://googleads.googleapis.com/${await VER()}/customers:listAccessibleCustomers`, { headers: await headers(g) });
  if (!res.ok) throw new Error(`Google Ads API (${res.status}): ${await res.text()}`);
  const ids = ((await res.json()).resourceNames || []).map((r) => r.split("/")[1]);
  const found = new Map();
  const errors = [];
  await Promise.all(ids.slice(0, 50).map(async (id) => {
    try {
      const [me] = await search(g, id, "SELECT customer.id, customer.descriptive_name, customer.manager, customer.currency_code, customer.status FROM customer LIMIT 1", id);
      const c = me?.customer;
      if (!c) return;
      if (!c.manager) {
        found.set(String(c.id), { id: fmtId(c.id), name: c.descriptiveName || `Conta ${fmtId(c.id)}`, currency: c.currencyCode, status: STATUS[c.status] || c.status, loginCustomerId: "" });
        return;
      }
      const kids = await search(g, id, "SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.status, customer_client.currency_code FROM customer_client WHERE customer_client.manager = FALSE", id);
      for (const k of kids.map((r) => r.customerClient)) {
        if (!found.has(String(k.id))) found.set(String(k.id), { id: fmtId(k.id), name: k.descriptiveName || `Conta ${fmtId(k.id)}`, currency: k.currencyCode, status: STATUS[k.status] || k.status, loginCustomerId: fmtId(id), via: fmtId(id) });
      }
    } catch (e) { errors.push(e.message); console.error("[google] conta", id, e.message); }
  }));
  // nenhuma conta e todas deram erro: mostra o motivo (token de teste, permissão…) em vez de lista vazia
  if (!found.size && errors.length) throw new Error(errors[0]);
  return [...found.values()].sort((a, b) => (a.status === "Ativa" ? 0 : 1) - (b.status === "Ativa" ? 0 : 1) || a.name.localeCompare(b.name, "pt-BR"));
}

const loginFor = (account, g) => account.loginCustomerId || (g.source === "agency" ? g.loginCustomerId : "");

export async function fetchGoogleAds(account, from, to, ref) {
  const g = await googleAuth(ref);
  const rows = await search(g, account.customerId, `
    SELECT segments.date, campaign.id, campaign.name, campaign.status,
           metrics.cost_micros, metrics.impressions, metrics.clicks,
           metrics.conversions, metrics.conversions_value, metrics.engagements
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND metrics.impressions > 0`, loginFor(account, g));
  return rows.map((r) => {
    const m = r.metrics || {};
    return {
      date: r.segments.date,
      platform: "google",
      campaignId: String(r.campaign.id),
      campaign: r.campaign.name,
      status: r.campaign.status,
      spend: Number(m.costMicros || 0) / 1e6,
      impressions: Number(m.impressions || 0),
      clicks: Number(m.clicks || 0),
      results: Number(m.conversions || 0),
      revenue: Number(m.conversionsValue || 0),
      engagement: Number(m.engagements || 0),
      videoViews: 0,
    };
  });
}

// Prova de que está funcionando: totais dos últimos 30 dias
export async function googleSnapshot(account, ref) {
  const g = await googleAuth(ref);
  const rows = await search(g, account.customerId, "SELECT metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions FROM customer WHERE segments.date DURING LAST_30_DAYS", loginFor(account, g));
  const t = { spend: 0, impressions: 0, clicks: 0, results: 0 };
  for (const r of rows) {
    const m = r.metrics || {};
    t.spend += Number(m.costMicros || 0) / 1e6; t.impressions += Number(m.impressions || 0);
    t.clicks += Number(m.clicks || 0); t.results += Number(m.conversions || 0);
  }
  return t;
}

// Erros da API traduzidos para quem não é técnico
export function explainGoogleError(e) {
  const m = String(e?.message || e);
  if (/CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION|ACTION_NOT_PERMITTED|DEVELOPER_TOKEN_NOT_APPROVED|only approved for use with test accounts/i.test(m)) return "O Google ainda está liberando o acesso a contas reais (pedido de “Exploração” em análise, costuma levar minutos). Os números aparecem sozinhos assim que for aprovado.";
  if (/SCOPE_INSUFFICIENT|insufficient authentication scopes/i.test(m)) return "O login foi feito sem a permissão do Google Ads. Clique em Conectar de novo e aceite todas as permissões.";
  if (/DEVELOPER_TOKEN_NOT_APPROVED|only approved for use with test accounts/i.test(m)) return "O token de desenvolvedor da agência ainda está no nível “Conta de teste”. Peça o Acesso básico na Central de API do Google Ads (é só uma vez, para todos os clientes).";
  if (/DEVELOPER_TOKEN_INVALID|DEVELOPER_TOKEN_PROHIBITED/i.test(m)) return "O token de desenvolvedor da agência não foi aceito pelo Google. Confira em Configuração da agência.";
  if (/invalid_grant/i.test(m)) return "O login do Google expirou ou foi removido. Clique em Conectar de novo.";
  if (/USER_PERMISSION_DENIED|CUSTOMER_NOT_FOUND|NOT_ADS_USER/i.test(m)) return "Esse login do Google não tem acesso a nenhuma conta de anúncios. Conecte com o e-mail que entra no Google Ads do cliente.";
  if (/CUSTOMER_NOT_ENABLED/i.test(m)) return "A conta de anúncios está cancelada ou ainda não foi ativada no Google Ads.";
  if (/não configurada|não conectado/i.test(m)) return m;
  return "O Google não respondeu como esperado. Tente Conectar de novo em alguns minutos.";
}
