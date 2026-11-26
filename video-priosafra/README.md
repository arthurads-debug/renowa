# Vídeo Renowa × PrioSafra

Vídeo de 2 min 38 s (1920×1080, 30 qps, narração, trilha e efeitos) feito em código. Usa os mesmos componentes visuais da apresentação `/priosafra`:
logotipos, artes do Instagram, site, assistente e painel.

- Motor: HTML + GSAP renderizado quadro a quadro pelo **HyperFrames** (`npx hyperframes@0.8.181`). É o mesmo pipeline do manifesto da Renowa.
- Animação determinística: tudo é função do tempo (`proj/motor.js`). Não há timers nem `Math.random`.
- Cenas: `proj/video.js` (cenas 1 a 6) e `proj/cenas2.js` (cenas 7 a 11).
- Roteiro e tempos: `proj/roteiro.js`. A narração de cada cena e o início/fim em segundos ficam aqui.
- Textos e valores: `proj/shared/config.js`, copiado de `priosafra/config.js` por `scripts/sync.sh`. Edite na apresentação e rode o sync.

## Comandos
```bash
# prévia rápida (draft) → output/priosafra-renowa-preview.mp4
bash scripts/render.sh previa
# final em alta → output/priosafra-renowa-sem-narracao.mp4
bash scripts/render.sh final
# mixagem narração + efeitos (com checagem de volume)
python3 scripts/mixar.py
# final com áudio, prévia leve, thumbnail, legendas e cópia para a apresentação (priosafra/media/)
bash scripts/finalizar.sh
# legendas (pelo roteiro, ou pela transcrição palavra a palavra da narração real)
node scripts/legendas.mjs [transcricao.json]
```

Ver uma cena no navegador: sirva a pasta `Agency/` (por exemplo `python3 -m http.server 5191`) e abra
`http://localhost:5191/video-priosafra/proj/index.html`. No console:
`(await import('./motor.js')).render(SEGUNDOS)`.

## Áudio
- **Narração**: voz Arnold (PT/BR), ElevenLabs `eleven_v4`, 153,4 s. Arquivo: `audio/narracao.mp3`.
  - O texto escreve "Renova" para a voz pronunciar certo; na tela, a marca continua "Renowa".
- **Trilha**: `audio/trilha.mp3` (ElevenLabs `eleven_music_v2_5`, 165 s).
  - Abaixa sozinha quando a voz ou um efeito entra (sidechain com voz + efeitos) e sobe nos respiros.
  - Com a voz falando, fica uns 22 dB abaixo dela; no encerramento, sem voz, sobe e fecha em fade.
- **Efeitos**: 8 sons gerados no ElevenLabs (`audio/sfx-*.mp3`), em 70 pontos sincronizados com as animações.
- **Sincronia**:
  - o vídeo foi escrito em 180 s ("tempo de autoria") e é ajustado cena a cena à fala gravada (`NARRADA` em `proj/roteiro.js`);
  - os pontos de troca de cena saíram das pausas medidas na voz (`audio/pausas.txt`, ffmpeg silencedetect).
- **Volume**: `python3 scripts/mixar.py`.
  - Cada efeito sai com pico de −29 dBFS e ainda abaixa sozinho quando a voz fala (sidechain).
  - O script mede a cada 0,2 s e falha se algum efeito chegar a menos de 6 dB da voz. Resultado atual: folga mínima de 17,2 dB.
  - A mixagem final fica em −16 LUFS.
- **Trocar a narração**:
  1. Gere o novo MP3 em `audio/narracao.mp3`.
  2. Rode `ffmpeg -i audio/narracao.mp3 -af silencedetect=noise=-38dB:d=0.35 -f null -` e atualize `NARRADA` e `ATRASO_VOZ`.
  3. Rode `bash scripts/render.sh final` e depois `bash scripts/finalizar.sh`.

## Regras de conteúdo respeitadas
- Nenhum número de seguidores, resultado, depoimento ou especificação técnica inventado.
- Os números do painel aparecem com o selo "Demonstração de interface — dados ilustrativos".
- Valores conforme a proposta. Verba de anúncios fora dos R$ 3.900. Site e manutenção como bônus.
- Fotos ilustrativas do Unsplash.
- Logo da PrioSafra reconstruído em vetor a partir do PDF. Trocar pelo oficial quando chegar.
