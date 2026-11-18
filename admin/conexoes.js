// Conexões, estilo UTMify: "Conectar Google" / "Conectar Facebook" → login → contas aparecem →
// para cada cliente, marque uma ou várias contas e os números entram no relatório.
import { h, $ } from "/cliente/assets/util.js";

export const LOGO = {
  google: () => h("span", { class: "plogo plogo--google", "aria-hidden": "true", html: '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.2H2.1a11 11 0 0 0 0 9.6z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.2L5.7 10c.9-2.6 3.4-4.6 6.3-4.6z"/></svg>' }),
  meta: () => h("span", { class: "plogo plogo--meta", "aria-hidden": "true", html: '<svg viewBox="0 0 24 24"><path fill="#fff" d="M13.4 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V10.4H7.7v3h2.6V21z"/></svg>' }),
};
const NAME = { google: "Google Ads", meta: "Facebook e Instagram" };
const dateBR = (s) => (s ? new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "");
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;

const DEMO = {
  ready: { google: true, meta: true },
  redirect: { google: `${location.origin}/api/oauth/google`, meta: `${location.origin}/api/oauth/meta` },
  meta: { appId: "" },
  logins: [
    { id: "g1", provider: "google", label: "Agência Renowa (MCC)", connectedAt: new Date(Date.now() - 3 * 864e5).toISOString(), accounts: [
      { id: "482-113-9021", name: "Prefeitura de Vale Verde", status: "Ativa", loginCustomerId: "100-200-3000" },
      { id: "731-554-2210", name: "Casa Bella Móveis", status: "Ativa", loginCustomerId: "100-200-3000" },
      { id: "915-002-7713", name: "Maison Lume — E-commerce", status: "Ativa", loginCustomerId: "100-200-3000" }] },
    { id: "m1", provider: "meta", label: "Renowa Agência", connectedAt: new Date(Date.now() - 9 * 864e5).toISOString(), expiresAt: new Date(Date.now() + 51 * 864e5).toISOString(), accounts: [
      { id: "act_1029384756", name: "PMVV — Comunicação", status: "Ativa", business: "Prefeitura de Vale Verde" },
      { id: "act_5566778899", name: "Casa Bella — Anúncios", status: "Ativa", business: "Casa Bella Móveis" }],
      pages: [{ id: "100200300400", name: "Prefeitura de Vale Verde", instagram: { id: "17841400000000001", username: "prefvaleverde" } }, { id: "100200300401", name: "Casa Bella Móveis", instagram: { id: "17841400000000002", username: "casabellamoveis" } }] },
  ],
};

export function initConexoes({ state, api, toast, saveClient, openClient }) {
  let data = null, loading = false;

  async function load() {
    if (state.demo) { data = structuredClone(DEMO); render(); return data; }
    loading = true; render();
    try { data = await api("/api/admin/logins"); } catch (e) { if (e.message !== "401") toast(e.message); }
    loading = false; render();
    state.logins = data;
    return data;
  }
  const get = async () => data || (await load());

  const connectHref = (p, clientId) => (state.demo ? "#conexoes" : `/api/oauth/${p}${clientId ? `?cliente=${encodeURIComponent(clientId)}` : ""}`);
  const demoClick = (e) => { if (state.demo) { e.preventDefault(); toast("Na demonstração o login não abre. No painel real, este botão leva para o Google/Facebook."); } };

  function usedBy(accId) {
    return state.clients.filter((c) => (c.ads || []).some((a) => a.id === accId) || c.googleAds?.customerId === accId || c.metaAds?.adAccountId === accId).map((c) => c.name);
  }

  async function refresh(L, btn) {
    btn.disabled = true; btn.textContent = "Atualizando…";
    try {
      if (!state.demo) { const r = await api("/api/admin/logins", { method: "POST", body: JSON.stringify({ action: "refresh", id: L.id }) }); Object.assign(L, r.login); }
      toast("Lista de contas atualizada."); render();
    } catch (e) { toast(e.message); btn.disabled = false; }
  }
  async function remove(L) {
    if (!confirm(`Remover o login “${L.label}”? Os clientes que usam contas dele param de receber esses números até você conectar de novo.`)) return;
    try {
      if (!state.demo) await api(`/api/admin/logins?id=${encodeURIComponent(L.id)}`, { method: "DELETE" });
      data.logins = data.logins.filter((x) => x.id !== L.id); render(); toast("Login removido.");
    } catch (e) { toast(e.message); }
  }

  // ---------- Página Conexões ----------
  function providerTile(p) {
    const ready = data?.ready?.[p];
    const mine = (data?.logins || []).filter((L) => L.provider === p);
    const accs = mine.reduce((s, L) => s + (L.accounts?.length || 0), 0);
    return h("article", { class: `ptile ptile--${p}${ready ? "" : " is-off"}`, "data-3d-host": "" },
      h("div", { class: "ptile__glow", "aria-hidden": "true" }),
      h("header", {}, LOGO[p](), h("div", {}, h("h2", {}, NAME[p]), h("p", {}, ready ? (mine.length ? `${plural(mine.length, "login", "logins")} · ${plural(accs, "conta de anúncio", "contas de anúncio")}` : "Nenhum login conectado ainda") : "Falta ativar (uma vez só)"))),
      ready
        ? h("a", { class: `btn btn--xl ${p === "google" ? "btn--google" : "btn--fb"}`, href: connectHref(p), onclick: demoClick }, LOGO[p](), p === "google" ? "Conectar com Google" : "Conectar com Facebook")
        : setupBox(p));
  }

  function setupBox(p) {
    if (p === "google") return h("p", { class: "ptile__note" }, "As credenciais do Google ainda não foram salvas. Fale com o suporte do site para ativar.");
    const uri = data?.redirect?.meta || "";
    const field = (id, label, type = "text") => h("label", { class: "fld" }, h("span", {}, label), h("input", { id, type, autocomplete: "off", spellcheck: "false" }));
    return h("details", { class: "ptile__setup", open: true },
      h("summary", {}, "Ativar o Facebook — 5 minutos, uma vez só"),
      h("ol", { class: "steps" },
        h("li", {}, h("span", {}, "Abra ", h("a", { href: "https://developers.facebook.com/apps/creation/", target: "_blank", rel: "noopener" }, "developers.facebook.com/apps"), " → ", h("b", {}, "Criar app"), " → caso de uso ", h("b", {}, "Outro"), " → tipo ", h("b", {}, "Empresa"), ". Nome: Renowa.")),
        h("li", {}, h("span", {}, "No painel do app, adicione o produto ", h("b", {}, "Login do Facebook para Empresas"), ". Em Configurações, cole em ", h("b", {}, "URIs de redirecionamento do OAuth válidos"), ":", h("code", { class: "copy", onclick: () => copy(uri) }, uri, h("small", {}, "copiar")))),
        h("li", {}, h("span", {}, "Em ", h("b", {}, "Configurações do app → Básico"), ", copie o ", h("b", {}, "ID do app"), " e a ", h("b", {}, "Chave secreta"), " e cole aqui:"))),
      h("div", { class: "row2" }, field("meta-appid", "ID do app"), field("meta-secret", "Chave secreta", "password")),
      h("button", { type: "button", class: "btn btn--primary", onclick: (e) => saveMeta(e.currentTarget) }, "Ativar botão do Facebook"));
  }
  async function copy(t) { try { await navigator.clipboard.writeText(t); toast("Copiado."); } catch { prompt("Copie:", t); } }
  async function saveMeta(btn) {
    const appId = $("#meta-appid").value.trim(), appSecret = $("#meta-secret").value.trim();
    if (!appId || !appSecret) { toast("Cole o ID do app e a chave secreta."); return; }
    btn.disabled = true;
    try {
      if (state.demo) throw new Error("Na demonstração nada é salvo.");
      await api("/api/admin/integrations", { method: "POST", body: JSON.stringify({ provider: "meta", appId, appSecret }) });
      toast("Facebook ativado. Agora é só clicar em Conectar com Facebook."); await load();
    } catch (e) { toast(e.message); btn.disabled = false; }
  }

  function loginCard(L) {
    const left = L.expiresAt ? Math.ceil((new Date(L.expiresAt) - Date.now()) / 864e5) : null;
    return h("article", { class: `lcard${L.error ? " is-bad" : ""}` },
      h("header", {}, LOGO[L.provider](),
        h("div", {}, h("strong", {}, L.label || NAME[L.provider]), h("small", {}, `${L.by === "cliente" ? "Conectado pelo cliente" : "Conectado pela agência"} · ${dateBR(L.connectedAt)}${left != null ? ` · vale mais ${left} dias` : ""}`)),
        h("div", { class: "lcard__act" },
          h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: (e) => refresh(L, e.currentTarget) }, "Atualizar contas"),
          h("a", { class: "btn btn--ghost btn--sm", href: connectHref(L.provider), onclick: demoClick }, "Reconectar"),
          h("button", { type: "button", class: "icon-btn", title: "Remover login", "aria-label": "Remover login", onclick: () => remove(L) }, h("span", { html: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>' })))),
      L.error ? h("p", { class: "lcard__err" }, L.error) : null,
      (L.accounts || []).length
        ? h("ul", { class: "acclist" }, L.accounts.map((a) => {
          const who = usedBy(a.id);
          return h("li", {}, h("span", { class: `dot ${a.status === "Ativa" ? "is-on" : ""}`, title: a.status }), h("span", { class: "acclist__name" }, a.name), h("code", {}, a.id),
            who.length ? h("span", { class: "tag tag--on" }, who.join(", ")) : h("span", { class: "tag" }, "sem cliente"));
        }))
        : !L.error ? h("p", { class: "muted" }, "Nenhuma conta de anúncio neste login.") : null,
      L.provider === "meta" && (L.pages || []).length ? h("p", { class: "lcard__pages" }, plural(L.pages.length, "página", "páginas"), " · ", plural(L.pages.filter((p) => p.instagram).length, "Instagram", "Instagrams")) : null);
  }

  function render() {
    const box = $("#conexoes");
    if (!box) return;
    if (!data) { box.replaceChildren(h("div", { class: "skeleton-grid" }, h("div", { class: "sk" }), h("div", { class: "sk" }))); return; }
    const logins = data.logins || [];
    box.replaceChildren(
      h("div", { class: "how" },
        ["Clique em Conectar", "Faça login no Google ou Facebook", "Escolha as contas de cada cliente"].map((t, i) => h("div", { class: "how__step" }, h("b", {}, String(i + 1)), h("span", {}, t)))),
      h("div", { class: "ptiles" }, providerTile("google"), providerTile("meta")),
      h("section", { class: "block" },
        h("header", { class: "block__head" }, h("h2", {}, "Logins conectados"), h("p", {}, "Cada login mostra as contas de anúncio que ele enxerga. Para escolher as contas de um cliente, abra o cliente em Clientes → ", h("b", {}, "Contas de anúncio"), ".")),
        logins.length ? h("div", { class: "lcards" }, logins.map(loginCard)) : h("div", { class: "empty-state" }, h("strong", {}, loading ? "Carregando…" : "Nenhum login ainda"), h("p", {}, "Clique em Conectar com Google ou com Facebook acima."))));
  }

  // ---------- Escolher contas de um cliente (modal) ----------
  async function openPicker(client, { focusLogin, onApply } = {}) {
    const d = await get();
    if (!d) return;
    const picked = new Map((client.ads || legacy(client)).map((a) => [`${a.p}:${a.id}`, a]));
    let page = client.facebook?.pageId ? { id: client.facebook.pageId, login: client.facebook.login } : null;
    let q = "", pageTouched = false;
    const modal = $("#picker");
    const body = h("div", { class: "picker__body" });
    const count = h("span", {});
    const draw = () => {
      const logins = (d.logins || []).filter((L) => !L.clientId || L.clientId === client.id);
      const match = (a) => !q || `${a.name} ${a.id} ${a.business || ""}`.toLowerCase().includes(q);
      body.replaceChildren(...(logins.length ? logins.map((L) => h("section", { class: `pgroup${focusLogin === L.id ? " is-new" : ""}` },
        h("header", {}, LOGO[L.provider](), h("div", {}, h("strong", {}, L.label), h("small", {}, focusLogin === L.id ? "Acabou de conectar" : `${NAME[L.provider]} · ${plural(L.accounts?.length || 0, "conta", "contas")}`))),
        L.error ? h("p", { class: "lcard__err" }, L.error) : null,
        h("div", { class: "opts" }, (L.accounts || []).filter(match).map((a) => {
          const key = `${L.provider}:${a.id}`;
          return h("label", { class: "opt" }, h("input", { type: "checkbox", checked: picked.has(key), onchange: (e) => {
            if (e.target.checked) picked.set(key, { p: L.provider, login: L.id, id: a.id, name: a.name, loginCustomerId: a.loginCustomerId || "", currency: a.currency || "" });
            else picked.delete(key);
            upd();
          } }), h("span", { class: "opt__box", "aria-hidden": "true" }), h("span", { class: "opt__txt" }, h("b", {}, a.name), h("small", {}, `${a.id}${a.business ? ` · ${a.business}` : ""}${a.status && a.status !== "Ativa" ? ` · ${a.status}` : ""}`)));
        })),
        L.provider === "meta" && (L.pages || []).length ? h("div", { class: "pages" }, h("p", { class: "pages__t" }, "Página do Facebook e Instagram (posts e alcance orgânico)"),
          h("div", { class: "opts" }, [{ id: "", name: "Nenhuma" }, ...L.pages].filter((p) => !p.id || match(p)).map((p) => h("label", { class: "opt opt--radio" },
            h("input", { type: "radio", name: `page-${L.id}`, checked: p.id ? page?.id === p.id : !page || page.login !== L.id, onchange: () => { pageTouched = true; page = p.id ? { id: p.id, login: L.id, name: p.name, instagram: p.instagram } : null; } }),
            h("span", { class: "opt__box", "aria-hidden": "true" }), h("span", { class: "opt__txt" }, h("b", {}, p.name), p.id ? h("small", {}, p.instagram ? `Instagram @${p.instagram.username}` : "sem Instagram ligado") : null))))) : null))
        : [h("div", { class: "empty-state" }, h("strong", {}, "Nenhum login conectado"), h("p", {}, "Conecte o Google ou o Facebook abaixo; as contas aparecem aqui na hora."))]));
    };
    const upd = () => { count.textContent = picked.size ? `Salvar ${plural(picked.size, "conta", "contas")}` : "Salvar sem contas"; };
    const close = () => { modal.classList.remove("is-open"); setTimeout(() => (modal.hidden = true), 250); document.body.classList.remove("no-scroll"); };
    const apply = async (btn) => {
      btn.disabled = true;
      const ads = [...picked.values()];
      const pg = page && (d.logins.find((L) => L.id === page.login)?.pages || []).find((p) => p.id === page.id);
      const patch = { ads };
      if (pageTouched) {
        patch.facebook = pg ? { pageId: pg.id, name: pg.name, login: page.login } : null;
        patch.instagram = pg?.instagram ? { userId: pg.instagram.id, username: pg.instagram.username, login: page.login } : null;
      }
      try { await onApply(patch); close(); } catch (e) { toast(e.message); btn.disabled = false; }
    };
    upd(); draw();
    modal.replaceChildren(h("div", { class: "picker__backdrop", onclick: close }),
      h("section", { class: "picker__panel", role: "dialog", "aria-modal": "true", "aria-label": `Contas de ${client.name}` },
        h("header", { class: "picker__head" },
          h("div", {}, h("p", { class: "kicker" }, "Contas de anúncio"), h("h2", {}, client.name)),
          h("button", { type: "button", class: "icon-btn", "aria-label": "Fechar", onclick: close, html: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>' })),
        h("input", { class: "picker__search", type: "search", placeholder: "Buscar conta pelo nome ou número", oninput: (e) => { q = e.target.value.trim().toLowerCase(); draw(); } }),
        body,
        h("div", { class: "picker__more" }, h("span", {}, "Não achou a conta?"),
          d.ready.google ? h("a", { class: "btn btn--ghost btn--sm", href: connectHref("google", client.id), onclick: demoClick }, LOGO.google(), "Conectar outro Google") : null,
          d.ready.meta ? h("a", { class: "btn btn--ghost btn--sm", href: connectHref("meta", client.id), onclick: demoClick }, LOGO.meta(), "Conectar outro Facebook") : null),
        h("footer", { class: "picker__foot" },
          h("button", { type: "button", class: "btn btn--ghost", onclick: close }, "Cancelar"),
          h("button", { type: "button", class: "btn btn--primary", onclick: (e) => apply(e.currentTarget) }, count))));
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => modal.classList.add("is-open"));
  }

  // volta do Google/Facebook: ?login=…&cliente=… → abre a escolha de contas daquele cliente
  async function handleReturn() {
    const qs = new URLSearchParams(location.search);
    if (!qs.get("conexao")) return;
    const err = qs.get("erro"), login = qs.get("login"), cid = qs.get("cliente");
    history.replaceState(null, "", `${location.pathname}${cid ? "#clientes" : "#conexoes"}`);
    if (err) { toast(err); return; }
    await load();
    const L = data?.logins?.find((x) => x.id === login);
    toast(L ? `${L.label} conectado: ${plural(L.accounts?.length || 0, "conta encontrada", "contas encontradas")}.` : "Conectado.");
    const c = cid && state.clients.find((x) => x.id === cid);
    if (c) openPicker(c, { focusLogin: login, onApply: (patch) => saveClient(c, patch) });
  }

  return { load, render, openPicker, handleReturn, get data() { return data; } };
}

export function legacy(c) {
  const out = [];
  if (c.googleAds?.customerId) out.push({ p: "google", id: c.googleAds.customerId, name: c.googleAds.name || "", loginCustomerId: c.googleAds.loginCustomerId || "", login: c.googleAds.login || "" });
  if (c.metaAds?.adAccountId) out.push({ p: "meta", id: c.metaAds.adAccountId, name: c.metaAds.name || "", login: "" });
  return out;
}
