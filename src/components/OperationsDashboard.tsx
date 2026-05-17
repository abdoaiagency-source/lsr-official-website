"use client";

import { useMemo, useState } from "react";
import { conversionErrorMessage, type ConversionResult } from "@/lib/case-conversion";
import { filterLeadsForOperations, leadResolutionLabels, leadResolutionValues, type LeadFilterStatus, type LeadResolution, type OperationsLead } from "@/lib/operations";
import { caseStatusLabels as statusLabels } from "@/lib/operations";
import type { LeadStatus } from "@/lib/conversion";

type LeadsResponse = { ok: boolean; leads?: OperationsLead[]; error?: string; message?: string };
type ConvertResponse = { ok: boolean; result?: ConversionResult; error?: string; message?: string };

type Notice = { type: "success" | "error" | "info"; text: string };

const statusFilterLabels: Record<LeadFilterStatus, string> = {
  all: "كل الحالات",
  converted: "تم تحويلها",
  ready_deposit: statusLabels.ready_deposit,
  needs_documents: statusLabels.needs_documents,
  rejected: statusLabels.rejected,
  submitted: statusLabels.submitted,
  in_process: statusLabels.in_process,
  completed: statusLabels.completed,
};

const statusFilters: LeadFilterStatus[] = ["all", "ready_deposit", "needs_documents", "rejected", "converted"];

function authHeaders(password: string): Record<string, string> {
  return password.trim() ? { Authorization: `Bearer ${password.trim()}` } : {};
}

export default function OperationsDashboard() {
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<OperationsLead[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadFilterStatus>("all");
  const [resolutionFilter, setResolutionFilter] = useState<LeadResolution | "all">("active");
  const [search, setSearch] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [notice, setNotice] = useState<Notice>({ type: "info", text: "حمّل الطلبات من قاعدة البيانات لبدء العمل." });
  const [loading, setLoading] = useState(false);

  const visibleLeads = useMemo(() => filterLeadsForOperations(leads, { status: statusFilter, resolution: resolutionFilter, search }), [leads, statusFilter, resolutionFilter, search]);
  const selected = useMemo(() => leads.find((lead) => lead.id === selectedId) ?? visibleLeads[0], [leads, selectedId, visibleLeads]);

  const metrics = useMemo(() => ({
    active: leads.filter((lead) => !lead.converted && (lead.resolution ?? "active") === "active").length,
    ready: leads.filter((lead) => !lead.converted && lead.status === "ready_deposit" && (lead.resolution ?? "active") === "active").length,
    docs: leads.filter((lead) => !lead.converted && lead.status === "needs_documents" && (lead.resolution ?? "active") === "active").length,
    converted: leads.filter((lead) => lead.converted).length,
    resolved: leads.filter((lead) => (lead.resolution ?? "active") !== "active").length,
  }), [leads]);

  async function loadLeads() {
    setLoading(true);
    setNotice({ type: "info", text: "جاري تحميل الطلبات..." });
    try {
      const response = await fetch("/api/admin/leads", { headers: authHeaders(password) });
      const data = (await response.json()) as LeadsResponse;
      if (!response.ok || !data.ok) throw new Error(data.message || data.error || "load_failed");
      setLeads(data.leads ?? []);
      setSelectedId(data.leads?.[0]?.id ?? "");
      setNotice({ type: "success", text: `تم تحميل ${data.leads?.length ?? 0} طلب.` });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "تعذر تحميل الطلبات." });
    } finally {
      setLoading(false);
    }
  }

  async function convertSelected() {
    if (!selected) return;
    if (selected.converted) return setNotice({ type: "error", text: "هذا الطلب محوّل مسبقاً." });
    if ((selected.resolution ?? "active") !== "active") return setNotice({ type: "error", text: "لا يمكن تحويل طلب مغلق. أعده إلى نشط أولاً." });
    setLoading(true);
    try {
      const response = await fetch("/api/admin/leads/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(password) },
        body: JSON.stringify({ id: selected.id }),
      });
      const data = (await response.json()) as ConvertResponse;
      if (!response.ok || !data.ok || !data.result?.ok) {
        throw new Error(data.message || conversionErrorMessage(data.result?.error, data.result?.converted_request_id));
      }
      setLeads((current) => current.map((lead) => lead.id === selected.id ? { ...lead, converted: true, convertedRequestId: data.result?.request_public_id, convertedAt: new Date().toISOString() } : lead));
      setNotice({ type: "success", text: `تم تحويل الطلب إلى حالة رقم ${data.result.request_public_id}.` });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "تعذر التحويل." });
    } finally {
      setLoading(false);
    }
  }

  async function resolveSelected(resolution: LeadResolution) {
    if (!selected) return;
    if (selected.converted && resolution !== "active") return setNotice({ type: "error", text: "لا يمكن إغلاق طلب محوّل." });
    if (resolution !== "active" && !confirm("سيتم إغلاق الطلب ومنع تحويله إلى حالة. هل تريد المتابعة؟")) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/leads/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(password) },
        body: JSON.stringify({ id: selected.id, resolution, notes: resolutionNotes }),
      });
      const data = (await response.json()) as LeadsResponse & { lead?: OperationsLead };
      if (!response.ok || !data.ok || !data.lead) throw new Error(data.message || data.error || "resolve_failed");
      setLeads((current) => current.map((lead) => lead.id === selected.id ? data.lead! : lead));
      setResolutionNotes("");
      setNotice({ type: "success", text: data.message || "تم تحديث الطلب." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "تعذر تحديث الطلب." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ops-page staff-page">
      <section className="ops-hero glass-panel">
        <div>
          <p className="eyebrow">LSR OS · تشغيل الطلبات</p>
          <h1>مراجعة الطلبات وتحويل الجاهز إلى حالات تشغيلية</h1>
          <p className="hero-copy">هذه اللوحة هي نقطة التحويل من اهتمام الموقع إلى ملف عمل واضح: حالة، مستندات، مهمة متابعة، ومسؤول.</p>
        </div>
        <nav className="ops-actions" aria-label="روابط التشغيل">
          <a className="btn secondary" href="/cases">الحالات</a>
          <a className="btn secondary" href="/tasks">المهام</a>
          <a className="btn secondary" href="/management">الإدارة</a>
          <a className="btn" href="/qualification">نموذج التأهيل</a>
        </nav>
      </section>

      <section className="admin-auth-panel">
        <label><span>كلمة مرور الإدارة</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="اتركها فارغة إذا كانت البيئة تسمح" /></label>
        <button onClick={loadLeads} disabled={loading}>{loading ? "جاري العمل..." : "تحميل الطلبات"}</button>
        <p className={`ops-notice ops-notice-${notice.type}`}>{notice.text}</p>
      </section>

      <section className="metrics-grid">
        <div className="metric-card glass-panel"><span>طلبات نشطة</span><strong>{metrics.active}</strong><small>غير محوّلة</small></div>
        <div className="metric-card glass-panel"><span>جاهزة للدفعة</span><strong>{metrics.ready}</strong><small>أولوية تجارية</small></div>
        <div className="metric-card glass-panel"><span>تحتاج مستندات</span><strong>{metrics.docs}</strong><small>متابعة أوراق</small></div>
        <div className="metric-card glass-panel converted-metric"><span>تم تحويلها</span><strong>{metrics.converted}</strong><small>أصبحت حالات</small></div>
        <div className="metric-card glass-panel"><span>مغلقة</span><strong>{metrics.resolved}</strong><small>مفقود / مكرر</small></div>
      </section>

      <section className="staff-filters glass-panel">
        <input aria-label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالاسم أو الهاتف أو رقم الطلب" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadFilterStatus)}>{statusFilters.map((status) => <option key={status} value={status}>{statusFilterLabels[status]}</option>)}</select>
        <select value={resolutionFilter} onChange={(event) => setResolutionFilter(event.target.value as LeadResolution | "all")}><option value="all">كل الإغلاقات</option><option value="active">نشط فقط</option>{leadResolutionValues.filter((value) => value !== "active").map((value) => <option key={value} value={value}>{leadResolutionLabels[value]}</option>)}</select>
      </section>

      <section className="conversion-workspace">
        <div className="queue-panel glass-panel">
          <div className="queue-head compact-head"><h2>قائمة المراجعة</h2><p className="ops-notice">{visibleLeads.length} طلب مطابق للفلاتر.</p></div>
          <div className="lead-list">
            {visibleLeads.map((lead) => <article className={`lead-card review-card glass-panel ${selected?.id === lead.id ? "selected" : ""}`} key={lead.id}>
              <button className="lead-select-button" onClick={() => setSelectedId(lead.id)}>
                <span className={`status-pill status-${lead.status}`}>{statusLabels[lead.status]}</span>
                <strong>{lead.name}</strong>
                <small>{lead.phone} · {lead.id}</small>
                <small>{lead.converted ? `محوّل إلى ${lead.convertedRequestId}` : leadResolutionLabels[lead.resolution ?? "active"]}</small>
              </button>
            </article>)}
            {!visibleLeads.length && <div className="empty-state glass-panel"><h3>لا توجد طلبات مطابقة</h3><p>غيّر الفلاتر أو حمّل البيانات من جديد.</p></div>}
          </div>
        </div>

        <aside className="lead-detail-panel glass-panel">
          {selected ? <>
            <div className="detail-head"><span className={`status-pill status-${selected.status}`}>{statusLabels[selected.status]}</span><h2>{selected.name}</h2><p>{selected.phone}</p></div>
            <div className="detail-grid"><div><span>رقم الطلب</span><strong>{selected.id}</strong></div><div><span>المدينة</span><strong>{selected.city || "غير محدد"}</strong></div><div><span>الجنسية</span><strong>{selected.nationality || "غير محدد"}</strong></div><div><span>الأولوية</span><strong>{selected.priority}</strong></div></div>
            <section className="detail-section"><strong>الرسالة الآمنة للعميل</strong><p>{selected.clientMessage}</p></section>
            <section className="detail-section"><strong>المستندات الناقصة</strong>{selected.missingDocuments?.length ? <ul>{selected.missingDocuments.map((doc) => <li key={doc}>{doc}</li>)}</ul> : <p>لا توجد مستندات ناقصة.</p>}</section>
            <section className="detail-section"><strong>الإجراء التالي</strong><p>{selected.nextAction}</p></section>
            <section className="detail-section"><strong>إغلاق/تصنيف قبل التحويل</strong><textarea value={resolutionNotes} onChange={(event) => setResolutionNotes(event.target.value)} placeholder="ملاحظة داخلية اختيارية قبل الإغلاق" /></section>
            <div className="detail-actions">
              <button className="btn" disabled={loading || selected.converted || (selected.resolution ?? "active") !== "active"} onClick={convertSelected}>تحويل إلى حالة</button>
              <button className="btn secondary local-status" disabled={loading} onClick={() => resolveSelected("lost")}>مفقود</button>
              <button className="btn secondary local-status" disabled={loading} onClick={() => resolveSelected("duplicate")}>مكرر</button>
              <button className="btn secondary local-status" disabled={loading} onClick={() => resolveSelected("not_interested")}>غير مهتم</button>
              {(selected.resolution ?? "active") !== "active" && <button className="btn secondary local-status" disabled={loading} onClick={() => resolveSelected("active")}>إعادة تنشيط</button>}
            </div>
          </> : <div className="empty-state"><h3>اختر طلباً</h3><p>سيظهر ملخص التأهيل والإجراء المطلوب هنا.</p></div>}
        </aside>
      </section>
    </main>
  );
}
