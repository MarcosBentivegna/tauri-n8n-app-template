#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Iniciando n8n…"
docker compose up -d

wait_for_n8n() {
  for _ in $(seq 1 60); do
    if curl -fsS http://localhost:5678/healthz >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

echo "Esperando a que n8n esté listo en http://localhost:5678…"
if ! wait_for_n8n; then
  echo "n8n no respondió. Revisá los logs con: docker compose logs -f n8n" >&2
  exit 1
fi

echo "Importando workflows de ejemplo…"
docker compose exec -T n8n n8n import:workflow --separate --input=/workflows

echo "Activando workflows de ejemplo…"
for workflow_id in studio-echo studio-sync-contacts; do
  docker compose exec -T n8n n8n update:workflow --id="$workflow_id" --active=true >/dev/null
done

# n8n mantiene el estado de los workflows en memoria: reiniciamos para que los
# webhooks de producción queden registrados.
echo "Reiniciando n8n para aplicar los cambios…"
docker compose restart n8n >/dev/null

if ! wait_for_n8n; then
  echo "n8n no volvió a responder después del reinicio." >&2
  exit 1
fi

echo
echo "Listo. Workflows disponibles:"
echo "  POST http://localhost:5678/webhook/echo"
echo "  POST http://localhost:5678/webhook/sync-contacts"
