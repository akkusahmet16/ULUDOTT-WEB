# Local Admin and UluJam Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This repository's master plan forbids delegating implementation.

**Goal:** Run a realistic local-only UluJam application, team, approval, and Wallet demo with a usable password-only admin panel.

**Architecture:** Keep the existing form, team, approval, card, and Google Wallet services authoritative. A guarded local fixture creates a clearly labeled demo event/form and synthetic applications; a server-only demo view controls the UluJam CTA. Existing admin and team screens receive focused presentation improvements.

**Tech Stack:** Next.js 16.3.8 App Router, React 19.3, PostgreSQL/Drizzle, Vitest, Playwright, existing CSS Modules.

**Spec:** `docs/superpowers/specs/2026-10-10-local-admin-ulujam-demo-design.md`

## Global Constraints

- Local site and database only; do not push to GitHub or deploy to the VDS.
- Keep the real 2027 UluJam date unset and its primary message “Yakında”.
- Do not hardcode or commit the temporary panel password, private tokens, Wallet credentials, or synthetic receipt links.
- Keep administrator CSRF, session, lockout, and audit behavior; no account-based public login.
- Demo fixture must not run on a non-loopback `APP_URL` or without `LOCAL_DEMO_MODE=true`.
- Keep Apple Wallet deferred; Google Wallet remains demo and provider writes require an explicit user action.
- Preserve user changes under `tasarim-girdileri` and the unrelated `next-env.d.ts` change.
- Read the master plan, progress report, and installed Next.js docs relevant to a file before each coding task. Update the master plan before scope-changing code and append results to progress before completion.

## Review Focus

1. A production or non-loopback URL with demo flag accidentally set must reject fixture setup and hide the demo application route.
2. A paused demo form must disappear as an actionable CTA and reject direct POST, while reopening restores both.
3. Re-running fixture setup must not create another event, team, application, or card.
4. A team session may show member names and card states, but never another member's e-mail, phone, receipt, or card token.
5. Wallet requests before approval must fail; demo credentials alone must not activate a pending card.

---

### Task 1: Guard the local demo boundary

**Files:** Create `src/lib/config/local-demo.ts`; modify `src/modules/forms/application/public-form-service.ts`, `src/modules/applications/application/submit-ulujam.ts`, `.env.example`, the master plan; test `tests/unit/local-demo.test.ts` and `tests/integration/local-demo-boundary.test.ts`.

**Interfaces:** Produce `LOCAL_DEMO_FORM_SLUG = "demo-ulujam-yerel"` and `localDemoEnabled(env?: NodeJS.ProcessEnv): boolean`. It is true only with `LOCAL_DEMO_MODE=true`, non-production `NODE_ENV`, and `APP_URL` hostname `localhost`, `127.0.0.1`, or `::1`. Both public form read and UluJam submission return a 404-equivalent for this slug when false. Other form slugs are unchanged.

- [ ] Write tests for all three allowed hosts, production/remote rejection, and direct demo GET/POST rejection when disabled.
- [ ] Run `pnpm test tests/unit/local-demo.test.ts tests/integration/local-demo-boundary.test.ts`; observe target failures.
- [ ] Implement the guard and document `LOCAL_DEMO_MODE=false` in `.env.example`; add the approved local-demo exception to the master plan without weakening production rules.
- [ ] Run the focused tests and `pnpm typecheck`; expect all pass.
- [ ] Review complete changed files and diff; commit only this task's files.

### Task 2: Seed a reproducible local scenario and rotate the local password

**Files:** Create `scripts/setup-local-demo.ts`, `src/modules/applications/application/local-demo-setup.ts`, `tests/integration/local-demo-setup.test.ts`, `docs/operations/local-demo.md`; modify `package.json` only for the command name `demo:setup`. No dependency additions.

**Interfaces:** Export `setupLocalDemo(): Promise<{ eventId: string; formId: string; teamId: string; receipts: { founder: string; member: string } }>` from `src/modules/applications/application/local-demo-setup.ts`. The `receipts` values are private receipt tokens. It creates one `DEMO UluJam` event with the clearly synthetic date `2030-01-01T12:00:00+03:00`, form slug from Task 1, one `DEMO Takım`, and two synthetic applications through existing form/submission services. It stores team URL/password and personal receipt/card tokens only in `.local/demo-access.json` (mode 0600). It reads the requested temporary admin password from a non-logged environment input and calls existing `setPanelPassword`, never stores the plaintext in Git, and never invokes Google Wallet.

- [ ] Write tests for local-only refusal, first-run event/form/team/member/card counts, saved access artifact permissions, and identical counts on rerun.
- [ ] Run `pnpm test tests/integration/local-demo-setup.test.ts`; observe target failures.
- [ ] Implement setup using existing domain services and idempotent lookup by fixed demo slug; handle partially completed setup without duplicating people.
- [ ] Run focused tests and `pnpm typecheck`; expect all pass. Verify fixture does not call the Google adapter.
- [ ] Review complete changed files and diff; commit only this task's files.

### Task 3: Show an honest, switchable UluJam demo application

**Files:** Create `src/modules/events/ui/local-demo-application.tsx`; modify `src/app/(public)/ulujam/page.tsx`, relevant `src/styles/cinematic.css` selectors; test `tests/e2e/local-demo-application.spec.ts` and `tests/integration/local-demo-boundary.test.ts`.

**Interfaces:** Produce a server-side demo view from Task 1's guard and `getPublicForm(LOCAL_DEMO_FORM_SLUG)`. An open form renders a link to `/basvuru/demo-ulujam-yerel`; paused/closed form renders a non-actionable status. In both cases the real 2027 “Yakında” hero remains unchanged. Form controls in `/admin/formlar/[formId]` remain the source of truth.

- [ ] Write browser/integration tests for open, paused, reopened, and demo-disabled states, including direct form/API access when paused.
- [ ] Run focused tests; observe expected failures.
- [ ] Implement the demo section and styles without changing the public form validation or 2027 countdown.
- [ ] Run focused tests, `pnpm lint`, and `pnpm typecheck`; expect all pass.
- [ ] Review complete changed files and diff; commit only this task's files.

### Task 4: Clarify admin and team screens within the existing visual language

**Files:** Modify `src/app/admin/page.tsx`, `src/modules/admin/ui/login-form.tsx`, `src/modules/admin/ui/dashboard.tsx`, `src/modules/admin/ui/dashboard.module.css`, `src/app/(private)/takim/[token]/page.tsx`, `src/modules/teams/application/team-access.ts`, and `tests/integration/team-access.test.ts`; create `src/modules/teams/ui/team-page.module.css` and `tests/e2e/local-demo-journey.spec.ts`.

**Interfaces:** Admin login remains one password field. Show a local-demo badge only when Task 1's guard is true. Dashboard makes the existing form, submissions, approval queue, and system/Wallet status reachable with clear next-step links and state labels; existing permission checks remain. `getTeamView` adds event title and a safe member/card summary from the existing session-scoped card query; no contact details or tokens. Team page displays event, member count, approval/card states and existing logout.

- [ ] Write tests for password-only local login, relevant admin navigation and statuses, team login, member/card summaries, and absence of contact/token data.
- [ ] Run focused tests; observe target failures.
- [ ] Implement minimal UI/view changes using current cinematic tokens, responsive layout, visible focus, and reduced-motion behavior.
- [ ] Run focused tests, `pnpm lint`, and `pnpm typecheck`; expect all pass.
- [ ] Review complete changed files and diff; commit only this task's files.

### Task 5: Local acceptance, startup, and progress record

**Files:** Modify `docs/operations/local-demo.md`, `docs/operations/progress.md`; add or adjust only the E2E tests required by an observed failure.

**Interfaces:** No new product API. The final acceptance uses the local fixture and existing approval/card routes. Google Wallet demo device acceptance is recorded only if actually performed; otherwise mark it pending.

- [ ] Start only local PostgreSQL/storage and web/worker, run migrations and `pnpm demo:setup` with the temporary password supplied privately at invocation. Keep the web on `127.0.0.1:3001` for user testing.
- [ ] Verify login, form open/pause/reopen, founder/member team access, pending→approved web card, and Wallet preapproval denial with browser and database checks; perform Google provider/device step only when its local demo prerequisites are ready.
- [ ] Run focused integration/E2E, full relevant regression suite, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and scoped `git diff --check`; record exact results and any external pending item.
- [ ] Append the acceptance and local access instructions to operations docs, keeping the Wallet QR future-work section last in `progress.md`; inspect docs and diff, then commit only task files.
- [ ] Confirm VDS commit/service/password unchanged and local app reachable; do not push or deploy.
