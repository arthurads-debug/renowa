// Modo demonstração: 3 clientes de perfis diferentes, com dados simulados e determinísticos.
// Mesmo formato que a API real devolve, então as telas não sabem a diferença.
import { iso, parseISO, addDays, today } from "./util.js";

export const DEMO_PASSWORD = "demo123";
const STORE_KEY = "renowa-demo-clients";

// Cadastro de exemplo (mesmo formato que o painel da agência salva no servidor)
const SEED = [
  {
    id: "prefeitura", name: "Prefeitura de Vale Verde", contactName: "Secretaria de Comunicação", email: "prefeitura@demo.com.br",
    profile: "awareness", resultLabel: "Interações", city: { name: "Vale Verde", population: 86400 },
    googleAds: { customerId: "482-113-9021", name: "Prefeitura de Vale Verde" },
    metaAds: { adAccountId: "act_1029384756", name: "PMVV — Comunicação" },
    facebook: { pageId: "100200300400", name: "Prefeitura de Vale Verde" },
    instagram: { userId: "17841400000000001", username: "prefvaleverde" },
    sheets: { calendar: "demo", reports: "demo" },
    note: "A campanha de vacinação foi a mais vista do mês. Para dezembro, a prioridade é divulgar o calendário do IPTU 2027 com desconto à vista.",
  },
  {
    id: "loja", name: "Casa Bella Móveis", contactName: "Rafael", email: "loja@demo.com.br",
    profile: "leads", resultLabel: "Conversas no WhatsApp",
    googleAds: { customerId: "731-554-2210", name: "Casa Bella Móveis" },
    metaAds: { adAccountId: "act_5566778899", name: "Casa Bella — Anúncios", resultActionTypes: ["onsite_conversion.messaging_conversation_started_7d"] },
    facebook: { pageId: "100200300401", name: "Casa Bella Móveis" },
    instagram: { userId: "17841400000000002", username: "casabellamoveis" },
    sheets: { calendar: "demo", sales: "demo", reports: "demo" }, salesFormUrl: "#demo",
    note: "O Feirão de Colchões trouxe o menor custo por conversa do ano. Peça para a equipe registrar as vendas da loja toda sexta: é isso que mostra o retorno real dos anúncios.",
  },
  {
    id: "ecommerce", name: "Maison Lume", contactName: "Helena", email: "ecommerce@demo.com.br",
    profile: "sales", resultLabel: "Vendas",
    googleAds: { customerId: "915-002-7713", name: "Maison Lume — E-commerce" },
    metaAds: { adAccountId: "act_9988776655", name: "Maison Lume", resultActionTypes: ["purchase"] },
    facebook: { pageId: "100200300402", name: "Maison Lume" },
    instagram: { userId: "17841400000000003", username: "maisonlume" },
    sheets: { calendar: "demo", reports: "demo" },
    note: "Black Friday chegando: aumentamos a verba de remarketing e preparamos 6 criativos novos. Fique de olho no calendário para aprovar até quinta.",
  },
];

export function demoRecords() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch { /* sem storage */ }
  return SEED;
}
export function saveDemoRecords(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch { /* sem storage */ }
}

// Mesmo formato que /api/me devolve (publicProfile no servidor)
export function toProfile(c, viewer = "client") {
  const sheets = c.sheets || {};
  const accounts = [];
  if (c.googleAds?.customerId) accounts.push({ platform: "google", label: "Google Ads", name: c.googleAds.name || c.googleAds.customerId });
  if (c.metaAds?.adAccountId) accounts.push({ platform: "meta", label: "Meta Ads", name: c.metaAds.name || c.metaAds.adAccountId });
  if (c.facebook?.pageId) accounts.push({ platform: "facebook", label: "Facebook", name: c.facebook.name || "" });
  if (c.instagram?.userId) accounts.push({ platform: "instagram", label: "Instagram", name: c.instagram.username ? `@${c.instagram.username}` : "" });
  return {
    id: c.id, name: c.name, contact: c.contactName || null, profile: c.profile || "leads",
    resultLabel: c.resultLabel || "Contatos", currency: "BRL",
    city: c.city?.population ? c.city : null,
    platforms: { google: !!c.googleAds?.customerId, meta: !!c.metaAds?.adAccountId },
    accounts,
    has: { instagram: !!c.instagram?.userId, facebook: !!c.facebook?.pageId, youtube: true, calendar: !!sheets.calendar, sales: !!sheets.sales, reports: !!sheets.reports },
    salesFormUrl: c.salesFormUrl || null, agencyWhatsapp: "5500000000000", note: c.note || null,
    instagramUser: c.instagram?.username || null, facebookName: c.facebook?.name || null,
    viewer,
  };
}

export const DEMO_ACCOUNTS = [
  { email: "prefeitura@demo.com.br", label: "Prefeitura", hint: "divulgação" },
  { email: "loja@demo.com.br", label: "Loja física", hint: "WhatsApp + loja" },
  { email: "ecommerce@demo.com.br", label: "E-commerce", hint: "vendas online" },
];
export const demoClientByEmail = (e) => {
  const c = demoRecords().find((x) => x.email.toLowerCase() === String(e).trim().toLowerCase() && x.active !== false);
  return c ? toProfile(c) : null;
};
export const demoClientById = (id, viewer) => {
  const c = demoRecords().find((x) => x.id === id);
  return c ? toProfile(c, viewer) : null;
};

/* ---------- Campanhas por cliente ---------- */
// base = gasto/dia · cpm · ctr · res = resultados por clique · eng = interações por exibição · vtr = views por exibição · ticket = receita por resultado
const CAMPAIGNS = {
  prefeitura: [
    { p: "meta", id: "pm1", name: "Vacinação | Campanha de inverno", base: 40, cpm: 13, ctr: 0.009, eng: 0.035, vtr: 0.32 },
    { p: "meta", id: "pm2", name: "IPTU 2027 | Desconto à vista", base: 32, cpm: 14, ctr: 0.014, eng: 0.022, vtr: 0 },
    { p: "meta", id: "pm3", name: "Obras | Nova ponte do Centro", base: 28, cpm: 12, ctr: 0.007, eng: 0.041, vtr: 0.38 },
    { p: "meta", id: "pm4", name: "Cultura | Festival de Inverno", base: 22, cpm: 13, ctr: 0.011, eng: 0.048, vtr: 0.22 },
    { p: "google", id: "pg1", name: "YouTube | Prestação de contas 2026", base: 20, cpm: 16, ctr: 0.004, eng: 0.006, vtr: 0 },
    { p: "google", id: "pg2", name: "Display | Agenda cultural", base: 12, cpm: 5, ctr: 0.005, eng: 0.002, vtr: 0 },
  ],
  loja: [
    { p: "meta", id: "lm1", name: "WhatsApp | Coleção sala de estar", base: 55, cpm: 18, ctr: 0.016, res: 0.11, eng: 0.02 },
    { p: "meta", id: "lm2", name: "WhatsApp | Feirão de colchões", base: 48, cpm: 16, ctr: 0.019, res: 0.13, eng: 0.024 },
    { p: "meta", id: "lm3", name: "Alcance | Raio de 15 km da loja", base: 30, cpm: 6, ctr: 0.006, res: 0.01, eng: 0.012, vtr: 0.18 },
    { p: "meta", id: "lm4", name: "Remarketing | Visitou o perfil", base: 22, cpm: 24, ctr: 0.021, res: 0.15, eng: 0.03 },
    { p: "google", id: "lg1", name: "Pesquisa | Loja de móveis perto de mim", base: 45, cpm: 70, ctr: 0.075, res: 0.09, eng: 0 },
    { p: "google", id: "lg2", name: "Performance Max | Visitas à loja", base: 35, cpm: 19, ctr: 0.016, res: 0.06, eng: 0 },
  ],
  ecommerce: [
    { p: "google", id: "eg1", name: "Search | Marca", base: 160, cpm: 38, ctr: 0.11, res: 0.07, ticket: 690 },
    { p: "google", id: "eg2", name: "Shopping | Coleção verão", base: 420, cpm: 22, ctr: 0.012, res: 0.026, ticket: 610 },
    { p: "google", id: "eg3", name: "Performance Max | Catálogo", base: 380, cpm: 18, ctr: 0.014, res: 0.022, ticket: 640 },
    { p: "meta", id: "em1", name: "Prospecção | Lookalike compradoras", base: 360, cpm: 29, ctr: 0.012, res: 0.012, ticket: 590 },
    { p: "meta", id: "em2", name: "Remarketing | Carrinho abandonado", base: 160, cpm: 41, ctr: 0.021, res: 0.045, ticket: 720 },
    { p: "meta", id: "em3", name: "Advantage+ | Catálogo", base: 300, cpm: 26, ctr: 0.014, res: 0.02, ticket: 650 },
  ],
};

function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const dayFraction = () => { const n = new Date(); return Math.max(0.04, (n.getHours() * 3600 + n.getMinutes() * 60) / 86400); };

const BY_PROFILE = { awareness: "prefeitura", leads: "loja", sales: "ecommerce" };
const kitId = (client) => (CAMPAIGNS[client.id] ? client.id : BY_PROFILE[client.profile] || "loja");
const campaignsFor = (client) => CAMPAIGNS[kitId(client)].filter((c) => client.platforms[c.p]);

export function demoRows(client, from, to) {
  const rows = [];
  const t = today();
  const epoch = new Date(2026, 0, 1);
  for (let d = parseISO(from); iso(d) <= to; d.setDate(d.getDate() + 1)) {
    const date = iso(d);
    if (date > t) break;
    const dow = d.getDay();
    const weekday = dow === 0 ? 0.75 : dow === 6 ? 0.88 : 1;
    const trend = 1 + ((d - epoch) / 864e5) * 0.0012;
    const partial = date === t ? dayFraction() : 1;
    for (const c of campaignsFor(client)) {
      const rnd = seeded(`${client.id}|${date}|${c.id}`);
      const spend = c.base * weekday * trend * (0.82 + rnd() * 0.36) * partial;
      const impressions = Math.round((spend / c.cpm) * 1000);
      const clicks = Math.round(impressions * c.ctr * (0.88 + rnd() * 0.24));
      const engagement = Math.round(impressions * (c.eng || 0) * (0.8 + rnd() * 0.4));
      const videoViews = Math.round(impressions * (c.vtr || 0) * (0.85 + rnd() * 0.3));
      const results = client.profile === "awareness" ? engagement : Math.round(clicks * (c.res || 0) * (client.profile === "sales" ? 0.19 : 1) * trend * (0.7 + rnd() * 0.6));
      const revenue = client.profile === "sales" ? results * c.ticket * (0.8 + rnd() * 0.4) : 0;
      rows.push({ date, platform: c.p, campaignId: c.id, campaign: c.name, spend: Math.round(spend * 100) / 100, impressions, clicks, results, revenue: Math.round(revenue * 100) / 100, engagement, videoViews });
    }
  }
  return rows;
}

// Alcance único: exibições da Meta ÷ frequência (que cresce com o tamanho do período)
function demoReach(client, rows, from, to) {
  const meta = rows.filter((r) => r.platform === "meta" && r.date >= from && r.date <= to);
  if (!meta.length) return null;
  const imp = meta.reduce((a, r) => a + r.impressions, 0);
  const days = Math.round((parseISO(to) - parseISO(from)) / 864e5) + 1;
  // Público pequeno (cidade) satura rápido: a frequência sobe mais depressa
  const [base, slope, cap] = client.profile === "awareness" ? [2.2, 0.13, 7.5] : [1.3, 0.055, 4.6];
  const frequency = Math.min(base + days * slope, cap) * (0.96 + seeded(`${client.id}${from}${to}`)() * 0.08);
  return { reach: Math.round(imp / frequency), frequency };
}

export function demoMetrics(client, from, to, split) {
  const rows = demoRows(client, from, to);
  const prevTo = iso(addDays(split, -1));
  return {
    rows,
    sources: { google: { ok: true }, meta: { ok: true } },
    updatedAt: new Date().toISOString(),
    summary: { current: demoReach(client, rows, split, to), previous: split > from ? demoReach(client, rows, from, prevTo) : null },
  };
}

/* ---------- Conteúdo: posts, calendário, relatórios, vendas ---------- */
const THEMES = {
  prefeitura: [
    ["Reels", "Vacina contra a gripe: onde se vacinar"], ["Carrossel", "IPTU 2027: 3 formas de pagar com desconto"], ["Imagem", "Agenda do Festival de Inverno"],
    ["Reels", "Bastidores da obra da nova ponte"], ["Carrossel", "Prestação de contas: onde foi investido"], ["Imagem", "Mutirão de limpeza no bairro Jardim"],
    ["Reels", "Prefeito responde: dúvidas sobre o transporte"], ["Carrossel", "Novos horários das UBS"], ["Imagem", "Inscrições abertas: cursos gratuitos"],
    ["Reels", "Moradora conta como a creche mudou sua rotina"], ["Imagem", "Alerta da Defesa Civil: chuvas"], ["Carrossel", "Programação de Natal na praça"],
  ],
  loja: [
    ["Reels", "Tour pela loja: novidades da semana"], ["Carrossel", "5 jeitos de decorar sala pequena"], ["Imagem", "Feirão de colchões: até 40% off"],
    ["Reels", "Montagem de guarda-roupa em 60 segundos"], ["Carrossel", "Antes e depois: quarto do cliente"], ["Imagem", "Entrega grátis em toda a cidade"],
    ["Reels", "Sofá retrátil: teste de conforto"], ["Carrossel", "Como escolher o colchão certo"], ["Imagem", "Horário especial de fim de ano"],
    ["Reels", "Depoimento: cliente há 10 anos"], ["Imagem", "Mesa de jantar em 10x sem juros"], ["Carrossel", "Tendências de decoração 2027"],
  ],
  ecommerce: [
    ["Reels", "Provador: 3 looks com a mesma saia"], ["Carrossel", "Coleção Verão: lookbook"], ["Imagem", "Frete grátis acima de R$ 399"],
    ["Reels", "Bastidores do ateliê"], ["Carrossel", "Guia de medidas sem erro"], ["Imagem", "Black Friday: lista VIP"],
    ["Reels", "Unboxing da embalagem nova"], ["Carrossel", "Como lavar linho sem estragar"], ["Imagem", "Última chance: peças com 30%"],
    ["Reels", "Cliente real: look do dia"], ["Imagem", "Nova cor: terracota"], ["Carrossel", "5 combinações para o Réveillon"],
  ],
};
const FOLLOWERS = { prefeitura: 41200, loja: 12800, ecommerce: 88300 };
const POST_DAYS = [1, 3, 5, 6]; // seg, qua, sex, sáb

function postSchedule(client, from, to) {
  const out = [];
  let n = 0;
  for (let d = parseISO(from); iso(d) <= to; d.setDate(d.getDate() + 1)) {
    if (!POST_DAYS.includes(d.getDay())) continue;
    const date = iso(d);
    const dayNum = Math.floor((d - new Date(2026, 0, 1)) / 864e5);
    const themes = THEMES[kitId(client)];
    const [format, title] = themes[Math.abs(dayNum) % themes.length];
    out.push({ date, format, title, n: n++ });
  }
  return out;
}

// Instagram + Página do Facebook (o Facebook alcança menos e engaja menos, como na vida real)
export function demoSocial(client, from, to) {
  const t = today();
  const base = FOLLOWERS[kitId(client)];
  const build = (network, followers, factor) => postSchedule(client, from, to < t ? to : t)
    .filter((p) => (p.date < t || new Date().getHours() >= 12) && (network === "instagram" || p.n % 2 === 0))
    .map((p) => {
      const rnd = seeded(`${client.id}|${network}|${p.date}`);
      const mult = p.format === "Reels" ? 0.9 + rnd() * 1.4 : p.format === "Carrossel" ? 0.35 + rnd() * 0.4 : 0.22 + rnd() * 0.3;
      const reach = Math.round(followers * mult * factor);
      const likes = Math.round(reach * (0.028 + rnd() * 0.03) * factor);
      const comments = Math.round(likes * (0.03 + rnd() * 0.06));
      const saves = network === "instagram" ? Math.round(likes * (p.format === "Carrossel" ? 0.35 : 0.08) * (0.6 + rnd())) : 0;
      const shares = Math.round(likes * (0.05 + rnd() * 0.12));
      const format = network === "facebook" && p.format === "Reels" ? "Vídeo" : p.format;
      return {
        id: `${client.id}-${network}-${p.date}`, network, date: `${p.date}T${p.format === "Reels" ? "18" : "11"}:30:00-03:00`, format, caption: p.title,
        permalink: null, thumbnail: null, likes, comments, saves, shares, reach,
        views: p.format === "Reels" ? Math.round(reach * (1.4 + rnd())) : 0,
        interactions: likes + comments + saves + shares, theme: p.n % 4,
      };
    })
    .reverse();
  return {
    instagram: client.has.instagram ? { connected: true, username: client.instagramUser || client.id, followers: base, posts: build("instagram", base, 1) } : { connected: false },
    facebook: client.has.facebook ? { connected: true, username: client.facebookName || client.name, followers: Math.round(base * 0.62), posts: build("facebook", Math.round(base * 0.62), 0.55) } : { connected: false },
  };
}

export function demoContent(client) {
  const t = today();
  const now = parseISO(t);
  const from = iso(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const to = iso(new Date(now.getFullYear(), now.getMonth() + 2, 0));
  const NETWORKS = ["Instagram", "Instagram", "Instagram + Facebook", "Instagram"];
  const calendar = postSchedule(client, from, to).map((p, i) => {
    const diff = Math.round((parseISO(p.date) - now) / 864e5);
    const rnd = seeded(`${client.id}|cal|${p.date}`)();
    const status = diff < 0 ? "publicado" : diff <= 3 ? "aprovado" : diff <= 10 ? (rnd < 0.65 ? "aprovacao" : "aprovado") : diff <= 20 ? "producao" : "planejado";
    return {
      id: `c${i}`, date: p.date, time: p.format === "Reels" ? "18:30" : "11:30", network: NETWORKS[i % 4], format: p.format, title: p.title,
      caption: `${p.title}. Texto completo da legenda com chamada para ação e hashtags da campanha.`,
      status, boost: rnd > 0.7, link: "",
    };
  });

  const reports = [];
  for (let m = 1; m <= 6; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    reports.push(REPORT_TEXT[client.profile](month, m));
  }

  let sales = null;
  if (client.has.sales) {
    sales = [];
    for (let d = addDays(now, -400); iso(d) <= t; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 5 && iso(d) !== t) continue; // registro semanal, às sextas
      const rnd = seeded(`${client.id}|sales|${iso(d)}`);
      const wa = Math.round(3 + rnd() * 5), store = Math.round(2 + rnd() * 4);
      sales.push({ date: iso(d), count: wa, value: Math.round(wa * (2200 + rnd() * 1400)), channel: "WhatsApp" });
      sales.push({ date: iso(d), count: store, value: Math.round(store * (1800 + rnd() * 1600)), channel: "Loja física" });
    }
  }
  return { calendar, sales, reports, errors: [] };
}

const REPORT_TEXT = {
  awareness: (month, i) => ({
    month,
    summary: ["Mês de maior alcance do semestre, puxado pela campanha de vacinação.", "Foco em prestação de contas e obras, com bom tempo de visualização dos vídeos.", "Campanhas de serviços (IPTU e UBS) com custo por pessoa abaixo da média.", "Festival de Inverno gerou o maior volume de interações do ano.", "Ajustamos a segmentação para cobrir todos os bairros com a mesma frequência.", "Mês de implantação: novas campanhas e padronização da linha visual."][i - 1],
    highlights: ["Vídeo da nova ponte passou de 60 mil visualizações", "Bairros da zona rural alcançados pela primeira vez", "Comentários positivos subiram após a série de bastidores"].slice(0, 2 + (i % 2)),
    next: ["Calendário do IPTU 2027 com desconto à vista", "Série de vídeos curtos com secretários respondendo dúvidas", "Campanha de prevenção para o período de chuvas"].slice(0, 2 + ((i + 1) % 2)),
  }),
  leads: (month, i) => ({
    month,
    summary: ["Feirão de colchões trouxe o menor custo por conversa do ano.", "Campanhas de raio de 15 km aumentaram o movimento na loja aos sábados.", "Remarketing para quem visitou o perfil teve a melhor taxa de resposta.", "Testamos novos criativos em vídeo; o tour pela loja venceu.", "Ajuste de horário dos anúncios: mais conversas no horário comercial.", "Início da parceria: configuração das campanhas de WhatsApp."][i - 1],
    highlights: ["Conversas no WhatsApp cresceram em relação ao mês anterior", "Vídeo do tour pela loja virou o anúncio principal", "Equipe passou a registrar vendas toda sexta"].slice(0, 2 + (i % 2)),
    next: ["Campanha de fim de ano com condição especial", "Mensagem automática de boas-vindas no WhatsApp", "Anúncio de rotas para quem está perto da loja"].slice(0, 2 + ((i + 1) % 2)),
  }),
  sales: (month, i) => ({
    month,
    summary: ["Black Friday antecipada elevou o faturamento online.", "Coleção nova com ROAS acima da meta no Shopping.", "Carrinho abandonado recuperou parte relevante das vendas.", "Novos criativos com clientes reais melhoraram a taxa de clique.", "Ajuste de lances reduziu o custo por venda.", "Estruturação do catálogo e do rastreamento de compras."][i - 1],
    highlights: ["ROAS do Shopping acima de 5x", "Remarketing com o menor custo por venda", "Reels de provador com o maior alcance orgânico"].slice(0, 2 + (i % 2)),
    next: ["Lista VIP de Black Friday", "Campanha de presentes de Natal", "Teste de anúncios em vídeo no YouTube"].slice(0, 2 + ((i + 1) % 2)),
  }),
};

/* ---------- YouTube (demonstração) ---------- */
const YT_TITLES = {
  prefeitura: ["Vacinação: tudo o que você precisa saber", "Obras da Av. Central — antes e depois", "IPTU com desconto: como pagar pelo celular", "Festival de Inverno 2026 — melhores momentos", "Prefeito responde: saúde nos bairros", "Novo hospital: tour completo", "Coleta seletiva: calendário por bairro", "Matrículas abertas na rede municipal"],
  loja: ["Tour pela loja nova", "Sofá retrátil: como escolher", "Antes e depois: sala de 12 m²", "5 erros ao montar a cozinha", "Black Friday: o que vale a pena", "Cliente real: apê decorado em 30 dias", "Tecidos que não mancham", "Cama box: guia rápido"],
  ecommerce: ["Lançamento coleção verão", "Como usar o sérum em 3 passos", "Unboxing do kit presente", "Rotina noturna em 5 minutos", "Resenha de cliente: 30 dias", "Os 3 mais vendidos do mês", "Live de lançamento — completa", "Pele oleosa: o que fazer"],
};
export function demoYouTube(client, from, to, prevFrom, prevTo) {
  const kit = kitId(client);
  const rnd = seeded(`yt:${client.id}`);
  const days = []; for (let d = parseISO(from); iso(d) <= to; d = addDays(d, 1)) days.push(iso(d));
  const base = { prefeitura: 1800, loja: 700, ecommerce: 2600 }[kit];
  const daily = days.map((date, i) => {
    const r = seeded(`yt:${client.id}:${date}`)();
    const views = Math.round(base * (0.7 + r * 0.8) * (1 + Math.sin(i / 3) * 0.15));
    return { date, views, paidViews: Math.round(views * (0.45 + r * 0.25)), minutes: Math.round(views * (2.4 + r)), gained: Math.round(views * 0.006 + r * 4), lost: Math.round(r * 3), likes: Math.round(views * 0.045), comments: Math.round(views * 0.006), shares: Math.round(views * 0.004) };
  });
  const tot = (rows, k = 1) => ({ views: rows.reduce((s, r) => s + r.views, 0) * k, minutes: rows.reduce((s, r) => s + r.minutes, 0) * k, avgDuration: 168, avgPercent: 46.3, gained: rows.reduce((s, r) => s + r.gained, 0) * k, lost: rows.reduce((s, r) => s + r.lost, 0) * k, likes: rows.reduce((s, r) => s + r.likes, 0) * k, comments: rows.reduce((s, r) => s + r.comments, 0) * k, shares: rows.reduce((s, r) => s + r.shares, 0) * k });
  const cur = { ...tot(daily), paidViews: daily.reduce((s, r) => s + r.paidViews, 0) };
  const prev = Object.fromEntries(Object.entries(cur).map(([k, v]) => [k, Math.round(v * 0.82)]));
  const totalViews = cur.views;
  const top = YT_TITLES[kit].map((title, i) => {
    const share = [0.27, 0.18, 0.13, 0.1, 0.08, 0.06, 0.05, 0.04][i];
    const views = Math.round(totalViews * share);
    const short = i % 3 === 2;
    return { id: `demo${i}`, paidViews: Math.round(views * [0.7, 0.15, 0.6, 0.05, 0.5, 0.1, 0.4, 0.2][i]), title, publishedAt: iso(addDays(to, -(i * 4 + 2))), thumbnail: null, duration: short ? 42 : 240 + i * 50, short, views, minutes: Math.round(views * (short ? 0.6 : 3.1)), avgDuration: short ? 36 : 150 + i * 10, avgPercent: short ? 82 - i : 52 - i * 2, likes: Math.round(views * (0.05 + rnd() * 0.02)), comments: Math.round(views * 0.006), shares: Math.round(views * 0.005), gained: Math.round(views * 0.008) };
  });
  return {
    connected: true, analytics: true, split: true,
    recent: Array.from({ length: 16 }, (_, i) => {
      const r = seeded(`ytr:${client.id}:${i}`)();
      const short = i % 3 === 1;
      const totalViews = Math.round((short ? 9000 : 3500) * (0.4 + r * 1.6) * (i < 3 ? 0.5 : 1));
      return { id: `demor${i}`, title: (short ? "Short · " : "") + YT_TITLES[kit][i % YT_TITLES[kit].length], publishedAt: new Date(Date.now() - (i * 3 + 1) * 864e5).toISOString(), thumbnail: null, duration: short ? 38 : 180 + i * 40, short,
        totalViews, totalLikes: Math.round(totalViews * (0.03 + r * 0.03)), totalComments: Math.round(totalViews * 0.004),
        period: i < 10 ? { views: Math.round(totalViews * 0.8), minutes: 0, avgPercent: short ? 78 : 45 + r * 15, likes: 0, comments: 0, shares: 0, gained: Math.round(r * 30) } : null };
    }),
    channel: { id: "UCdemo", name: client.name, handle: `@${kit}oficial`, thumbnail: null, banner: null, subscribers: { prefeitura: 28400, loja: 6100, ecommerce: 54200 }[kit], views: { prefeitura: 3120000, loja: 640000, ecommerce: 8900000 }[kit], videos: { prefeitura: 412, loja: 138, ecommerce: 520 }[kit], since: "2019-03-11T00:00:00Z" },
    current: cur, previous: prevFrom ? prev : null, daily, top,
    traffic: [["YT_SEARCH", 0.31], ["SUGGESTED", 0.27], ["BROWSE", 0.16], ["SHORTS", 0.12], ["EXT_URL", 0.07], ["SUBSCRIBER", 0.04], ["PLAYLIST", 0.03]].map(([source, f]) => ({ source, views: Math.round(totalViews * f), minutes: 0 })),
    devices: [["MOBILE", 0.71], ["DESKTOP", 0.17], ["TV", 0.09], ["TABLET", 0.03]].map(([device, f]) => ({ device, views: Math.round(totalViews * f) })),
    audience: [["age18-24", 9, 7], ["age25-34", 14, 13], ["age35-44", 12, 13], ["age45-54", 8, 9], ["age55-64", 5, 6], ["age65-", 2, 2]].flatMap(([age, m, f]) => [{ age, gender: "male", pct: m }, { age, gender: "female", pct: f }]),
    countries: [["BR", 0.93], ["PT", 0.03], ["US", 0.02], ["AR", 0.01]].map(([country, f]) => ({ country, views: Math.round(totalViews * f) })),
  };
}
