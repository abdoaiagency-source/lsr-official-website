import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { parseTaskPatchPayload } from "@/lib/admin-route-schemas";
import { getSupabaseConfig, insertActivityLog, listTasks, updateTask } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!getSupabaseConfig()) return NextResponse.json({ ok: false, error: "persistence_not_configured", tasks: [] }, { status: 503 });
  try {
    return NextResponse.json({ ok: true, tasks: await listTasks() });
  } catch (error) {
    console.error("task_list_failed", error);
    return NextResponse.json({ ok: false, error: "task_list_failed", message: "تعذر تحميل المهام." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!getSupabaseConfig()) return NextResponse.json({ ok: false, error: "persistence_not_configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  let parsed: ReturnType<typeof parseTaskPatchPayload>;
  try {
    parsed = parseTaskPatchPayload(body);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload", message: "بيانات المهمة غير صحيحة." }, { status: 400 });
  }
  const changedFields = [
    parsed.status !== undefined ? "status" : null,
    parsed.dueAt !== undefined ? "due_at" : null,
    parsed.title !== undefined ? "title" : null,
    parsed.description !== undefined ? "description" : null,
  ].filter(Boolean) as string[];
  try {
    const task = await updateTask(parsed.id, {
      status: parsed.status,
      dueAt: parsed.dueAt,
      title: parsed.title,
      description: parsed.description,
    });
    await insertActivityLog({
      eventType: "task_updated",
      requestId: task.request_id,
      clientId: task.client_id,
      taskId: task.id,
      taskPublicId: task.public_id,
      actorRole: "admin",
      changedFields,
    }).catch((error) => console.error("task_audit_log_failed", error));
    return NextResponse.json({ ok: true, task, message: "تم تحديث المهمة." });
  } catch (error) {
    console.error("task_update_failed", error);
    return NextResponse.json({ ok: false, error: "task_update_failed", message: "تعذر تحديث المهمة." }, { status: 500 });
  }
}
