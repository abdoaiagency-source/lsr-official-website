import { NextResponse } from "next/server";
import { createStoredLead } from "@/lib/conversion";
import { qualificationAnswersSchema, leadRowToStoredLead, storedLeadToInsert } from "@/lib/leads";
import { checkPublicLeadSubmissionLimit, recordPublicLeadSubmission } from "@/lib/public-lead-guard";
import { getSupabaseConfig, insertLead } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = qualificationAnswersSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_lead_payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const deterministicLead = createStoredLead(parsed.data);
  const submissionLimit = checkPublicLeadSubmissionLimit(request, deterministicLead.phone);

  if (submissionLimit.limited) {
    return NextResponse.json(
      { ok: false, error: "too_many_lead_submissions", retryAfter: submissionLimit.retryAfter },
      { status: 429, headers: { "Retry-After": String(submissionLimit.retryAfter) } },
    );
  }

  recordPublicLeadSubmission(request, deterministicLead.phone);

  if (!getSupabaseConfig()) {
    return NextResponse.json(
      {
        ok: false,
        error: "persistence_not_configured",
        fallbackLead: deterministicLead,
      },
      { status: 503 },
    );
  }

  try {
    const row = await insertLead(storedLeadToInsert(deterministicLead));
    return NextResponse.json({ ok: true, lead: leadRowToStoredLead(row) }, { status: 201 });
  } catch (error) {
    console.error("lead_insert_failed", error);
    return NextResponse.json(
      { ok: false, error: "lead_insert_failed", fallbackLead: deterministicLead },
      { status: 500 },
    );
  }
}
