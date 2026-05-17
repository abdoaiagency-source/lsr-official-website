import type { ConversionResult, ConvertLeadPayload } from "./case-conversion";
import { documentStatusToDb, type CaseStatus, type DbDocumentStatus, type LeadResolution, type StaffDocumentStatus, type TaskStatus } from "./operations";
import type { LeadRow } from "./leads";

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

type SupabaseError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

export type ClientRow = {
  id: string;
  public_id: string;
  full_name: string;
  phone: string;
  city: string | null;
  nationality: string | null;
  client_safe_summary?: string | null;
  internal_notes?: string | null;
};

export type CaseRow = {
  id: string;
  public_id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  source_lead_public_id: string | null;
  service_type: string;
  status: CaseStatus;
  priority: number;
  assigned_owner_id: string | null;
  assigned_owner_name: string | null;
  client_safe_summary: string | null;
  internal_notes: string | null;
  next_action: string | null;
  next_action_type: string | null;
  next_action_due_at: string | null;
  last_activity_at: string;
  missing_documents: string[];
  reasons: string[];
  qualification_snapshot: Record<string, unknown>;
  metadata: Record<string, unknown>;
  submitted_at: string | null;
  in_process_at: string | null;
  completed_at: string | null;
  client?: ClientRow | null;
};

export type DocumentRow = {
  id: string;
  public_id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  request_id: string | null;
  document_type: string;
  status: DbDocumentStatus;
  required: boolean;
  client_safe_label: string;
  received_at: string | null;
  verified_at: string | null;
  expires_at: string | null;
  needs_correction_reason: string | null;
  internal_notes: string | null;
};

export type TaskRow = {
  id: string;
  public_id: string;
  created_at: string;
  updated_at: string;
  client_id: string | null;
  request_id: string | null;
  document_id: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  status: TaskStatus;
  priority: number;
  title: string;
  description: string | null;
  client_safe_summary: string | null;
  due_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  client?: ClientRow | null;
  request?: Pick<CaseRow, "id" | "public_id" | "status" | "next_action"> | null;
};

export type ActivityRow = {
  id: string;
  public_id: string;
  created_at: string;
  event_type: string;
  summary: string;
  visibility: "internal_only" | "client_safe" | "system_audit";
  actor_name: string | null;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

async function supabaseFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase server env not configured");

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let error: SupabaseError | string = await response.text();
    try {
      error = JSON.parse(String(error)) as SupabaseError;
    } catch {}
    const message = typeof error === "string" ? error : error.message || error.details || response.statusText;
    throw new Error(`Supabase request failed: ${message}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function insertLead(row: Record<string, unknown>): Promise<LeadRow> {
  const rows = await supabaseFetch<LeadRow[]>("lsr_conversion_leads", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  });

  if (!rows[0]) throw new Error("Supabase insert returned no lead");
  return rows[0];
}

export async function listLeads(): Promise<LeadRow[]> {
  return supabaseFetch<LeadRow[]>(
    "lsr_conversion_leads?select=*&order=priority.asc,created_at.desc&limit=500",
  );
}

export async function updateLeadStatus(publicId: string, status: string): Promise<LeadRow> {
  const rows = await supabaseFetch<LeadRow[]>(`lsr_conversion_leads?public_id=eq.${encodeURIComponent(publicId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status }),
  });

  if (!rows[0]) throw new Error("Supabase update returned no lead");
  return rows[0];
}

export async function resolveLead(publicId: string, resolution: LeadResolution, notes?: string): Promise<LeadRow> {
  const rows = await supabaseFetch<LeadRow[]>(`lsr_conversion_leads?public_id=eq.${encodeURIComponent(publicId)}&converted=eq.false`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      resolution,
      resolution_notes: notes || null,
      resolved_at: resolution === "active" ? null : new Date().toISOString(),
    }),
  });

  if (!rows[0]) throw new Error("Supabase lead resolution returned no lead");
  return rows[0];
}

export async function convertLeadToCase(payload: ConvertLeadPayload): Promise<ConversionResult> {
  return supabaseFetch<ConversionResult>("rpc/lsr_convert_lead_to_case", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

const caseSelect = "*,client:lsr_clients(id,public_id,full_name,phone,city,nationality,client_safe_summary,internal_notes)";

export async function listCases(): Promise<CaseRow[]> {
  return supabaseFetch<CaseRow[]>(`lsr_requests?select=${encodeURIComponent(caseSelect)}&order=last_activity_at.desc&limit=300`);
}

export async function getCaseByPublicId(publicId: string): Promise<CaseRow | null> {
  const rows = await supabaseFetch<CaseRow[]>(`lsr_requests?select=${encodeURIComponent(caseSelect)}&public_id=eq.${encodeURIComponent(publicId)}&limit=1`);
  return rows[0] ?? null;
}

export async function updateCaseByPublicId(publicId: string, patch: Partial<Pick<CaseRow, "status" | "priority" | "client_safe_summary" | "internal_notes" | "next_action" | "next_action_due_at">>): Promise<CaseRow> {
  const rows = await supabaseFetch<CaseRow[]>(`lsr_requests?public_id=eq.${encodeURIComponent(publicId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...patch, last_activity_at: new Date().toISOString() }),
  });
  if (!rows[0]) throw new Error("Supabase case update returned no request");
  return rows[0];
}

export async function listDocumentsForRequest(requestId: string): Promise<DocumentRow[]> {
  return supabaseFetch<DocumentRow[]>(`lsr_documents?select=*&request_id=eq.${encodeURIComponent(requestId)}&order=required.desc,created_at.asc`);
}

export async function updateDocument(publicId: string, patch: { status?: StaffDocumentStatus; correctionReason?: string; expiresAt?: string | null; internalNotes?: string }): Promise<DocumentRow> {
  const status = patch.status ? documentStatusToDb(patch.status) : undefined;
  const rows = await supabaseFetch<DocumentRow[]>(`lsr_documents?public_id=eq.${encodeURIComponent(publicId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      ...(status ? { status } : {}),
      ...(patch.correctionReason !== undefined ? { needs_correction_reason: patch.correctionReason || null } : {}),
      ...(patch.expiresAt !== undefined ? { expires_at: patch.expiresAt } : {}),
      ...(patch.internalNotes !== undefined ? { internal_notes: patch.internalNotes || null } : {}),
      ...(status === "received" ? { received_at: new Date().toISOString() } : {}),
      ...(status === "verified" ? { verified_at: new Date().toISOString() } : {}),
    }),
  });
  if (!rows[0]) throw new Error("Supabase document update returned no document");
  return rows[0];
}

const taskSelect = "*,client:lsr_clients(id,public_id,full_name,phone,city,nationality),request:lsr_requests(id,public_id,status,next_action)";

export async function listTasks(): Promise<TaskRow[]> {
  return supabaseFetch<TaskRow[]>(`lsr_tasks?select=${encodeURIComponent(taskSelect)}&order=due_at.asc.nullslast,created_at.desc&limit=400`);
}

export async function listTasksForRequest(requestId: string): Promise<TaskRow[]> {
  return supabaseFetch<TaskRow[]>(`lsr_tasks?select=*&request_id=eq.${encodeURIComponent(requestId)}&order=due_at.asc.nullslast,created_at.desc`);
}

export async function updateTask(publicId: string, patch: { status?: TaskStatus; dueAt?: string | null; description?: string; title?: string }): Promise<TaskRow> {
  const rows = await supabaseFetch<TaskRow[]>(`lsr_tasks?public_id=eq.${encodeURIComponent(publicId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.dueAt !== undefined ? { due_at: patch.dueAt } : {}),
      ...(patch.description !== undefined ? { description: patch.description || null } : {}),
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.status === "completed" ? { completed_at: new Date().toISOString() } : {}),
      ...(patch.status && patch.status !== "completed" ? { completed_at: null } : {}),
    }),
  });
  if (!rows[0]) throw new Error("Supabase task update returned no task");
  return rows[0];
}

export async function listActivityForRequest(requestId: string): Promise<ActivityRow[]> {
  return supabaseFetch<ActivityRow[]>(`lsr_activity_logs?select=id,public_id,created_at,event_type,summary,visibility,actor_name&request_id=eq.${encodeURIComponent(requestId)}&order=created_at.desc&limit=100`);
}
