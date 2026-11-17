// RESUMO — a página que o dono da empresa abre: uma frase, poucos números, o que vem por aí.
import { h, icon, int, money, pct, safeDiv, today, fmtMonth, cap, daysBetween } from "../util.js";
import { context, kpisFor, narrative, PROFILE_TEXT } from "../model.js";
import { card, kpiGrid, statusChip, loadingState, dayLabel, postThumb, accountsStrip } from "../components.js";

export function renderOverview(view, state, helpers) {
  if (!state.metrics) { view.replaceChildren(loadingState()); return; }
  const c = state.client;
  const ctx = context(state, "all");
  const days = daysBetween(state.from, state.to);
  const kpis = kpisFor(ctx);

  // ---------- Herói: a frase do período ----------
  const hero = h("section", { class: "hero-card" },
    h("p", { class: "mono hero-card__kicker" }, PROFILE_TEXT[c.profile].lead),
    h("p", { class: "hero-card__text" }, narrative(ctx, days)));
  const reach = ctx.reach?.current?.reach;
  if (c.profile === "awareness" && c.city?.population && reach) {
    const share = Math.min(1, reach / c.city.population);
    hero.append(h("div", { class: "pop" },
      h("div", { class: "pop__bar", role: "img", "aria-label": `${pct(share, 0)} da população alcançada` }, h("span", { style: { width: `${share * 100}%` } })),
      h("p", { class: "pop__legend" }, h("strong", {}, share >= 1 ? "100%+" : pct(share, 0)), ` — pessoas alcançadas em relação aos ${int(c.city.population)} habitantes de ${c.city.name}. Estimativa: a Meta conta todas as pessoas na região segmentada, inclusive visitantes e moradores de cidades vizinhas.`)));
  }

  // ---------- Coluna de conteúdo ----------
  const cal = state.content?.calendar || [];
  const t = today();
  const upcoming = cal.filter((p) => p.date >= t && p.status !== "publicado").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const waiting = cal.filter((p) => p.status === "aprovacao" && p.date >= t).length;

  const nextCard = c.has.calendar ? card({
    title: "Próximas publicações",
    sub: waiting ? `${waiting} ${waiting === 1 ? "post aguarda" : "posts aguardam"} sua aprovação` : "Tudo em dia por aqui",
    tools: h("a", { class: "link", href: "#calendario" }, "Ver calendário"),
  }, upcoming.length
    ? h("ul", { class: "agenda" }, upcoming.map((p) => h("li", { class: "agenda__item" },
        h("span", { class: "agenda__date" }, dayLabel(p.date)),
        h("span", { class: "agenda__title" }, p.title, h("small", {}, `${p.format} · ${p.network}`)),
        statusChip(p.status, true))))
    : h("p", { class: "muted" }, state.content ? "Nenhuma publicação programada." : "Carregando calendário…")) : null;

  // ---------- Redes sociais (Instagram + Facebook juntos) ----------
  let socialCard = null;
  const s = state.social;
  const nets = s ? ["instagram", "facebook"].filter((n) => s[n]?.connected && s[n].posts?.length) : [];
  if (nets.length) {
    const posts = nets.flatMap((n) => s[n].posts);
    const reachSum = posts.reduce((a, p) => a + p.reach, 0);
    const inter = posts.reduce((a, p) => a + p.interactions, 0);
    const best = [...posts].sort((a, b) => b.reach - a.reach)[0];
    const names = nets.map((n) => (n === "instagram" ? `@${s[n].username}` : s[n].username)).join(" · ");
    socialCard = card({ title: "Redes sociais no período", sub: names, tools: h("a", { class: "link", href: "#social" }, "Ver posts") },
      h("div", { class: "mini-stats" },
        stat(int(posts.length), nets.length > 1 ? "posts (Instagram + Facebook)" : "posts publicados"),
        stat(int(reachSum, true), "contas alcançadas (soma dos posts)"),
        stat(pct(safeDiv(inter, reachSum), 1), "taxa de engajamento")),
      h("div", { class: "best" }, postThumb(best), h("div", {}, h("p", { class: "mono muted" }, `Post de maior alcance · ${best.network === "facebook" ? "Facebook" : "Instagram"}`), h("p", { class: "best__title" }, best.caption), h("p", { class: "muted" }, `${int(best.reach)} contas alcançadas · ${int(best.interactions)} interações`))));
  }

  // ---------- Comentário + relatório ----------
  const report = state.content?.reports?.[0];
  const noteCard = (c.note || report) ? h("section", { class: "note-card" },
    c.note ? [h("p", { class: "mono note-card__label" }, "Recado da agência"), h("p", { class: "note-card__text" }, c.note)] : null,
    report ? h("div", { class: "note-card__report" },
      h("p", { class: "mono note-card__label" }, `Relatório de ${fmtMonth(report.month)}`),
      h("p", {}, report.summary),
      report.next.length ? h("p", { class: "note-card__next" }, h("strong", {}, "Próximos passos: "), report.next.join(" · ")) : null,
      h("a", { class: "link link--light", href: "#historico" }, "Ver relatórios anteriores")) : null) : null;

  // ---------- Registro de vendas (perfil loja física) ----------
  let salesCta = null;
  if (c.profile === "leads") {
    const last = (state.content?.sales || []).map((x) => x.date).sort().pop();
    const stale = !last || daysBetween(last, t) > 8;
    salesCta = h("section", { class: `cta-card${stale ? " is-warn" : ""}` },
      icon("plus", "ico ico--lg"),
      h("div", {},
        h("strong", {}, stale ? "Registre as vendas desta semana" : "Vendas da semana registradas"),
        h("p", {}, "Quem compra pelo WhatsApp ou na loja não aparece nas plataformas. Ao informar as vendas (quantidade e valor), o painel calcula o retorno real dos anúncios.")),
      c.salesFormUrl ? h("a", {
        class: "btn btn--primary btn--sm", href: c.salesFormUrl, target: "_blank", rel: "noopener",
        onclick: (e) => { if (c.salesFormUrl === "#demo") { e.preventDefault(); helpers.toast("No painel real, este botão abre o formulário de vendas da sua empresa."); } },
      }, "Registrar vendas") : null);
  }

  view.replaceChildren(...[
    accountsStrip(c),
    hero,
    kpiGrid(kpis, { partial: false }),
    salesCta,
    h("div", { class: "grid-2" }, [nextCard, noteCard, socialCard].filter(Boolean)),
    h("p", { class: "fineprint" }, footnote(c)),
  ].filter(Boolean));
}

const stat = (v, l) => h("div", { class: "mini-stat" }, h("strong", {}, v), h("span", {}, l));

function footnote(c) {
  if (c.profile === "awareness") return "Pessoas alcançadas vêm da Meta Ads (pessoas diferentes no período). O Google não informa pessoas únicas, só exibições. Os números do dia atual ainda podem mudar.";
  if (c.profile === "leads") return "Conversas e cliques vêm das plataformas. Vendas são as informadas pela sua equipe: nem toda venda tem origem nos anúncios, e nem toda venda vinda dos anúncios é registrada, por isso o retorno é uma estimativa.";
  return "Vendas e receita vêm do rastreamento das plataformas, que pode atribuir a mesma venda ao Google e à Meta. Use o painel da sua loja como fonte oficial do faturamento.";
}
