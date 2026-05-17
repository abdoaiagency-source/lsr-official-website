import { NextResponse } from "next/server";
import { setStaffSessionCookie, validateStaffPassword } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!validateStaffPassword(body?.password)) {
    return NextResponse.json({ ok: false, error: "invalid_credentials", message: "كلمة المرور غير صحيحة." }, { status: 401 });
  }

  await setStaffSessionCookie();
  return NextResponse.json({ ok: true, message: "تم تسجيل الدخول." });
}
