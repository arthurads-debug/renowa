// POST /api/ingest?k=chave — recebe os resultados enviados pelo script do Google Ads de um cliente.
import { json, readBody, fail } from "../_lib/http.js";
import { findById, invalidateClients } from "../_lib/clients.js";
import { writeClient } from "../_lib/store.js";
import { readIngestKey, saveScriptData, saveScriptStatus } from "../_lib/ads-script.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Use POST" });
  try {
    const k = readIngestKey(new URL(req.url, "http://x").searchParams.get("k"));
    if (!k) return json(res, 401, { error: "Chave inválida. Copie o script de novo no painel." });
    const c = await findById(k.c);
    if (!c) return json(res, 404, { error: "Cliente não encontrado no painel." });
    const body = await readBody(req);
    const n = Array.isArray(body?.rows) ? body.rows.length : 0;
    const detail = Array.isArray(body?.contas) ? body.contas.slice(0, 20).map((x) => String(x).slice(0, 160)) : [];
    if (body?.error || !n) {
      // não sobrescreve números bons com um envio vazio; só registra o que aconteceu
      await saveScriptStatus(k.c, { ok: false, error: String(body?.error || "Nenhuma campanha com impressões nos últimos 400 dias nesta conta.").slice(0, 400), account: body?.account || null, detail });
      return json(res, 200, { ok: false, rows: 0 });
    }
    const r = await saveScriptData(k.c, body);
    await saveScriptStatus(k.c, { ok: true, rows: r.rows, account: body?.account || null, detail });
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
