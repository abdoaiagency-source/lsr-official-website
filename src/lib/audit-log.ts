export type AuditEventType = "case_updated" | "document_updated" | "task_updated";
export type AuditActorRole = "staff" | "admin";

export type AuditLogInput = {
  eventType: AuditEventType;
  requestId?: string | null;
  clientId?: string | null;
  documentId?: string | null;
  taskId?: string | null;
  requestPublicId?: string | null;
  documentPublicId?: string | null;
  taskPublicId?: string | null;
  actorRole: AuditActorRole;
  changedFields: string[];
};

export type AuditLogRow = {
  client_id?: string | null;
  request_id?: string | null;
  document_id?: string | null;
  task_id?: string | null;
  actor_type: "staff";
  actor_name: AuditActorRole;
  event_type: AuditEventType;
  summary: string;
  visibility: "system_audit";
  metadata: Record<string, unknown>;
};

function eventSummary(input: AuditLogInput) {
  if (input.eventType === "case_updated") return `تم تحديث الحالة ${input.requestPublicId ?? ""}.`.trim();
  if (input.eventType === "document_updated") return `تم تحديث المستند ${input.documentPublicId ?? ""}.`.trim();
  return `تم تحديث المهمة ${input.taskPublicId ?? ""}.`.trim();
}

export function buildAuditLogRow(input: AuditLogInput): AuditLogRow {
  return {
    client_id: input.clientId ?? null,
    request_id: input.requestId ?? null,
    document_id: input.documentId ?? null,
    task_id: input.taskId ?? null,
    actor_type: "staff",
    actor_name: input.actorRole,
    event_type: input.eventType,
    summary: eventSummary(input),
    visibility: "system_audit",
    metadata: {
      ...(input.requestPublicId ? { request_public_id: input.requestPublicId } : {}),
      ...(input.documentPublicId ? { document_public_id: input.documentPublicId } : {}),
      ...(input.taskPublicId ? { task_public_id: input.taskPublicId } : {}),
      changed_fields: input.changedFields,
    },
  };
}
