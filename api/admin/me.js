import { json, fail } from "../_lib/http.js";
import { requireAdmin } from "../_lib/admin.js";
import { storeEnabled } from "../_lib/store.js";

export default function handler(req, res) {
  try {
    const s = requireAdmin(req, res);
    if (!s) return;
    const env = process.env;
    return json(res, 200, {
      email: s.sub,
      setup: {
        store: storeEnabled(),
        google: !!(env.GOOGLE_ADS_DEVELOPER_TOKEN && env.GOOGLE_ADS_REFRESH_TOKEN && env.GOOGLE_ADS_LOGIN_CUSTOMER_ID),
        meta: !!env.META_ACCESS_TOKEN,
        whatsapp: !!env.AGENCY_WHATSAPP,
      },
    });
  } catch (err) {
    return fail(res, err);
  }
}
