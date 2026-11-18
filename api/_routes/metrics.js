// GET /api/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD[&split=YYYY-MM-DD]
// split = início do período atual; antes dele é o período de comparação (para o alcance não somável).
// Devolve linhas normalizadas (dia × campanha) de Google Ads e Meta Ads do cliente logado.
import { json, fail } from "../_lib/http.js";
import { findById } from "../_lib/clients.js";
import { getSession } from "../_lib/session.js";
import { cached } from "../_lib/cache.js";
import { fetchGoogleAds } from "../_lib/google-ads.js";
import { readScriptData, scriptRows } from "../_lib/ads-script.js";
import { fetchMetaAds, fetchMetaSummary } from "../_lib/meta-ads.js";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 400;

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Método não permitido" });
  try {
    const session = getSession(req);
    const client = session && (await findById(session.sub));
    if (!client) return json(res, 401, { error: "Sessão expirada. Entre novamente." });

    const url = new URL(req.url, "http://x");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!ISO.test(from || "") || !ISO.test(to || "")) return json(res, 400, { error: "Período inválido." });
    const days = (Date.parse(to) - Date.parse(from)) / 864e5;
    if (!(days >= 0 && days <= MAX_DAYS)) return json(res, 400, { error: `Período deve ter entre 1 e ${MAX_DAYS} dias.` });

    const jobs = {};
    // Google: API oficial; se ela recusar (token ainda em teste, por exemplo), usa o que o script da conta enviou
    const script = await readScriptData(client.id);
    if (client.googleAds?.customerId || script) {
      jobs.google = (async () => {
        if (client.googleAds?.customerId) {
          try { return await cached(`g:${client.id}:${client.googleAds.customerId}:${from}:${to}`, () => fetchGoogleAds(client.googleAds, from, to, client.id)); }
          catch (e) { if (!script) throw e; console.warn(`[metrics] google API recusou para ${client.id}; usando o script`); }
        }
        return scriptRows(script, from, to);
      })();
    }
    if (client.metaAds?.adAccountId) {
      jobs.meta = cached(`m:${client.id}:${client.metaAds.adAccountId}:${JSON.stringify(client.metaAds.resultActionTypes || [])}:${from}:${to}`, () => fetchMetaAds(client.metaAds, from, to, client.id));
    }

    const names = Object.keys(jobs);
    const settled = await Promise.allSettled(Object.values(jobs));
    const rows = [];
    const sources = {};
    settled.forEach((r, i) => {
      const name = names[i];
      if (r.status === "fulfilled") {
        rows.push(...r.value);
        sources[name] = { ok: true };
      } else {
        console.error(`[metrics] ${name} falhou para ${client.id}:`, r.reason);
        sources[name] = { ok: false, error: `Não foi possível atualizar ${name === "google" ? "Google Ads" : "Meta Ads"} agora.` };
      }
    });

    // Alcance único do período (só Meta entrega pessoas únicas de forma confiável)
    let summary = null;
    const split = url.searchParams.get("split");
    if (client.metaAds?.adAccountId && sources.meta?.ok) {
      const curFrom = ISO.test(split || "") && split >= from && split <= to ? split : from;
      const prevTo = new Date(Date.parse(curFrom) - 864e5).toISOString().slice(0, 10);
      const [cur, prev] = await Promise.allSettled([
        cached(`ms:${client.metaAds.adAccountId}:${curFrom}:${to}`, () => fetchMetaSummary(client.metaAds, curFrom, to, client.id)),
        curFrom > from ? cached(`ms:${client.metaAds.adAccountId}:${from}:${prevTo}`, () => fetchMetaSummary(client.metaAds, from, prevTo, client.id)) : Promise.resolve(null),
      ]);
      summary = {
        current: cur.status === "fulfilled" ? cur.value : null,
        previous: prev.status === "fulfilled" ? prev.value : null,
      };
    }

    return json(res, 200, { from, to, updatedAt: new Date().toISOString(), sources, rows, summary });
  } catch (err) {
    return fail(res, err);
  }
}
