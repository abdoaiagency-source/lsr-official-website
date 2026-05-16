# LSR Official Website Agent Context

## Project Purpose

This repo is the public website and conversion engine for LSR / الإقامة الآمنة. It should convert attention from TikTok, WhatsApp, and referrals into structured leads that staff can act on.

It is related to, but separate from, the internal LSR OS workspace:

```text
/opt/data/lsr-os
```

## Primary Outcome

Build and maintain a simple Arabic-first flow:

```text
Visitor reads public site
→ opens qualification chat
→ answers one question at a time
→ system classifies the lead
→ lead is saved to Supabase when configured
→ staff sees priority and next action in /operations
```

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Zod
- Vitest
- Supabase REST API
- Arabic/RTL-first UX

## Read-First Files

Before changing behavior, read:

```text
README.md
docs/code-overview.md
docs/operations-contract.md
docs/lsr-pdf-source-of-truth.md
src/lib/conversion.ts
src/lib/qualification-chat.ts
src/lib/leads.ts
src/lib/supabase-rest.ts
src/components/QualificationForm.tsx
src/components/OperationsDashboard.tsx
supabase/migrations/20260515223000_lsr_conversion_leads.sql
```

## Core Product Rules

- Keep UX Arabic-first and RTL.
- Use simple wording for low-tech users.
- Ask one qualification question at a time.
- Prefer large answer buttons over dense forms.
- Keep client-facing language soft.
- Do not show harsh words like `مرفوض` to clients.
- Use `لا يمكن البدء حالياً` for internal `rejected` status.
- The website does not collect payment online.
- The website only determines readiness and next action.

## Controlled Statuses

Use only these statuses unless there is an intentional schema/product migration:

```text
rejected
needs_documents
ready_deposit
submitted
in_process
completed
```

Meaning:

- `rejected`: cannot start currently; use soft Arabic wording.
- `needs_documents`: can continue after missing documents/details.
- `ready_deposit`: priority lead; Ayoub/staff should contact quickly.
- `submitted`: documents and first payment received.
- `in_process`: case is being processed operationally.
- `completed`: case is finished.

## Code Ownership Map

- Public site content: `src/lib/content.ts`, `src/app/page.tsx`.
- Qualification chat questions and branching: `src/lib/qualification-chat.ts`.
- Classification and client message logic: `src/lib/conversion.ts`.
- API validation and row mapping: `src/lib/leads.ts`.
- Supabase REST calls: `src/lib/supabase-rest.ts`.
- Lead intake API: `src/app/api/leads/route.ts`.
- Admin lead API: `src/app/api/admin/leads/route.ts`.
- Chat UI: `src/components/QualificationForm.tsx`.
- MVP staff dashboard: `src/components/OperationsDashboard.tsx`.
- Database migration: `supabase/migrations/20260515223000_lsr_conversion_leads.sql`.

## Commands

Run these after code changes:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

For docs-only changes, at minimum check git diff and run typecheck/tests if code-adjacent docs changed.

## Security Rules

- Never put `SUPABASE_SERVICE_ROLE_KEY` in client components.
- Browser code must call Next.js API routes, not service-role Supabase directly.
- Keep RLS enabled on sensitive tables.
- Do not add public RLS policies for lead data unless explicitly designing a secure public access model.
- `ADMIN_PASSWORD` should be set before production admin use.

## Safe Autonomy Rules

Agents may autonomously:

- improve docs
- add tests for existing logic
- refactor without changing product semantics
- update UI copy while preserving soft Arabic wording
- add non-destructive migrations

Ask before:

- dropping/renaming DB columns
- deleting lead data
- disabling RLS
- exposing private lead information
- changing the status model
- changing production auth/security behavior

## Definition of Done

For code changes:

- Status model still matches docs and migration.
- Arabic UX still reads naturally and softly.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm test` passes.
- `npm run build` passes when deployment behavior may be affected.

For documentation changes:

- README explains routes, commands, env, and demo/production boundary.
- `docs/code-overview.md` matches actual files.
- `docs/operations-contract.md` matches statuses and data flow.
- Future agents can continue without asking for basic context.
