# Área do Cliente e Painel da Agência — guia de configuração

São três áreas:

- **Site (`/`) → Questionário de aplicação.** O visitante responde 8 perguntas e vê na hora um **gráfico de compatibilidade** com a Renowa. Depois deixa o contato, e a aplicação cai direto no CRM.

- **`/admin` — Painel da agência (uso interno).** Você cadastra cada cliente, escolhe o objetivo dele e **seleciona, em listas, as contas específicas desse cliente**: a conta do Google Ads (dentre as que estão na sua MCC), a conta de anúncios da Meta, a Página do Facebook e o Instagram (dentre os que estão no seu Business Manager). O botão **Ver relatório** abre o painel exatamente como o cliente vê.
- **`/cliente` — Relatório do cliente.** Cada cliente entra com o próprio e-mail e senha e vê, **na mesma página**, os dados de todas as contas vinculadas a ele, e de nenhuma outra.

| Seção do relatório | O que mostra | De onde vem |
|---|---|---|
| **Resumo** | Frase do período, números do objetivo do cliente, contas conectadas, próximas publicações e recado da agência | Tudo abaixo |
| **Anúncios** | Investimento, resultados, Google × Meta e campanhas | Conta Google Ads + conta Meta Ads do cliente |
| **Social media** | Instagram e Facebook lado a lado: seguidores, posts, alcance, engajamento e melhores posts | Instagram + Página do Facebook do cliente |
| **Calendário** | O que vai ser publicado, com aprovação pelo WhatsApp | Planilha Google |
| **Histórico** | 12 meses e relatórios mensais | APIs + planilha |

## O ponto principal: cada cliente tem um objetivo diferente

Nem todo cliente vende pelo site. Por isso cada um é cadastrado com um **perfil**, e o painel muda os números que mostra:

### `awareness` — Divulgação (prefeituras, institucional, marca)
Não tem venda. O que importa é **quantas pessoas viram a mensagem e quanto custou chegar até elas**.
- Mostra: pessoas alcançadas, vezes que os anúncios apareceram, frequência, visualizações de vídeo, custo por pessoa alcançada.
- Com `city.population` cadastrado, mostra **"o equivalente a X% da população"**, um número que o gestor público entende na hora.
- Não mostra ROI, ROAS nem "custo por venda".

### `leads` — Contato e loja física (a maioria dos seus clientes)
A venda acontece no WhatsApp ou na loja, fora do alcance das plataformas.
- Mostra: conversas no WhatsApp, custo por conversa, pessoas alcançadas e o **funil "do anúncio até a venda"**.
- **Vendas informadas:** a equipe do cliente registra toda semana, num Google Forms, quantas vendas fez e quanto faturou (WhatsApp / loja). O painel cruza com o investimento e mostra o **retorno estimado**, deixando claro que é estimativa.
- Se o cliente fica mais de 8 dias sem registrar, o Resumo mostra um lembrete.

### `sales` — Vendas online (e-commerce)
Aqui o rastreamento funciona, e o painel mostra receita, custo por venda e ROAS.

> Por que não forçar ROI em todo mundo: mostrar "ROAS 0,3x" para quem vende na loja física faz o cliente achar que o marketing não funciona, quando na verdade a venda só não é rastreável. Cada perfil mostra o que dá para medir com honestidade.

---

## Passo 1 — Publicar na Vercel

1. Suba a pasta para um repositório no GitHub e importe na Vercel (Framework: **Other**, sem comando de build).
2. **Banco de dados dos clientes:** no projeto, vá em **Storage → Create → Upstash for Redis** e conecte ao projeto. A Vercel cria sozinha `KV_REST_API_URL` e `KV_REST_API_TOKEN`. É onde o painel salva os clientes e as contas vinculadas.
3. Em **Settings → Environment Variables**, cadastre as variáveis do `.env.example`:
   - `SESSION_SECRET`:
     ```bash
     python3 -c "import secrets;print(secrets.token_urlsafe(48))"
     ```
   - Seu acesso ao painel: `ADMIN_EMAIL` e `ADMIN_PASSWORD_HASH` (gere o hash com `python3 tools/criar_senha.py`). Para vários membros da equipe, use `ADMINS_JSON`.
   - `AGENCY_WHATSAPP` (só números, com 55 e DDD).
4. Faça o deploy e abra `/admin`. Enquanto faltar alguma credencial, o painel mostra uma lista do que falta.

## Passo 2 — Google Ads (uma vez, para a agência)

| Variável | Onde conseguir |
|---|---|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Conta administradora (MCC) → **Ferramentas → Centro de API**. Peça o nível **Basic Access**. |
| `GOOGLE_ADS_CLIENT_ID` / `_SECRET` | Google Cloud Console → ative a **Google Ads API** → **Credenciais → ID do cliente OAuth**. |
| `GOOGLE_ADS_REFRESH_TOKEN` | Fluxo OAuth com o escopo `https://www.googleapis.com/auth/adwords` (ex.: [OAuth Playground](https://developers.google.com/oauthplayground) com suas credenciais). |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | ID da MCC, só números. |

Por cliente: vincule a conta à sua MCC e use o ID (`123-456-7890`) em `googleAds.customerId`.
**Resultado = conversões principais da conta.** Para lojas físicas, configure no Google Ads como conversão: cliques no WhatsApp, ligações e rotas para a loja.

## Passo 3 — Meta (anúncios, Facebook e Instagram)

Um único token serve para todos os clientes:

1. No **Business Manager da agência**, cada cliente precisa ter compartilhado com você a conta de anúncios, a Página do Facebook e o Instagram (como parceiro ou dono).
2. **Configurações do negócio → Usuários → Usuários do sistema**: crie um usuário (ex.: "Relatórios") e, em **Atribuir ativos**, dê acesso de leitura às contas de anúncio, páginas e contas do Instagram dos clientes.
3. Gere o token desse usuário com as permissões:
   `ads_read`, `pages_show_list`, `pages_read_engagement`, `read_insights`, `instagram_basic`, `instagram_manage_insights`.
4. Cole em `META_ACCESS_TOKEN`. Opcional: `META_APP_SECRET` (ativa o `appsecret_proof`).

As listas de **contas de anúncio, páginas e Instagram** que aparecem no painel são exatamente os ativos atribuídos a esse usuário do sistema. Se um cliente novo não aparece, atribua os ativos dele e clique em **Atualizar listas** no painel.

**O que conta como resultado na Meta** (escolhido no painel, por cliente): conversas iniciadas (WhatsApp/Messenger/Direct), leads de formulário, compras no site ou cadastros. Para clientes de divulgação não é preciso escolher.

> **Alcance** (pessoas diferentes) vem só da Meta, porque o Google não informa pessoas únicas. O relatório deixa isso escrito ao lado do número.

## Passo 4 — Planilhas: calendário, vendas e relatórios

Sem banco de dados: a agência (e o cliente, no caso das vendas) trabalha em **Google Sheets**, que já é o que a equipe usa. Modelos prontos em `/modelos`:

| Arquivo | Quem preenche | Colunas |
|---|---|---|
| `modelos/calendario.csv` | Social media da agência | Data, Hora, Rede, Formato, Tema, Legenda, Status, Impulsionar, Link |
| `modelos/vendas.csv` | Equipe do cliente (via Google Forms) | Data, Vendas, Valor, Canal, Observação |
| `modelos/relatorios.csv` | Gestor da conta, todo mês | Mês, Resumo, Destaques, Próximos passos |

**Status aceitos no calendário:** Planejado · Em produção · Aguardando aprovação · Aprovado · Publicado.
Posts "Aguardando aprovação" ganham os botões **Aprovar** e **Pedir ajuste**, que abrem o WhatsApp da agência com a mensagem pronta.

**Destaques e Próximos passos:** separe os itens com `;`.

Como conectar cada planilha:
1. Crie uma planilha por cliente, com uma aba para cada modelo (importe o CSV: **Arquivo → Importar**).
2. **Arquivo → Compartilhar → Publicar na Web** → escolha a aba → formato **CSV** → Publicar.
3. Cole o link gerado em `sheets.calendar`, `sheets.sales` ou `sheets.reports` do cliente.

Para as vendas: crie um **Google Forms** com os campos Data, Vendas, Valor e Canal, ligue as respostas a essa aba e coloque o link do formulário em `salesFormUrl`. O cliente clica em **Registrar vendas** no painel e preenche em 30 segundos.

> O link publicado não aparece para o cliente (só o servidor o lê), mas quem tiver o link consegue abrir a planilha. Não coloque dados sensíveis nela. Para mais sigilo, o próximo passo é trocar por uma conta de serviço do Google.

As planilhas são relidas a cada 2 minutos.

## Passo 5 — Cadastrar um cliente (pelo painel)

Em `/admin` → **Novo cliente**:

1. **Cliente e acesso:** nome, contato, e-mail e senha que o cliente vai usar (mínimo 10 caracteres; a senha é guardada criptografada). Para bloquear o acesso sem apagar, desligue **Acesso ao relatório ativo**.
2. **Objetivo:** Divulgação, Contato e loja física ou Vendas online, e o nome do resultado ("Agendamentos", "Conversas no WhatsApp"…). Em Divulgação, informe cidade e população para mostrar "% da população alcançada".
3. **Contas:** escolha nas listas a conta do Google Ads, a conta de anúncios da Meta, a Página do Facebook e o Instagram. Ao escolher a página, o Instagram ligado a ela é selecionado junto. Também dá para digitar o ID manualmente.
4. **Calendário, relatórios e vendas:** links CSV das planilhas (veja o Passo 4) e o Google Forms de vendas.
5. **Recado:** aparece no topo do relatório; atualize quando quiser.

Salve, clique em **Ver relatório** para conferir e envie o e-mail e a senha ao cliente. Mudanças nas contas passam a valer em poucos segundos.

> Ainda dá para cadastrar clientes fixos pela variável `CLIENTS_JSON` (formato no `.env.example`). Se o mesmo `id` existir nos dois, vale o do painel.

## Passo 6 — CRM de leads (aplicações do site)

Não precisa de nenhuma conta extra: usa o mesmo banco do Passo 1.

**Como chega:** o questionário do site envia para `POST /api/lead`. O servidor:
- **refaz a classificação** sozinho, sem confiar no navegador;
- aceita só envios do próprio domínio, no máximo 5 por IP a cada 10 minutos, e descarta robôs com um campo-isca.

**Como se classifica** (regra em `api/_lib/leads.js`, a mesma de `assets/quiz.js`):

| Perfil | Regra | O que o visitante vê |
|---|---|---|
| **Qualificado** | Fatura acima de R$ 100 mil/mês **e** investe R$ 3 mil/mês ou mais na equipe | 86–98% de compatibilidade e "temos uma proposta que se encaixa perfeitamente…" |
| **Para avaliar** | Está um degrau abaixo em faturamento **ou** em investimento | 55–79% e "existe compatibilidade, com alguns ajustes" |
| **Fora do perfil** | Abaixo nos dois | 18–49% e uma recusa educada |

Entre os qualificados, a **prioridade A** vai para quem tem verba de anúncios alta, quer começar em até 30 dias e é dono ou diretor. Os demais qualificados ficam com prioridade B.

**No painel (`/admin` → aba Leads):**
- **Resumo do topo:** novos para atender, retornos vencidos, valor em proposta e valor fechado.
- **Funil:** Novo → Em contato → Diagnóstico → Proposta → Fechado / Perdido, com filtro por perfil.
- **Em cada lead:**
  - Todas as respostas.
  - Botão de WhatsApp com mensagem pronta.
  - Etapa, valor mensal e data do próximo contato.
  - Notas com histórico.
  - **Converter em cliente**, que abre o cadastro do relatório já preenchido.

**Aviso de lead novo (opcional):** cadastre `LEAD_NOTIFY_WEBHOOK` com a URL de um cenário do Make, Zapier, n8n, Slack ou Discord. Cada aplicação nova é enviada para lá, por exemplo para avisar a equipe no WhatsApp.

> Se mudar o texto de uma opção do questionário em `assets/quiz.js`, mude igual em `api/_lib/leads.js`. A pontuação usa o texto da opção.

## Modo demonstração

Sem a API (abrindo com `python3 -m http.server`), as duas áreas entram em modo demonstração:
- `/admin`: entre com `agencia@demo.com.br` / `demo123`. As listas de contas são de exemplo, e os clientes que você cria ficam salvos só neste navegador.
- Questionário do site: sem a API, as aplicações ficam salvas neste navegador e aparecem na aba Leads do `/admin` de demonstração, junto com 7 leads de exemplo.
- `/cliente`: três clientes de exemplo (Prefeitura, Loja física, E-commerce) e os que você criar no painel; senha `demo123`. Clientes novos usam conteúdo de exemplo do perfil escolhido.

Para desligar, coloque `allowDemo: false` em `cliente/assets/portal.js`.

## Segurança

- Senhas com PBKDF2-SHA256 (210 mil iterações), comparação em tempo constante e o mesmo tempo de resposta para e-mail inexistente.
- Cookie `HttpOnly`, `Secure`, `SameSite=Lax`, assinado com HMAC e válido por 12 horas.
- Cada cliente só acessa as contas e planilhas configuradas para o próprio `id`. Tokens e links de planilha nunca chegam ao navegador.
- O painel `/admin` usa uma sessão separada, só para os e-mails cadastrados em `ADMIN_EMAIL`/`ADMINS_JSON`. "Ver relatório" abre uma sessão de cliente marcada como "vista pela agência".
- `/cliente` com `noindex`, `X-Frame-Options: DENY` e `nosniff`.

## Próximos passos recomendados

- **Conta de serviço do Google** no lugar das planilhas publicadas.
- **Relatório mensal automático em PDF por e-mail/WhatsApp** no dia 1º.
- **GA4 e Google Meu Negócio** (ligações, rotas e visualizações da ficha), um ótimo complemento para lojas físicas.
