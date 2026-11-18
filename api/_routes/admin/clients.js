// /api/admin/clients — GET lista · POST cria/atualiza · DELETE ?id= remove
import { json, readBody, fail } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/admin.js";
import { loadClients, invalidateClients, hashPassword, adminView } from "../../_lib/clients.js";
import { writeClient, removeClient } from "../../_lib/store.js";

const PROFILES = ["awareness", "leads", "sales"];
const str = (v, max = 120) => String(v ?? "").trim().slice(0, max);
const httpsUrl = (v, host) => { const s = str(v, 600); return s && s.startsWith(`https://${host || ""}`) ? s : ""; };
const slug = (s) => str(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const bad = (msg) => Object.assign(new Error(msg), { status: 400, expose: true });

function clean(input, existing) {
  const name = str(input.name, 80);
  if (!name) throw bad("Informe o nome do cliente.");
  const email = str(input.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw bad("Informe um e-mail de acesso válido.");
  const profile = PROFILES.includes(input.profile) ? input.profile : "leads";

  const c = {
    id: existing?.id || slug(input.id || name) || `cliente-${Date.now()}`,
    name, email, profile,
    contactName: str(input.contactName, 80),
    resultLabel: str(input.resultLabel, 40) || (profile === "sales" ? "Vendas" : profile === "awareness" ? "Interações" : "Conversas no WhatsApp"),
    currency: /^[A-Z]{3}$/.test(input.currency || "") ? input.currency : "BRL",
    note: str(input.note, 600),
    active: input.active !== false,
    // serviços contratados: sem calendário editorial (só tráfego, por exemplo) a aba some para o cliente
    calendar: input.calendar !== false,
    ...(existing?.pending && input.active === false ? { pending: true } : {}),
    ...(existing?.phone ? { phone: existing.phone } : {}),
    ...(existing?.createdAt ? { createdAt: existing.createdAt } : {}),
    passwordHash: existing?.passwordHash || null,
    updatedAt: new Date().toISOString(),
  };

  if (input.password) {
    if (String(input.password).length < 10) throw bad("A senha precisa ter pelo menos 10 caracteres.");
    c.passwordHash = hashPassword(input.password);
  }
  if (!c.passwordHash) throw bad("Defina uma senha de acesso para o cliente.");

  const pop = parseInt(String(input.city?.population || "").replace(/\D/g, ""), 10);
  if (profile === "awareness" && pop > 0) c.city = { name: str(input.city?.name, 80), population: pop };

  // Contas de anúncio (uma ou várias, de qualquer login conectado)
  if (Array.isArray(input.ads)) {
    const seen = new Set();
    c.ads = input.ads.slice(0, 30).map((a) => ({
      p: a?.p === "meta" ? "meta" : "google",
      login: str(a?.login, 40),
      id: a?.p === "meta" ? `act_${str(a?.id, 40).replace(/\D/g, "")}` : str(a?.id, 20).replace(/[^\d-]/g, ""),
      name: str(a?.name, 120),
      loginCustomerId: str(a?.loginCustomerId, 20).replace(/[^\d-]/g, ""),
      currency: /^[A-Z]{3}$/.test(a?.currency || "") ? a.currency : "",
    })).filter((a) => a.id.replace(/\D/g, "").length >= 6 && !seen.has(`${a.p}:${a.id}`) && seen.add(`${a.p}:${a.id}`));
  }
  const mc = input.metaAds || {};
  const types = (v) => (Array.isArray(v) ? v : []).map((x) => str(x, 80)).filter(Boolean).slice(0, 5);
  c.metaConfig = { resultActionTypes: types(mc.resultActionTypes || input.metaConfig?.resultActionTypes), revenueActionTypes: types(mc.revenueActionTypes || input.metaConfig?.revenueActionTypes) };
  // Contas no formato antigo (um por plataforma) — continuam valendo enquanto não houver "ads"
  const g = input.googleAds || {};
  if (str(g.customerId)) c.googleAds = { customerId: str(g.customerId, 20).replace(/[^\d-]/g, ""), name: str(g.name, 120), loginCustomerId: str(g.loginCustomerId, 20).replace(/[^\d-]/g, "") };
  const m = input.metaAds || {};
  if (str(m.adAccountId)) {
    const id = str(m.adAccountId, 40).replace(/[^\d_act]/g, "");
    c.metaAds = {
      adAccountId: id.startsWith("act_") ? id : `act_${id.replace(/\D/g, "")}`,
      name: str(m.name, 120),
      resultActionTypes: (Array.isArray(m.resultActionTypes) ? m.resultActionTypes : []).map((x) => str(x, 80)).filter(Boolean).slice(0, 5),
      revenueActionTypes: (Array.isArray(m.revenueActionTypes) ? m.revenueActionTypes : []).map((x) => str(x, 80)).filter(Boolean).slice(0, 5),
    };
  }
  const f = input.facebook || {};
  if (str(f.pageId)) c.facebook = { pageId: str(f.pageId, 40).replace(/\D/g, ""), name: str(f.name, 120), login: str(f.login, 40) };
  const yt = input.youtube || {};
  if (str(yt.channelId)) c.youtube = { channelId: str(yt.channelId, 40).replace(/[^\w-]/g, ""), name: str(yt.name, 120), login: str(yt.login, 40) };
  const ig = input.instagram || {};
  if (str(ig.userId)) c.instagram = { userId: str(ig.userId, 40).replace(/\D/g, ""), username: str(ig.username, 60).replace(/^@/, ""), login: str(ig.login, 40) };

  // Planilhas e formulário
  const sh = input.sheets || {};
  const sheets = { calendar: httpsUrl(sh.calendar, "docs.google.com/"), sales: httpsUrl(sh.sales, "docs.google.com/"), reports: httpsUrl(sh.reports, "docs.google.com/") };
  for (const [k, v] of Object.entries(sh)) if (str(v) && !sheets[k]) throw bad(`O link da planilha de ${k === "calendar" ? "calendário" : k === "sales" ? "vendas" : "relatórios"} deve ser o CSV publicado do Google Sheets (https://docs.google.com/...).`);
  if (Object.values(sheets).some(Boolean)) c.sheets = Object.fromEntries(Object.entries(sheets).filter(([, v]) => v));
  const form = httpsUrl(input.salesFormUrl);
  if (form) c.salesFormUrl = form;
  return c;
}

export default async function handler(req, res) {
  try {
    if (!requireAdmin(req, res)) return;
    const list = await loadClients();

    if (req.method === "GET") return json(res, 200, { clients: list.map(adminView).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")) });

    if (req.method === "POST") {
      const input = await readBody(req);
      const existing = input.id ? list.find((c) => c.id === input.id) : null;
      const client = clean(input, existing);
      if (!existing && list.some((c) => c.id === client.id)) client.id = `${client.id}-${Date.now().toString(36).slice(-4)}`;
      if (list.some((c) => c.id !== client.id && String(c.email).toLowerCase() === client.email)) throw bad("Já existe um cliente com esse e-mail de acesso.");
      delete client.source;
      await writeClient(client);
      invalidateClients();
      return json(res, 200, { client: adminView(client) });
    }

    // PATCH ?id=  { active: true|false } — libera ou pausa o acesso sem abrir o editor
    if (req.method === "PATCH") {
      const id = new URL(req.url, "http://x").searchParams.get("id");
      const c = list.find((x) => x.id === id);
      if (!c) return json(res, 404, { error: "Cliente não encontrado." });
      if (c.source === "env") return json(res, 400, { error: "Este cliente está na variável CLIENTS_JSON; altere por lá." });
      const { active } = await readBody(req);
      const next = { ...c, active: active !== false, updatedAt: new Date().toISOString() };
      if (next.active) { delete next.pending; next.approvedAt = next.updatedAt; }
      delete next.source;
      await writeClient(next);
      invalidateClients();
      return json(res, 200, { client: adminView(next) });
    }

    if (req.method === "DELETE") {
      const id = new URL(req.url, "http://x").searchParams.get("id");
      const c = list.find((x) => x.id === id);
      if (!c) return json(res, 404, { error: "Cliente não encontrado." });
      if (c.source === "env") return json(res, 400, { error: "Este cliente está na variável CLIENTS_JSON; remova por lá." });
      await removeClient(id);
      invalidateClients();
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { error: "Método não permitido" });
  } catch (err) {
    return fail(res, err);
  }
}
