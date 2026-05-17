import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getManagementMetrics } from "@/lib/operations";
import { getSupabaseConfig, listCases, listLeads, listTasks } from "@/lib/supabase-rest";
import { leadRowToStoredLead } from "@/lib/leads";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!getSupabaseConfig()) return NextResponse.json({ ok: false, error: "persistence_not_configured" }, { status: 503 });
  try {
    const [leadRows, cases, tasks] = await Promise.all([listLeads(), listCases(), listTasks()]);
    const leads = leadRows.map(leadRowToStoredLead);
    return NextResponse.json({ ok: true, metrics: getManagementMetrics({ leads, cases, tasks }), leads, cases, tasks });
  } catch (error) {
    console.error("management_failed", error);
    return NextResponse.json({ ok: false, error: "management_failed", message: "تعذر تحميل لوحة الإدارة." }, { status: 500 });
  }
}
