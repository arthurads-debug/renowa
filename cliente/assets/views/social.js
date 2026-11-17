// SOCIAL MEDIA — Instagram e Página do Facebook do cliente, na mesma página.
import { h, icon, int, pct, safeDiv, dec, parseISO } from "../util.js";
import { card, loadingState, emptyState, postThumb, dayLabel, statusChip, netBadge } from "../components.js";

const ui = { sort: "recent", format: "all", network: "all" };
const NET_NAME = { instagram: "Instagram", facebook: "Facebook" };

export function renderSocial(view, state) {
  const s = state.social;
  if (!s) { view.replaceChildren(loadingState()); return; }
  const nets = ["instagram", "facebook"].filter((n) => s[n]?.connected);

  // Nenhuma rede conectada: mostra o que o calendário registra como publicado
  if (!nets.length) {
    const done = (state.content?.calendar || []).filter((p) => p.status === "publicado" && p.date >= state.from && p.date <= state.to);
    view.replaceChildren(...[
      card({ title: `${done.length} publicações no período`, sub: "Registradas no calendário editorial" },
        done.length ? h("ul", { class: "agenda" }, done.reverse().map((p) => h("li", { class: "agenda__item" },
          h("span", { class: "agenda__date" }, dayLabel(p.date)), h("span", { class: "agenda__title" }, p.title, h("small", {}, `${p.format} · ${p.network}`)), statusChip(p.status))))
          : h("p", { class: "muted" }, "Nenhuma publicação registrada no período.")),
      emptyState("Conecte o Instagram e o Facebook para ver alcance e engajamento", "A agência vincula as contas no painel; cada post passa a mostrar alcance, curtidas, comentários e compartilhamentos."),
    ]);
    return;
  }
  if (ui.network !== "all" && !nets.includes(ui.network)) ui.network = "all";

  // ---------- Uma ficha por rede ----------
  const weeks = Math.max(1, (parseISO(state.to) - parseISO(state.from)) / (7 * 864e5));
  const netCards = h("div", { class: "split-net" }, nets.map((n) => {
    const d = s[n];
    const posts = d.posts || [];
    const reach = posts.reduce((a, p) => a + p.reach, 0);
    const inter = posts.reduce((a, p) => a + p.interactions, 0);
    return h("article", { class: "net-card" },
      h("div", { class: "net-card__head" }, netBadge(n), h("div", {}, NET_NAME[n], h("small", {}, n === "instagram" ? `@${d.username || ""}` : d.username || ""))),
      d.error ? h("p", { class: "source-alert" }, d.error) : null,
      h("dl", {},
        cell("Seguidores", int(d.followers)),
        cell("Posts no período", int(posts.length)),
        cell("Alcance médio por post", posts.length ? int(reach / posts.length) : "—"),
        cell("Engajamento", reach ? pct(safeDiv(inter, reach), 1) : "—")),
      h("p", { class: "muted" }, `${dec(posts.length / weeks, 1)} posts por semana · ${int(inter)} interações no período`));
  }));

  const all = nets.flatMap((n) => (s[n].posts || []).map((p) => ({ network: n, ...p })));
  const posts = ui.network === "all" ? all : all.filter((p) => p.network === ui.network);

  const netSwitch = nets.length > 1 ? h("div", { class: "seg", role: "radiogroup", "aria-label": "Rede social" },
    [["all", "Todas as redes"], ...nets.map((n) => [n, NET_NAME[n]])].map(([v, label]) => h("button", {
      role: "radio", "aria-checked": String(ui.network === v), onclick: () => { ui.network = v; ui.format = "all"; renderSocial(view, state); },
    }, v !== "all" ? netBadge(v) : null, label))) : null;

  if (!posts.length) {
    view.replaceChildren(...[netCards, netSwitch ? h("div", { class: "toolbar" }, netSwitch) : null, emptyState("Nenhum post no período", "Escolha um período maior no seletor acima.")].filter(Boolean));
    return;
  }

  // ---------- Formatos e melhores posts ----------
  const formats = {};
  posts.forEach((p) => { const f = (formats[p.format] ||= { n: 0, reach: 0, inter: 0 }); f.n++; f.reach += p.reach; f.inter += p.interactions; });
  const fmtRows = Object.entries(formats).sort((a, b) => b[1].reach / b[1].n - a[1].reach / a[1].n);
  const maxAvg = Math.max(1, ...fmtRows.map(([, f]) => f.reach / f.n));
  const top = [...posts].sort((a, b) => b.reach - a.reach || b.interactions - a.interactions).slice(0, 3);
  const savesShares = posts.reduce((a, p) => a + p.saves + p.shares, 0);
  if (ui.format !== "all" && !formats[ui.format]) ui.format = "all";

  const grid = h("div", { class: "posts" });
  const paint = () => {
    let list = ui.format === "all" ? posts : posts.filter((p) => p.format === ui.format);
    list = [...list].sort(ui.sort === "recent" ? (a, b) => b.date.localeCompare(a.date) : ui.sort === "reach" ? (a, b) => b.reach - a.reach : (a, b) => safeDiv(b.interactions, b.reach) - safeDiv(a.interactions, a.reach));
    grid.replaceChildren(...list.map(postCard));
  };
  paint();
  const select = (label, value, opts, onchange) => h("label", { class: "select" }, h("span", { class: "sr-only" }, label),
    h("select", { onchange: (e) => { onchange(e.target.value); paint(); } }, opts.map(([v, l]) => h("option", { value: v, selected: v === value }, l))));

  view.replaceChildren(...[
    netCards,
    netSwitch ? h("div", { class: "toolbar" }, netSwitch) : null,
    h("div", { class: "grid-2" },
      card({ title: "Melhores posts do período", sub: "Pelo número de contas alcançadas" },
        h("ol", { class: "top-posts" }, top.map((p, i) => h("li", {},
          h("span", { class: "top-posts__n" }, String(i + 1)), postThumb(p),
          h("div", {}, h("p", { class: "top-posts__title" }, p.caption || "(sem legenda)"),
            h("p", { class: "muted" }, `${NET_NAME[p.network]} · ${dayLabel(p.date.slice(0, 10))} · ${int(p.reach)} alcançadas · ${int(p.interactions)} interações`)))))),
      card({ title: "O que funciona melhor", sub: "Alcance médio por formato" },
        h("ul", { class: "formats" }, fmtRows.map(([name, f]) => h("li", {},
          h("div", { class: "formats__row" }, h("strong", {}, name), h("span", { class: "muted" }, `${f.n} post${f.n > 1 ? "s" : ""} · ${pct(safeDiv(f.inter, f.reach), 1)} engajamento`)),
          h("div", { class: "formats__bar" }, h("span", { style: { width: `${safeDiv(f.reach / f.n, maxAvg) * 100}%` } })),
          h("p", { class: "formats__val" }, `${int(f.reach / f.n)} contas por post`)))),
        h("p", { class: "fineprint" }, `${int(savesShares)} salvamentos e compartilhamentos no período — sinal de conteúdo que as pessoas querem guardar ou mostrar a alguém.`))),
    card({
      title: ui.network === "all" ? "Todos os posts" : `Posts no ${NET_NAME[ui.network]}`,
      tools: [select("Formato", ui.format, [["all", "Todos os formatos"], ...Object.keys(formats).map((f) => [f, f])], (v) => (ui.format = v)),
        select("Ordenar", ui.sort, [["recent", "Mais recentes"], ["reach", "Maior alcance"], ["eng", "Maior engajamento"]], (v) => (ui.sort = v))],
    }, grid),
    h("p", { class: "fineprint" }, "Conteúdo orgânico (sem impulsionamento). O alcance conta contas diferentes que viram cada post; somar posts conta a mesma pessoa mais de uma vez. Instagram e Facebook medem alcance de formas parecidas, mas não idênticas."),
  ].filter(Boolean));
}

const cell = (k, v) => h("div", {}, h("dt", {}, k), h("dd", {}, v));

function postCard(p) {
  const metric = (ico, v, label) => h("span", { title: label }, icon(ico), h("b", {}, int(v, true)), h("span", { class: "sr-only" }, label));
  const thumb = postThumb(p);
  thumb.append(h("span", { class: "post__net" }, netBadge(p.network)));
  const inner = [thumb,
    h("div", { class: "post__body" },
      h("p", { class: "post__date muted" }, `${NET_NAME[p.network]} · ${dayLabel(p.date.slice(0, 10))}`),
      h("p", { class: "post__caption" }, p.caption || "(sem legenda)"),
      h("div", { class: "post__stats" },
        metric("eye", p.reach, "contas alcançadas"),
        metric("heart", p.likes, p.network === "facebook" ? "reações" : "curtidas"),
        h("span", { title: "comentários" }, "💬", h("b", {}, int(p.comments, true))),
        p.network === "facebook"
          ? h("span", { title: "compartilhamentos" }, "↗", h("b", {}, int(p.shares, true)))
          : h("span", { title: "salvamentos" }, "🔖", h("b", {}, int(p.saves, true)))))];
  return p.permalink
    ? h("a", { class: "post", href: p.permalink, target: "_blank", rel: "noopener", "aria-label": `Abrir post: ${(p.caption || "").slice(0, 60)}` }, ...inner)
    : h("article", { class: "post" }, ...inner);
}
