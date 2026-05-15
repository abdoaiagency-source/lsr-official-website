create extension if not exists pgcrypto;

create table if not exists public.lsr_conversion_leads (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  source_channel text not null default 'website_chat',
  name text not null,
  phone text not null,
  city text,
  nationality text,

  has_entry_stamp text not null check (has_entry_stamp in ('yes', 'no', 'unknown')),
  official_entry text not null check (official_entry in ('yes', 'no', 'unknown')),
  has_previous_sponsor text not null check (has_previous_sponsor in ('yes', 'no', 'unknown')),
  has_sponsor_clearance text not null check (has_sponsor_clearance in ('yes', 'no', 'unknown', 'not_applicable')),
  can_obtain_sponsor_clearance text not null check (can_obtain_sponsor_clearance in ('yes', 'no', 'unknown', 'not_applicable')),
  passport_valid text not null check (passport_valid in ('yes', 'no', 'unknown')),
  health_certificate_ready text not null check (health_certificate_ready in ('yes', 'no', 'unknown')),
  photos_ready text not null check (photos_ready in ('yes', 'no', 'unknown')),
  agrees_to_visit text not null check (agrees_to_visit in ('yes', 'no')),
  wants_waafed_help text not null check (wants_waafed_help in ('yes', 'no', 'unknown')),

  status text not null check (status in ('rejected', 'needs_documents', 'ready_deposit', 'submitted', 'in_process', 'completed')),
  priority integer not null check (priority in (1, 2, 3)),
  reasons text[] not null default '{}',
  missing_documents text[] not null default '{}',
  client_message text not null,
  next_action text not null,

  assigned_owner text default 'ayoub',
  internal_notes text,
  last_activity_at timestamptz not null default now(),
  submitted_at timestamptz,
  in_process_at timestamptz,
  completed_at timestamptz,

  raw_answers jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists lsr_conversion_leads_created_at_idx on public.lsr_conversion_leads (created_at desc);
create index if not exists lsr_conversion_leads_status_idx on public.lsr_conversion_leads (status);
create index if not exists lsr_conversion_leads_priority_idx on public.lsr_conversion_leads (priority, created_at desc);
create index if not exists lsr_conversion_leads_phone_idx on public.lsr_conversion_leads (phone);
create index if not exists lsr_conversion_leads_missing_documents_idx on public.lsr_conversion_leads using gin (missing_documents);
create index if not exists lsr_conversion_leads_reasons_idx on public.lsr_conversion_leads using gin (reasons);

alter table public.lsr_conversion_leads enable row level security;

-- MVP security model:
-- No public RLS policies. The Next.js server API writes/reads with the Supabase service role only.
-- Browser clients never receive SUPABASE_SERVICE_ROLE_KEY.

create or replace function public.set_lsr_conversion_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.last_activity_at = now();

  if new.status = 'submitted' and old.status is distinct from 'submitted' and new.submitted_at is null then
    new.submitted_at = now();
  end if;

  if new.status = 'in_process' and old.status is distinct from 'in_process' and new.in_process_at is null then
    new.in_process_at = now();
  end if;

  if new.status = 'completed' and old.status is distinct from 'completed' and new.completed_at is null then
    new.completed_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists set_lsr_conversion_leads_updated_at on public.lsr_conversion_leads;
create trigger set_lsr_conversion_leads_updated_at
before update on public.lsr_conversion_leads
for each row execute function public.set_lsr_conversion_leads_updated_at();
