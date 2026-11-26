// Assistente PrioSafra — fluxo local de demonstração (sem IA paga, sem enviar dados a lugar nenhum).
// Regras: nunca informa preço, estoque, condição comercial ou recomendação técnica; organiza o pedido
// e encaminha para o WhatsApp do comercial, com consentimento.
// Para usar uma IA real depois: trocar `responder()` por uma chamada a um endpoint do servidor
// (chave só no servidor) que receba a base de informações aprovada pela PrioSafra.
import { h, icon, markPrio, sleep, reduced } from "./lib.js";
import { CONTATO, REGIAO } from "./config.js";

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const CATS = [
  { id: "milho", nome: "Sementes de milho", re: /milho|hibrido/ },
  { id: "sorgo", nome: "Sementes de sorgo", re: /sorgo/ },
  { id: "pastagens", nome: "Sementes de pastagens", re: /pasto|pastage|capim|braqui|forrage|semembras/ },
];
const CIDADES = REGIAO.map((c) => c.nome);

export function waMessage(d) {
  return [`Olá! Vim pelo site da PrioSafra.`, `• Município: ${d.cidade || "não informado"}`, `• Interesse: ${d.cat || "a definir"}`, `• Objetivo: ${d.obj || "falar com o comercial"}`, d.orc ? "• Solicitação de orçamento: sim" : null, "Gostaria de falar com o responsável comercial."].filter(Boolean).join("\n");
}
export const waLink = (d) => `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(waMessage(d))}`;

export function createAssistant({ compact = false, onForward = () => {}, onEvent = () => {} } = {}) {
  const data = { cidade: null, cat: null, obj: null, orc: false, consent: false };
  let stage = "start";
  const log = h("div", { class: "as__log", "aria-live": "polite" });
  const quick = h("div", { class: "as__quick" });
  const input = h("input", { class: "as__in", type: "text", placeholder: "Escreva sua mensagem…", "aria-label": "Mensagem para a assistente", autocomplete: "off" });
  const form = h("form", { class: "as__form", onsubmit: (e) => { e.preventDefault(); const v = input.value.trim(); if (!v) return; input.value = ""; user(v); } }, input, h("button", { class: "as__send", type: "submit", "aria-label": "Enviar" }, icon("send")));
  const el = h("div", { class: `as ${compact ? "as--compact" : ""}` },
    h("div", { class: "as__head" }, h("span", { class: "as__av" }, markPrio({ cls: "pmark" })), h("div", {}, h("b", {}, "Assistente PrioSafra"), h("span", { class: "as__on" }, h("i"), "Online agora · responde na hora")), h("button", { class: "as__reset", type: "button", title: "Recomeçar conversa", "aria-label": "Recomeçar conversa", onclick: () => reset() }, icon("refresh"))),
    log, quick, form,
    h("p", { class: "as__priv" }, icon("lock", "ic ic--xs"), "Seus dados só são compartilhados com a PrioSafra, com o seu consentimento."));

  const scroll = () => (log.scrollTop = log.scrollHeight);
  const bubble = (who, content) => { const b = h("div", { class: `as__msg as__msg--${who}` }, content); log.append(b); if (window.gsap && !reduced()) gsap.fromTo(b, { opacity: 0, y: 10, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }); scroll(); return b; };
  const typing = () => { const t = h("div", { class: "as__msg as__msg--bot as__typing" }, h("i"), h("i"), h("i")); log.append(t); scroll(); return t; };
  async function bot(text, chips = [], extra = null) {
    quick.replaceChildren();
    const t = typing();
    await sleep(reduced() ? 80 : 650 + Math.min(900, text.length * 9));
    t.remove();
    bubble("bot", [h("p", {}, text), extra]);
    quick.replaceChildren(...chips.map((c) => h("button", { type: "button", class: "as__chip", onclick: () => user(c) }, c)));
  }
  let token = 0; // muda quando a pessoa interage: o roteiro automático para
  function user(text, fromScript = false) { if (!fromScript) token++; quick.replaceChildren(); bubble("user", h("p", {}, text)); onEvent("msg", text); return responder(text); }

  async function forward() {
    stage = "done";
    onEvent("forward", { ...data });
    const card = h("div", { class: "as__summary" },
      h("p", { class: "as__sk" }, "Resumo do atendimento"),
      h("ul", {}, h("li", {}, h("span", {}, "Município"), h("b", {}, data.cidade || "—")), h("li", {}, h("span", {}, "Interesse"), h("b", {}, data.cat || "A definir")), h("li", {}, h("span", {}, "Objetivo"), h("b", {}, data.obj || "Falar com o comercial"))),
      h("button", { type: "button", class: "as__wa", onclick: () => onForward({ ...data }) }, icon("wa"), "Continuar atendimento pelo WhatsApp"),
      h("p", { class: "as__fine" }, "Ao continuar, você concorda em enviar estes dados à equipe comercial da PrioSafra pelo WhatsApp."));
    await bot("Certo! Vou encaminhar seu atendimento à nossa equipe para que você possa conversar diretamente com o responsável.", [], card);
    onForward({ ...data }, { auto: true });
  }
  async function askConsent() {
    stage = "consent";
    await bot("Antes de encaminhar: vamos compartilhar seu município, o produto de interesse e o objetivo do contato com a equipe comercial da PrioSafra pelo WhatsApp. Você concorda?", ["Concordo", "Agora não"], h("p", { class: "as__fine" }, "Usamos esses dados só para responder ao seu pedido. Você pode pedir a exclusão a qualquer momento."));
  }

  async function responder(raw) {
    const t = norm(raw);
    const cat = CATS.find((c) => c.re.test(t));
    if (cat) data.cat = cat.nome;
    const cid = CIDADES.find((c) => t.includes(norm(c).split(" ")[0])) || (/\b(pa|para)\b/.test(t) && stage === "city" ? raw.replace(/,.*$/, "").trim() : null);
    if (cid) data.cidade = CIDADES.includes(cid) ? `${cid} (PA)` : cid;

    // Perguntas que a assistente NÃO responde sozinha
    if (/preco|valor|quanto custa|desconto|condic|prazo de pagamento|parcel/.test(t)) {
      data.orc = true;
      return bot("Preços e condições são passados pela nossa equipe comercial, sempre atualizados. Posso organizar seu pedido de orçamento agora?", ["Quero solicitar um orçamento", "Tenho outra dúvida"]);
    }
    if (/estoque|disponiv|tem pronta|pronta entrega/.test(t)) return bot("A disponibilidade é confirmada direto pela equipe comercial, para você receber a informação certa. Quer que eu encaminhe seu pedido?", ["Sim, encaminhar", "Ver produtos"]);
    if (/recomend|indica|qual (o )?melhor|qual semente|produtividade|aduba|espacamento|populacao/.test(t)) return bot("A escolha da semente depende da sua área e do seu objetivo, e quem orienta é o nosso responsável técnico-comercial. Posso colocar você em contato com ele?", ["Sim, quero conversar", "Ver produtos"]);
    if (/horario|abre|funciona|atendimento ate/.test(t)) return bot("O horário de atendimento será publicado aqui após confirmação com a PrioSafra. Enquanto isso, posso encaminhar sua mensagem para a equipe.", ["Encaminhar mensagem"]);
    if (/endereco|onde fica|localiza|loja/.test(t)) return bot("Estamos em Paragominas (PA) e atendemos a região. O endereço completo aparece na página de contato do site.", ["Quero solicitar um orçamento"]);

    if (stage === "consent") {
      if (/concord|sim|ok|pode|aceito/.test(t)) { data.consent = true; return forward(); }
      stage = "idle";
      return bot("Sem problemas! Seus dados não foram compartilhados. Se mudar de ideia, é só me chamar.", ["Recomeçar"]);
    }
    if (/recomec/.test(t)) return reset();
    if (/orcament|cotac|comprar|pedido|encaminh|conversar|falar com|sim, quero|sim, encaminhar/.test(t)) {
      data.obj = "Solicitar orçamento"; data.orc = true;
      if (!data.cidade) { stage = "city"; return bot("Perfeito! Em qual município fica sua propriedade?", CIDADES.slice(0, 4)); }
      if (!data.cat) { stage = "cat"; return bot("E qual produto você procura?", CATS.map((c) => c.nome)); }
      return askConsent();
    }
    if (/ver produtos|consultar|catalogo|produtos/.test(t)) {
      data.obj = data.obj || "Consultar produtos";
      if (!data.cat) { stage = "cat"; return bot("Trabalhamos com sementes de milho, sorgo e pastagens. Qual delas você procura?", CATS.map((c) => c.nome)); }
      return bot(`Ótimo! Na página de ${data.cat.toLowerCase()} você vê as marcas que representamos. Quer que eu encaminhe para a equipe montar um orçamento?`, ["Quero solicitar um orçamento", "Só estou pesquisando"]);
    }
    if (/pesquis|so olhando|depois/.test(t)) return bot("Fique à vontade! Quando quiser, é só me chamar por aqui.", ["Quero solicitar um orçamento"]);

    if (stage === "start" || /^(oi|ola|bom dia|boa tarde|boa noite)/.test(t)) {
      if (data.cat && !data.cidade) { stage = "city"; return bot("Olá! Seja bem-vindo à PrioSafra. Posso ajudar você a encontrar nossa equipe comercial. Em qual município fica sua propriedade?", CIDADES.slice(0, 4)); }
      if (!data.cat) { stage = "cat"; return bot("Olá! Seja bem-vindo à PrioSafra. Trabalhamos com sementes de milho, sorgo e pastagens. Qual delas você procura?", CATS.map((c) => c.nome)); }
    }
    if (stage === "cat" && data.cat && !data.cidade) { stage = "city"; return bot("Certo! Em qual município fica sua propriedade?", CIDADES.slice(0, 4)); }
    if (data.obj && data.cidade && data.cat && /orcament/.test(norm(data.obj))) return askConsent();
    if (data.obj && data.cidade && !data.cat && /orcament/.test(norm(data.obj))) { stage = "cat"; return bot("E qual produto você procura?", CATS.map((c) => c.nome)); }
    if ((stage === "city" || stage === "start") && data.cidade) {
      stage = "intent";
      return bot("Perfeito! Você gostaria de consultar os produtos disponíveis ou solicitar um orçamento diretamente com nosso responsável comercial?", ["Consultar produtos", "Quero solicitar um orçamento"]);
    }
    if (stage === "city" && !data.cidade && t.length > 2) { data.cidade = raw.trim(); stage = "intent"; return bot("Obrigado! Você gostaria de consultar os produtos ou solicitar um orçamento com nosso responsável comercial?", ["Consultar produtos", "Quero solicitar um orçamento"]); }
    if (stage === "intent" && data.cat && data.cidade && data.obj) return askConsent();
    return bot("Posso ajudar com informações sobre nossas sementes e encaminhar você para a equipe comercial. O que você procura?", ["Sementes de milho", "Sementes de sorgo", "Sementes de pastagens", "Quero solicitar um orçamento"]);
  }

  function reset() {
    token++;
    Object.assign(data, { cidade: null, cat: null, obj: null, orc: false, consent: false });
    stage = "start";
    log.replaceChildren();
    onEvent("reset");
    return bot("Olá! Sou a assistente virtual da PrioSafra. Posso ajudar você a encontrar a semente certa e falar com nossa equipe comercial.", ["Sementes de milho", "Sementes de sorgo", "Sementes de pastagens"]);
  }

  // Roteiro da apresentação (a conversa pedida na proposta)
  let playing = false;
  async function play() {
    if (playing) return;
    playing = true;
    const my = ++token;
    const alive = () => my === token;
    Object.assign(data, { cidade: null, cat: null, obj: null, orc: false, consent: false });
    stage = "start"; log.replaceChildren(); quick.replaceChildren(); onEvent("reset");
    const say = async (text, wait = 900) => { await sleep(reduced() ? 50 : wait); if (!alive()) throw 0; input.value = ""; for (const ch of reduced() ? [text] : text) { if (!alive()) throw 0; input.value += ch; await sleep(18); } await sleep(reduced() ? 0 : 250); input.value = ""; if (!alive()) throw 0; bubble("user", h("p", {}, text)); onEvent("msg", text); };
    const botS = async (t) => { if (!alive()) throw 0; await bot(t); if (!alive()) throw 0; };
    try {
      await say("Olá! Estou procurando sementes de milho.", 600);
      data.cat = "Sementes de milho"; stage = "city";
      await botS("Olá! Seja bem-vindo à PrioSafra. Posso ajudar você a encontrar nossa equipe comercial. Em qual município fica sua propriedade?");
      await say("Ulianópolis, no Pará.");
      data.cidade = "Ulianópolis (PA)"; stage = "intent";
      await botS("Perfeito! Você gostaria de consultar os produtos disponíveis ou solicitar um orçamento diretamente com nosso responsável comercial?");
      await say("Quero solicitar um orçamento.");
      data.obj = "Solicitar orçamento"; data.orc = true; data.consent = true;
      await forward();
    } catch { input.value = ""; }
    playing = false;
  }

  return { el, play, reset, user, data };
}
