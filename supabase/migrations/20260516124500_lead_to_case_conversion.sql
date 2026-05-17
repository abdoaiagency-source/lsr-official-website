-- Lead-to-Case Conversion MVP
-- Non-destructive bridge between public website leads and the LSR OS tables.

create extension if not exists pgcrypto with schema extensions;

-- Supabase installs pgcrypto in the extensions schema. Keep the existing OS public-id
-- helper compatible with triggers/defaults that run with a restricted search_path.
create or replace function public.lsr_generate_public_id(prefix text)
returns text
language sql
as $function$
  select upper(prefix) || '-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || upper(substr(encode(extensions.gen_random_bytes(3), 'hex'), 1, 6));
$function$;

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

alter table public.lsr_conversion_leads
  add column if not exists converted boolean not null default false,
  add column if not exists converted_request_id text,
  add column if not exists converted_at timestamptz;

create index if not exists lsr_conversion_leads_created_at_idx on public.lsr_conversion_leads (created_at desc);
create index if not exists lsr_conversion_leads_status_idx on public.lsr_conversion_leads (status);
create index if not exists lsr_conversion_leads_priority_idx on public.lsr_conversion_leads (priority, created_at desc);
create index if not exists lsr_conversion_leads_phone_idx on public.lsr_conversion_leads (phone);
create index if not exists lsr_conversion_leads_converted_idx on public.lsr_conversion_leads (converted, created_at desc);
create index if not exists lsr_conversion_leads_missing_documents_idx on public.lsr_conversion_leads using gin (missing_documents);
create index if not exists lsr_conversion_leads_reasons_idx on public.lsr_conversion_leads using gin (reasons);

alter table public.lsr_conversion_leads enable row level security;

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

create unique index if not exists lsr_requests_source_lead_public_id_unique_idx
  on public.lsr_requests (source_lead_public_id)
  where source_lead_public_id is not null;

create or replace function public.lsr_convert_lead_to_case(
  p_lead_public_id text,
  p_request_public_id text,
  p_actor_worker_id uuid default null,
  p_default_worker_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.lsr_conversion_leads%rowtype;
  v_existing_request public.lsr_requests%rowtype;
  v_client public.lsr_clients%rowtype;
  v_worker public.lsr_workers%rowtype;
  v_actor public.lsr_workers%rowtype;
  v_request public.lsr_requests%rowtype;
  v_task_id uuid;
  v_doc text;
  v_document_count integer := 0;
  v_reused_client boolean := false;
begin
  select * into v_lead
  from public.lsr_conversion_leads
  where public_id = p_lead_public_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'missing_required_fields');
  end if;

  select * into v_existing_request
  from public.lsr_requests
  where source_lead_public_id = p_lead_public_id
  limit 1;

  if v_lead.converted or found then
    return jsonb_build_object(
      'ok', false,
      'error', 'lead_already_converted',
      'converted_request_id', coalesce(v_lead.converted_request_id, v_existing_request.public_id)
    );
  end if;

  if nullif(trim(v_lead.name), '') is null or nullif(trim(v_lead.phone), '') is null then
    return jsonb_build_object('ok', false, 'error', 'missing_required_fields');
  end if;

  if p_default_worker_id is not null then
    select * into v_worker from public.lsr_workers where id = p_default_worker_id and active = true limit 1;
  end if;

  if v_worker.id is null then
    select * into v_worker
    from public.lsr_workers
    where public_id = 'STAFF-AYOUB' and active = true
    limit 1;
  end if;

  if v_worker.id is null then
    select * into v_worker
    from public.lsr_workers
    where active = true and role in ('admin', 'manager', 'staff')
    order by created_at asc
    limit 1;
  end if;

  if v_worker.id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_required_fields');
  end if;

  if p_actor_worker_id is not null then
    select * into v_actor from public.lsr_workers where id = p_actor_worker_id limit 1;
  end if;

  if v_actor.id is null then
    v_actor := v_worker;
  end if;

  select * into v_client
  from public.lsr_clients
  where phone = v_lead.phone
  order by created_at asc
  limit 1;

  if found then
    v_reused_client := true;
  else
    insert into public.lsr_clients (
      full_name,
      phone,
      city,
      nationality,
      source_channel,
      metadata
    ) values (
      v_lead.name,
      v_lead.phone,
      nullif(v_lead.city, ''),
      nullif(v_lead.nationality, ''),
      'website_qualification',
      jsonb_build_object('source_lead_public_id', v_lead.public_id)
    )
    returning * into v_client;
  end if;

  insert into public.lsr_requests (
    public_id,
    client_id,
    source_lead_public_id,
    service_type,
    status,
    priority,
    assigned_owner_id,
    assigned_owner_name,
    client_safe_summary,
    internal_notes,
    next_action,
    next_action_type,
    next_action_due_at,
    missing_documents,
    reasons,
    qualification_snapshot,
    metadata
  ) values (
    p_request_public_id,
    v_client.id,
    v_lead.public_id,
    case when v_lead.wants_waafed_help = 'yes' then 'waafed_help' else 'residency' end,
    v_lead.status::public.lsr_request_status,
    coalesce(v_lead.priority, 2),
    v_worker.id,
    v_worker.display_name,
    v_lead.client_message,
    v_lead.internal_notes,
    v_lead.next_action,
    'follow_up',
    now() + interval '24 hours',
    coalesce(v_lead.missing_documents, '{}'),
    coalesce(v_lead.reasons, '{}'),
    coalesce(v_lead.raw_answers, '{}'::jsonb),
    jsonb_build_object('source', 'website_qualification', 'lead_id', v_lead.id)
  )
  returning * into v_request;

  foreach v_doc in array coalesce(v_lead.missing_documents, '{}') loop
    if nullif(trim(v_doc), '') is not null then
      insert into public.lsr_documents (
        client_id,
        request_id,
        document_type,
        status,
        required,
        client_safe_label,
        metadata
      ) values (
        v_client.id,
        v_request.id,
        v_doc,
        'missing',
        true,
        v_doc,
        jsonb_build_object('source_lead_public_id', v_lead.public_id)
      );
      v_document_count := v_document_count + 1;
    end if;
  end loop;

  insert into public.lsr_tasks (
    client_id,
    request_id,
    assigned_to,
    assigned_to_name,
    status,
    priority,
    title,
    description,
    due_at,
    metadata
  ) values (
    v_client.id,
    v_request.id,
    v_worker.id,
    v_worker.display_name,
    'open',
    coalesce(v_lead.priority, 2),
    'متابعة الحالة الجديدة',
    'تم تحويل العميل من الموقع. يرجى المراجعة والمتابعة.',
    now() + interval '24 hours',
    jsonb_build_object('source_lead_public_id', v_lead.public_id)
  )
  returning id into v_task_id;

  insert into public.lsr_activity_logs (
    client_id,
    request_id,
    task_id,
    actor_type,
    actor_id,
    actor_name,
    event_type,
    summary,
    visibility,
    metadata
  ) values (
    v_client.id,
    v_request.id,
    v_task_id,
    'staff',
    v_actor.id,
    v_actor.display_name,
    'case_created',
    'تم إنشاء الحالة من الطلب ' || v_lead.public_id,
    'internal_only',
    jsonb_build_object('source_lead_public_id', v_lead.public_id)
  );

  update public.lsr_conversion_leads
  set converted = true,
      converted_request_id = v_request.public_id,
      converted_at = now()
  where id = v_lead.id;

  return jsonb_build_object(
    'ok', true,
    'request_public_id', v_request.public_id,
    'request_id', v_request.id,
    'client_id', v_client.id,
    'reused_client', v_reused_client,
    'document_count', v_document_count
  );
exception
  when unique_violation then
    select * into v_existing_request
    from public.lsr_requests
    where source_lead_public_id = p_lead_public_id
    limit 1;

    return jsonb_build_object(
      'ok', false,
      'error', 'lead_already_converted',
      'converted_request_id', v_existing_request.public_id
    );
end;
$$;
