import { describe, expect, it } from "vitest";
import { buildConvertLeadPayload, conversionErrorMessage, generateRequestPublicId } from "./case-conversion";

describe("lead-to-case conversion helpers", () => {
  it("generates request public IDs in the required REQ format", () => {
    const id = generateRequestPublicId(new Date("2026-05-16T14:30:22.789Z"), () => "ab7x2k");

    expect(id).toBe("REQ-20260516143022789-AB7X2K");
    expect(id).toMatch(/^REQ-\d{17}-[A-Z0-9]{6}$/);
  });

  it("builds the Supabase RPC payload for a selected lead", () => {
    const payload = buildConvertLeadPayload("LEAD-123", "REQ-20260516143022789-AB7X2K", "worker-1", "worker-2");

    expect(payload).toEqual({
      p_lead_public_id: "LEAD-123",
      p_request_public_id: "REQ-20260516143022789-AB7X2K",
      p_actor_worker_id: "worker-1",
      p_default_worker_id: "worker-2",
    });
  });

  it("maps conversion errors to Arabic staff messages", () => {
    expect(conversionErrorMessage("lead_already_converted", "REQ-1")).toBe("هذا الطلب تم تحويله مسبقاً إلى حالة. رقم الحالة: REQ-1");
    expect(conversionErrorMessage("missing_required_fields")).toBe("بيانات الطلب غير مكتملة. يرجى المراجعة.");
    expect(conversionErrorMessage("unknown_error")).toBe("حدث خطأ أثناء التحويل. يرجى المحاولة مجدداً.");
  });
});
