// Início do painel: saudação com o "R" em 3D, números do dia e o que precisa de atenção.
import { h, $ } from "/cliente/assets/util.js";
import { countUp, enter, tilt } from "/cliente/assets/motion.js";
import { mountBrand3D } from "/admin/brand3d.js";
import { LOGO, legacy } from "/admin/conexoes.js";

const hello = () => { const hr = new Date().getHours(); return hr < 12 ? "Bom dia" : hr < 18 ? "Boa tarde" : "Boa noite"; };
const n = (v) => Number(v || 0).toLocaleString("pt-BR");

export function renderHome({ state, leads, conexoes, go, openClient, newClient }) {
  const box = $("#home");
  if (!box) return;
  const clients = state.clients || [];
  const list = leads?.list?.() || [];
  const week = Date.now() - 7 * 864e5;
  const newLeads = list.filter((l) => Date.parse(l.criadoEm || 0) > week).length;
  const accountsOf = (c) => (c.ads?.length ? c.ads : legacy(c));
  const linked = clients.reduce((s, c) => s + accountsOf(c).length, 0);
  const logins = conexoes?.data?.logins || [];
  const ready = conexoes?.data?.ready || {};

  const todo = [];
  if (ready.meta === false) todo.push({ icon: "meta", t: "Ative o botão do Facebook", d: "Uma vez só, 5 minutos.", go: () => go("conexoes") });
  if (!logins.length && conexoes?.data) todo.push({ icon: "google", t: "Conecte o primeiro login do Google ou Facebook", d: "As contas de anúncio aparecem na hora.", go: () => go("conexoes") });
  logins.filter((L) => L.error).forEach((L) => todo.push({ icon: L.provider, t: `${L.label}: precisa de atenção`, d: L.error, go: () => go("conexoes") }));
  clients.filter((c) => c.pending).forEach((c) => todo.push({ icon: "user", t: `${c.name} aguarda liberação`, d: "Cadastro feito pelo site.", go: () => openClient(c) }));
  clients.filter((c) => !c.pending && !accountsOf(c).length).forEach((c) => todo.push({ icon: "link", t: `${c.name} ainda sem contas de anúncio`, d: "Escolha as contas para o relatório mostrar os números.", go: () => openClient(c, { accounts: true }) }));
  const fresh = list.filter((l) => (l.etapa || "novo") === "novo").length;
  if (fresh) todo.push({ icon: "lead", t: `${fresh} lead${fresh === 1 ? "" : "s"} esperando o primeiro contato`, d: "Aplicações feitas no site.", go: () => go("leads") });

  const ico = (k) => (k === "google" || k === "meta" ? LOGO[k]() : h("span", { class: `todo__ico todo__ico--${k}`, "aria-hidden": "true" }));
  const kpi = (label, value, sub) => h("div", { class: "kpi hk" }, h("span", { class: "kpi__label" }, label), h("strong", { class: "kpi__value" }, n(value)), h("small", {}, sub));

  const stage = h("div", { class: "hero3d__stage", "aria-hidden": "true" });
  box.replaceChildren(
    h("section", { class: "hero3d", "data-3d-host": "" },
      h("div", { class: "hero3d__copy" },
        h("p", { class: "kicker" }, new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })),
        h("h1", {}, `${hello()},`, h("br"), h("span", {}, "equipe Renowa.")),
        h("p", { class: "hero3d__sub" }, todo.length ? `${todo.length} ${todo.length === 1 ? "coisa precisa" : "coisas precisam"} de você hoje.` : "Tudo em dia. Os relatórios dos clientes estão atualizando sozinhos."),
        h("div", { class: "hero3d__cta" },
          h("button", { type: "button", class: "btn btn--primary btn--glow", onclick: newClient }, h("span", { html: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>' }), "Novo cliente"),
          h("button", { type: "button", class: "btn btn--glass", onclick: () => go("conexoes") }, "Conectar contas"))),
      stage),
    h("div", { class: "kpis hkpis" },
      kpi("Leads na semana", newLeads, `${n(list.length)} no total`),
      kpi("Clientes ativos", clients.filter((c) => c.active !== false).length, `${n(clients.length)} cadastrados`),
      kpi("Contas nos relatórios", linked, "Google Ads e Meta Ads"),
      kpi("Logins conectados", logins.length, `${logins.filter((L) => L.provider === "google").length} Google · ${logins.filter((L) => L.provider === "meta").length} Facebook`)),
    h("div", { class: "hgrid" },
      h("section", { class: "block" },
        h("header", { class: "block__head" }, h("h2", {}, "Precisa de você"), h("p", {}, todo.length ? "Em ordem de prioridade." : "Nada pendente.")),
        todo.length ? h("ul", { class: "todo" }, todo.slice(0, 8).map((t) => h("li", {}, h("button", { type: "button", onclick: t.go }, ico(t.icon), h("span", {}, h("b", {}, t.t), h("small", {}, t.d)), h("i", { "aria-hidden": "true" }, "→")))))
          : h("div", { class: "allgood" }, h("span", { "aria-hidden": "true" }, "✓"), h("p", {}, "Tudo certo por aqui."))),
      h("section", { class: "block" },
        h("header", { class: "block__head" }, h("h2", {}, "Clientes"), h("button", { type: "button", class: "link", onclick: () => go("clientes") }, "Ver todos")),
        clients.length ? h("ul", { class: "mini" }, clients.slice(0, 6).map((c) => {
          const accs = accountsOf(c);
          return h("li", {}, h("button", { type: "button", onclick: () => openClient(c) },
            h("span", { class: "avatar" }, c.name.split(/\s+/).filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("").toUpperCase()),
            h("span", { class: "mini__txt" }, h("b", {}, c.name), h("small", {}, accs.length ? accs.map((a) => a.name || a.id).join(" · ") : "sem contas de anúncio")),
            h("span", { class: "mini__nets" }, ["google", "meta"].map((p) => h("i", { class: `pip pip--${p}${accs.some((a) => a.p === p) ? " is-on" : ""}`, title: p === "google" ? "Google Ads" : "Meta Ads" })))));
        })) : h("div", { class: "empty-state" }, h("strong", {}, "Nenhum cliente ainda"), h("button", { class: "btn btn--primary btn--sm", onclick: newClient }, "Cadastrar o primeiro")))));
  mountBrand3D(stage);
  enter(box);
  countUp(box);
  tilt(box);
}
