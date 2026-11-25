// Cadastro de clientes: painel da agência (banco KV) + CLIENTS_JSON (variável de ambiente, opcional).
// Se o mesmo id existir nos dois, vale o do painel.
import crypto from "node:crypto";
import { readClients } from "./store.js";
import { adsOf } from "./ads-accounts.js";

let cache = { at: 0, list: null };
const TTL = 10_000;

export function invalidateClients() { cache = { at: 0, list: null }; }

export async function loadClients() {
  if (cache.list && Date.now() - cache.at < TTL) return cache.list;
  let envList = [];
  if (process.env.CLIENTS_JSON) {
    try { envList = JSON.parse(process.env.CLIENTS_JSON); } catch { console.error("[clients] CLIENTS_JSON inválido"); }
  }
  const dbList = await readClients();
  const map = new Map();
  [...envList, ...dbList].forEach((c) => c?.id && map.set(c.id, { ...c, source: dbList.includes(c) ? "painel" : "env" }));
  cache = { at: Date.now(), list: [...map.values()] };
  return cache.list;
}

export async function findByEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  return (await loadClients()).find((c) => String(c.email).toLowerCase() === e && c.active !== false) || null;
}
// Inclui perfis bloqueados ou aguardando liberação (o login decide a mensagem)
export async function findByEmailAny(email) {
  const e = String(email || "").trim().toLowerCase();
  return (await loadClients()).find((c) => String(c.email).toLowerCase() === e) || null;
}
// Login aceita o e-mail ou o nome de usuário do cliente
export const normUser = (v) => String(v || "").trim().toLowerCase().replace(/^@/, "");
export async function findByLogin(id) {
  const e = normUser(id);
  if (!e) return null;
  return (await loadClients()).find((c) => String(c.email).toLowerCase() === e || (c.username && c.username === e)) || null;
}
export async function findById(id) {
  return (await loadClients()).find((c) => c.id === id) || null;
}

/* ---------- Senhas ---------- */
const ITER = 210000;
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(String(password), salt, ITER, 32, "sha256");
  return `pbkdf2_sha256$${ITER}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

// Formato: pbkdf2_sha256$<iterações>$<salt base64>$<hash base64>
export function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") { burn(password); return false; }
  const [, iter, salt, hash] = parts;
  const expected = Buffer.from(hash, "base64");
  const got = crypto.pbkdf2Sync(String(password), Buffer.from(salt, "base64"), parseInt(iter, 10), expected.length, "sha256");
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}

// Gasta o mesmo tempo quando o e-mail não existe (não revela quais e-mails estão cadastrados)
export function burn(password) {
  crypto.pbkdf2Sync(String(password || ""), "renowa-dummy-salt", ITER, 32, "sha256");
}

/* ---------- O que o navegador do cliente pode ver ---------- */
const PROFILES = ["awareness", "leads", "sales"];

export function connectedAccounts(c, ads = adsOf(c)) {
  const out = ads.map((a) => ({ platform: a.p, label: a.p === "google" ? "Google Ads" : "Meta Ads", name: a.name || "", id: a.id, ...(a.hidden ? { hidden: true } : {}) }));
  if (c.facebook?.pageId) out.push({ platform: "facebook", label: "Facebook", name: c.facebook.name || "", id: c.facebook.pageId });
  if (c.instagram?.userId) out.push({ platform: "instagram", label: "Instagram", name: c.instagram.username ? `@${c.instagram.username}` : "", id: c.instagram.userId });
  return out;
}

export function publicProfile(c, viewer = "client", ads = adsOf(c)) {
  const sheets = c.sheets || {};
  return {
    id: c.id,
    name: c.name,
    contact: c.contactName || null,
    profile: PROFILES.includes(c.profile) ? c.profile : "leads",
    resultLabel: c.resultLabel || (c.profile === "sales" ? "Vendas" : "Contatos"),
    currency: c.currency || "BRL",
    city: c.city?.population ? { name: c.city.name || "", population: Number(c.city.population) } : null,
    platforms: { google: ads.some((a) => a.p === "google"), meta: ads.some((a) => a.p === "meta") },
    accounts: connectedAccounts(c, ads).map(({ platform, label, name, hidden }) => ({ platform, label, name, ...(hidden ? { hidden: true } : {}) })),
    has: {
      instagram: !!c.instagram?.userId,
      facebook: !!c.facebook?.pageId,
      youtube: !!c.youtube?.channelId,
      calendar: c.calendar !== false,
      sales: !!sheets.sales,
      reports: !!sheets.reports,
    },
    salesFormUrl: /^https:\/\//.test(c.salesFormUrl || "") ? c.salesFormUrl : null,
    agencyWhatsapp: String(process.env.AGENCY_WHATSAPP || "").replace(/\D/g, "") || null,
    note: c.note || null,
    viewer,
  };
}

// Versão para o painel da agência (sem o hash da senha)
export function adminView(c) {
  const { passwordHash, ...rest } = c;
  return { ...rest, hasPassword: !!passwordHash };
}
