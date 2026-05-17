import { z } from "zod";
import { leadStatuses, type LeadStatus, type QualificationAnswers, type StoredLead } from "./conversion";
import type { LeadResolution } from "./operations";

const yesNoUnknown = z.enum(["yes", "no", "unknown"]);
const yesNo = z.enum(["yes", "no"]);
const yesNoUnknownNA = z.enum(["yes", "no", "unknown", "not_applicable"]);

export const qualificationAnswersSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  city: z.string().trim().max(80).default(""),
  nationality: z.string().trim().max(80).default(""),
  hasEntryStamp: yesNoUnknown,
  officialEntry: yesNoUnknown,
  hasPreviousSponsor: yesNoUnknown,
  hasSponsorClearance: yesNoUnknownNA,
  canObtainSponsorClearance: yesNoUnknownNA,
  passportValid: yesNoUnknown,
  healthCertificateReady: yesNoUnknown,
  photosReady: yesNoUnknown,
  agreesToVisit: yesNo,
  wantsWaafedHelp: yesNoUnknown,
}) satisfies z.ZodType<QualificationAnswers>;

export const leadStatusSchema = z.enum(leadStatuses);

export const leadUpdateSchema = z.object({
  status: leadStatusSchema,
});

export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

export type LeadRow = {
  id: string;
  public_id: string;
  created_at: string;
  source_channel: "website_chat";
  name: string;
  phone: string;
  city: string | null;
  nationality: string | null;
  has_entry_stamp: QualificationAnswers["hasEntryStamp"];
  official_entry: QualificationAnswers["officialEntry"];
  has_previous_sponsor: QualificationAnswers["hasPreviousSponsor"];
  has_sponsor_clearance: QualificationAnswers["hasSponsorClearance"];
  can_obtain_sponsor_clearance: QualificationAnswers["canObtainSponsorClearance"];
  passport_valid: QualificationAnswers["passportValid"];
  health_certificate_ready: QualificationAnswers["healthCertificateReady"];
  photos_ready: QualificationAnswers["photosReady"];
  agrees_to_visit: QualificationAnswers["agreesToVisit"];
  wants_waafed_help: QualificationAnswers["wantsWaafedHelp"];
  status: LeadStatus;
  priority: 1 | 2 | 3;
  reasons: StoredLead["reasons"];
  missing_documents: StoredLead["missingDocuments"];
  client_message: string;
  next_action: string;
  converted?: boolean | null;
  converted_request_id?: string | null;
  converted_at?: string | null;
  resolution?: LeadResolution | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
};

export function leadRowToStoredLead(row: LeadRow): StoredLead {
  return {
    id: row.public_id,
    createdAt: row.created_at,
    sourceChannel: row.source_channel,
    name: row.name,
    phone: row.phone,
    city: row.city ?? "",
    nationality: row.nationality ?? "",
    hasEntryStamp: row.has_entry_stamp,
    officialEntry: row.official_entry,
    hasPreviousSponsor: row.has_previous_sponsor,
    hasSponsorClearance: row.has_sponsor_clearance,
    canObtainSponsorClearance: row.can_obtain_sponsor_clearance,
    passportValid: row.passport_valid,
    healthCertificateReady: row.health_certificate_ready,
    photosReady: row.photos_ready,
    agreesToVisit: row.agrees_to_visit,
    wantsWaafedHelp: row.wants_waafed_help,
    status: row.status,
    priority: row.priority,
    reasons: row.reasons,
    missingDocuments: row.missing_documents,
    clientMessage: row.client_message,
    nextAction: row.next_action,
    converted: Boolean(row.converted),
    convertedRequestId: row.converted_request_id ?? null,
    convertedAt: row.converted_at ?? null,
    resolution: row.resolution ?? "active",
    resolutionNotes: row.resolution_notes ?? null,
    resolvedAt: row.resolved_at ?? null,
  };
}

export function storedLeadToInsert(lead: StoredLead) {
  return {
    public_id: lead.id,
    source_channel: lead.sourceChannel,
    name: lead.name,
    phone: lead.phone,
    city: lead.city || null,
    nationality: lead.nationality || null,
    has_entry_stamp: lead.hasEntryStamp,
    official_entry: lead.officialEntry,
    has_previous_sponsor: lead.hasPreviousSponsor,
    has_sponsor_clearance: lead.hasSponsorClearance,
    can_obtain_sponsor_clearance: lead.canObtainSponsorClearance,
    passport_valid: lead.passportValid,
    health_certificate_ready: lead.healthCertificateReady,
    photos_ready: lead.photosReady,
    agrees_to_visit: lead.agreesToVisit,
    wants_waafed_help: lead.wantsWaafedHelp,
    status: lead.status,
    priority: lead.priority,
    reasons: lead.reasons,
    missing_documents: lead.missingDocuments,
    client_message: lead.clientMessage,
    next_action: lead.nextAction,
    raw_answers: {
      hasEntryStamp: lead.hasEntryStamp,
      officialEntry: lead.officialEntry,
      hasPreviousSponsor: lead.hasPreviousSponsor,
      hasSponsorClearance: lead.hasSponsorClearance,
      canObtainSponsorClearance: lead.canObtainSponsorClearance,
      passportValid: lead.passportValid,
      healthCertificateReady: lead.healthCertificateReady,
      photosReady: lead.photosReady,
      agreesToVisit: lead.agreesToVisit,
      wantsWaafedHelp: lead.wantsWaafedHelp,
    },
  };
}
