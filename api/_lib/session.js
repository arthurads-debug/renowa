// Sessões assinadas (HMAC-SHA256) em cookies HttpOnly. Sem banco de dados.
// portal_session → cliente (ou a agência "vendo como cliente") · admin_session → equipe da agência
import crypto from "node:crypto";

const CLIENT = "portal_session";
const ADMIN = "admin_session";
const MAX_AGE = 60 * 60 * 12; // 12h

// SESSION_SECRET tem prioridade. Sem ele, deriva uma chave da credencial do banco (KV/Upstash),
// que só existe no servidor: assim o login funciona assim que o banco é ligado na Vercel.
function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  const kv = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kv && kv.length >= 20) return crypto.createHash("sha256").update(`renowa-session:${kv}`).digest("base64url");
  throw Object.assign(new Error("SESSION_SECRET ausente ou curto (mínimo 32 caracteres)"), { status: 503 });
}
const mac = (body) => crypto.createHmac("sha256", secret()).update(body).digest("base64url");

export function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(body)}`;
}

export function verify(token) {
  if (!token || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(mac(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return p.exp && p.exp > Date.now() ? p : null;
  } catch { return null; }
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

const cookie = (name, value, maxAge) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

function append(res, value) {
  const prev = res.getHeader("Set-Cookie");
  res.setHeader("Set-Cookie", prev ? [].concat(prev, value) : value);
}

/* ---------- Cliente ---------- */
export function setSession(res, clientId, extra = {}) {
  append(res, cookie(CLIENT, sign({ sub: clientId, exp: Date.now() + MAX_AGE * 1000, ...extra }), MAX_AGE));
}
export const clearSession = (res) => append(res, cookie(CLIENT, "", 0));
export const getSession = (req) => verify(readCookie(req, CLIENT));

/* ---------- Agência ---------- */
export function setAdminSession(res, email) {
  append(res, cookie(ADMIN, sign({ sub: email, role: "admin", exp: Date.now() + MAX_AGE * 1000 }), MAX_AGE));
}
export const clearAdminSession = (res) => append(res, cookie(ADMIN, "", 0));
export function getAdminSession(req) {
  const s = verify(readCookie(req, ADMIN));
  return s?.role === "admin" ? s : null;
}
