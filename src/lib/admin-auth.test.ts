import { afterEach, describe, expect, it, vi } from "vitest";

import { safeInternalPath } from "./safe-path";

const originalEnv = { ...process.env };

async function loadAdminAuth() {
  vi.resetModules();
  return import("./admin-auth");
}

afterEach(() => {
  process.env = { ...originalEnv };
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("admin auth hardening", () => {
  it("fails closed when ADMIN_PASSWORD is not configured outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ALLOW_LOCAL_ADMIN_BYPASS;

    const { isAdminAuthorized } = await loadAdminAuth();

    expect(isAdminAuthorized(new Request("http://localhost/api/admin/leads"))).toBe(false);
  });

  it("only allows explicit local bypass for localhost development requests", async () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.ALLOW_LOCAL_ADMIN_BYPASS = "true";
    delete process.env.ADMIN_PASSWORD;

    const { isAdminAuthorized } = await loadAdminAuth();

    expect(isAdminAuthorized(new Request("http://localhost/api/admin/leads"))).toBe(true);
    expect(isAdminAuthorized(new Request("https://preview.example.com/api/admin/leads"))).toBe(false);
  });

  it("rejects forged staff session cookies when no auth secret is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.ADMIN_PASSWORD;
    delete process.env.STAFF_SESSION_SECRET;

    const forgedPayload = Buffer.from(JSON.stringify({
      role: "staff",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      nonce: "attacker-controlled",
    })).toString("base64url");
    const { createHmac } = await import("crypto");
    const forgedSignature = createHmac("sha256", "development-only-lsr-session-secret").update(forgedPayload).digest("base64url");

    const { isAdminAuthorized, verifyStaffSessionToken } = await loadAdminAuth();

    expect(verifyStaffSessionToken(`${forgedPayload}.${forgedSignature}`)).toBe(false);
    expect(isAdminAuthorized(new Request("https://lsr.example/api/admin/leads", {
      headers: { cookie: `lsr_staff_session=${forgedPayload}.${forgedSignature}` },
    }))).toBe(false);
  });

  it("sanitizes staff sign-in redirect targets to same-origin paths", async () => {
    expect(safeInternalPath("/management")).toBe("/management");
    expect(safeInternalPath("/cases/REQ-123?tab=docs")).toBe("/cases/REQ-123?tab=docs");
    expect(safeInternalPath("//evil.example/phish")).toBe("/operations");
    expect(safeInternalPath("/\\evil.example/phish")).toBe("/operations");
    expect(safeInternalPath("/\t//evil.example/phish")).toBe("/operations");
    expect(safeInternalPath("/\n//evil.example/phish")).toBe("/operations");
    expect(safeInternalPath("https://evil.example/phish")).toBe("/operations");
    expect(safeInternalPath("operations")).toBe("/operations");
  });

  it("rate limits repeated failed staff login attempts per client", async () => {
    process.env.ADMIN_PASSWORD = "correct-password";
    const { checkStaffLoginRateLimit, recordFailedStaffLogin, resetStaffLoginRateLimit } = await loadAdminAuth();
    const request = new Request("https://lsr.example/api/admin/auth/login", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });

    resetStaffLoginRateLimit();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(checkStaffLoginRateLimit(request).limited).toBe(false);
      recordFailedStaffLogin(request);
    }

    const limited = checkStaffLoginRateLimit(request);
    expect(limited.limited).toBe(true);
    expect(limited.retryAfter).toBeGreaterThan(0);
  });
});
