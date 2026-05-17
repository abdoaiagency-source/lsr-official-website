import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { taskStatuses } from "@/lib/operations";
import { getSupabaseConfig, listTasks, updateTask } from "@/lib/supabase-rest";

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
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const status = typeof body?.status === "string" ? body.status : undefined;
  if (!id || (status && !taskStatuses.includes(status as never))) {
    return NextResponse.json({ ok: false, error: "invalid_payload", message: "بيانات المهمة غير صحيحة." }, { status: 400 });
  }
  try {
    const task = await updateTask(id, {
      status: status as never,
      dueAt: typeof body?.dueAt === "string" ? body.dueAt || null : undefined,
      title: typeof body?.title === "string" ? body.title.trim().slice(0, 200) : undefined,
      description: typeof body?.description === "string" ? body.description.trim().slice(0, 1000) : undefined,
    });
    return NextResponse.json({ ok: true, task, message: "تم تحديث المهمة." });
  } catch (error) {
    console.error("task_update_failed", error);
    return NextResponse.json({ ok: false, error: "task_update_failed", message: "تعذر تحديث المهمة." }, { status: 500 });
  }
}
