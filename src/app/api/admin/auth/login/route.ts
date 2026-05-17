import { NextResponse } from "next/server";
import {
  checkStaffLoginRateLimit,
  recordFailedStaffLogin,
  recordSuccessfulStaffLogin,
  setStaffSessionCookie,
  validateStaffPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = checkStaffLoginRateLimit(request);
  if (rateLimit.limited) {
    return NextResponse.json(
      { ok: false, error: "too_many_attempts", message: "محاولات كثيرة. حاول لاحقاً." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  const role = validateStaffPassword(body?.password);
  if (!role) {
    recordFailedStaffLogin(request);
    return NextResponse.json({ ok: false, error: "invalid_credentials", message: "كلمة المرور غير صحيحة." }, { status: 401 });
  }

  recordSuccessfulStaffLogin(request);
  await setStaffSessionCookie(role);
  return NextResponse.json({ ok: true, role, message: "تم تسجيل الدخول." });
}
