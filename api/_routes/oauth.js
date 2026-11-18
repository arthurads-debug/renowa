// /api/oauth/meta e /api/oauth/google — "Conectar Google" / "Conectar Facebook", estilo UTMify:
// clicou → faz login no Google/Facebook → volta com a lista de contas de anúncio daquele login → escolhe quais mostrar.
// Quem pode iniciar: a agência logada (?cliente=id opcional, para já escolher as contas daquele cliente)
// ou o próprio cliente, pelo link de convite (?convite=token).
import crypto from "node:crypto";
import { getAdminSession, sign, verify } from "../_lib/session.js";
import { findAdmin } from "../_lib/admin.js";
import { findById } from "../_lib/clients.js";
import { apps, getLogins, saveLogin, removeLogin } from "../_lib/connections.js";
import { discover } from "../_lib/ads-accounts.js";

const META_V = () => process.env.META_API_VERSION || "v21.0";
const META_SCOPES = ["ads_read", "business_management", "pages_show_list", "pages_read_engagement", "read_insights", "instagram_basic", "instagram_manage_insights"];
// Só a permissão do Google Ads: com uma única permissão o Google não mostra caixas para marcar.
const GOOGLE_SCOPES = ["https://www.googleapis.com/auth/adwords"];

export const redirectUri = (req, provider) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}/api/oauth/${provider}`;
};

// Convite: link que o cliente abre para conectar as próprias contas (vale 14 dias)
export const makeInvite = (clientId) => sign({ k: "inv", c: clientId, exp: Date.now() + 14 * 864e5 });
export const readInvite = (t) => { const v = verify(t); return v?.k === "inv" && v.c ? v : null; };

function go(res, url) { res.statusCode = 302; res.setHeader("Location", url); res.setHeader("Cache-Control", "no-store"); res.end(); }
const stateCookie = (v, age) => `renowa_oauth=${v}; Path=/api/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const readCookie = (req, name) => (String(req.headers.cookie || "").split(/;\s*/).find((c) => c.startsWith(`${name}=`)) || "").slice(name.length + 1);

function back(res, provider, ctx, { err, login } = {}) {
  const q = new URLSearchParams();
  if (err) q.set("erro", err);
  if (login) q.set("login", login);
  q.set("conexao", provider);
  if (ctx.invite) { q.set("t", ctx.invite); return go(res, `/conectar/?${q}`); }
  if (ctx.clientId) q.set("cliente", ctx.clientId);
  return go(res, `/admin/?${q}#conexoes`);
}

const sameSet = (a, b) => a.length && a.length === b.length && a.every((x) => b.includes(x));

export function makeHandler(provider) {
  return async function handler(req, res) {
    const q = new URL(req.url, "http://x").searchParams;
    let ctx = {};
    try {
      const a = (await apps())[provider];
      const ru = redirectUri(req, provider);

      // ---------- Ida ----------
      if (!q.get("code") && !q.get("error")) {
        const inv = q.get("convite") ? readInvite(q.get("convite")) : null;
        const admin = getAdminSession(req);
        const isAdmin = !!(admin && findAdmin(admin.sub));
        if (q.get("convite") && !inv) return go(res, `/conectar/?erro=${encodeURIComponent("Este link expirou. Peça um link novo para a agência.")}`);
        if (!inv && !isAdmin) return go(res, "/admin/");
        const clientId = inv?.c || q.get("cliente") || "";
        if (clientId && !(await findById(clientId))) return go(res, "/admin/#clientes");
        ctx = { clientId, invite: inv ? q.get("convite") : "" };
        if (provider === "meta" && (!a.appId || !a.appSecret)) return back(res, provider, ctx, { err: "A conexão com o Facebook ainda não foi ativada pela agência (Conexões → Ativar Facebook)." });
        if (provider === "google" && (!a.clientId || !a.clientSecret)) return back(res, provider, ctx, { err: "A conexão com o Google ainda não foi ativada pela agência." });
        const nonce = crypto.randomBytes(16).toString("base64url");
        const state = sign({ p: provider, n: nonce, c: clientId, i: ctx.invite, exp: Date.now() + 15 * 60_000 });
        res.setHeader("Set-Cookie", stateCookie(nonce, 900));
        if (provider === "meta") return go(res, `https://www.facebook.com/${META_V()}/dialog/oauth?${new URLSearchParams({ client_id: a.appId, redirect_uri: ru, state, response_type: "code", scope: META_SCOPES.join(","), auth_type: "rerequest" })}`);
        return go(res, `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: a.clientId, redirect_uri: ru, state, response_type: "code", scope: GOOGLE_SCOPES.join(" "), access_type: "offline", prompt: "select_account consent" })}`);
      }

      // ---------- Volta ----------
      res.setHeader("Set-Cookie", stateCookie("", 0));
      const st = verify(q.get("state"));
      if (!st || st.p !== provider) return go(res, "/admin/");
      ctx = { clientId: st.c || "", invite: st.i || "" };
      if (!ctx.invite) { const admin = getAdminSession(req); if (!admin || !findAdmin(admin.sub)) return go(res, "/admin/"); }
      if (q.get("error")) return back(res, provider, ctx, { err: provider === "google"
        ? "O Google não autorizou. Tente de novo e clique em Continuar (se aparecer “app não verificado”, clique em Avançado → Acessar)."
        : "A autorização foi cancelada no Facebook. Tente de novo e clique em Continuar." });
      const nonce = readCookie(req, "renowa_oauth");
      if (!nonce || st.n !== nonce) return back(res, provider, ctx, { err: "A conexão demorou demais. Clique em Conectar de novo." });

      const base = { id: crypto.randomBytes(6).toString("hex"), provider, connectedAt: new Date().toISOString(), by: ctx.invite ? "cliente" : "agencia", clientId: ctx.invite ? ctx.clientId : null };
      let login;
      if (provider === "meta") {
        const g = `https://graph.facebook.com/${META_V()}`;
        const r1 = await fetch(`${g}/oauth/access_token?${new URLSearchParams({ client_id: a.appId, client_secret: a.appSecret, redirect_uri: ru, code: q.get("code") })}`);
        const short = await r1.json();
        if (!r1.ok || !short.access_token) throw new Error(`troca do código: ${JSON.stringify(short.error || short)}`);
        const r2 = await fetch(`${g}/oauth/access_token?${new URLSearchParams({ grant_type: "fb_exchange_token", client_id: a.appId, client_secret: a.appSecret, fb_exchange_token: short.access_token })}`);
        const long = await r2.json();
        const token = long.access_token || short.access_token;
        const proof = crypto.createHmac("sha256", a.appSecret).update(token).digest("hex");
        const me = await (await fetch(`${g}/me?${new URLSearchParams({ fields: "id,name", access_token: token, appsecret_proof: proof })}`)).json();
        const same = Object.values(await getLogins()).find((L) => L.provider === "meta" && me.id && L.userId === me.id);
        login = { ...(same || {}), ...base, id: same?.id || base.id, accessToken: token, userId: me.id || "", label: me.name || "Facebook",
          expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000).toISOString() : null };
      } else {
        const r = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ grant_type: "authorization_code", code: q.get("code"), client_id: a.clientId, client_secret: a.clientSecret, redirect_uri: ru }),
        });
        const tok = await r.json();
        if (!r.ok || !tok.refresh_token) throw new Error(`troca do código: ${JSON.stringify(tok.error || "sem refresh_token")}`);
        if (!String(tok.scope || "").includes("auth/adwords")) return back(res, provider, ctx, { err: "O Google não liberou o acesso ao Google Ads. Clique em Conectar de novo e deixe a permissão do Google Ads aceita." });
        login = { ...base, refreshToken: tok.refresh_token, label: "Google Ads" };
      }

      await saveLogin(login);
      const L = await discover(login.id);
      if (provider === "google") {
        // mesmo login do Google conectado de novo (mesmas contas): fica um só
        const ids = (L.accounts || []).map((x) => x.id);
        const dup = Object.values(await getLogins()).find((o) => o.id !== L.id && o.provider === "google" && sameSet(ids, (o.accounts || []).map((x) => x.id)));
        L.label = L.accounts?.length ? (L.accounts.length === 1 ? L.accounts[0].name : `${L.accounts[0].name} e mais ${L.accounts.length - 1}`) : "Google Ads";
        if (dup) { await saveLogin({ ...dup, refreshToken: L.refreshToken, accounts: L.accounts, error: L.error, checkedAt: L.checkedAt, connectedAt: L.connectedAt }); await removeLogin(L.id); return back(res, provider, ctx, { login: dup.id }); }
        await saveLogin(L);
      }
      return back(res, provider, ctx, { login: L.id });
    } catch (err) {
      console.error(`[oauth ${provider}]`, err);
      return back(res, provider, ctx, { err: "Não foi possível concluir a conexão. Clique em Conectar de novo." });
    }
  };
}
export const metaOAuth = makeHandler("meta");
export const googleOAuth = makeHandler("google");
