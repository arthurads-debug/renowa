// GET /api/admin/accounts[?cliente=id] — contas disponíveis para vincular a um cliente.
// Com ?cliente=, usa o login do Google/Facebook daquele cliente (se ele conectou); sem ele, o da agência.
import { json, fail } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/admin.js";
import { cached } from "../../_lib/cache.js";
import { listGoogleAccounts, explainGoogleError } from "../../_lib/google-ads.js";
import { listMetaAdAccounts, listPages } from "../../_lib/meta-ads.js";

const TTL = 10 * 60_000;

async function safe(name, fn, explain) {
  try { return { items: await fn() }; }
  catch (e) {
    console.error(`[accounts] ${name}:`, e);
    const m = String(e.message || "");
    return { items: [], error: explain ? explain(e) : /não configurada|não conectado/i.test(m) ? "Facebook ainda não conectado para este cliente." : `Não foi possível listar ${name}. Tente Conectar de novo.` };
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Método não permitido" });
  try {
    if (!requireAdmin(req, res)) return;
    const url = new URL(req.url, "http://x");
    const ttl = url.searchParams.get("fresh") === "1" ? 0 : TTL;
    const cid = url.searchParams.get("cliente") || undefined;
    const k = cid || "_agencia";
    const [google, meta, pages] = await Promise.all([
      safe("as contas do Google Ads", () => cached(`adm:google:${k}`, () => listGoogleAccounts(cid), ttl), explainGoogleError),
      safe("as contas de anúncio da Meta", () => cached(`adm:meta:${k}`, () => listMetaAdAccounts(cid), ttl)),
      safe("as páginas do Facebook", () => cached(`adm:pages:${k}`, () => listPages(cid), ttl)),
    ]);
    const instagram = { items: pages.items.filter((p) => p.instagram).map((p) => ({ ...p.instagram, page: p.name, pageId: p.id })), error: pages.error };
    return json(res, 200, { google, meta, pages, instagram });
  } catch (err) {
    return fail(res, err);
  }
}
