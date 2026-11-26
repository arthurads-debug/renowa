// Capítulos 6 e 7 — protótipo navegável do novo site (desktop e celular, com área administrativa)
// e a demonstração da Assistente PrioSafra com o encaminhamento ao WhatsApp.
import { h, icon, logoPrio, markPrio, phone, statusBar, foto, reveal, unreveal, demoTag, reduced, sleep } from "../lib.js";
import { PRODUTOS, MARCAS, REGIAO, CONTATO, EMPRESA, FOTOS } from "../config.js";
import { createAssistant, waMessage, waLink } from "../assistant.js";

/* ------------------------- Site da PrioSafra ------------------------- */
const PAGES = [["inicio", "Início"], ["milho", "Milho"], ["sorgo", "Sorgo"], ["pastagens", "Pastagens"], ["sobre", "A PrioSafra"], ["parceiros", "Parceiros"], ["contato", "Contato"]];
const pend = (t = "Conteúdo a aprovar com a PrioSafra") => h("span", { class: "s-pend" }, icon("info", "ic ic--xs"), t);

function siteApp() {
  const view = h("div", { class: "s-view" });
  const url = h("span", { class: "bw__url" });
  const navBtns = [];
  let menuOpen = false;
  const nav = h("nav", { class: "s-nav" }, PAGES.map(([id, t]) => { const b = h("button", { type: "button", onclick: () => { go(id); toggleMenu(false); } }, t); b.dataset.p = id; navBtns.push(b); return b; }));
  const burger = h("button", { class: "s-burger", type: "button", "aria-label": "Menu", onclick: () => toggleMenu() }, icon("menu"));
  const toggleMenu = (on = !menuOpen) => { menuOpen = on; root.classList.toggle("is-menu", on); };
  const header = h("header", { class: "s-head" }, h("button", { class: "s-logo", type: "button", onclick: () => go("inicio"), "aria-label": "Início" }, logoPrio({ cls: "plogo s-plogo" })), nav, h("button", { class: "s-btn s-btn--sm s-head__cta", type: "button", onclick: () => go("contato") }, "Solicitar atendimento"), burger);
  const root = h("div", { class: "s-root" }, header, view);

  const cta = (t = "Solicitar atendimento") => h("button", { class: "s-btn", type: "button", onclick: () => go("contato") }, t, icon("arrowR", "ic ic--xs"));
  const wa = () => h("a", { class: "s-btn s-btn--wa", href: waLink({ obj: "Atendimento pelo site" }), target: "_blank", rel: "noopener" }, icon("wa", "ic ic--xs"), "WhatsApp");
  const footer = () => h("footer", { class: "s-foot" },
    h("div", {}, logoPrio({ tone: "light", cls: "plogo s-plogo" }), h("p", {}, "Sementes de milho, sorgo e pastagens. Paragominas e região.")),
    h("div", {}, h("b", {}, "Navegação"), PAGES.slice(1).map(([id, t]) => h("button", { type: "button", onclick: () => go(id) }, t))),
    h("div", {}, h("b", {}, "Atendimento"), h("p", {}, CONTATO.whatsappLabel), h("p", {}, EMPRESA.cidade), h("p", {}, "@", EMPRESA.instagram)),
    h("p", { class: "s-foot__l" }, "© PrioSafra Agronegócio · Política de privacidade · Site desenvolvido pela Renowa"));
  const catCard = (id) => { const p = PRODUTOS[id]; return h("button", { class: "s-cat", type: "button", onclick: () => go(id) }, h("div", { class: "s-cat__ph", style: { backgroundImage: `url(${p.foto.replace("w=2000", "w=800")})` } }), h("div", { class: "s-cat__b" }, h("h4", {}, p.titulo.replace("Sementes de ", "").replace(/^./, (c) => c.toUpperCase())), h("p", {}, p.texto), h("span", {}, "Ver catálogo", icon("arrowR", "ic ic--xs")))); };

  const pages = {
    inicio: () => [
      h("section", { class: "s-hero" }, h("div", { class: "s-hero__ph", style: { backgroundImage: `url(${FOTOS.milhoCeu.replace("w=2000", "w=1600")})` } }),
        h("div", { class: "s-hero__c" }, h("p", { class: "s-eyebrow" }, "Milho · Sorgo · Pastagens"), h("h1", {}, "Grandes safras começam com grandes escolhas."), h("p", {}, "Sementes de milho, sorgo e pastagens, com atendimento próximo e soluções para o produtor rural."), h("div", { class: "s-row" }, cta(), wa()))),
      h("section", { class: "s-brands" }, h("p", { class: "s-eyebrow" }, "Marcas representadas"), h("div", {}, MARCAS.map((m) => h("span", {}, m.nome)))),
      h("section", { class: "s-sec" }, h("h2", {}, "Nossas sementes"), h("div", { class: "s-cats" }, ["milho", "sorgo", "pastagens"].map(catCard))),
      h("section", { class: "s-sec s-sec--green" }, h("h2", {}, "Por que a PrioSafra"), h("div", { class: "s-dif" }, [["handshake", "Atendimento próximo", "Equipe que conhece a região e acompanha o produtor."], ["layers", "Marcas representadas", "Priorizi, Gransafra e Semembrás em um só lugar."], ["bulb", "Orientação na escolha", "Conversa com quem entende antes de fechar o pedido."], ["pin", "Presença regional", "Paragominas, Ulianópolis, Dom Eliseu, Ipixuna e Tomé-Açu."]].map(([i, t, d]) => h("div", {}, icon(i), h("b", {}, t), h("p", {}, d)))), pend("Diferenciais a validar com a PrioSafra")),
      h("section", { class: "s-sec s-region" }, h("div", {}, h("h2", {}, "Região de atuação"), h("p", {}, "Atendimento para produtores de Paragominas e municípios vizinhos."), h("ul", {}, REGIAO.map((r) => h("li", {}, icon("pin", "ic ic--xs"), r.nome)))), h("div", { class: "s-region__ph", style: { backgroundImage: `url(${FOTOS.aereaLinhas.replace("w=2000", "w=1000")})` } })),
      h("section", { class: "s-band" }, h("h3", {}, "Planejando a próxima safra?"), h("p", {}, "Fale com a equipe e receba seu orçamento."), h("div", { class: "s-row" }, cta("Solicitar orçamento"), wa())),
      footer()],
    ...Object.fromEntries(["milho", "sorgo", "pastagens"].map((id) => [id, () => {
      const p = PRODUTOS[id];
      return [
        h("section", { class: "s-pagehero", style: { backgroundImage: `linear-gradient(90deg, rgba(5,42,29,.92), rgba(5,42,29,.4)), url(${p.capa.replace("w=2000", "w=1600")})` } }, h("p", { class: "s-eyebrow" }, "Catálogo"), h("h1", {}, p.titulo), h("p", {}, p.texto)),
        h("section", { class: "s-sec" },
          h("div", { class: "s-filter" }, h("span", {}, "Marcas:"), p.marcas.map((m, i) => h("button", { type: "button", class: i === 0 ? "is-on" : "", onclick: (e) => { e.currentTarget.parentElement.querySelectorAll("button").forEach((b) => b.classList.toggle("is-on", b === e.currentTarget)); } }, m))),
          h("div", { class: "s-prods" }, p.marcas.flatMap((m) => [1, 2].map((n) => h("article", { class: "s-prod" }, h("div", { class: "s-prod__ph", style: { backgroundImage: `url(${(n === 1 ? p.foto : p.capa).replace("w=2000", "w=700")})` } }, h("span", {}, m)), h("div", { class: "s-prod__b" }, h("h4", {}, `${p.titulo.replace("Sementes de ", "").replace(/^./, (c) => c.toUpperCase())} · ${m}`), h("p", { class: "s-prod__ph-t" }, "Nome, foto e informações do produto entram após validação"), h("button", { class: "s-btn s-btn--sm", type: "button", onclick: () => go("contato") }, "Consultar"))))),
          ),
          pend("Especificações, preços e disponibilidade só após confirmação da PrioSafra")),
        footer()];
    }])),
    sobre: () => [
      h("section", { class: "s-pagehero", style: { backgroundImage: `linear-gradient(90deg, rgba(5,42,29,.92), rgba(5,42,29,.4)), url(${FOTOS.produtor.replace("w=2000", "w=1600")})` } }, h("p", { class: "s-eyebrow" }, "Institucional"), h("h1", {}, "A PrioSafra"), h("p", {}, "Comercialização e representação de sementes em Paragominas e região.")),
      h("section", { class: "s-sec s-about" }, [["Nossa história", "Texto a ser escrito com a PrioSafra a partir da entrevista de diagnóstico."], ["Missão", "A definir com a PrioSafra."], ["Posicionamento", "Sementes para quem busca produtividade, com atendimento próximo do produtor rural."], ["Região de atuação", REGIAO.map((r) => r.nome).join(" · ")]].map(([t, d]) => h("div", { class: "s-about__it" }, h("h3", {}, t), h("p", {}, d))), pend()),
      footer()],
    parceiros: () => [
      h("section", { class: "s-pagehero", style: { backgroundImage: `linear-gradient(90deg, rgba(5,42,29,.92), rgba(5,42,29,.4)), url(${FOTOS.aereaFileiras.replace("w=2000", "w=1600")})` } }, h("p", { class: "s-eyebrow" }, "Parceiros"), h("h1", {}, "Marcas representadas"), h("p", {}, "As marcas que a PrioSafra leva ao produtor da região.")),
      h("section", { class: "s-sec" }, h("div", { class: "s-partners" }, MARCAS.map((m) => h("div", {}, h("h3", {}, m.nome), h("p", {}, m.linha), h("button", { class: "s-link", type: "button", onclick: () => go(/capim/i.test(m.linha) ? "pastagens" : "milho") }, "Ver sementes", icon("arrowR", "ic ic--xs"))))), pend("Logotipos e vínculo comercial a validar com cada marca")),
      footer()],
    contato: () => {
      const ok = h("div", { class: "s-ok", hidden: true }, icon("check"), h("div", {}, h("b", {}, "Recebemos sua mensagem."), h("p", {}, "Na demonstração nada é enviado. No site real, o pedido chega ao comercial e aparece no painel da Renowa.")));
      const f = h("form", { class: "s-form", onsubmit: (e) => { e.preventDefault(); if (!f.reportValidity()) return; f.hidden = true; ok.hidden = false; } },
        h("label", {}, "Nome", h("input", { required: true, autocomplete: "off", placeholder: "Seu nome" })),
        h("label", {}, "Município", h("select", { required: true }, h("option", { value: "" }, "Selecione"), REGIAO.map((r) => h("option", {}, r.nome)), h("option", {}, "Outro"))),
        h("label", {}, "Interesse", h("select", {}, ["Sementes de milho", "Sementes de sorgo", "Sementes de pastagens", "Outro assunto"].map((o) => h("option", {}, o)))),
        h("label", { class: "s-form__w" }, "Mensagem", h("textarea", { rows: 3, placeholder: "Conte o que você precisa" })),
        h("label", { class: "s-check s-form__w" }, h("input", { type: "checkbox", required: true }), h("span", {}, "Concordo em enviar meus dados à PrioSafra para receber o atendimento. ", h("u", {}, "Aviso de privacidade"))),
        h("button", { class: "s-btn s-form__w", type: "submit" }, "Solicitar orçamento"));
      return [
        h("section", { class: "s-pagehero s-pagehero--sm", style: { backgroundImage: `linear-gradient(90deg, rgba(5,42,29,.95), rgba(5,42,29,.6)), url(${FOTOS.milhoSol.replace("w=2000", "w=1600")})` } }, h("p", { class: "s-eyebrow" }, "Contato"), h("h1", {}, "Fale com a PrioSafra"), h("p", {}, "Orçamentos, dúvidas e atendimento comercial.")),
        h("section", { class: "s-sec s-contact" }, h("div", { class: "s-contact__f" }, f, ok),
          h("div", { class: "s-contact__i" }, wa(), [["phone", "WhatsApp comercial", CONTATO.whatsappLabel], ["clock", "Horários", CONTATO.horario], ["pin", "Localização", CONTATO.endereco], ["insta", "Redes sociais", `@${EMPRESA.instagram}`]].map(([i, t, d]) => h("div", {}, icon(i), h("span", {}, h("b", {}, t), d))), pend("Número, horário e endereço a confirmar antes da publicação"))),
        footer()];
    },
  };

  function go(id) {
    view.replaceChildren(...pages[id]());
    view.scrollTop = 0;
    url.textContent = `priosafra.com.br${id === "inicio" ? "" : "/" + id}`;
    navBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.p === id));
    if (window.gsap && !reduced()) gsap.fromTo(view.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" });
  }
  go("inicio");

  // Assistente flutuante do site
  const asst = createAssistant({ compact: true, onForward: (d, o) => { if (!o?.auto) window.open(waLink(d), "_blank", "noopener"); } });
  const bubbleBtn = h("button", { class: "s-asbtn", type: "button", "aria-label": "Abrir Assistente PrioSafra", onclick: () => { root.classList.toggle("is-chat"); if (root.classList.contains("is-chat") && !asst.el.querySelector(".as__msg")) asst.reset(); } }, icon("msg"), h("span", {}, "Assistente PrioSafra"));
  root.append(h("div", { class: "s-aswrap" }, asst.el), bubbleBtn);
  return { root, url, go };
}

/* ------------------------- Área administrativa (prévia) ------------------------- */
function adminPreview() {
  const rows = [["Sementes de milho · Priorizi", "Publicado"], ["Sementes de milho · Gransafra", "Rascunho"], ["Sementes de sorgo · Priorizi", "Publicado"], ["Sementes de pastagens · Semembrás", "Publicado"]];
  return h("div", { class: "adm" },
    h("aside", { class: "adm__side" }, logoPrio({ tone: "light", cls: "plogo adm__logo" }), ["Produtos", "Fotografias", "Informações comerciais", "Páginas", "Acessos", "Contatos gerados"].map((t, i) => h("span", { class: i === 0 ? "is-on" : "" }, t))),
    h("div", { class: "adm__main" },
      h("div", { class: "adm__top" }, h("h4", {}, "Produtos"), h("span", { class: "s-btn s-btn--sm" }, icon("plus", "ic ic--xs"), "Novo produto")),
      h("div", { class: "adm__kpis" }, [["eye", "Acessos", "—"], ["msg", "Contatos", "—"], ["wa", "Cliques no WhatsApp", "—"]].map(([i, t, v]) => h("div", {}, icon(i), h("span", {}, t), h("b", {}, v)))),
      h("table", { class: "adm__t" }, h("thead", {}, h("tr", {}, h("th", {}, "Produto"), h("th", {}, "Situação"), h("th", {}, ""))), h("tbody", {}, rows.map(([n, s]) => h("tr", {}, h("td", {}, n), h("td", {}, h("span", { class: `adm__st ${s === "Publicado" ? "is-ok" : ""}` }, s)), h("td", {}, h("span", { class: "adm__ed" }, icon("pen", "ic ic--xs"), "Editar")))))),
      h("div", { class: "adm__up" }, icon("upload"), h("span", {}, "Arraste fotos dos produtos aqui")),
      h("p", { class: "adm__note" }, "Prévia da área administrativa · números aparecem após a publicação do site")));
}

export const site = {
  id: "site", title: "O futuro site", theme: "light", duration: 26,
  build() {
    const app = siteApp();
    this._app = app;
    const frame = h("div", { class: "bw", "data-noswipe": "" },
      h("div", { class: "bw__bar" }, h("span", { class: "bw__dots" }, h("i"), h("i"), h("i")), h("span", { class: "bw__addr" }, icon("lock", "ic ic--xs"), app.url), h("span", { class: "bw__r" }, icon("refresh", "ic ic--xs"))),
      h("div", { class: "bw__body" }, app.root));
    const adm = adminPreview();
    const stage = h("div", { class: "site__stage", "data-mode": "desk" }, frame, h("div", { class: "site__adm" }, adm));
    const seg = h("div", { class: "seg" }, [["desk", "monitor", "Desktop"], ["mob", "smartphone", "Celular"], ["adm", "lock", "Área administrativa"]].map(([v, i, t]) => h("button", { type: "button", "aria-pressed": String(v === "desk"), onclick: (e) => { stage.dataset.mode = v; seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget))); if (window.gsap && !reduced()) gsap.fromTo(stage, { opacity: 0.4, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }); } }, icon(i, "ic ic--xs"), " ", t)));
    return h("div", { class: "ch__in site" },
      h("div", { class: "site__head" },
        h("div", {},
          h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "06"), "O futuro site da PrioSafra"),
          h("h2", { class: "display display--sm", "data-in": "" }, "Um site de verdade, ", h("em", {}, "não uma imagem de computador."), " Navegue.")),
        h("div", { class: "site__tools", "data-in": "" }, seg, demoTag("Protótipo navegável"))),
      h("div", { class: "site__body", "data-in": "" }, stage,
        h("ul", { class: "site__feat" }, [["search", "SEO e carregamento rápido"], ["smartphone", "Responsivo e acessível"], ["lock", "Proteção de dados e consentimento"], ["chart", "Pronto para monitoramento (GA4 e eventos)"], ["pen", "Produtos e fotos editáveis"], ["bot", "Assistente virtual integrada"]].map(([i, t]) => h("li", {}, icon(i), t)))));
  },
  enter(el) { reveal(el); },
  leave(el) { unreveal(el); },
};

/* ------------------------- Atendente virtual ------------------------- */
export const atendente = {
  id: "atendente", title: "Atendente virtual 24 horas", theme: "dark", duration: 30,
  build() {
    const waLog = h("div", { class: "wa__log" });
    const waTime = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const showWa = (d) => {
      const msg = waMessage(d);
      waLog.replaceChildren(h("div", { class: "wa__day" }, "Hoje"),
        h("div", { class: "wa__msg" }, h("p", {}, msg.split("\n").map((l, i) => [i ? h("br") : null, l.startsWith("•") ? h("b", {}, l) : l])), h("span", { class: "wa__t" }, waTime(), " ✓✓")),
        h("div", { class: "wa__sys" }, "Mensagem organizada pela Assistente PrioSafra"));
      wap.classList.add("is-live");
      if (window.gsap && !reduced()) gsap.fromTo(waLog.querySelector(".wa__msg"), { opacity: 0, y: 20, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.4)" });
      real.href = waLink(d);
    };
    const asst = createAssistant({ onForward: (d) => showWa(d), onEvent: (t) => { if (t === "reset") { wap.classList.remove("is-live"); waLog.replaceChildren(h("div", { class: "wa__empty" }, icon("wa", "ic ic--lg"), h("p", {}, "O pedido organizado aparece aqui."))); } } });
    this._asst = asst;
    ["pointerdown", "keydown"].forEach((ev) => asst.el.addEventListener(ev, () => clearTimeout(this._t)));
    const real = h("a", { class: "fine at__real", href: waLink({}), target: "_blank", rel: "noopener" }, "Abrir no WhatsApp real ↗");
    const wap = h("div", { class: "wa" },
      statusBar(),
      h("div", { class: "wa__head" }, icon("arrowL", "ic ic--xs"), h("span", { class: "wa__av" }, markPrio({ cls: "pmark" })), h("div", {}, h("b", {}, "PrioSafra · Comercial"), h("span", {}, "WhatsApp Business"))),
      waLog);
    return h("div", { class: "ch__in at" },
      h("div", { class: "at__text" },
        h("p", { class: "kicker", "data-in": "" }, h("span", { class: "kicker__n" }, "07"), "Atendente virtual 24 horas"),
        h("h2", { class: "display display--sm", "data-in": "" }, "Enquanto sua equipe está no campo, ", h("em", {}, "sua presença digital continua atendendo.")),
        h("p", { class: "lead", "data-in": "" }, "A Assistente PrioSafra recebe o visitante, entende o que ele procura e organiza o pedido. Quem fecha a venda continua sendo a sua equipe."),
        h("div", { class: "at__btns", "data-in": "" },
          h("button", { class: "btn btn--gold", type: "button", onclick: () => asst.play() }, icon("play"), "Reproduzir conversa"),
          h("button", { class: "btn btn--ghost", type: "button", onclick: () => { asst.reset(); asst.el.querySelector(".as__in").focus(); } }, icon("msg"), "Conversar ao vivo")),
        h("ul", { class: "at__rules", "data-in": "" }, [["check", "Recepciona, identifica cidade e produto e organiza o orçamento"], ["check", "Encaminha ao WhatsApp do comercial, com consentimento"], ["x", "Nunca inventa preço, estoque, condição comercial ou recomendação técnica"]].map(([i, t]) => h("li", { class: i === "x" ? "is-no" : "" }, icon(i, "ic ic--xs"), t))),
        h("p", { class: "fine", "data-in": "" }, "Demonstração com fluxo local, sem custo de IA. Em produção, uma IA pode ser ligada pelo servidor, restrita à base de informações aprovada pela PrioSafra. Número de WhatsApp configurável: confirmar antes de publicar.")),
      h("div", { class: "at__chat", "data-in": "", "data-noswipe": "" }, asst.el),
      h("div", { class: "at__wa", "data-in": "" }, h("p", { class: "at__k" }, "O que chega no WhatsApp"), phone(wap, { cls: "at__phone" }), real));
  },
  enter(el) {
    reveal(el);
    clearTimeout(this._t);
    this._asst.reset();
    this._t = setTimeout(() => el.classList.contains("is-active") && this._asst.play(), reduced() ? 300 : 1600);
  },
  leave(el) { clearTimeout(this._t); unreveal(el); },
};
