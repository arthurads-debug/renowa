// YOUTUBE — canal do cliente: crescimento, atenção (tempo assistido), vídeos de maior impacto e quem assiste.
import { h, icon, int, dec, pct, safeDiv, fmtDay, fmtDayLong, parseISO } from "../util.js";
import { card, kpiGrid, loadingState, emptyState } from "../components.js";
import { renderChart, observe } from "../charts.js";

const ui = { sort: "views", chart: "views", rsort: "recent", rfmt: "all" };
const BLUE = "#1E12EA", ORANGE = "#FA4802";

const TRAFFIC = {
  YT_SEARCH: "Busca do YouTube", SUGGESTED: "Vídeos sugeridos", RELATED_VIDEO: "Vídeos sugeridos", BROWSE: "Página inicial e feed", SHORTS: "Feed de Shorts",
  EXT_URL: "Sites e apps externos", SUBSCRIBER: "Feed de inscrições", PLAYLIST: "Playlists", YT_PLAYLIST_PAGE: "Playlists", NO_LINK_OTHER: "Acesso direto",
  YT_CHANNEL: "Página do canal", NOTIFICATION: "Notificações", YT_OTHER_PAGE: "Outras páginas do YouTube", END_SCREEN: "Tela final", ANNOTATION: "Cards",
  HASHTAGS: "Hashtags", ADVERTISING: "Anúncios", LIVE_REDIRECT: "Lives", SOUND_PAGE: "Página de áudio", CAMPAIGN_CARD: "Campanhas", PRODUCT_PAGE: "Página de produto",
  VIDEO_REMIXES: "Remixes", IMMERSIVE_LIVE: "Lives", NO_LINK_EMBEDDED: "Vídeo incorporado em sites",
};
const DEVICE = { MOBILE: "Celular", DESKTOP: "Computador", TV: "TV", TABLET: "Tablet", GAME_CONSOLE: "Videogame", UNKNOWN_PLATFORM: "Outros" };
const ageLabel = (a) => String(a).replace("age", "").replace(/-$/, "+").replace("-", "–");
let countryNames;
const country = (c) => { try { countryNames ||= new Intl.DisplayNames(["pt-BR"], { type: "region" }); return countryNames.of(c); } catch { return c; } };

const hours = (min) => min / 60;
const mmss = (s) => { s = Math.round(s || 0); const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${m}:${String(s % 60).padStart(2, "0")}`; };
const watch = (id) => `https://www.youtube.com/watch?v=${id}`;
const eng = (v) => (v.likes || 0) + (v.comments || 0) + (v.shares || 0);

function thumb(v, cls = "yt-thumb") {
  const box = h("div", { class: cls });
  if (v.thumbnail) box.append(h("img", { src: v.thumbnail, alt: "", loading: "lazy", decoding: "async", referrerpolicy: "no-referrer", onerror: (e) => { e.currentTarget.replaceWith(h("span", { class: "yt-thumb__ph", "aria-hidden": "true" })); } }));
  else box.append(h("span", { class: "yt-thumb__ph", "aria-hidden": "true" }));
  box.append(h("span", { class: "yt-thumb__play", "aria-hidden": "true" }), v.duration ? h("span", { class: "yt-thumb__dur" }, v.short ? "Short" : mmss(v.duration)) : null);
  return box;
}

export function renderYouTube(view, state) {
  const y = state.youtube;
  if (!y) { view.replaceChildren(loadingState()); return; }
  if (!y.connected) { view.replaceChildren(emptyState("YouTube ainda não conectado", "A agência conecta o canal no painel; a partir daí, visualizações, inscritos e os vídeos de maior impacto aparecem aqui.")); return; }
  if (y.error) { view.replaceChildren(card({ title: "YouTube" }, h("p", { class: "source-alert" }, y.error))); return; }
  const c = y.channel;
  const cur = y.current, prev = y.previous;
  const net = cur ? cur.gained - cur.lost : 0;

  // ---------- Herói do canal ----------
  const hero = h("section", { class: "yt-hero" },
    h("div", { class: "yt-hero__grid", "aria-hidden": "true" }),
    h("div", { class: "yt-hero__scan", "aria-hidden": "true" }),
    h("div", { class: "yt-hero__id" },
      c.thumbnail ? h("img", { class: "yt-hero__avatar", src: c.thumbnail, alt: "", referrerpolicy: "no-referrer" }) : h("span", { class: "yt-hero__avatar yt-hero__avatar--ph" }, c.name.slice(0, 1)),
      h("div", {},
        h("p", { class: "yt-hero__kicker" }, icon("youtube"), "Canal no YouTube"),
        h("h2", {}, c.name),
        h("p", { class: "yt-hero__handle" }, [c.handle, c.since ? `no YouTube desde ${parseISO(c.since.slice(0, 10)).getFullYear()}` : ""].filter(Boolean).join(" · ")))),
    h("div", { class: "yt-hero__stats" },
      stat(c.hiddenSubscribers ? "—" : int(c.subscribers), "Inscritos", cur ? `${net >= 0 ? "+" : ""}${int(net)} no período` : ""),
      stat(int(c.views, true), "Visualizações totais", "desde a criação"),
      stat(int(c.videos), "Vídeos publicados", "no canal")),
    h("div", { class: "yt-orb", "aria-hidden": "true" }, h("i"), h("i"), h("i"), h("span")));

  if (!y.analytics) {
    view.replaceChildren(hero, partialView(y));
    return;
  }

  // ---------- Indicadores ----------
  const kp = (label, n, p, value, good, hint) => ({ label, n, p, value, good, hint });
  const engCur = eng(cur), engPrev = prev ? eng(prev) : null;
  const kpis = kpiGrid([
    { ...kp("Visualizações", cur.views, prev?.views, int(cur.views), true), hero: true },
    kp("Horas assistidas", hours(cur.minutes), prev ? hours(prev.minutes) : null, int(hours(cur.minutes)), true),
    kp("Novos inscritos", net, prev ? prev.gained - prev.lost : null, `${net >= 0 ? "+" : ""}${int(net)}`, true, `${int(cur.gained)} ganhos · ${int(cur.lost)} saíram`),
    kp("Duração média assistida", cur.avgDuration, prev?.avgDuration, mmss(cur.avgDuration), true),
    kp("Retenção média", cur.avgPercent, prev?.avgPercent, `${dec(cur.avgPercent, 1)}%`, true, "quanto de cada vídeo é assistido"),
    kp("Interações", engCur, engPrev, int(engCur), true, `${int(cur.likes)} curtidas · ${int(cur.comments)} comentários · ${int(cur.shares)} compartilhamentos`),
  ]);

  // ---------- Valor entregue ----------
  const days = hours(cur.minutes) / 24;
  const value = h("section", { class: "yt-value" },
    h("div", { class: "yt-value__big" }, h("strong", {}, int(hours(cur.minutes))), h("span", {}, "horas de atenção")),
    h("p", {}, "No período, pessoas passaram ", h("b", {}, `${int(hours(cur.minutes))} horas`), " assistindo ao conteúdo do canal",
      days >= 1 ? [" — o equivalente a ", h("b", {}, `${dec(days, days < 10 ? 1 : 0)} dias seguidos`), " de tela"] : "", ". ",
      net > 0 ? ["Foram ", h("b", {}, `${int(net)} novos inscritos`), ", gente que escolheu receber os próximos vídeos. "] : "",
      engCur ? ["E ", h("b", {}, `${int(engCur)} interações`), " (curtidas, comentários e compartilhamentos)."] : ""));

  // ---------- Gráficos ----------
  const chartBox = h("div", { class: "chart" });
  const dates = y.daily.map((d) => d.date);
  const draw = () => {
    const cfgs = {
      views: { type: "bars", series: [{ label: "Visualizações", color: BLUE, values: y.daily.map((d) => d.views) }], fmt: (v) => int(v), fmtAxis: (v) => int(v, true), ariaLabel: "Visualizações por dia" },
      hours: { type: "lines", series: [{ label: "Horas assistidas", color: BLUE, values: y.daily.map((d) => hours(d.minutes)) }], fmt: (v) => dec(v, 1), fmtAxis: (v) => int(v, true), ariaLabel: "Horas assistidas por dia" },
      subs: { type: "lines", series: [{ label: "Inscritos ganhos", color: BLUE, values: y.daily.map((d) => d.gained) }, { label: "Saíram", color: ORANGE, values: y.daily.map((d) => d.lost) }], fmt: (v) => int(v), fmtAxis: (v) => int(v), ariaLabel: "Inscritos ganhos e perdidos por dia" },
    };
    renderChart(chartBox, { ...cfgs[ui.chart], labels: dates, fmtDate: fmtDay, fmtDateLong: fmtDayLong });
  };
  const seg = h("div", { class: "seg", role: "radiogroup", "aria-label": "Gráfico" },
    [["views", "Visualizações"], ["hours", "Horas assistidas"], ["subs", "Inscritos"]].map(([v, l]) => h("button", { role: "radio", "aria-checked": String(ui.chart === v), onclick: (e) => {
      ui.chart = v; e.currentTarget.parentElement.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b === e.currentTarget))); draw();
    } }, l)));

  // ---------- Vídeos de maior impacto ----------
  const SORTS = { views: ["Mais vistos", (v) => v.views], eng: ["Mais engajamento", (v) => safeDiv(eng(v), v.views)], ret: ["Maior retenção", (v) => v.avgPercent], subs: ["Mais inscritos", (v) => v.gained], watch: ["Mais tempo assistido", (v) => v.minutes] };
  const topBox = h("div", { class: "yt-top" });
  const paintTop = () => {
    const list = [...(y.top || [])].filter((v) => v.views > 0).sort((a, b) => SORTS[ui.sort][1](b) - SORTS[ui.sort][1](a));
    if (!list.length) { topBox.replaceChildren(h("p", { class: "muted" }, "Nenhum vídeo com visualizações no período.")); return; }
    const [first, ...rest] = list;
    topBox.replaceChildren(
      h("a", { class: "yt-feat", href: watch(first.id), target: "_blank", rel: "noopener" },
        thumb(first, "yt-thumb yt-thumb--big"),
        h("div", { class: "yt-feat__body" },
          h("p", { class: "yt-feat__rank" }, "#1 · ", SORTS[ui.sort][0].toLowerCase()),
          h("h3", {}, first.title),
          first.publishedAt ? h("p", { class: "muted" }, `Publicado em ${parseISO(first.publishedAt.slice(0, 10)).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`) : null,
          h("dl", { class: "yt-feat__stats" },
            dl("Visualizações", int(first.views)), dl("Horas assistidas", int(hours(first.minutes))), dl("Retenção", `${dec(first.avgPercent, 0)}%`),
            dl("Curtidas", int(first.likes)), dl("Comentários", int(first.comments)), dl("Inscritos", `+${int(first.gained)}`)),
          retention(first.avgPercent))),
      h("ol", { class: "yt-list", start: 2 }, rest.slice(0, 9).map((v, i) => h("li", {},
        h("a", { href: watch(v.id), target: "_blank", rel: "noopener" },
          h("span", { class: "yt-list__n" }, String(i + 2)), thumb(v),
          h("div", { class: "yt-list__body" },
            h("p", { class: "yt-list__title" }, v.title),
            h("p", { class: "yt-list__meta" }, h("b", {}, `${int(v.views)} views`), ` · ${int(hours(v.minutes))} h assistidas · ${pct(safeDiv(eng(v), v.views), 1)} engajamento`),
            retention(v.avgPercent)))))));
    requestAnimationFrame(() => topBox.querySelectorAll(".yt-ret i").forEach((el) => el.classList.add("is-in")));
  };
  paintTop();
  const sortSel = h("label", { class: "select" }, h("span", { class: "sr-only" }, "Ordenar vídeos"),
    h("select", { onchange: (e) => { ui.sort = e.target.value; paintTop(); } }, Object.entries(SORTS).map(([k, [l]]) => h("option", { value: k, selected: k === ui.sort }, l))));

  // ---------- De onde vêm e quem assiste ----------
  const trafficTotal = (y.traffic || []).reduce((s, t) => s + t.views, 0);
  const trafficRows = Object.values((y.traffic || []).reduce((acc, t) => { const k = TRAFFIC[t.source] || "Outros"; (acc[k] ||= { label: k, views: 0 }).views += t.views; return acc; }, {})).sort((a, b) => b.views - a.views).slice(0, 7);
  const devTotal = (y.devices || []).reduce((s, d) => s + d.views, 0);
  const ages = [...new Set((y.audience || []).map((a) => a.age))].sort();
  const g = (age, gender) => (y.audience || []).find((a) => a.age === age && a.gender === gender)?.pct || 0;
  const maxAge = Math.max(1, ...ages.map((a) => g(a, "male") + g(a, "female")));
  const men = ages.reduce((s, a) => s + g(a, "male"), 0), women = ages.reduce((s, a) => s + g(a, "female"), 0);
  const ctyTotal = (y.countries || []).reduce((s, x) => s + x.views, 0);

  view.replaceChildren(...[
    hero,
    kpis,
    value,
    card({ title: "Desempenho dia a dia", sub: "Passe o mouse sobre o gráfico para ver cada dia", tools: [seg] }, chartBox),
    card({ title: "Vídeos de maior impacto", sub: "No período selecionado · clique para assistir", tools: [sortSel] }, topBox),
    recentSection(y),
    h("div", { class: "grid-2" },
      card({ title: "Como as pessoas encontram o canal", sub: "Origem das visualizações" },
        trafficRows.length ? h("ul", { class: "yt-bars" }, trafficRows.map((t) => bar(t.label, safeDiv(t.views, trafficTotal), `${int(t.views)} views`))) : h("p", { class: "muted" }, "Sem dados de origem no período.")),
      card({ title: "Onde assistem", sub: "Dispositivos" },
        devTotal ? [h("div", { class: "yt-stack" }, (y.devices || []).map((d, i) => h("span", { style: { flex: d.views, "--i": i }, title: `${DEVICE[d.device] || d.device}: ${pct(safeDiv(d.views, devTotal), 0)}` }))),
          h("ul", { class: "yt-legend" }, (y.devices || []).map((d, i) => h("li", { style: { "--i": i } }, h("i"), DEVICE[d.device] || d.device, h("b", {}, pct(safeDiv(d.views, devTotal), 0)))))] : h("p", { class: "muted" }, "Sem dados no período."),
        ctyTotal ? [h("h3", { class: "yt-sub" }, "Países"), h("ul", { class: "yt-bars yt-bars--sm" }, (y.countries || []).slice(0, 5).map((x) => bar(country(x.country), safeDiv(x.views, ctyTotal), pct(safeDiv(x.views, ctyTotal), 1))))] : null)),
    ages.length ? card({ title: "Quem assiste", sub: `Idade e gênero de quem está logado no YouTube · ${dec(women, 0)}% mulheres · ${dec(men, 0)}% homens` },
      h("ul", { class: "yt-age" }, ages.map((a) => h("li", {},
        h("span", { class: "yt-age__l" }, ageLabel(a)),
        h("div", { class: "yt-age__bar" },
          h("span", { class: "is-f", style: { width: `${(g(a, "female") / maxAge) * 100}%` }, title: `Mulheres ${ageLabel(a)}: ${dec(g(a, "female"), 1)}%` }),
          h("span", { class: "is-m", style: { width: `${(g(a, "male") / maxAge) * 100}%` }, title: `Homens ${ageLabel(a)}: ${dec(g(a, "male"), 1)}%` })),
        h("b", {}, `${dec(g(a, "female") + g(a, "male"), 1)}%`)))),
      h("ul", { class: "yt-legend" }, h("li", { style: { "--i": 0 } }, h("i"), "Mulheres"), h("li", { style: { "--i": 3 } }, h("i"), "Homens"))) : null,
    h("p", { class: "fineprint" }, "Dados do YouTube Analytics. Os números do dia atual e de ontem ainda podem ser atualizados pelo YouTube. Idade e gênero consideram só quem assiste logado."),
  ].filter(Boolean));

  draw();
  observe(chartBox);
  requestAnimationFrame(() => view.querySelectorAll(".yt-bars span, .yt-age__bar span, .yt-ret i").forEach((el) => el.classList.add("is-in")));
}

/* ---------- Vídeos publicados (como a aba Social media, para o YouTube) ---------- */
const ago = (iso) => {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 864e5);
  return d <= 0 ? "hoje" : d === 1 ? "ontem" : d < 30 ? `há ${d} dias` : parseISO(iso.slice(0, 10)).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};
function recentSection(y) {
  const vids = y.recent || [];
  if (!vids.length) return null;
  const hasShorts = vids.some((v) => v.short) && vids.some((v) => !v.short);
  const grid = h("div", { class: "ytv-grid" });
  const er = (v) => safeDiv(v.totalLikes + v.totalComments, v.totalViews);
  const paint = () => {
    let list = ui.rfmt === "all" ? vids : vids.filter((v) => (ui.rfmt === "short" ? v.short : !v.short));
    const by = { recent: (a, b) => b.publishedAt.localeCompare(a.publishedAt), views: (a, b) => b.totalViews - a.totalViews, eng: (a, b) => er(b) - er(a), period: (a, b) => (b.period?.views || 0) - (a.period?.views || 0) };
    list = [...list].sort(by[ui.rsort]);
    grid.replaceChildren(...list.map((v) => {
      const p = v.period;
      const fresh = Date.now() - Date.parse(v.publishedAt) < 7 * 864e5;
      return h("a", { class: "ytv", href: watch(v.id), target: "_blank", rel: "noopener", "aria-label": `Assistir: ${v.title}` },
        h("div", { class: "ytv__media" }, thumb(v, "yt-thumb ytv__thumb"), fresh ? h("span", { class: "ytv__new" }, "Novo") : null),
        h("div", { class: "ytv__body" },
          h("p", { class: "ytv__date" }, `${v.short ? "Short" : "Vídeo"} · ${ago(v.publishedAt)}`),
          h("p", { class: "ytv__title" }, v.title),
          h("div", { class: "ytv__stats" },
            h("span", { title: "visualizações desde a publicação" }, icon("eye"), h("b", {}, int(v.totalViews, true))),
            h("span", { title: "curtidas" }, icon("heart"), h("b", {}, int(v.totalLikes, true))),
            h("span", { title: "comentários" }, "💬", h("b", {}, int(v.totalComments, true))),
            h("span", { class: "ytv__er", title: "engajamento (curtidas + comentários ÷ visualizações)" }, pct(er(v), 1))),
          p && p.views ? h("p", { class: "ytv__period" }, h("b", {}, `${int(p.views)} views no período`), p.avgPercent ? ` · ${dec(p.avgPercent, 0)}% assistido` : "", p.gained ? ` · +${int(p.gained)} inscritos` : "") : null));
    }));
  };
  paint();
  const select = (label, value, opts, set) => h("label", { class: "select" }, h("span", { class: "sr-only" }, label),
    h("select", { onchange: (e) => { set(e.target.value); paint(); } }, opts.map(([v, l]) => h("option", { value: v, selected: v === value }, l))));
  const week = vids.filter((v) => Date.now() - Date.parse(v.publishedAt) < 30 * 864e5).length;
  return card({
    title: "Vídeos publicados",
    sub: `Os ${vids.length} mais recentes do canal · ${week} nos últimos 30 dias · números desde a publicação`,
    tools: [hasShorts ? select("Formato", ui.rfmt, [["all", "Vídeos e Shorts"], ["video", "Só vídeos"], ["short", "Só Shorts"]], (v) => (ui.rfmt = v)) : null,
      select("Ordenar", ui.rsort, [["recent", "Mais recentes"], ["views", "Mais vistos"], ["eng", "Maior engajamento"], ...(vids.some((v) => v.period) ? [["period", "Mais vistos no período"]] : [])], (v) => (ui.rsort = v))].filter(Boolean),
  }, grid);
}

const stat = (value, label, sub) => h("div", { class: "kpi yt-stat" }, h("p", { class: "kpi__label" }, label), h("p", { class: "kpi__value" }, value), sub ? h("small", {}, sub) : null);
const dl = (k, v) => h("div", {}, h("dt", {}, k), h("dd", {}, v));
const retention = (p) => h("div", { class: "yt-ret", title: `Em média, ${dec(p, 0)}% do vídeo é assistido` }, h("i", { style: { "--w": `${Math.min(100, p || 0)}%` } }), h("span", {}, `${dec(p || 0, 0)}% assistido`));
const bar = (label, share, right) => h("li", {}, h("div", { class: "yt-bars__row" }, h("span", {}, label), h("b", {}, right)), h("div", { class: "yt-bars__track" }, h("span", { style: { "--w": `${Math.max(1.5, share * 100)}%` } })));

// Sem a permissão de estatísticas: vídeos recentes com os números públicos
function partialView(y) {
  return h("div", { class: "stack" },
    h("p", { class: "source-alert" }, "Mostrando os números públicos dos vídeos. Para ver tempo assistido, inscritos ganhos e público, a agência precisa reconectar o YouTube com a permissão de estatísticas."),
    recentSection(y) || card({ title: "Vídeos publicados" }, h("p", { class: "muted" }, "Nenhum vídeo encontrado.")));
}
