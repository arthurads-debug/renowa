# Renowa × PrioSafra — apresentação

Endereço: `/priosafra` (fora dos buscadores: `noindex`).

## Como apresentar
- **→ / ←**, espaço ou PageDown: avançar e voltar. Em alguns capítulos, a seta primeiro revela a próxima etapa (Instagram, potencial, condição comercial).
- **F**: tela cheia · **P**: pausar animações · **G**: apresentação guiada (avança sozinha) · **M**: capítulos.
- No celular: deslize para os lados ou use os botões de baixo.
- Link direto para um capítulo: `/priosafra/#instagram`, `#site`, `#atendente`, `#dashboard`, `#condicao`, `#economia`…

## Vídeo da proposta (capítulo 17)
Arquivos em `media/`: `proposta.mp4` (versão leve), `proposta.jpg` (capa) e `proposta.vtt` (legendas). O código-fonte e os comandos de renderização ficam em `../video-priosafra/README.md`. Por enquanto o vídeo está sem narração.

## Onde mudar os dados
Tudo fica em `config.js`: empresa, cores, marcas, região, WhatsApp, fotos, produtos, valores, escopo, cronograma, artes do Instagram e dados de demonstração.

## Pendências antes de virar material público (confirmar com a PrioSafra)
| Item | Situação |
|---|---|
| Logotipo oficial (SVG/PNG em alta) | Usamos uma reconstrução vetorial a partir do PDF da proposta. Trocar em `lib.js` (`markPrio`). |
| Marcas (Priorizi, Gransafra, Semembrás) | Grafia conforme a bio do Instagram. Vínculo comercial a validar por escrito. |
| WhatsApp comercial | Usamos o número público da bio (Márcio). Confirmar qual número recebe os atendimentos. |
| Horário e endereço | A confirmar. |
| Produtos, especificações, preços e estoque | Não publicados. O protótipo mostra só categorias e marcas. |
| História, missão e diferenciais | Textos marcados como "a aprovar". |
| Fotografias | Unsplash (licença gratuita), ilustrativas, até a captação própria. |
| Perfil atual do Instagram | Captura pública de 26/11/2026 (899 seguidores, 196 posts). |

## O que é demonstração
- Painel (capítulos 9 e 10): números gerados por semente fixa, sempre com o aviso "Dados demonstrativos". Não chamam nenhuma API.
- Assistente PrioSafra: fluxo local, sem IA paga e sem enviar dados. O botão do WhatsApp real só abre se clicado.
- Formulário do site: não envia nada.

## Integrações reais (dependem de credenciais)
O painel real é a área do cliente da Renowa (`/cliente`). Para a PrioSafra entrar lá:
- **Meta Marketing API / Instagram Insights**: conectar o login do Facebook que administra a conta de anúncios e a página.
- **Google Ads API**: conectar a conta, se houver campanhas no Google.
- **YouTube Analytics**: só se houver canal.
- **Google Analytics 4 + eventos do site**: entram quando o site novo for publicado. Ainda não existem no painel.
- **Assistente com IA real**: endpoint no servidor, com a chave só no servidor, respondendo apenas com a base aprovada pela PrioSafra.

## Valores (conferidos)
- Individual: R$ 6.550 a R$ 7.250 por mês, mais R$ 3.000 do site.
- Renowa: R$ 3.900 por mês.
- Economia: R$ 2.650 a R$ 3.350 por mês; R$ 5.650 a R$ 6.350 no 1º mês; R$ 34.800 a R$ 43.200 em 12 meses.
