# LSR Website Code Overview

This document explains the current codebase shape for developers and AI agents. It is intentionally practical: where behavior lives, what owns what, and what not to break.

## High-level architecture

```text
Browser UI
  ├─ / public site
  ├─ /qualification chat
  └─ /operations MVP dashboard

Next.js API
  ├─ POST /api/leads
  └─ GET/PATCH /api/admin/leads

Business logic
  ├─ qualification steps and branching
  ├─ deterministic classification
  └─ Supabase row mapping

Persistence
  └─ Supabase REST → public.lsr_conversion_leads
```

## Source layout

```text
src/app/layout.tsx
```

Global app shell and metadata.

```text
src/app/page.tsx
```

Arabic public landing page. Uses public content from `src/lib/content.ts`.

```text
src/app/qualification/page.tsx
```

Route wrapper for the qualification chat.

```text
src/app/operations/page.tsx
```

Route wrapper for the MVP staff operations dashboard.

```text
src/app/api/leads/route.ts
```

Public server API for lead intake. It validates chat answers, classifies the lead, and writes to Supabase when configured.

```text
src/app/api/admin/leads/route.ts
```

Admin server API for listing and updating lead statuses. It is protected by `ADMIN_PASSWORD` when the environment variable is set.

```text
src/components/QualificationForm.tsx
```

Client-side chat UI. Owns the user interaction, step progression, local fallback behavior, and submit call to `/api/leads`.

```text
src/components/OperationsDashboard.tsx
```

Client-side MVP dashboard. Loads leads from `/api/admin/leads` when possible, otherwise falls back to browser local storage.

```text
src/lib/content.ts
```

Structured content for the public website.

```text
src/lib/qualification-chat.ts
```

Question list, answer options, branching visibility, completion checks, and answer normalization.

```text
src/lib/conversion.ts
```

Core deterministic classification logic. This is the most important business logic file.

```text
src/lib/leads.ts
```

Zod schemas, API payload validation, Supabase row type, and mapping between DB rows and app objects.

```text
src/lib/supabase-rest.ts
```

Small server-only Supabase REST client using `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

```text
supabase/migrations/20260515223000_lsr_conversion_leads.sql
```

Database schema for current conversion leads table.

## Data flow: qualification submit

```text
User completes /qualification
→ QualificationForm builds QualificationAnswers
→ POST /api/leads
→ qualificationAnswersSchema validates payload
→ createStoredLead() classifies lead
→ storedLeadToInsert() converts camelCase app object to snake_case DB row
→ insertLead() writes to Supabase REST if env is configured
→ API returns StoredLead
→ UI shows client-safe message and next action
```

If Supabase env is missing or the API write fails, the UI can still keep a local fallback lead. This keeps the demo usable but should not be treated as production persistence.

## Data flow: operations dashboard

```text
Staff opens /operations
→ optionally enters ADMIN_PASSWORD
→ clicks load from database
→ GET /api/admin/leads
→ listLeads() reads Supabase rows
→ leadRowToStoredLead() maps rows for UI
→ dashboard sorts by status priority
→ staff can PATCH status to submitted / in_process / completed
```

Local fallback exists only for demos and should not be used as the real operating record.

## Key domain types

`QualificationAnswers` contains the chat answers:

```text
name
phone
city
nationality
hasEntryStamp
officialEntry
hasPreviousSponsor
hasSponsorClearance
canObtainSponsorClearance
passportValid
healthCertificateReady
photosReady
agreesToVisit
wantsWaafedHelp
```

`LeadClassification` contains the decision output:

```text
status
reasons
missingDocuments
clientMessage
nextAction
priority
```

`StoredLead` combines answers + classification + id/createdAt/sourceChannel.

## Classification rules summary

Immediate cannot-start cases:

- no entry stamp
- unofficial entry
- previous sponsor and cannot obtain clearance
- previous sponsor and clearance missing/not obtainable
- invalid passport

Needs-document cases:

- unclear entry stamp
- unclear official entry
- unclear previous sponsor
- previous sponsor clearance obtainable but missing
- passport validity unclear
- health certificate missing/unknown
- photos missing/unknown
- not ready to visit/pay first deposit

Ready-deposit case:

- no fatal blocker
- no missing/unclear required document
- ready to visit and deliver papers/pay first deposit

## Status and priority model

Statuses:

```text
rejected
needs_documents
ready_deposit
submitted
in_process
completed
```

Priority values:

- `1`: highest priority, ready for deposit.
- `2`: follow-up needed, usually missing documents.
- `3`: low priority/cannot start currently.

Dashboard sorting currently uses status order, not only numeric priority:

```text
ready_deposit
needs_documents
rejected
submitted
in_process
completed
```

## Environment and persistence

Required for Supabase-backed operation:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
```

`NEXT_PUBLIC_SUPABASE_URL` is public by nature, but `SUPABASE_SERVICE_ROLE_KEY` is private and must only be used in server code.

## Tests

Current tests cover:

- public content consistency
- conversion/classification logic
- lead schema/row mapping
- qualification chat behavior

Run:

```bash
npm test
```

## Common safe changes

Safe:

- improve Arabic wording while preserving meaning
- add more tests
- add fields to internal metadata with a migration
- improve dashboard UI
- improve docs

Needs caution:

- changing qualification questions
- changing classification rules
- changing statuses
- changing DB constraints
- changing Supabase auth behavior

Ask first:

- deleting data
- exposing lead data publicly
- disabling RLS
- replacing the status model
