// CALENDÁRIO EDITORIAL — o que será publicado, com status e aprovação pelo WhatsApp.
import { h, icon, iso, parseISO, today, fmtFull, cap, fmtMonth } from "../util.js";
import { card, loadingState, emptyState, statusChip, STATUS, dayLabel } from "../components.js";
import { api } from "../data.js";

const ui = { month: null, view: null, week: null };
const VIEWS = [["mes", "Mês"], ["semana", "Semana"], ["lista", "Lista"]];
const NET_COLOR = { Instagram: "#DD2A7B", Facebook: "#1F3FA8", TikTok: "#08080F", YouTube: "#E02424", LinkedIn: "#0A66C2", WhatsApp: "#12B76A", "Site/Blog": "#6B7280" };
const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function renderCalendar(view, state, helpers) {
  const items = state.content?.calendar;
  if (!items) { view.replaceChildren(loadingState()); return; }
  if (!items.length) { view.replaceChildren(emptyState("Calendário vazio", "A agência ainda não cadastrou publicações.")); return; }

  const t = today();
  ui.month ||= t.slice(0, 7);
  if (!ui.view) { try { ui.view = localStorage.getItem("renowa-cli-cal") || (matchMedia("(max-width: 760px)").matches ? "lista" : "mes"); } catch { ui.view = "mes"; } }
  ui.week ||= t;
  const [y, m] = ui.month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const monthItems = items.filter((p) => p.date.slice(0, 7) === ui.month).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const byDay = {};
  monthItems.forEach((p) => (byDay[p.date] ||= []).push(p));

  const count = (s) => monthItems.filter((p) => p.status === s).length;
  const waiting = items.filter((p) => p.status === "aprovacao" && p.date >= t).sort((a, b) => a.date.localeCompare(b.date));

  const rerender = () => renderCalendar(view, state, helpers);
  const shift = (n) => {
    if (ui.view === "semana") { const d = parseISO(ui.week); d.setDate(d.getDate() + 7 * n); ui.week = iso(d); ui.month = ui.week.slice(0, 7); }
    else { const d = new Date(y, m - 1 + n, 1); ui.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
    rerender();
  };
  const open = (p) => helpers.openDrawer(detail(p, state, helpers, rerender));

  // ---------- Semana ----------
  const ws = parseISO(ui.week); ws.setDate(ws.getDate() - ws.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return iso(d); });
  const allByDay = {};
  items.forEach((p) => (allByDay[p.date] ||= []).push(p));
  const weekGrid = h("div", { class: "wk" }, weekDays.map((date, i) => h("div", { class: `wk__col${date === t ? " is-today" : ""}` },
    h("div", { class: "wk__h" }, h("span", {}, WEEK[i]), h("strong", {}, String(parseISO(date).getDate()))),
    (allByDay[date] || []).sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((p) => h("button", { class: `wk__item wk--${p.status}`, onclick: () => open(p) },
      h("i", { class: "wk__net", style: { background: NET_COLOR[p.network] || "#6B7280" } }, String(p.network || "?")[0]),
      h("span", {}, p.time ? h("b", {}, `${p.time} `) : null, p.title, h("small", {}, `${p.format} · ${STATUS[p.status].short || STATUS[p.status].label}`)))),
    (allByDay[date] || []).length ? null : h("p", { class: "wk__none" }, "—"))));
  const weekLabel = `${parseISO(weekDays[0]).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${parseISO(weekDays[6]).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  // ---------- Grade do mês (desktop) ----------
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(h("div", { class: "cal__cell is-out", "aria-hidden": "true" }));
  for (let d = 1; d <= last.getDate(); d++) {
    const date = iso(new Date(y, m - 1, d));
    cells.push(h("div", { class: `cal__cell${date === t ? " is-today" : ""}${date < t ? " is-past" : ""}` },
      h("span", { class: "cal__day" }, String(d)),
      (byDay[date] || []).map((p) => h("button", { class: `cal__item ${STATUS[p.status].cls}`, onclick: () => open(p), "aria-label": `${p.title}, ${p.format}, ${STATUS[p.status].label}` },
        h("span", { class: "cal__fmt" }, p.format), h("span", { class: "cal__title" }, p.title)))));
  }

  // ---------- Lista (celular) ----------
  const agenda = h("ul", { class: "agenda agenda--cal" }, monthItems.map((p) => h("li", {},
    h("button", { class: "agenda__item agenda__item--btn", onclick: () => open(p) },
      h("span", { class: "agenda__date" }, dayLabel(p.date)),
      h("span", { class: "agenda__title" }, p.title, h("small", {}, `${p.format} · ${p.network}${p.time ? ` · ${p.time}` : ""}`)),
      statusChip(p.status, true)))));

  view.replaceChildren(...[
    waiting.length ? h("section", { class: "cta-card is-warn" },
      icon("check", "ico ico--lg"),
      h("div", {}, h("strong", {}, `${waiting.length} ${waiting.length === 1 ? "publicação aguarda" : "publicações aguardam"} sua aprovação`),
        h("p", {}, `A próxima é em ${dayLabel(waiting[0].date)}: “${waiting[0].title}”. Aprovar até 2 dias antes garante a publicação no horário.`)),
      h("button", { class: "btn btn--primary btn--sm", onclick: () => open(waiting[0]) }, "Revisar agora")) : null,
    h("section", { class: "kpis kpis--4", "aria-label": "Resumo do mês" },
      ["publicado", "aprovado", "aprovacao", "producao"].map((s) => h("article", { class: "kpi" },
        h("p", { class: "kpi__label" }, STATUS[s].label), h("p", { class: "kpi__value" }, String(count(s))), h("p", { class: "kpi__cmp" }, `em ${fmtMonth(ui.month)}`)))),
    card({
      title: ui.view === "semana" ? `Semana · ${weekLabel}` : cap(fmtMonth(ui.month)),
      sub: `${monthItems.length} publicações planejadas${monthItems.some((p) => p.boost) ? ` · ${monthItems.filter((p) => p.boost).length} serão impulsionadas` : ""}`,
      tools: [
        h("div", { class: "seg cal-switch", role: "radiogroup", "aria-label": "Visualização" }, VIEWS.map(([k, l]) => h("button", {
          type: "button", role: "radio", "aria-checked": String(ui.view === k),
          onclick: () => { ui.view = k; try { localStorage.setItem("renowa-cli-cal", k); } catch { /* */ } rerender(); },
        }, l))),
        h("button", { class: "icon-btn", "aria-label": ui.view === "semana" ? "Semana anterior" : "Mês anterior", onclick: () => shift(-1) }, icon("left")),
        h("button", { class: "btn btn--ghost btn--sm", onclick: () => { ui.month = t.slice(0, 7); ui.week = t; rerender(); } }, "Hoje"),
        h("button", { class: "icon-btn", "aria-label": ui.view === "semana" ? "Próxima semana" : "Próximo mês", onclick: () => shift(1) }, icon("right")),
      ],
    },
    h("div", { class: "legend legend--status" }, Object.values(STATUS).map((s) => h("span", {}, h("i", { class: `dot ${s.cls}` }), s.label))),
    h("div", { class: `cal-pane cal-pane--${ui.view}` },
      ui.view === "semana" ? weekGrid
        : ui.view === "lista" ? (monthItems.length ? agenda : h("p", { class: "muted cal__empty" }, "Nenhuma publicação neste mês."))
        : h("div", { class: "cal", role: "grid", "aria-label": `Calendário de ${fmtMonth(ui.month)}` },
          WEEK.map((w) => h("div", { class: "cal__head", role: "columnheader" }, w)), cells))),
  ].filter(Boolean));
}

function detail(p, state, helpers, rerender) {
  const client = state.client;
  const wa = client.agencyWhatsapp;
  const inPanel = p.source === "painel" && client.viewer !== "agency";
  const decide = async (decision, note, btn) => {
    btn.disabled = true;
    try {
      const r = await api("/api/posts", { method: "POST", body: JSON.stringify({ id: p.id, decision, note }) });
      if (!r.ok) throw new Error(r.data?.error || "Não foi possível enviar agora.");
      Object.assign(p, r.data.post);
      document.querySelector("#drawer [data-close]")?.click();
      helpers.toast(decision === "aprovar" ? "Publicação aprovada. Obrigado!" : "Pedido de ajuste enviado para a agência.");
      rerender();
    } catch (e) { helpers.toast(e.message); btn.disabled = false; }
  };
  const panelActions = () => {
    const note = h("textarea", { class: "detail__note", rows: "3", placeholder: "Se precisar de ajuste, conte aqui o que mudar (opcional para aprovar)" });
    return h("div", { class: "detail__actions" },
      h("p", { class: "muted" }, "Sua resposta chega na hora para a agência."),
      note,
      h("div", { class: "detail__btns" },
        h("button", { class: "btn btn--primary", onclick: (e) => decide("aprovar", note.value, e.currentTarget) }, icon("check"), "Aprovar"),
        h("button", { class: "btn btn--ghost", onclick: (e) => { if (!note.value.trim()) { note.focus(); helpers.toast("Escreva o que precisa mudar."); return; } decide("ajuste", note.value, e.currentTarget); } }, icon("edit"), "Pedir ajuste")));
  };
  const msg = (kind) => `${kind === "ok" ? "✅ Aprovado" : "✏️ Ajuste solicitado"} — post de ${fmtFull(p.date)} (${p.format}): “${p.title}”.${kind === "ok" ? "" : "\nO que mudar: "}`;
  const link = (kind) => (wa ? `https://wa.me/${wa}?text=${encodeURIComponent(msg(kind))}` : null);
  const action = (kind, label, cls) => {
    const href = link(kind);
    return href
      ? h("a", { class: `btn ${cls}`, href, target: "_blank", rel: "noopener" }, icon(kind === "ok" ? "check" : "edit"), label)
      : h("button", { class: `btn ${cls}`, onclick: () => helpers.toast("Configure o WhatsApp da agência (AGENCY_WHATSAPP) para aprovar por aqui.") }, label);
  };
  return h("div", { class: "detail" },
    h("p", { class: "mono muted" }, `${p.network} · ${p.format}${p.boost ? " · será impulsionado" : ""}`),
    h("h2", { id: "drawer-title", class: "detail__title" }, p.title),
    h("p", { class: "detail__date" }, `${cap(parseISO(p.date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }))}${p.time ? ` às ${p.time}` : ""}`),
    statusChip(p.status),
    p.caption ? h("div", { class: "detail__caption" }, h("p", { class: "mono muted" }, "Legenda"), h("p", {}, p.caption)) : null,
    p.link ? h("a", { class: "link", href: p.link, target: "_blank", rel: "noopener" }, "Ver arte / vídeo ", icon("external")) : null,
    p.feedback?.type === "ajuste" && p.status !== "aprovacao" ? h("p", { class: "detail__fb" }, "Você pediu ajuste: ", h("em", {}, `“${p.feedback.note}”`), " A agência está cuidando disso.") : null,
    p.status === "aprovacao" && inPanel ? panelActions() : null,
    p.status === "aprovacao" && !inPanel ? h("div", { class: "detail__actions" },
      h("p", { class: "muted" }, "Sua resposta vai direto para o WhatsApp da agência."),
      action("ok", "Aprovar", "btn--primary"), action("edit", "Pedir ajuste", "btn--ghost")) : null,
    p.status !== "aprovacao" && p.status !== "publicado" && wa ? h("a", { class: "link", href: `https://wa.me/${wa}?text=${encodeURIComponent(`Sobre o post de ${fmtFull(p.date)}: “${p.title}” — `)}`, target: "_blank", rel: "noopener" }, "Comentar com a agência") : null,
  );
}
