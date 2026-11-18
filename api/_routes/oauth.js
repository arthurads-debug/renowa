// /api/oauth/meta e /api/oauth/google — botões "Conectar Google" e "Conectar Facebook".
// Quem pode iniciar:
//   · a agência logada, para um cliente (?cliente=id) ou para a própria agência (sem parâmetro)
//   · o próprio cliente, pelo link de convite (?convite=token) que a agência envia
// Na volta: troca o código por token, salva no cliente, escolhe a conta sozinho quando só há uma e retorna.
import crypto from "node:crypto";
import { getAdminSession, sign, verify } from "../_lib/session.js";
import { findAdmin } from "../_lib/admin.js";
import { findById } from "../_lib/clients.js";
import { apps, setConn, setClientConn } from "../_lib/connections.js";
import { autoLink } from "../_lib/autolink.js";
import { explainGoogleError } from "../_lib/google-ads.js";

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

// Para onde voltar: página do convite, cliente aberto no painel, ou integrações da agência
function back(res, provider, ctx, { err, info } = {}) {
  const q = new URLSearchParams();
  if (err) q.set("erro", err);
  if (info) q.set("ok", info);
  q.set("conexao", provider);
  if (ctx.invite) { q.set("t", ctx.invite); return go(res, `/conectar/?${q}`); }
  if (ctx.clientId) { q.set("cliente", ctx.clientId); return go(res, `/admin/?${q}#clientes`); }
  return go(res, `/admin/?${q}#integracoes`);
}

export function makeHandler(provider) {
  return async function handler(req, res) {
    const url = new URL(req.url, "http://x");
    const q = url.searchParams;
    let ctx = {};
    try {
      const isReturn = q.get("code") || q.get("error");
      const a = (await apps())[provider];
      const ru = redirectUri(req, provider);

      // ---------- Ida: tela de autorização ----------
      if (!isReturn) {
        const inv = q.get("convite") ? readInvite(q.get("convite")) : null;
        const admin = getAdminSession(req);
        const isAdmin = !!(admin && findAdmin(admin.sub));
        if (q.get("convite") && !inv) return go(res, `/conectar/?erro=${encodeURIComponent("Este link expirou. Peça um link novo para a agência.")}`);
        if (!inv && !isAdmin) return go(res, "/admin/");
        const clientId = inv?.c || q.get("cliente") || "";
        if (clientId && !(await findById(clientId))) return go(res, "/admin/#clientes");
        ctx = { clientId, invite: inv ? q.get("convite") : "" };

        if (provider === "meta" && (!a.appId || !a.appSecret)) return back(res, provider, ctx, { err: "A conexão com o Facebook ainda não foi ativada pela agência." });
        if (provider === "google" && (!a.clientId || !a.clientSecret)) return back(res, provider, ctx, { err: "A conexão com o Google ainda não foi ativada pela agência." });
        const nonce = crypto.randomBytes(16).toString("base64url");
        const state = sign({ p: provider, n: nonce, c: clientId, i: ctx.invite, exp: Date.now() + 15 * 60_000 });
        res.setHeader("Set-Cookie", stateCookie(nonce, 900));
        if (provider === "meta") {
          return go(res, `https://www.facebook.com/${META_V()}/dialog/oauth?${new URLSearchParams({ client_id: a.appId, redirect_uri: ru, state, response_type: "code", scope: META_SCOPES.join(","), auth_type: "rerequest" })}`);
        }
        return go(res, `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: a.clientId, redirect_uri: ru, state, response_type: "code", scope: GOOGLE_SCOPES.join(" "), access_type: "offline", prompt: "select_account consent" })}`);
      }

      // ---------- Volta ----------
      res.setHeader("Set-Cookie", stateCookie("", 0));
      const st = verify(q.get("state"));
      const nonce = readCookie(req, "renowa_oauth");
      if (!st || st.p !== provider) return go(res, "/admin/");
      ctx = { clientId: st.c || "", invite: st.i || "" };
      if (!ctx.invite) {
        const admin = getAdminSession(req);
        if (!admin || !findAdmin(admin.sub)) return go(res, "/admin/");
      }
      if (q.get("error")) return back(res, provider, ctx, { err: provider === "google"
        ? "O Google não autorizou. Tente de novo e, na tela do Google, clique em Continuar (se aparecer “app não verificado”, clique em Avançado → Acessar)."
        : "A autorização foi cancelada no Facebook. Tente de novo e clique em Continuar." });
      if (!nonce || st.n !== nonce) return back(res, provider, ctx, { err: "A conexão demorou demais. Clique em Conectar de novo." });

      let saved;
      if (provider === "meta") {
        const g = `https://graph.facebook.com/${META_V()}`;
        const r1 = await fetch(`${g}/oauth/access_token?${new URLSearchParams({ client_id: a.appId, client_secret: a.appSecret, redirect_uri: ru, code: q.get("code") })}`);
        const short = await r1.json();
        if (!r1.ok || !short.access_token) throw new Error(`troca do código: ${JSON.stringify(short.error || short)}`);
        // token de longa duração (cerca de 60 dias)
        const r2 = await fetch(`${g}/oauth/access_token?${new URLSearchParams({ grant_type: "fb_exchange_token", client_id: a.appId, client_secret: a.appSecret, fb_exchange_token: short.access_token })}`);
        const long = await r2.json();
        const token = long.access_token || short.access_token;
        const proof = crypto.createHmac("sha256", a.appSecret).update(token).digest("hex");
        const me = await (await fetch(`${g}/me?${new URLSearchParams({ fields: "id,name", access_token: token, appsecret_proof: proof })}`)).json();
        saved = {
          accessToken: token, name: me.name || "", userId: me.id || "",
          connectedAt: new Date().toISOString(), by: ctx.invite ? "cliente" : "agencia",
          expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000).toISOString() : null,
        };
      } else {
        const r = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ grant_type: "authorization_code", code: q.get("code"), client_id: a.clientId, client_secret: a.clientSecret, redirect_uri: ru }),
        });
        const tok = await r.json();
        if (!r.ok || !tok.refresh_token) throw new Error(`troca do código: ${JSON.stringify(tok.error || "sem refresh_token")}`);
        if (!String(tok.scope || "").includes("auth/adwords")) return back(res, provider, ctx, { err: "O Google não liberou o acesso ao Google Ads. Clique em Conectar de novo e, na tela do Google, deixe a permissão do Google Ads aceita." });
        saved = { refreshToken: tok.refresh_token, connectedAt: new Date().toISOString(), by: ctx.invite ? "cliente" : "agencia" };
      }

      if (!ctx.clientId) { await setConn(provider, saved); return back(res, provider, ctx, { info: "1" }); }

      await setClientConn(provider, ctx.clientId, saved);
      // já procura as contas e vincula quando só existe uma
      try {
        const r = await autoLink(provider, ctx.clientId);
        if (!r.found) return back(res, provider, ctx, { err: provider === "google" ? "Conectado, mas esse login do Google não tem nenhuma conta de anúncios. Conecte de novo com o e-mail que entra no Google Ads." : "Conectado, mas esse Facebook não administra nenhuma conta de anúncios nem página." });
        return back(res, provider, ctx, { info: r.linked.length ? r.linked.join(" · ") : `${r.found} contas encontradas — escolha qual é deste cliente.` });
      } catch (e) {
        console.error(`[oauth ${provider}] contas`, e);
        return back(res, provider, ctx, { err: provider === "google" ? explainGoogleError(e) : "Conectado, mas a Meta não deixou listar as contas. Tente de novo em alguns minutos." });
      }
    } catch (err) {
      console.error(`[oauth ${provider}]`, err);
      return back(res, provider, ctx, { err: "Não foi possível concluir a conexão. Clique em Conectar de novo." });
    }
  };
}
export const metaOAuth = makeHandler("meta");
export const googleOAuth = makeHandler("google");
