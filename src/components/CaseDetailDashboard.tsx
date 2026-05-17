"use client";

import { useState } from "react";
import { caseStatusLabels, caseStatuses, documentStatusFromDb, documentStatusLabels, staffDocumentStatuses, type CaseStatus, type StaffDocumentStatus } from "@/lib/operations";
import type { ActivityRow, CaseRow, DocumentRow, TaskRow } from "@/lib/supabase-rest";

type DetailResponse = { ok: boolean; case?: CaseRow; documents?: DocumentRow[]; tasks?: TaskRow[]; activity?: ActivityRow[]; message?: string; error?: string; document?: DocumentRow };
function authHeaders(password: string): Record<string, string> { return password.trim() ? { Authorization: `Bearer ${password.trim()}` } : {}; }

export default function CaseDetailDashboard({ caseId }: { caseId: string }) {
  const [password, setPassword] = useState("");
  const [item, setItem] = useState<CaseRow | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [notice, setNotice] = useState({ type: "info", text: "حمّل تفاصيل الحالة." });
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState({ status: "" as CaseStatus | "", nextAction: "", nextActionDueAt: "", clientSafeSummary: "", internalNotes: "" });

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/cases/${caseId}`, { headers: authHeaders(password) });
      const data = (await response.json()) as DetailResponse;
      if (!response.ok || !data.ok || !data.case) throw new Error(data.message || data.error);
      setItem(data.case);
      setDocuments(data.documents ?? []);
      setTasks(data.tasks ?? []);
      setActivity(data.activity ?? []);
      setDraft({ status: data.case.status, nextAction: data.case.next_action ?? "", nextActionDueAt: data.case.next_action_due_at ? data.case.next_action_due_at.slice(0, 16) : "", clientSafeSummary: data.case.client_safe_summary ?? "", internalNotes: data.case.internal_notes ?? "" });
      setNotice({ type: "success", text: "تم تحميل تفاصيل الحالة." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "تعذر التحميل" });
    } finally { setLoading(false); }
  }

  async function saveCase() {
    if (!item) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/cases", { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders(password) }, body: JSON.stringify({ id: item.public_id, status: draft.status, nextAction: draft.nextAction, nextActionDueAt: draft.nextActionDueAt ? new Date(draft.nextActionDueAt).toISOString() : null, clientSafeSummary: draft.clientSafeSummary, internalNotes: draft.internalNotes }) });
      const data = (await response.json()) as { ok: boolean; case?: CaseRow; message?: string; error?: string };
      if (!response.ok || !data.ok || !data.case) throw new Error(data.message || data.error);
      setItem({ ...item, ...data.case });
      setNotice({ type: "success", text: data.message || "تم حفظ الحالة." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "تعذر الحفظ" });
    } finally { setLoading(false); }
  }

  async function updateDoc(id: string, status: StaffDocumentStatus) {
    setLoading(true);
    try {
      const reason = status === "needs_correction" ? prompt("سبب التصحيح المطلوب؟") || "يحتاج تصحيح" : undefined;
      const response = await fetch("/api/admin/documents", { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders(password) }, body: JSON.stringify({ id, status, correctionReason: reason }) });
      const data = (await response.json()) as DetailResponse;
      if (!response.ok || !data.ok || !data.document) throw new Error(data.message || data.error);
      setDocuments((current) => current.map((document) => document.public_id === id ? data.document! : document));
      setNotice({ type: "success", text: data.message || "تم تحديث المستند." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "تعذر تحديث المستند" });
    } finally { setLoading(false); }
  }

  return (
    <main className="ops-page staff-page">
      <section className="ops-hero glass-panel"><div><p className="eyebrow">LSR OS · تفاصيل الحالة</p><h1>{item?.client?.full_name || caseId}</h1><p className="hero-copy">تحكم في الحالة، المستندات، الملاحظات، والإجراء القادم من شاشة واحدة.</p></div><nav className="ops-actions"><a className="btn secondary" href="/cases">كل الحالات</a><a className="btn secondary" href="/tasks">المهام</a><a className="btn secondary" href="/operations">الطلبات</a></nav></section>
      <section className="admin-auth-panel session-panel"><strong>تم تسجيل الدخول كموظف LSR</strong><button onClick={load} disabled={loading}>{loading ? "جاري العمل..." : "تحميل التفاصيل"}</button><a className="btn secondary" href="/api/admin/auth/logout" onClick={(event) => { event.preventDefault(); fetch("/api/admin/auth/logout", { method: "POST" }).then(() => location.href = "/signin"); }}>خروج</a><p className={`ops-notice ops-notice-${notice.type}`}>{notice.text}</p></section>
      {item ? (
        <section className="case-detail-grid">
          <div className="queue-panel glass-panel">
            <div className="detail-head"><span className={`status-pill status-${item.status}`}>{caseStatusLabels[item.status]}</span><h2>{item.public_id}</h2><p>{item.client?.phone}</p></div>
            <div className="detail-grid"><div><span>العميل</span><strong>{item.client?.full_name}</strong></div><div><span>المسؤول</span><strong>{item.assigned_owner_name || "غير محدد"}</strong></div><div><span>الأولوية</span><strong>{item.priority}</strong></div><div><span>المصدر</span><strong>{item.source_lead_public_id || "يدوي"}</strong></div></div>
            <section className="detail-section"><strong>تحديث الحالة</strong><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as CaseStatus })}>{caseStatuses.map((status) => <option key={status} value={status}>{caseStatusLabels[status]}</option>)}</select><textarea value={draft.nextAction} onChange={(event) => setDraft({ ...draft, nextAction: event.target.value })} placeholder="الإجراء القادم" /><input type="datetime-local" value={draft.nextActionDueAt} onChange={(event) => setDraft({ ...draft, nextActionDueAt: event.target.value })} /><textarea value={draft.clientSafeSummary} onChange={(event) => setDraft({ ...draft, clientSafeSummary: event.target.value })} placeholder="ملخص آمن للعميل" /><textarea value={draft.internalNotes} onChange={(event) => setDraft({ ...draft, internalNotes: event.target.value })} placeholder="ملاحظات داخلية لا تظهر للعميل" /><button className="btn" onClick={saveCase} disabled={loading}>حفظ الحالة</button></section>
          </div>
          <aside className="lead-detail-panel">
            <section className="detail-section glass-panel"><strong>المستندات</strong>{documents.map((document) => <div className="doc-row" key={document.id}><div><b>{document.client_safe_label}</b><span>{documentStatusLabels[documentStatusFromDb(document.status, document.expires_at)]}</span>{document.needs_correction_reason && <small>{document.needs_correction_reason}</small>}</div><select disabled={loading} value={documentStatusFromDb(document.status, document.expires_at)} onChange={(event) => updateDoc(document.public_id, event.target.value as StaffDocumentStatus)}>{staffDocumentStatuses.map((status) => <option value={status} key={status}>{documentStatusLabels[status]}</option>)}</select></div>)}{!documents.length && <p>لا توجد مستندات مسجلة.</p>}</section>
            <section className="detail-section glass-panel"><strong>المهام</strong>{tasks.map((task) => <p key={task.id}>{task.title} · {task.status}</p>)}{!tasks.length && <p>لا توجد مهام.</p>}</section>
            <section className="detail-section glass-panel"><strong>سجل النشاط</strong>{activity.map((log) => <p key={log.id}>{log.summary}</p>)}{!activity.length && <p>لا يوجد نشاط.</p>}</section>
          </aside>
        </section>
      ) : <section className="empty-state glass-panel"><h3>لم يتم تحميل الحالة</h3><p>أدخل كلمة المرور واضغط تحميل التفاصيل.</p></section>}
    </main>
  );
}
