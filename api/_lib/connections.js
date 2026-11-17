// Conexões da agência com Meta (Facebook/Instagram) e Google Ads, feitas por login (OAuth) no /admin.
// Prioridade: variáveis de ambiente (se existirem) → configuração salva pelo painel (banco KV).
// Nada daqui vai para o navegador: o painel só recebe "conectado como Fulano".
import { kvGetJSON, kvSetJSON, kvDel, storeEnabled } from "./store.js";

const KEYS = { meta: "renowa:conn:meta", google: "renowa:conn:google", apps: "renowa:apps" };
const memo = new Map(); // cache curto por instância
const TTL = 30_000;

async function read(key) {
  const hit = memo.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;
  const value = storeEnabled() ? await kvGetJSON(key).catch(() => null) : null;
  memo.set(key, { value, exp: Date.now() + TTL });
  return value;
}
async function write(key, value) {
  if (value == null) await kvDel(key); else await kvSetJSON(key, value);
  memo.delete(key);
}

export const getConn = (provider) => read(KEYS[provider]);
export const setConn = (provider, value) => write(KEYS[provider], value);
export const delConn = (provider) => write(KEYS[provider], null);

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
export async function metaAuth() {
  if (process.env.META_ACCESS_TOKEN) return { token: process.env.META_ACCESS_TOKEN, secret: process.env.META_APP_SECRET || "", source: "env" };
  const conn = await getConn("meta");
  if (!conn?.accessToken) throw Object.assign(new Error("Facebook não conectado — conecte em Integrações no painel da agência (variável META_ACCESS_TOKEN não configurada)"), { status: 503 });
  const a = await apps();
  return { token: conn.accessToken, secret: a.meta.appSecret, source: "oauth" };
}

// Refresh token do Google: env ou o login feito no painel
export async function googleAuth() {
  const a = (await apps()).google;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || (await getConn("google"))?.refreshToken || "";
  const miss = (n) => Object.assign(new Error(`Variável ${n} não configurada`), { status: 503 });
  if (!a.clientId || !a.clientSecret) throw miss("GOOGLE_ADS_CLIENT_ID");
  if (!a.developerToken) throw miss("GOOGLE_ADS_DEVELOPER_TOKEN");
  if (!refreshToken) throw Object.assign(new Error("Google não conectado — conecte em Integrações no painel da agência (variável GOOGLE_ADS_REFRESH_TOKEN não configurada)"), { status: 503 });
  return { ...a, refreshToken };
}
