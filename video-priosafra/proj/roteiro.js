// Roteiro do vídeo Renowa × PrioSafra: tempos das cenas e narração.
// Os tempos seguem o storyboard (≈ 3 min). Quando a narração real existir, rode
// `node scripts/tempos.mjs <transcricao.json>` para reescrever t0/t1 a partir das palavras narradas.
// Tempos de autoria (t0/t1 abaixo) → tempos reais da narração gravada (NARRADA): o vídeo é "esticado"
// cena a cena para cada cena começar exatamente quando a voz começa o assunto (pausas medidas no áudio).
export const DURACAO_AUTORIA = 180;
export const ATRASO_VOZ = 0.8; // a voz entra 0,8 s depois do início
export const NARRADA = [0, 12.93, 26.31, 39.64, 54.1, 69.65, 84.72, 99.05, 111.19, 127.46, 140.21, 158];
export const DURACAO = 158;
// tempo real → tempo de autoria (linear dentro de cada cena)
export function warp(t) {
  const A = [...CENAS.map((c) => c.t0), DURACAO_AUTORIA];
  for (let i = 0; i < NARRADA.length - 1; i++) if (t < NARRADA[i + 1] || i === NARRADA.length - 2) return A[i] + ((t - NARRADA[i]) * (A[i + 1] - A[i])) / (NARRADA[i + 1] - NARRADA[i]);
  return t;
}
export function unwarp(a) {
  const A = [...CENAS.map((c) => c.t0), DURACAO_AUTORIA];
  for (let i = 0; i < A.length - 1; i++) if (a < A[i + 1] || i === A.length - 2) return NARRADA[i] + ((a - A[i]) * (NARRADA[i + 1] - NARRADA[i])) / (A[i + 1] - A[i]);
  return a;
}

export const CENAS = [
  { id: "semente", t0: 0, t1: 14, titulo: "Tudo começa com uma semente",
    narracao: "Toda grande safra começa com uma semente. E toda grande marca começa com uma estratégia. A Renova desenvolveu um plano completo para transformar a presença digital da PrioSafra." },
  { id: "posicionamento", t0: 14, t1: 28, titulo: "O primeiro passo: posicionamento",
    narracao: "O primeiro passo será fortalecer o posicionamento da marca. Uma comunicação profissional, consistente e estratégica, capaz de transmitir no digital toda a qualidade que a PrioSafra representa no campo." },
  { id: "instagram", t0: 28, t1: 47, titulo: "O novo Instagram",
    narracao: "O Instagram será completamente reposicionado. Uma nova organização visual, conteúdos técnicos, comerciais e institucionais, artes profissionais e vídeos que aproximam a empresa dos produtores rurais." },
  { id: "conteudo", t0: 47, t1: 63, titulo: "Produção de conteúdo profissional",
    narracao: "Todos os meses, teremos planejamento estratégico, três publicações por semana e seis vídeos com captação profissional. O conhecimento da PrioSafra será transformado em conteúdo que informa, aproxima e gera confiança." },
  { id: "site", t0: 63, t1: 82, titulo: "Um site exclusivo para a PrioSafra",
    narracao: "Mas nossa estratégia vai além das redes sociais. A PrioSafra terá um site próprio, completo e profissional, onde os clientes poderão conhecer a empresa, consultar categorias de sementes, descobrir as marcas representadas e solicitar atendimento." },
  { id: "atendente", t0: 82, t1: 101, titulo: "Atendimento inteligente 24 horas",
    narracao: "E dentro desse site, uma atendente virtual estará disponível vinte e quatro horas por dia, identificando as necessidades dos visitantes, organizando as informações e encaminhando os interessados diretamente para o WhatsApp comercial da PrioSafra." },
  { id: "trafego", t0: 101, t1: 119, titulo: "Distribuição estratégica e tráfego pago",
    narracao: "Depois, entra em ação nossa estratégia de tráfego pago. Distribuiremos os conteúdos da PrioSafra através do Facebook, Instagram e, quando necessário, Google e YouTube, alcançando potenciais clientes em toda a região." },
  { id: "jornada", t0: 119, t1: 132, titulo: "O ecossistema funcionando",
    narracao: "Imagine um produtor descobrindo a PrioSafra através de um anúncio, conhecendo seus produtos pelo site, conversando com a assistente virtual e chegando ao WhatsApp pronto para iniciar um atendimento comercial." },
  { id: "painel", t0: 132, t1: 152, titulo: "Resultados dentro da plataforma Renowa",
    narracao: "E tudo isso poderá ser acompanhado dentro da plataforma da Renova. Campanhas, alcance, visitas ao site, interações e oportunidades comerciais, reunidos em um painel atualizado continuamente, conforme os dados disponibilizados pelas plataformas." },
  { id: "proposta", t0: 152, t1: 168, titulo: "A proposta comercial",
    narracao: "Uma estrutura que, contratada separadamente, poderia ultrapassar seis mil e quinhentos reais mensais. Mas com a Renova, a PrioSafra terá toda essa operação por três mil e novecentos reais por mês." },
  { id: "bonus", t0: 168, t1: 180, titulo: "Bônus e encerramento",
    narracao: "E mais: o desenvolvimento do site, avaliado em três mil reais, será entregue como bônus, sem mensalidade adicional. Renova e PrioSafra. Cultivando autoridade. Construindo oportunidades." },
];
