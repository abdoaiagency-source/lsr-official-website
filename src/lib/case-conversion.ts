export const DEFAULT_LSR_WORKER_ID = "8e5692d9-47eb-4e70-9517-3283830649d4";

export type ConvertLeadPayload = {
  p_lead_public_id: string;
  p_request_public_id: string;
  p_actor_worker_id: string;
  p_default_worker_id: string;
};

export type ConversionResult = {
  ok: boolean;
  error?: string;
  request_public_id?: string;
  request_id?: string;
  client_id?: string;
  reused_client?: boolean;
  converted_request_id?: string;
  document_count?: number;
};

function pad(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

function defaultRandomToken() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomValues = new Uint8Array(6);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (value) => alphabet[value % alphabet.length]).join("");
}

export function generateRequestPublicId(now = new Date(), randomToken = defaultRandomToken) {
  const timestamp = [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds()),
    pad(now.getUTCMilliseconds(), 3),
  ].join("");

  return `REQ-${timestamp}-${randomToken().replace(/[^a-z0-9]/gi, "").toUpperCase().padEnd(6, "X").slice(0, 6)}`;
}

export function buildConvertLeadPayload(
  leadPublicId: string,
  requestPublicId: string,
  actorWorkerId = DEFAULT_LSR_WORKER_ID,
  defaultWorkerId = DEFAULT_LSR_WORKER_ID,
): ConvertLeadPayload {
  return {
    p_lead_public_id: leadPublicId,
    p_request_public_id: requestPublicId,
    p_actor_worker_id: actorWorkerId,
    p_default_worker_id: defaultWorkerId,
  };
}

export function conversionErrorMessage(error?: string, convertedRequestId?: string) {
  if (error === "lead_already_converted") {
    return `هذا الطلب تم تحويله مسبقاً إلى حالة. رقم الحالة: ${convertedRequestId || "غير محدد"}`;
  }

  if (error === "missing_required_fields") {
    return "بيانات الطلب غير مكتملة. يرجى المراجعة.";
  }

  return "حدث خطأ أثناء التحويل. يرجى المحاولة مجدداً.";
}
