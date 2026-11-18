import { json, fail } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/admin.js";
import { storeEnabled } from "../../_lib/store.js";
import { apps } from "../../_lib/connections.js";

export default async function handler(req, res) {
  try {
    const s = requireAdmin(req, res);
    if (!s) return;
    const env = process.env;
    const a = await apps();
    return json(res, 200, {
      email: s.sub,
      setup: {
        store: storeEnabled(),
        google: !!(a.google.clientId && a.google.developerToken),
        meta: !!(env.META_ACCESS_TOKEN || (a.meta.appId && a.meta.appSecret)),
        whatsapp: !!env.AGENCY_WHATSAPP,
      },
    });
  } catch (err) {
    return fail(res, err);
  }
}
