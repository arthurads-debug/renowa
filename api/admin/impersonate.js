// POST /api/admin/impersonate {id} — a agência abre o painel exatamente como o cliente vê.
import { json, readBody, fail } from "../_lib/http.js";
import { requireAdmin } from "../_lib/admin.js";
import { findById } from "../_lib/clients.js";
import { setSession } from "../_lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método não permitido" });
  try {
    if (!requireAdmin(req, res)) return;
    const { id } = await readBody(req);
    const client = await findById(id);
    if (!client) return json(res, 404, { error: "Cliente não encontrado." });
    setSession(res, client.id, { by: "admin" });
    return json(res, 200, { ok: true });
  } catch (err) {
    return fail(res, err);
  }
}
