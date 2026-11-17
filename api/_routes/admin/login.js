import { json, readBody, fail, sleep } from "../../_lib/http.js";
import { verifyPassword, burn } from "../../_lib/clients.js";
import { findAdmin } from "../../_lib/admin.js";
import { setAdminSession, clearAdminSession } from "../../_lib/session.js";

export default async function handler(req, res) {
  try {
    if (req.method === "DELETE") { clearAdminSession(res); return json(res, 200, { ok: true }); }
    if (req.method !== "POST") return json(res, 405, { error: "Método não permitido" });
    const { email, password } = await readBody(req);
    const admin = findAdmin(email);
    const ok = admin ? verifyPassword(password || "", admin.passwordHash) : (burn(password), false);
    if (!ok) {
      await sleep(400 + Math.random() * 300);
      return json(res, 401, { error: "E-mail ou senha incorretos." });
    }
    setAdminSession(res, admin.email);
    return json(res, 200, { email: admin.email });
  } catch (err) {
    return fail(res, err);
  }
}
