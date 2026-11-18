// GET /api/youtube?from=&to=&prevFrom=&prevTo= — canal do YouTube do cliente logado.
import { json, fail } from "../_lib/http.js";
import { findById } from "../_lib/clients.js";
import { getSession } from "../_lib/session.js";
import { cached } from "../_lib/cache.js";
import { fetchYouTube } from "../_lib/youtube.js";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Método não permitido" });
  try {
    const session = getSession(req);
    const client = session && (await findById(session.sub));
    if (!client) return json(res, 401, { error: "Sessão expirada. Entre novamente." });
    if (!client.youtube?.channelId) return json(res, 200, { connected: false });
    const q = new URL(req.url, "http://x").searchParams;
    const [from, to, pf, pt] = ["from", "to", "prevFrom", "prevTo"].map((k) => q.get(k) || "");
    if (!ISO.test(from) || !ISO.test(to)) return json(res, 400, { error: "Período inválido." });
    const prev = ISO.test(pf) && ISO.test(pt) ? [pf, pt] : [null, null];
    try {
      const d = await cached(`yt:${client.id}:${client.youtube.channelId}:${from}:${to}:${prev[0]}`, () => fetchYouTube(client.youtube, from, to, ...prev), 15 * 60_000);
      const { analyticsError, ...rest } = d;
      if (analyticsError) console.warn("[youtube] analytics", client.id, analyticsError);
      return json(res, 200, { connected: true, ...rest, partial: !!analyticsError });
    } catch (e) {
      console.error("[youtube]", client.id, e);
      return json(res, 200, { connected: true, error: "Não foi possível consultar o YouTube agora. Tente atualizar em alguns minutos." });
    }
  } catch (err) {
    return fail(res, err);
  }
}
