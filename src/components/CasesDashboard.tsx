"use client";

import { useMemo, useState } from "react";
import { caseStatusLabels, formatDueLabel, type CaseStatus } from "@/lib/operations";
import type { CaseRow } from "@/lib/supabase-rest";

type Notice = { type: "success" | "error" | "info"; text: string };
type CasesResponse = { ok: boolean; cases?: CaseRow[]; message?: string; error?: string };

const statusFilters: (CaseStatus | "all" | "active")[] = ["active", "all", "ready_deposit", "needs_documents", "submitted", "in_process", "completed", "rejected"];
const statusFilterLabels: Record<CaseStatus | "all" | "active", string> = { active: "النشطة", all: "كل الحالات", ...caseStatusLabels };
function authHeaders(password: string): Record<string, string> { return password.trim() ? { Authorization: `Bearer ${password.trim()}` } : {}; }

export default function CasesDashboard() {
  const [password] = useState("");
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CaseStatus | "all" | "active">("active");
  const [notice, setNotice] = useState<Notice>({ type: "info", text: "حمّل الحالات من قاعدة البيانات." });
  const [loading, setLoading] = useState(false);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cases.filter((item) => {
      if (status === "active" && ["completed", "rejected"].includes(item.status)) return false;
      if (status !== "all" && status !== "active" && item.status !== status) return false;
      if (!query) return true;
      return [item.public_id, item.client?.full_name, item.client?.phone, item.assigned_owner_name, item.next_action].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
    });
  }, [cases, search, status]);

  async function loadCases() {
    setLoading(true);
    setNotice({ type: "info", text: "جاري تحميل الحالات..." });
    try {
      const response = await fetch("/api/admin/cases", { headers: authHeaders(password) });
      const data = (await response.json()) as CasesResponse;
      if (!response.ok || !data.ok) throw new Error(data.message || data.error || "load_failed");
      setCases(data.cases ?? []);
      setNotice({ type: "success", text: `تم تحميل ${data.cases?.length ?? 0} حالة.` });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "تعذر تحميل الحالات." });
    } finally { setLoading(false); }
  }

  return <main className="ops-page staff-page">
    <section className="ops-hero glass-panel"><div><p className="eyebrow">LSR OS · الحالات</p><h1>ملفات العمل بعد التحويل</h1><p className="hero-copy">تابع حالة كل عميل، المسؤول، المستندات الناقصة، والإجراء القادم.</p></div><nav className="ops-actions"><a className="btn secondary" href="/operations">الطلبات</a><a className="btn secondary" href="/tasks">المهام</a><a className="btn secondary" href="/management">الإدارة</a></nav></section>
    <section className="admin-auth-panel session-panel"><strong>تم تسجيل الدخول كموظف LSR</strong><button onClick={loadCases} disabled={loading}>{loading ? "جاري العمل..." : "تحميل الحالات"}</button><a className="btn secondary" href="/api/admin/auth/logout" onClick={(event) => { event.preventDefault(); fetch("/api/admin/auth/logout", { method: "POST" }).then(() => location.href = "/signin"); }}>خروج</a><p className={`ops-notice ops-notice-${notice.type}`}>{notice.text}</p></section>
    <section className="staff-filters glass-panel"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث برقم الحالة، الاسم، الهاتف أو المسؤول" /><select value={status} onChange={(e)=>setStatus(e.target.value as never)}>{statusFilters.map((value)=><option key={value} value={value}>{statusFilterLabels[value]}</option>)}</select></section>
    <section className="queue-panel glass-panel"><div className="queue-head"><div><h2>قائمة الحالات</h2><p className="ops-notice">{visible.length} حالة مطابقة.</p></div></div><div className="lead-list">{visible.map((item)=><article className="lead-card glass-panel" key={item.id}><div className="lead-main"><span className={`status-pill status-${item.status}`}>{caseStatusLabels[item.status]}</span><h3>{item.client?.full_name || "عميل بدون اسم"}</h3><p>{item.client?.phone || "بدون هاتف"} · {item.public_id}</p></div><div className="lead-next"><strong>{item.next_action || "لا يوجد إجراء مسجل"}</strong><span>{formatDueLabel(item.next_action_due_at)}</span><span>المسؤول: {item.assigned_owner_name || "غير محدد"}</span></div><div className="lead-actions"><a className="btn secondary" href={`/cases/${item.public_id}`}>فتح الحالة</a></div></article>)}{!visible.length && <div className="empty-state glass-panel"><h3>لا توجد حالات</h3><p>حمّل البيانات أو غيّر الفلاتر.</p></div>}</div></section>
  </main>;
}
