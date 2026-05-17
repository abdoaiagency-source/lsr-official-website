"use client";

import { useMemo, useState } from "react";
import { formatDueLabel, taskBucket, taskStatusLabels, type TaskBucket, type TaskStatus } from "@/lib/operations";
import type { TaskRow } from "@/lib/supabase-rest";

type TasksResponse = { ok: boolean; tasks?: TaskRow[]; task?: TaskRow; message?: string; error?: string };
const bucketLabels: Record<TaskBucket | "all", string> = { all: "كل المهام", overdue: "متأخرة", today: "اليوم", upcoming: "قادمة", completed: "مكتملة", cancelled: "ملغاة" };
function authHeaders(password: string): Record<string, string> { return password.trim() ? { Authorization: `Bearer ${password.trim()}` } : {}; }

export default function TasksDashboard() {
  const [password, setPassword] = useState("");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [bucket, setBucket] = useState<TaskBucket | "all">("today");
  const [notice, setNotice] = useState({ type: "info", text: "حمّل المهام لمتابعة اليوم." });
  const [loading, setLoading] = useState(false);
  const visible = useMemo(() => tasks.filter((task) => bucket === "all" || taskBucket({ status: task.status, dueAt: task.due_at }) === bucket), [tasks, bucket]);

  async function loadTasks() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/tasks", { headers: authHeaders(password) });
      const data = (await response.json()) as TasksResponse;
      if (!response.ok || !data.ok) throw new Error(data.message || data.error);
      setTasks(data.tasks ?? []);
      setNotice({ type: "success", text: `تم تحميل ${data.tasks?.length ?? 0} مهمة.` });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "تعذر التحميل" });
    } finally {
      setLoading(false);
    }
  }

  async function setTaskStatus(id: string, status: TaskStatus) {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(password) },
        body: JSON.stringify({ id, status }),
      });
      const data = (await response.json()) as TasksResponse;
      if (!response.ok || !data.ok || !data.task) throw new Error(data.message || data.error);
      setTasks((current) => current.map((task) => (task.public_id === id ? data.task! : task)));
      setNotice({ type: "success", text: data.message || "تم تحديث المهمة." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "تعذر التحديث" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ops-page staff-page">
      <section className="ops-hero glass-panel">
        <div><p className="eyebrow">LSR OS · المتابعة اليومية</p><h1>المهام والمتابعات</h1><p className="hero-copy">قائمة عملية لما يجب تنفيذه اليوم وما تأخر وما اكتمل.</p></div>
        <nav className="ops-actions"><a className="btn secondary" href="/operations">الطلبات</a><a className="btn secondary" href="/cases">الحالات</a><a className="btn secondary" href="/management">الإدارة</a></nav>
      </section>
      <section className="admin-auth-panel"><label><span>كلمة مرور الإدارة</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button onClick={loadTasks} disabled={loading}>{loading ? "جاري العمل..." : "تحميل المهام"}</button><p className={`ops-notice ops-notice-${notice.type}`}>{notice.text}</p></section>
      <section className="staff-filters glass-panel"><select value={bucket} onChange={(event) => setBucket(event.target.value as TaskBucket | "all")}>{Object.entries(bucketLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></section>
      <section className="queue-panel glass-panel">
        <div className="queue-head compact-head"><h2>قائمة المهام</h2><p className="ops-notice">{visible.length} مهمة مطابقة.</p></div>
        <div className="lead-list">
          {visible.map((task) => (
            <article className="lead-card glass-panel" key={task.id}>
              <div className="lead-main"><span className="status-pill">{taskStatusLabels[task.status]}</span><h3>{task.title}</h3><p>{task.client?.full_name || "بدون عميل"} · {task.request?.public_id || "بدون حالة"}</p></div>
              <div className="lead-next"><strong>{formatDueLabel(task.due_at)}</strong><span>{task.description || "لا يوجد وصف."}</span><span>المسؤول: {task.assigned_to_name || "غير محدد"}</span></div>
              <div className="lead-actions"><button disabled={loading} onClick={() => setTaskStatus(task.public_id, "completed")}>إكمال</button><button disabled={loading} onClick={() => setTaskStatus(task.public_id, "waiting")}>انتظار</button><button disabled={loading} onClick={() => setTaskStatus(task.public_id, "cancelled")}>إلغاء</button></div>
            </article>
          ))}
          {!visible.length && <div className="empty-state glass-panel"><h3>لا توجد مهام</h3><p>غيّر الفلتر أو حمّل المهام.</p></div>}
        </div>
      </section>
    </main>
  );
}
