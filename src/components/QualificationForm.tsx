"use client";

import { useMemo, useState } from "react";
import { createStoredLead, getDocumentLabel, type QualificationAnswers, type StoredLead } from "@/lib/conversion";

const initialAnswers: QualificationAnswers = {
  name: "",
  phone: "",
  city: "",
  nationality: "",
  hasEntryStamp: "unknown",
  officialEntry: "unknown",
  hasPreviousSponsor: "unknown",
  hasSponsorClearance: "unknown",
  canObtainSponsorClearance: "unknown",
  passportValid: "unknown",
  healthCertificateReady: "unknown",
  photosReady: "unknown",
  agreesToVisit: "yes",
  wantsWaafedHelp: "unknown",
};

const storageKey = "lsr_conversion_leads";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="qual-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function saveLead(lead: StoredLead) {
  const current = JSON.parse(window.localStorage.getItem(storageKey) || "[]") as StoredLead[];
  window.localStorage.setItem(storageKey, JSON.stringify([lead, ...current].slice(0, 100)));
}

export default function QualificationForm() {
  const [answers, setAnswers] = useState<QualificationAnswers>(initialAnswers);
  const [lead, setLead] = useState<StoredLead | null>(null);
  const [saveSource, setSaveSource] = useState<"server" | "local" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return answers.name.trim().length >= 2 && answers.phone.trim().length >= 6;
  }, [answers.name, answers.phone]);

  function update<K extends keyof QualificationAnswers>(key: K, value: QualificationAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const payload = await response.json();
      const storedLead = (payload.lead ?? payload.fallbackLead) as StoredLead | undefined;

      if (response.ok && storedLead) {
        setLead(storedLead);
        setSaveSource("server");
        return;
      }

      if (storedLead) {
        saveLead(storedLead);
        setLead(storedLead);
        setSaveSource("local");
        return;
      }
    } catch {
      // Fall back to deterministic local classification if the server route is unavailable.
    } finally {
      setIsSubmitting(false);
    }

    const fallbackLead = createStoredLead(answers);
    saveLead(fallbackLead);
    setLead(fallbackLead);
    setSaveSource("local");
  }

  return (
    <div className="qual-shell">
      <form className="qual-form" onSubmit={submit}>
        <div className="qual-form-head">
          <p className="section-label">شات التأهيل</p>
          <h1>جاوب على الأسئلة السريعة لتحديد الخطوة التالية.</h1>
          <p>النظام يصنف الحالة داخلياً بدون وعود في السعر أو المدة، ويرسل الحالات الجاهزة إلى أيوب أولاً.</p>
        </div>

        <div className="qual-grid">
          <Field label="الاسم">
            <input value={answers.name} onChange={(event) => update("name", event.target.value)} placeholder="اكتب الاسم" required />
          </Field>
          <Field label="رقم الهاتف / واتساب">
            <input value={answers.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+218..." required />
          </Field>
          <Field label="المدينة">
            <input value={answers.city} onChange={(event) => update("city", event.target.value)} placeholder="طرابلس" />
          </Field>
          <Field label="الجنسية">
            <input value={answers.nationality} onChange={(event) => update("nationality", event.target.value)} placeholder="الجنسية" />
          </Field>

          <Field label="هل يوجد ختم دخول رسمي؟">
            <select value={answers.hasEntryStamp} onChange={(event) => update("hasEntryStamp", event.target.value as QualificationAnswers["hasEntryStamp"])}>
              <option value="unknown">غير متأكد</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
            </select>
          </Field>
          <Field label="هل دخلت ليبيا بطريقة رسمية؟">
            <select value={answers.officialEntry} onChange={(event) => update("officialEntry", event.target.value as QualificationAnswers["officialEntry"])}>
              <option value="unknown">غير متأكد</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
            </select>
          </Field>
          <Field label="هل عندك إقامة أو كفيل سابق؟">
            <select value={answers.hasPreviousSponsor} onChange={(event) => update("hasPreviousSponsor", event.target.value as QualificationAnswers["hasPreviousSponsor"])}>
              <option value="unknown">غير متأكد</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
            </select>
          </Field>
          <Field label="هل عندك إخلاء طرف؟">
            <select value={answers.hasSponsorClearance} onChange={(event) => update("hasSponsorClearance", event.target.value as QualificationAnswers["hasSponsorClearance"])}>
              <option value="unknown">غير متأكد</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
              <option value="not_applicable">لا ينطبق</option>
            </select>
          </Field>
          <Field label="إذا لا، هل تستطيع جلب إخلاء طرف؟">
            <select value={answers.canObtainSponsorClearance} onChange={(event) => update("canObtainSponsorClearance", event.target.value as QualificationAnswers["canObtainSponsorClearance"])}>
              <option value="unknown">غير متأكد</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
              <option value="not_applicable">لا ينطبق</option>
            </select>
          </Field>
          <Field label="هل الجواز موجود وصالح؟">
            <select value={answers.passportValid} onChange={(event) => update("passportValid", event.target.value as QualificationAnswers["passportValid"])}>
              <option value="unknown">يحتاج تأكيد</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
            </select>
          </Field>
          <Field label="هل الشهادة الصحية جاهزة؟">
            <select value={answers.healthCertificateReady} onChange={(event) => update("healthCertificateReady", event.target.value as QualificationAnswers["healthCertificateReady"])}>
              <option value="unknown">غير متأكد</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
            </select>
          </Field>
          <Field label="هل الصور جاهزة؟">
            <select value={answers.photosReady} onChange={(event) => update("photosReady", event.target.value as QualificationAnswers["photosReady"])}>
              <option value="unknown">غير متأكد</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
            </select>
          </Field>
          <Field label="هل توافق على الحضور ودفع الدفعة الأولى إذا كانت الحالة مناسبة؟">
            <select value={answers.agreesToVisit} onChange={(event) => update("agreesToVisit", event.target.value as QualificationAnswers["agreesToVisit"])}>
              <option value="yes">نعم</option>
              <option value="no">لا حالياً</option>
            </select>
          </Field>
          <Field label="هل تريد مساعدة في تعبئة منصة وافد؟">
            <select value={answers.wantsWaafedHelp} onChange={(event) => update("wantsWaafedHelp", event.target.value as QualificationAnswers["wantsWaafedHelp"])}>
              <option value="unknown">غير متأكد</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
            </select>
          </Field>
        </div>

        <button className="btn primary qual-submit" type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "جاري الحفظ..." : "تحديد الحالة وحفظ Lead"}</button>
      </form>

      <aside className="qual-result" aria-live="polite">
        {lead ? (
          <>
            <span className={`status-pill status-${lead.status}`}>{lead.status}</span>
            {saveSource ? <small className="save-source">{saveSource === "server" ? "تم الحفظ في قاعدة البيانات" : "تم الحفظ محلياً مؤقتاً"}</small> : null}
            <h2>{lead.status === "ready_deposit" ? "جاهز للدفعة" : lead.status === "needs_documents" ? "يحتاج أوراق" : "لا يمكن البدء حالياً"}</h2>
            <p>{lead.clientMessage}</p>
            {lead.missingDocuments.length > 0 ? (
              <div className="missing-box">
                <strong>الأوراق الناقصة</strong>
                {lead.missingDocuments.map((document) => <span key={document}>{getDocumentLabel(document)}</span>)}
              </div>
            ) : null}
            <div className="next-action">
              <strong>الإجراء التالي</strong>
              <span>{lead.nextAction}</span>
            </div>
            <a className="btn secondary" href="/operations">فتح لوحة أيوب التجريبية</a>
          </>
        ) : (
          <>
            <span className="status-pill">جاهز للتصنيف</span>
            <h2>النتيجة ستظهر هنا بعد الإجابة.</h2>
            <p>هذه نسخة MVP محلية: تحفظ النتائج في المتصفح حتى نربطها لاحقاً بقاعدة بيانات Supabase.</p>
          </>
        )}
      </aside>
    </div>
  );
}
