// /api/signup — rota PÚBLICA: o cliente cria o próprio perfil na Área do Cliente.
// O perfil nasce bloqueado (pending) e só entra depois que a agência libera no /admin.
import { json, readBody, fail } from "../_lib/http.js";
import { loadClients, invalidateClients, hashPassword } from "../_lib/clients.js";
import { writeClient, hitRateLimit, storeEnabled } from "../_lib/store.js";

const str = (v, max = 120) => String(v ?? "").trim().slice(0, max);
const slug = (s) => str(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Método não permitido" });
    const origin = req.headers.origin;
    if (origin) {
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      try { if (new URL(origin).host !== host) return json(res, 403, { error: "Origem não permitida." }); }
      catch { return json(res, 403, { error: "Origem não permitida." }); }
    }
    if (!storeEnabled()) return json(res, 503, { error: "Cadastro indisponível agora. Fale com a agência." });
    const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
    if (await hitRateLimit(`signup:${ip}`)) return json(res, 429, { error: "Muitas tentativas seguidas. Tente de novo em alguns minutos." });

    const b = await readBody(req);
    const company = str(b.company, 80);
    const contactName = str(b.contactName, 80);
    const email = str(b.email, 120).toLowerCase();
    const phone = str(b.phone, 30).replace(/[^\d+()\s-]/g, "");
    const password = String(b.password || "");
    if (!company) return json(res, 400, { error: "Informe o nome da empresa." });
    if (!contactName) return json(res, 400, { error: "Informe o seu nome." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(res, 400, { error: "Informe um e-mail válido." });
    if (password.length < 4) return json(res, 400, { error: "A senha precisa ter pelo menos 4 caracteres." });

    const list = await loadClients();
    // Mesmo retorno para e-mail já cadastrado: não revela quem já tem conta
    if (list.some((c) => String(c.email).toLowerCase() === email)) return json(res, 200, { ok: true, pending: true });

    let id = slug(company) || `cliente-${Date.now()}`;
    if (list.some((c) => c.id === id)) id = `${id}-${Date.now().toString(36).slice(-4)}`;
    const now = new Date().toISOString();
    await writeClient({
      id, name: company, contactName, email, phone,
      profile: "leads", resultLabel: "Conversas no WhatsApp", currency: "BRL",
      active: false, pending: true,
      passwordHash: hashPassword(password),
      createdAt: now, updatedAt: now, origin: "cadastro",
    });
    invalidateClients();
    return json(res, 200, { ok: true, pending: true });
  } catch (err) {
    return fail(res, err);
  }
}
