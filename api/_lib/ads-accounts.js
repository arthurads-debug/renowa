// Contas de anúncio de cada cliente (uma ou várias, de um ou mais logins conectados).
// Formato novo: client.ads = [{ p: "google"|"meta", login, id, name, loginCustomerId?, currency? }]
// Formato antigo (ainda aceito): client.googleAds / client.metaAds com uma conta cada.
import { getLogin, getLogins, saveLogin } from "./connections.js";
import { listGoogleAccounts } from "./google-ads.js";
import { listMetaAdAccounts, listPages } from "./meta-ads.js";

export function adsOf(c) {
  if (Array.isArray(c?.ads) && c.ads.length) return c.ads;
  const out = [];
  if (c?.googleAds?.customerId) out.push({ p: "google", id: c.googleAds.customerId, name: c.googleAds.name || "", loginCustomerId: c.googleAds.loginCustomerId || "", login: c.googleAds.login || "" });
  if (c?.metaAds?.adAccountId) out.push({ p: "meta", id: c.metaAds.adAccountId, name: c.metaAds.name || "", login: c.metaAds.login || "" });
  return out;
}

// Contas que este espectador pode ver: a agência vê todas; o cliente só as marcadas como visíveis no login
export async function adsFor(c, viewer = "client") {
  const all = adsOf(c);
  const logins = await getLogins();
  const hiddenOf = (a) => !!(a.login && (logins[a.login]?.hidden || []).includes(a.id));
  return viewer === "agency" ? all.map((a) => ({ ...a, hidden: hiddenOf(a) })) : all.filter((a) => !hiddenOf(a));
}

// Atualiza a lista de contas que um login enxerga (guardada no próprio login)
export async function discover(loginId) {
  const L = await getLogin(loginId);
  if (!L) throw Object.assign(new Error("Login não encontrado."), { status: 404, expose: true });
  const ref = { login: L.id };
  try {
    if (L.provider === "google") {
      L.accounts = (await listGoogleAccounts(ref)).map((a) => ({ id: a.id, name: a.name, status: a.status, currency: a.currency, loginCustomerId: a.loginCustomerId || "" }));
    } else {
      const [ads, pages] = await Promise.all([listMetaAdAccounts(ref), listPages(ref)]);
      L.accounts = ads.map((a) => ({ id: a.id, name: a.name, status: a.status, currency: a.currency, business: a.business }));
      L.pages = pages;
    }
    L.error = null;
  } catch (e) {
    L.error = String(e.message || e).slice(0, 600);
  }
  L.checkedAt = new Date().toISOString();
  await saveLogin(L);
  return L;
}

// O que o navegador pode ver de um login (nunca o token)
export const publicLogin = (L, explain) => ({
  id: L.id, provider: L.provider, label: L.label || "", connectedAt: L.connectedAt, by: L.by || "agencia", clientId: L.clientId || null,
  accounts: (L.accounts || []).map((a) => ({ ...a, visible: !(L.hidden || []).includes(a.id) })), pages: L.pages || [], checkedAt: L.checkedAt || null,
  error: L.error ? (explain ? explain(L.error) : L.error) : null,
  expiresAt: L.expiresAt || null,
});
