#!/usr/bin/env bash
set -euo pipefail
pnpm typecheck
pnpm lint
pnpm db:check
pnpm test
pnpm build
ULUDOTT_E2E_PRODUCTION=1 pnpm test:e2e
pnpm audit --prod --audit-level=low
pnpm security:source
pnpm security:wallet
