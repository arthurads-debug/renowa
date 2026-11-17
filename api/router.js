// /api/router — função única que atende todas as rotas /api/*.
// O plano Hobby da Vercel aceita no máximo 12 funções por site; com um roteador só,
// os endereços continuam os mesmos (/api/lead, /api/admin/leads...) via rewrite no vercel.json.
import content from "./_routes/content.js";
import lead from "./_routes/lead.js";
import login from "./_routes/login.js";
import logout from "./_routes/logout.js";
import me from "./_routes/me.js";
import metrics from "./_routes/metrics.js";
import social from "./_routes/social.js";
import adminAccounts from "./_routes/admin/accounts.js";
import adminClients from "./_routes/admin/clients.js";
import adminImpersonate from "./_routes/admin/impersonate.js";
import adminLeads from "./_routes/admin/leads.js";
import adminLogin from "./_routes/admin/login.js";
import adminMe from "./_routes/admin/me.js";

const ROUTES = {
  content, lead, login, logout, me, metrics, social,
  "admin/accounts": adminAccounts,
  "admin/clients": adminClients,
  "admin/impersonate": adminImpersonate,
  "admin/leads": adminLeads,
  "admin/login": adminLogin,
  "admin/me": adminMe,
};

export default function handler(req, res) {
  const url = new URL(req.url, "http://x");
  // a rota vem do rewrite (?__route=admin/leads) ou, se não houver, do próprio caminho
  const route = (url.searchParams.get("__route") || url.pathname.replace(/^\/api\/?/, ""))
    .replace(/^\/+|\/+$/g, "").replace(/\.js$/, "");
  const fn = Object.hasOwn(ROUTES, route) ? ROUTES[route] : null;
  if (!fn) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ error: "Rota não encontrada" }));
  }
  return fn(req, res);
}
