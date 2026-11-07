# CLAUDE.md — Uludott Web Developer & AI Assistant Guide

This document provides a concise, high-priority guide for developing and maintaining the Uludott Web application.

---

## 1. Project Overview & Architecture

Uludott Web is the official web platform of the Uludott game development community. It combines a cinematic, ArtDeco-inspired visual presentation with a robust, enterprise-grade Next.js App Router and PostgreSQL backend.

- **Framework:** Next.js 16.3.8 (Turbopack, Server Components, Server Actions)
- **UI:** React 19.3.0, Vanilla CSS Modules & centralized theme tokens
- **Database:** PostgreSQL 17 via Drizzle ORM 0.45.3 (48 tables, composite foreign keys)
- **Runtime:** Node.js 24.21.0 LTS, pnpm 11.19.0
- **Testing:** Vitest 5.0.3 (unit & integration), Playwright 1.57.0 (E2E)

---

## 2. Mandatory Rules & Invariants

1. **Visual Lock & CSS Tokens:**
   - The visual style from v0.1 is locked. Never introduce arbitrary color codes or modify layout spacing without tokenizing them in `src/styles/themes.css`.
   - 2,889 golden declarations are locked via `tests/fixtures/golden-declarations.json`.
   - Zero tolerance for undefined `var()` references or local CSS color overrides outside `themes.css`.
2. **Server-Only Boundary:**
   - All database queries, schema files, crypto/auth helpers, and queue workers MUST be annotated with `"server-only"`.
   - Never import server-only code into client components.
3. **No Hardcoded UI Strings (i18n):**
   - All user-facing text must be defined in `src/i18n/dictionaries/{tr,en,client-tr}.ts`.
   - Enforced strictly by `tests/unit/no-hardcoded-text.test.ts`.
4. **Icon Registry & No Raw Emojis:**
   - All icons must use `src/components/ui/icons/icon.tsx` or `brand-asset.tsx`.
   - Do NOT use pictographic emojis (e.g. 📄, 📁, 📖); use clean typography (`✦`, `+`, `[PDF]`).
5. **Route Centralization:**
   - Routes are defined in `src/config/routes.config.ts`. Metadata, canonical policy, and navigation trees are derived from this single source of truth.

---

## 3. Essential Commands

```sh
# Start local development server
pnpm dev

# Start background queue worker
pnpm worker

# TypeScript strict type checking (must be 0 errors)
pnpm typecheck

# ESLint validation (must be 0 warnings)
pnpm lint

# Run all unit tests (48 files / 309 tests)
pnpm vitest run tests/unit

# Run full production build (67 routes)
pnpm build

# Database schema check & migration
pnpm db:check
pnpm db:migrate
pnpm db:seed:2026
```

---

## 4. Key Directories

- `src/app/`: Next.js App Router (public pages, `/admin`, `/api`, `/uploads`)
- `src/components/`: Reusable layout and UI components
- `src/config/`: Routes configuration and boot script
- `src/db/`: Drizzle ORM schemas (`src/db/schema/`) and database pool
- `src/i18n/`: Dictionaries (`tr.ts`, `en.ts`, `client-tr.ts`), translator functions, and error adapters
- `src/lib/`: Security (CSP, CSRF, rate limit), queue (outbox), cache, storage
- `src/modules/`: Domain modules:
  - `fanzin`: Issues, pages, digital flipbook reader, admin CMS
  - `forms`: 15 field types, conditional logic, submission validator, CSV export
  - `events`: Community events, UluJam coming soon, past event carousel
  - `games`: Game catalogue, awards, itch.io integration, developer credits consent
  - `teams`: Jam applications, team roster management, revisions, approvals
  - `cards`: Participant capability cards, check-in QR, Google Wallet pass gate
  - `links`: Link hub, tracked short links, QR generator
  - `analytics`: Anonymized page view tracking and dashboard
  - `site-settings`: Dynamic homepage and sponsors CMS
  - `media`: Asset management, variant generation, local VDS uploads
- `src/styles/`: Global stylesheets (`themes.css`, `base.css`, `tokens.css`, `cinematic.css`, `fanzin.css`)
- `tests/`: Unit, integration, E2E, performance, and security test suites
