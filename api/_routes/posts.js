// POST /api/posts — o cliente aprova ou pede ajuste de uma publicação, direto no painel.
// { id, decision: "aprovar" | "ajuste", note }
import { json, readBody, fail } from "../_lib/http.js";
import { findById } from "../_lib/clients.js";
import { getSession } from "../_lib/session.js";
import { readPost, writePost } from "../_lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método não permitido" });
  try {
    const session = getSession(req);
    const client = session && (await findById(session.sub));
    if (!client || client.active === false) return json(res, 401, { error: "Sessão expirada. Entre novamente." });
    if (session.by === "admin") return json(res, 403, { error: "Você está vendo como cliente: a aprovação é feita pelo próprio cliente." });
    const { id, decision, note } = await readBody(req);
    const post = id && (await readPost(client.id, String(id)));
    if (!post) return json(res, 404, { error: "Publicação não encontrada." });
    if (post.status !== "aprovacao") return json(res, 409, { error: "Esta publicação não está aguardando aprovação." });
    const text = String(note || "").trim().slice(0, 1000);
    if (decision === "ajuste" && !text) return json(res, 400, { error: "Conte o que precisa mudar." });
    const now = new Date().toISOString();
    const next = decision === "aprovar"
      ? { ...post, status: "aprovado", feedback: { type: "aprovado", note: text, at: now, by: client.contactName || client.name } }
      : { ...post, status: "producao", feedback: { type: "ajuste", note: text, at: now, by: client.contactName || client.name } };
    next.updatedAt = now;
    await writePost(client.id, next);
    return json(res, 200, { post: next });
  } catch (err) {
    return fail(res, err);
  }
}
