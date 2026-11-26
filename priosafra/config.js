// =====================================================================
// RENOWA × PRIOSAFRA — dados da apresentação
// Tudo o que muda de cliente para cliente fica aqui: nome, cores, produtos,
// marcas, contatos, valores, escopo, cronograma e dados de demonstração.
// Itens com `confirmar: true` ainda precisam do OK da PrioSafra antes de virar material público.
// =====================================================================

const U = (id, w = 2000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=78`;

export const EMPRESA = {
  nome: "PrioSafra Agronegócio",
  nomeCurto: "PrioSafra",
  instagram: "priosafra",
  instagramUrl: "https://www.instagram.com/priosafra/",
  cidade: "Paragominas, PA",
  segmento: "Comercialização e representação de sementes",
  categorias: ["Milho", "Sorgo", "Pastagens"],
  // Como está hoje no Instagram (consultado em 26/11/2026)
  perfilAtual: {
    seguidores: "899",
    seguindo: "1.213",
    posts: "196",
    bio: ["PRIOSAFRA", "REPRESENTANTE COMERCIAL:", "SORGO E MILHO( PRIORIZI E GRANSAFRA)", "SEMENTES DE CAPIM (SEMEMBRÁS)", "(91)98191 33 19 MÁRCIO", "(91) 98226 98 84", "PARAGOMINAS"],
    consultadoEm: "26/11/2026",
    grade: "assets/instagram-atual-grade.jpg", // captura real da grade pública
  },
};

// Cores do logotipo (amostradas do material da proposta)
export const CORES = {
  floresta: "#0B4A32",
  profundo: "#052A1D",
  folha: "#1F8F4E",
  dourado: "#B8955B",
  douradoClaro: "#D9BD86",
  marfim: "#F5F4EE",
  branco: "#FFFFFF",
  grafite: "#121A16",
};

// Marcas — conforme a bio atual do Instagram. Vínculo comercial a validar por escrito.
export const MARCAS = [
  { nome: "Priorizi", linha: "Sorgo e milho", confirmar: true },
  { nome: "Gransafra", linha: "Sorgo e milho", confirmar: true },
  { nome: "Semembrás", linha: "Sementes de capim (pastagens)", confirmar: true },
];

export const REGIAO = [
  { nome: "Paragominas", lat: -2.997, lng: -47.353, base: true },
  { nome: "Ipixuna do Pará", lat: -2.556, lng: -47.505 },
  { nome: "Tomé-Açu", lat: -2.418, lng: -48.152 },
  { nome: "Ulianópolis", lat: -3.750, lng: -47.489 },
  { nome: "Dom Eliseu", lat: -4.286, lng: -47.554 },
];
export const REFERENCIAS_MAPA = [
  { nome: "Belém", lat: -1.456, lng: -48.490 },
  { nome: "Marabá", lat: -5.369, lng: -49.117 },
  { nome: "Imperatriz (MA)", lat: -5.526, lng: -47.478 },
];

// WhatsApp: o número público da bio. Confirmar qual número recebe os atendimentos antes de publicar o site real.
export const CONTATO = {
  whatsapp: "5591981913319",
  whatsappLabel: "(91) 98191-3319 · Márcio",
  confirmarWhatsapp: true,
  horario: "A confirmar com a PrioSafra",
  endereco: "Paragominas, PA · endereço a confirmar",
};

// Fotografias — Unsplash (licença gratuita). Ilustrativas: serão trocadas pela captação própria.
export const FOTOS = {
  abertura: U("photo-1655319446881-2c34b11cfb02", 2400),
  aereaLinhas: U("photo-1560493676-04071c5f467b"),
  aereaTrator: U("photo-1619719826894-89d6c4fd5739"),
  aereaFileiras: U("photo-1545292470-391a7b77b8a2"),
  milhoCeu: U("photo-1704692225223-afc06ae5d764"),
  milhoSol: U("photo-1530797670390-7b7118ec3f3a"),
  milhoEspiga: U("photo-1649251037566-6881b4956615"),
  sorgoCampo: U("photo-1591270988242-17541ba0429e"),
  sorgoClose: U("photo-1758356860542-a2df92aad294"),
  pastagem: U("photo-1695647605702-c534fd480b92"),
  nelore: U("photo-1788157980088-f37fe2f4714f"),
  produtor: U("photo-1670927519969-dc5065aa5641"),
  produtorCaminho: U("photo-1626488033090-79f63fd81a75"),
  trator: U("photo-1723714372451-940b9ab6ab92"),
  sementesMao: U("photo-1615671524775-85bd1c1d9cd3"),
  encerramento: U("photo-1507249432764-4dca63bbd336", 2400),
};

export const PRODUTOS = {
  milho: {
    titulo: "Sementes de milho", foto: FOTOS.milhoEspiga, capa: FOTOS.milhoCeu,
    marcas: ["Priorizi", "Gransafra"],
    texto: "Híbridos das marcas representadas, com orientação para escolher a opção certa para cada propriedade e janela de plantio.",
  },
  sorgo: {
    titulo: "Sementes de sorgo", foto: FOTOS.sorgoClose, capa: FOTOS.sorgoCampo,
    marcas: ["Priorizi", "Gransafra"],
    texto: "Opções de sorgo para grão, silagem e integração, com atendimento próximo da equipe comercial.",
  },
  pastagens: {
    titulo: "Sementes de pastagens", foto: FOTOS.pastagem, capa: FOTOS.nelore,
    marcas: ["Semembrás"],
    texto: "Sementes de capim para formação e recuperação de pastos, com atendimento para pecuaristas da região.",
  },
};

// Valores — da proposta comercial anterior (estimativas da própria proposta, não cotações independentes).
export const VALORES = {
  pacote: 3900,
  avulso: [
    { item: "Captação audiovisual", min: 1500, max: 1500, nota: "6 vídeos × R$ 250" },
    { item: "Social media", min: 1500, max: 1500, nota: "Planejamento, calendário e gestão" },
    { item: "Design gráfico", min: 1500, max: 2000, nota: "Flyers, artes do feed e capas" },
    { item: "Gestão de tráfego", min: 1800, max: 2000, nota: "Campanhas e otimização, sem a verba" },
    { item: "Manutenção do site", min: 250, max: 250, nota: "Mensal" },
  ],
  siteDesenvolvimento: 3000,
  siteManutencao: 250,
};

export const ESCOPO = [
  "Gestão estratégica de marketing",
  "Reposicionamento digital",
  "Gestão completa do Instagram",
  "Planejamento editorial",
  "Design gráfico",
  "Seis vídeos mensais com captação profissional",
  "Gestão de tráfego pago",
  "Direção criativa",
  "Acompanhamento estratégico",
  "Dashboard de resultados",
  "Site institucional e comercial",
  "Atendimento virtual 24 horas",
  "Manutenção do site durante a vigência da contratação",
];

export const VOLUME = [
  { n: "3", t: "publicações por semana" },
  { n: "12–14", t: "conteúdos por mês" },
  { n: "6", t: "vídeos por mês", s: "4 principais + 2 complementares" },
];

export const PILARES = [
  { id: "tecnico", nome: "Técnico", cor: "#1F8F4E", icone: "leaf", texto: "Conteúdo educativo, conhecimento sobre sementes, critérios de escolha e informações relevantes ao produtor." },
  { id: "produto", nome: "Produto", cor: "#B8955B", icone: "corn", texto: "Apresentação das categorias comercializadas, características verificadas e marcas representadas." },
  { id: "campo", nome: "Campo", cor: "#3C7A5A", icone: "sun", texto: "Visitas, bastidores, lavouras e presença regional." },
  { id: "institucional", nome: "Institucional", cor: "#0B4A32", icone: "shield", texto: "História, posicionamento, equipe, relacionamento e valores da empresa." },
  { id: "comercial", nome: "Comercial", cor: "#8A6A35", icone: "chart", texto: "Campanhas, produtos, oportunidades e chamadas para atendimento." },
];

export const CRONOGRAMA = [
  { fase: "Mês 1", nome: "Estruturação", itens: ["Reunião de alinhamento", "Diagnóstico digital", "Definição da estratégia", "Reformulação do Instagram", "Planejamento editorial", "Início da produção audiovisual", "Desenvolvimento do site", "Configuração das ferramentas de monitoramento", "Estruturação inicial das campanhas"] },
  { fase: "Mês 2", nome: "Expansão", itens: ["Intensificação da produção de conteúdo", "Publicação do site, após aprovação", "Implementação do atendimento virtual", "Campanhas de reconhecimento e relacionamento", "Ativação do painel de acompanhamento, conforme integrações disponíveis", "Análise do comportamento do público"] },
  { fase: "Mês 3", nome: "Otimização", itens: ["Análise dos indicadores", "Aprimoramento dos criativos", "Otimização das campanhas", "Fortalecimento das oportunidades comerciais", "Aperfeiçoamento do site e atendimento", "Planejamento do próximo ciclo estratégico"] },
];

export const COMPETENCIAS = [
  { nome: "Gestão estratégica de marketing", texto: "Define prioridades, metas e o rumo da operação, mês a mês." },
  { nome: "Direção criativa", texto: "Garante que cada peça fale a mesma língua visual da PrioSafra." },
  { nome: "Social media", texto: "Planeja o calendário, escreve legendas e cuida da rotina do perfil." },
  { nome: "Design gráfico", texto: "Cria flyers, carrosséis, capas de reels e materiais comerciais." },
  { nome: "Produção audiovisual", texto: "Planeja e capta os vídeos no campo, na loja e com a equipe." },
  { nome: "Edição de vídeo", texto: "Transforma a captação em reels e vídeos com ritmo e clareza." },
  { nome: "Gestão de tráfego", texto: "Configura, distribui e otimiza os anúncios na região certa." },
  { nome: "Desenvolvimento web", texto: "Constrói e mantém o site institucional e comercial." },
  { nome: "Automação de atendimento", texto: "Configura a assistente virtual e o encaminhamento ao WhatsApp." },
  { nome: "Análise de dados", texto: "Lê os números do painel e transforma em decisões." },
];

export const MODULOS = [
  { id: "estrategia", nome: "Estratégia de marketing", texto: "O plano que conecta todas as frentes: público, mensagem, canais e metas de cada ciclo." },
  { id: "identidade", nome: "Identidade visual", texto: "Padroniza cores, tipografia e aplicações para a marca ser reconhecida em qualquer canal." },
  { id: "social", nome: "Social media", texto: "Calendário, legendas, stories e gestão diária do Instagram." },
  { id: "audiovisual", nome: "Produção audiovisual", texto: "Seis vídeos por mês captados no campo, com a equipe e com os produtos." },
  { id: "design", nome: "Design profissional", texto: "Flyers, carrosséis, capas de reels e materiais comerciais." },
  { id: "trafego", nome: "Tráfego pago", texto: "Anúncios direcionados a produtores de Paragominas e região." },
  { id: "site", nome: "Desenvolvimento de site", texto: "Vitrine institucional e comercial, pronta para receber contatos." },
  { id: "atendimento", nome: "Atendimento virtual inteligente", texto: "Recebe o visitante, organiza o pedido e encaminha para o WhatsApp." },
  { id: "dados", nome: "Inteligência de dados", texto: "Leitura do que funciona para orientar conteúdo e investimento." },
  { id: "dashboard", nome: "Dashboard de performance", texto: "Indicadores centralizados na área de clientes da Renowa." },
  { id: "oportunidades", nome: "Geração de oportunidades", texto: "Caminho organizado do primeiro contato até a conversa com o comercial." },
];

// As 12 artes conceituais do novo feed (layouts em app; fotos ilustrativas)
export const ARTES = [
  { titulo: "Grandes resultados começam pela escolha da semente.", tipo: "Institucional", layout: "full", foto: "sementesMao", legenda: "A safra começa muito antes do plantio: começa na escolha certa. A PrioSafra está ao lado do produtor nessa decisão.", objetivo: "Posicionar a PrioSafra como parceira da decisão, não só como vendedora." },
  { titulo: "Conhecimento que gera produtividade.", tipo: "Técnico", layout: "split", foto: "produtor", legenda: "Informação boa vale tanto quanto uma boa semente. Siga para conteúdos técnicos toda semana.", objetivo: "Abrir a linha de conteúdo técnico e construir autoridade." },
  { titulo: "Milho: planejamento para a próxima safra.", tipo: "Produto", layout: "card", foto: "milhoEspiga", tag: "MILHO", legenda: "Planejar cedo é garantir o material certo na hora certa. Fale com a nossa equipe e organize sua safra.", objetivo: "Gerar conversas de planejamento antes do pico de demanda." },
  { titulo: "Sorgo: conheça as possibilidades para sua propriedade.", tipo: "Produto", layout: "full", foto: "sorgoCampo", tag: "SORGO", legenda: "Grão, silagem ou integração: o sorgo tem espaço em muitas propriedades da região. Converse com a gente.", objetivo: "Apresentar a categoria e despertar o interesse do produtor." },
  { titulo: "Pastagens: a base de uma pecuária produtiva.", tipo: "Produto", layout: "split", foto: "nelore", tag: "PASTAGENS", legenda: "Pasto bem formado é rebanho forte. Sementes de capim com atendimento para o pecuarista da região.", objetivo: "Falar diretamente com o pecuarista e abrir a linha de pastagens." },
  { titulo: "PrioSafra mais perto do produtor.", tipo: "Institucional", layout: "quote", foto: "produtorCaminho", legenda: "Atendimento de quem conhece a região: Paragominas, Ulianópolis, Dom Eliseu, Ipixuna e Tomé-Açu.", objetivo: "Reforçar a presença regional e o atendimento próximo." },
  { titulo: "Por dentro das nossas visitas ao campo.", tipo: "Campo", layout: "reel", foto: "aereaTrator", legenda: "Acompanhe as visitas da equipe às propriedades da região. Bastidores reais, toda semana.", objetivo: "Mostrar presença real no campo e gerar proximidade." },
  { titulo: "A importância da escolha de sementes.", tipo: "Técnico", layout: "carousel", foto: "milhoCeu", legenda: "Carrossel: 4 pontos para considerar antes de escolher a semente da próxima safra. Salve para consultar depois.", objetivo: "Conteúdo salvável que gera alcance e autoridade técnica." },
  { titulo: "Conheça nossas marcas representadas.", tipo: "Produto", layout: "brands", foto: "aereaLinhas", legenda: "Priorizi, Gransafra e Semembrás: marcas que a PrioSafra representa em Paragominas e região.", objetivo: "Valorizar as marcas representadas e dar segurança na compra." },
  { titulo: "Planejamento é parte da produtividade.", tipo: "Técnico", layout: "card", foto: "trator", legenda: "Produtividade se constrói com planejamento: área, janela, material e acompanhamento.", objetivo: "Educar e preparar o produtor para a conversa comercial." },
  { titulo: "Do atendimento ao campo.", tipo: "Institucional", layout: "reel", foto: "aereaFileiras", legenda: "Da primeira conversa até a lavoura: a PrioSafra acompanha cada etapa.", objetivo: "Contar a jornada do cliente e gerar confiança." },
  { titulo: "Sua próxima safra começa aqui.", tipo: "Comercial", layout: "cta", foto: "milhoSol", legenda: "Solicite seu atendimento pelo WhatsApp ou pelo link da bio. Nossa equipe responde e organiza seu orçamento.", objetivo: "Chamada direta para orçamento: transformar alcance em contato." },
];

export const DESTAQUES = [
  { nome: "Milho", icone: "corn" }, { nome: "Sorgo", icone: "sorgo" }, { nome: "Pastagens", icone: "grass" },
  { nome: "Campo", icone: "sun" }, { nome: "Parceiros", icone: "handshake" }, { nome: "Dicas", icone: "bulb" }, { nome: "Contato", icone: "phone" },
];

export const BIO_NOVA = ["PrioSafra Agronegócio", "Sementes para quem busca produtividade.", "Milho | Sorgo | Pastagens", "Paragominas e região", "Solicite seu atendimento abaixo."];

// Produção audiovisual
export const AUDIOVISUAL = {
  processo: ["Planejamento", "Roteiro", "Captação", "Edição", "Publicação", "Distribuição"],
  formatos: [
    { nome: "Captação em lavouras", foto: "milhoCeu", texto: "Imagens do campo que mostram o produto onde ele faz diferença." },
    { nome: "Visitas a propriedades", foto: "produtor", texto: "A equipe ao lado do produtor, registrada de forma natural." },
    { nome: "Conteúdo técnico", foto: "sementesMao", texto: "Explicações curtas e claras, gravadas com quem entende." },
    { nome: "Filmagens aéreas", foto: "aereaLinhas", texto: "Drone quando planejado, autorizado e seguro." },
    { nome: "Bastidores", foto: "trator", texto: "O dia a dia da operação, do atendimento à entrega." },
    { nome: "Reels comerciais", foto: "sorgoCampo", texto: "Chamadas diretas para atendimento e orçamento." },
  ],
};

// Dados de demonstração do painel — NÃO são resultados da PrioSafra.
export const DEMO = {
  aviso: "Dados demonstrativos — ilustram o painel, não são resultados da PrioSafra.",
  periodos: { "7": 7, "30": 30, "90": 90 },
  campanhas: [
    { nome: "Reconhecimento · Paragominas e região", objetivo: "Alcance", peso: 0.42 },
    { nome: "Conteúdo técnico · Milho", objetivo: "Engajamento", peso: 0.24 },
    { nome: "Pastagens · Pecuaristas", objetivo: "Mensagens", peso: 0.2 },
    { nome: "Orçamento · WhatsApp", objetivo: "Conversas", peso: 0.14 },
  ],
  criativos: ["Reel · Visita ao campo", "Carrossel · Escolha da semente", "Arte · Próxima safra", "Reel · Pastagens"],
  paginas: [["Página inicial", 0.38], ["Sementes de milho", 0.22], ["Sementes de pastagens", 0.15], ["Sementes de sorgo", 0.12], ["Contato", 0.08], ["Parceiros", 0.05]],
  origens: [["Instagram", 0.41], ["Anúncios Meta", 0.27], ["Google", 0.18], ["Direto", 0.09], ["Outros", 0.05]],
};

export const RENOWA = { nome: "Renowa", painel: "renowa-theta.vercel.app/cliente" };
