import { z } from "zod";
import { caseStatuses, staffDocumentStatuses, taskStatuses } from "./operations";

const publicIdSchema = z.string().trim().min(3).max(80).regex(/^[A-Z]+-[A-Z0-9-]+$/i);
function isValidOptionalDateTime(value: string) {
  if (value === "") return true;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/.test(value) && !Number.isNaN(Date.parse(value));
}

function hasWritableField<T extends Record<string, unknown>>(value: T) {
  return Object.keys(value).some((key) => key !== "id" && value[key] !== undefined);
}

const optionalDateTimeSchema = z.union([
  z.string().trim().refine(isValidOptionalDateTime, "Invalid date-time"),
  z.null(),
]);
const nullableDateTime = optionalDateTimeSchema.transform((value) => value || null);
const prioritySchema = z.preprocess((value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return Number.NaN;
}, z.number().finite().transform((value) => Math.max(1, Math.min(3, value))));

export const casePatchPayloadSchema = z.object({
  id: publicIdSchema,
  status: z.enum(caseStatuses).optional(),
  priority: prioritySchema.optional(),
  clientSafeSummary: z.string().trim().max(1500).optional(),
  internalNotes: z.string().trim().max(2500).optional(),
  nextAction: z.string().trim().max(500).optional(),
  nextActionDueAt: nullableDateTime.optional(),
}).strict().refine(hasWritableField, "At least one writable field is required");

export const taskPatchPayloadSchema = z.object({
  id: publicIdSchema,
  status: z.enum(taskStatuses).optional(),
  dueAt: nullableDateTime.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional(),
}).strict().refine(hasWritableField, "At least one writable field is required");

export const documentPatchPayloadSchema = z.object({
  id: publicIdSchema,
  status: z.enum(staffDocumentStatuses).optional(),
  correctionReason: z.string().trim().max(800).optional(),
  expiresAt: nullableDateTime.optional(),
  internalNotes: z.string().trim().max(1200).optional(),
}).strict().refine(hasWritableField, "At least one writable field is required");

export type CasePatchPayload = z.infer<typeof casePatchPayloadSchema>;
export type TaskPatchPayload = z.infer<typeof taskPatchPayloadSchema>;
export type DocumentPatchPayload = z.infer<typeof documentPatchPayloadSchema>;

export function parseCasePatchPayload(body: unknown): CasePatchPayload {
  return casePatchPayloadSchema.parse(body);
}

export function parseTaskPatchPayload(body: unknown): TaskPatchPayload {
  return taskPatchPayloadSchema.parse(body);
}

export function parseDocumentPatchPayload(body: unknown): DocumentPatchPayload {
  return documentPatchPayloadSchema.parse(body);
}
