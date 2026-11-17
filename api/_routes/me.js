import { json, fail } from "../_lib/http.js";
import { findById, publicProfile } from "../_lib/clients.js";
import { getSession } from "../_lib/session.js";

export default async function handler(req, res) {
  try {
    const session = getSession(req);
    const client = session && (await findById(session.sub));
    if (!client) return json(res, 401, { error: "Sessão expirada. Entre novamente." });
    return json(res, 200, { client: publicProfile(client, session.by === "admin" ? "agency" : "client") });
  } catch (err) {
    return fail(res, err);
  }
}
