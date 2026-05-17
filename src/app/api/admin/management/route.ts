import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getManagementStrategicSummary } from "@/lib/operations";
import { getSupabaseConfig, listCases, listDocuments, listLeads, listTasks } from "@/lib/supabase-rest";
import { leadRowToStoredLead } from "@/lib/leads";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!getSupabaseConfig()) return NextResponse.json({ ok: false, error: "persistence_not_configured" }, { status: 503 });
  try {
    const [leadRows, cases, tasks, documents] = await Promise.all([listLeads(), listCases(), listTasks(), listDocuments()]);
    const leads = leadRows.map(leadRowToStoredLead);
    const summary = getManagementStrategicSummary({ leads, cases, tasks, documents });
    return NextResponse.json({ ok: true, ...summary, leads, cases, tasks, documents });
  } catch (error) {
    console.error("management_failed", error);
    return NextResponse.json({ ok: false, error: "management_failed", message: "تعذر تحميل لوحة الإدارة." }, { status: 500 });
  }
}
