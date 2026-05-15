import { describe, expect, it } from "vitest";
import { classifyLead, type QualificationAnswers } from "./conversion";

const baseAnswers: QualificationAnswers = {
  name: "محمد",
  phone: "+218000000",
  city: "طرابلس",
  nationality: "تونسية",
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
};

describe("lead conversion classification", () => {
  it("rejects leads without an official entry stamp", () => {
    const result = classifyLead({ ...baseAnswers, hasEntryStamp: "no" });

    expect(result.status).toBe("rejected");
    expect(result.reasons).toContain("missing_entry_stamp");
    expect(result.clientMessage).toContain("لا يمكن البدء فيها حالياً");
  });

  it("rejects previous-sponsor leads when clearance cannot be obtained", () => {
    const result = classifyLead({
      ...baseAnswers,
      hasPreviousSponsor: "yes",
      hasSponsorClearance: "no",
      canObtainSponsorClearance: "no",
    });

    expect(result.status).toBe("rejected");
    expect(result.reasons).toContain("cannot_obtain_sponsor_clearance");
  });

  it("keeps obtainable missing sponsor clearance in needs_documents", () => {
    const result = classifyLead({
      ...baseAnswers,
      hasPreviousSponsor: "yes",
      hasSponsorClearance: "no",
      canObtainSponsorClearance: "yes",
    });

    expect(result.status).toBe("needs_documents");
    expect(result.missingDocuments).toContain("sponsor_clearance");
  });

  it("classifies complete and visit-ready leads as ready_deposit", () => {
    const result = classifyLead(baseAnswers);

    expect(result.status).toBe("ready_deposit");
    expect(result.priority).toBe(1);
    expect(result.clientMessage).toContain("دفع الدفعة الأولى");
  });

  it("keeps missing health certificate and photos out of ready_deposit", () => {
    const result = classifyLead({
      ...baseAnswers,
      healthCertificateReady: "no",
      photosReady: "no",
    });

    expect(result.status).toBe("needs_documents");
    expect(result.missingDocuments).toEqual(["health_certificate", "photos"]);
  });
});
