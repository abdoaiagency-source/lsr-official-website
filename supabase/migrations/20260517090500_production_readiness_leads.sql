-- Production-readiness hardening for deterministic staff operations.

alter table public.lsr_conversion_leads
  add column if not exists resolution text not null default 'active'
    check (resolution in ('active', 'lost', 'duplicate', 'not_interested')),
  add column if not exists resolution_notes text,
  add column if not exists resolved_at timestamptz;

create index if not exists lsr_conversion_leads_resolution_idx
  on public.lsr_conversion_leads (resolution, converted, created_at desc);

-- Harden the conversion RPC: resolved leads should not become cases unless reactivated.
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

  if coalesce(v_lead.resolution, 'active') <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'lead_resolved', 'resolution', v_lead.resolution);
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
