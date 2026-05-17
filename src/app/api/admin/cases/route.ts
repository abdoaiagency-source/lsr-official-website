import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { parseCasePatchPayload } from "@/lib/admin-route-schemas";
import { getSupabaseConfig, insertActivityLog, listCases, updateCaseByPublicId } from "@/lib/supabase-rest";

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
  let parsed: ReturnType<typeof parseCasePatchPayload>;
  try {
    parsed = parseCasePatchPayload(body);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload", message: "بيانات الحالة غير صحيحة." }, { status: 400 });
  }
  const changedFields = [
    parsed.status !== undefined ? "status" : null,
    parsed.priority !== undefined ? "priority" : null,
    parsed.clientSafeSummary !== undefined ? "client_safe_summary" : null,
    parsed.internalNotes !== undefined ? "internal_notes" : null,
    parsed.nextAction !== undefined ? "next_action" : null,
    parsed.nextActionDueAt !== undefined ? "next_action_due_at" : null,
  ].filter(Boolean) as string[];

  try {
    const updated = await updateCaseByPublicId(parsed.id, {
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.priority ? { priority: parsed.priority } : {}),
      ...(parsed.clientSafeSummary !== undefined ? { client_safe_summary: parsed.clientSafeSummary } : {}),
      ...(parsed.internalNotes !== undefined ? { internal_notes: parsed.internalNotes } : {}),
      ...(parsed.nextAction !== undefined ? { next_action: parsed.nextAction } : {}),
      ...(parsed.nextActionDueAt !== undefined ? { next_action_due_at: parsed.nextActionDueAt } : {}),
    });
    await insertActivityLog({
      eventType: "case_updated",
      requestId: updated.id,
      clientId: updated.client_id,
      requestPublicId: updated.public_id,
      actorRole: "admin",
      changedFields,
    }).catch((error) => console.error("case_audit_log_failed", error));
    return NextResponse.json({ ok: true, case: updated, message: "تم تحديث الحالة." });
  } catch (error) {
    console.error("case_update_failed", error);
    return NextResponse.json({ ok: false, error: "case_update_failed", message: "تعذر تحديث الحالة." }, { status: 500 });
  }
}
