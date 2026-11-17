// Núcleo do portal: login, menu, rotas, período, carregamento e atualização ao vivo.
import { h, $, $$, icon, setCurrency, iso, today, addDays, parseISO, daysBetween, fmtFull } from "./util.js";
import { api, createSource, SessionExpired } from "./data.js";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, demoClientByEmail, demoClientById } from "./demo.js";
import { PROFILE_TEXT } from "./model.js";
import { renderOverview } from "./views/overview.js";
import { renderAds } from "./views/ads.js";
import { renderSocial } from "./views/social.js";
import { renderCalendar } from "./views/calendar.js";
import { renderHistory } from "./views/history.js";

const CONFIG = {
  brand: "Renowa",
  refreshSeconds: 60,
  // Sem API (ex.: servidor local estático) o portal abre em modo demonstração. false desliga de vez.
  allowDemo: true,
};

const store = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* bloqueado */ } },
  del: (k) => { try { sessionStorage.removeItem(k); } catch { /* bloqueado */ } },
};

export const state = {
  demo: false,
  client: null,
  source: null,
  route: "resumo",
  preset: "30",
  from: null, to: null, prevFrom: null, prevTo: null,
  platform: "all",
  metrics: null,     // { rows, prev, summary, sources, updatedAt }
  social: null,
  content: null,     // { calendar, sales, reports }
  history: null,
  timer: null,
  loading: 0,
};

/* =========================================================
   ROTAS
   ========================================================= */
const ROUTES = {
  resumo: { label: "Resumo", icon: "home", period: true, render: renderOverview, title: (c) => c.name, kicker: "Visão geral" },
  anuncios: { label: "Anúncios", icon: "ads", period: true, render: renderAds, title: () => "Anúncios", kicker: "Tráfego pago · Google e Meta", show: (c) => c.platforms.google || c.platforms.meta },
  social: { label: "Social media", icon: "social", period: true, render: renderSocial, title: () => "Social media", kicker: "Instagram e Facebook · conteúdo orgânico", show: (c) => c.has.instagram || c.has.facebook || c.has.calendar },
  calendario: { label: "Calendário", icon: "calendar", period: false, render: renderCalendar, title: () => "Calendário editorial", kicker: "O que vamos publicar", show: (c) => c.has.calendar },
  historico: { label: "Histórico", icon: "history", period: false, render: renderHistory, title: () => "Histórico", kicker: "Últimos 12 meses" },
};
const visibleRoutes = () => Object.entries(ROUTES).filter(([, r]) => !r.show || r.show(state.client));

function buildNav() {
  const nav = $("#nav"), tab = $("#tabbar");
  nav.replaceChildren(); tab.replaceChildren();
  for (const [id, r] of visibleRoutes()) {
    nav.append(h("a", { href: `#${id}`, class: "side__item", "data-route": id }, icon(r.icon), r.label));
    tab.append(h("a", { href: `#${id}`, class: "tab", "data-route": id }, icon(r.icon), h("span", {}, r.label.split(" ")[0])));
  }
}

function currentRoute() {
  const id = location.hash.slice(1);
  return visibleRoutes().some(([k]) => k === id) ? id : "resumo";
}

window.addEventListener("hashchange", () => state.client && go(currentRoute()));

export function go(route) {
  state.route = route;
  const r = ROUTES[route];
  $$("[data-route]").forEach((a) => a.setAttribute("aria-current", a.dataset.route === route ? "page" : "false"));
  $("#page-kicker").textContent = r.kicker;
  $("#page-title").textContent = r.title(state.client);
  $("#range-presets").hidden = !r.period;
  updateSub();
  render();
  $("#main").focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}

function updateSub() {
  const r = ROUTES[state.route];
  const sub = $("#page-sub");
  if (!r.period) { sub.textContent = state.route === "resumo" ? "" : ""; return; }
  sub.textContent = state.from === state.to
    ? fmtFull(state.from)
    : `${fmtFull(state.from)} — ${fmtFull(state.to)} · comparado ao período anterior`;
}

export function render() {
  const view = $("#view");
  view.classList.toggle("is-loading", state.loading > 0);
  try {
    ROUTES[state.route].render(view, state, { refreshContent: loadContent, toast, openDrawer, loadHistory, setPlatform });
  } catch (e) {
    console.error(e);
    view.replaceChildren(h("div", { class: "empty-state" }, "Não foi possível exibir esta seção."));
  }
  const failed = Object.values(state.metrics?.sources || {}).filter((s) => !s.ok).map((s) => s.error);
  $("#source-alert").hidden = !failed.length || !ROUTES[state.route].period;
  $("#source-alert").textContent = failed.length ? `${failed.join(" ")} Os números podem estar incompletos.` : "";
}

/* =========================================================
   PERÍODO
   ========================================================= */
function computeRange(preset) {
  const t = parseISO(today());
  if (preset === "month") return [iso(new Date(t.getFullYear(), t.getMonth(), 1)), iso(t)];
  if (preset === "lastmonth") return [iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), iso(new Date(t.getFullYear(), t.getMonth(), 0))];
  const n = parseInt(preset, 10);
  return [iso(addDays(t, -(n - 1))), iso(t)];
}

function setPreset(preset, reload = true) {
  state.preset = preset;
  $$("#range-presets [data-range]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.range === preset)));
  [state.from, state.to] = computeRange(preset);
  const len = daysBetween(state.from, state.to);
  state.prevTo = iso(addDays(state.from, -1));
  state.prevFrom = preset === "lastmonth" || preset === "month"
    ? iso(new Date(parseISO(state.from).getFullYear(), parseISO(state.from).getMonth() - 1, 1))
    : iso(addDays(state.from, -len));
  updateSub();
  if (reload) loadPeriod();
}
$("#range-presets").addEventListener("click", (e) => {
  const b = e.target.closest("[data-range]");
  if (b) setPreset(b.dataset.range);
});

function setPlatform(p) { state.platform = p; render(); }

/* =========================================================
   CARREGAMENTO
   ========================================================= */
async function guard(fn) {
  state.loading++;
  $("#btn-refresh").classList.add("is-spinning");
  render();
  try { await fn(); setLive(true); }
  catch (e) {
    if (e instanceof SessionExpired) { showLogin(e.message); return; }
    console.error(e);
    setLive(false, e.message);
  } finally {
    state.loading = Math.max(0, state.loading - 1);
    if (!state.loading) $("#btn-refresh").classList.remove("is-spinning");
    if (state.client) render();
  }
}

function loadPeriod() {
  return guard(async () => {
    const { from, to, prevFrom } = state;
    const [m, s] = await Promise.all([
      state.source.metrics(prevFrom, to, from),
      state.source.social(from, to).catch(() => ({ instagram: { connected: true, error: "Instagram indisponível agora.", posts: [] }, facebook: { connected: false } })),
    ]);
    if (from !== state.from) return; // usuário trocou o período no meio
    state.metrics = {
      rows: m.rows.filter((r) => r.date >= from && r.date <= to),
      prev: m.rows.filter((r) => r.date >= state.prevFrom && r.date <= state.prevTo),
      summary: m.summary, sources: m.sources, updatedAt: new Date(m.updatedAt || Date.now()),
    };
    state.social = s;
  });
}

function loadContent() {
  return guard(async () => { state.content = await state.source.content(); });
}

export function loadHistory(force) {
  if (state.historyLoading || (state.history && !force)) return;
  state.historyLoading = true;
  const t = parseISO(today());
  const from = iso(new Date(t.getFullYear(), t.getMonth() - 11, 1));
  return guard(async () => {
    try {
      const m = await state.source.metrics(from, today(), from);
      state.history = { from, rows: m.rows };
    } finally { state.historyLoading = false; }
  });
}

function refreshAll(silent) {
  loadPeriod();
  loadContent();
  if (state.route === "historico") loadHistory(true);
  else state.history = null;
}

/* ---------- Ao vivo ---------- */
function startLive() {
  stopLive();
  state.timer = setInterval(() => document.visibilityState === "visible" && refreshAll(true), CONFIG.refreshSeconds * 1000);
}
function stopLive() { clearInterval(state.timer); state.timer = null; }
function setLive(ok, message) {
  const live = $("#live");
  live.classList.toggle("is-on", ok);
  live.classList.toggle("is-error", !ok);
  $("#live-text").textContent = ok
    ? `Atualizado às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : message || "Sem conexão";
}
$("#btn-refresh").addEventListener("click", () => refreshAll());
$("#btn-print").addEventListener("click", () => window.print());

/* =========================================================
   UI COMPARTILHADA
   ========================================================= */
let toastTimer;
export function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 4200);
}

let lastFocus = null;
export function openDrawer(content, titleId) {
  lastFocus = document.activeElement;
  const d = $("#drawer");
  $("#drawer-body").replaceChildren(content);
  d.hidden = false;
  document.body.classList.add("no-scroll");
  requestAnimationFrame(() => d.classList.add("is-open"));
  $(".drawer__close", d).focus();
}
function closeDrawer() {
  const d = $("#drawer");
  if (d.hidden) return;
  d.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  setTimeout(() => (d.hidden = true), 250);
  lastFocus?.focus?.();
}
$("#drawer").addEventListener("click", (e) => e.target.closest("[data-close]") && closeDrawer());
document.addEventListener("keydown", (e) => e.key === "Escape" && closeDrawer());

/* =========================================================
   LOGIN / SESSÃO
   ========================================================= */
function showLogin(message) {
  stopLive();
  state.client = null;
  $("#view-app").hidden = true;
  $("#view-login").hidden = false;
  $("#demo-hint").hidden = !state.demo;
  $("#login-error").textContent = message || "";
  $("#login-email").focus();
}

function showApp() {
  const c = state.client;
  setCurrency(c.currency);
  state.source = createSource(state.demo, c);
  state.metrics = state.social = state.content = state.history = null;

  $("#view-login").hidden = true;
  $("#view-app").hidden = false;
  $("#demo-banner").hidden = !state.demo;
  $("#agency-banner").hidden = c.viewer !== "agency";
  $("#client-name-side").textContent = c.name;
  $("#client-profile").textContent = PROFILE_TEXT[c.profile].name;
  $("#client-avatar").textContent = c.name.split(/\s+/).filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const talk = $("#talk-agency");
  talk.hidden = !c.agencyWhatsapp;
  if (c.agencyWhatsapp) {
    talk.href = `https://wa.me/${c.agencyWhatsapp}?text=${encodeURIComponent(`Olá! Aqui é ${c.contact || ""} (${c.name}).`)}`;
    talk.replaceChildren(icon("whatsapp"), "Falar com a agência");
  }
  $("#btn-logout").replaceChildren(icon("logout"), "Sair");

  buildNav();
  setPreset(state.preset, false);
  loadPeriod();
  loadContent();
  go(currentRoute());
  startLive();
}

async function logout() {
  if (state.client?.viewer === "agency") { store.del("demo-client"); store.del("demo-viewer"); location.href = "/admin/"; return; }
  if (state.demo) store.del("demo-client");
  else await api("/api/logout", { method: "POST" }).catch(() => {});
  location.hash = "";
  showLogin();
}
$("#btn-logout").addEventListener("click", logout);
$("#btn-logout-top").addEventListener("click", logout);
$("#demo-switch").addEventListener("click", logout);

$(".pass__toggle").addEventListener("click", (e) => {
  const input = $("#login-pass");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  e.currentTarget.textContent = show ? "Ocultar" : "Mostrar";
  e.currentTarget.setAttribute("aria-pressed", String(show));
});

async function signIn(email, password) {
  if (state.demo) {
    await new Promise((r) => setTimeout(r, 350));
    const c = demoClientByEmail(email);
    if (!c || password !== DEMO_PASSWORD) throw new Error("E-mail ou senha incorretos.");
    store.set("demo-client", c.id);
    return c;
  }
  const r = await api("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
  if (!r.ok) throw new Error(r.data?.error || "Não foi possível entrar.");
  return r.data.client;
}

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#login-email").value.trim();
  const password = $("#login-pass").value;
  const err = $("#login-error");
  const btn = e.currentTarget.querySelector("button[type=submit]");
  if (!email || !password) { err.textContent = "Informe e-mail e senha."; return; }
  btn.disabled = true;
  btn.querySelector("span").textContent = "Entrando…";
  err.textContent = "";
  try {
    state.client = await signIn(email, password);
    $("#login-pass").value = "";
    showApp();
  } catch (ex) {
    err.textContent = ex.message;
  } finally {
    btn.disabled = false;
    btn.querySelector("span").textContent = "Entrar";
  }
});

/* =========================================================
   BOOT
   ========================================================= */
async function boot() {
  $$("[data-brand]").forEach((n) => (n.textContent = CONFIG.brand));
  document.title = `Área do Cliente · ${CONFIG.brand}`;
  $("#main").tabIndex = -1;

  let me;
  try { me = await api("/api/me"); } catch { me = { status: 0 }; }

  if (me.status === 200) { state.client = me.data.client; showApp(); }
  else if (me.status === 401) showLogin();
  else if (CONFIG.allowDemo) {
    state.demo = true;
    const box = $("#demo-accounts");
    DEMO_ACCOUNTS.forEach((a) =>
      box.append(h("button", {
        type: "button", class: "demo-pill",
        onclick: () => { $("#login-email").value = a.email; $("#login-pass").value = DEMO_PASSWORD; $("#login-form").requestSubmit(); },
      }, h("strong", {}, a.label), h("small", {}, a.hint)))
    );
    const saved = demoClientById(store.get("demo-client"), store.get("demo-viewer") || "client");
    if (saved) { state.client = saved; showApp(); } else showLogin();
  } else showLogin("Portal em configuração. Fale com a agência.");

  $("#boot").classList.add("is-done");
  setTimeout(() => $("#boot")?.remove(), 500);
}

boot();
