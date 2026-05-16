"use client";

import { useMemo, useState } from "react";
import { getDocumentLabel, type QualificationAnswers, type StoredLead } from "@/lib/conversion";
import {
  getVisibleChatSteps,
  initialChatAnswers,
  isStepComplete,
  normalizeBranchingAnswers,
  type ChatStep,
} from "@/lib/qualification-chat";

const storageKey = "lsr_conversion_leads";
const whatsappNumber = "218910000000";

function saveLead(lead: StoredLead) {
  const current = JSON.parse(window.localStorage.getItem(storageKey) || "[]") as StoredLead[];
  window.localStorage.setItem(storageKey, JSON.stringify([lead, ...current].slice(0, 100)));
}

function statusTitle(status: StoredLead["status"]) {
  if (status === "ready_deposit") return "حالتك مناسبة مبدئياً ✅";
  if (status === "needs_documents") return "حالتك ممكنة، لكن ناقصة أوراق 📄";
  return "لا يمكن البدء حالياً";
}

function whatsappText(lead: StoredLead) {
  const missing = lead.missingDocuments.length
    ? `\nالأوراق الناقصة:\n${lead.missingDocuments.map((item, index) => `${index + 1}. ${getDocumentLabel(item)}`).join("\n")}`
    : "\nالأوراق الأساسية حسب الإجابات جاهزة مبدئياً.";

  return encodeURIComponent(
    `السلام عليكم، أكملت شات التأهيل في موقع الإقامة الآمنة.\nالاسم: ${lead.name}\nرقم التواصل: ${lead.phone}\nالحالة: ${statusTitle(lead.status)}${missing}\nالإجراء التالي: ${lead.nextAction}`,
  );
}

function textInputMode(step: ChatStep) {
  if (step.inputType === "tel") return "tel";
  return "text";
}

export default function QualificationForm() {
  const [answers, setAnswers] = useState<QualificationAnswers>(initialChatAnswers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lead, setLead] = useState<StoredLead | null>(null);
  const [saveSource, setSaveSource] = useState<"server" | "local" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [started, setStarted] = useState(false);

  const visibleSteps = useMemo(() => getVisibleChatSteps(answers), [answers]);
  const currentStep = visibleSteps[Math.min(currentIndex, visibleSteps.length - 1)];
  const progress = Math.round(((Math.min(currentIndex, visibleSteps.length - 1) + 1) / visibleSteps.length) * 100);
  const canContinue = currentStep ? isStepComplete(answers, currentStep) : false;
  const isLastStep = currentIndex >= visibleSteps.length - 1;

  function update<K extends keyof QualificationAnswers>(key: K, value: QualificationAnswers[K]) {
    setAnswers((current) => normalizeBranchingAnswers({ ...current, [key]: value }));
  }

  function next() {
    if (!canContinue || !currentStep) return;
    if (isLastStep) {
      void submit();
      return;
    }
    setCurrentIndex((index) => Math.min(index + 1, visibleSteps.length - 1));
  }

  function back() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  async function submit() {
    setIsSubmitting(true);
    const finalAnswers = normalizeBranchingAnswers(answers);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
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
      // The API has a built-in server fallback. This catch handles network/browser failures.
    } finally {
      setIsSubmitting(false);
    }
  }

  function restart() {
    setAnswers(initialChatAnswers);
    setCurrentIndex(0);
    setLead(null);
    setSaveSource(null);
    setStarted(false);
  }

  if (lead) {
    return (
      <div className="chat-shell result-mode">
        <section className="chat-card result-card" aria-live="polite">
          <span className={`status-pill status-${lead.status}`}>{statusTitle(lead.status)}</span>
          {saveSource ? <small className="save-source">{saveSource === "server" ? "تم الحفظ في قاعدة البيانات" : "تم الحفظ محلياً مؤقتاً"}</small> : null}
          <h1>{statusTitle(lead.status)}</h1>
          <p>{lead.clientMessage}</p>

          {lead.missingDocuments.length > 0 ? (
            <div className="missing-box light-box">
              <strong>الأوراق المطلوبة</strong>
              {lead.missingDocuments.map((document) => <span key={document}>{getDocumentLabel(document)}</span>)}
            </div>
          ) : (
            <div className="missing-box light-box">
              <strong>الخطوة التالية</strong>
              <span>تواصل مع المكتب لتأكيد وقت الحضور وتسليم الأوراق والدفعة الأولى.</span>
            </div>
          )}

          <div className="chat-actions final-actions">
            <a className="btn primary" href={`https://wa.me/${whatsappNumber}?text=${whatsappText(lead)}`}>فتح واتساب</a>
            <a className="btn secondary" href="/operations">لوحة أيوب</a>
            <button className="ghost-action" type="button" onClick={restart}>تعديل الإجابات</button>
          </div>
        </section>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="chat-shell">
        <section className="chat-card welcome-card">
          <p className="section-label">مساعد التأهيل السريع</p>
          <h1>السلام عليكم 👋 خلينا نعرف حالتك في أقل من دقيقة.</h1>
          <p>جاوب على أسئلة بسيطة بزر واحد. لا يوجد دفع من خلال الموقع، والنتيجة فقط لتحديد الخطوة المناسبة.</p>
          <div className="trust-row">
            <span>أسئلة قصيرة</span>
            <span>بدون مصطلحات صعبة</span>
            <span>واتساب في النهاية</span>
          </div>
          <button className="btn primary big-start" type="button" onClick={() => setStarted(true)}>ابدأ الآن</button>
        </section>
      </div>
    );
  }

  if (!currentStep) return null;

  return (
    <div className="chat-shell">
      <section className="phone-chat" aria-label="شات التأهيل السريع">
        <header className="chat-topbar">
          <div>
            <strong>الإقامة الآمنة</strong>
            <span>مساعد التأهيل السريع</span>
          </div>
          <span className="online-dot">متاح</span>
        </header>

        <div className="chat-progress" aria-label={`سؤال ${currentIndex + 1} من ${visibleSteps.length}`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="message-stack">
          <div className="bot-bubble small-bubble">سؤال {currentIndex + 1} من {visibleSteps.length}</div>
          <div className="bot-bubble">
            <span className="step-eyebrow">{currentStep.eyebrow}</span>
            <h1>{currentStep.question}</h1>
            {currentStep.helper ? <p>{currentStep.helper}</p> : null}
          </div>

          {currentStep.inputType === "choice" ? (
            <div className="choice-grid" role="group" aria-label={currentStep.question}>
              {currentStep.options?.map((option) => (
                <button
                  className={answers[currentStep.id] === option.value ? "choice-btn selected" : "choice-btn"}
                  key={option.value}
                  type="button"
                  onClick={() => update(currentStep.id, option.value as never)}
                >
                  <span>{option.label}</span>
                  {option.helper ? <small>{option.helper}</small> : null}
                </button>
              ))}
            </div>
          ) : (
            <label className="chat-input-label">
              <span>{currentStep.eyebrow}</span>
              <input
                autoFocus
                inputMode={currentStep.inputType === "tel" ? "tel" : "text"}
                type={textInputMode(currentStep)}
                value={answers[currentStep.id] as string}
                onChange={(event) => update(currentStep.id, event.target.value as never)}
                placeholder={currentStep.placeholder}
              />
            </label>
          )}
        </div>

        <footer className="chat-actions">
          <button className="ghost-action" type="button" onClick={back} disabled={currentIndex === 0}>رجوع</button>
          <button className="btn primary" type="button" onClick={next} disabled={!canContinue || isSubmitting}>
            {isSubmitting ? "جاري الحفظ..." : isLastStep ? "اعرض النتيجة" : "التالي"}
          </button>
        </footer>
      </section>
    </div>
  );
}
