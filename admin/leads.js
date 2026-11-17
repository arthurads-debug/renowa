// CRM da Renowa: aplicações que chegam pelo questionário do site.
// Funil: Novo → Em contato → Diagnóstico agendado → Proposta enviada → Fechado / Perdido.
import { h, $ } from "/cliente/assets/util.js";

export const STAGES = [
  { v: "novo", name: "Novos" },
  { v: "contato", name: "Em contato" },
  { v: "diagnostico", name: "Diagnóstico" },
  { v: "proposta", name: "Proposta" },
  { v: "ganho", name: "Fechados" },
  { v: "perdido", name: "Perdidos" },
];
const STAGE_ONE = { novo: "Novo", contato: "Em contato", diagnostico: "Diagnóstico agendado", proposta: "Proposta enviada", ganho: "Fechado", perdido: "Perdido" };
const PERFIL = {
  qualificado: { name: "Qualificado", cls: "st--ok" },
  avaliar: { name: "Para avaliar", cls: "st--wait" },
  "fora-do-perfil": { name: "Fora do perfil", cls: "st--plan" },
};
const DEMO_KEY = "renowa-demo-leads";

/* ---------- Formatos ---------- */
const brl = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);
const short = (label = "") => label.replace(/^De /, "").replace(" a R$ ", "–").replace(" milhão", " mi");
const today = () => new Date().toISOString().slice(0, 10);
const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const hh = Math.round(m / 60);
  if (hh < 24) return `há ${hh} h`;
  const d = Math.round(hh / 24);
  return d === 1 ? "ontem" : d < 30 ? `há ${d} dias` : new Date(iso).toLocaleDateString("pt-BR");
};
const dateBR = (iso) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const digits = (s) => String(s || "").replace(/\D/g, "");
const waNumber = (s) => { const d = digits(s); return d.length <= 11 ? `55${d}` : d; };
const linkFor = (raw) => {
  const s = String(raw || "").trim();
  if (!s) return null;
  if (s.startsWith("@")) return /^@[\w.]{1,30}$/.test(s) ? { href: `https://instagram.com/${s.slice(1)}`, text: s } : null;
  const url = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try { const u = new URL(url); return u.protocol === "https:" || u.protocol === "http:" ? { href: u.href, text: s } : null; } catch { return null; }
};

/* ---------- Demonstração ---------- */
function demoSeed() {
  const d = (days, hours = 0) => new Date(Date.now() - days * 864e5 - hours * 36e5).toISOString();
  const mk = (o) => ({ valor: 0, proximoContato: "", link: "", ...o, atualizadoEm: o.criadoEm, historico: [{ em: o.criadoEm, texto: "Aplicação recebida pelo site", por: "site" }, ...(o.extra || [])] });
  return [
    mk({ id: "d1", compatibilidade: 96, criadoEm: d(0, 2), nome: "Marina Albuquerque", empresa: "Clínica Derma Prime", whatsapp: "(11) 98888-1001", email: "marina@dermaprime.com.br", link: "@dermaprime",
      respostas: { segmento: "Saúde e estética", faturamento: "De R$ 300 mil a R$ 1 milhão", equipe: "De R$ 6.000 a R$ 12.000", midia: "De R$ 5 mil a R$ 15 mil", hoje: "Outra agência", prazo: "Nos próximos 30 dias", decisor: "Sou dono(a) ou sócio(a)", servicos: ["Redes sociais", "Vídeos e fotos profissionais", "Tráfego pago"] },
      perfil: "qualificado", prioridade: "A", pontuacao: 7, etapa: "novo" }),
    mk({ id: "d2", compatibilidade: 95, criadoEm: d(1, 4), nome: "Paulo Henrique Ramos", empresa: "Construtora Vale Alto", whatsapp: "(31) 97777-2002", email: "paulo@valealto.com.br", link: "valealto.com.br",
      respostas: { segmento: "Imobiliário e construção", faturamento: "Acima de R$ 1 milhão", equipe: "Acima de R$ 12.000", midia: "Acima de R$ 15 mil", hoje: "Uma equipe interna", prazo: "Entre 1 e 3 meses", decisor: "Sou diretor(a) ou gerente com autonomia", servicos: ["Imagens com drone", "Site ou landing page", "Tráfego pago"] },
      perfil: "qualificado", prioridade: "A", pontuacao: 6, etapa: "diagnostico", proximoContato: today(),
      extra: [{ em: d(1, 1), texto: "Etapa: contato", por: "agencia@demo.com.br" }, { em: d(0, 20), texto: "Diagnóstico marcado para hoje às 15h. Quer tour de drone do lançamento Jardins.", por: "agencia@demo.com.br", tipo: "nota" }] }),
    mk({ id: "d3", compatibilidade: 90, criadoEm: d(3), nome: "Renata Lopes", empresa: "Lopes Móveis Planejados", whatsapp: "(41) 96666-3003", email: "renata@lopesmoveis.com.br",
      respostas: { segmento: "Varejo e loja física", faturamento: "De R$ 100 mil a R$ 300 mil", equipe: "De R$ 3.000 a R$ 6.000", midia: "De R$ 2 mil a R$ 5 mil", hoje: "Freelancers", prazo: "Nos próximos 30 dias", decisor: "Sou dono(a) ou sócio(a)", servicos: ["Redes sociais", "Tráfego pago", "CRM e automação de WhatsApp"] },
      perfil: "qualificado", prioridade: "A", pontuacao: 6, etapa: "proposta", valor: 4800, proximoContato: new Date(Date.now() - 864e5).toISOString().slice(0, 10) }),
    mk({ id: "d4", compatibilidade: 87, criadoEm: d(5), nome: "Diego Martins", empresa: "Grupo Sabor Brasa", whatsapp: "(21) 95555-4004", email: "diego@saborbrasa.com.br", link: "@saborbrasa",
      respostas: { segmento: "Alimentação e hospitalidade", faturamento: "De R$ 300 mil a R$ 1 milhão", equipe: "De R$ 3.000 a R$ 6.000", midia: "Até R$ 2 mil", hoje: "Alguém da equipe, quando sobra tempo", prazo: "Entre 1 e 3 meses", decisor: "Vou levar a proposta para os sócios", servicos: ["Redes sociais", "Vídeos e fotos profissionais"] },
      perfil: "qualificado", prioridade: "B", pontuacao: 3, etapa: "contato" }),
    mk({ id: "d5", compatibilidade: 68, criadoEm: d(9), nome: "Fernanda Coelho", empresa: "Coelho Advocacia", whatsapp: "(11) 94444-5005", email: "fernanda@coelhoadv.com.br",
      respostas: { segmento: "Serviços profissionais", faturamento: "De R$ 100 mil a R$ 300 mil", equipe: "De R$ 1.500 a R$ 3.000", midia: "Até R$ 2 mil", hoje: "Ninguém, está tudo comigo", prazo: "Entre 1 e 3 meses", decisor: "Sou dono(a) ou sócio(a)", servicos: ["Site ou landing page", "Redes sociais"] },
      perfil: "avaliar", prioridade: "-", pontuacao: 4, etapa: "novo" }),
    mk({ id: "d6", compatibilidade: 31, criadoEm: d(14), nome: "Lucas Prado", empresa: "Prado Auto Peças", whatsapp: "(19) 93333-6006", email: "lucas@pradoauto.com.br",
      respostas: { segmento: "Varejo e loja física", faturamento: "De R$ 50 mil a R$ 100 mil", equipe: "Até R$ 1.500", midia: "Ainda não pretendo anunciar", hoje: "Ninguém, está tudo comigo", prazo: "Ainda estou pesquisando", decisor: "Sou dono(a) ou sócio(a)", servicos: ["Redes sociais"] },
      perfil: "fora-do-perfil", prioridade: "-", pontuacao: 2, etapa: "perdido" }),
    mk({ id: "d7", compatibilidade: 97, criadoEm: d(21), nome: "Beatriz Nunes", empresa: "Instituto Ápice", whatsapp: "(62) 92222-7007", email: "beatriz@institutoapice.com.br", link: "institutoapice.com.br",
      respostas: { segmento: "Educação", faturamento: "De R$ 300 mil a R$ 1 milhão", equipe: "De R$ 6.000 a R$ 12.000", midia: "De R$ 5 mil a R$ 15 mil", hoje: "Outra agência", prazo: "Nos próximos 30 dias", decisor: "Sou dono(a) ou sócio(a)", servicos: ["Tráfego pago", "Site ou landing page", "CRM e automação de WhatsApp", "Sistema ou SaaS sob medida"] },
      perfil: "qualificado", prioridade: "A", pontuacao: 7, etapa: "ganho", valor: 9500 }),
  ];
}
function demoLeads() {
  let list = null;
  try { list = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch { /* sem storage */ }
  // As aplicações reais feitas no site (modo demo) ficam no início; os exemplos são acrescentados uma vez
  if (!list || !list.some((l) => l.id === "d1")) {
    list = [...(list || []), ...demoSeed()];
    saveDemo(list);
  }
  return list.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}
function saveDemo(list) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(list)); } catch { /* sem storage */ } }

/* =========================================================
   MÓDULO
   ========================================================= */
export function initLeads({ state, api, toast, openEditor, showTab }) {
  const ls = { leads: [], stage: "abertos", perfil: "todos", q: "", loaded: false };

  const backend = {
    async list() {
      if (state.demo) return demoLeads();
      return (await api("/api/admin/leads")).leads;
    },
    async update(id, patch) {
      if (!state.demo) return (await api("/api/admin/leads", { method: "PATCH", body: JSON.stringify({ id, ...patch }) })).lead;
      const list = demoLeads();
      const l = list.find((x) => x.id === id);
      const now = new Date().toISOString();
      const hist = [];
      if (patch.etapa && patch.etapa !== l.etapa) { l.etapa = patch.etapa; hist.push(`Etapa: ${patch.etapa}`); }
      if (patch.valor != null && patch.valor !== l.valor) { l.valor = patch.valor; hist.push(`Valor mensal: R$ ${patch.valor.toLocaleString("pt-BR")}`); }
      if (patch.proximoContato != null && patch.proximoContato !== l.proximoContato) { l.proximoContato = patch.proximoContato; hist.push(patch.proximoContato ? `Próximo contato: ${patch.proximoContato.split("-").reverse().join("/")}` : "Próximo contato removido"); }
      if (patch.nota) l.historico.push({ em: now, texto: patch.nota, por: state.email, tipo: "nota" });
      if (hist.length) l.historico.push({ em: now, texto: hist.join(" · "), por: state.email });
      l.atualizadoEm = now;
      saveDemo(list);
      return l;
    },
    async remove(id) {
      if (!state.demo) return api(`/api/admin/leads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      saveDemo(demoLeads().filter((l) => l.id !== id));
    },
  };

  async function refresh() {
    try { ls.leads = await backend.list(); ls.loaded = true; }
    catch (e) { if (e.message !== "401") toast(e.message); }
    render();
  }

  /* ---------- Filtros ---------- */
  const isOpen = (l) => l.etapa !== "ganho" && l.etapa !== "perdido";
  const overdue = (l) => isOpen(l) && l.proximoContato && l.proximoContato <= today();
  function filtered() {
    const q = ls.q.trim().toLowerCase();
    return ls.leads.filter((l) =>
      (ls.stage === "todos" || (ls.stage === "abertos" ? isOpen(l) : l.etapa === ls.stage)) &&
      (ls.perfil === "todos" || l.perfil === ls.perfil) &&
      (!q || `${l.nome} ${l.empresa} ${l.email} ${l.respostas?.segmento || ""}`.toLowerCase().includes(q)));
  }

  /* ---------- Lista ---------- */
  function render() {
    const all = ls.leads;
    const month = new Date().toISOString().slice(0, 7);
    const qualMonth = all.filter((l) => l.perfil === "qualificado" && l.criadoEm.slice(0, 7) === month).length;
    const pipeValue = all.filter((l) => l.etapa === "proposta").reduce((s, l) => s + (l.valor || 0), 0);
    const won = all.filter((l) => l.etapa === "ganho").reduce((s, l) => s + (l.valor || 0), 0);
    const newCount = all.filter((l) => l.etapa === "novo" && l.perfil !== "fora-do-perfil").length;
    $("#leads-sub").textContent = `${all.length} aplicaç${all.length === 1 ? "ão" : "ões"} · ${qualMonth} qualificada${qualMonth === 1 ? "" : "s"} este mês`;
    const badge = $("#tab-badge-leads");
    badge.textContent = newCount;
    badge.hidden = !newCount;

    // Resumo do funil
    $("#leads-kpis").replaceChildren(
      kpi("Novos para atender", String(newCount), "qualificados e para avaliar"),
      kpi("Retornos vencidos", String(all.filter(overdue).length), "próximo contato hoje ou antes", all.some(overdue)),
      kpi("Em proposta", brl(pipeValue), "por mês, somando as propostas"),
      kpi("Fechado", brl(won), "por mês, contratos ganhos"));

    // Etapas
    const stageBtn = (v, name, count) => h("button", { type: "button", class: "pipe__btn", "aria-pressed": String(ls.stage === v), onclick: () => { ls.stage = v; render(); } },
      h("span", {}, name), h("strong", {}, String(count)));
    $("#leads-pipe").replaceChildren(
      stageBtn("abertos", "Em aberto", all.filter(isOpen).length),
      ...STAGES.map((s) => stageBtn(s.v, s.name, all.filter((l) => l.etapa === s.v).length)),
      stageBtn("todos", "Todos", all.length));

    // Perfil
    $("#leads-perfil").replaceChildren(...[["todos", "Todos os perfis"], ["qualificado", "Qualificados"], ["avaliar", "Para avaliar"], ["fora-do-perfil", "Fora do perfil"]].map(([v, t]) =>
      h("button", { type: "button", role: "radio", "aria-checked": String(ls.perfil === v), onclick: () => { ls.perfil = v; render(); } }, t)));

    const list = filtered();
    const box = $("#leads");
    if (!ls.loaded) { box.replaceChildren(h("div", { class: "loading-state" }, h("span", { class: "spinner" }), "Carregando aplicações…")); return; }
    if (!list.length) {
      box.replaceChildren(h("div", { class: "empty-state" },
        h("strong", {}, all.length ? "Nada neste filtro" : "Nenhuma aplicação ainda"),
        h("p", {}, all.length ? "Troque a etapa ou o perfil para ver outras aplicações." : "Quando alguém responder o questionário do site, a aplicação aparece aqui já classificada.")));
      return;
    }
    box.replaceChildren(...list.map(row));
  }

  const kpi = (label, value, sub, alert) => h("div", { class: `lk${alert ? " is-alert" : ""}` }, h("p", { class: "lk__label" }, label), h("p", { class: "lk__value" }, value), h("p", { class: "lk__sub" }, sub));

  const prio = (l) => h("span", { class: `prio prio--${l.prioridade === "A" ? "a" : l.prioridade === "B" ? "b" : "x"}`, title: l.prioridade === "-" ? "Sem prioridade" : `Prioridade ${l.prioridade}` },
    l.prioridade === "-" ? "–" : l.prioridade, h("span", { class: "sr-only" }, l.prioridade === "-" ? " sem prioridade" : ` prioridade ${l.prioridade}`));

  function row(l) {
    const p = PERFIL[l.perfil] || PERFIL["fora-do-perfil"];
    return h("button", { type: "button", class: `lead${overdue(l) ? " is-overdue" : ""}`, onclick: () => openLead(l.id) },
      prio(l),
      h("span", { class: "lead__who" }, h("strong", {}, l.nome), h("span", {}, `${l.empresa} · ${l.respostas?.segmento || "—"}`)),
      h("span", { class: "lead__match", title: "Compatibilidade mostrada ao lead" }, h("strong", {}, l.compatibilidade ? `${l.compatibilidade}%` : "—"), h("small", {}, "compatível")),
      h("span", { class: "lead__fit" },
        h("span", {}, h("small", {}, "Faturamento "), short(l.respostas?.faturamento) || "—"),
        h("span", {}, h("small", {}, "Equipe "), short(l.respostas?.equipe) || "—")),
      h("span", { class: "lead__tags" }, h("span", { class: `chip ${p.cls}` }, p.name), h("span", { class: "chip chip--stage" }, STAGE_ONE[l.etapa] || l.etapa)),
      h("span", { class: "lead__when" }, overdue(l) ? h("strong", { class: "lead__due" }, "Retornar") : null, ago(l.criadoEm)));
  }

  /* ---------- Detalhe ---------- */
  let current = null;
  let lastFocus = null;

  function openLead(id) {
    current = ls.leads.find((l) => l.id === id);
    if (!current) return;
    lastFocus = document.activeElement;
    const d = $("#lead-drawer");
    d.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => d.classList.add("is-open"));
    renderDetail();
    $("#lead-title")?.focus();
  }
  function closeLead() {
    const d = $("#lead-drawer");
    if (d.hidden) return;
    d.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    setTimeout(() => (d.hidden = true), 250);
    lastFocus?.focus?.();
  }
  $("#lead-drawer").addEventListener("click", (e) => e.target.closest("[data-close]") && closeLead());
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeLead());

  function renderDetail() {
    const l = current;
    const r = l.respostas || {};
    const p = PERFIL[l.perfil] || PERFIL["fora-do-perfil"];
    const first = l.nome.split(/\s+/)[0];
    const waMsg = `Olá, ${first}! Aqui é da Renowa. Recebemos a aplicação da ${l.empresa} e queria entender melhor o momento de vocês. Podemos conversar?`;
    const link = linkFor(l.link);

    const stageSel = h("select", { id: "ld-stage" }, STAGES.map((s) => h("option", { value: s.v, selected: s.v === l.etapa }, STAGE_ONE[s.v])));
    const valor = h("input", { id: "ld-valor", inputmode: "numeric", value: l.valor ? l.valor.toLocaleString("pt-BR") : "", placeholder: "Ex.: 4.800" });
    const prox = h("input", { id: "ld-prox", type: "date", value: l.proximoContato || "" });
    const nota = h("textarea", { id: "ld-nota", rows: "3", maxlength: "1000", placeholder: "Ex.: Ligou às 10h, quer proposta com drone. Retornar quinta." });
    const saveBtn = h("button", { type: "submit", class: "btn btn--primary btn--sm" }, "Salvar negociação");
    const noteBtn = h("button", { type: "button", class: "btn btn--ghost btn--sm" }, "Adicionar nota");

    const save = async (patch, btn, msg) => {
      btn.disabled = true;
      try {
        const upd = await backend.update(l.id, patch);
        Object.assign(l, upd);
        toast(msg);
        render();
        renderDetail();
      } catch (e) { if (e.message !== "401") toast(e.message); }
      finally { btn.disabled = false; }
    };
    noteBtn.addEventListener("click", () => {
      const t = nota.value.trim();
      if (!t) { nota.focus(); return; }
      save({ nota: t }, noteBtn, "Nota adicionada.");
    });

    const qa = (k, v) => h("div", {}, h("dt", {}, k), h("dd", {}, v || "—"));
    const el = h("div", { class: "ld" },
      h("div", { class: "ld__head" },
        h("p", { class: "mono muted" }, `Aplicação de ${dateBR(l.criadoEm)}`),
        h("h2", { class: "ed__title", id: "lead-title", tabindex: "-1" }, l.nome),
        h("p", { class: "ld__company" }, l.empresa),
        h("div", { class: "ld__chips" }, prio(l), h("span", { class: `chip ${p.cls}` }, p.name), h("span", { class: "chip chip--stage" }, STAGE_ONE[l.etapa]),
          l.compatibilidade ? h("span", { class: "chip chip--stage" }, `${l.compatibilidade}% compatível`) : null)),

      h("div", { class: "ld__actions" },
        h("a", { class: "btn btn--primary btn--sm", href: `https://wa.me/${waNumber(l.whatsapp)}?text=${encodeURIComponent(waMsg)}`, target: "_blank", rel: "noopener" }, `WhatsApp ${l.whatsapp}`),
        h("a", { class: "btn btn--ghost btn--sm", href: `mailto:${l.email}` }, "E-mail"),
        h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: async () => {
          const url = `${location.origin}/?para=${encodeURIComponent(l.empresa)}&nome=${encodeURIComponent(first)}`;
          try { await navigator.clipboard.writeText(url); toast("Link da proposta personalizada copiado."); }
          catch { prompt("Copie o link da proposta:", url); }
        } }, "Copiar link da proposta"),
        link ? h("a", { class: "btn btn--ghost btn--sm", href: link.href, target: "_blank", rel: "noopener noreferrer" }, link.text) : null),

      h("section", { class: "ed__sec" },
        h("h3", {}, "Qualificação"),
        h("dl", { class: "ld__qa" },
          qa("Faturamento mensal", r.faturamento),
          qa("Investimento na equipe", r.equipe),
          qa("Verba de anúncios", r.midia),
          qa("Quer começar", r.prazo),
          qa("Papel na decisão", r.decisor),
          qa("Marketing hoje", r.hoje),
          qa("Segmento", r.segmento)),
        h("div", { class: "ld__services" }, h("p", { class: "ld__k" }, "Precisa de"),
          h("div", {}, (r.servicos || []).length ? r.servicos.map((s) => h("span", { class: "chip chip--svc" }, s)) : "—"))),

      h("form", { class: "ed__sec", novalidate: true, onsubmit: (e) => {
        e.preventDefault();
        const v = Number(valor.value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")) || 0;
        save({ etapa: stageSel.value, valor: Math.round(v), proximoContato: prox.value }, saveBtn, "Negociação atualizada.");
      } },
        h("h3", {}, "Negociação"),
        h("div", { class: "row row--3" },
          h("div", { class: "fld" }, h("label", { for: "ld-stage" }, "Etapa"), stageSel),
          h("div", { class: "fld" }, h("label", { for: "ld-valor" }, "Valor mensal (R$)"), valor),
          h("div", { class: "fld" }, h("label", { for: "ld-prox" }, "Próximo contato"), prox)),
        h("div", {}, saveBtn)),

      h("section", { class: "ed__sec" },
        h("h3", {}, "Histórico"),
        h("div", { class: "fld" }, h("label", { for: "ld-nota" }, "Nova nota"), nota),
        h("div", {}, noteBtn),
        h("ol", { class: "ld__hist" }, [...l.historico].reverse().map((ev) =>
          h("li", { class: ev.tipo === "nota" ? "is-note" : "" },
            h("p", {}, ev.texto),
            h("small", {}, `${dateBR(ev.em)} · ${ev.por === "site" ? "site" : ev.por}`))))),

      h("div", { class: "ed__foot" },
        h("button", { type: "button", class: "btn btn--primary", onclick: () => {
          closeLead();
          showTab("clientes");
          openEditor(null, { name: l.empresa, contactName: l.nome, email: l.email });
          toast("Complete o cadastro e vincule as contas do novo cliente.");
        } }, "Converter em cliente"),
        h("span", { class: "spacer" }),
        h("button", { type: "button", class: "btn btn--danger btn--sm", onclick: async () => {
          if (!confirm(`Excluir a aplicação de ${l.nome}? Essa ação não pode ser desfeita.`)) return;
          try { await backend.remove(l.id); ls.leads = ls.leads.filter((x) => x.id !== l.id); closeLead(); render(); toast("Aplicação excluída."); }
          catch (e) { toast(e.message); }
        } }, "Excluir")));

    $("#lead-detail").replaceChildren(el);
  }

  $("#leads-search").addEventListener("input", (e) => { ls.q = e.target.value; render(); });
  $("#leads-refresh").addEventListener("click", refresh);

  return { refresh, render, list: () => ls.leads, open: openLead, setStage: (v) => { ls.stage = v; ls.q = ""; $("#leads-search").value = ""; render(); } };
}
