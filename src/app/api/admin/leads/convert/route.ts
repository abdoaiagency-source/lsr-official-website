import { NextResponse } from "next/server";
import { buildConvertLeadPayload, conversionErrorMessage, DEFAULT_LSR_WORKER_ID, generateRequestPublicId } from "@/lib/case-conversion";
import { convertLeadToCase, getSupabaseConfig } from "@/lib/supabase-rest";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return true;
  return request.headers.get("authorization") === `Bearer ${adminPassword}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized", message: "غير مصرح بالدخول." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const leadPublicId = typeof body?.leadPublicId === "string" ? body.leadPublicId.trim() : "";

  if (!leadPublicId) {
    const message = conversionErrorMessage("missing_required_fields");
    return NextResponse.json({ ok: false, error: "missing_required_fields", message }, { status: 400 });
  }

  if (!getSupabaseConfig()) {
    return NextResponse.json(
      { ok: false, error: "persistence_not_configured", message: "قاعدة البيانات غير مفعلة حالياً." },
      { status: 503 },
    );
  }

  const requestPublicId = generateRequestPublicId();
  const actorWorkerId = typeof body?.actorWorkerId === "string" && body.actorWorkerId.trim()
    ? body.actorWorkerId.trim()
    : DEFAULT_LSR_WORKER_ID;
  const defaultWorkerId = typeof body?.defaultWorkerId === "string" && body.defaultWorkerId.trim()
    ? body.defaultWorkerId.trim()
    : DEFAULT_LSR_WORKER_ID;

  try {
    const result = await convertLeadToCase(buildConvertLeadPayload(leadPublicId, requestPublicId, actorWorkerId, defaultWorkerId));

    if (!result.ok) {
      const message = conversionErrorMessage(result.error, result.converted_request_id);
      return NextResponse.json({ ...result, message }, { status: result.error === "lead_already_converted" ? 409 : 400 });
    }

    return NextResponse.json({ ...result, message: `تم تحويل الطلب إلى حالة بنجاح. رقم الحالة: ${result.request_public_id}` }, { status: 201 });
  } catch (error) {
    console.error("lead_conversion_failed", error);
    return NextResponse.json(
      { ok: false, error: "transaction_failed", message: conversionErrorMessage("transaction_failed") },
      { status: 500 },
    );
  }
}
