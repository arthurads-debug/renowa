// Acesso da equipe da agência ao painel /admin.
// ADMINS_JSON=[{"email":"voce@agencia.com","passwordHash":"pbkdf2_sha256$..."}]  (gere o hash com tools/criar_senha.py)
// ou, para um único usuário: ADMIN_EMAIL + ADMIN_PASSWORD_HASH
import { json } from "./http.js";
import { getAdminSession } from "./session.js";

export function admins() {
  let list = [];
  if (process.env.ADMINS_JSON) {
    try { list = JSON.parse(process.env.ADMINS_JSON); } catch { console.error("[admin] ADMINS_JSON inválido"); }
  }
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) list.push({ email: process.env.ADMIN_EMAIL, passwordHash: process.env.ADMIN_PASSWORD_HASH });
  return list;
}

export function findAdmin(email) {
  const e = String(email || "").trim().toLowerCase();
  return admins().find((a) => String(a.email).toLowerCase() === e) || null;
}

// Devolve a sessão, ou responde 401 e devolve null
export function requireAdmin(req, res) {
  const s = getAdminSession(req);
  if (!s || !findAdmin(s.sub)) { json(res, 401, { error: "Sessão da agência expirada. Entre novamente." }); return null; }
  return s;
}
