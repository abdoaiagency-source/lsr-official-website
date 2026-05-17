import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { leadRowToStoredLead } from "@/lib/leads";
import { getSupabaseConfig, resolveLead } from "@/lib/supabase-rest";
import { leadResolutionValues, type LeadResolution } from "@/lib/operations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized", message: "كلمة مرور الإدارة غير صحيحة." }, { status: 401 });
  }

  if (!getSupabaseConfig()) {
    return NextResponse.json({ ok: false, error: "persistence_not_configured", message: "لم يتم تفعيل الربط بقاعدة البيانات." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const resolution = typeof body?.resolution === "string" ? body.resolution : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 1000) : "";

  if (!id || !leadResolutionValues.includes(resolution as LeadResolution)) {
    return NextResponse.json({ ok: false, error: "invalid_payload", message: "بيانات الإغلاق غير مكتملة." }, { status: 400 });
  }

  try {
    const row = await resolveLead(id, resolution as LeadResolution, notes);
    return NextResponse.json({ ok: true, lead: leadRowToStoredLead(row), message: "تم تحديث حالة الطلب." });
  } catch (error) {
    console.error("lead_resolution_failed", error);
    return NextResponse.json({ ok: false, error: "lead_resolution_failed", message: "تعذر تحديث الطلب. تأكد أنه غير محوّل." }, { status: 500 });
  }
}
