import { NextResponse } from "next/server";
import { leadRowToStoredLead, leadStatusSchema } from "@/lib/leads";
import { getSupabaseConfig, listLeads, updateLeadStatus } from "@/lib/supabase-rest";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return true;
  return request.headers.get("authorization") === `Bearer ${adminPassword}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!getSupabaseConfig()) {
    return NextResponse.json({ ok: false, error: "persistence_not_configured", leads: [] }, { status: 503 });
  }

  try {
    const rows = await listLeads();
    return NextResponse.json({ ok: true, leads: rows.map(leadRowToStoredLead) });
  } catch (error) {
    console.error("lead_list_failed", error);
    return NextResponse.json({ ok: false, error: "lead_list_failed", leads: [] }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = leadStatusSchema
    .transform((status) => status)
    .safeParse(body?.status);
  const id = typeof body?.id === "string" ? body.id : "";

  if (!id || !parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_update_payload" }, { status: 400 });
  }

  if (!getSupabaseConfig()) {
    return NextResponse.json({ ok: false, error: "persistence_not_configured" }, { status: 503 });
  }

  try {
    const row = await updateLeadStatus(id, parsed.data);
    return NextResponse.json({ ok: true, lead: leadRowToStoredLead(row) });
  } catch (error) {
    console.error("lead_update_failed", error);
    return NextResponse.json({ ok: false, error: "lead_update_failed" }, { status: 500 });
  }
}
