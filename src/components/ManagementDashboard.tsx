"use client";

import { useState } from "react";
import { caseStatusLabels } from "@/lib/operations";
import type { CaseRow, TaskRow } from "@/lib/supabase-rest";
import type { OperationsLead } from "@/lib/operations";

type Metrics = { newLeadsToday: number; readyDepositLeads: number; convertedLeads: number; unresolvedLeads: number; activeCases: number; waitingCases: number; completedCases: number; overdueTasks: number };
type ManagementResponse = { ok: boolean; metrics?: Metrics; leads?: OperationsLead[]; cases?: CaseRow[]; tasks?: TaskRow[]; message?: string; error?: string };
function authHeaders(password: string): Record<string, string> { return password.trim() ? { Authorization: `Bearer ${password.trim()}` } : {}; }

const metricLabels: Record<keyof Metrics, string> = {
  newLeadsToday: "طلبات جديدة اليوم",
  readyDepositLeads: "جاهز للدفعة",
  convertedLeads: "محوّل لحالات",
  unresolvedLeads: "طلبات مفتوحة",
  activeCases: "حالات نشطة",
  waitingCases: "بانتظار عميل/تسليم",
  completedCases: "مكتملة",
  overdueTasks: "مهام متأخرة",
};

export default function ManagementDashboard() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<ManagementResponse | null>(null);
  const [notice, setNotice] = useState({ type: "info", text: "حمّل لوحة الإدارة." });
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/management", { headers: authHeaders(password) });
      const next = (await response.json()) as ManagementResponse;
      if (!response.ok || !next.ok) throw new Error(next.message || next.error);
      setData(next);
      setNotice({ type: "success", text: "تم تحميل مؤشرات الإدارة." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "تعذر التحميل" });
    } finally {
      setLoading(false);
    }
  }

  const metrics = data?.metrics;
  return (
    <main className="ops-page staff-page">
      <section className="ops-hero glass-panel"><div><p className="eyebrow">LSR OS · الإدارة</p><h1>رؤية تنفيذية للمبيعات والتشغيل</h1><p className="hero-copy">مؤشرات بسيطة بلا ذكاء اصطناعي: أين الطلبات، أين الحالات، وما المتأخر اليوم.</p></div><nav className="ops-actions"><a className="btn secondary" href="/operations">الطلبات</a><a className="btn secondary" href="/cases">الحالات</a><a className="btn secondary" href="/tasks">المهام</a></nav></section>
      <section className="admin-auth-panel session-panel"><strong>تم تسجيل الدخول كموظف LSR</strong><button onClick={load} disabled={loading}>{loading ? "جاري العمل..." : "تحميل المؤشرات"}</button><a className="btn secondary" href="/api/admin/auth/logout" onClick={(event) => { event.preventDefault(); fetch("/api/admin/auth/logout", { method: "POST" }).then(() => location.href = "/signin"); }}>خروج</a><p className={`ops-notice ops-notice-${notice.type}`}>{notice.text}</p></section>
      {metrics ? (
        <>
          <section className="metrics-grid management-grid">{Object.entries(metricLabels).map(([key, label]) => <div className="metric-card glass-panel" key={key}><span>{label}</span><strong>{metrics[key as keyof Metrics]}</strong><small>مباشر من Supabase</small></div>)}</section>
          <section className="management-lists">
            <div className="queue-panel glass-panel"><h2>أقرب فرص الدفعة</h2>{(data.leads ?? []).filter((lead) => lead.status === "ready_deposit" && !lead.converted).slice(0, 8).map((lead) => <p key={lead.id}>{lead.name} · {lead.phone}</p>)}</div>
            <div className="queue-panel glass-panel"><h2>حالات تحتاج انتباه</h2>{(data.cases ?? []).filter((item) => item.status !== "completed" && item.status !== "rejected").slice(0, 8).map((item) => <p key={item.id}><a href={`/cases/${item.public_id}`}>{item.public_id}</a> · {caseStatusLabels[item.status]} · {item.client?.full_name}</p>)}</div>
            <div className="queue-panel glass-panel"><h2>مهام متأخرة</h2>{(data.tasks ?? []).filter((task) => task.status === "open" && task.due_at && new Date(task.due_at) < new Date()).slice(0, 8).map((task) => <p key={task.id}>{task.title} · {task.assigned_to_name || "غير محدد"}</p>)}</div>
          </section>
        </>
      ) : <section className="empty-state glass-panel"><h3>لا توجد مؤشرات بعد</h3><p>اضغط تحميل المؤشرات بعد إدخال كلمة المرور.</p></section>}
    </main>
  );
}
