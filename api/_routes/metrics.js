// GET /api/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD[&split=YYYY-MM-DD]
// split = início do período atual; antes dele é o período de comparação (para o alcance não somável).
// Junta as linhas (dia × campanha) de TODAS as contas de anúncio escolhidas para o cliente (Google e Meta).
import { json, fail } from "../_lib/http.js";
import { findById } from "../_lib/clients.js";
import { getSession } from "../_lib/session.js";
import { cached } from "../_lib/cache.js";
import { fetchGoogleAds } from "../_lib/google-ads.js";
import { fetchMetaAds, fetchMetaSummary } from "../_lib/meta-ads.js";
import { readScriptData, scriptRows } from "../_lib/ads-script.js";
import { adsOf } from "../_lib/ads-accounts.js";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 400;
const LABEL = { google: "Google Ads", meta: "Meta Ads" };

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

    const accounts = adsOf(client);
    const metaCfg = { ...(client.metaAds || {}), ...(client.metaConfig || {}) };
    const script = await readScriptData(client.id);
    const jobs = accounts.map((a) => {
      const ref = { c: client.id, login: a.login || "" };
      if (a.p === "google") {
        return (async () => {
          try { return await cached(`g:${client.id}:${a.login}:${a.id}:${from}:${to}`, () => fetchGoogleAds({ customerId: a.id, loginCustomerId: a.loginCustomerId }, from, to, ref)); }
          catch (e) { if (script) return scriptRows(script, from, to); throw e; } // plano B: script do Google Ads
        })();
      }
      const acc = { adAccountId: a.id, resultActionTypes: metaCfg.resultActionTypes, revenueActionTypes: metaCfg.revenueActionTypes };
      return cached(`m:${client.id}:${a.login}:${a.id}:${JSON.stringify(acc.resultActionTypes || [])}:${from}:${to}`, () => fetchMetaAds(acc, from, to, ref));
    });
    if (!accounts.some((a) => a.p === "google") && script) jobs.push(Promise.resolve(scriptRows(script, from, to))), accounts.push({ p: "google", id: "script" });

    const settled = await Promise.allSettled(jobs);
    const rows = [];
    const sources = {};
    settled.forEach((r, i) => {
      const a = accounts[i];
      const s = (sources[a.p] ||= { ok: true, accounts: 0, failed: 0 });
      s.accounts++;
      if (r.status === "fulfilled") rows.push(...r.value.map((x) => ({ ...x, account: a.name || a.id })));
      else { console.error(`[metrics] ${a.p} ${a.id} falhou para ${client.id}:`, r.reason); s.failed++; }
    });
    for (const [p, s] of Object.entries(sources)) {
      if (s.failed) { s.ok = s.failed < s.accounts; s.error = s.failed === s.accounts ? `Não foi possível atualizar ${LABEL[p]} agora.` : `${s.failed} de ${s.accounts} contas de ${LABEL[p]} não responderam agora.`; }
    }

    // Alcance único do período (Meta): soma por conta (aproximação quando há mais de uma conta)
    let summary = null;
    const metaAccs = accounts.filter((a) => a.p === "meta");
    if (metaAccs.length && sources.meta?.ok) {
      const split = url.searchParams.get("split");
      const curFrom = ISO.test(split || "") && split >= from && split <= to ? split : from;
      const prevTo = new Date(Date.parse(curFrom) - 864e5).toISOString().slice(0, 10);
      const sum = async (f, t) => {
        const parts = await Promise.allSettled(metaAccs.map((a) => cached(`ms:${a.login}:${a.id}:${f}:${t}`, () => fetchMetaSummary({ adAccountId: a.id }, f, t, { c: client.id, login: a.login || "" }))));
        const ok = parts.filter((p) => p.status === "fulfilled").map((p) => p.value);
        if (!ok.length) return null;
        const reach = ok.reduce((s, x) => s + x.reach, 0);
        const imp = ok.reduce((s, x) => s + x.reach * x.frequency, 0);
        return { reach, frequency: reach ? imp / reach : 0 };
      };
      const [cur, prev] = await Promise.all([sum(curFrom, to), curFrom > from ? sum(from, prevTo) : Promise.resolve(null)]);
      summary = { current: cur, previous: prev };
    }

    return json(res, 200, { from, to, updatedAt: new Date().toISOString(), sources, rows, summary });
  } catch (err) {
    return fail(res, err);
  }
}
