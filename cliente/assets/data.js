// Camada de dados: fala com a API real ou com o modo demonstração.
import { demoMetrics, demoSocial, demoContent, demoYouTube } from "./demo.js";

export class SessionExpired extends Error {}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...opts });
  let data = null;
  try { data = await res.json(); } catch { /* sem corpo */ }
  return { status: res.status, ok: res.ok, data };
}

async function get(path) {
  const r = await api(path);
  if (r.status === 401) throw new SessionExpired(r.data?.error || "Sessão expirada.");
  if (!r.ok) throw new Error(r.data?.error || "Falha ao carregar os dados.");
  return r.data;
}

export function createSource(demo, client) {
  if (demo) {
    return {
      metrics: async (from, to, split) => { await wait(250); return demoMetrics(client, from, to, split); },
      social: async (from, to) => { await wait(200); return demoSocial(client, from, to); },
      content: async () => { await wait(150); return demoContent(client); },
      youtube: async (from, to, pf, pt) => { await wait(250); return demoYouTube(client, from, to, pf, pt); },
    };
  }
  return {
    metrics: (from, to, split) => get(`/api/metrics?from=${from}&to=${to}&split=${split}`),
    social: (from, to) => (client.has.instagram || client.has.facebook
      ? get(`/api/social?from=${from}&to=${to}`)
      : Promise.resolve({ instagram: { connected: false }, facebook: { connected: false } })),
    content: () => get("/api/content"),
    youtube: (from, to, pf, pt) => (client.has.youtube ? get(`/api/youtube?from=${from}&to=${to}&prevFrom=${pf}&prevTo=${pt}`) : Promise.resolve({ connected: false })),
  };
}
