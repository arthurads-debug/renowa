// GET /api/social?from=YYYY-MM-DD&to=YYYY-MM-DD — Instagram e Página do Facebook do cliente.
import { json, fail } from "./_lib/http.js";
import { findById } from "./_lib/clients.js";
import { getSession } from "./_lib/session.js";
import { cached } from "./_lib/cache.js";
import { fetchInstagram } from "./_lib/instagram.js";
import { fetchFacebook } from "./_lib/facebook.js";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const TTL = 15 * 60_000;

async function one(name, enabled, fn) {
  if (!enabled) return { connected: false };
  try { return { connected: true, ...(await fn()) }; }
  catch (e) { console.error(`[social] ${name}:`, e); return { connected: true, error: `Não foi possível consultar o ${name} agora.`, posts: [] }; }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Método não permitido" });
  try {
    const session = getSession(req);
    const client = session && (await findById(session.sub));
    if (!client) return json(res, 401, { error: "Sessão expirada. Entre novamente." });

    const url = new URL(req.url, "http://x");
    const from = url.searchParams.get("from"), to = url.searchParams.get("to");
    if (!ISO.test(from || "") || !ISO.test(to || "")) return json(res, 400, { error: "Período inválido." });

    const [instagram, facebook] = await Promise.all([
      one("Instagram", !!client.instagram?.userId, () => cached(`ig:${client.id}:${client.instagram.userId}:${from}:${to}`, async () => {
        const d = await fetchInstagram(client.instagram, from, to);
        return { ...d, posts: d.posts.map((p) => ({ ...p, network: "instagram" })) };
      }, TTL)),
      one("Facebook", !!client.facebook?.pageId, () => cached(`fb:${client.id}:${client.facebook.pageId}:${from}:${to}`, () => fetchFacebook(client.facebook, from, to), TTL)),
    ]);
    return json(res, 200, { instagram, facebook });
  } catch (err) {
    return fail(res, err);
  }
}
