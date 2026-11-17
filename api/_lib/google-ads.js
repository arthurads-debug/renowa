// Google Ads API (REST) — investimento e resultados por campanha e por dia.
// Docs: https://developers.google.com/google-ads/api/rest/overview
import { googleAuth } from "./connections.js";

const VERSION = () => process.env.GOOGLE_ADS_API_VERSION || "v21";

let token = { value: null, exp: 0, rt: "" };

async function accessToken() {
  const g = await googleAuth();
  if (token.value && token.rt === g.refreshToken && token.exp > Date.now() + 60_000) return token.value;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: g.clientId, client_secret: g.clientSecret, refresh_token: g.refreshToken }),
  });
  if (!res.ok) throw new Error(`Google OAuth falhou (${res.status}): ${await res.text()}`);
  const data = await res.json();
  token = { value: data.access_token, exp: Date.now() + data.expires_in * 1000, rt: g.refreshToken };
  return token.value;
}

const devToken = async () => (await googleAuth()).developerToken;
const mccId = async () => (await googleAuth()).loginCustomerId;

const digits = (id) => String(id).replace(/\D/g, "");

async function search(customerId, query, loginCustomerId) {
  const headers = {
    Authorization: `Bearer ${await accessToken()}`,
    "developer-token": await devToken(),
    "Content-Type": "application/json",
  };
  const mcc = loginCustomerId === null ? "" : loginCustomerId || (await mccId());
  if (mcc) headers["login-customer-id"] = digits(mcc);
  const url = `https://googleads.googleapis.com/${VERSION()}/customers/${digits(customerId)}/googleAds:search`;
  const out = [];
  let pageToken;
  do {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ query, pageToken }) });
    if (!res.ok) throw new Error(`Google Ads API (${res.status}): ${await res.text()}`);
    const data = await res.json();
    out.push(...(data.results || []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}

const fmtId = (id) => String(id).replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");

// Contas de anúncio sob a MCC da agência (para o painel da agência escolher)
export async function listGoogleAccounts() {
  const mcc = await mccId();
  if (!mcc) return listAccessible();
  const rows = await search(mcc, `
    SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager,
           customer_client.status, customer_client.currency_code
    FROM customer_client
    WHERE customer_client.manager = FALSE`);
  const STATUS = { ENABLED: "Ativa", CANCELED: "Cancelada", SUSPENDED: "Suspensa", CLOSED: "Encerrada" };
  return rows.map((r) => r.customerClient).map((c) => ({
    id: fmtId(c.id), name: c.descriptiveName || `Conta ${fmtId(c.id)}`, currency: c.currencyCode, status: STATUS[c.status] || c.status,
  })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function fetchGoogleAds(account, from, to) {
  const customerId = digits(account.customerId);
  const query = `
    SELECT segments.date, campaign.id, campaign.name, campaign.status,
           metrics.cost_micros, metrics.impressions, metrics.clicks,
           metrics.conversions, metrics.conversions_value, metrics.engagements
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND metrics.impressions > 0`;

  const headers = {
    Authorization: `Bearer ${await accessToken()}`,
    "developer-token": await devToken(),
    "Content-Type": "application/json",
  };
  const mcc = account.loginCustomerId || (await mccId());
  if (mcc) headers["login-customer-id"] = digits(mcc);

  const url = `https://googleads.googleapis.com/${VERSION()}/customers/${customerId}/googleAds:search`;
  const rows = [];
  let pageToken;
  do {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ query, pageToken }) });
    if (!res.ok) throw new Error(`Google Ads API (${res.status}): ${await res.text()}`);
    const data = await res.json();
    for (const r of data.results || []) {
      const m = r.metrics || {};
      rows.push({
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
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return rows;
}

// Sem MCC: todas as contas que o login do Google enxerga (diretas e as que estão sob gerentes)
async function listAccessible() {
  const res = await fetch(`https://googleads.googleapis.com/${VERSION()}/customers:listAccessibleCustomers`, {
    headers: { Authorization: `Bearer ${await accessToken()}`, "developer-token": await devToken() },
  });
  if (!res.ok) throw new Error(`Google Ads API (${res.status}): ${await res.text()}`);
  const ids = ((await res.json()).resourceNames || []).map((r) => r.split("/")[1]);
  const STATUS = { ENABLED: "Ativa", CANCELED: "Cancelada", SUSPENDED: "Suspensa", CLOSED: "Encerrada" };
  const found = new Map();
  await Promise.all(ids.slice(0, 50).map(async (id) => {
    try {
      const [me] = await search(id, "SELECT customer.id, customer.descriptive_name, customer.manager, customer.currency_code, customer.status FROM customer LIMIT 1", null);
      const c = me?.customer;
      if (!c) return;
      if (!c.manager) {
        found.set(String(c.id), { id: fmtId(c.id), name: c.descriptiveName || `Conta ${fmtId(c.id)}`, currency: c.currencyCode, status: STATUS[c.status] || c.status });
        return;
      }
      const kids = await search(id, "SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.status, customer_client.currency_code FROM customer_client WHERE customer_client.manager = FALSE", id);
      for (const k of kids.map((r) => r.customerClient)) {
        if (!found.has(String(k.id))) found.set(String(k.id), { id: fmtId(k.id), name: k.descriptiveName || `Conta ${fmtId(k.id)}`, currency: k.currencyCode, status: STATUS[k.status] || k.status, via: fmtId(id) });
      }
    } catch (e) { console.error("[google] conta", id, e.message); }
  }));
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
