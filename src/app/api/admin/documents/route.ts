import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { parseDocumentPatchPayload } from "@/lib/admin-route-schemas";
import { getSupabaseConfig, insertActivityLog, updateDocument } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!isAdminAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!getSupabaseConfig()) return NextResponse.json({ ok: false, error: "persistence_not_configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  let parsed: ReturnType<typeof parseDocumentPatchPayload>;
  try {
    parsed = parseDocumentPatchPayload(body);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload", message: "بيانات المستند غير صحيحة." }, { status: 400 });
  }
  const changedFields = [
    parsed.status !== undefined ? "status" : null,
    parsed.correctionReason !== undefined ? "needs_correction_reason" : null,
    parsed.expiresAt !== undefined ? "expires_at" : null,
    parsed.internalNotes !== undefined ? "internal_notes" : null,
  ].filter(Boolean) as string[];
  try {
    const document = await updateDocument(parsed.id, {
      status: parsed.status,
      correctionReason: parsed.correctionReason,
      expiresAt: parsed.expiresAt,
      internalNotes: parsed.internalNotes,
    });
    await insertActivityLog({
      eventType: "document_updated",
      requestId: document.request_id,
      clientId: document.client_id,
      documentId: document.id,
      documentPublicId: document.public_id,
      actorRole: "admin",
      changedFields,
    }).catch((error) => console.error("document_audit_log_failed", error));
    return NextResponse.json({ ok: true, document, message: "تم تحديث المستند." });
  } catch (error) {
    console.error("document_update_failed", error);
    return NextResponse.json({ ok: false, error: "document_update_failed", message: "تعذر تحديث المستند." }, { status: 500 });
  }
}
