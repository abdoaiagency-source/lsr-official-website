"use client";

import Link from "next/link";
import { useState } from "react";
import { caseStatusLabels, type ManagementFunnelStage, type ManagementPriority, type ManagementWorkload } from "@/lib/operations";
import type { CaseRow, TaskRow } from "@/lib/supabase-rest";
import type { OperationsLead } from "@/lib/operations";

type Metrics = {
  newLeadsToday: number;
  readyDepositLeads: number;
  convertedLeads: number;
  unresolvedLeads: number;
  activeCases: number;
  waitingCases: number;
  completedCases: number;
  overdueTasks: number;
};

type Risks = {
  staleCases: number;
  missingServiceDocuments: number;
  unassignedCases: number;
  expiringServiceDocuments: number;
};

type ManagementResponse = {
  ok: boolean;
  metrics?: Metrics;
  funnel?: ManagementFunnelStage[];
  risks?: Risks;
  priorities?: ManagementPriority[];
  workload?: ManagementWorkload[];
  leads?: OperationsLead[];
  cases?: CaseRow[];
  tasks?: TaskRow[];
  message?: string;
  error?: string;
};

const metricCards: Array<{ key: keyof Metrics; label: string; helper: string; tone?: string }> = [
  { key: "readyDepositLeads", label: "جاهز للدفعة", helper: "أقرب فرص تجارية", tone: "gold" },
  { key: "activeCases", label: "حالات نشطة", helper: "ملفات قيد التشغيل" },
  { key: "overdueTasks", label: "مهام متأخرة", helper: "تحتاج تدخل اليوم", tone: "red" },
  { key: "unresolvedLeads", label: "طلبات مفتوحة", helper: "لم تُغلق أو تتحول بعد" },
  { key: "newLeadsToday", label: "طلبات اليوم", helper: "دخلت اليوم" },
  { key: "waitingCases", label: "بانتظار إجراء", helper: "عميل أو طرف خارجي" },
  { key: "convertedLeads", label: "تحويلات", helper: "من طلب إلى حالة" },
  { key: "completedCases", label: "مكتمل", helper: "ملفات منتهية" },
];

const riskLabels: Array<{ key: keyof Risks; label: string; helper: string }> = [
  { key: "staleCases", label: "حالات ساكنة", helper: "لا يوجد تحديث منذ 7 أيام أو أكثر" },
  { key: "missingServiceDocuments", label: "مستندات خدمة ناقصة", helper: "تتبع خدمة فقط، بدون مستندات شخصية حساسة" },
  { key: "unassignedCases", label: "بدون مالك", helper: "حالات نشطة تحتاج مسؤول واضح" },
  { key: "expiringServiceDocuments", label: "تنتهي قريباً", helper: "مستندات خدمة تحتاج مراجعة" },
];

function EmptyLine({ text }: { text: string }) {
  return <p className="muted-line">{text}</p>;
}

export default function ManagementDashboard() {
  const [data, setData] = useState<ManagementResponse | null>(null);
  const [notice, setNotice] = useState({ type: "info", text: "اضغط تحديث الرؤية لتحميل بيانات الإدارة من Supabase." });
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/management");
      const next = (await response.json()) as ManagementResponse;
      if (!response.ok || !next.ok) throw new Error(next.message || next.error);
      setData(next);
      setNotice({ type: "success", text: "تم تحديث الرؤية الاستراتيجية من Supabase." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "تعذر التحميل" });
    } finally {
      setLoading(false);
    }
  }


  const metrics = data?.metrics;
  const priorities = data?.priorities ?? [];
  const readyDepositLeads = (data?.leads ?? []).filter((lead) => lead.status === "ready_deposit" && !lead.converted).slice(0, 6);
  const attentionCases = (data?.cases ?? []).filter((item) => item.status !== "completed" && item.status !== "rejected").slice(0, 6);
  const overdueTasks = (data?.tasks ?? []).filter((task) => task.status === "open" && task.due_at && new Date(task.due_at) < new Date()).slice(0, 6);

  return (
    <main className="ops-page staff-page strategic-page">
      <section className="ops-hero glass-panel">
        <div>
          <p className="eyebrow">LSR OS · الإدارة الاستراتيجية</p>
          <h1>لوحة قرار يومية للمبيعات والتشغيل</h1>
          <p className="hero-copy">رؤية واحدة لما يهم الإدارة: أين المال، أين الملفات المتوقفة، من يملك العمل، وما الذي يحتاج متابعة اليوم.</p>
        </div>
        <nav className="ops-actions">
          <Link className="btn secondary" href="/operations">الطلبات</Link>
          <Link className="btn secondary" href="/cases">الحالات</Link>
          <Link className="btn secondary" href="/tasks">المهام</Link>
        </nav>
      </section>

      <section className="admin-auth-panel session-panel strategic-toolbar">
        <strong>تم تسجيل الدخول كموظف LSR</strong>
        <button onClick={load} disabled={loading}>{loading ? "جاري التحديث..." : "تحديث الرؤية"}</button>
        <a className="btn secondary" href="/api/admin/auth/logout" onClick={(event) => { event.preventDefault(); fetch("/api/admin/auth/logout", { method: "POST" }).then(() => location.href = "/signin"); }}>خروج</a>
        <p className={`ops-notice ops-notice-${notice.type}`}>{notice.text}</p>
      </section>

      {metrics ? (
        <>
          <section className="metrics-grid management-grid strategic-metrics">
            {metricCards.map((card) => (
              <div className={`metric-card glass-panel ${card.tone ? `metric-${card.tone}` : ""}`} key={card.key}>
                <span>{card.label}</span>
                <strong>{metrics[card.key]}</strong>
                <small>{card.helper}</small>
              </div>
            ))}
          </section>

          <section className="strategic-two-column">
            <div className="queue-panel glass-panel decision-panel">
              <p className="eyebrow">أولوية اليوم</p>
              <h2>ماذا يجب أن تتابع الإدارة صباحاً؟</h2>
              {priorities.length ? priorities.map((priority) => (
                <div className={`priority-row priority-${priority.tone}`} key={priority.type}>
                  <strong>{priority.count}</strong>
                  <span>{priority.label}</span>
                </div>
              )) : <EmptyLine text="لا توجد إشارات خطر أو فرص عاجلة حالياً." />}
            </div>

            <div className="queue-panel glass-panel risk-panel">
              <p className="eyebrow">المخاطر التشغيلية</p>
              <h2>أين يمكن أن يتوقف العمل؟</h2>
              <div className="risk-grid">
                {riskLabels.map((risk) => (
                  <div className="risk-card" key={risk.key}>
                    <strong>{data.risks?.[risk.key] ?? 0}</strong>
                    <span>{risk.label}</span>
                    <small>{risk.helper}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="queue-panel glass-panel funnel-panel">
            <div className="compact-head">
              <p className="eyebrow">المسار التجاري والتشغيلي</p>
              <h2>من الطلب إلى الملف المكتمل</h2>
            </div>
            <div className="funnel-track">
              {(data.funnel ?? []).map((stage, index) => (
                <div className="funnel-stage" key={stage.key}>
                  <span className="stage-index">{index + 1}</span>
                  <strong>{stage.count}</strong>
                  <h3>{stage.label}</h3>
                  <p>{stage.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="management-lists strategic-lists">
            <div className="queue-panel glass-panel">
              <h2>أقرب فرص الدفعة</h2>
              {readyDepositLeads.length ? readyDepositLeads.map((lead) => <p key={lead.id}>{lead.name} · {lead.phone}</p>) : <EmptyLine text="لا توجد فرص جاهزة للدفعة الآن." />}
            </div>
            <div className="queue-panel glass-panel">
              <h2>حالات تحتاج انتباه</h2>
              {attentionCases.length ? attentionCases.map((item) => <p key={item.id}><Link href={`/cases/${item.public_id}`}>{item.public_id}</Link> · {caseStatusLabels[item.status]} · {item.client?.full_name ?? "عميل"}</p>) : <EmptyLine text="لا توجد حالات مفتوحة حالياً." />}
            </div>
            <div className="queue-panel glass-panel">
              <h2>مهام متأخرة</h2>
              {overdueTasks.length ? overdueTasks.map((task) => <p key={task.id}>{task.title} · {task.assigned_to_name || "غير محدد"}</p>) : <EmptyLine text="لا توجد مهام متأخرة." />}
            </div>
          </section>

          <section className="queue-panel glass-panel workload-panel">
            <div className="compact-head">
              <p className="eyebrow">ملكية العمل</p>
              <h2>توزيع الحمل حسب المسؤول</h2>
            </div>
            <div className="workload-grid">
              {(data.workload ?? []).length ? data.workload?.map((owner) => (
                <div className="workload-card" key={owner.owner}>
                  <h3>{owner.owner}</h3>
                  <p><strong>{owner.activeCases}</strong><span>حالات نشطة</span></p>
                  <p><strong>{owner.openTasks}</strong><span>مهام مفتوحة</span></p>
                  <p><strong>{owner.overdueTasks}</strong><span>متأخرة</span></p>
                </div>
              )) : <EmptyLine text="لا توجد مهام أو حالات موزعة بعد." />}
            </div>
          </section>
        </>
      ) : <section className="empty-state glass-panel"><h3>جاري تجهيز الرؤية</h3><p>سيتم عرض المؤشرات بعد تحميل بيانات Supabase.</p></section>}
    </main>
  );
}
