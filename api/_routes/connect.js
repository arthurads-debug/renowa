// /api/connect?t=convite — página pública /conectar (o próprio cliente conecta e escolhe as contas).
// GET: nome do cliente, se os botões estão ativos, os logins que ELE conectou (com as contas) e o que já está escolhido.
// POST { t, ads: [{ p, login, id }], page?: { login, id } }: salva a escolha (só contas desses logins).
import { json, readBody, fail } from "../_lib/http.js";
import { findById, invalidateClients } from "../_lib/clients.js";
import { writeClient } from "../_lib/store.js";
import { apps, getLogins } from "../_lib/connections.js";
import { adsOf } from "../_lib/ads-accounts.js";
import { readInvite } from "./oauth.js";

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://x");
    const body = req.method === "POST" ? await readBody(req) : {};
    const inv = readInvite(url.searchParams.get("t") || body.t);
    if (!inv) return json(res, 401, { error: "Este link expirou ou está incompleto. Peça um link novo para a agência." });
    const c = await findById(inv.c);
    if (!c) return json(res, 404, { error: "Cliente não encontrado." });
    const mine = Object.values(await getLogins()).filter((L) => L.clientId === c.id);

    if (req.method === "GET") {
      const a = await apps();
      return json(res, 200, {
        name: c.name,
        ready: { google: !!(a.google.clientId && a.google.clientSecret), meta: !!(a.meta.appId && a.meta.appSecret) },
        logins: mine.map((L) => ({ id: L.id, provider: L.provider, label: L.label, accounts: (L.accounts || []).map(({ id, name, status }) => ({ id, name, status })), pages: (L.pages || []).map((p) => ({ id: p.id, name: p.name, instagram: p.instagram ? { id: p.instagram.id, username: p.instagram.username } : null })), error: L.error ? "Não consegui ler as contas deste login. Tente conectar de novo." : null })),
        selected: adsOf(c).map((x) => `${x.p}:${x.id}`),
        page: c.facebook?.pageId || null,
      });
    }
    if (req.method === "POST") {
      const byId = Object.fromEntries(mine.map((L) => [L.id, L]));
      const chosen = [];
      for (const s of Array.isArray(body.ads) ? body.ads.slice(0, 30) : []) {
        const L = byId[s?.login];
        const acc = L?.accounts?.find((x) => x.id === s.id);
        if (acc) chosen.push({ p: L.provider, login: L.id, id: acc.id, name: acc.name, loginCustomerId: acc.loginCustomerId || "", currency: acc.currency || "" });
      }
      const mineIds = new Set(mine.map((L) => L.id));
      const next = { ...c, ads: [...adsOf(c).filter((x) => x.login && !mineIds.has(x.login)), ...chosen], updatedAt: new Date().toISOString() };
      const pg = body.page && byId[body.page.login]?.pages?.find((p) => p.id === body.page.id);
      if (pg) {
        next.facebook = { pageId: pg.id, name: pg.name, login: body.page.login };
        if (pg.instagram) next.instagram = { userId: pg.instagram.id, username: pg.instagram.username, login: body.page.login };
      }
      delete next.source;
      await writeClient(next);
      invalidateClients();
      return json(res, 200, { ok: true, count: chosen.length });
    }
    return json(res, 405, { error: "Método não permitido" });
  } catch (err) {
    return fail(res, err);
  }
}
