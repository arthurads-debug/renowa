// Google Ads API (REST) — investimento e resultados por campanha e por dia.
// Docs: https://developers.google.com/google-ads/api/rest/overview
const VERSION = () => process.env.GOOGLE_ADS_API_VERSION || "v21";

let token = { value: null, exp: 0 };

async function accessToken() {
  if (token.value && token.exp > Date.now() + 60_000) return token.value;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: required("GOOGLE_ADS_CLIENT_ID"),
      client_secret: required("GOOGLE_ADS_CLIENT_SECRET"),
      refresh_token: required("GOOGLE_ADS_REFRESH_TOKEN"),
    }),
  });
  if (!res.ok) throw new Error(`Google OAuth falhou (${res.status}): ${await res.text()}`);
  const data = await res.json();
  token = { value: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return token.value;
}

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Variável ${name} não configurada`);
  return v;
}

const digits = (id) => String(id).replace(/\D/g, "");

async function search(customerId, query, loginCustomerId) {
  const headers = {
    Authorization: `Bearer ${await accessToken()}`,
    "developer-token": required("GOOGLE_ADS_DEVELOPER_TOKEN"),
    "Content-Type": "application/json",
  };
  const mcc = loginCustomerId || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
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
  const mcc = required("GOOGLE_ADS_LOGIN_CUSTOMER_ID");
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
    "developer-token": required("GOOGLE_ADS_DEVELOPER_TOKEN"),
    "Content-Type": "application/json",
  };
  const mcc = account.loginCustomerId || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
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
