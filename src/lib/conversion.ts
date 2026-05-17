export const leadStatuses = [
  "rejected",
  "needs_documents",
  "ready_deposit",
  "submitted",
  "in_process",
  "completed",
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export type YesNoUnknown = "yes" | "no" | "unknown";
export type YesNo = "yes" | "no";

export type QualificationAnswers = {
  name: string;
  phone: string;
  city: string;
  nationality: string;
  hasEntryStamp: YesNoUnknown;
  officialEntry: YesNoUnknown;
  hasPreviousSponsor: YesNoUnknown;
  hasSponsorClearance: YesNoUnknown | "not_applicable";
  canObtainSponsorClearance: YesNoUnknown | "not_applicable";
  passportValid: YesNoUnknown;
  healthCertificateReady: YesNoUnknown;
  photosReady: YesNoUnknown;
  agreesToVisit: YesNo;
  wantsWaafedHelp: YesNoUnknown;
};

export type ClassificationReason =
  | "missing_entry_stamp"
  | "unofficial_entry"
  | "missing_sponsor_clearance"
  | "cannot_obtain_sponsor_clearance"
  | "invalid_passport_blocking"
  | "missing_health_certificate"
  | "missing_photos"
  | "missing_sponsor_clearance_but_obtainable"
  | "unclear_entry_stamp"
  | "unclear_official_entry"
  | "unclear_previous_sponsor"
  | "passport_validity_needs_confirmation"
  | "not_ready_to_visit"
  | "ready_for_deposit";

export type MissingDocument =
  | "entry_stamp_or_visa_proof"
  | "passport_validity_confirmation"
  | "health_certificate"
  | "photos"
  | "sponsor_clearance";

export type LeadClassification = {
  status: LeadStatus;
  reasons: ClassificationReason[];
  missingDocuments: MissingDocument[];
  clientMessage: string;
  nextAction: string;
  priority: 1 | 2 | 3;
};

const documentLabels: Record<MissingDocument, string> = {
  entry_stamp_or_visa_proof: "ختم دخول رسمي أو إثبات التأشيرة",
  passport_validity_confirmation: "تأكيد صلاحية الجواز",
  health_certificate: "الشهادة الصحية",
  photos: "الصور الشخصية المطلوبة",
  sponsor_clearance: "إخلاء الطرف من الكفيل السابق عند الحاجة",
};

export function getDocumentLabel(document: MissingDocument) {
  return documentLabels[document];
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function rejected(reasons: ClassificationReason[]): LeadClassification {
  return {
    status: "rejected",
    reasons,
    missingDocuments: [],
    priority: 3,
    nextAction: "لا يحتاج متابعة من أيوب إلا إذا قرر استثناءً يدوياً.",
    clientMessage:
      "حسب المعلومات المقدمة، حالتك لا يمكن البدء فيها حالياً لأن الإجراء يحتاج ختم دخول رسمي أو إخلاء طرف من الكفيل السابق عند وجود إقامة/كفيل سابق. في حال تغير وضعك أو تحصلت على المستند المطلوب، يمكنك التواصل معنا من جديد.",
  };
}

function needsDocuments(reasons: ClassificationReason[], missingDocuments: MissingDocument[]): LeadClassification {
  const uniqueDocuments = unique(missingDocuments);
  const list = uniqueDocuments.map((document) => `- ${documentLabels[document]}`).join("\n");

  return {
    status: "needs_documents",
    reasons: unique(reasons),
    missingDocuments: uniqueDocuments,
    priority: 2,
    nextAction: "إرسال قائمة الأوراق الناقصة والمتابعة لاحقاً لتحويل الحالة إلى جاهز للدفعة.",
    clientMessage: `حالتك يمكن مراجعتها، لكن الملف ناقص حالياً.\nالمطلوب منك تجهيز الأوراق التالية:\n${list || "- تأكيد بعض المعلومات الأساسية"}\nبعد تجهيزها يمكنك التواصل معنا أو الحضور لتسليم الأوراق ومتابعة الإجراء.`,
  };
}

function readyDeposit(): LeadClassification {
  return {
    status: "ready_deposit",
    reasons: ["ready_for_deposit"],
    missingDocuments: [],
    priority: 1,
    nextAction: "تواصل فوري من أيوب لتأكيد وقت الحضور وتسليم الأوراق ودفع الدفعة الأولى.",
    clientMessage:
      "تمام، حسب المعلومات التي قدمتها حالتك مناسبة مبدئياً للبدء. الخطوة التالية هي الحضور لتسليم الجواز والأوراق المطلوبة ودفع الدفعة الأولى حتى يتم فتح الملف ومتابعة الإجراء.",
  };
}

export function classifyLead(answers: QualificationAnswers): LeadClassification {
  if (answers.hasEntryStamp === "no") return rejected(["missing_entry_stamp"]);
  if (answers.officialEntry === "no") return rejected(["unofficial_entry"]);

  if (answers.hasPreviousSponsor === "yes") {
    if (answers.hasSponsorClearance === "no" && answers.canObtainSponsorClearance === "no") {
      return rejected(["cannot_obtain_sponsor_clearance"]);
    }
    if (answers.hasSponsorClearance === "no" && answers.canObtainSponsorClearance !== "yes") {
      return rejected(["missing_sponsor_clearance"]);
    }
  }

  if (answers.passportValid === "no") return rejected(["invalid_passport_blocking"]);

  const reasons: ClassificationReason[] = [];
  const missingDocuments: MissingDocument[] = [];

  if (answers.hasEntryStamp === "unknown") {
    reasons.push("unclear_entry_stamp");
    missingDocuments.push("entry_stamp_or_visa_proof");
  }

  if (answers.officialEntry === "unknown") {
    reasons.push("unclear_official_entry");
    missingDocuments.push("entry_stamp_or_visa_proof");
  }

  if (answers.hasPreviousSponsor === "unknown") {
    reasons.push("unclear_previous_sponsor");
    missingDocuments.push("sponsor_clearance");
  }

  if (answers.hasPreviousSponsor === "yes" && answers.hasSponsorClearance !== "yes") {
    reasons.push("missing_sponsor_clearance_but_obtainable");
    missingDocuments.push("sponsor_clearance");
  }

  if (answers.passportValid === "unknown") {
    reasons.push("passport_validity_needs_confirmation");
    missingDocuments.push("passport_validity_confirmation");
  }

  if (answers.healthCertificateReady !== "yes") {
    reasons.push("missing_health_certificate");
    missingDocuments.push("health_certificate");
  }

  if (answers.photosReady !== "yes") {
    reasons.push("missing_photos");
    missingDocuments.push("photos");
  }

  if (answers.agreesToVisit === "no") {
    reasons.push("not_ready_to_visit");
  }

  if (reasons.length > 0) return needsDocuments(reasons, missingDocuments);
  return readyDeposit();
}

export type StoredLead = QualificationAnswers & LeadClassification & {
  id: string;
  createdAt: string;
  sourceChannel: "website_chat";
  converted?: boolean;
  convertedRequestId?: string | null;
  convertedAt?: string | null;
};

export function createStoredLead(answers: QualificationAnswers, now = new Date()): StoredLead {
  const classification = classifyLead(answers);

  return {
    ...answers,
    ...classification,
    id: `LEAD-${now.getTime()}`,
    createdAt: now.toISOString(),
    sourceChannel: "website_chat",
  };
}
