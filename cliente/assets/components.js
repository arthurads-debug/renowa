// Peças reutilizadas pelas telas.
import { h, icon, dec, fmtDay, parseISO } from "./util.js";

export function card({ title, sub, tools, cls = "" }, ...body) {
  return h("section", { class: `card ${cls}` },
    (title || tools) ? h("header", { class: "card__head" },
      h("div", {}, title ? h("h2", {}, title) : null, sub ? h("p", { class: "card__sub" }, sub) : null),
      tools ? h("div", { class: "card__tools" }, tools) : null) : null,
    ...body);
}

export function delta(cur, prev, goodWhenUp) {
  if (!(prev > 0) || cur == null) return h("span", { class: "delta delta--flat" }, "sem comparação");
  const change = (cur - prev) / prev;
  const up = change > 0.0005, down = change < -0.0005;
  const tone = goodWhenUp == null || (!up && !down) ? "flat" : up === goodWhenUp ? "good" : "bad";
  const path = up ? '<path d="M6 15l6-6 6 6"/>' : down ? '<path d="M6 9l6 6 6-6"/>' : '<path d="M5 12h14"/>';
  const word = tone === "good" ? ", melhor" : tone === "bad" ? ", pior" : "";
  return h("span", { class: `delta delta--${tone}`, "aria-label": `${up ? "subiu" : down ? "caiu" : "estável"} ${dec(Math.abs(change) * 100, 1)}%${word}` },
    h("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", html: path }),
    `${up ? "+" : ""}${dec(change * 100, 1)}%`);
}

export function kpiGrid(items, { partial } = {}) {
  return h("section", { class: "kpis", "aria-label": "Indicadores principais" },
    items.map((k) => h("article", { class: `kpi${k.hero ? " kpi--hero" : ""}` },
      h("p", { class: "kpi__label" }, k.label),
      h("p", { class: "kpi__value", style: `--len:${Math.max(6, String(k.value).length)}` }, k.value),
      partial ? h("span", { class: "delta delta--flat" }, "dia em andamento") : delta(k.n, k.p, k.good),
      h("p", { class: "kpi__cmp" }, k.hint ? k.hint : k.prevText ? `Período anterior: ${k.prevText}` : " "))));
}

export const STATUS = {
  planejado: { label: "Planejado", cls: "st--plan" },
  producao: { label: "Em produção", cls: "st--prod" },
  aprovacao: { label: "Aguardando sua aprovação", short: "Aprovar", cls: "st--wait" },
  aprovado: { label: "Aprovado", cls: "st--ok" },
  publicado: { label: "Publicado", cls: "st--done" },
};
export const statusChip = (s, short) => h("span", { class: `chip ${STATUS[s]?.cls || ""}` }, short ? STATUS[s]?.short || STATUS[s]?.label : STATUS[s]?.label || s);

const FORMAT_ICON = { Short: "▶", Reels: "▶", "Vídeo": "▶", Carrossel: "❏", Stories: "◔", Imagem: "▣", Post: "▣" };

// Miniatura: imagem real do post ou uma arte gerada (modo demo / sem imagem)
export function postThumb(p) {
  const fmt = h("span", { class: "thumb__fmt" }, `${FORMAT_ICON[p.format] || "▣"} ${p.format}`);
  if (p.thumbnail) {
    // se a imagem não carregar (link expirado, rede), entra a capa de reserva com o título
    const box = h("div", { class: "thumb" }, h("img", { src: p.thumbnail, alt: "", loading: "lazy", decoding: "async", referrerpolicy: "no-referrer",
      onerror: () => { box.className = `thumb thumb--art thumb--${(p.theme ?? 0) % 4}`; box.replaceChildren(h("span", { class: "thumb__title" }, p.caption || p.title || ""), fmt); } }), fmt);
    return box;
  }
  return h("div", { class: `thumb thumb--art thumb--${(p.theme ?? 0) % 4}` }, h("span", { class: "thumb__title" }, p.caption || p.title || ""), fmt);
}

export const emptyState = (title, text, action) =>
  h("div", { class: "empty-state" }, icon("info", "ico ico--lg"), h("strong", {}, title), text ? h("p", {}, text) : null, action || null);

export const loadingState = () => h("div", { class: "loading-state" }, h("span", { class: "spinner" }), "Carregando…");

export function platformSwitch(state, setPlatform) {
  const c = state.client;
  const opts = [["all", "Todas"], ["google", "Google Ads"], ["meta", "Meta Ads"]];
  return h("div", { class: "seg", role: "radiogroup", "aria-label": "Plataforma" },
    opts.map(([v, label]) => h("button", {
      role: "radio", "aria-checked": String(state.platform === v), disabled: v !== "all" && !c.platforms[v],
      onclick: () => setPlatform(v),
    }, v !== "all" ? h("i", { class: `key key--${v}` }) : null, label)));
}

export const weekdayShort = (s) => parseISO(s).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
export const dayLabel = (s) => `${weekdayShort(s)} ${fmtDay(s)}`;

// Ícone de rede (G, M, f, IG) — a cor identifica a plataforma, o texto garante leitura sem cor
const NET_TXT = { google: "G", meta: "M", facebook: "f", instagram: "IG", youtube: "▶" };
export const netBadge = (platform) => h("span", { class: `net net--${platform}`, "aria-hidden": "true" }, NET_TXT[platform] || "");

// Faixa "Contas conectadas": deixa claro de onde vem cada número do relatório
export function accountsStrip(client) {
  if (!client.accounts?.length) return null;
  return h("div", { class: "accounts", "aria-label": "Contas conectadas a este relatório" },
    h("span", { class: "accounts__label" }, "Contas neste relatório:"),
    client.accounts.map((a) => h("span", { class: `acc${a.hidden ? " acc--hidden" : ""}`, title: a.hidden ? "Oculta para o cliente: só a agência vê" : null }, netBadge(a.platform), h("b", {}, a.label), a.name ? h("span", {}, a.name) : null, a.hidden ? h("em", {}, "só agência") : null)));
}
