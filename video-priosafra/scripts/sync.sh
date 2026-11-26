#!/usr/bin/env bash
# Copia da apresentação (/priosafra) os módulos visuais compartilhados, para o vídeo usar exatamente os mesmos componentes.
set -e
cd "$(dirname "$0")/.."
SRC=../priosafra
cp "$SRC/lib.js" "$SRC/arts.js" "$SRC/config.js" "$SRC/styles.css" proj/shared/
cp "$SRC/assets/instagram-atual-grade.jpg" "$SRC/assets/instagram-atual-foto.jpg" proj/assets/
echo "componentes sincronizados com a apresentação"
