import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getCaseByPublicId, getSupabaseConfig, listActivityForRequest, listDocumentsForRequest, listTasksForRequest } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!getSupabaseConfig()) return NextResponse.json({ ok: false, error: "persistence_not_configured" }, { status: 503 });
  const { id } = await context.params;
  try {
    const requestCase = await getCaseByPublicId(id);
    if (!requestCase) return NextResponse.json({ ok: false, error: "case_not_found", message: "لم يتم العثور على الحالة." }, { status: 404 });
    const [documents, tasks, activity] = await Promise.all([
      listDocumentsForRequest(requestCase.id),
      listTasksForRequest(requestCase.id),
      listActivityForRequest(requestCase.id),
    ]);
    return NextResponse.json({ ok: true, case: requestCase, documents, tasks, activity });
  } catch (error) {
    console.error("case_detail_failed", error);
    return NextResponse.json({ ok: false, error: "case_detail_failed", message: "تعذر تحميل تفاصيل الحالة." }, { status: 500 });
  }
}
