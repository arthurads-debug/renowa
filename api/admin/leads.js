// /api/admin/leads — CRM da agência. GET lista · PATCH atualiza etapa/valor/nota · DELETE ?id= remove
import { json, readBody, fail } from "../_lib/http.js";
import { requireAdmin } from "../_lib/admin.js";
import { readLeads, readLead, writeLead, removeLead } from "../_lib/store.js";
import { applyUpdate } from "../_lib/leads.js";

export default async function handler(req, res) {
  try {
    const s = requireAdmin(req, res);
    if (!s) return;

    if (req.method === "GET") {
      const leads = (await readLeads()).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
      return json(res, 200, { leads });
    }

    if (req.method === "PATCH") {
      const input = await readBody(req);
      const lead = await readLead(String(input.id || ""));
      if (!lead) return json(res, 404, { error: "Lead não encontrado." });
      applyUpdate(lead, input, s.sub);
      await writeLead(lead);
      return json(res, 200, { lead });
    }

    if (req.method === "DELETE") {
      const id = new URL(req.url, "http://x").searchParams.get("id");
      if (!id) return json(res, 400, { error: "Informe o lead." });
      await removeLead(id);
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { error: "Método não permitido" });
  } catch (err) {
    return fail(res, err);
  }
}
