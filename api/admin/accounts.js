// GET /api/admin/accounts — contas disponíveis para vincular a um cliente:
// Google Ads (sob a MCC da agência), contas de anúncio da Meta, Páginas do Facebook e Instagram ligados.
import { json, fail } from "../_lib/http.js";
import { requireAdmin } from "../_lib/admin.js";
import { cached } from "../_lib/cache.js";
import { listGoogleAccounts } from "../_lib/google-ads.js";
import { listMetaAdAccounts, listPages } from "../_lib/meta-ads.js";

const TTL = 10 * 60_000;

async function safe(name, fn) {
  try { return { items: await fn() }; }
  catch (e) { console.error(`[accounts] ${name}:`, e); return { items: [], error: e.message.includes("não configurada") ? e.message : `Não foi possível listar ${name}. Confira as credenciais.` }; }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Método não permitido" });
  try {
    if (!requireAdmin(req, res)) return;
    const fresh = new URL(req.url, "http://x").searchParams.get("fresh") === "1";
    const ttl = fresh ? 0 : TTL;
    const [google, meta, pages] = await Promise.all([
      safe("as contas do Google Ads", () => cached("adm:google", listGoogleAccounts, ttl)),
      safe("as contas de anúncio da Meta", () => cached("adm:meta", listMetaAdAccounts, ttl)),
      safe("as páginas do Facebook", () => cached("adm:pages", listPages, ttl)),
    ]);
    const instagram = { items: pages.items.filter((p) => p.instagram).map((p) => ({ ...p.instagram, page: p.name, pageId: p.id })), error: pages.error };
    return json(res, 200, { google, meta, pages, instagram });
  } catch (err) {
    return fail(res, err);
  }
}
