import { NextResponse } from "next/server";
import { getAuthorizedStaffRole } from "@/lib/admin-auth";
import { buildManagementDashboardDto, getManagementStrategicSummary } from "@/lib/operations";
import { getSupabaseConfig, listCases, listDocuments, listLeads, listTasks } from "@/lib/supabase-rest";
import { leadRowToStoredLead } from "@/lib/leads";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const role = getAuthorizedStaffRole(request);
  if (!role) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (role !== "admin") return NextResponse.json({ ok: false, error: "forbidden", message: "هذه اللوحة مخصصة للإدارة فقط." }, { status: 403 });
  if (!getSupabaseConfig()) return NextResponse.json({ ok: false, error: "persistence_not_configured" }, { status: 503 });
  try {
    const [leadRows, cases, tasks, documents] = await Promise.all([listLeads(), listCases(), listTasks(), listDocuments()]);
    const leads = leadRows.map(leadRowToStoredLead);
    const summary = getManagementStrategicSummary({ leads, cases, tasks, documents });
    return NextResponse.json({ ok: true, ...buildManagementDashboardDto(summary, { leads, cases, tasks }) });
  } catch (error) {
    console.error("management_failed", error);
    return NextResponse.json({ ok: false, error: "management_failed", message: "تعذر تحميل لوحة الإدارة." }, { status: 500 });
  }
}
