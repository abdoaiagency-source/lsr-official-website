import { describe, expect, it } from "vitest";
import { createStoredLead, type QualificationAnswers } from "./conversion";
import { leadRowToStoredLead, qualificationAnswersSchema, storedLeadToInsert, type LeadRow } from "./leads";

const answers: QualificationAnswers = {
  name: "محمد اختبار",
  phone: "+218910000000",
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

describe("lead persistence mapping", () => {
  it("validates qualification payloads", () => {
    expect(qualificationAnswersSchema.parse(answers)).toEqual(answers);
    expect(qualificationAnswersSchema.safeParse({ ...answers, phone: "1" }).success).toBe(false);
  });

  it("maps stored leads into Supabase insert rows", () => {
    const lead = createStoredLead(answers, new Date("2026-05-15T22:30:00Z"));
    const row = storedLeadToInsert(lead);

    expect(row.public_id).toBe(lead.id);
    expect(row.status).toBe("ready_deposit");
    expect(row.has_entry_stamp).toBe("yes");
    expect(row.raw_answers).toMatchObject({ hasEntryStamp: "yes" });
  });

  it("maps Supabase rows back into UI leads", () => {
    const row: LeadRow = {
      id: "4b21e8d8-0000-4000-8000-000000000000",
      public_id: "LEAD-1",
      created_at: "2026-05-15T22:30:00Z",
      source_channel: "website_chat",
      name: answers.name,
      phone: answers.phone,
      city: answers.city,
      nationality: answers.nationality,
      has_entry_stamp: "yes",
      official_entry: "yes",
      has_previous_sponsor: "no",
      has_sponsor_clearance: "not_applicable",
      can_obtain_sponsor_clearance: "not_applicable",
      passport_valid: "yes",
      health_certificate_ready: "yes",
      photos_ready: "yes",
      agrees_to_visit: "yes",
      wants_waafed_help: "yes",
      status: "ready_deposit",
      priority: 1,
      reasons: ["ready_for_deposit"],
      missing_documents: [],
      client_message: "message",
      next_action: "action",
    };

    const lead = leadRowToStoredLead(row);
    expect(lead.id).toBe("LEAD-1");
    expect(lead.hasEntryStamp).toBe("yes");
    expect(lead.nextAction).toBe("action");
  });
});
