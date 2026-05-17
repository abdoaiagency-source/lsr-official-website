import type { LeadStatus, StoredLead } from "./conversion";

export const caseStatuses = ["rejected", "needs_documents", "ready_deposit", "submitted", "in_process", "completed"] as const;
export type CaseStatus = (typeof caseStatuses)[number];

export const caseStatusLabels: Record<CaseStatus, string> = {
  rejected: "لا يمكن البدء حالياً",
  needs_documents: "يحتاج مستندات",
  ready_deposit: "جاهز للدفعة",
  submitted: "تم التسليم",
  in_process: "تحت الإجراء",
  completed: "مكتمل",
};

export const leadResolutionValues = ["active", "lost", "duplicate", "not_interested"] as const;
export type LeadResolution = (typeof leadResolutionValues)[number];

export const leadResolutionLabels: Record<LeadResolution, string> = {
  active: "نشط",
  lost: "مفقود",
  duplicate: "مكرر",
  not_interested: "غير مهتم",
};

export type OperationsLead = StoredLead & {
  resolution?: LeadResolution;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
};

export type LeadFilterStatus = LeadStatus | "all" | "converted";
export type LeadFilter = {
  status: LeadFilterStatus;
  resolution: LeadResolution | "all";
  search: string;
};

export function filterLeadsForOperations(leads: OperationsLead[], filter: LeadFilter) {
  const search = filter.search.trim().toLowerCase();
  return leads.filter((lead) => {
    if (filter.status === "converted" && !lead.converted) return false;
    if (filter.status !== "all" && filter.status !== "converted" && lead.status !== filter.status) return false;
    if (filter.resolution !== "all" && (lead.resolution ?? "active") !== filter.resolution) return false;
    if (!search) return true;
    return [lead.id, lead.name, lead.phone, lead.city, lead.nationality]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
}

export const staffDocumentStatuses = [
  "missing",
  "requested",
  "received",
  "needs_correction",
  "verified",
  "expired",
  "not_applicable",
] as const;
export type StaffDocumentStatus = (typeof staffDocumentStatuses)[number];
export type DbDocumentStatus = "missing" | "requested" | "received" | "verified" | "rejected" | "not_required";

export const documentStatusLabels: Record<StaffDocumentStatus, string> = {
  missing: "ناقص",
  requested: "تم طلبه",
  received: "تم الاستلام",
  needs_correction: "يحتاج تصحيح",
  verified: "تم التحقق",
  expired: "منتهي الصلاحية",
  not_applicable: "غير مطلوب",
};

export function documentStatusToDb(status: StaffDocumentStatus): DbDocumentStatus {
  if (status === "needs_correction") return "rejected";
  if (status === "not_applicable") return "not_required";
  if (status === "expired") return "rejected";
  return status;
}

export function documentStatusFromDb(status: DbDocumentStatus, expiresAt?: string | null): StaffDocumentStatus {
  if (status === "rejected") return expiresAt && new Date(expiresAt).getTime() < Date.now() ? "expired" : "needs_correction";
  if (status === "not_required") return "not_applicable";
  return status;
}

export const taskStatuses = ["open", "waiting", "completed", "cancelled"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskStatusLabels: Record<TaskStatus, string> = {
  open: "مفتوحة",
  waiting: "بانتظار طرف آخر",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

export type TaskLike = {
  status: TaskStatus;
  dueAt?: string | null;
};

export type TaskBucket = "overdue" | "today" | "upcoming" | "completed" | "cancelled";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function taskBucket(task: TaskLike, now = new Date()): TaskBucket {
  if (task.status === "completed") return "completed";
  if (task.status === "cancelled") return "cancelled";
  if (!task.dueAt) return "upcoming";
  const due = new Date(task.dueAt);
  const dueDay = startOfDay(due);
  const today = startOfDay(now);
  if (dueDay < today) return "overdue";
  if (dueDay === today) return "today";
  return "upcoming";
}

export function formatDueLabel(dueAt?: string | null, now = new Date()) {
  if (!dueAt) return "بدون موعد";
  const bucket = taskBucket({ status: "open", dueAt }, now);
  const time = new Intl.DateTimeFormat("ar-LY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dueAt));
  if (bucket === "overdue") return `متأخر · ${time}`;
  if (bucket === "today") return `اليوم · ${time}`;
  return time;
}

export type CaseLike = {
  status: CaseStatus;
  public_id?: string;
  last_activity_at?: string | null;
  missing_documents?: string[] | null;
  assigned_owner_name?: string | null;
};
export type LeadLike = { status: LeadStatus; converted?: boolean | null; resolution?: LeadResolution; createdAt: string };
export type ManagementTaskLike = TaskLike & { assigned_to_name?: string | null };
export type ManagementDocumentLike = { status: DbDocumentStatus; required?: boolean | null; expires_at?: string | null };

export function getManagementMetrics(input: { leads: LeadLike[]; cases: CaseLike[]; tasks: TaskLike[]; now?: Date }) {
  const now = input.now ?? new Date();
  const today = startOfDay(now);
  return {
    newLeadsToday: input.leads.filter((lead) => startOfDay(new Date(lead.createdAt)) === today).length,
    readyDepositLeads: input.leads.filter((lead) => !lead.converted && (lead.resolution ?? "active") === "active" && lead.status === "ready_deposit").length,
    convertedLeads: input.leads.filter((lead) => Boolean(lead.converted)).length,
    unresolvedLeads: input.leads.filter((lead) => !lead.converted && (lead.resolution ?? "active") === "active").length,
    activeCases: input.cases.filter((request) => request.status !== "completed" && request.status !== "rejected").length,
    waitingCases: input.cases.filter((request) => request.status === "needs_documents" || request.status === "submitted").length,
    completedCases: input.cases.filter((request) => request.status === "completed").length,
    overdueTasks: input.tasks.filter((task) => taskBucket(task, now) === "overdue").length,
  };
}

export type ManagementFunnelStage = { key: string; label: string; count: number; description: string };
export type ManagementPriority = { type: string; label: string; count: number; tone: "gold" | "red" | "amber" | "blue" };
export type ManagementWorkload = { owner: string; openTasks: number; overdueTasks: number; activeCases: number };

function isActiveCase(item: CaseLike) {
  return item.status !== "completed" && item.status !== "rejected";
}

function daysBetween(from: string | null | undefined, to: Date) {
  if (!from) return 0;
  return Math.floor((startOfDay(to) - startOfDay(new Date(from))) / 86_400_000);
}

export function getManagementStrategicSummary(input: {
  leads: LeadLike[];
  cases: CaseLike[];
  tasks: ManagementTaskLike[];
  documents?: ManagementDocumentLike[];
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const metrics = getManagementMetrics({ leads: input.leads, cases: input.cases, tasks: input.tasks, now });
  const activeLeads = input.leads.filter((lead) => !lead.converted && (lead.resolution ?? "active") === "active");
  const documents = input.documents ?? [];
  const staleCases = input.cases.filter((item) => isActiveCase(item) && daysBetween(item.last_activity_at, now) >= 7).length;
  const unassignedCases = input.cases.filter((item) => isActiveCase(item) && !item.assigned_owner_name).length;
  const caseMissingDocs = input.cases.reduce((sum, item) => sum + (item.missing_documents?.length ?? 0), 0);
  const documentIssues = documents.filter((doc) => doc.required !== false && (doc.status === "missing" || doc.status === "rejected")).length;
  const expiringServiceDocuments = documents.filter((doc) => {
    if (!doc.expires_at || doc.status !== "verified") return false;
    const days = daysBetween(now.toISOString(), new Date(doc.expires_at));
    return days >= 0 && days <= 30;
  }).length;

  const ownerMap = new Map<string, ManagementWorkload>();
  const ensureOwner = (owner?: string | null) => {
    const key = owner?.trim() || "غير محدد";
    if (!ownerMap.has(key)) ownerMap.set(key, { owner: key, openTasks: 0, overdueTasks: 0, activeCases: 0 });
    return ownerMap.get(key)!;
  };

  input.cases.filter(isActiveCase).forEach((item) => {
    ensureOwner(item.assigned_owner_name).activeCases += 1;
  });
  input.tasks.filter((task) => task.status !== "completed" && task.status !== "cancelled").forEach((task) => {
    const owner = ensureOwner(task.assigned_to_name);
    owner.openTasks += 1;
    if (taskBucket(task, now) === "overdue") owner.overdueTasks += 1;
  });

  const risks = {
    staleCases,
    missingServiceDocuments: documentIssues || caseMissingDocs,
    unassignedCases,
    expiringServiceDocuments,
  };

  const priorityCandidates: ManagementPriority[] = [
    { type: "ready_deposit", label: "فرص جاهزة للدفعة تحتاج متابعة", count: metrics.readyDepositLeads, tone: "gold" },
    { type: "overdue_tasks", label: "مهام متأخرة عن موعدها", count: metrics.overdueTasks, tone: "red" },
    { type: "stale_cases", label: "حالات بلا تحديث منذ 7 أيام أو أكثر", count: risks.staleCases, tone: "amber" },
    { type: "missing_documents", label: "مستندات خدمة أو قوائم تحقق ناقصة", count: risks.missingServiceDocuments, tone: "amber" },
    { type: "unassigned_cases", label: "حالات نشطة بدون مالك واضح", count: risks.unassignedCases, tone: "blue" },
  ];

  return {
    metrics,
    funnel: [
      { key: "new", label: "طلبات جديدة", count: activeLeads.filter((lead) => lead.status === "submitted").length, description: "تحتاج مراجعة أولية من الفريق" },
      { key: "needs_documents", label: "يحتاج مستندات", count: activeLeads.filter((lead) => lead.status === "needs_documents").length, description: "ينتظر معلومات أو مستندات خدمة" },
      { key: "ready_deposit", label: "جاهز للدفعة", count: metrics.readyDepositLeads, description: "فرص قريبة من التحويل التجاري" },
      { key: "converted", label: "محوّل لحالة", count: activeLeads.filter((lead) => Boolean(lead.converted)).length, description: "تم فتح ملف تشغيلي" },
      { key: "in_process", label: "تحت الإجراء", count: input.cases.filter((item) => item.status === "in_process").length, description: "حالات يعمل عليها الفريق" },
      { key: "completed", label: "مكتمل", count: metrics.completedCases, description: "ملفات انتهت بنجاح" },
    ] satisfies ManagementFunnelStage[],
    risks,
    workload: Array.from(ownerMap.values()).sort((a, b) => a.owner.localeCompare(b.owner, "ar")),
    priorities: priorityCandidates.filter((item) => item.count > 0),
  };
}
