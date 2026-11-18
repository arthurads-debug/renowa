// POST /api/ingest?k=chave — recebe os resultados enviados pelo script do Google Ads de um cliente.
import { json, readBody, fail } from "../_lib/http.js";
import { findById } from "../_lib/clients.js";
import { readIngestKey, saveScriptData } from "../_lib/ads-script.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Use POST" });
  try {
    const k = readIngestKey(new URL(req.url, "http://x").searchParams.get("k"));
    if (!k) return json(res, 401, { error: "Chave inválida. Copie o script de novo no painel." });
    if (!(await findById(k.c))) return json(res, 404, { error: "Cliente não encontrado no painel." });
    const r = await saveScriptData(k.c, await readBody(req));
    return json(res, 200, { ok: true, ...r });
  } catch (err) {
    return fail(res, err);
  }
}
