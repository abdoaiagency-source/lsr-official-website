# LSR OS Non-AI Production Readiness Plan

**Goal:** make the official website usable by real staff as a deterministic operating system for lead intake, conversion, case tracking, document follow-up, task follow-up, and management visibility.

**Constraint:** no AI assistance, no AI summaries, no AI replies, no autonomous decisions.

## Current verified foundation

- Website qualification chat creates structured `lsr_conversion_leads` rows.
- `/operations` reviews leads and calls `POST /api/admin/leads/convert`.
- Supabase is the source of truth.
- Conversion RPC creates clients, requests, missing document rows, follow-up task, and activity log with duplicate protection.

## Implementation slices

1. **Lead review hardening**
   - Add filters/search/resolution for active, ready deposit, needs documents, rejected, converted, lost, duplicate, and not interested.
   - Store lead resolution in Supabase columns, not only UI state.
   - Keep conversion idempotent and blocked for converted/resolved leads.

2. **Case management**
   - Add `/cases` list and `/cases/[id]` detail pages.
   - Add admin APIs for list/detail/update case status, next action, due date, notes, and client-safe summary.
   - Show client, owner, priority, missing documents, tasks, and activity log.

3. **Document workflow**
   - Use existing `lsr_documents` table as metadata source of truth.
   - Support staff-friendly statuses mapped to existing DB enum values.
   - Add API for document status/correction/expiry metadata updates.
   - Defer file upload until storage is explicitly verified.

4. **Tasks and follow-up**
   - Add `/tasks` page and API for list/update.
   - Show today, overdue, upcoming, completed/cancelled filters.
   - Update completed timestamp when task is completed.

5. **Management visibility**
   - Add `/management` dashboard using deterministic metrics from Supabase.
   - Metrics: new leads, ready-deposit leads, converted leads, active cases, waiting cases, overdue tasks, completed cases, unresolved queue.

6. **Production hardening**
   - Server-side validation with stable Arabic-safe messages.
   - Empty/loading/error states on staff pages.
   - Destructive confirmations for resolution/cancel actions.
   - Tests for mapping, filters, and API payload helpers.
   - Verify with `npm test`, `npm run typecheck`, `npm run build`, browser QA, live Supabase smoke test, commit and push.
