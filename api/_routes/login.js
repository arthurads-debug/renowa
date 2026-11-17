import { json, readBody, fail, sleep } from "../_lib/http.js";
import { findByEmailAny, verifyPassword, burn, publicProfile } from "../_lib/clients.js";
import { setSession } from "../_lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método não permitido" });
  try {
    const { email, password } = await readBody(req);
    if (!email || !password) return json(res, 400, { error: "Informe e-mail e senha." });

    const client = await findByEmailAny(email);
    let ok = false;
    if (client) ok = verifyPassword(password, client.passwordHash);
    else burn(password);

    if (!ok) {
      await sleep(350 + Math.random() * 250);
      return json(res, 401, { error: "E-mail ou senha incorretos." });
    }
    if (client.active === false) {
      return json(res, 403, { error: client.pending
        ? "Seu cadastro está em análise. Você recebe acesso assim que a agência liberar."
        : "Seu acesso está pausado. Fale com a agência." });
    }
    setSession(res, client.id);
    return json(res, 200, { client: publicProfile(client) });
  } catch (err) {
    return fail(res, err);
  }
}
