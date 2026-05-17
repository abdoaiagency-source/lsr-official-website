import { describe, expect, it } from "vitest";
import type { StoredLead } from "./conversion";
import { buildAuditLogRow } from "./audit-log";
import { parseCasePatchPayload, parseDocumentPatchPayload, parseTaskPatchPayload } from "./admin-route-schemas";
import { checkPublicLeadSubmissionLimit, recordPublicLeadSubmission, resetPublicLeadSubmissionLimits } from "./public-lead-guard";
import { sanitizeLocalLeadCache, toSafeLocalLead } from "./local-lead-cache";

const storedLead: StoredLead = {
  id: "LEAD-1",
  createdAt: "2026-05-17T10:00:00Z",
  sourceChannel: "website_chat",
  name: "محمد اختبار",
  phone: "+218910000000",
  city: "طرابلس",
  nationality: "ليبية",
  hasEntryStamp: "yes",
  officialEntry: "yes",
  hasPreviousSponsor: "no",
  hasSponsorClearance: "not_applicable",
  canObtainSponsorClearance: "not_applicable",
  passportValid: "yes",
  healthCertificateReady: "yes",
  photosReady: "yes",
  agreesToVisit: "yes",
  wantsWaafedHelp: "yes",
  status: "ready_deposit",
  priority: 1,
  reasons: ["ready_for_deposit"],
  missingDocuments: [],
  clientMessage: "Client-safe message",
  nextAction: "Call client",
};

describe("phase 3 hardening", () => {
  it("stores only client-safe non-PII lead summaries in browser fallback cache", () => {
    const safeLead = toSafeLocalLead(storedLead);
    const sanitizedLegacyCache = sanitizeLocalLeadCache([storedLead]);

    expect(safeLead).toEqual({
      id: "LEAD-1",
      createdAt: "2026-05-17T10:00:00Z",
      status: "ready_deposit",
      priority: 1,
      missingDocuments: [],
      clientMessage: "Client-safe message",
      nextAction: "Call client",
    });
    expect(JSON.stringify(safeLead)).not.toContain("محمد");
    expect(JSON.stringify(safeLead)).not.toContain("218910000000");
    expect(JSON.stringify(safeLead)).not.toContain("طرابلس");
    expect(sanitizedLegacyCache).toEqual([safeLead]);
    expect(sanitizeLocalLeadCache({ corrupted: true })).toEqual([]);
    expect(JSON.stringify(sanitizedLegacyCache)).not.toContain("محمد");
    expect(JSON.stringify(sanitizedLegacyCache)).not.toContain("طرابلس");
  });

  it("rate limits repeated public lead submissions per IP and phone", () => {
    resetPublicLeadSubmissionLimits();
    const request = new Request("https://lsr.example/api/leads", {
      headers: { "x-forwarded-for": "198.51.100.10" },
    });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(checkPublicLeadSubmissionLimit(request, storedLead.phone).limited).toBe(false);
      recordPublicLeadSubmission(request, storedLead.phone);
    }

    const limited = checkPublicLeadSubmissionLimit(request, storedLead.phone);
    expect(limited.limited).toBe(true);
    expect(limited.retryAfter).toBeGreaterThan(0);

    expect(checkPublicLeadSubmissionLimit(request, "+218920000000").limited).toBe(false);
  });


  it("rate limits excessive public lead submissions per IP across phone values", () => {
    resetPublicLeadSubmissionLimits();
    const request = new Request("https://lsr.example/api/leads", {
      headers: { "x-forwarded-for": "198.51.100.11" },
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const phone = `+2189100000${attempt}`;
      expect(checkPublicLeadSubmissionLimit(request, phone).limited).toBe(false);
      recordPublicLeadSubmission(request, phone);
    }

    expect(checkPublicLeadSubmissionLimit(request, "+218910000099").limited).toBe(true);
  });

  it("strictly validates case patch payloads and normalizes writable fields", () => {
    expect(parseCasePatchPayload({ id: "REQ-1", status: "completed", priority: 9, internalNotes: "  note  " })).toEqual({
      id: "REQ-1",
      status: "completed",
      priority: 3,
      internalNotes: "note",
    });

    expect(parseCasePatchPayload({ id: "REQ-1", priority: "2" })).toMatchObject({ priority: 2 });
    expect(() => parseCasePatchPayload({ id: "REQ-1", status: "ready_deposit", unexpected: true })).toThrow();
    expect(() => parseCasePatchPayload({ id: "REQ-1" })).toThrow();
    expect(() => parseCasePatchPayload({ id: "REQ-1", priority: null })).toThrow();
    expect(() => parseCasePatchPayload({ id: "REQ-1", priority: false })).toThrow();
    expect(() => parseCasePatchPayload({ id: "REQ-1", priority: "" })).toThrow();
    expect(() => parseCasePatchPayload({ id: "REQ-1", priority: [] })).toThrow();
    expect(parseCasePatchPayload({ id: "REQ-1", nextActionDueAt: "2026-05-17T12:30:00+02:00" })).toMatchObject({
      nextActionDueAt: "2026-05-17T12:30:00+02:00",
    });
    expect(() => parseCasePatchPayload({ id: "REQ-1", nextActionDueAt: "not-a-date" })).toThrow();
  });

  it("strictly validates task and document patch payloads", () => {
    expect(parseTaskPatchPayload({ id: "TASK-1", status: "completed", dueAt: "2026-05-17T12:30" })).toMatchObject({
      id: "TASK-1",
      status: "completed",
      dueAt: "2026-05-17T12:30",
    });
    expect(parseDocumentPatchPayload({ id: "DOC-1", status: "verified", correctionReason: "" })).toMatchObject({
      id: "DOC-1",
      status: "verified",
      correctionReason: "",
    });
    expect(() => parseTaskPatchPayload({ id: "TASK-1", status: "finished" })).toThrow();
    expect(() => parseDocumentPatchPayload({ id: "DOC-1", expiresAt: "yesterday" })).toThrow();
  });

  it("builds audit log rows without raw notes or client PII", () => {
    const audit = buildAuditLogRow({
      eventType: "case_updated",
      requestId: "request-uuid",
      clientId: "client-uuid",
      requestPublicId: "REQ-1",
      actorRole: "admin",
      changedFields: ["status", "internal_notes"],
    });

    expect(audit).toMatchObject({
      request_id: "request-uuid",
      client_id: "client-uuid",
      actor_type: "staff",
      actor_name: "admin",
      event_type: "case_updated",
      visibility: "system_audit",
      summary: "تم تحديث الحالة REQ-1.",
      metadata: { request_public_id: "REQ-1", changed_fields: ["status", "internal_notes"] },
    });
    expect(JSON.stringify(audit)).not.toContain("sensitive raw note");
    expect(JSON.stringify(audit)).not.toContain("محمد");
    expect(JSON.stringify(audit)).not.toContain("218");
  });
});
