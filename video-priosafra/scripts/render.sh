#!/usr/bin/env bash
# Renderiza o vídeo. uso: bash scripts/render.sh [previa|final]
set -e
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH
bash scripts/sync.sh
if [ "${1:-previa}" = "final" ]; then
  bash ~/.claude/skills/claude-video/scripts/render.sh proj output/priosafra-renowa-sem-narracao.mp4 high
else
  bash ~/.claude/skills/claude-video/scripts/render.sh proj output/priosafra-renowa-preview.mp4 draft
fi
