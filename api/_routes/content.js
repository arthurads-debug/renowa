// GET /api/content — calendário editorial, vendas informadas e relatórios mensais (Google Sheets).
import { json, fail } from "../_lib/http.js";
import { findById } from "../_lib/clients.js";
import { getSession } from "../_lib/session.js";
import { cached } from "../_lib/cache.js";
import { fetchCalendar, fetchSales, fetchReports } from "../_lib/sheets.js";

const TTL = 120_000; // planilhas mudam com frequência: 2 min

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Método não permitido" });
  try {
    const session = getSession(req);
    const client = session && (await findById(session.sub));
    if (!client) return json(res, 401, { error: "Sessão expirada. Entre novamente." });

    const s = client.sheets || {};
    const jobs = {
      calendar: s.calendar ? cached(`cal:${s.calendar}`, () => fetchCalendar(s.calendar), TTL) : null,
      sales: s.sales ? cached(`sal:${s.sales}`, () => fetchSales(s.sales), TTL) : null,
      reports: s.reports ? cached(`rep:${s.reports}`, () => fetchReports(s.reports), TTL) : null,
    };
    const out = { calendar: null, sales: null, reports: null, errors: [] };
    await Promise.all(Object.entries(jobs).map(async ([k, p]) => {
      if (!p) return;
      try { out[k] = await p; }
      catch (e) { console.error(`[content] ${k} ${client.id}:`, e); out.errors.push(k); }
    }));
    return json(res, 200, out);
  } catch (err) {
    return fail(res, err);
  }
}
