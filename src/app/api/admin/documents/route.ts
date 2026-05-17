import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { staffDocumentStatuses } from "@/lib/operations";
import { getSupabaseConfig, updateDocument } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!isAdminAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!getSupabaseConfig()) return NextResponse.json({ ok: false, error: "persistence_not_configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const status = typeof body?.status === "string" ? body.status : undefined;
  if (!id || (status && !staffDocumentStatuses.includes(status as never))) {
    return NextResponse.json({ ok: false, error: "invalid_payload", message: "بيانات المستند غير صحيحة." }, { status: 400 });
  }
  try {
    const document = await updateDocument(id, {
      status: status as never,
      correctionReason: typeof body?.correctionReason === "string" ? body.correctionReason.slice(0, 800) : undefined,
      expiresAt: typeof body?.expiresAt === "string" ? body.expiresAt || null : undefined,
      internalNotes: typeof body?.internalNotes === "string" ? body.internalNotes.slice(0, 1200) : undefined,
    });
    return NextResponse.json({ ok: true, document, message: "تم تحديث المستند." });
  } catch (error) {
    console.error("document_update_failed", error);
    return NextResponse.json({ ok: false, error: "document_update_failed", message: "تعذر تحديث المستند." }, { status: 500 });
  }
}
