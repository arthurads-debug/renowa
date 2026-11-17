// Armazenamento do cadastro de clientes: Redis via REST (Upstash / Vercel KV pelo Marketplace).
// Na Vercel: Storage → Create → Upstash for Redis → conectar ao projeto (cria KV_REST_API_URL e KV_REST_API_TOKEN).
const URL_ = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "renowa:clients";

export const storeEnabled = () => !!(URL_() && TOKEN());

async function cmd(...args) {
  const res = await fetch(URL_(), {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN()}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Banco de dados: ${data.error || res.status}`);
  return data.result;
}

export async function readClients() {
  if (!storeEnabled()) return [];
  const flat = (await cmd("HGETALL", KEY)) || [];
  const out = [];
  for (let i = 0; i < flat.length; i += 2) {
    try { out.push(JSON.parse(flat[i + 1])); } catch { /* registro corrompido: ignora */ }
  }
  return out;
}

export async function writeClient(client) {
  if (!storeEnabled()) throw Object.assign(new Error("Banco de dados não configurado (KV_REST_API_URL / KV_REST_API_TOKEN)."), { status: 503, expose: true });
  await cmd("HSET", KEY, client.id, JSON.stringify(client));
}

export async function removeClient(id) {
  if (!storeEnabled()) throw Object.assign(new Error("Banco de dados não configurado."), { status: 503, expose: true });
  await cmd("HDEL", KEY, id);
}

/* ---------- Leads do CRM (aplicações do site) ---------- */
const LEADS = "renowa:leads";
const off = () => Object.assign(new Error("Banco de dados não configurado (KV_REST_API_URL / KV_REST_API_TOKEN)."), { status: 503, expose: true });

export async function readLeads() {
  if (!storeEnabled()) return [];
  const flat = (await cmd("HGETALL", LEADS)) || [];
  const out = [];
  for (let i = 0; i < flat.length; i += 2) {
    try { out.push(JSON.parse(flat[i + 1])); } catch { /* ignora */ }
  }
  return out;
}

export async function readLead(id) {
  if (!storeEnabled()) throw off();
  const raw = await cmd("HGET", LEADS, id);
  return raw ? JSON.parse(raw) : null;
}

export async function writeLead(lead) {
  if (!storeEnabled()) throw off();
  await cmd("HSET", LEADS, lead.id, JSON.stringify(lead));
}

export async function removeLead(id) {
  if (!storeEnabled()) throw off();
  await cmd("HDEL", LEADS, id);
}

// Limite simples de envios por IP (janela de 10 minutos)
export async function hitRateLimit(ip, max = 5) {
  if (!storeEnabled()) return false;
  const key = `renowa:rl:lead:${ip}:${Math.floor(Date.now() / 600000)}`;
  const n = await cmd("INCR", key);
  if (n === 1) await cmd("EXPIRE", key, 660);
  return n > max;
}

/* ---------- Valores simples (conexões, configurações) ---------- */
export async function kvGetJSON(key) {
  if (!storeEnabled()) return null;
  const raw = await cmd("GET", key);
  return raw ? JSON.parse(raw) : null;
}
export async function kvSetJSON(key, value) {
  if (!storeEnabled()) throw off();
  await cmd("SET", key, JSON.stringify(value));
}
export async function kvDel(key) {
  if (!storeEnabled()) throw off();
  await cmd("DEL", key);
}

/* ---------- Calendário editorial (um hash por cliente) ---------- */
const POSTS = (clientId) => `renowa:posts:${clientId}`;
export async function readPosts(clientId) {
  if (!storeEnabled()) return [];
  const flat = (await cmd("HGETALL", POSTS(clientId))) || [];
  const out = [];
  for (let i = 0; i < flat.length; i += 2) {
    try { out.push(JSON.parse(flat[i + 1])); } catch { /* ignora */ }
  }
  return out;
}
export async function readPost(clientId, id) {
  if (!storeEnabled()) throw off();
  const raw = await cmd("HGET", POSTS(clientId), id);
  return raw ? JSON.parse(raw) : null;
}
export async function writePost(clientId, post) {
  if (!storeEnabled()) throw off();
  await cmd("HSET", POSTS(clientId), post.id, JSON.stringify(post));
}
export async function removePost(clientId, id) {
  if (!storeEnabled()) throw off();
  await cmd("HDEL", POSTS(clientId), id);
}
