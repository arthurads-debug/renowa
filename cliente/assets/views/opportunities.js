// OPORTUNIDADES — posts e vídeos que foram melhor que a média SEM anúncio.
// O público já mostrou que gosta: são os melhores candidatos para virar anúncio no Instagram, Facebook e YouTube.
import { h, icon, int, dec, pct, safeDiv, parseISO } from "../util.js";
import { card, loadingState, emptyState, postThumb, netBadge } from "../components.js";

const NET = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube" };
const ui = { net: "all" };
const median = (arr) => { const a = arr.filter((x) => x > 0).sort((x, y) => x - y); if (!a.length) return 0; const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const dateBR = (s) => (s ? parseISO(String(s).slice(0, 10)).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "");

// Junta posts e vídeos com números orgânicos comparáveis dentro de cada rede
function candidates(state) {
  const out = [];
  const s = state.social || {};
  for (const n of ["instagram", "facebook"]) {
    if (!s[n]?.connected) continue;
    for (const p of s[n].posts || []) out.push({ net: n, id: p.id, title: p.caption || "(sem legenda)", date: p.date, thumb: p, link: p.permalink, reach: p.reach || 0, inter: p.interactions || 0, format: p.format });
  }
  const y = state.youtube;
  if (y?.connected && y.analytics) {
    for (const v of y.top || []) {
      const org = v.paidViews == null ? v.views : Math.max(0, v.views - v.paidViews);
      out.push({ net: "youtube", id: v.id, title: v.title, date: v.publishedAt, thumb: { thumbnail: v.thumbnail, format: v.short ? "Short" : "Vídeo" }, link: `https://www.youtube.com/watch?v=${v.id}`,
        reach: org, inter: v.likes + v.comments + v.shares, format: v.short ? "Short" : "Vídeo", retention: v.avgPercent, paidShare: v.views ? safeDiv(v.paidViews || 0, v.views) : 0, subs: v.gained });
    }
  }
  // nota por rede: quantas vezes acima da mediana em alcance e em taxa de engajamento
  const scored = [];
  for (const n of Object.keys(NET)) {
    const list = out.filter((x) => x.net === n);
    if (list.length < 3) { scored.push(...list.map((x) => ({ ...x, rx: 0, ex: 0, score: 0 }))); continue; }
    const mr = median(list.map((x) => x.reach));
    const me = median(list.map((x) => safeDiv(x.inter, x.reach)));
    for (const x of list) {
      const rx = mr ? x.reach / mr : 0;
      const ex = me ? safeDiv(x.inter, x.reach) / me : 0;
      scored.push({ ...x, rx, ex, score: rx * 0.6 + ex * 0.4, mr, me });
    }
  }
  return scored;
}

function why(x) {
  const out = [];
  if (x.rx >= 1.3) out.push(`Alcance orgânico ${dec(x.rx, 1)}× maior que a média da rede`);
  if (x.ex >= 1.3) out.push(`Engajamento ${dec(x.ex, 1)}× acima da média (${pct(safeDiv(x.inter, x.reach), 1)})`);
  if (x.net === "youtube" && x.retention >= 50) out.push(`Retenção alta: ${dec(x.retention, 0)}% do vídeo assistido`);
  if (x.net === "youtube" && x.subs > 0) out.push(`Trouxe ${int(x.subs)} novos inscritos`);
  return out;
}

function suggestion(x) {
  if (x.net === "youtube") return x.retention >= 50 ? "Anúncio em vídeo no YouTube (in-stream) para públicos parecidos com quem já assistiu" : "Anúncio de descoberta no YouTube para levar mais gente ao vídeo";
  if (x.ex >= x.rx && x.ex >= 1.3) return "Impulsionar com objetivo de engajamento ou mensagens — o público já interage com este conteúdo";
  return "Impulsionar com objetivo de alcance para a região — o conteúdo já se espalha sozinho";
}

export function renderOpportunities(view, state) {
  const c = state.client;
  if (!state.social && !state.youtube) { view.replaceChildren(loadingState()); return; }
  const all = candidates(state);
  const nets = [...new Set(all.map((x) => x.net))];
  if (!all.length) {
    view.replaceChildren(emptyState("Ainda não há posts para analisar", "Assim que Instagram, Facebook ou YouTube tiverem publicações no período, os destaques aparecem aqui. Experimente o período de 90 dias."));
    return;
  }
  if (ui.net !== "all" && !nets.includes(ui.net)) ui.net = "all";
  const ops = all.filter((x) => x.score >= 1.25 && x.reach > 0 && (ui.net === "all" || x.net === ui.net)).sort((a, b) => b.score - a.score).slice(0, 12);

  const ask = (x) => {
    const msg = `Olá! Vi no painel da Renowa que este conteúdo foi muito bem no orgânico e quero conversar sobre impulsionar:\n${x.title.slice(0, 120)}\n${x.link || ""}`;
    return c.agencyWhatsapp ? `https://wa.me/${c.agencyWhatsapp}?text=${encodeURIComponent(msg)}` : null;
  };

  const intro = h("section", { class: "opp-hero" },
    h("div", { class: "opp-hero__ico", "aria-hidden": "true" }, icon("rocket")),
    h("div", {},
      h("h2", {}, ops.length ? `${ops.length} ${ops.length === 1 ? "conteúdo pronto" : "conteúdos prontos"} para virar anúncio` : "Nenhum destaque fora da curva neste período"),
      h("p", {}, "Aqui ficam os posts e vídeos que foram melhor que a média ", h("b", {}, "sem nenhum investimento"), ". Quando o público já mostrou que gosta, o anúncio rende mais e custa menos. Comparamos cada post com os outros da mesma rede.")),
    h("div", { class: "opp-hero__stats" },
      nets.map((n) => h("div", {}, netBadge(n), h("strong", {}, int(all.filter((x) => x.net === n && x.score >= 1.25).length)), h("span", {}, NET[n])))));

  const seg = nets.length > 1 ? h("div", { class: "seg", role: "radiogroup", "aria-label": "Rede" },
    [["all", "Todas"], ...nets.map((n) => [n, NET[n]])].map(([v, l]) => h("button", { role: "radio", "aria-checked": String(ui.net === v), onclick: () => { ui.net = v; renderOpportunities(view, state); } }, l))) : null;

  const cardOf = (x, i) => {
    const t = postThumb(x.thumb);
    const reasons = why(x);
    const wa = ask(x);
    return h("article", { class: `opp${i === 0 ? " opp--top" : ""}` },
      h("div", { class: "opp__media" }, t, h("span", { class: "opp__rank" }, `#${i + 1}`), h("span", { class: "opp__net" }, netBadge(x.net))),
      h("div", { class: "opp__body" },
        h("p", { class: "opp__meta" }, `${NET[x.net]} · ${x.format || "Post"} · ${dateBR(x.date)}`),
        h("p", { class: "opp__title" }, x.title),
        h("div", { class: "opp__score" },
          h("div", {}, h("span", {}, x.net === "youtube" ? "Views orgânicas" : "Alcance"), h("strong", {}, int(x.reach)), h("em", { class: x.rx >= 1 ? "up" : "" }, `${dec(x.rx, 1)}× a média`)),
          h("div", {}, h("span", {}, "Engajamento"), h("strong", {}, pct(safeDiv(x.inter, x.reach), 1)), h("em", { class: x.ex >= 1 ? "up" : "" }, `${dec(x.ex, 1)}× a média`))),
        reasons.length ? h("ul", { class: "opp__why" }, reasons.map((r) => h("li", {}, r))) : null,
        x.net === "youtube" && x.paidShare > 0.05 ? h("p", { class: "opp__note" }, `Este vídeo já recebe ${pct(x.paidShare, 0)} das views por anúncio.`) : null,
        h("div", { class: "opp__sug" }, h("b", {}, "Sugestão: "), suggestion(x)),
        h("div", { class: "opp__act" },
          wa ? h("a", { class: "btn btn--primary btn--sm", href: wa, target: "_blank", rel: "noopener" }, icon("whatsapp"), "Quero impulsionar") : null,
          x.link ? h("a", { class: "btn btn--ghost btn--sm", href: x.link, target: "_blank", rel: "noopener" }, "Ver post") : null)));
  };

  view.replaceChildren(...[
    intro,
    seg ? h("div", { class: "toolbar" }, seg) : null,
    ops.length ? h("div", { class: "opps" }, ops.map(cardOf))
      : card({ title: "Sem destaques fora da curva" }, h("p", { class: "muted" }, "Todos os posts tiveram desempenho parecido neste período. Experimente o período de 90 dias para comparar mais publicações.")),
    h("p", { class: "fineprint" }, "Como calculamos: dentro de cada rede, comparamos o alcance (ou as views orgânicas, no YouTube) e a taxa de engajamento de cada post com a mediana dos outros posts do período. Entram aqui os que somam pelo menos 25% acima do normal. No YouTube, descontamos as views que vieram de anúncios."),
  ].filter(Boolean));
  requestAnimationFrame(() => view.querySelectorAll(".opp").forEach((el, i) => { el.style.setProperty("--d", `${Math.min(i, 8) * 60}ms`); el.classList.add("is-in"); }));
}
