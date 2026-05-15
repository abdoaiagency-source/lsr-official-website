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
    "lsr_conversion_leads?select=*&order=priority.asc,created_at.desc&limit=200",
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
