/* =========================================================
   RENOWA · QUESTIONÁRIO DE QUALIFICAÇÃO
   ---------------------------------------------------------
   Fluxo: introdução → 8 perguntas → gráfico de compatibilidade
          → contato → confirmação.

   Cliente ideal: fatura acima de R$ 100 mil/mês E investe no
   mínimo R$ 3 mil/mês na equipe de marketing (fora a verba de
   anúncios). As demais respostas definem a prioridade.

   As aplicações vão para o CRM do próprio site (POST /api/lead,
   aba Leads do /admin). Sem servidor (modo demonstração), ficam
   salvas neste navegador e aparecem no /admin de demonstração.

   Se mudar o texto de uma opção, mude também api/_lib/leads.js.
   ========================================================= */
(() => {
  const dialog = document.getElementById("quiz");
  if (!dialog) return;

  const CFG = window.RENOWA || {};
  const ENDPOINT = CFG.formEndpoint || "/api/lead";
  const DEMO_KEY = "renowa-demo-leads";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const KEYS = "ABCDEFGHIJ";
  const ICON = "M412 0H837L717.6 210H547L255 723H1Z M717.6 210H970L1059 367L978 509H765L887 723H667L467 369H807Z";

  /* ---------- Perguntas (cada uma com uma intenção) ---------- */
  const STEPS = [
    {
      id: "segmento", type: "single", grid: true,
      title: "Qual é o segmento da sua empresa?",
      help: "Assim já chegamos na conversa com referências do seu mercado.",
      options: ["Saúde e estética", "Imobiliário e construção", "Varejo e loja física", "Serviços profissionais", "Indústria e B2B", "Educação", "Alimentação e hospitalidade", "Outro"].map((label) => ({ label })),
    },
    {
      id: "faturamento", type: "single",
      title: "Quanto sua empresa fatura por mês, em média?",
      help: "Uma faixa aproximada já ajuda. Essa informação fica só com a nossa equipe.",
      options: [
        { label: "Até R$ 50 mil", score: 0 },
        { label: "De R$ 50 mil a R$ 100 mil", score: 1 },
        { label: "De R$ 100 mil a R$ 300 mil", score: 2 },
        { label: "De R$ 300 mil a R$ 1 milhão", score: 3 },
        { label: "Acima de R$ 1 milhão", score: 3 },
      ],
    },
    {
      id: "equipe", type: "single",
      title: "Quanto você pretende investir por mês na equipe de marketing?",
      help: "Considere só o trabalho da equipe: estratégia, produção e gestão. A verba de anúncios é paga direto ao Google e à Meta e entra na próxima pergunta.",
      options: [
        { label: "Até R$ 1.500", score: 0 },
        { label: "De R$ 1.500 a R$ 3.000", score: 1 },
        { label: "De R$ 3.000 a R$ 6.000", score: 2 },
        { label: "De R$ 6.000 a R$ 12.000", score: 3 },
        { label: "Acima de R$ 12.000", score: 3 },
      ],
    },
    {
      id: "midia", type: "single",
      title: "E quanto pretende investir em anúncios por mês?",
      help: "É o valor pago direto às plataformas (Meta Ads e Google Ads), à parte da equipe.",
      options: [
        { label: "Ainda não pretendo anunciar", score: 0 },
        { label: "Até R$ 2 mil", score: 1 },
        { label: "De R$ 2 mil a R$ 5 mil", score: 2 },
        { label: "De R$ 5 mil a R$ 15 mil", score: 3 },
        { label: "Acima de R$ 15 mil", score: 3 },
      ],
    },
    {
      id: "servicos", type: "multi", grid: true,
      title: "Do que sua empresa mais precisa agora?",
      help: "Escolha quantas opções quiser.",
      options: ["Redes sociais", "Vídeos e fotos profissionais", "Imagens com drone", "Tráfego pago", "Site ou landing page", "CRM e automação de WhatsApp", "Sistema ou SaaS sob medida", "Ainda não sei, quero um diagnóstico"].map((label) => ({ label })),
    },
    {
      id: "hoje", type: "single",
      title: "Quem cuida do marketing hoje?",
      help: "Sem resposta certa. Isso nos diz por onde começar.",
      options: ["Ninguém, está tudo comigo", "Alguém da equipe, quando sobra tempo", "Freelancers", "Outra agência", "Uma equipe interna"].map((label) => ({ label })),
    },
    {
      id: "prazo", type: "single",
      title: "Para quando você quer começar?",
      options: [
        { label: "Nos próximos 30 dias", score: 2 },
        { label: "Entre 1 e 3 meses", score: 1 },
        { label: "Ainda estou pesquisando", score: 0 },
      ],
    },
    {
      id: "decisor", type: "single",
      title: "Qual é o seu papel nessa decisão?",
      options: [
        { label: "Sou dono(a) ou sócio(a)", score: 2 },
        { label: "Sou diretor(a) ou gerente com autonomia", score: 2 },
        { label: "Vou levar a proposta para os sócios", score: 1 },
      ],
    },
    { id: "match", type: "match" },
    {
      id: "contato", type: "contact",
      fields: [
        { name: "nome", label: "Seu nome", auto: "name", required: true },
        { name: "empresa", label: "Empresa", auto: "organization", required: true },
        { name: "whatsapp", label: "WhatsApp", auto: "tel", type: "tel", placeholder: "(11) 90000-0000", required: true },
        { name: "email", label: "E-mail", auto: "email", type: "email", required: true },
        { name: "link", label: "Instagram ou site da empresa", optional: true, placeholder: "@suaempresa ou suaempresa.com.br", full: true },
      ],
    },
  ];
  const N = STEPS.length;
  const QUESTIONS = STEPS.filter((s) => s.type === "single" || s.type === "multi");
  const Q = QUESTIONS.length;
  const byId = (id) => STEPS.find((s) => s.id === id);

  /* ---------- Estado ---------- */
  let step = -1;           // -1 = introdução, N = confirmação
  const answers = {};      // id -> índice | índices[] | {contato}
  let lastPointer = false; // clique avança sozinho; teclado, não
  let busy = false;
  let lastSent = null;

  const $ = (s, c = dialog) => c.querySelector(s);
  const stage = $(".quiz__stage");
  const form = $(".quiz__form");
  const foot = $(".quiz__foot");
  const back = $("[data-quiz-back]");
  const next = $(".quiz__next");
  const nextLabel = $("span", next);
  const count = $(".quiz__count");
  const bar = $(".quiz__progress span");

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach((c) => c != null && n.append(c));
    return n;
  };
  const svg = (tag, attrs = {}) => {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const icon = () => { const s = svg("svg", { viewBox: "0 0 1060 724", "aria-hidden": "true" }); s.append(svg("path", { d: ICON })); return s; };

  /* =========================================================
     CLASSIFICAÇÃO E COMPATIBILIDADE
     (mesma regra de api/_lib/leads.js)
     ========================================================= */
  const score = (id) => byId(id).options[answers[id]]?.score ?? 0;

  function classify() {
    const fat = score("faturamento"), eq = score("equipe");
    let perfil = "fora-do-perfil";
    if (fat >= 2 && eq >= 2) perfil = "qualificado";
    else if ((fat >= 2 && eq === 1) || (fat === 1 && eq >= 2)) perfil = "avaliar";
    const pontuacao = score("midia") + score("prazo") + score("decisor"); // 0 a 7
    return { perfil, prioridade: perfil === "qualificado" ? (pontuacao >= 5 ? "A" : "B") : "-", pontuacao };
  }

  // Cada dimensão vira 0–1; o total é ponderado e encaixado na faixa do perfil
  const DIMS = [
    { id: "faturamento", label: "Porte da empresa", w: 0.3, map: [0.15, 0.55, 0.9, 1] },
    { id: "equipe", label: "Investimento na equipe", w: 0.3, map: [0.15, 0.55, 0.9, 1] },
    { id: "midia", label: "Verba para anúncios", w: 0.15, map: [0.3, 0.6, 0.85, 1] },
    { id: "servicos", label: "Serviços que você precisa", w: 0.1 },
    { id: "prazo", label: "Momento para começar", w: 0.1, map: [0.4, 0.75, 1] },
    { id: "decisor", label: "Autonomia na decisão", w: 0.05, map: [0.7, 0.7, 1] },
  ];
  function compatibility() {
    const parts = DIMS.map((d) => ({
      ...d,
      v: d.id === "servicos" ? ((answers.servicos || []).length ? 1 : 0.6) : d.map[score(d.id)] ?? d.map[0],
    }));
    const raw = parts.reduce((s, p) => s + p.v * p.w, 0);
    const { perfil } = classify();
    const clamp = (x, a, b) => Math.max(a, Math.min(b, Math.round(x)));
    const total = perfil === "qualificado" ? clamp(86 + ((raw - 0.75) / 0.25) * 12, 86, 98)
      : perfil === "avaliar" ? clamp(raw * 100, 55, 79)
      : clamp(raw * 100, 18, 49);
    return { total, parts, perfil };
  }
  const level = (v) => (v >= 0.85 ? "Ideal" : v >= 0.6 ? "Bom" : "Baixo");

  /* =========================================================
     TELAS
     ========================================================= */
  function renderIntro() {
    return el("div", { class: "intro" },
      el("p", { class: "q__k", text: "Antes de conversarmos" }),
      el("h2", { class: "q__title", id: "quiz-title", text: "Vamos ver o quanto a Renowa combina com a sua empresa." }),
      el("p", { class: "q__help", text: "Trabalhamos com poucas empresas por vez. Responda algumas perguntas e veja na hora a sua compatibilidade com o nosso trabalho." }),
      el("ul", { class: "intro__list" },
        el("li", { text: `${Q} perguntas, cerca de 2 minutos` }),
        el("li", { text: "Resultado de compatibilidade na hora" }),
        el("li", { text: "Respostas confidenciais e sem compromisso" }),
      ),
    );
  }

  function renderQuestion(s) {
    const i = QUESTIONS.indexOf(s);
    const multi = s.type === "multi";
    const saved = answers[s.id];
    const opts = s.options.map((o, k) => {
      const checked = multi ? (saved || []).includes(k) : saved === k;
      return el("label", { class: "opt" + (multi ? " opt--multi" : "") },
        el("input", { type: multi ? "checkbox" : "radio", name: s.id, value: String(k), checked }),
        el("span", { class: "opt__key", "aria-hidden": "true", text: KEYS[k] }),
        el("span", { class: "opt__label", text: o.label }),
        el("span", { class: "opt__check", "aria-hidden": "true" }),
      );
    });
    return el("fieldset", { class: "q" },
      el("legend", { class: "q__title", id: "quiz-title" }, el("span", { class: "q__k", text: `Pergunta ${i + 1} de ${Q}` }), s.title),
      s.help ? el("p", { class: "q__help", text: s.help }) : null,
      el("div", { class: "q__opts" + (s.grid ? " q__opts--grid" : "") }, opts),
      el("p", { class: "q__err", role: "alert" }),
    );
  }

  // Gráfico de compatibilidade: número-herói no anel + barras por critério
  function renderMatch() {
    const m = compatibility();
    const COPY = {
      qualificado: {
        k: "Resultado da análise",
        title: "Sua empresa tem alta compatibilidade com a Renowa.",
        text: "Baseado nas suas informações, temos uma proposta que se encaixa perfeitamente nas suas necessidades. Deixe seu contato para agendarmos uma apresentação, sem compromisso.",
      },
      avaliar: {
        k: "Resultado da análise",
        title: "Existe compatibilidade, com alguns ajustes.",
        text: "Seu perfil está perto do que atendemos. Deixe seu contato: vamos analisar suas respostas e mostrar o formato que faz sentido para o seu momento, sem compromisso.",
      },
      "fora-do-perfil": {
        k: "Resultado da análise",
        title: "Neste momento, a compatibilidade é baixa.",
        text: "Nosso trabalho hoje é desenhado para empresas em outra fase de faturamento e investimento. Se quiser, deixe seu contato e avisamos quando tivermos um formato para você.",
      },
    }[m.perfil];

    const R = 64, C = 2 * Math.PI * R;
    const ring = svg("svg", { class: "gauge__svg", viewBox: "0 0 160 160", "aria-hidden": "true" });
    ring.append(
      svg("circle", { class: "gauge__track", cx: 80, cy: 80, r: R }),
      svg("circle", { class: "gauge__fill", cx: 80, cy: 80, r: R, "stroke-dasharray": C, "stroke-dashoffset": C, transform: "rotate(-90 80 80)" }),
    );
    const num = el("span", { class: "gauge__num", text: "0" });

    const bars = m.parts.map((p) => el("li", { class: "cbar" },
      el("span", { class: "cbar__label", text: p.label }),
      el("span", { class: "cbar__track", "aria-hidden": "true" }, el("span", { class: "cbar__fill", style: `--v:${Math.round(p.v * 100)}%` })),
      el("span", { class: "cbar__level", text: level(p.v) }),
    ));

    const box = el("div", { class: `match match--${m.perfil}` },
      el("div", { class: "match__chart", role: "img", "aria-label": `Compatibilidade de ${m.total}% com a Renowa. ${m.parts.map((p) => `${p.label}: ${level(p.v)}`).join(". ")}.` },
        el("div", { class: "gauge" }, ring, el("p", { class: "gauge__center", "aria-hidden": "true" }, el("span", {}, num, "%"), el("small", { text: "compatível" }))),
        el("ul", { class: "cbars", "aria-hidden": "true" }, bars),
      ),
      el("div", { class: "match__copy" },
        el("p", { class: "q__k", text: COPY.k }),
        el("h2", { class: "q__title", id: "quiz-title", text: COPY.title }),
        el("p", { class: "q__help match__text", text: COPY.text }),
      ),
    );

    // Animação: anel, número e barras
    requestAnimationFrame(() => {
      const fill = ring.querySelector(".gauge__fill");
      const target = C * (1 - m.total / 100);
      if (reduce || !window.gsap) {
        fill.setAttribute("stroke-dashoffset", target);
        num.textContent = m.total;
        box.querySelectorAll(".cbar__fill").forEach((b) => (b.style.transform = "scaleX(1)"));
        return;
      }
      const o = { v: 0 };
      gsap.to(fill, { attr: { "stroke-dashoffset": target }, duration: 1.8, ease: "expo.out", delay: 0.2 });
      gsap.to(o, { v: m.total, duration: 1.8, ease: "expo.out", delay: 0.2, onUpdate: () => (num.textContent = Math.round(o.v)) });
      gsap.fromTo(box.querySelectorAll(".cbar__fill"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, stagger: 0.08, ease: "expo.out", delay: 0.5 });
    });
    return box;
  }

  function renderContact(s) {
    const saved = answers.contato || {};
    const { perfil } = classify();
    const fields = s.fields.map((f) =>
      el("div", { class: "field" + (f.full ? " field--full" : "") },
        el("label", { for: `q-${f.name}` }, f.label, f.optional ? el("small", { text: " (opcional)" }) : null),
        el("input", { id: `q-${f.name}`, name: f.name, type: f.type || "text", autocomplete: f.auto || "off", placeholder: f.placeholder || null, required: f.required || null, inputmode: f.type === "tel" ? "tel" : null, value: saved[f.name] || null }),
        el("p", { class: "field__err", "aria-live": "polite" }),
      )
    );
    // Campo-isca contra robôs (invisível para pessoas)
    const trap = el("div", { class: "sr-only", "aria-hidden": "true" },
      el("label", { for: "q-empresa_site", text: "Não preencha" }),
      el("input", { id: "q-empresa_site", name: "empresa_site", type: "text", tabindex: "-1", autocomplete: "off" }));
    return el("fieldset", { class: "q" },
      el("legend", { class: "q__title", id: "quiz-title" }, el("span", { class: "q__k", text: "Última etapa" }),
        perfil === "qualificado" ? "Para quem apresentamos a proposta?" : "Para quem enviamos o retorno?"),
      el("p", { class: "q__help", text: perfil === "qualificado"
        ? "Um especialista vai chamar você no WhatsApp para marcar a apresentação no melhor horário."
        : "Um especialista vai analisar suas respostas e falar com você pelo WhatsApp." }),
      el("div", { class: "q__fields" }, fields),
      trap,
      el("p", { class: "q__privacy", text: "Usamos seus dados só para falar com você sobre a proposta. Nada de spam." }),
    );
  }

  function renderResult() {
    const c = answers.contato || {};
    const r = lastSent || classify();
    const first = (c.nome || "").trim().split(/\s+/)[0] || "";
    const wrap = el("div", { class: "result result--" + (r.perfil === "qualificado" ? "ok" : r.perfil === "avaliar" ? "near" : "out") },
      el("span", { class: "result__badge" }, icon()));
    const close = () => el("button", { type: "button", class: "btn btn--ghost", "data-quiz-close": true }, el("span", { text: "Voltar ao site" }));

    if (r.perfil === "qualificado") {
      const services = (answers.servicos || []).map((k) => byId("servicos").options[k].label).join(", ");
      const msg = `Olá, Renowa! Fiz a aplicação no site e quero agendar a apresentação da proposta.\nNome: ${c.nome}\nEmpresa: ${c.empresa}\nInteresse: ${services || "diagnóstico"}`;
      wrap.append(
        el("h2", { class: "q__title", id: "quiz-title", text: `Pronto${first ? ", " + first : ""}! Sua apresentação está a caminho.` }),
        el("p", { text: "Um especialista vai chamar você no WhatsApp em até 1 dia útil para marcar a apresentação da proposta." }),
        el("ol", { class: "result__steps" },
          el("li", {}, el("span", { text: "01" }), "Contato rápido para confirmar seus objetivos e o melhor horário"),
          el("li", {}, el("span", { text: "02" }), "Apresentação da proposta, por vídeo, em 45 minutos e sem compromisso"),
          el("li", {}, el("span", { text: "03" }), "Se fizer sentido, começamos pelo diagnóstico da sua marca"),
        ),
        el("div", { class: "result__ctas" },
          el("a", { class: "btn btn--blue", href: `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(msg)}`, target: "_blank", rel: "noopener" }, el("span", { text: "Adiantar pelo WhatsApp" })),
          close()),
      );
    } else if (r.perfil === "avaliar") {
      wrap.append(
        el("h2", { class: "q__title", id: "quiz-title", text: `Obrigado${first ? ", " + first : ""}! Vamos analisar o seu caso.` }),
        el("p", { text: "Um especialista vai olhar suas respostas com atenção e falar com você pelo WhatsApp para mostrar o formato que faz sentido para o seu momento." }),
        el("div", { class: "result__ctas" }, close()),
      );
    } else {
      wrap.append(
        el("h2", { class: "q__title", id: "quiz-title", text: "Obrigado pela sinceridade." }),
        el("p", { text: "Guardamos o seu contato e avisaremos quando tivermos um formato para o seu momento. Enquanto isso, acompanhe a Renowa no Instagram." }),
        el("div", { class: "result__ctas" },
          el("a", { class: "btn btn--ice", href: CFG.instagram || "#", target: "_blank", rel: "noopener" }, el("span", { text: "Seguir no Instagram" })),
          close()),
      );
    }
    return wrap;
  }

  /* =========================================================
     NAVEGAÇÃO
     ========================================================= */
  function show(n, dir = 1) {
    step = n;
    const s = STEPS[n];
    stage.replaceChildren(
      n < 0 ? renderIntro()
        : n >= N ? renderResult()
        : s.type === "match" ? renderMatch()
        : s.type === "contact" ? renderContact(s)
        : renderQuestion(s)
    );
    stage.scrollTop = 0;

    foot.hidden = n >= N;
    back.hidden = n < 0;
    const qi = s ? QUESTIONS.indexOf(s) : -1;
    count.textContent = qi >= 0 ? `${String(qi + 1).padStart(2, "0")} / ${String(Q).padStart(2, "0")}` : s?.type === "match" ? "Resultado" : s?.type === "contact" ? "Contato" : "";
    bar.style.transform = `scaleX(${n < 0 ? 0 : n >= N ? 1 : (n + 1) / (N + 1)})`;
    nextLabel.textContent = n < 0 ? "Começar" : s?.type === "match" ? (classify().perfil === "fora-do-perfil" ? "Deixar meu contato" : "Agendar apresentação") : s?.type === "contact" ? "Enviar" : "Continuar";
    updateNext();

    if (window.gsap && !reduce) {
      gsap.fromTo(stage.firstElementChild, { y: 28 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "expo.out" });
      gsap.fromTo(stage.querySelectorAll(".opt, .field, .intro__list li, .result__steps li, .result__ctas, .cbar"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.035, delay: 0.08, ease: "expo.out" });
    }

    const firstInput = stage.querySelector(".field input");
    if (firstInput && finePointer) firstInput.focus();
    else {
      const t = stage.querySelector(".q__title");
      t?.setAttribute("tabindex", "-1");
      t?.focus({ preventScroll: true });
    }
  }

  function updateNext() {
    const s = STEPS[step];
    let ok = true;
    if (s?.type === "single") ok = answers[s.id] != null;
    if (s?.type === "multi") ok = (answers[s.id] || []).length > 0;
    next.disabled = !ok || busy;
  }

  function readChoice() {
    const s = STEPS[step];
    if (!s || (s.type !== "single" && s.type !== "multi")) return;
    const checked = [...stage.querySelectorAll(".opt input:checked")].map((i) => Number(i.value));
    answers[s.id] = s.type === "multi" ? checked : checked[0];
    updateNext();
  }

  stage.addEventListener("pointerdown", () => (lastPointer = true));
  stage.addEventListener("keydown", () => (lastPointer = false));
  stage.addEventListener("change", (e) => {
    if (!e.target.matches(".opt input")) return;
    readChoice();
    if (STEPS[step]?.type === "single" && lastPointer) setTimeout(() => STEPS[step]?.type === "single" && goNext(), 320);
  });

  /* ---------- Contato: validação e máscara ---------- */
  const rules = {
    nome: (v) => (v.trim().split(/\s+/).length >= 2 ? "" : "Informe nome e sobrenome."),
    empresa: (v) => (v.trim().length >= 2 ? "" : "Informe o nome da empresa."),
    whatsapp: (v) => (v.replace(/\D/g, "").length >= 10 ? "" : "Informe o número com DDD."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Informe um e-mail válido."),
  };
  const checkField = (input) => {
    if (!rules[input.name]) return true;
    const msg = rules[input.name](input.value);
    const box = input.closest(".field");
    box.classList.toggle("is-invalid", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    box.querySelector(".field__err").textContent = msg;
    return !msg;
  };
  stage.addEventListener("input", (e) => {
    const t = e.target;
    if (t.name === "whatsapp") {
      const d = t.value.replace(/\D/g, "").slice(0, 11);
      t.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
    }
    if (t.closest(".field")?.classList.contains("is-invalid")) checkField(t);
  });
  stage.addEventListener("focusout", (e) => { if (e.target.matches(".field input") && e.target.value) checkField(e.target); });

  /* ---------- Envio para o CRM ---------- */
  function payload() {
    const resp = {};
    QUESTIONS.forEach((s) => {
      resp[s.id] = s.type === "multi" ? (answers[s.id] || []).map((k) => s.options[k].label).join("; ") : s.options[answers[s.id]]?.label ?? "";
    });
    return { ...answers.contato, ...resp, empresa_site: stage.querySelector("[name=empresa_site]")?.value || "", origem: location.href };
  }

  // Sem servidor (python -m http.server / demonstração): guarda no navegador para o /admin de demonstração
  function saveDemoLead(data) {
    const r = classify();
    const now = new Date().toISOString();
    const lead = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      criadoEm: now, atualizadoEm: now,
      nome: data.nome, empresa: data.empresa, whatsapp: data.whatsapp, email: data.email, link: data.link || "",
      respostas: { ...Object.fromEntries(QUESTIONS.map((s) => [s.id, data[s.id]])), servicos: data.servicos ? data.servicos.split("; ") : [] },
      ...r, compatibilidade: compatibility().total,
      etapa: "novo", valor: 0, proximoContato: "",
      historico: [{ em: now, texto: "Aplicação recebida pelo site", por: "site" }],
    };
    let list = [];
    try { list = JSON.parse(localStorage.getItem(DEMO_KEY) || "[]"); } catch { /* sem storage */ }
    list.unshift(lead);
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(list)); } catch { /* sem storage */ }
  }

  async function submitContact() {
    const inputs = [...stage.querySelectorAll(".field input")];
    const valid = inputs.map(checkField).every(Boolean);
    answers.contato = Object.fromEntries(inputs.map((i) => [i.name, i.value.trim()]));
    if (!valid) {
      stage.querySelector(".is-invalid input")?.focus();
      if (window.gsap && !reduce) gsap.fromTo(stage.firstElementChild, { x: -8 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
      return;
    }
    busy = true;
    nextLabel.textContent = "Enviando…";
    updateNext();
    const data = payload();
    try {
      let res = null;
      try {
        res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
      } catch { res = null; }
      if (!res || res.status === 404 || res.status === 405 || res.status === 501) {
        saveDemoLead(data); // sem API: modo demonstração
        await new Promise((r) => setTimeout(r, 600));
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Não conseguimos enviar agora.");
      }
      lastSent = classify();
      busy = false;
      show(N);
    } catch (err) {
      busy = false;
      nextLabel.textContent = "Tentar de novo";
      updateNext();
      const p = stage.querySelector(".q__privacy");
      if (p) p.textContent = `${err.message} Tente de novo ou fale com a gente pelo WhatsApp.`;
    }
  }

  function goNext() {
    if (busy) return;
    if (step < 0) return show(0);
    const s = STEPS[step];
    if (!s) return;
    if (s.type === "contact") return submitContact();
    if (s.type === "match") return show(step + 1);
    readChoice();
    if (next.disabled) {
      const err = stage.querySelector(".q__err");
      if (err) err.textContent = s.type === "multi" ? "Escolha pelo menos uma opção." : "Escolha uma opção para continuar.";
      return;
    }
    show(step + 1);
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); goNext(); });
  back.addEventListener("click", () => step >= 0 && step < N && show(step - 1, -1));

  /* ---------- Teclado: letras escolhem, Enter avança ---------- */
  dialog.addEventListener("keydown", (e) => {
    const typing = e.target.matches("input[type=text], input[type=email], input[type=tel], textarea");
    if (e.key === "Enter" && !typing && !e.target.matches("button, a")) { e.preventDefault(); goNext(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    const s = STEPS[step];
    if (!s || (s.type !== "single" && s.type !== "multi")) return;
    const k = KEYS.indexOf(e.key.toUpperCase());
    const inputs = stage.querySelectorAll(".opt input");
    if (k < 0 || k >= inputs.length) return;
    e.preventDefault();
    const input = inputs[k];
    input.checked = s.type === "multi" ? !input.checked : true;
    input.focus();
    lastPointer = false;
    readChoice();
    if (s.type === "single") setTimeout(() => STEPS[step] === s && goNext(), 260);
  });

  /* ---------- Abrir e fechar ---------- */
  function open(opts = {}) {
    window.dispatchEvent(new Event("renowa:apply"));
    if (step >= N) { Object.keys(answers).forEach((k) => delete answers[k]); step = -1; lastSent = null; }
    // Escopo montado no capítulo 03 entra já marcado
    if (Array.isArray(opts.servicos) && opts.servicos.length) {
      const opt = byId("servicos").options;
      answers.servicos = opts.servicos.map((l) => opt.findIndex((o) => o.label === l)).filter((i) => i >= 0);
    }
    // Link personalizado (?para=&nome=) pré-preenche o contato
    const lead = CFG.lead || {};
    if (!answers.contato && (lead.company || lead.person)) answers.contato = { empresa: lead.company || "", nome: lead.person || "" };
    if (typeof dialog.showModal === "function") { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute("open", "");
    document.documentElement.classList.add("is-locked");
    window.lenis?.stop();
    show(step < 0 ? -1 : step);
    if (window.gsap && !reduce) gsap.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" });
  }
  function close() {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("is-locked");
    window.lenis?.start();
  });
  dialog.addEventListener("click", (e) => { if (e.target.closest("[data-quiz-close]")) close(); });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-apply]")) return;
    e.preventDefault();
    open();
  });
  if (location.hash === "#aplicacao") open();
  window.RenowaQuiz = { open, close };
})();
