import { json, fail } from "../_lib/http.js";
import { findById, publicProfile } from "../_lib/clients.js";
import { adsFor } from "../_lib/ads-accounts.js";
import { getSession } from "../_lib/session.js";

export default async function handler(req, res) {
  try {
    const session = getSession(req);
    const client = session && (await findById(session.sub));
    if (!client || (client.active === false && session.by !== "admin")) return json(res, 401, { error: "Sessão expirada. Entre novamente." });
    const viewer = session.by === "admin" ? "agency" : "client";
    return json(res, 200, { client: publicProfile(client, viewer, await adsFor(client, viewer)) });
  } catch (err) {
    return fail(res, err);
  }
}
