// POST /api/ingest?k=chave — recebe os resultados enviados pelo script do Google Ads de um cliente.
import { json, readBody, fail } from "../_lib/http.js";
import { findById, invalidateClients } from "../_lib/clients.js";
import { writeClient } from "../_lib/store.js";
import { readIngestKey, saveScriptData } from "../_lib/ads-script.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Use POST" });
  try {
    const k = readIngestKey(new URL(req.url, "http://x").searchParams.get("k"));
    if (!k) return json(res, 401, { error: "Chave inválida. Copie o script de novo no painel." });
    const c = await findById(k.c);
    if (!c) return json(res, 404, { error: "Cliente não encontrado no painel." });
    const body = await readBody(req);
    const r = await saveScriptData(k.c, body);
    // cliente sem conta do Google vinculada: vincula a conta de onde o script está enviando
    const id = String(body?.account?.id || "").replace(/\D/g, "");
    if (!c.googleAds?.customerId && id.length === 10 && c.source !== "env") {
      const next = { ...c, googleAds: { customerId: id.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3"), name: String(body.account.name || "").slice(0, 120) }, updatedAt: new Date().toISOString() };
      delete next.source;
      await writeClient(next);
      invalidateClients();
    }
    return json(res, 200, { ok: true, ...r });
  } catch (err) {
    return fail(res, err);
  }
}
