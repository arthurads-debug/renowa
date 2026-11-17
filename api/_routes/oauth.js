// /api/oauth/meta e /api/oauth/google — "Conectar com Facebook / Google" do painel da agência.
// 1ª visita (sem ?code): confere o login do admin e manda para a tela de autorização.
// Volta do provedor (com ?code): troca o código por token, salva no banco e retorna ao painel.
import crypto from "node:crypto";
import { getAdminSession, sign, verify } from "../_lib/session.js";
import { findAdmin } from "../_lib/admin.js";
import { apps, setConn } from "../_lib/connections.js";

const META_V = () => process.env.META_API_VERSION || "v21.0";
const META_SCOPES = ["ads_read", "business_management", "pages_show_list", "pages_read_engagement", "read_insights", "instagram_basic", "instagram_manage_insights"];
const GOOGLE_SCOPES = ["https://www.googleapis.com/auth/adwords", "openid", "email"];

export const redirectUri = (req, provider) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}/api/oauth/${provider}`;
};

function go(res, url) { res.statusCode = 302; res.setHeader("Location", url); res.setHeader("Cache-Control", "no-store"); res.end(); }
const back = (res, provider, err) => go(res, `/admin/?${err ? `erro=${encodeURIComponent(err)}&` : ""}conexao=${provider}#integracoes`);
const stateCookie = (v, age) => `renowa_oauth=${v}; Path=/api/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const readCookie = (req, name) => (String(req.headers.cookie || "").split(/;\s*/).find((c) => c.startsWith(`${name}=`)) || "").slice(name.length + 1);

export function makeHandler(provider) {
  return async function handler(req, res) {
    const url = new URL(req.url, "http://x");
    const q = url.searchParams;
    try {
      const admin = getAdminSession(req);
      if (!admin || !findAdmin(admin.sub)) return go(res, "/admin/");
      const a = (await apps())[provider];
      const ru = redirectUri(req, provider);

      // ---------- Ida: tela de autorização ----------
      if (!q.get("code") && !q.get("error")) {
        if (provider === "meta" && (!a.appId || !a.appSecret)) return back(res, provider, "Configure o App da Meta antes de conectar.");
        if (provider === "google" && (!a.clientId || !a.clientSecret)) return back(res, provider, "Configure o acesso do Google antes de conectar.");
        const nonce = crypto.randomBytes(16).toString("base64url");
        const state = sign({ p: provider, n: nonce, exp: Date.now() + 10 * 60_000 });
        res.setHeader("Set-Cookie", stateCookie(nonce, 600));
        if (provider === "meta") {
          return go(res, `https://www.facebook.com/${META_V()}/dialog/oauth?${new URLSearchParams({ client_id: a.appId, redirect_uri: ru, state, response_type: "code", scope: META_SCOPES.join(",") })}`);
        }
        return go(res, `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: a.clientId, redirect_uri: ru, state, response_type: "code", scope: GOOGLE_SCOPES.join(" "), access_type: "offline", prompt: "consent", include_granted_scopes: "true" })}`);
      }

      // ---------- Volta ----------
      res.setHeader("Set-Cookie", stateCookie("", 0));
      if (q.get("error")) return back(res, provider, provider === "google"
        ? "O Google recusou o acesso. Se o projeto está em modo Teste, adicione o seu e-mail em Público-alvo → Usuários de teste no Google Cloud e tente de novo."
        : "A autorização foi cancelada ou recusada no Facebook.");
      const st = verify(q.get("state"));
      const nonce = readCookie(req, "renowa_oauth");
      if (!st || st.p !== provider || !nonce || st.n !== nonce) return back(res, provider, "A conexão expirou. Tente de novo.");

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
        await setConn("meta", {
          accessToken: token, name: me.name || "", userId: me.id || "",
          connectedAt: new Date().toISOString(), by: admin.sub,
          expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000).toISOString() : null,
        });
        return back(res, provider);
      }

      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code: q.get("code"), client_id: a.clientId, client_secret: a.clientSecret, redirect_uri: ru }),
      });
      const tok = await r.json();
      if (!r.ok || !tok.refresh_token) throw new Error(`troca do código: ${JSON.stringify(tok.error || "sem refresh_token")}`);
      let email = "";
      try { email = JSON.parse(Buffer.from(String(tok.id_token).split(".")[1], "base64url").toString("utf8")).email || ""; } catch { /* sem e-mail */ }
      await setConn("google", { refreshToken: tok.refresh_token, email, connectedAt: new Date().toISOString(), by: admin.sub });
      return back(res, provider);
    } catch (err) {
      console.error(`[oauth ${provider}]`, err);
      return back(res, provider, "Não foi possível concluir a conexão. Confira o App e tente de novo.");
    }
  };
}
export const metaOAuth = makeHandler("meta");
export const googleOAuth = makeHandler("google");
