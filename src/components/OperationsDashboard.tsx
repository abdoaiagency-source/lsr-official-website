"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeadStatus, StoredLead } from "@/lib/conversion";

const storageKey = "lsr_conversion_leads";

const labels: Record<LeadStatus, string> = {
  rejected: "لا يمكن البدء حالياً",
  needs_documents: "يحتاج أوراق",
  ready_deposit: "جاهز للدفعة",
  submitted: "تم التسليم",
  in_process: "تحت الإجراء",
  completed: "مكتمل",
};

const priorityOrder: LeadStatus[] = ["ready_deposit", "needs_documents", "rejected", "submitted", "in_process", "completed"];

function readLeads() {
  if (typeof window === "undefined") return [];
  return JSON.parse(window.localStorage.getItem(storageKey) || "[]") as StoredLead[];
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
  const [leads, setLeads] = useState<StoredLead[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setLeads(readLeads()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const counts = useMemo(() => statusCounts(leads), [leads]);
  const orderedLeads = useMemo(() => {
    return [...leads].sort((a, b) => priorityOrder.indexOf(a.status) - priorityOrder.indexOf(b.status));
  }, [leads]);

  function updateStatus(id: string, status: LeadStatus) {
    const nextLeads = leads.map((lead) => lead.id === id ? { ...lead, status } : lead);
    setLeads(nextLeads);
    window.localStorage.setItem(storageKey, JSON.stringify(nextLeads));
  }

  function clearDemo() {
    window.localStorage.removeItem(storageKey);
    setLeads([]);
  }

  return (
    <main className="ops-page">
      <section className="ops-hero">
        <div>
          <p className="section-label">Conversion Engine MVP</p>
          <h1>لوحة أيوب: الأولوية للحالات الجاهزة للدفعة.</h1>
          <p>هذه لوحة تجريبية تعتمد على leads محفوظة محلياً من شات التأهيل. المرحلة القادمة تربطها بقاعدة بيانات حقيقية.</p>
        </div>
        <div className="ops-actions">
          <a className="btn primary" href="/qualification">إضافة Lead جديد</a>
          <button className="btn secondary" type="button" onClick={clearDemo}>مسح البيانات التجريبية</button>
        </div>
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
                <button type="button" onClick={() => updateStatus(lead.id, "submitted")}>تحويل إلى submitted</button>
                <button type="button" onClick={() => updateStatus(lead.id, "in_process")}>تحت الإجراء</button>
                <button type="button" onClick={() => updateStatus(lead.id, "completed")}>مكتمل</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
