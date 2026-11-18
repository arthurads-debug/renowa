// GET /api/connect?t=convite — página pública /conectar: o cliente conecta o próprio Google e Facebook.
// Só devolve o nome do cliente e o que já está conectado (nada de tokens ou números).
import { json, fail } from "../_lib/http.js";
import { findById } from "../_lib/clients.js";
import { apps, getClientConn } from "../_lib/connections.js";
import { readInvite } from "./oauth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Método não permitido" });
  try {
    const inv = readInvite(new URL(req.url, "http://x").searchParams.get("t"));
    if (!inv) return json(res, 401, { error: "Este link expirou ou está incompleto. Peça um link novo para a agência." });
    const c = await findById(inv.c);
    if (!c) return json(res, 404, { error: "Cliente não encontrado." });
    const [a, g, m] = await Promise.all([apps(), getClientConn("google", c.id), getClientConn("meta", c.id)]);
    return json(res, 200, {
      name: c.name,
      google: { ready: !!(a.google.clientId && a.google.developerToken), connected: !!g?.refreshToken, account: c.googleAds?.name || "" },
      meta: { ready: !!(a.meta.appId && a.meta.appSecret), connected: !!m?.accessToken, account: c.metaAds?.name || c.facebook?.name || "" },
    });
  } catch (err) {
    return fail(res, err);
  }
}
