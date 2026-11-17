// Aba Calendário: a agência monta o calendário editorial de cada cliente.
// Visualizações: Mês, Semana, Lista e Quadro (por etapa). Arraste um post para mudar o dia ou a etapa.
import { h, $ } from "/cliente/assets/util.js";

const NETWORKS = ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "WhatsApp", "Site/Blog"];
const FORMATS = ["Post", "Carrossel", "Reels", "Stories", "Vídeo", "Live", "Artigo"];
const STATUS = {
  planejado: { label: "Planejado", cls: "st--plan" },
  producao: { label: "Em produção", cls: "st--prod" },
  aprovacao: { label: "Aguardando aprovação", cls: "st--wait" },
  aprovado: { label: "Aprovado", cls: "st--ok" },
  publicado: { label: "Publicado", cls: "st--done" },
};
const NET_COLOR = { Instagram: "#DD2A7B", Facebook: "#1F3FA8", TikTok: "#08080F", YouTube: "#E02424", LinkedIn: "#0A66C2", WhatsApp: "#12B76A", "Site/Blog": "#6B7280" };
const VIEWS = [["mes", "Mês"], ["semana", "Semana"], ["lista", "Lista"], ["quadro", "Quadro"]];
const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const today = () => iso(new Date());
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const monthName = (s) => cap(parse(s).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
const dayName = (s) => cap(parse(s).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }));

export function initCalendar({ state, api, toast }) {
  const cs = { client: null, view: "mes", cursor: today(), posts: [], loading: false };
  try { const v = localStorage.getItem("renowa-cal-view"); if (VIEWS.some(([k]) => k === v)) cs.view = v; } catch { /* */ }

  /* ---------- Dados ---------- */
  const demoKey = () => `renowa-demo-posts:${cs.client}`;
  const backend = {
    async list() {
      if (state.demo) { try { return JSON.parse(localStorage.getItem(demoKey()) || "null") || seed(); } catch { return seed(); } }
      return (await api(`/api/admin/posts?client=${encodeURIComponent(cs.client)}`)).posts;
    },
    async save(post) {
      if (!state.demo) return (await api("/api/admin/posts", { method: "POST", body: JSON.stringify({ client: cs.client, post }) })).post;
      if (!post.title?.trim()) throw new Error("Dê um título para a publicação.");
      const p = { ...post, id: post.id || Math.random().toString(36).slice(2, 10), updatedAt: new Date().toISOString() };
      const list = cs.posts.filter((x) => x.id !== p.id).concat(p);
      localStorage.setItem(demoKey(), JSON.stringify(list));
      return p;
    },
    async remove(id) {
      if (!state.demo) return api(`/api/admin/posts?client=${encodeURIComponent(cs.client)}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
      localStorage.setItem(demoKey(), JSON.stringify(cs.posts.filter((x) => x.id !== id)));
    },
  };
  function seed() {
    const t = today(), base = t.slice(0, 8);
    const mk = (d, title, network, format, status, time = "18:00") => ({ id: Math.random().toString(36).slice(2, 10), date: `${base}${pad(d)}`, time, network, format, title, caption: "", status, link: "", boost: false, notes: "" });
    return [mk(3, "Bastidores da produção", "Instagram", "Reels", "publicado"), mk(7, "Depoimento de cliente", "Instagram", "Carrossel", "publicado"),
      mk(12, "Promoção da semana", "Facebook", "Post", "aprovado"), mk(18, "Tour pela loja", "Instagram", "Reels", "aprovacao"),
      mk(21, "Dicas do especialista", "Instagram", "Carrossel", "producao"), mk(25, "Campanha de fim de mês", "Instagram", "Stories", "planejado")];
  }

  async function load() {
    const clients = state.clients.filter((c) => !c.pending);
    if (!cs.client || !clients.some((c) => c.id === cs.client)) cs.client = clients[0]?.id || null;
    if (!cs.client) { cs.posts = []; render(); return; }
    cs.loading = true; render();
    try { cs.posts = await backend.list(); } catch (e) { if (e.message !== "401") toast(e.message); cs.posts = []; }
    cs.loading = false; render();
  }

  async function quickUpdate(id, patch) {
    const p = cs.posts.find((x) => x.id === id);
    if (!p) return;
    const before = { ...p };
    Object.assign(p, patch); render();
    try { Object.assign(p, await backend.save(p)); render(); }
    catch (e) { Object.assign(p, before); render(); toast(e.message); }
  }

  /* ---------- Peças ---------- */
  const chip = (p, compact) => h("button", {
    type: "button", class: `pc ${STATUS[p.status]?.cls || ""}${compact ? " pc--sm" : ""}`, draggable: "true",
    "data-id": p.id, title: `${p.title} · ${p.network} ${p.format} · ${STATUS[p.status]?.label}`,
    ondragstart: (e) => { e.dataTransfer.setData("text/plain", p.id); e.dataTransfer.effectAllowed = "move"; e.currentTarget.classList.add("is-drag"); },
    ondragend: (e) => e.currentTarget.classList.remove("is-drag"),
    onclick: (e) => { e.stopPropagation(); openPost(p); },
  },
  h("i", { class: "pc__net", style: { background: NET_COLOR[p.network] || "#6B7280" } }, p.network[0]),
  h("span", { class: "pc__t" }, p.time ? h("b", {}, p.time) : null, p.title),
  compact ? null : h("small", {}, `${p.format}${p.boost ? " · impulsionar" : ""}`),
  p.feedback?.type === "ajuste" ? h("em", { class: "pc__flag", title: "O cliente pediu ajuste" }, "!") : null);

  const dropZone = (attrs, onDrop, ...kids) => h("div", {
    ...attrs,
    ondragover: (e) => { e.preventDefault(); e.currentTarget.classList.add("is-over"); },
    ondragleave: (e) => e.currentTarget.classList.remove("is-over"),
    ondrop: (e) => { e.preventDefault(); e.currentTarget.classList.remove("is-over"); const id = e.dataTransfer.getData("text/plain"); if (id) onDrop(id); },
  }, ...kids);

  const byDate = () => { const m = {}; cs.posts.forEach((p) => (m[p.date] ||= []).push(p)); Object.values(m).forEach((l) => l.sort((a, b) => (a.time || "99").localeCompare(b.time || "99"))); return m; };

  function monthView() {
    const [y, m] = cs.cursor.split("-").map(Number);
    const first = new Date(y, m - 1, 1), last = new Date(y, m, 0), t = today(), map = byDate();
    const cells = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(h("div", { class: "mc is-out" }));
    for (let d = 1; d <= last.getDate(); d++) {
      const date = iso(new Date(y, m - 1, d));
      cells.push(dropZone({ class: `mc${date === t ? " is-today" : ""}${date < t ? " is-past" : ""}`, onclick: () => openPost(null, date), title: "Clique para criar · solte um post para mudar o dia" },
        (id) => quickUpdate(id, { date }),
        h("span", { class: "mc__d" }, String(d)),
        (map[date] || []).map((p) => chip(p, true)),
        h("span", { class: "mc__add", "aria-hidden": "true" }, "+")));
    }
    return h("div", { class: "mgrid" }, WEEK.map((w) => h("div", { class: "mgrid__h" }, w)), cells);
  }

  function weekView() {
    const start = addDays(cs.cursor, -parse(cs.cursor).getDay()), map = byDate(), t = today();
    return h("div", { class: "wgrid" }, Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      return dropZone({ class: `wcol${date === t ? " is-today" : ""}` }, (id) => quickUpdate(id, { date }),
        h("div", { class: "wcol__h" }, h("span", {}, WEEK[i]), h("strong", {}, String(parse(date).getDate()))),
        (map[date] || []).map((p) => chip(p)),
        h("button", { type: "button", class: "wcol__add", onclick: () => openPost(null, date) }, "+ Adicionar"));
    }));
  }

  function listView() {
    const month = cs.cursor.slice(0, 7);
    const list = cs.posts.filter((p) => p.date.slice(0, 7) === month).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
    if (!list.length) return h("p", { class: "muted cal-empty" }, "Nenhuma publicação neste mês. Clique em “Nova publicação” para começar.");
    let last = null;
    return h("div", { class: "lview" }, list.flatMap((p) => {
      const out = [];
      if (p.date !== last) { last = p.date; out.push(h("p", { class: "lview__d" }, dayName(p.date))); }
      out.push(h("button", { type: "button", class: "lrow", onclick: () => openPost(p) },
        h("i", { class: "pc__net", style: { background: NET_COLOR[p.network] } }, p.network[0]),
        h("span", { class: "lrow__t" }, p.title, h("small", {}, `${p.network} · ${p.format}${p.time ? ` · ${p.time}` : ""}`)),
        h("span", { class: `chip ${STATUS[p.status].cls}` }, STATUS[p.status].label)));
      return out;
    }));
  }

  function boardView() {
    const month = cs.cursor.slice(0, 7);
    const list = cs.posts.filter((p) => p.date.slice(0, 7) === month).sort((a, b) => a.date.localeCompare(b.date));
    return h("div", { class: "kgrid" }, Object.entries(STATUS).map(([k, s]) => {
      const col = list.filter((p) => p.status === k);
      return dropZone({ class: "kcol" }, (id) => quickUpdate(id, { status: k }),
        h("div", { class: "kcol__h" }, h("span", { class: `dot ${s.cls}` }), s.label, h("b", {}, String(col.length))),
        col.map((p) => h("div", { class: "kcard-wrap" }, h("small", { class: "kcard__d" }, dayName(p.date)), chip(p))));
    }));
  }

  function render() {
    const box = $("#calendar-admin");
    if (!box) return;
    const clients = state.clients.filter((c) => !c.pending);
    if (!clients.length) { box.replaceChildren(h("div", { class: "empty-state" }, h("strong", {}, "Nenhum cliente ainda"), h("p", {}, "Cadastre um cliente para montar o calendário dele."))); return; }

    const shift = (n) => {
      if (cs.view === "semana") cs.cursor = addDays(cs.cursor, 7 * n);
      else { const d = parse(cs.cursor); cs.cursor = iso(new Date(d.getFullYear(), d.getMonth() + n, 1)); }
      render();
    };
    const label = cs.view === "semana"
      ? (() => { const s = addDays(cs.cursor, -parse(cs.cursor).getDay()); return `${parse(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${parse(addDays(s, 6)).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`; })()
      : monthName(cs.cursor);
    const month = cs.cursor.slice(0, 7);
    const mPosts = cs.posts.filter((p) => p.date.slice(0, 7) === month);
    const waiting = mPosts.filter((p) => p.status === "aprovacao").length;
    const fixes = cs.posts.filter((p) => p.feedback?.type === "ajuste" && p.status === "producao").length;

    const sel = h("select", { class: "cal-client", "aria-label": "Cliente", onchange: (e) => { cs.client = e.target.value; load(); } },
      clients.map((c) => h("option", { value: c.id, selected: c.id === cs.client }, c.name)));

    box.replaceChildren(
      h("div", { class: "cal-bar" },
        sel,
        h("div", { class: "seg cal-views", role: "radiogroup", "aria-label": "Visualização" }, VIEWS.map(([k, l]) => h("button", {
          type: "button", role: "radio", "aria-checked": String(cs.view === k),
          onclick: () => { cs.view = k; try { localStorage.setItem("renowa-cal-view", k); } catch { /* */ } render(); },
        }, l))),
        h("div", { class: "cal-nav" },
          h("button", { type: "button", class: "icon-btn", "aria-label": "Anterior", onclick: () => shift(-1) }, "‹"),
          h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: () => { cs.cursor = today(); render(); } }, "Hoje"),
          h("button", { type: "button", class: "icon-btn", "aria-label": "Próximo", onclick: () => shift(1) }, "›"),
          h("strong", { class: "cal-label" }, label)),
        h("button", { type: "button", class: "btn btn--primary", onclick: () => openPost(null, cs.cursor.slice(0, 7) === today().slice(0, 7) ? today() : `${month}-01`) }, "+ Nova publicação")),
      h("div", { class: "cal-stats" },
        Object.entries(STATUS).map(([k, s]) => h("span", { class: `chip ${s.cls}` }, `${mPosts.filter((p) => p.status === k).length} ${s.label.toLowerCase()}`)),
        waiting ? h("span", { class: "cal-stats__note" }, `${waiting} esperando o cliente aprovar`) : null,
        fixes ? h("span", { class: "cal-stats__note is-warn" }, `${fixes} com ajuste pedido pelo cliente`) : null),
      cs.loading ? h("p", { class: "muted" }, "Carregando calendário…") :
        h("div", { class: `cal-view cal-view--${cs.view}` }, cs.view === "mes" ? monthView() : cs.view === "semana" ? weekView() : cs.view === "lista" ? listView() : boardView()),
      h("p", { class: "fineprint" }, "Dica: arraste uma publicação para outro dia (Mês e Semana) ou para outra etapa (Quadro). O cliente vê o calendário na Área do Cliente e aprova os posts em “Aguardando aprovação”."));
  }

  /* ---------- Formulário ---------- */
  let current = null, lastFocus = null;
  function openPost(p, date) {
    current = p ? { ...p } : { date: date || today(), time: "18:00", network: "Instagram", format: "Post", title: "", caption: "", status: "planejado", link: "", boost: false, notes: "" };
    lastFocus = document.activeElement;
    const d = $("#post-drawer");
    d.hidden = false; document.body.classList.add("no-scroll");
    requestAnimationFrame(() => d.classList.add("is-open"));
    renderForm();
    $("#pf-title")?.focus();
  }
  function closePost() {
    const d = $("#post-drawer");
    if (d.hidden) return;
    d.classList.remove("is-open"); document.body.classList.remove("no-scroll");
    setTimeout(() => (d.hidden = true), 250);
    lastFocus?.focus?.();
  }
  $("#post-drawer").addEventListener("click", (e) => e.target.closest("[data-close]") && closePost());
  document.addEventListener("keydown", (e) => e.key === "Escape" && closePost());

  function renderForm() {
    const f = current;
    const set = (k) => (e) => { f[k] = e.target.type === "checkbox" ? e.target.checked : e.target.value; if (k === "caption") count.textContent = `${f.caption.length}/2200`; };
    const select = (id, k, opts) => h("select", { id, onchange: set(k) }, opts.map(([v, l]) => h("option", { value: v, selected: f[k] === v }, l)));
    const count = h("small", { class: "muted" }, `${(f.caption || "").length}/2200`);
    const err = h("p", { class: "form-error", role: "alert" });
    const save = h("button", { type: "button", class: "btn btn--primary", onclick: async () => {
      save.disabled = true; err.textContent = "";
      try {
        const saved = await backend.save(f);
        cs.posts = cs.posts.filter((x) => x.id !== saved.id).concat(saved);
        closePost(); render(); toast("Publicação salva no calendário.");
      } catch (e) { err.textContent = e.message; save.disabled = false; }
    } }, f.id ? "Salvar alterações" : "Adicionar ao calendário");

    $("#post-form").replaceChildren(h("div", { class: "ed" },
      h("p", { class: "mono page__kicker" }, f.id ? "Editar publicação" : "Nova publicação"),
      h("h2", { id: "post-title", class: "ed__title", tabindex: "-1" }, f.title || "Sem título"),
      f.feedback ? h("div", { class: `pf-feedback ${f.feedback.type === "ajuste" ? "is-warn" : "is-ok"}` },
        h("strong", {}, f.feedback.type === "ajuste" ? `${f.feedback.by || "O cliente"} pediu ajuste` : `${f.feedback.by || "O cliente"} aprovou`),
        f.feedback.note ? h("p", {}, `“${f.feedback.note}”`) : null,
        h("small", {}, new Date(f.feedback.at).toLocaleString("pt-BR"))) : null,
      h("div", { class: "fld" }, h("label", { for: "pf-title" }, "Título (o cliente vê)"),
        h("input", { id: "pf-title", value: f.title, maxlength: "120", placeholder: "Ex.: Tour pela loja nova", oninput: (e) => { f.title = e.target.value; $("#post-title").textContent = f.title || "Sem título"; } })),
      h("div", { class: "row row--3" },
        h("div", { class: "fld" }, h("label", { for: "pf-date" }, "Data"), h("input", { id: "pf-date", type: "date", value: f.date, onchange: set("date") })),
        h("div", { class: "fld" }, h("label", { for: "pf-time" }, "Horário"), h("input", { id: "pf-time", type: "time", value: f.time, onchange: set("time") })),
        h("div", { class: "fld" }, h("label", { for: "pf-status" }, "Etapa"), select("pf-status", "status", Object.entries(STATUS).map(([k, s]) => [k, s.label])))),
      h("div", { class: "row" },
        h("div", { class: "fld" }, h("label", { for: "pf-net" }, "Rede"), select("pf-net", "network", NETWORKS.map((n) => [n, n]))),
        h("div", { class: "fld" }, h("label", { for: "pf-fmt" }, "Formato"), select("pf-fmt", "format", FORMATS.map((n) => [n, n])))),
      h("div", { class: "fld" }, h("label", { for: "pf-cap" }, "Legenda"), h("textarea", { id: "pf-cap", rows: "6", maxlength: "2200", placeholder: "Texto que vai na publicação", oninput: set("caption") }, f.caption || ""), count),
      h("div", { class: "fld" }, h("label", { for: "pf-link" }, "Link da arte ou do vídeo (Drive, Canva, Frame.io…)"), h("input", { id: "pf-link", type: "url", value: f.link || "", placeholder: "https://", oninput: set("link") })),
      h("label", { class: "toggle" }, h("input", { type: "checkbox", checked: !!f.boost, onchange: set("boost") }), "Vai ser impulsionado (anúncio)"),
      h("div", { class: "fld" }, h("label", { for: "pf-notes" }, "Notas internas (o cliente não vê)"), h("textarea", { id: "pf-notes", rows: "2", oninput: set("notes") }, f.notes || "")),
      err,
      h("div", { class: "ed__foot" },
        save,
        f.id ? h("button", { type: "button", class: "btn btn--ghost", onclick: () => { const copy = { ...f, id: undefined, feedback: null, status: "planejado", title: `${f.title} (cópia)` }; current = copy; renderForm(); } }, "Duplicar") : null,
        h("span", { class: "spacer" }),
        f.id ? h("button", { type: "button", class: "btn btn--danger btn--sm", onclick: async () => {
          if (!confirm(`Excluir “${f.title}” do calendário?`)) return;
          try { await backend.remove(f.id); cs.posts = cs.posts.filter((x) => x.id !== f.id); closePost(); render(); toast("Publicação excluída."); }
          catch (e) { toast(e.message); }
        } }, "Excluir") : null)));
  }

  return { load, render, open: openPost, get client() { return cs.client; } };
}
