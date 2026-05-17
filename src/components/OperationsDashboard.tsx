"use client";

import { useMemo, useState } from "react";
import { conversionErrorMessage, type ConversionResult } from "@/lib/case-conversion";
import { getDocumentLabel, type LeadStatus, type MissingDocument, type StoredLead } from "@/lib/conversion";

const storageKey = "lsr_conversion_leads";
const adminTokenKey = "lsr_admin_token";

const labels: Record<LeadStatus, string> = {
  rejected: "لا يمكن البدء حالياً",
  needs_documents: "يحتاج أوراق",
  ready_deposit: "جاهز للدفعة",
  submitted: "تم التسليم",
  in_process: "تحت الإجراء",
  completed: "مكتمل",
};

const priorityOrder: LeadStatus[] = ["ready_deposit", "needs_documents", "rejected", "submitted", "in_process", "completed"];

const metricHints: Record<LeadStatus, string> = {
  ready_deposit: "أولوية فورية",
  needs_documents: "متابعة أوراق",
  rejected: "مرفوض مبدئياً",
  submitted: "تم الاستلام",
  in_process: "قيد العمل",
  completed: "منتهي",
};

type DataSource = "server" | "local";

type NoticeTone = "info" | "success" | "error";

type Notice = {
  tone: NoticeTone;
  text: string;
};

function readLocalLeads() {
  if (typeof window === "undefined") return [];
  return JSON.parse(window.localStorage.getItem(storageKey) || "[]") as StoredLead[];
}

function writeLocalLeads(leads: StoredLead[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(leads));
}

function statusCounts(leads: StoredLead[]) {
  return priorityOrder.reduce<Record<LeadStatus, number>>((acc, status) => {
    acc[status] = leads.filter((lead) => lead.status === status && !lead.converted).length;
    return acc;
  }, {
    rejected: 0,
    needs_documents: 0,
    ready_deposit: 0,
    submitted: 0,
    in_process: 0,
    completed: 0,
  });
}

function documentLabel(document: string) {
  const known = ["entry_stamp_or_visa_proof", "passport_validity_confirmation", "health_certificate", "photos", "sponsor_clearance"];
  return known.includes(document) ? getDocumentLabel(document as MissingDocument) : document;
}

export default function OperationsDashboard() {
  const [leads, setLeads] = useState<StoredLead[]>(() => readLocalLeads());
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem(adminTokenKey) || "");
  const [dataSource, setDataSource] = useState<DataSource>("local");
  const [notice, setNotice] = useState<Notice>({
    tone: "info",
    text: "اللوحة تعرض البيانات المحلية مؤقتاً. اضغط تحميل من قاعدة البيانات عند تفعيل الربط.",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const counts = useMemo(() => statusCounts(leads), [leads]);
  const unconvertedLeads = useMemo(() => {
    return leads
      .filter((lead) => !lead.converted)
      .sort((a, b) => priorityOrder.indexOf(a.status) - priorityOrder.indexOf(b.status));
  }, [leads]);
  const convertedCount = leads.filter((lead) => lead.converted).length;
  const selectedLead = useMemo(() => {
    return unconvertedLeads.find((lead) => lead.id === selectedLeadId) ?? unconvertedLeads[0] ?? null;
  }, [selectedLeadId, unconvertedLeads]);

  async function loadLeads(token = adminToken) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/leads", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json();

      if (response.ok && Array.isArray(payload.leads)) {
        setLeads(payload.leads);
        setSelectedLeadId(payload.leads.find((lead: StoredLead) => !lead.converted)?.id ?? null);
        setDataSource("server");
        setNotice({ tone: "success", text: "تم تحميل الطلبات غير المحولة من قاعدة البيانات." });
        if (token) window.localStorage.setItem(adminTokenKey, token);
        return;
      }

      if (response.status === 401) {
        setNotice({ tone: "error", text: "أدخل كلمة مرور الإدارة لقراءة بيانات قاعدة البيانات." });
      } else {
        setNotice({ tone: "error", text: "قاعدة البيانات غير مفعلة حالياً، لذلك يتم عرض البيانات المحلية المؤقتة." });
      }
    } catch {
      setNotice({ tone: "error", text: "تعذر الاتصال بـ API، لذلك يتم عرض البيانات المحلية المؤقتة." });
    } finally {
      setIsLoading(false);
    }

    setLeads(readLocalLeads());
    setDataSource("local");
  }

  async function updateStatus(id: string, status: LeadStatus) {
    if (dataSource === "server") {
      try {
        const response = await fetch("/api/admin/leads", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
          },
          body: JSON.stringify({ id, status }),
        });
        const payload = await response.json();
        if (response.ok && payload.lead) {
          setLeads((current) => current.map((lead) => lead.id === id ? payload.lead : lead));
          return;
        }
      } catch {
        setNotice({ tone: "error", text: "فشل تحديث قاعدة البيانات. تم تنفيذ التحديث محلياً مؤقتاً." });
      }
    }

    const nextLeads = leads.map((lead) => lead.id === id ? { ...lead, status } : lead);
    setLeads(nextLeads);
    writeLocalLeads(nextLeads);
  }

  async function convertSelectedLead() {
    if (!selectedLead) return;

    if (dataSource !== "server") {
      setNotice({ tone: "error", text: "التحويل إلى حالة يحتاج الاتصال بقاعدة البيانات. اضغط تحميل من قاعدة البيانات أولاً." });
      return;
    }

    const confirmed = window.confirm("هل أنت متأكد من تحويل هذا الطلب إلى حالة؟");
    if (!confirmed) return;

    setConvertingId(selectedLead.id);
    try {
      const response = await fetch("/api/admin/leads/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify({ leadPublicId: selectedLead.id }),
      });
      const payload = await response.json() as ConversionResult & { message?: string };

      if (response.ok && payload.ok) {
        setLeads((current) => current.map((lead) => lead.id === selectedLead.id ? {
          ...lead,
          converted: true,
          convertedRequestId: payload.request_public_id ?? null,
          convertedAt: new Date().toISOString(),
        } : lead));
        setSelectedLeadId(null);
        setNotice({ tone: "success", text: payload.message || `تم تحويل الطلب إلى حالة بنجاح. رقم الحالة: ${payload.request_public_id}` });
        return;
      }

      setNotice({
        tone: "error",
        text: payload.message || conversionErrorMessage(payload.error, payload.converted_request_id),
      });
    } catch {
      setNotice({ tone: "error", text: conversionErrorMessage("transaction_failed") });
    } finally {
      setConvertingId(null);
    }
  }

  function clearLocalDemo() {
    window.localStorage.removeItem(storageKey);
    if (dataSource === "local") setLeads([]);
  }

  return (
    <main className="ops-page">
      <section className="ops-hero">
        <div>
          <p className="section-label">Lead-to-Case Conversion MVP</p>
          <h1>لوحة مراجعة الطلبات وتحويلها إلى حالات تشغيلية.</h1>
          <p>راجع بيانات الطلب، ثم حوّله مرة واحدة إلى عميل، حالة، قائمة مستندات، مهمة متابعة، وسجل نشاط.</p>
        </div>
        <div className="ops-actions">
          <a className="btn primary" href="/qualification">إضافة طلب جديد</a>
          <button className="btn secondary" type="button" onClick={() => void loadLeads()}>{isLoading ? "جاري التحميل..." : "تحميل الطلبات"}</button>
          <button className="btn secondary" type="button" onClick={clearLocalDemo}>مسح المحلي</button>
        </div>
      </section>

      <section className="admin-auth-panel">
        <label>
          <span>كلمة مرور الإدارة</span>
          <input value={adminToken} onChange={(event) => setAdminToken(event.target.value)} type="password" placeholder="اختياري إذا لم تكن API محمية" />
        </label>
        <button type="button" onClick={() => void loadLeads(adminToken)}>تحميل من قاعدة البيانات</button>
        <p className={`ops-notice ops-notice-${notice.tone}`}><strong>{dataSource === "server" ? "Database" : "Local"}</strong> · {notice.text}</p>
      </section>

      <section className="metrics-grid" aria-label="مؤشرات الطلبات غير المحولة">
        {priorityOrder.map((status) => (
          <article className="metric-card" key={status}>
            <span>{labels[status]}</span>
            <strong>{counts[status]}</strong>
            <small>{metricHints[status]}</small>
          </article>
        ))}
        <article className="metric-card converted-metric">
          <span>تم تحويلها</span>
          <strong>{convertedCount}</strong>
          <small>مؤرشف تشغيلياً</small>
        </article>
      </section>

      <section className="conversion-workspace">
        <div className="queue-panel lead-review-list">
          <div className="queue-head compact-head">
            <div>
              <p className="section-label">طلبات غير محولة</p>
              <h2>ابدأ بالجاهز للدفعة، ثم الطلبات الناقصة.</h2>
            </div>
          </div>

          <div className="lead-list">
            {unconvertedLeads.length === 0 ? (
              <div className="empty-state">
                <h3>لا توجد طلبات غير محولة.</h3>
                <p>عند وصول طلب جديد من شات التأهيل سيظهر هنا للمراجعة.</p>
                <a className="btn primary" href="/qualification">فتح شات التأهيل</a>
              </div>
            ) : unconvertedLeads.map((lead) => (
              <article className={`lead-card review-card ${selectedLead?.id === lead.id ? "selected" : ""}`} key={lead.id}>
                <button type="button" className="lead-select-button" onClick={() => setSelectedLeadId(lead.id)}>
                  <span className={`status-pill status-${lead.status}`}>{labels[lead.status]}</span>
                  <strong>{lead.name || "طلب بدون اسم"}</strong>
                  <small>{lead.phone} · {lead.city || "المدينة غير محددة"}</small>
                </button>
                <div className="lead-actions">
                  <button type="button" onClick={() => setSelectedLeadId(lead.id)}>عرض التفاصيل</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="queue-panel lead-detail-panel" aria-live="polite">
          {selectedLead ? (
            <>
              <div className="detail-head">
                <span className={`status-pill status-${selectedLead.status}`}>{labels[selectedLead.status]}</span>
                <h2>{selectedLead.name}</h2>
                <p>{selectedLead.id}</p>
              </div>

              <div className="detail-grid">
                <div><span>الهاتف</span><strong>{selectedLead.phone}</strong></div>
                <div><span>المدينة</span><strong>{selectedLead.city || "غير محددة"}</strong></div>
                <div><span>الجنسية</span><strong>{selectedLead.nationality || "غير محددة"}</strong></div>
                <div><span>الأولوية</span><strong>{selectedLead.priority}</strong></div>
              </div>

              <div className="detail-section">
                <strong>الإجراء التالي</strong>
                <p>{selectedLead.nextAction}</p>
              </div>

              <div className="detail-section">
                <strong>المستندات الناقصة</strong>
                {selectedLead.missingDocuments.length > 0 ? (
                  <ul>
                    {selectedLead.missingDocuments.map((document) => <li key={document}>{documentLabel(document)}</li>)}
                  </ul>
                ) : <p>لا توجد مستندات ناقصة في الطلب.</p>}
              </div>

              <div className="detail-section">
                <strong>رسالة العميل الآمنة</strong>
                <p>{selectedLead.clientMessage}</p>
              </div>

              <div className="detail-actions">
                <button className="btn primary" type="button" onClick={() => void convertSelectedLead()} disabled={convertingId === selectedLead.id}>
                  {convertingId === selectedLead.id ? "جاري التحويل..." : "تحويل إلى حالة"}
                </button>
                <button className="btn secondary local-status" type="button" onClick={() => void updateStatus(selectedLead.id, "submitted")}>تم التسليم</button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>اختر طلباً للمراجعة.</h3>
              <p>سيتم عرض كل تفاصيل الطلب هنا قبل التحويل إلى حالة تشغيلية.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
