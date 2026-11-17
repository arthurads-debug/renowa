// CALENDÁRIO EDITORIAL — o que será publicado, com status e aprovação pelo WhatsApp.
import { h, icon, iso, parseISO, today, fmtFull, cap, fmtMonth } from "../util.js";
import { card, loadingState, emptyState, statusChip, STATUS, dayLabel } from "../components.js";

const ui = { month: null };
const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function renderCalendar(view, state, helpers) {
  const items = state.content?.calendar;
  if (!items) { view.replaceChildren(loadingState()); return; }
  if (!items.length) { view.replaceChildren(emptyState("Calendário vazio", "A agência ainda não cadastrou publicações.")); return; }

  const t = today();
  ui.month ||= t.slice(0, 7);
  const [y, m] = ui.month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const monthItems = items.filter((p) => p.date.slice(0, 7) === ui.month).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const byDay = {};
  monthItems.forEach((p) => (byDay[p.date] ||= []).push(p));

  const count = (s) => monthItems.filter((p) => p.status === s).length;
  const waiting = items.filter((p) => p.status === "aprovacao" && p.date >= t).sort((a, b) => a.date.localeCompare(b.date));

  const shift = (n) => { const d = new Date(y, m - 1 + n, 1); ui.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; renderCalendar(view, state, helpers); };
  const open = (p) => helpers.openDrawer(detail(p, state.client, helpers));

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
      title: cap(fmtMonth(ui.month)),
      sub: `${monthItems.length} publicações planejadas${monthItems.some((p) => p.boost) ? ` · ${monthItems.filter((p) => p.boost).length} serão impulsionadas` : ""}`,
      tools: [
        h("button", { class: "icon-btn", "aria-label": "Mês anterior", onclick: () => shift(-1) }, icon("left")),
        h("button", { class: "btn btn--ghost btn--sm", onclick: () => { ui.month = t.slice(0, 7); renderCalendar(view, state, helpers); } }, "Hoje"),
        h("button", { class: "icon-btn", "aria-label": "Próximo mês", onclick: () => shift(1) }, icon("right")),
      ],
    },
    h("div", { class: "legend legend--status" }, Object.values(STATUS).map((s) => h("span", {}, h("i", { class: `dot ${s.cls}` }), s.label))),
    h("div", { class: "cal", role: "grid", "aria-label": `Calendário de ${fmtMonth(ui.month)}` },
      WEEK.map((w) => h("div", { class: "cal__head", role: "columnheader" }, w)), cells),
    monthItems.length ? agenda : h("p", { class: "muted cal__empty" }, "Nenhuma publicação neste mês.")),
  ].filter(Boolean));
}

function detail(p, client, helpers) {
  const wa = client.agencyWhatsapp;
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
    p.status === "aprovacao" ? h("div", { class: "detail__actions" },
      h("p", { class: "muted" }, "Sua resposta vai direto para o WhatsApp da agência."),
      action("ok", "Aprovar", "btn--primary"), action("edit", "Pedir ajuste", "btn--ghost")) : null,
    p.status !== "aprovacao" && p.status !== "publicado" && wa ? h("a", { class: "link", href: `https://wa.me/${wa}?text=${encodeURIComponent(`Sobre o post de ${fmtFull(p.date)}: “${p.title}” — `)}`, target: "_blank", rel: "noopener" }, "Comentar com a agência") : null,
  );
}
