"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = { ok: boolean; message?: string; error?: string };

export default function StaffSignIn({ nextPath = "/operations" }: { nextPath?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("أدخل بيانات الدخول للوصول إلى LSR OS.");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice("جاري تسجيل الدخول...");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as LoginResponse;
      if (!response.ok || !data.ok) throw new Error(data.message || data.error || "login_failed");
      const next = nextPath;
      router.replace(next.startsWith("/") ? next : "/operations");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="signin-page" dir="rtl">
      <section className="signin-card glass-panel">
        <p className="eyebrow">LSR OS · دخول الموظفين</p>
        <h1>تسجيل الدخول إلى نظام التشغيل</h1>
        <p>هذه المساحة مخصصة لفريق LSR لمراجعة الطلبات، الحالات، المستندات، والمتابعات.</p>
        <form onSubmit={submit}>
          <label>
            <span>كلمة مرور الموظف</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          <button className="btn" disabled={loading}>{loading ? "جاري الدخول..." : "دخول إلى LSR OS"}</button>
        </form>
        <p className="ops-notice">{notice}</p>
      </section>
    </main>
  );
}
