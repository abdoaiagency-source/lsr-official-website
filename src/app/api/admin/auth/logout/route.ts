import { NextResponse } from "next/server";
import { clearStaffSessionCookie } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  await clearStaffSessionCookie();
  return NextResponse.json({ ok: true, message: "تم تسجيل الخروج." });
}
