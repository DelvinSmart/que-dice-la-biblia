#!/bin/sh
# Genera un PDF por estudio con los colores de la página (css/motor.css): uno oscuro y uno claro en _site/descargas/<estudio>.pdf.
# Se ejecuta después de scripts/construir.mjs. Usa Chrome (en GitHub) o Brave (en la Mac).
set -e
cd "$(dirname "$0")/../_site"
CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || echo "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser")}"
PUERTO=8799
python3 -m http.server "$PUERTO" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVIDOR=$!
trap 'kill $SERVIDOR' EXIT
sleep 1
mkdir -p descargas
for archivo in estudios/*.json; do
  slug=$(basename "$archivo" .json)
  [ "$slug" = "indice" ] && continue
  # Dos PDF por estudio: <slug>.pdf (oscuro) y <slug>-claro.pdf (claro)
  for tema in oscuro claro; do
    salida="descargas/$slug.pdf"; [ "$tema" = claro ] && salida="descargas/$slug-claro.pdf"
    "$CHROME" --headless=new --disable-gpu --no-sandbox --no-pdf-header-footer --virtual-time-budget=15000 \
      --print-to-pdf="$(pwd)/$salida" "http://127.0.0.1:$PUERTO/pdf.html?e=$slug&tema=$tema" 2>/dev/null
    echo "PDF listo: $salida"
  done
done
