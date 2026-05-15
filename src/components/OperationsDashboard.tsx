"use client";

import { useMemo, useState } from "react";
import type { LeadStatus, StoredLead } from "@/lib/conversion";

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

type DataSource = "server" | "local";

function readLocalLeads() {
  if (typeof window === "undefined") return [];
  return JSON.parse(window.localStorage.getItem(storageKey) || "[]") as StoredLead[];
}

function writeLocalLeads(leads: StoredLead[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(leads));
}

function statusCounts(leads: StoredLead[]) {
  return priorityOrder.reduce<Record<LeadStatus, number>>((acc, status) => {
    acc[status] = leads.filter((lead) => lead.status === status).length;
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

export default function OperationsDashboard() {
  const [leads, setLeads] = useState<StoredLead[]>(() => readLocalLeads());
  const [adminToken, setAdminToken] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem(adminTokenKey) || "");
  const [dataSource, setDataSource] = useState<DataSource>("local");
  const [notice, setNotice] = useState("اللوحة تستخدم البيانات المحلية مؤقتاً. اضغط تحميل من قاعدة البيانات عند تفعيل Supabase.");
  const [isLoading, setIsLoading] = useState(false);

  const counts = useMemo(() => statusCounts(leads), [leads]);
  const orderedLeads = useMemo(() => {
    return [...leads].sort((a, b) => priorityOrder.indexOf(a.status) - priorityOrder.indexOf(b.status));
  }, [leads]);

  async function loadLeads(token = adminToken) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/leads", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json();

      if (response.ok && Array.isArray(payload.leads)) {
        setLeads(payload.leads);
        setDataSource("server");
        setNotice("البيانات معروضة من قاعدة البيانات.");
        if (token) window.localStorage.setItem(adminTokenKey, token);
        return;
      }

      if (response.status === 401) {
        setNotice("أدخل كلمة مرور الإدارة لقراءة بيانات قاعدة البيانات. سيتم عرض البيانات المحلية مؤقتاً.");
      } else {
        setNotice("قاعدة البيانات غير مفعلة حالياً، لذلك يتم عرض البيانات المحلية المؤقتة.");
      }
    } catch {
      setNotice("تعذر الاتصال بـ API، لذلك يتم عرض البيانات المحلية المؤقتة.");
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
        setNotice("فشل تحديث قاعدة البيانات. تم تنفيذ التحديث محلياً مؤقتاً.");
      }
    }

    const nextLeads = leads.map((lead) => lead.id === id ? { ...lead, status } : lead);
    setLeads(nextLeads);
    writeLocalLeads(nextLeads);
  }

  function clearLocalDemo() {
    window.localStorage.removeItem(storageKey);
    if (dataSource === "local") setLeads([]);
  }

  return (
    <main className="ops-page">
      <section className="ops-hero">
        <div>
          <p className="section-label">Conversion Engine MVP</p>
          <h1>لوحة أيوب: الأولوية للحالات الجاهزة للدفعة.</h1>
          <p>المرحلة الحالية تضيف API وقاعدة بيانات Supabase عند توفر المتغيرات، مع fallback محلي حتى لا يتوقف الديمو.</p>
        </div>
        <div className="ops-actions">
          <a className="btn primary" href="/qualification">إضافة Lead جديد</a>
          <button className="btn secondary" type="button" onClick={() => void loadLeads()}>{isLoading ? "جاري التحميل..." : "تحديث البيانات"}</button>
          <button className="btn secondary" type="button" onClick={clearLocalDemo}>مسح المحلي</button>
        </div>
      </section>

      <section className="admin-auth-panel">
        <label>
          <span>كلمة مرور الإدارة</span>
          <input value={adminToken} onChange={(event) => setAdminToken(event.target.value)} type="password" placeholder="اختياري إذا لم تكن API محمية" />
        </label>
        <button type="button" onClick={() => void loadLeads(adminToken)}>تحميل من قاعدة البيانات</button>
        <p><strong>{dataSource === "server" ? "Database" : "Local"}</strong> · {notice}</p>
      </section>

      <section className="metrics-grid" aria-label="مؤشرات التحويل">
        {priorityOrder.map((status) => (
          <article className="metric-card" key={status}>
            <span>{labels[status]}</span>
            <strong>{counts[status]}</strong>
            <small>{status}</small>
          </article>
        ))}
      </section>

      <section className="queue-panel">
        <div className="queue-head">
          <div>
            <p className="section-label">قائمة المتابعة</p>
            <h2>الترتيب حسب قيمة الفرصة، وليس حسب وقت الدخول فقط.</h2>
          </div>
          <p>ابدأ بـ <strong>ready_deposit</strong>، ثم حوّل الحالات إلى <strong>submitted</strong> فقط بعد استلام الأوراق والدفعة.</p>
        </div>

        <div className="lead-list">
          {orderedLeads.length === 0 ? (
            <div className="empty-state">
              <h3>لا توجد leads بعد.</h3>
              <p>افتح شات التأهيل وأضف أول حالة لتظهر هنا.</p>
              <a className="btn primary" href="/qualification">فتح شات التأهيل</a>
            </div>
          ) : orderedLeads.map((lead) => (
            <article className="lead-card" key={lead.id}>
              <div className="lead-main">
                <span className={`status-pill status-${lead.status}`}>{labels[lead.status]}</span>
                <h3>{lead.name || "Lead بدون اسم"}</h3>
                <p>{lead.phone} · {lead.city || "المدينة غير محددة"} · {lead.nationality || "الجنسية غير محددة"}</p>
                <small>{new Date(lead.createdAt).toLocaleString("ar-LY")}</small>
              </div>
              <div className="lead-next">
                <strong>الإجراء التالي</strong>
                <span>{lead.nextAction}</span>
              </div>
              <div className="lead-actions">
                <button type="button" onClick={() => void updateStatus(lead.id, "submitted")}>تحويل إلى submitted</button>
                <button type="button" onClick={() => void updateStatus(lead.id, "in_process")}>تحت الإجراء</button>
                <button type="button" onClick={() => void updateStatus(lead.id, "completed")}>مكتمل</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
