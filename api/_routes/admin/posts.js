// /api/admin/posts — calendário editorial montado pela agência (um calendário por cliente).
// GET ?client=  · POST { client, post } cria/atualiza · DELETE ?client=&id=
import crypto from "node:crypto";
import { json, readBody, fail } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/admin.js";
import { findById } from "../../_lib/clients.js";
import { readPosts, readPost, writePost, removePost } from "../../_lib/store.js";

export const NETWORKS = ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "WhatsApp", "Site/Blog"];
export const FORMATS = ["Post", "Carrossel", "Reels", "Stories", "Vídeo", "Live", "Artigo"];
export const STATUSES = ["planejado", "producao", "aprovacao", "aprovado", "publicado"];

const str = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const bad = (m) => Object.assign(new Error(m), { status: 400, expose: true });

export function cleanPost(input, existing) {
  const date = str(input.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw bad("Escolha a data da publicação.");
  const title = str(input.title, 120);
  if (!title) throw bad("Dê um título para a publicação.");
  const time = str(input.time, 5);
  const link = str(input.link, 600);
  return {
    id: existing?.id || crypto.randomBytes(6).toString("base64url"),
    date, time: /^\d{2}:\d{2}$/.test(time) ? time : "",
    network: NETWORKS.includes(input.network) ? input.network : "Instagram",
    format: FORMATS.includes(input.format) ? input.format : "Post",
    title,
    caption: str(input.caption, 2200),
    status: STATUSES.includes(input.status) ? input.status : "planejado",
    link: /^https:\/\//.test(link) ? link : "",
    boost: !!input.boost,
    notes: str(input.notes, 600),
    feedback: existing?.feedback || null,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  try {
    if (!requireAdmin(req, res)) return;
    const url = new URL(req.url, "http://x");
    if (req.method === "GET") {
      const client = url.searchParams.get("client");
      if (!client) return json(res, 400, { error: "Escolha um cliente." });
      const posts = (await readPosts(client)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      return json(res, 200, { posts, options: { networks: NETWORKS, formats: FORMATS, statuses: STATUSES } });
    }
    if (req.method === "POST") {
      const { client, post } = await readBody(req);
      if (!client || !(await findById(client))) return json(res, 404, { error: "Cliente não encontrado." });
      const existing = post?.id ? await readPost(client, post.id) : null;
      const clean = cleanPost(post || {}, existing);
      // status mudou pela agência: a resposta antiga do cliente deixa de valer
      if (existing && existing.status !== clean.status && clean.status === "aprovacao") clean.feedback = null;
      await writePost(client, clean);
      return json(res, 200, { post: clean });
    }
    if (req.method === "DELETE") {
      const client = url.searchParams.get("client"), id = url.searchParams.get("id");
      if (!client || !id) return json(res, 400, { error: "Publicação não encontrada." });
      await removePost(client, id);
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { error: "Método não permitido" });
  } catch (err) {
    return fail(res, err);
  }
}
