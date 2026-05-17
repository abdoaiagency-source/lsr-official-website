import { describe, expect, it } from "vitest";
import {
  caseStatusLabels,
  documentStatusToDb,
  filterLeadsForOperations,
  formatDueLabel,
  getManagementMetrics,
  taskBucket,
} from "./operations";

describe("operations helpers", () => {
  it("filters leads by search, status, converted, and resolution", () => {
    const leads = [
      { id: "LEAD-1", name: "أحمد", phone: "091", status: "ready_deposit", converted: false, resolution: "active", createdAt: "2026-05-01" },
      { id: "LEAD-2", name: "سالم", phone: "092", status: "needs_documents", converted: true, resolution: "active", createdAt: "2026-05-02" },
      { id: "LEAD-3", name: "ليلى", phone: "093", status: "rejected", converted: false, resolution: "lost", createdAt: "2026-05-03" },
    ] as never;

    expect(filterLeadsForOperations(leads, { status: "ready_deposit", search: "091", resolution: "active" }).map((lead) => lead.id)).toEqual(["LEAD-1"]);
    expect(filterLeadsForOperations(leads, { status: "converted", search: "", resolution: "all" }).map((lead) => lead.id)).toEqual(["LEAD-2"]);
    expect(filterLeadsForOperations(leads, { status: "all", search: "لي", resolution: "lost" }).map((lead) => lead.id)).toEqual(["LEAD-3"]);
  });

  it("maps staff document statuses to existing Supabase enum values", () => {
    expect(documentStatusToDb("needs_correction")).toBe("rejected");
    expect(documentStatusToDb("not_applicable")).toBe("not_required");
    expect(documentStatusToDb("verified")).toBe("verified");
  });

  it("buckets tasks using due dates", () => {
    const now = new Date("2026-05-17T10:00:00Z");
    expect(taskBucket({ status: "completed", dueAt: "2026-05-17T09:00:00Z" }, now)).toBe("completed");
    expect(taskBucket({ status: "open", dueAt: "2026-05-16T09:00:00Z" }, now)).toBe("overdue");
    expect(taskBucket({ status: "open", dueAt: "2026-05-17T12:00:00Z" }, now)).toBe("today");
    expect(taskBucket({ status: "open", dueAt: "2026-05-20T12:00:00Z" }, now)).toBe("upcoming");
  });

  it("calculates management metrics from deterministic records", () => {
    const metrics = getManagementMetrics({
      leads: [
        { status: "ready_deposit", converted: false, resolution: "active", createdAt: "2026-05-17T08:00:00Z" },
        { status: "needs_documents", converted: true, resolution: "active", createdAt: "2026-05-10T08:00:00Z" },
      ] as never,
      cases: [
        { status: "in_process" },
        { status: "completed" },
        { status: "needs_documents" },
      ] as never,
      tasks: [
        { status: "open", dueAt: "2026-05-16T08:00:00Z" },
        { status: "completed", dueAt: "2026-05-16T08:00:00Z" },
      ] as never,
      now: new Date("2026-05-17T10:00:00Z"),
    });

    expect(metrics.newLeadsToday).toBe(1);
    expect(metrics.readyDepositLeads).toBe(1);
    expect(metrics.convertedLeads).toBe(1);
    expect(metrics.activeCases).toBe(2);
    expect(metrics.completedCases).toBe(1);
    expect(metrics.overdueTasks).toBe(1);
  });

  it("keeps Arabic labels for production statuses", () => {
    expect(caseStatusLabels.in_process).toBe("تحت الإجراء");
    expect(formatDueLabel("2026-05-17T12:00:00Z", new Date("2026-05-17T10:00:00Z"))).toContain("اليوم");
  });
});
