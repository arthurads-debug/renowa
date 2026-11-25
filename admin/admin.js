// Painel da agência: clientes, objetivo de cada um e vínculo das contas
// (Google Ads, Meta Ads, Página do Facebook, Instagram) que alimentam o relatório.
import { h, $, $$ } from "/cliente/assets/util.js";
import { netBadge } from "/cliente/assets/components.js";
import { demoRecords, saveDemoRecords } from "/cliente/assets/demo.js";
import { initLeads, STAGES } from "/admin/leads.js";
import { initNav, KEY_HINT } from "/admin/nav.js";
import { initConexoes, LOGO, legacy } from "/admin/conexoes.js";
import { renderHome } from "/admin/home.js";
import { mountBrand3D } from "/admin/brand3d.js";
import { initCalendar } from "/admin/calendar.js";

const BRAND = "Renowa";

const PROFILES = [
  { v: "awareness", name: "Divulgação", desc: "Prefeituras, institucional e marca. Alcance, visualizações e custo por pessoa — sem ROI.", res: "Interações" },
  { v: "leads", name: "Contato e loja física", desc: "Venda pelo WhatsApp ou na loja. Conversas, custo por contato e vendas informadas.", res: "Conversas no WhatsApp" },
  { v: "sales", name: "Vendas online", desc: "E-commerce com rastreamento de compra. Receita, custo por venda e ROAS.", res: "Vendas" },
];
const RESULT_TYPES = [
  { v: "onsite_conversion.messaging_conversation_started_7d", label: "Conversas iniciadas (WhatsApp, Messenger, Direct)" },
  { v: "lead", label: "Leads de formulário" },
  { v: "purchase", label: "Compras no site (pixel)" },
  { v: "complete_registration", label: "Cadastros no site" },
];

const state = { logins: null, demo: false, email: null, setup: null, clients: [], accounts: null, accountsFor: null, cx: null, cxMsg: null, search: "" };

/* =========================================================
   BACKEND (API real ou demonstração)
   ========================================================= */
async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...opts });
  let data = null;
  try { data = await res.json(); } catch { /* sem corpo */ }
  if (res.status === 401 && !path.endsWith("/login")) { showLogin("Sua sessão expirou. Entre novamente."); throw new Error("401"); }
  if (!res.ok) throw new Error(data?.error || "Algo deu errado. Tente novamente.");
  return data;
}

const MOCK = {
  google: { items: [
    { id: "482-113-9021", name: "Prefeitura de Vale Verde", status: "Ativa" },
    { id: "731-554-2210", name: "Casa Bella Móveis", status: "Ativa" },
    { id: "915-002-7713", name: "Maison Lume — E-commerce", status: "Ativa" },
    { id: "220-871-4410", name: "Clínica Sorriso Real", status: "Ativa" },
    { id: "318-660-1294", name: "Auto Center Rota 40", status: "Ativa" },
    { id: "604-339-8823", name: "Construtora Horizonte", status: "Ativa" },
    { id: "122-907-3381", name: "Pizzaria Forno de Pedra", status: "Suspensa" },
  ] },
  meta: { items: [
    { id: "act_1029384756", name: "PMVV — Comunicação", business: "Prefeitura de Vale Verde", status: "Ativa" },
    { id: "act_5566778899", name: "Casa Bella — Anúncios", business: "Casa Bella Móveis", status: "Ativa" },
    { id: "act_9988776655", name: "Maison Lume", business: "Maison Lume", status: "Ativa" },
    { id: "act_4433221100", name: "Sorriso Real — Leads", business: "Clínica Sorriso Real", status: "Ativa" },
    { id: "act_7766554433", name: "Rota 40 — WhatsApp", business: "Auto Center Rota 40", status: "Pagamento pendente" },
    { id: "act_3322110099", name: "Horizonte Lançamentos", business: "Construtora Horizonte", status: "Ativa" },
  ] },
  pages: { items: [
    { id: "100200300400", name: "Prefeitura de Vale Verde", instagram: { id: "17841400000000001", username: "prefvaleverde", followers: 41200 } },
    { id: "100200300401", name: "Casa Bella Móveis", instagram: { id: "17841400000000002", username: "casabellamoveis", followers: 12800 } },
    { id: "100200300402", name: "Maison Lume", instagram: { id: "17841400000000003", username: "maisonlume", followers: 88300 } },
    { id: "100200300403", name: "Clínica Sorriso Real", instagram: { id: "17841400000000004", username: "sorrisoreal.clinica", followers: 6900 } },
    { id: "100200300404", name: "Auto Center Rota 40", instagram: null },
    { id: "100200300405", name: "Construtora Horizonte", instagram: { id: "17841400000000006", username: "horizonteconstrutora", followers: 21400 } },
  ] },
};
MOCK.instagram = { items: MOCK.pages.items.filter((p) => p.instagram).map((p) => ({ ...p.instagram, page: p.name, pageId: p.id })) };

const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

const backend = {
  async me() { return api("/api/admin/me"); },
  async login(email, password) {
    if (state.demo) {
      if (email.toLowerCase() !== "agencia@demo.com.br" || password !== "demo123") throw new Error("E-mail ou senha incorretos.");
      try { sessionStorage.setItem("demo-admin", email); } catch { /* sem storage */ }
      return { email };
    }
    return api("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
  },
  async logout() { if (!state.demo) await api("/api/admin/login", { method: "DELETE" }).catch(() => {}); },
  async list() {
    if (state.demo) return demoRecords().map((c) => ({ ...c, hasPassword: true, source: "painel" }));
    return (await api("/api/admin/clients")).clients;
  },
  async accounts(fresh, clientId) {
    if (state.demo) { await new Promise((r) => setTimeout(r, 300)); return MOCK; }
    const q = new URLSearchParams();
    if (fresh) q.set("fresh", "1");
    if (clientId) q.set("cliente", clientId);
    return api(`/api/admin/accounts?${q}`);
  },
  async connections(clientId) {
    if (state.demo) {
      await new Promise((r) => setTimeout(r, 300));
      return { ready: { google: true, meta: true },
        google: { own: true, since: new Date().toISOString(), test: { ok: true, text: "Últimos 30 dias: R$ 4.820,00 investidos · 182.400 impressões · 6.310 cliques" } },
        meta: { own: false } };
    }
    return api(`/api/admin/integrations?cliente=${encodeURIComponent(clientId)}`);
  },
  async script(clientId) {
    if (state.demo) return { script: "// Na demonstração o script não é gerado." };
    return api("/api/admin/integrations", { method: "POST", body: JSON.stringify({ action: "script", cliente: clientId }) });
  },
  async invite(clientId) {
    if (state.demo) return { url: `${location.origin}/conectar/?t=demo` };
    return api("/api/admin/integrations", { method: "POST", body: JSON.stringify({ action: "convite", cliente: clientId }) });
  },
  async disconnectClient(clientId, provider) {
    if (state.demo) return;
    return api(`/api/admin/integrations?cliente=${encodeURIComponent(clientId)}&provider=${provider}`, { method: "DELETE" });
  },
  async save(payload) {
    if (!state.demo) return (await api("/api/admin/clients", { method: "POST", body: JSON.stringify(payload) })).client;
    // Demonstração: mesmas regras básicas do servidor, salvo neste navegador
    if (!payload.name?.trim()) throw new Error("Informe o nome do cliente.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email || "")) throw new Error("Informe um e-mail de acesso válido.");
    const list = demoRecords();
    if (list.some((c) => c.id !== payload.id && c.email.toLowerCase() === payload.email.toLowerCase())) throw new Error("Já existe um cliente com esse e-mail de acesso.");
    const rec = { ...payload, id: payload.id || slug(payload.name) || `cliente-${Date.now()}` };
    delete rec.password;
    rec.sheets = { calendar: rec.sheets?.calendar || "demo", reports: rec.sheets?.reports || "demo", ...(rec.profile === "leads" ? { sales: rec.sheets?.sales || "demo" } : {}) };
    if (rec.profile === "leads" && !rec.salesFormUrl) rec.salesFormUrl = "#demo";
    const i = list.findIndex((c) => c.id === rec.id);
    if (i >= 0) list[i] = rec; else list.push(rec);
    saveDemoRecords(list);
    return rec;
  },
  async setActive(id, active) {
    if (!state.demo) return (await api(`/api/admin/clients?id=${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ active }) })).client;
    const list = demoRecords();
    const c = list.find((x) => x.id === id);
    if (c) { c.active = active; delete c.pending; saveDemoRecords(list); }
    return c;
  },
  async remove(id) {
    if (!state.demo) return api(`/api/admin/clients?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    saveDemoRecords(demoRecords().filter((c) => c.id !== id));
  },
  async openReport(id) {
    if (state.demo) {
      try { sessionStorage.setItem("demo-client", id); sessionStorage.setItem("demo-viewer", "agency"); } catch { /* sem storage */ }
    } else {
      await api("/api/admin/impersonate", { method: "POST", body: JSON.stringify({ id }) });
    }
    location.href = "/cliente/#resumo";
  },
};

/* =========================================================
   UI BÁSICA
   ========================================================= */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 4000);
}

function showLogin(msg) {
  $("#view-app").hidden = true;
  $("#view-login").hidden = false;
  $("#demo-hint").hidden = !state.demo;
  $("#login-error").textContent = msg || "";
  mountBrand3D($("#login-3d"));
  $("#login-email").focus();
}

async function showApp() {
  if (!state.demo) { try { localStorage.setItem("renowa-admin", "1"); } catch { /* */ } }
  $("#view-login").hidden = true;
  $("#view-app").hidden = false;
  $("#demo-banner").hidden = !state.demo;
  $("#admin-email").textContent = state.email;
  renderSetup();
  showTab(currentTab());
  await Promise.all([refreshList(), leads.refresh(), conexoes.load()]);
  if (currentTab() === "inicio") drawHome();
  conexoes.handleReturn();

}

/* ---------- Abas: Leads (CRM) e Clientes ---------- */
let conexoes = null, calendar = null;
const TABS = ["inicio", "leads", "clientes", "calendario", "conexoes"];
const currentTab = () => { const t = location.hash.slice(1); return t === "integracoes" ? "conexoes" : TABS.includes(t) ? t : "inicio"; };
function showTab(tab) {
  TABS.forEach((t) => {
    $(`#tab-${t}`).hidden = t !== tab;
    $$(`[data-tab="${t}"]`).forEach((link) => (t === tab ? link.setAttribute("aria-current", "page") : link.removeAttribute("aria-current")));
  });
  window.scrollTo({ top: 0 });
  if (tab === "conexoes") conexoes?.load();
  if (tab === "inicio") drawHome();
  const v = $(`#tab-${tab}`); if (v && !matchMedia("(prefers-reduced-motion: reduce)").matches) { v.classList.remove("tab-in"); void v.offsetWidth; v.classList.add("tab-in"); }
  if (tab === "calendario") calendar?.load();
  if (location.hash.slice(1) !== tab) history.replaceState(null, "", `#${tab}`);
}
window.addEventListener("hashchange", () => showTab(currentTab()));

async function refreshList() {
  try { state.clients = await backend.list(); } catch (e) { if (e.message !== "401") toast(e.message); }
  renderList();
  if (currentTab() === "calendario") calendar?.load();
}

function renderSetup() {
  const box = $("#setup");
  box.replaceChildren();
  if (state.demo || !state.setup) return;
  const s = state.setup;
  if (s.store && s.google && s.meta && s.whatsapp) return;
  const item = (ok, html) => h("li", { class: ok ? "is-ok" : "" }, h("span", { html }));
  box.append(h("section", { class: "setup" },
    h("strong", {}, "Falta pouco para o painel ficar completo"),
    h("ul", {},
      item(s.store, "Banco de dados para salvar clientes: na Vercel, <b>Storage → Upstash for Redis</b> (cria <code>KV_REST_API_URL</code> e <code>KV_REST_API_TOKEN</code>)"),
      item(s.google, "Conexão com o Google ativada (uma vez só): veja em <a href=\"#integracoes\">Configuração da agência</a>"),
      item(s.meta, "Conexão com o Facebook ativada (uma vez só): veja em <a href=\"#integracoes\">Configuração da agência</a>"),
      item(s.whatsapp, "WhatsApp da agência: <code>AGENCY_WHATSAPP</code> (aprovação de posts e botão de contato)")),
    h("p", { class: "fineprint" }, "Depois disso, cada cliente é conectado no próprio cadastro, com um clique.")));
}

/* =========================================================
   LISTA DE CLIENTES
   ========================================================= */
const PROFILE_NAME = Object.fromEntries(PROFILES.map((p) => [p.v, p.name]));
const initials = (n) => n.split(/\s+/).filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || n.slice(0, 2).toUpperCase();

function netLine(platform, value, label) {
  return h("div", { class: `cli__net${value ? "" : " is-missing"}` }, netBadge(platform), h("span", {}, value || `${label}: não conectado`));
}

function renderList() {
  const q = state.search.trim().toLowerCase();
  const list = state.clients.filter((c) => !q || `${c.name} ${c.email} ${c.contactName || ""}`.toLowerCase().includes(q))
    .sort((a, b) => (b.pending ? 1 : 0) - (a.pending ? 1 : 0));
  const waiting = state.clients.filter((c) => c.pending).length;
  [["#tab-badge-clientes", true], ["#dock-badge-clientes", false]].forEach(([sel, txt]) => { const b = $(sel); if (!b) return; if (txt) b.textContent = waiting; b.hidden = !waiting; });
  $("#clients-sub").textContent = `${state.clients.length} cliente${state.clients.length === 1 ? "" : "s"}${waiting ? ` · ${waiting} aguardando liberação` : ""} · cada um vê só as próprias contas`;
  const box = $("#clients");
  if (!list.length) {
    box.replaceChildren(h("div", { class: "empty-state clients__empty" },
      h("strong", {}, q ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"),
      h("p", {}, q ? "Tente outro nome." : "Cadastre o primeiro cliente e vincule as contas dele."),
      q ? null : h("button", { class: "btn btn--primary btn--sm", onclick: () => openEditor(null) }, "Novo cliente")));
    return;
  }
  box.replaceChildren(...list.map((c) => h("article", { class: `cli${c.active === false ? " is-off" : ""}` },
    h("div", { class: "cli__head" },
      h("span", { class: "avatar", "aria-hidden": "true" }, initials(c.name)),
      h("div", {}, h("p", { class: "cli__name" }, c.name), h("p", { class: "cli__mail" }, c.email))),
    h("div", {}, h("span", { class: "chip chip--profile" }, PROFILE_NAME[c.profile] || "Contato e loja física"), c.pending ? h("span", { class: "chip st--wait" }, "Aguardando liberação") : c.active === false ? h("span", { class: "chip st--plan" }, "Acesso pausado") : null),
    c.pending ? h("p", { class: "cli__mail" }, `Cadastro feito pelo site${c.contactName ? ` por ${c.contactName}` : ""}${c.phone ? ` · ${c.phone}` : ""}`) : null,
    h("div", { class: "cli__nets" },
      ...(() => { const ads = Array.isArray(c.ads) ? c.ads : legacy(c); const g = ads.filter((x) => x.p === "google"), m = ads.filter((x) => x.p === "meta");
        return [netLine("google", g.length && g.map((x) => x.name || x.id).join(" · "), "Google Ads"), netLine("meta", m.length && m.map((x) => x.name || x.id).join(" · "), "Meta Ads")]; })(),
      netLine("facebook", c.facebook?.pageId && (c.facebook.name || c.facebook.pageId), "Facebook"),
      netLine("instagram", c.instagram?.userId && `@${c.instagram.username || c.instagram.userId}`, "Instagram")),
    h("div", { class: "cli__actions" },
      c.active === false ? h("button", { class: "btn btn--primary btn--sm", onclick: (e) => approve(c, e.currentTarget) }, "Liberar acesso") : null,
      h("button", { class: "btn btn--ghost btn--sm", onclick: () => pickAccounts(c) }, "Contas de anúncio"),
      h("button", { class: "btn btn--ghost btn--sm", onclick: () => openEditor(c) }, "Editar"),
      h("button", { class: "btn btn--primary btn--sm", onclick: () => backend.openReport(c.id).catch((e) => toast(e.message)) }, "Ver relatório")))));
}

async function approve(c, btn) {
  btn.disabled = true;
  try {
    await backend.setActive(c.id, true);
    toast(`Acesso de ${c.name} liberado.`);
    await refreshList();
  } catch (e) { btn.disabled = false; toast(e.message); }
}

$("#search").addEventListener("input", (e) => { state.search = e.target.value; renderList(); });
$("#btn-new").addEventListener("click", () => openEditor(null));
$("#top-new").addEventListener("click", () => openEditor(null));

/* =========================================================
   EDITOR
   ========================================================= */
let form = null;
let lastFocus = null;

function openEditor(client, prefill = {}, opts = {}) {
  lastFocus = document.activeElement;
  const c = client ? structuredClone(client) : { profile: "leads", active: true, resultLabel: "Conversas no WhatsApp", ...prefill };
  if (state.demo && c.sheets) for (const k of Object.keys(c.sheets)) if (c.sheets[k] === "demo") c.sheets[k] = "";
  if (state.demo && c.salesFormUrl === "#demo") c.salesFormUrl = "";
  form = { ...c, password: "", isNew: !client };
  const d = $("#drawer");
  d.hidden = false;
  document.body.classList.add("no-scroll");
  requestAnimationFrame(() => d.classList.add("is-open"));
  state.cx = null;
  renderEditor();
  if (opts.focusConnect) { const p = $("#drawer .drawer__panel"), t = $("#cx"); if (p && t) p.scrollTop = t.offsetTop - 10; } else $("#ed-name")?.focus();
  if (client) loadCx(client.id);
}

// Teste ao vivo das contas escolhidas (últimos 30 dias)
async function loadCx(id) {
  state.cx = { loading: true, id };
  if (form?.id === id) renderEditor(true);
  try { state.cx = { id, data: await backend.connections(id) }; }
  catch (e) { state.cx = { id, error: e.message }; }
  if (form?.id === id) renderEditor(true);
}

function closeEditor() {
  const d = $("#drawer");
  if (d.hidden) return;
  d.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  setTimeout(() => (d.hidden = true), 250);
  lastFocus?.focus?.();
}
$("#drawer").addEventListener("click", (e) => e.target.closest("[data-close]") && closeEditor());
document.addEventListener("keydown", (e) => e.key === "Escape" && closeEditor());

const fld = (label, input, hint) => h("div", { class: "fld" }, h("label", { for: input.id }, label), input, hint ? h("small", {}, hint) : null);
const inp = (id, value, props = {}) => h("input", { id, value: value ?? "", ...props });

const dateBR = (s) => (s ? new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "");

async function sendInvite(f, btn) {
  btn.disabled = true;
  try {
    const { url } = await backend.invite(f.id);
    const msg = `Olá! Para acompanhar os resultados dos anúncios no painel da ${BRAND}, conecte o Google Ads e o Facebook da ${f.name} por este link (leva 1 minuto, não precisa de senha nova):\n${url}`;
    try { await navigator.clipboard.writeText(msg); toast("Mensagem com o link copiada. Cole no WhatsApp do cliente."); } catch { prompt("Copie a mensagem:", msg); }
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  } catch (e) { toast(e.message); }
  btn.disabled = false;
}

// Plano B do Google: script colado na conta do Google Ads (não depende do token de desenvolvedor)
async function copyScript(f, btn) {
  btn.disabled = true;
  try {
    const { script } = await backend.script(f.id);
    try { await navigator.clipboard.writeText(script); toast("Script copiado. Agora cole no Google Ads (passo 2)."); }
    catch { prompt("Copie o script:", script); }
    btn.textContent = "✓ Copiado — copiar de novo";
  } catch (e) { toast(e.message); }
  btn.disabled = false;
}

// Contas de anúncio do cliente: escolhidas entre as dos logins conectados (Conexões)
const adsOfForm = (f) => (Array.isArray(f.ads) ? f.ads : legacy(f));
function pickAccounts(c) {
  return conexoes.openPicker(c, { onApply: (patch) => saveClient(c, patch) });
}
function accountsBox(f) {
  if (f.isNew) return h("p", { class: "cx__new" }, "Cadastre o cliente primeiro. Em seguida você escolhe as contas de anúncio dele.");
  const ads = adsOfForm(f);
  const tests = state.cx?.data?.tests || [];
  const test = (a) => tests.find((t) => t.id === a.id && t.p === a.p);
  const ready = state.logins?.ready || {};
  const href = (p) => (state.demo ? "#clientes" : `/api/oauth/${p}?cliente=${encodeURIComponent(f.id)}`);
  return h("div", { class: "accs" },
    ads.length ? h("ul", { class: "accs__list" }, ads.map((a) => {
      const t = test(a);
      return h("li", { class: `accs__item ${t ? (t.ok ? "is-ok" : "is-bad") : ""}` }, LOGO[a.p](),
        h("div", {}, h("b", {}, a.name || a.id), h("small", {}, `${a.p === "google" ? "Google Ads" : "Meta Ads"} · ${a.id}`),
          h("p", { class: "accs__test" }, state.cx?.loading ? "Testando…" : t ? (t.ok ? `✓ Últimos 30 dias: ${t.text}` : t.text) : "")));
    })) : h("div", { class: "accs__empty" }, h("strong", {}, "Nenhuma conta escolhida"), h("p", {}, "Escolha as contas de anúncio e os números aparecem no relatório na hora.")),
    h("div", { class: "accs__btns" },
      h("button", { type: "button", class: "btn btn--primary", onclick: () => pickAccounts(f) }, ads.length ? "Trocar contas" : "Escolher contas de anúncio"),
      ready.google ? h("a", { class: "btn btn--ghost btn--sm", href: href("google"), onclick: (e) => { if (state.demo) { e.preventDefault(); toast("Na demonstração o login não abre."); } } }, LOGO.google(), "Conectar Google") : null,
      ready.meta ? h("a", { class: "btn btn--ghost btn--sm", href: href("meta"), onclick: (e) => { if (state.demo) { e.preventDefault(); toast("Na demonstração o login não abre."); } } }, LOGO.meta(), "Conectar Facebook") : null),
    h("div", { class: "cx__invite" },
      h("p", {}, h("b", {}, "Quer que o cliente conecte?"), " Mande um link: ele faz login no Google/Facebook dele e marca as contas. Sem senha nova."),
      h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: (e) => sendInvite(f, e.currentTarget) }, "Enviar link pelo WhatsApp")),
    f.facebook?.pageId || f.instagram?.userId || f.youtube?.channelId ? h("p", { class: "ed__hint" }, "Orgânico: ", [f.facebook?.name && `Facebook ${f.facebook.name}`, f.instagram?.username && `Instagram @${f.instagram.username}`, f.youtube?.name && `YouTube ${f.youtube.name}`].filter(Boolean).join(" · ")) : null);
}

// Salva só as contas (ou outro trecho) de um cliente, sem abrir o editor
async function saveClient(c, patch) {
  const base = state.clients.find((x) => x.id === c.id) || c;
  const m = { ...base, ...patch };
  await backend.save({
    id: m.id, name: m.name, contactName: m.contactName, email: m.email, username: m.username || "",
    profile: m.profile, resultLabel: m.resultLabel, note: m.note, active: m.active !== false, calendar: m.calendar !== false,
    city: m.profile === "awareness" ? m.city : undefined,
    ads: Array.isArray(m.ads) ? m.ads : legacy(m),
    metaAds: { resultActionTypes: m.metaConfig?.resultActionTypes || m.metaAds?.resultActionTypes || [] },
    facebook: m.facebook || undefined, instagram: m.instagram || undefined, youtube: m.youtube || undefined,
    sheets: m.sheets, salesFormUrl: m.profile === "leads" ? m.salesFormUrl : undefined,
  });
  toast(`Contas de ${m.name} salvas. Testando os números…`);
  await refreshList();
  if (form && form.id === c.id) { Object.assign(form, patch); renderEditor(true); }
  if (form && form.id === c.id) loadCx(c.id);
  if (currentTab() === "inicio") drawHome();
  if (currentTab() === "conexoes") conexoes.render();
}

function renderEditor(keepScroll) {
  const panel = $("#drawer .drawer__panel");
  const top = panel.scrollTop;
  const f = form;
  const set = (k) => (e) => { f[k] = e.target.value; };

  const metaTypes = f.metaConfig?.resultActionTypes?.[0] || f.metaAds?.resultActionTypes?.[0] || "";
  const resultSelect = h("select", { id: "ed-result-type", onchange: (e) => { f.metaConfig = { ...(f.metaConfig || {}), resultActionTypes: e.target.value ? [e.target.value] : [] }; } },
    h("option", { value: "" }, "— Escolha —"),
    RESULT_TYPES.map((t) => h("option", { value: t.v, selected: t.v === metaTypes }, t.label)),
    metaTypes && !RESULT_TYPES.some((t) => t.v === metaTypes) ? h("option", { value: metaTypes, selected: true }, metaTypes) : null);

  const err = h("p", { class: "ed__err", role: "alert" });
  const saveBtn = h("button", { type: "submit", class: "btn btn--primary" }, f.isNew ? "Cadastrar cliente" : "Salvar alterações");

  const el = h("form", { class: "ed", novalidate: true, onsubmit: (e) => { e.preventDefault(); save(saveBtn, err); } },
    h("div", {},
      h("p", { class: "mono muted" }, f.isNew ? "Novo cliente" : "Editar cliente"),
      h("h2", { class: "ed__title", id: "editor-title" }, f.name || "Novo cliente")),

    // 1. Cliente
    h("section", { class: "ed__sec" },
      h("h3", {}, h("span", { class: "num" }, "1"), "Cliente e acesso ao relatório"),
      h("div", { class: "row" },
        fld("Nome do cliente *", inp("ed-name", f.name, { required: true, oninput: (e) => { f.name = e.target.value; $("#editor-title").textContent = f.name || "Novo cliente"; } })),
        fld("Pessoa de contato", inp("ed-contact", f.contactName, { oninput: set("contactName"), placeholder: "Ex.: Rafael, Secretaria de Comunicação" }))),
      h("div", { class: "row" },
        fld("E-mail de acesso *", inp("ed-email", f.email, { type: "email", autocomplete: "off", oninput: set("email") }), "O cliente entra no relatório com este e-mail."),
        fld("Usuário de acesso", inp("ed-user", f.username || "", { autocomplete: "off", autocapitalize: "none", spellcheck: "false", oninput: set("username"), placeholder: "Ex.: nossaparagominas" }), "Opcional. O cliente pode entrar com o usuário no lugar do e-mail.")),
      h("div", { class: "row" },
        fld(f.isNew ? "Senha de acesso *" : "Nova senha", inp("ed-pass", "", { type: "text", autocomplete: "new-password", oninput: set("password"), placeholder: f.isNew ? "Mínimo de 4 caracteres" : "Deixe em branco para manter a atual" }),
          state.demo ? "No modo demonstração, todos os acessos usam a senha demo123." : "Envie a senha ao cliente por um canal seguro.")),
      h("label", { class: "toggle" }, h("input", { type: "checkbox", checked: f.active !== false, onchange: (e) => (f.active = e.target.checked) }), "Acesso ao relatório ativo"),
      h("div", { class: "svc" },
        h("p", { class: "svc__t" }, "Serviços contratados"),
        h("label", { class: "toggle" }, h("input", { type: "checkbox", checked: f.calendar !== false, onchange: (e) => (f.calendar = e.target.checked) }), "Calendário editorial e posts", h("small", {}, "Desligado: a aba Calendário some do relatório do cliente (ex.: cliente só de tráfego pago)")))),

    // 2. Objetivo
    h("section", { class: "ed__sec" },
      h("h3", {}, h("span", { class: "num" }, "2"), "Objetivo do cliente"),
      h("p", { class: "ed__hint" }, "Define quais números aparecem no relatório. Quem não vende pelo site não deve ver ROI."),
      h("div", { class: "profiles", role: "radiogroup", "aria-label": "Objetivo" }, PROFILES.map((p) => h("label", { class: "prof" },
        h("input", { type: "radio", name: "profile", value: p.v, checked: f.profile === p.v, onchange: () => {
          const wasDefault = !f.resultLabel || PROFILES.some((x) => x.res === f.resultLabel);
          f.profile = p.v;
          if (wasDefault) f.resultLabel = p.res;
          renderEditor(true);
        } }),
        h("strong", {}, p.name), h("span", {}, p.desc)))),
      h("div", { class: "row" },
        fld("Nome do resultado no relatório", inp("ed-result", f.resultLabel, { oninput: set("resultLabel"), placeholder: "Ex.: Conversas no WhatsApp, Agendamentos, Vendas" }), "Como o cliente chama o resultado que importa para ele."),
        f.profile !== "awareness" ? h("div", { class: "fld" }, h("label", { for: "ed-result-type" }, "O que conta como resultado na Meta"), resultSelect, h("small", {}, "No Google Ads, contam as conversões principais da conta.")) : h("div")),
      f.profile === "awareness" ? h("div", { class: "row" },
        fld("Cidade", inp("ed-city", f.city?.name, { oninput: (e) => (f.city = { ...(f.city || {}), name: e.target.value }) })),
        fld("População", inp("ed-pop", f.city?.population, { inputmode: "numeric", oninput: (e) => (f.city = { ...(f.city || {}), population: e.target.value.replace(/\D/g, "") }) }), "Mostra “o equivalente a X% da população alcançada”.")) : null),

    // 3. Contas de anúncio
    h("section", { class: "ed__sec" },
      h("h3", { id: "cx" }, h("span", { class: "num" }, "3"), "Contas de anúncio"),
      accountsBox(f)),

    // 4. Conteúdo
    h("section", { class: "ed__sec" },
      h("h3", {}, h("span", { class: "num" }, "4"), "Calendário, relatórios e vendas"),
      h("p", { class: "ed__hint" }, state.demo ? "No modo demonstração, campos vazios usam dados de exemplo." : "Links CSV publicados do Google Sheets (Arquivo → Compartilhar → Publicar na Web → CSV). Modelos em /modelos."),
      fld("Planilha do calendário editorial", inp("ed-sh-cal", f.sheets?.calendar, { type: "url", placeholder: "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv", oninput: (e) => (f.sheets = { ...(f.sheets || {}), calendar: e.target.value }) })),
      fld("Planilha dos relatórios mensais", inp("ed-sh-rep", f.sheets?.reports, { type: "url", placeholder: "https://docs.google.com/…", oninput: (e) => (f.sheets = { ...(f.sheets || {}), reports: e.target.value }) })),
      f.profile === "leads" ? h("div", { class: "row" },
        fld("Planilha de vendas informadas", inp("ed-sh-sal", f.sheets?.sales, { type: "url", placeholder: "https://docs.google.com/…", oninput: (e) => (f.sheets = { ...(f.sheets || {}), sales: e.target.value }) })),
        fld("Formulário de vendas (Google Forms)", inp("ed-form", f.salesFormUrl, { type: "url", placeholder: "https://forms.gle/…", oninput: set("salesFormUrl") }), "Abre no botão “Registrar vendas” do cliente.")) : null),

    // 5. Recado
    h("section", { class: "ed__sec" },
      h("h3", {}, h("span", { class: "num" }, "5"), "Recado da agência"),
      h("div", { class: "fld" }, h("label", { for: "ed-note" }, "Aparece no topo do relatório"),
        h("textarea", { id: "ed-note", maxlength: "600", oninput: set("note"), placeholder: "Ex.: A campanha de vacinação foi a mais vista do mês. Em dezembro, foco no IPTU com desconto." }, f.note || ""))),

    h("div", { class: "ed__foot" }, err,
      saveBtn,
      h("button", { type: "button", class: "btn btn--ghost", "data-close": "" }, "Cancelar"),
      h("span", { class: "spacer" }),
      !f.isNew && f.source !== "env" ? h("button", { type: "button", class: "btn btn--danger btn--sm", onclick: () => remove(f) }, "Excluir cliente") : null));

  $("#editor").replaceChildren(el);
  if (keepScroll) panel.scrollTop = top;
}

async function save(btn, err) {
  const f = form;
  err.textContent = "";
  if (f.isNew && !state.demo && String(f.password || "").length < 4) { err.textContent = "Defina uma senha de acesso com pelo menos 4 caracteres."; $("#ed-pass").focus(); return; }
  const payload = {
    id: f.isNew ? undefined : f.id,
    name: f.name, contactName: f.contactName, email: f.email, username: f.username || "", password: f.password || undefined,
    profile: f.profile, resultLabel: f.resultLabel, note: f.note, active: f.active !== false, calendar: f.calendar !== false,
    city: f.profile === "awareness" ? f.city : undefined,
    ads: adsOfForm(f), metaAds: { resultActionTypes: f.metaConfig?.resultActionTypes || f.metaAds?.resultActionTypes || [] }, facebook: f.facebook || undefined, instagram: f.instagram || undefined, youtube: f.youtube || undefined,
    sheets: f.sheets, salesFormUrl: f.profile === "leads" ? f.salesFormUrl : undefined,
  };
  btn.disabled = true;
  const label = btn.textContent;
  btn.textContent = "Salvando…";
  try {
    const saved = await backend.save(payload);
    closeEditor();
    toast(f.isNew ? `${f.name} cadastrado. Agora escolha as contas de anúncio dele.` : "Alterações salvas.");
    await refreshList();
    if (f.isNew && saved) { const c = state.clients.find((x) => x.id === saved.id); if (c) setTimeout(() => openEditor(c, {}, { focusConnect: true }), 300); }
  } catch (e) {
    if (e.message !== "401") err.textContent = e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

async function remove(f) {
  if (!confirm(`Excluir ${f.name}? O cliente perde o acesso ao relatório. As contas de anúncio não são afetadas.`)) return;
  try { await backend.remove(f.id); closeEditor(); toast("Cliente excluído."); await refreshList(); }
  catch (e) { toast(e.message); }
}

/* =========================================================
   LOGIN E BOOT
   ========================================================= */
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.currentTarget.querySelector("button[type=submit]");
  const errEl = $("#login-error");
  errEl.textContent = "";
  btn.disabled = true;
  try {
    const r = await backend.login($("#login-email").value.trim(), $("#login-pass").value);
    state.email = r.email;
    $("#login-pass").value = "";
    if (!state.demo) { try { state.setup = (await backend.me()).setup; } catch { /* segue */ } }
    await showApp();
  } catch (ex) {
    errEl.textContent = ex.message;
  } finally {
    btn.disabled = false;
  }
});
$("#demo-fill").addEventListener("click", () => {
  $("#login-email").value = "agencia@demo.com.br";
  $("#login-pass").value = "demo123";
  $("#login-form").requestSubmit();
});
$("#btn-logout").addEventListener("click", async () => {
  await backend.logout();
  try { localStorage.removeItem("renowa-admin"); } catch { /* */ }
  try { sessionStorage.removeItem("demo-admin"); } catch { /* */ }
  showLogin();
});

const leads = initLeads({ state, api, toast, openEditor, showTab: (t) => showTab(t) });
conexoes = initConexoes({ state, api, toast, saveClient, openClient: (c) => openEditor(c) });
const drawHome = () => renderHome({ state, leads, conexoes, go: (t) => { location.hash = t; }, openClient: (c, o = {}) => (o.accounts ? pickAccounts(c) : openEditor(c)), newClient: () => openEditor(null) });
calendar = initCalendar({ state, api, toast });

/* ---------- Busca rápida: qualquer função, lead ou cliente em um lugar ---------- */
const copy = async (text, ok) => { try { await navigator.clipboard.writeText(text); toast(ok); } catch { prompt("Copie o link:", text); } };
const nav = initNav(() => {
  const go = (tab) => () => { location.hash = tab; showTab(tab); };
  const L = leads.list();
  const pending = state.clients.filter((c) => c.pending);
  const items = [
    ...pending.map((c) => ({ group: "Precisa da sua atenção", icon: "check", label: `Liberar acesso de ${c.name}`, hint: c.contactName || c.email, keywords: c.email, run: () => approve(c, document.createElement("button")) })),
    ...(L.some((l) => l.etapa === "novo") ? [{ group: "Precisa da sua atenção", icon: "leads", label: "Leads novos para atender", hint: `${L.filter((l) => l.etapa === "novo").length} aguardando`, run: () => { go("leads")(); leads.setStage("novo"); } }] : []),
    { group: "Ir para", icon: "leads", label: "Leads · aplicações do site", hint: "CRM", keywords: "crm funil propostas", run: go("leads") },
    { group: "Ir para", icon: "clients", label: "Clientes · relatórios", hint: pending.length ? `${pending.length} aguardando liberação` : "", keywords: "relatorios contas", run: go("clientes") },
    { group: "Ir para", icon: "report", label: "Calendário editorial", hint: "montar posts dos clientes", keywords: "conteudo posts agenda publicacoes", run: go("calendario") },
    { group: "Ir para", icon: "link", label: "Conexões · Google e Facebook", hint: "conectar contas de anúncio", keywords: "meta google ads instagram conectar login contas integracao", run: go("conexoes") },
    { group: "Ir para", icon: "report", label: "Início", keywords: "painel resumo home", run: go("inicio") },
    { group: "Ir para", icon: "site", label: "Abrir o site (proposta)", hint: "nova aba", keywords: "home pagina inicial", run: () => window.open("/", "_blank", "noopener") },
    { group: "Ir para", icon: "portal", label: "Área do Cliente", hint: "nova aba", keywords: "portal login cliente", run: () => window.open("/cliente/", "_blank", "noopener") },
    { group: "Ações", icon: "plus", label: "Cadastrar novo cliente", keywords: "criar adicionar", run: () => { go("clientes")(); openEditor(null); } },
    { group: "Ações", icon: "plus", label: "Nova publicação no calendário", keywords: "post agendar conteudo", run: () => { go("calendario")(); setTimeout(() => calendar.open(null), 300); } },
    ...state.clients.filter((c) => !c.pending && c.calendar !== false).map((c) => ({ group: "Calendário", icon: "report", label: `Calendário de ${c.name}`, keywords: "posts conteudo agenda", searchOnly: true, run: () => { go("calendario")(); } })),
    { group: "Ações", icon: "link", label: "Copiar link do site", keywords: "compartilhar url", run: () => copy(location.origin + "/", "Link do site copiado.") },
    { group: "Ações", icon: "refresh", label: "Atualizar leads e clientes", keywords: "recarregar", run: async () => { await Promise.all([leads.refresh(), refreshList()]); toast("Atualizado."); } },
    ...STAGES.map((s) => ({ group: "Filtrar leads", icon: "filter", label: `Leads: ${s.name}`, hint: `${L.filter((l) => l.etapa === s.v).length}`, keywords: "etapa funil", searchOnly: true, run: () => { go("leads")(); leads.setStage(s.v); } })),
    ...L.map((l) => ({ group: "Leads", icon: "person", label: l.nome, hint: [l.empresa, l.whatsapp].filter(Boolean).join(" · "), keywords: `${l.email} ${l.empresa}`, searchOnly: true, run: () => { go("leads")(); leads.open(l.id); } })),
    ...state.clients.flatMap((c) => [
      { group: "Clientes", icon: "report", label: `${c.name} · ver relatório`, hint: c.email, keywords: c.contactName || "", searchOnly: true, run: () => backend.openReport(c.id).catch((e) => toast(e.message)) },
      { group: "Clientes", icon: "link", label: `${c.name} · escolher contas de anúncio`, keywords: `${c.email} google meta ads`, searchOnly: true, run: () => pickAccounts(c) },
      { group: "Clientes", icon: "clients", label: `${c.name} · editar e contas`, hint: c.pending ? "aguardando liberação" : "", keywords: `${c.email} ${c.contactName || ""}`, searchOnly: true, run: () => { go("clientes")(); openEditor(c); } },
    ]),
    { group: "Conta", icon: "out", label: "Sair do painel", searchOnly: true, run: () => $("#btn-logout").click() },
  ];
  return items;
});
$("#btn-find").addEventListener("click", () => nav.show());
$("#find-kbd").textContent = KEY_HINT;
// o selo de leads novos também aparece no menu do celular
new MutationObserver(() => { const b = $("#tab-badge-leads"), d = $("#dock-badge-leads"); if (b && d) d.hidden = b.hidden; }).observe($("#tab-badge-leads"), { attributes: true, childList: true });

async function boot() {
  $$("[data-brand]").forEach((n) => (n.textContent = BRAND));
  let res;
  try { res = await fetch("/api/admin/me", { credentials: "same-origin" }); } catch { res = { status: 0 }; }
  if (res.status === 200) {
    const me = await res.json();
    state.email = me.email; state.setup = me.setup;
    await showApp();
  } else if (res.status === 401) {
    showLogin();
  } else {
    state.demo = true;
    let saved = null;
    try { saved = sessionStorage.getItem("demo-admin"); } catch { /* sem storage */ }
    if (saved) { state.email = saved; await showApp(); } else showLogin();
  }
  $("#boot").classList.add("is-done");
  setTimeout(() => $("#boot")?.remove(), 500);
}
boot();
