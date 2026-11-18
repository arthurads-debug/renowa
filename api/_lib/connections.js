// Conexões da agência com Meta (Facebook/Instagram) e Google Ads, feitas por login (OAuth) no /admin.
// Prioridade: variáveis de ambiente (se existirem) → configuração salva pelo painel (banco KV).
// Nada daqui vai para o navegador: o painel só recebe "conectado como Fulano".
import { kvGetJSON, kvSetJSON, kvDel, storeEnabled } from "./store.js";

const KEYS = { meta: "renowa:conn:meta", google: "renowa:conn:google", apps: "renowa:apps" };
const memo = new Map(); // cache curto por instância
const TTL = 30_000;

async function read(key, ttl = TTL) {
  const hit = ttl ? memo.get(key) : null;
  if (hit && hit.exp > Date.now()) return hit.value;
  const value = storeEnabled() ? await kvGetJSON(key).catch(() => null) : null;
  memo.set(key, { value, exp: Date.now() + ttl });
  return value;
}
async function write(key, value) {
  if (value == null) await kvDel(key); else await kvSetJSON(key, value);
  memo.delete(key);
}

export const getConn = (provider) => read(KEYS[provider]);
// Conexão própria de cada cliente (o login do Google/Facebook que administra as contas dele)
const ckey = (provider, clientId) => `renowa:conn:${provider}:${clientId}`;
export const getClientConn = (provider, clientId) => (clientId ? read(ckey(provider, clientId)) : Promise.resolve(null));
export const setClientConn = (provider, clientId, value) => write(ckey(provider, clientId), value);
export const delClientConn = (provider, clientId) => write(ckey(provider, clientId), null);
export const setConn = (provider, value) => write(KEYS[provider], value);
export const delConn = (provider) => write(KEYS[provider], null);

/* ---------- Logins conectados (estilo UTMify) ----------
   Cada "Conectar Google/Facebook" vira um login com a lista de contas que ele enxerga.
   Os clientes escolhem uma ou várias dessas contas. Guardado num único registro (poucos logins). */
const LOGINS = "renowa:logins";
export const getLogins = async () => (await read(LOGINS, 0)) || {};
export const getLogin = async (id) => (id ? (await getLogins())[id] || null : null);
export async function saveLogin(login) { const all = { ...(await getLogins()) }; all[login.id] = login; await write(LOGINS, all); return login; }
export async function removeLogin(id) { const all = { ...(await getLogins()) }; delete all[id]; await write(LOGINS, all); }

// ref: id do cliente (texto) ou { c: cliente, login: id do login }
const refOf = (ref) => (ref && typeof ref === "object" ? ref : { c: ref });

// Credenciais dos apps (Meta App e Google OAuth) — env tem prioridade
export async function apps() {
  const kv = (await read(KEYS.apps)) || {};
  const env = process.env;
  return {
    meta: {
      appId: env.META_APP_ID || kv.meta?.appId || "",
      appSecret: env.META_APP_SECRET || kv.meta?.appSecret || "",
      fromEnv: !!env.META_APP_ID,
    },
    google: {
      clientId: env.GOOGLE_ADS_CLIENT_ID || kv.google?.clientId || "",
      clientSecret: env.GOOGLE_ADS_CLIENT_SECRET || kv.google?.clientSecret || "",
      developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN || kv.google?.developerToken || "",
      loginCustomerId: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || kv.google?.loginCustomerId || "",
      fromEnv: !!env.GOOGLE_ADS_CLIENT_ID,
    },
  };
}

// Salva só os campos preenchidos (campo vazio = mantém o que já existe)
export async function saveApps(provider, fields) {
  const kv = (await read(KEYS.apps)) || {};
  const cur = kv[provider] || {};
  for (const [k, v] of Object.entries(fields)) {
    const s = String(v ?? "").trim();
    if (s) cur[k] = s;
  }
  kv[provider] = cur;
  await write(KEYS.apps, kv);
}

// Token e segredo da Meta: Usuário do Sistema (env) ou o login feito no painel
export async function metaAuth(ref) {
  const { c: clientId, login } = refOf(ref);
  if (login) {
    const L = await getLogin(login);
    if (!L?.accessToken) throw Object.assign(new Error("Facebook não conectado — conecte de novo em Conexões."), { status: 503 });
    return { token: L.accessToken, secret: (await apps()).meta.appSecret, source: "login" };
  }
  const own = await getClientConn("meta", clientId);
  if (own?.accessToken) return { token: own.accessToken, secret: (await apps()).meta.appSecret, source: "client" };
  if (process.env.META_ACCESS_TOKEN) return { token: process.env.META_ACCESS_TOKEN, secret: process.env.META_APP_SECRET || "", source: "env" };
  const conn = await getConn("meta");
  if (!conn?.accessToken) throw Object.assign(new Error("Facebook não conectado — conecte em Integrações no painel da agência (variável META_ACCESS_TOKEN não configurada)"), { status: 503 });
  const a = await apps();
  return { token: conn.accessToken, secret: a.meta.appSecret, source: "oauth" };
}

// Refresh token do Google: env ou o login feito no painel
export async function googleAuth(ref) {
  const { c: clientId, login } = refOf(ref);
  const a = (await apps()).google;
  if (login) {
    if (!a.clientId || !a.clientSecret) throw Object.assign(new Error("Variável GOOGLE_ADS_CLIENT_ID não configurada"), { status: 503 });
    const L = await getLogin(login);
    if (!L?.refreshToken) throw Object.assign(new Error("Google não conectado — conecte de novo em Conexões."), { status: 503 });
    return { ...a, refreshToken: L.refreshToken, source: "login", loginCustomerId: "" };
  }
  const own = await getClientConn("google", clientId);
  const refreshToken = own?.refreshToken || process.env.GOOGLE_ADS_REFRESH_TOKEN || (await getConn("google"))?.refreshToken || "";
  const miss = (n) => Object.assign(new Error(`Variável ${n} não configurada`), { status: 503 });
  if (!a.clientId || !a.clientSecret) throw miss("GOOGLE_ADS_CLIENT_ID");
  if (!refreshToken) throw Object.assign(new Error("Google não conectado — conecte em Integrações no painel da agência (variável GOOGLE_ADS_REFRESH_TOKEN não configurada)"), { status: 503 });
  // login próprio do cliente: a MCC da agência não se aplica (cada conta diz por qual gerente é acessada)
  return { ...a, refreshToken, source: own?.refreshToken ? "client" : "agency", loginCustomerId: own?.refreshToken ? "" : a.loginCustomerId };
}
