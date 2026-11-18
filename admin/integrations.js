// Aba Integrações: "Continuar com Facebook" e "Continuar com Google".
// Conectou uma vez → todas as contas de anúncio, páginas e Instagrams que esse login enxerga
// ficam disponíveis para vincular aos clientes.
import { h, $ } from "/cliente/assets/util.js";

const dateBR = (s) => (s ? new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "");
const daysLeft = (s) => (s ? Math.ceil((new Date(s) - Date.now()) / 86400000) : null);

const LOGO = {
  meta: () => h("span", { class: "int__logo int__logo--meta", "aria-hidden": "true" },
    h("span", { html: '<svg viewBox="0 0 24 24"><path fill="#fff" d="M13.4 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V10.4H7.7v3h2.6V21z"/></svg>' }),
    h("span", { class: "int__ig", html: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="#fff"/></svg>' })),
  google: () => h("span", { class: "int__logo int__logo--google", "aria-hidden": "true", html: '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.2H2.1a11 11 0 0 0 0 9.6z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.2L5.7 10c.9-2.6 3.4-4.6 6.3-4.6z"/></svg>' }),
};

export function initIntegrations({ state, api, toast }) {
  let data = null, loading = false;

  async function load(withCounts = true) {
    if (state.demo) {
      data = demoData();
    } else {
      loading = true; render();
      try { data = await api(`/api/admin/integrations${withCounts ? "?counts=1" : ""}`); }
      catch (e) { if (e.message !== "401") toast(e.message); }
      loading = false;
    }
    render();
  }

  function copyBtn(text) {
    return h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: async () => {
      try { await navigator.clipboard.writeText(text); toast("Endereço copiado."); } catch { prompt("Copie o endereço:", text); }
    } }, "Copiar");
  }

  function field(id, label, opts = {}) {
    return h("div", { class: "fld" }, h("label", { for: id }, label),
      h("input", { id, type: opts.type || "text", placeholder: opts.placeholder || "", autocomplete: "off", spellcheck: "false", value: opts.value || "" }),
      opts.help ? h("small", { class: "muted" }, opts.help) : null);
  }

  async function saveSetup(provider, fields, btn) {
    const body = { provider };
    for (const [k, id] of Object.entries(fields)) body[k] = $(`#${id}`).value.trim();
    btn.disabled = true;
    try {
      if (state.demo) throw new Error("Na demonstração as integrações não são salvas.");
      await api("/api/admin/integrations", { method: "POST", body: JSON.stringify(body) });
      toast("Configuração salva. Agora é só conectar.");
      await load(false);
    } catch (e) { toast(e.message); btn.disabled = false; }
  }

  async function disconnect(provider, label) {
    if (!confirm(`Desconectar ${label}? Os relatórios dos clientes param de receber esses dados até você conectar de novo.`)) return;
    try {
      if (state.demo) throw new Error("Na demonstração as integrações não são alteradas.");
      await api(`/api/admin/integrations?provider=${provider}`, { method: "DELETE" });
      toast(`${label} desconectado.`);
      await load(false);
    } catch (e) { toast(e.message); }
  }

  const connectHref = (provider) => (state.demo ? "#integracoes" : `/api/oauth/${provider}`);
  const connectClick = (e) => { if (state.demo) { e.preventDefault(); toast("Na demonstração o login não abre. No painel real, este botão leva para a tela de autorização."); } };

  function metaCard(m) {
    const left = daysLeft(m.expiresAt);
    return h("article", { class: `int${m.connected ? " is-on" : ""}` },
      h("header", { class: "int__head" }, LOGO.meta(),
        h("div", {}, h("h2", {}, "Facebook e Instagram"), h("p", { class: "muted" }, "Anúncios da Meta, Páginas do Facebook e perfis do Instagram")),
        h("span", { class: `chip ${m.connected ? "st--ok" : "st--plan"}` }, m.connected ? "Conectado" : "Não conectado")),
      m.connected ? [
        h("p", { class: "int__who" }, "Conectado como ", h("strong", {}, m.name || "Facebook"), m.since ? ` · desde ${dateBR(m.since)}` : ""),
        left != null ? h("p", { class: `int__renew${left < 10 ? " is-warn" : ""}` }, left > 0 ? `O acesso vale por mais ${left} dias. Antes disso, clique em Reconectar (leva 10 segundos).` : "O acesso expirou: clique em Reconectar.") : null,
        found(m.found, [["adAccounts", "contas de anúncio"], ["pages", "páginas"], ["instagram", "perfis do Instagram"]]),
        h("div", { class: "int__actions" },
          m.source !== "env" ? h("a", { class: "btn btn--ghost", href: connectHref("meta"), onclick: connectClick }, "Reconectar") : null,
          m.source === "login" ? h("button", { type: "button", class: "btn btn--ghost btn--danger-text", onclick: () => disconnect("meta", "Facebook") }, "Desconectar") : null),
      ] : m.appReady ? [
        h("p", { class: "int__lead" }, "Entre com o Facebook que administra as contas dos seus clientes (o mesmo do Gerenciador de Negócios). Você escolhe o que liberar e pronto."),
        h("a", { class: "btn btn--fb btn--lg", href: connectHref("meta"), onclick: connectClick }, LOGO.meta(), "Continuar com Facebook"),
      ] : setupMeta(m));
  }

  function setupMeta(m) {
    return h("div", { class: "int__setup" },
      h("p", { class: "int__lead" }, h("strong", {}, "Falta um passo, feito uma única vez:"), " criar o App da agência na Meta. Depois disso, conectar é um clique."),
      h("ol", { class: "int__steps" },
        h("li", {}, "Abra ", h("a", { class: "link", href: "https://developers.facebook.com/apps/creation/", target: "_blank", rel: "noopener" }, "developers.facebook.com/apps"), " → Criar app → ", h("strong", {}, "Outro"), " → tipo ", h("strong", {}, "Empresa"), "."),
        h("li", {}, "No app, adicione ", h("strong", {}, "Login do Facebook para Empresas"), " e, em Configurações, cole este endereço em “URIs de redirecionamento do OAuth válidos”:",
          h("div", { class: "int__uri" }, h("code", {}, m.redirectUri), copyBtn(m.redirectUri))),
        h("li", {}, "Em Configurações do app → Básico, copie o ", h("strong", {}, "ID do app"), " e a ", h("strong", {}, "Chave secreta"), " e cole aqui:")),
      h("div", { class: "int__form" },
        field("meta-appid", "ID do app", { placeholder: "Ex.: 123456789012345", value: m.appId || "" }),
        field("meta-secret", "Chave secreta do app", { type: "password", placeholder: m.appSecret ? `Salva (${m.appSecret})` : "Cole aqui" })),
      h("button", { type: "button", class: "btn btn--primary", onclick: (e) => saveSetup("meta", { appId: "meta-appid", appSecret: "meta-secret" }, e.currentTarget) }, "Salvar e liberar o botão de conexão"));
  }

  function googleCard(g) {
    return h("article", { class: `int${g.connected ? " is-on" : ""}` },
      h("header", { class: "int__head" }, LOGO.google(),
        h("div", {}, h("h2", {}, "Google Ads"), h("p", { class: "muted" }, "Campanhas de pesquisa, YouTube, Display e Performance Max")),
        h("span", { class: `chip ${g.connected ? "st--ok" : "st--plan"}` }, g.connected ? "Conectado" : "Não conectado")),
      g.connected ? [
        h("p", { class: "int__who" }, "Conectado como ", h("strong", {}, g.name || "Google"), g.since ? ` · desde ${dateBR(g.since)}` : ""),
        !g.devReady ? h("p", { class: "int__renew is-warn" }, "Falta o token de desenvolvedor do Google Ads para ler as campanhas. Cole abaixo.") : null,
        found(g.found, [["adAccounts", "contas de anúncio"]]),
        !g.devReady ? setupGoogle(g, true) : null,
        h("div", { class: "int__actions" },
          g.source !== "env" ? h("a", { class: "btn btn--ghost", href: connectHref("google"), onclick: connectClick }, "Reconectar") : null,
          g.source === "login" ? h("button", { type: "button", class: "btn btn--ghost btn--danger-text", onclick: () => disconnect("google", "Google") }, "Desconectar") : null),
      ] : g.appReady ? [
        h("p", { class: "int__lead" }, "Entre com o Google que tem acesso às contas de anúncio dos clientes (de preferência o da sua conta de administrador, a MCC)."),
        h("a", { class: "btn btn--google btn--lg", href: connectHref("google"), onclick: connectClick }, LOGO.google(), "Continuar com Google"),
        h("p", { class: "muted int__note" }, "Apareceu “Erro 403: access_denied”? No Google Cloud, abra ", h("a", { class: "link", href: "https://console.cloud.google.com/auth/audience", target: "_blank", rel: "noopener" }, "Público-alvo"), " e adicione o seu e-mail em Usuários de teste."),
        !g.devReady ? h("p", { class: "muted int__note" }, "Depois de conectar, cole o token de desenvolvedor para ler as campanhas.") : null,
      ] : setupGoogle(g));
  }

  function setupGoogle(g, devOnly) {
    return h("div", { class: "int__setup" },
      devOnly ? null : h("p", { class: "int__lead" }, h("strong", {}, "Falta um passo, feito uma única vez:"), " liberar o login do Google para o painel."),
      devOnly ? null : h("ol", { class: "int__steps" },
        h("li", {}, "No ", h("a", { class: "link", href: "https://console.cloud.google.com/apis/library/googleads.googleapis.com", target: "_blank", rel: "noopener" }, "Google Cloud"), ", ative a ", h("strong", {}, "Google Ads API"), "."),
        h("li", {}, "Em APIs e serviços → Credenciais → Criar credenciais → ", h("strong", {}, "ID do cliente OAuth"), " (Aplicativo da Web) e cole este endereço em “URIs de redirecionamento autorizados”:",
          h("div", { class: "int__uri" }, h("code", {}, g.redirectUri), copyBtn(g.redirectUri))),
        h("li", {}, "Copie o ", h("strong", {}, "ID do cliente"), " e a ", h("strong", {}, "Chave secreta"), ". O ", h("strong", {}, "token de desenvolvedor"), " fica no Google Ads → Ferramentas → Central de API (na sua MCC)."),
        h("li", {}, "Em ", h("a", { class: "link", href: "https://console.cloud.google.com/auth/audience", target: "_blank", rel: "noopener" }, "Google Auth Platform → Público-alvo"), ", clique em ", h("strong", {}, "Publicar app"), " → Confirmar.")),
      h("div", { class: "int__form" },
        devOnly ? null : field("g-client", "ID do cliente", { placeholder: "…apps.googleusercontent.com", value: g.clientId || "" }),
        devOnly ? null : field("g-secret", "Chave secreta do cliente", { type: "password", placeholder: g.clientSecret ? `Salva (${g.clientSecret})` : "Cole aqui" }),
        field("g-dev", "Token de desenvolvedor", { type: "password", placeholder: g.developerToken ? `Salvo (${g.developerToken})` : "Cole aqui" }),
        field("g-mcc", "ID da conta de administrador (MCC) · opcional", { placeholder: "123-456-7890", value: g.loginCustomerId || "", help: "Sem MCC, o painel lista todas as contas que o seu login enxerga." })),
      h("button", { type: "button", class: "btn btn--primary", onclick: (e) => saveSetup("google", devOnly ? { developerToken: "g-dev", loginCustomerId: "g-mcc" } : { clientId: "g-client", clientSecret: "g-secret", developerToken: "g-dev", loginCustomerId: "g-mcc" }, e.currentTarget) }, devOnly ? "Salvar" : "Salvar e liberar o botão de conexão"));
  }

  function found(f, labels) {
    if (!f) return null;
    if (f.error) return h("p", { class: "int__renew is-warn" }, "Conectado, mas não consegui listar as contas: ", h("small", {}, f.error));
    return h("div", { class: "int__found" },
      h("div", { class: "int__nums" }, labels.map(([k, l]) => h("div", {}, h("strong", {}, String(f[k] ?? 0)), h("span", {}, l)))),
      f.sample?.length ? h("div", { class: "int__sample" }, f.sample.map((n) => h("span", { class: "chip st--plan" }, n))) : null);
  }

  const ext = (href, text) => h("a", { class: "link", href, target: "_blank", rel: "noopener" }, text);

  function googleSetupCard(g) {
    const ready = g.appReady && g.devReady;
    return h("article", { class: `int${ready ? " is-on" : ""}` },
      h("header", { class: "int__head" }, LOGO.google(),
        h("div", {}, h("h2", {}, "Google Ads"), h("p", { class: "muted" }, "Pesquisa, YouTube, Display e Performance Max")),
        h("span", { class: `chip ${ready ? "st--ok" : "st--plan"}` }, ready ? "Ativo" : "Falta ativar")),
      ready ? [
        h("p", { class: "int__lead" }, "Ativo. Para ver os números de um cliente: ", h("a", { class: "link", href: "#clientes" }, "Clientes"), " → Editar e contas → ", h("strong", {}, "Conectar Google"), "."),
        h("div", { class: "int__check" },
          h("strong", {}, "Confira uma vez (2 minutos) para nenhum cliente travar:"),
          h("ol", { class: "int__steps" },
            h("li", {}, "Abra ", ext("https://console.cloud.google.com/auth/audience", "Google Cloud → Público-alvo"), " e, se aparecer o botão ", h("strong", {}, "Publicar app"), ", clique nele e confirme. ",
              h("span", { class: "muted" }, "Sem isso, só e-mails da lista de teste conseguem conectar e o acesso cai a cada 7 dias.")),
            h("li", {}, "Abra a ", ext("https://ads.google.com/aw/apicenter", "Central de API do Google Ads"), " (na conta de administrador) e veja o ", h("strong", {}, "Nível de acesso"), ". ",
              h("span", { class: "muted" }, "“Explorador” ou “Básico”: tudo certo. “Conta de teste”: clique em solicitar Acesso básico.")))),
        h("details", { class: "int__edit" }, h("summary", {}, "Trocar credenciais do Google"), setupGoogle(g)),
      ] : setupGoogle(g));
  }

  function metaSetupCard(m) {
    const ready = m.appReady || m.source === "env";
    return h("article", { class: `int${ready ? " is-on" : ""}` },
      h("header", { class: "int__head" }, LOGO.meta(),
        h("div", {}, h("h2", {}, "Facebook e Instagram"), h("p", { class: "muted" }, "Anúncios da Meta, Páginas e Instagram")),
        h("span", { class: `chip ${ready ? "st--ok" : "st--plan"}` }, ready ? "Ativo" : "Falta ativar")),
      ready ? [
        h("p", { class: "int__lead" }, "Ativo. Para ver os números de um cliente: ", h("a", { class: "link", href: "#clientes" }, "Clientes"), " → Editar e contas → ", h("strong", {}, "Conectar Facebook"), "."),
        h("p", { class: "muted int__note" }, "Dica: entre com o Facebook da agência que já administra a página e a conta de anúncios do cliente no Gerenciador de Negócios. É o caminho mais rápido."),
        h("details", { class: "int__edit" }, h("summary", {}, "Trocar credenciais da Meta"), setupMeta(m)),
      ] : setupMeta(m));
  }

  function render() {
    const box = $("#integrations");
    if (!box) return;
    if (!data) { box.replaceChildren(h("p", { class: "muted" }, loading ? "Verificando conexões…" : "")); return; }
    box.replaceChildren(...[
      !data.store && !state.demo ? h("p", { class: "int__renew is-warn" }, "O banco de dados não está ligado: as conexões não podem ser salvas.") : null,
      h("div", { class: "ints" }, googleSetupCard(data.google), metaSetupCard(data.meta)),
      h("section", { class: "int__how" },
        h("h3", {}, "Como conectar cada cliente"),
        h("ol", {},
          h("li", {}, "Em ", h("a", { class: "link", href: "#clientes" }, "Clientes"), ", abra o cliente (Editar e contas)."),
          h("li", {}, "Clique em ", h("strong", {}, "Conectar Google"), " ou ", h("strong", {}, "Conectar Facebook"), " e entre com o e-mail que administra os anúncios dele. Ou envie o link pelo WhatsApp para o próprio cliente clicar."),
          h("li", {}, "A conta é escolhida sozinha e o painel mostra na hora os números dos últimos 30 dias. Se aparecer em vermelho, a mensagem diz o que fazer.")),
        loading ? h("p", { class: "muted" }, "Atualizando…") : h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: () => load(true) }, "Atualizar status")),
    ].filter(Boolean));
  }

  // volta do login (?conexao=meta&erro=...)
  const qs = new URLSearchParams(location.search);
  if (qs.get("conexao") && !qs.get("cliente")) {
    const err = qs.get("erro");
    setTimeout(() => toast(err || `${qs.get("conexao") === "meta" ? "Facebook" : "Google"} conectado com sucesso.`), 400);
    history.replaceState(null, "", `${location.pathname}#integracoes`);
  }

  return { load, render };
}

function demoData() {
  return {
    store: true,
    meta: { redirectUri: `${location.origin}/api/oauth/meta`, appReady: true, connected: true, source: "login", name: "Agência Demo", since: new Date(Date.now() - 6 * 864e5).toISOString(), expiresAt: new Date(Date.now() + 54 * 864e5).toISOString(), found: { adAccounts: 6, pages: 6, instagram: 5, sample: ["PMVV — Comunicação", "Casa Bella — Anúncios", "Maison Lume", "Sorriso Real — Leads"] } },
    google: { redirectUri: `${location.origin}/api/oauth/google`, appReady: true, devReady: true, connected: false, source: null },
  };
}
