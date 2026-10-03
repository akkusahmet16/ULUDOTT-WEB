#!/usr/bin/env bash
set -euo pipefail
mkdir -p .local/task28-load
ULUDOTT_LOAD=1 ULUDOTT_E2E_PRODUCTION=1 pnpm exec node --conditions=react-server tests/helpers/start-e2e.ts > .local/task28-load/server.log 2>&1 &
load_server=$!
trap 'kill -TERM "$load_server" 2>/dev/null || true; wait "$load_server" 2>/dev/null || true' EXIT
for attempt in $(seq 1 60); do
  if curl --insecure --silent --fail https://127.0.0.1:3443/ > /dev/null; then break; fi
  kill -0 "$load_server"
  sleep 1
done
curl --insecure --silent --fail https://127.0.0.1:3443/ > /dev/null
pnpm exec vitest run --config vitest.load.config.ts
