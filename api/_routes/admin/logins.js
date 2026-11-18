// /api/admin/logins — logins do Google e do Facebook conectados e as contas que cada um enxerga.
// GET: lista (sem tokens) + se os botões de conexão estão ativos · POST { action: "refresh", id } · DELETE ?id=
import { json, readBody, fail } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/admin.js";
import { apps, getLogin, getLogins, saveLogin, removeLogin } from "../../_lib/connections.js";
import { discover, publicLogin } from "../../_lib/ads-accounts.js";
import { explainGoogleError } from "../../_lib/google-ads.js";
import { redirectUri } from "../oauth.js";

const explainFor = (p) => (p === "google" ? explainGoogleError : (m) => (/expired|session has expired|Error validating access token/i.test(m) ? "O acesso do Facebook expirou. Clique em Reconectar." : "A Meta não deixou listar as contas deste login. Clique em Reconectar."));

export default async function handler(req, res) {
  try {
    if (!requireAdmin(req, res)) return;
    const url = new URL(req.url, "http://x");
    if (req.method === "GET") {
      const a = await apps();
      const logins = Object.values(await getLogins()).sort((x, y) => String(y.connectedAt).localeCompare(String(x.connectedAt)));
      return json(res, 200, {
        ready: { google: !!(a.google.clientId && a.google.clientSecret), meta: !!(a.meta.appId && a.meta.appSecret) },
        redirect: { google: redirectUri(req, "google"), meta: redirectUri(req, "meta") },
        meta: { appId: a.meta.appId || "" },
        logins: logins.map((L) => publicLogin(L, explainFor(L.provider))),
      });
    }
    if (req.method === "POST") {
      const b = await readBody(req);
      // { action: "visibility", id, account, visible } — conta aparece (ou não) para os clientes
      if (b.action === "visibility") {
        const L = await getLogin(String(b.id || ""));
        if (!L) return json(res, 404, { error: "Login não encontrado." });
        const acc = String(b.account || "");
        if (!(L.accounts || []).some((a) => a.id === acc)) return json(res, 400, { error: "Conta não encontrada neste login." });
        const hidden = new Set(L.hidden || []);
        if (b.visible === false) hidden.add(acc); else hidden.delete(acc);
        L.hidden = [...hidden];
        await saveLogin(L);
        return json(res, 200, { login: publicLogin(L, explainFor(L.provider)) });
      }
      if (b.action === "refresh") { const L = await discover(String(b.id || "")); return json(res, 200, { login: publicLogin(L, explainFor(L.provider)) }); }
      return json(res, 400, { error: "Ação desconhecida." });
    }
    if (req.method === "DELETE") {
      await removeLogin(url.searchParams.get("id") || "");
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { error: "Método não permitido" });
  } catch (err) {
    return fail(res, err);
  }
}
