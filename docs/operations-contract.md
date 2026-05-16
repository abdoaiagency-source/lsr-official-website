# LSR Operations Contract

This document is the contract between the public website, the operations dashboard, Supabase, and the future internal LSR OS.

It should stay aligned with:

```text
src/lib/conversion.ts
src/lib/leads.ts
src/components/OperationsDashboard.tsx
supabase/migrations/20260515223000_lsr_conversion_leads.sql
/opt/data/lsr-os/AGENTS.md
```

## Purpose

The website should not only collect a lead. It should classify the lead into an operational state that tells staff what to do next.

The minimum useful record is:

```text
client identity
contact details
qualification answers
internal status
missing documents
client-safe message
staff next action
priority
activity timestamps
```

## Funnel contract

```text
Public visitor
→ qualification chat
→ lsr_conversion_leads row
→ Ayoub/staff follow-up
→ ready_deposit
→ submitted
→ in_process
→ completed
```

## Status contract

### `rejected`

Internal meaning:

```text
Cannot start currently because a blocking requirement is missing.
```

Client-facing Arabic:

```text
لا يمكن البدء حالياً
```

Do not say:

```text
مرفوض
```

Examples:

- no entry stamp
- unofficial entry
- cannot get required sponsor clearance
- passport invalid

Expected staff action:

```text
No active follow-up unless staff chooses a manual exception.
```

### `needs_documents`

Internal meaning:

```text
The case may continue, but information/documents are missing or unclear.
```

Client-facing Arabic:

```text
يحتاج أوراق
```

Examples:

- health certificate missing
- photos missing
- passport validity unclear
- previous sponsor status unclear
- sponsor clearance obtainable but not ready
- client not ready to visit yet

Expected staff action:

```text
Send missing document list and follow up later.
```

### `ready_deposit`

Internal meaning:

```text
High-priority lead. No blocking/missing requirement from the chat answers, and client is ready to visit/pay first deposit.
```

Client-facing Arabic:

```text
جاهز للدفعة
```

Expected staff action:

```text
Ayoub/staff contacts quickly to schedule office visit, receive papers, and collect first payment.
```

### `submitted`

Internal meaning:

```text
Documents and first payment were received. The lead is now a submitted case.
```

Expected staff action:

```text
Handoff from sales/follow-up to operations.
```

### `in_process`

Internal meaning:

```text
The case is actively being processed by the operations team.
```

Expected staff action:

```text
Track operational progress and keep client updated with safe wording.
```

### `completed`

Internal meaning:

```text
The case is finished.
```

Expected staff action:

```text
Close the operational loop and preserve final record.
```

## Database table contract

Current table:

```text
public.lsr_conversion_leads
```

Primary identity fields:

```text
id uuid
public_id text
created_at timestamptz
updated_at timestamptz
source_channel text
```

Contact fields:

```text
name
phone
city
nationality
```

Qualification fields:

```text
has_entry_stamp
official_entry
has_previous_sponsor
has_sponsor_clearance
can_obtain_sponsor_clearance
passport_valid
health_certificate_ready
photos_ready
agrees_to_visit
wants_waafed_help
```

Decision fields:

```text
status
priority
reasons
missing_documents
client_message
next_action
```

Operations fields:

```text
assigned_owner
internal_notes
last_activity_at
submitted_at
in_process_at
completed_at
raw_answers
metadata
```

## API contract

### `POST /api/leads`

Input:

```text
QualificationAnswers JSON
```

Output on success:

```json
{
  "ok": true,
  "lead": {}
}
```

Output if Supabase is not configured:

```json
{
  "ok": false,
  "error": "persistence_not_configured",
  "fallbackLead": {}
}
```

Behavior:

- validate payload with Zod
- classify deterministically
- insert row into Supabase using service role
- return the stored lead

### `GET /api/admin/leads`

Auth:

```text
Authorization: Bearer <ADMIN_PASSWORD>
```

If `ADMIN_PASSWORD` is not set, the current MVP allows access. This is only acceptable for demo/dev.

Output:

```json
{
  "ok": true,
  "leads": []
}
```

### `PATCH /api/admin/leads`

Input:

```json
{
  "id": "LEAD-...",
  "status": "submitted"
}
```

Allowed statuses:

```text
rejected
needs_documents
ready_deposit
submitted
in_process
completed
```

Current dashboard uses only:

```text
submitted
in_process
completed
```

## RLS/security contract

Current MVP security model:

- RLS enabled on `lsr_conversion_leads`.
- No public RLS policies.
- Next.js server API uses Supabase service role.
- Browser never receives service role key.
- Admin API uses `ADMIN_PASSWORD` when configured.

Before production:

- Set `ADMIN_PASSWORD`.
- Consider replacing password-only auth with proper staff authentication.
- Confirm migration is applied in the target Supabase project.
- Verify that service role key exists only in server/deployment environment variables.

## Future LSR OS handoff

When the internal OS is ready, `lsr_conversion_leads` should either remain an intake table or be converted into normalized records:

```text
clients
requests
documents
tasks
activity_logs
message_templates
ai_runs
```

Recommended conversion:

```text
lsr_conversion_leads row
→ client record
→ request/case record
→ required document checklist
→ assigned staff task
→ activity log entry
```

## Invariants to preserve

- Status values must match TypeScript, SQL check constraints, docs, and dashboard labels.
- Client message must be safe and soft.
- Internal notes must not leak into client-facing UI.
- Missing documents must be explicit and machine-readable.
- Ready-deposit leads must be easy to see first.
- The website should not become the full internal OS; it feeds the OS.
