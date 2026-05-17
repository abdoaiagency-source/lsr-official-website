import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { caseStatuses } from "@/lib/operations";
import { getSupabaseConfig, listCases, updateCaseByPublicId } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!getSupabaseConfig()) return NextResponse.json({ ok: false, error: "persistence_not_configured", cases: [] }, { status: 503 });

  try {
    const cases = await listCases();
    return NextResponse.json({ ok: true, cases });
  } catch (error) {
    console.error("case_list_failed", error);
    return NextResponse.json({ ok: false, error: "case_list_failed", message: "تعذر تحميل الحالات." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!getSupabaseConfig()) return NextResponse.json({ ok: false, error: "persistence_not_configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const status = typeof body?.status === "string" ? body.status : undefined;
  const priority = Number.isFinite(Number(body?.priority)) ? Math.max(1, Math.min(3, Number(body.priority))) : undefined;
  const clientSafeSummary = typeof body?.clientSafeSummary === "string" ? body.clientSafeSummary.trim().slice(0, 1500) : undefined;
  const internalNotes = typeof body?.internalNotes === "string" ? body.internalNotes.trim().slice(0, 2500) : undefined;
  const nextAction = typeof body?.nextAction === "string" ? body.nextAction.trim().slice(0, 500) : undefined;
  const nextActionDueAt = typeof body?.nextActionDueAt === "string" && body.nextActionDueAt ? body.nextActionDueAt : null;

  if (!id || (status && !caseStatuses.includes(status as never))) {
    return NextResponse.json({ ok: false, error: "invalid_payload", message: "بيانات الحالة غير صحيحة." }, { status: 400 });
  }

  try {
    const updated = await updateCaseByPublicId(id, {
      ...(status ? { status: status as never } : {}),
      ...(priority ? { priority } : {}),
      ...(clientSafeSummary !== undefined ? { client_safe_summary: clientSafeSummary } : {}),
      ...(internalNotes !== undefined ? { internal_notes: internalNotes } : {}),
      ...(nextAction !== undefined ? { next_action: nextAction } : {}),
      ...(nextActionDueAt !== undefined ? { next_action_due_at: nextActionDueAt } : {}),
    });
    return NextResponse.json({ ok: true, case: updated, message: "تم تحديث الحالة." });
  } catch (error) {
    console.error("case_update_failed", error);
    return NextResponse.json({ ok: false, error: "case_update_failed", message: "تعذر تحديث الحالة." }, { status: 500 });
  }
}
