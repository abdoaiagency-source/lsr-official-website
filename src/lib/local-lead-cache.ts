import type { StoredLead } from "./conversion";

export type SafeLocalLead = Pick<
  StoredLead,
  "id" | "createdAt" | "status" | "priority" | "missingDocuments" | "clientMessage" | "nextAction"
>;

type SafeLocalLeadInput = Pick<StoredLead, "id" | "createdAt" | "status" | "priority" | "missingDocuments" | "clientMessage" | "nextAction">;

function isSafeLocalLeadInput(value: unknown): value is SafeLocalLeadInput {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SafeLocalLeadInput>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.status === "string" &&
    typeof candidate.priority === "number" &&
    Array.isArray(candidate.missingDocuments) &&
    typeof candidate.clientMessage === "string" &&
    typeof candidate.nextAction === "string"
  );
}

export function toSafeLocalLead(lead: SafeLocalLeadInput): SafeLocalLead {
  return {
    id: lead.id,
    createdAt: lead.createdAt,
    status: lead.status,
    priority: lead.priority,
    missingDocuments: lead.missingDocuments,
    clientMessage: lead.clientMessage,
    nextAction: lead.nextAction,
  };
}

export function sanitizeLocalLeadCache(current: unknown): SafeLocalLead[] {
  if (!Array.isArray(current)) return [];
  return current.filter(isSafeLocalLeadInput).map(toSafeLocalLead);
}
