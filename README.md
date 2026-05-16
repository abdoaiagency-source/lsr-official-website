# Libyan Safe Residence — Official Website

Arabic-first public website and conversion engine for **شركة الإقامة الآمنة الليبية للخدمات العمالية / Libyan Safe Residence**.

This repo is the public-facing side of the LSR system. It explains the company, qualifies residency leads through a low-tech Arabic chat, and exposes a small operations dashboard for the current MVP lead queue.

## Current status

- Public website: built.
- Qualification chat: built.
- Deterministic lead classification: built.
- Supabase REST persistence: implemented, requires environment variables and migration.
- Operations dashboard: MVP lead queue, not yet the full internal OS.
- Full LSR OS: tracked separately in `/opt/data/lsr-os`.

Live deployment currently used during development:

```text
https://lsr-official-website.vercel.app
```

Important routes:

```text
/                Public marketing site
/qualification   Arabic qualification chat
/operations      MVP staff lead queue
/api/leads       Public lead intake API
/api/admin/leads Admin lead list/status API
```

## Read first

For future developers and AI agents, read these files before changing behavior:

```text
README.md
AGENTS.md
docs/code-overview.md
docs/operations-contract.md
docs/lsr-pdf-source-of-truth.md
src/lib/conversion.ts
src/lib/qualification-chat.ts
supabase/migrations/20260515223000_lsr_conversion_leads.sql
```

## Product purpose

The current product is not a generic form. It is a conversion engine:

```text
TikTok / WhatsApp attention
→ simple Arabic website
→ qualification chat
→ lead status
→ Ayoub/staff follow-up queue
→ ready_deposit
→ submitted
→ in_process
→ completed
```

The website should tell staff and future systems:

- Is this lead worth following now?
- What is missing?
- What is the safe message to send to the client?
- What is the next staff action?

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4 via global CSS
- Zod for API validation
- Vitest for business logic tests
- Supabase REST API for persistence

## Commands

Install dependencies:

```bash
npm install
```

Run local dev server:

```bash
npm run dev
```

Quality gates:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Environment variables

For the website API to persist leads in Supabase:

```text
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` must stay server-only.
- Do not expose the service role key to browser/client code.
- `ADMIN_PASSWORD` protects `/api/admin/leads`; if absent, the current MVP API allows admin access for demo convenience. Set it before production use.

## Database

Current migration:

```text
supabase/migrations/20260515223000_lsr_conversion_leads.sql
```

Main table:

```text
public.lsr_conversion_leads
```

The table stores intake answers, classification, missing documents, next action, owner, notes, timestamps, raw answers, and metadata.

Security model:

- RLS enabled.
- No public RLS policies.
- Server API reads/writes with the Supabase service role.
- Browser clients call Next.js API routes, not Supabase directly.

## Controlled statuses

Use only these statuses unless deliberately changing the product model:

```text
rejected
needs_documents
ready_deposit
submitted
in_process
completed
```

Client-facing Arabic language must be soft:

- Internal `rejected` should display as `لا يمكن البدء حالياً`.
- Do not show harsh wording like `مرفوض` to clients.

## Source of truth

Company/public-site content source:

```text
docs/lsr-pdf-source-of-truth.md
```

Operational source-of-truth direction:

```text
/opt/data/lsr-os/AGENTS.md
```

## Demo vs production boundary

This repo currently includes production-shaped code, but the operations dashboard is still MVP/demo-level:

- It can fall back to local browser storage.
- It supports basic status updates only.
- It is not yet role-based auth.
- It is not yet the complete internal case/document/task OS.

Do not document demo fallback data as real customer data.

## Relationship to LSR OS

The public website captures and classifies leads. The separate LSR OS workspace will become the internal source of truth for clients, requests, documents, tasks, staff activity, WhatsApp templates, and AI runs.

Path:

```text
/opt/data/lsr-os
```

Keep statuses, document labels, and staff handoff rules aligned between both repos.
