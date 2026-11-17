// Regras do CRM de leads: limpeza dos dados da aplicação, pontuação e etapas do funil.
// As opções e pontuações espelham assets/quiz.js. Se mudar um texto de opção lá, mude aqui também.

export const STAGES = ["novo", "contato", "diagnostico", "proposta", "ganho", "perdido"];

const SCORES = {
  faturamento: { "Até R$ 50 mil": 0, "De R$ 50 mil a R$ 100 mil": 1, "De R$ 100 mil a R$ 300 mil": 2, "De R$ 300 mil a R$ 1 milhão": 3, "Acima de R$ 1 milhão": 3 },
  equipe: { "Até R$ 1.500": 0, "De R$ 1.500 a R$ 3.000": 1, "De R$ 3.000 a R$ 6.000": 2, "De R$ 6.000 a R$ 12.000": 3, "Acima de R$ 12.000": 3 },
  midia: { "Ainda não pretendo anunciar": 0, "Até R$ 2 mil": 1, "De R$ 2 mil a R$ 5 mil": 2, "De R$ 5 mil a R$ 15 mil": 3, "Acima de R$ 15 mil": 3 },
  prazo: { "Nos próximos 30 dias": 2, "Entre 1 e 3 meses": 1, "Ainda estou pesquisando": 0 },
  decisor: { "Sou dono(a) ou sócio(a)": 2, "Sou diretor(a) ou gerente com autonomia": 2, "Vou levar a proposta para os sócios": 1 },
};
const ALLOWED = {
  ...SCORES,
  segmento: ["Saúde e estética", "Imobiliário e construção", "Varejo e loja física", "Serviços profissionais", "Indústria e B2B", "Educação", "Alimentação e hospitalidade", "Outro"],
  hoje: ["Ninguém, está tudo comigo", "Alguém da equipe, quando sobra tempo", "Freelancers", "Outra agência", "Uma equipe interna"],
  servicos: ["Redes sociais", "Vídeos e fotos profissionais", "Imagens com drone", "Tráfego pago", "Site ou landing page", "CRM e automação de WhatsApp", "Sistema ou SaaS sob medida", "Ainda não sei, quero um diagnóstico"],
};

const str = (v, max = 120) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const pick = (field, v) => {
  const list = Array.isArray(ALLOWED[field]) ? ALLOWED[field] : Object.keys(ALLOWED[field]);
  return list.includes(v) ? v : "";
};
export const bad = (msg) => Object.assign(new Error(msg), { status: 400, expose: true });

// Classificação recalculada no servidor (não confia no navegador)
export function classify(a) {
  const s = (k) => SCORES[k][a[k]] ?? 0;
  const fat = s("faturamento"), eq = s("equipe");
  let perfil = "fora-do-perfil";
  if (fat >= 2 && eq >= 2) perfil = "qualificado";
  else if ((fat >= 2 && eq === 1) || (fat === 1 && eq >= 2)) perfil = "avaliar";
  const pontuacao = s("midia") + s("prazo") + s("decisor");
  return { perfil, prioridade: perfil === "qualificado" ? (pontuacao >= 5 ? "A" : "B") : "-", pontuacao, compatibilidade: compatibility(a, perfil) };
}

// Mesmo cálculo do gráfico mostrado no fim do questionário (assets/quiz.js)
const DIMS = [
  ["faturamento", 0.3, [0.15, 0.55, 0.9, 1]],
  ["equipe", 0.3, [0.15, 0.55, 0.9, 1]],
  ["midia", 0.15, [0.3, 0.6, 0.85, 1]],
  ["servicos", 0.1, null],
  ["prazo", 0.1, [0.4, 0.75, 1]],
  ["decisor", 0.05, [0.7, 0.7, 1]],
];
function compatibility(a, perfil) {
  const raw = DIMS.reduce((sum, [id, w, map]) => {
    const v = id === "servicos" ? ((a.servicos || []).length ? 1 : 0.6) : map[SCORES[id][a[id]] ?? 0] ?? map[0];
    return sum + v * w;
  }, 0);
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.round(x)));
  return perfil === "qualificado" ? clamp(86 + ((raw - 0.75) / 0.25) * 12, 86, 98)
    : perfil === "avaliar" ? clamp(raw * 100, 55, 79)
    : clamp(raw * 100, 18, 49);
}

export function cleanApplication(input) {
  const nome = str(input.nome, 80);
  const empresa = str(input.empresa, 100);
  const whatsapp = str(input.whatsapp, 20).replace(/[^\d()+\-\s]/g, "");
  const email = str(input.email, 120).toLowerCase();
  if (nome.split(/\s+/).length < 2) throw bad("Informe nome e sobrenome.");
  if (empresa.length < 2) throw bad("Informe o nome da empresa.");
  if (whatsapp.replace(/\D/g, "").length < 10) throw bad("Informe o WhatsApp com DDD.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw bad("Informe um e-mail válido.");

  const respostas = {
    segmento: pick("segmento", input.segmento),
    faturamento: pick("faturamento", input.faturamento),
    equipe: pick("equipe", input.equipe),
    midia: pick("midia", input.midia),
    hoje: pick("hoje", input.hoje),
    prazo: pick("prazo", input.prazo),
    decisor: pick("decisor", input.decisor),
    servicos: String(input.servicos || "").split(";").map((x) => x.trim()).filter((x) => ALLOWED.servicos.includes(x)),
  };
  if (!respostas.faturamento || !respostas.equipe) throw bad("Responda as perguntas de faturamento e investimento.");

  const now = new Date().toISOString();
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    criadoEm: now,
    atualizadoEm: now,
    nome, empresa, whatsapp, email,
    link: str(input.link, 160),
    respostas,
    ...classify(respostas),
    etapa: "novo",
    valor: 0,
    proximoContato: "",
    historico: [{ em: now, texto: "Aplicação recebida pelo site", por: "site" }],
  };
}

// Alterações feitas pela equipe no painel
export function applyUpdate(lead, input, by) {
  const now = new Date().toISOString();
  const hist = [];
  if (input.etapa != null) {
    if (!STAGES.includes(input.etapa)) throw bad("Etapa inválida.");
    if (input.etapa !== lead.etapa) { hist.push(`Etapa: ${input.etapa}`); lead.etapa = input.etapa; }
  }
  if (input.valor != null) {
    const n = typeof input.valor === "number" ? input.valor : Number(String(input.valor).replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", "."));
    const v = Math.max(0, Math.min(10_000_000, Math.round(n || 0)));
    if (v !== lead.valor) { lead.valor = v; hist.push(`Valor mensal: R$ ${v.toLocaleString("pt-BR")}`); }
  }
  if (input.proximoContato != null) {
    const d = str(input.proximoContato, 10);
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) throw bad("Data de próximo contato inválida.");
    if (d !== lead.proximoContato) { lead.proximoContato = d; hist.push(d ? `Próximo contato: ${d.split("-").reverse().join("/")}` : "Próximo contato removido"); }
  }
  const nota = str(input.nota, 1000);
  if (nota) lead.historico.push({ em: now, texto: nota, por: by, tipo: "nota" });
  if (hist.length) lead.historico.push({ em: now, texto: hist.join(" · "), por: by });
  lead.historico = lead.historico.slice(-200);
  lead.atualizadoEm = now;
  return lead;
}
