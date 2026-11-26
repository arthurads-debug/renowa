#!/usr/bin/env bash
# Junta o vídeo renderizado com a mixagem (narração + efeitos) e gera as versões de entrega.
# antes: bash scripts/render.sh final  e  python3 scripts/mixar.py
set -e
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH
V=output/priosafra-renowa-sem-narracao.mp4
A=audio/mix-final.wav
[ -f "$V" ] || { echo "Renderize antes: bash scripts/render.sh final"; exit 1; }
[ -f "$A" ] || python3 scripts/mixar.py
ffmpeg -v error -y -i "$V" -i "$A" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart output/priosafra-renowa-final.mp4
ffmpeg -v error -y -i output/priosafra-renowa-final.mp4 -vf scale=960:-2 -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 96k -movflags +faststart output/priosafra-renowa-preview.mp4
ffmpeg -v error -y -ss 12.3 -i "$V" -frames:v 1 -q:v 2 output/thumbnail.jpg
node scripts/legendas.mjs >/dev/null
# cópia leve para a apresentação
mkdir -p ../priosafra/media
ffmpeg -v error -y -i output/priosafra-renowa-final.mp4 -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart ../priosafra/media/proposta.mp4
cp output/thumbnail.jpg ../priosafra/media/proposta.jpg
cp output/legendas.vtt ../priosafra/media/proposta.vtt
for f in output/*.mp4 ../priosafra/media/proposta.mp4; do printf "%-48s %6s  %s s\n" "$f" "$(du -h "$f" | cut -f1)" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"; done
