// /api/lead — rota PÚBLICA que recebe as aplicações do questionário do site e grava no CRM.
import { json, readBody, fail } from "./_lib/http.js";
import { cleanApplication } from "./_lib/leads.js";
import { writeLead, hitRateLimit, storeEnabled } from "./_lib/store.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Método não permitido" });

    // Só aceita envios do próprio site
    const origin = req.headers.origin;
    if (origin) {
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      try { if (new URL(origin).host !== host) return json(res, 403, { error: "Origem não permitida." }); }
      catch { return json(res, 403, { error: "Origem não permitida." }); }
    }
    if (!storeEnabled()) return json(res, 503, { error: "Não conseguimos registrar agora. Fale com a gente pelo WhatsApp." });

    const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
    if (await hitRateLimit(ip)) return json(res, 429, { error: "Muitos envios seguidos. Tente de novo em alguns minutos." });

    const body = await readBody(req);
    if (JSON.stringify(body).length > 8000) return json(res, 413, { error: "Envio grande demais." });
    if (body.empresa_site) return json(res, 200, { ok: true }); // campo-isca: robôs preenchem, pessoas não veem

    const lead = cleanApplication(body);
    await writeLead(lead);

    // Aviso opcional para a equipe (Make, Zapier, n8n, Slack, Discord…)
    if (process.env.LEAD_NOTIFY_WEBHOOK) {
      fetch(process.env.LEAD_NOTIFY_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evento: "nova_aplicacao", ...lead, historico: undefined }),
      }).catch((e) => console.error("[lead] aviso falhou", e));
    }
    return json(res, 200, { ok: true, perfil: lead.perfil });
  } catch (err) {
    return fail(res, err, "Não conseguimos registrar agora. Tente novamente.");
  }
}
