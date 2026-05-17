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

export type CaseLike = { status: CaseStatus };
export type LeadLike = { status: LeadStatus; converted?: boolean | null; resolution?: LeadResolution; createdAt: string };

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
