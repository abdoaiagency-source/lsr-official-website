const SUBMISSION_WINDOW_MS = 10 * 60 * 1000;
const PHONE_SUBMISSION_MAX_ATTEMPTS = 3;
const IP_SUBMISSION_MAX_ATTEMPTS = 10;

type SubmissionAttempt = { count: number; resetAt: number };
const submissions = new Map<string, SubmissionAttempt>();

function prune(now = Date.now()) {
  submissions.forEach((attempt, key) => {
    if (attempt.resetAt <= now) submissions.delete(key);
  });
  if (submissions.size > 10_000) {
    const oldestKey = submissions.keys().next().value as string | undefined;
    if (oldestKey) submissions.delete(oldestKey);
  }
}

function clientIp(request: Request) {
  // Prefer platform/proxy-owned headers. Avoid trusting arbitrary X-Forwarded-For
  // on direct self-hosted traffic; direct traffic falls into one shared bucket.
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("fly-client-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").slice(-12) || "unknown-phone";
}

function phoneSubmissionKey(request: Request, phone: string) {
  return `ip-phone:${clientIp(request)}:${normalizePhone(phone)}`;
}

function ipSubmissionKey(request: Request) {
  return `ip:${clientIp(request)}`;
}

function isLimited(key: string, maxAttempts: number, now: number) {
  const attempt = submissions.get(key);
  if (!attempt || attempt.resetAt <= now) return { limited: false, retryAfter: 0 };
  if (attempt.count < maxAttempts) return { limited: false, retryAfter: 0 };
  return { limited: true, retryAfter: Math.ceil((attempt.resetAt - now) / 1000) };
}

function record(key: string, now: number) {
  const current = submissions.get(key);
  if (!current || current.resetAt <= now) {
    submissions.set(key, { count: 1, resetAt: now + SUBMISSION_WINDOW_MS });
    return;
  }
  submissions.set(key, { ...current, count: current.count + 1 });
}

export function resetPublicLeadSubmissionLimits() {
  submissions.clear();
}

export function checkPublicLeadSubmissionLimit(request: Request, phone: string, now = Date.now()) {
  prune(now);
  const phoneLimit = isLimited(phoneSubmissionKey(request, phone), PHONE_SUBMISSION_MAX_ATTEMPTS, now);
  if (phoneLimit.limited) return phoneLimit;
  return isLimited(ipSubmissionKey(request), IP_SUBMISSION_MAX_ATTEMPTS, now);
}

export function recordPublicLeadSubmission(request: Request, phone: string, now = Date.now()) {
  record(phoneSubmissionKey(request, phone), now);
  record(ipSubmissionKey(request), now);
}
