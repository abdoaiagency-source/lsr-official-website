import type { QualificationAnswers } from "./conversion";

export const initialChatAnswers: QualificationAnswers = {
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

export type ChatStepId = keyof QualificationAnswers;

export type ChatOption = {
  label: string;
  value: string;
  helper?: string;
};

export type ChatStep = {
  id: ChatStepId;
  eyebrow: string;
  question: string;
  helper?: string;
  inputType: "text" | "tel" | "choice";
  placeholder?: string;
  options?: ChatOption[];
  required?: boolean;
};

const yesNoUnknownOptions: ChatOption[] = [
  { label: "نعم", value: "yes" },
  { label: "لا", value: "no" },
  { label: "مش متأكد", value: "unknown" },
];

export const chatSteps: ChatStep[] = [
  {
    id: "name",
    eyebrow: "تعريف بسيط",
    question: "شن اسمك؟",
    helper: "اكتب الاسم كما تحب أن يتواصل معك المكتب.",
    inputType: "text",
    placeholder: "مثال: محمد علي",
    required: true,
  },
  {
    id: "phone",
    eyebrow: "رقم التواصل",
    question: "اكتب رقم واتساب للتواصل معك",
    helper: "لن نرسل لك رسائل مزعجة. الرقم فقط لمتابعة الحالة.",
    inputType: "tel",
    placeholder: "+218 91 123 4567",
    required: true,
  },
  {
    id: "city",
    eyebrow: "مكانك الحالي",
    question: "في أي مدينة موجود حالياً؟",
    inputType: "text",
    placeholder: "طرابلس / بنغازي / مصراتة...",
    required: true,
  },
  {
    id: "nationality",
    eyebrow: "الجنسية",
    question: "ما هي جنسيتك؟",
    inputType: "text",
    placeholder: "مثال: مصرية / تونسية / سودانية",
    required: true,
  },
  {
    id: "hasEntryStamp",
    eyebrow: "الدخول إلى ليبيا",
    question: "هل عندك ختم دخول في الجواز؟",
    helper: "ختم الدخول هو الختم الموجود في الجواز عند دخولك من منفذ رسمي.",
    inputType: "choice",
    options: yesNoUnknownOptions,
  },
  {
    id: "officialEntry",
    eyebrow: "طريقة الدخول",
    question: "هل دخلت ليبيا بطريقة رسمية؟",
    helper: "إذا مش متأكد، اختار مش متأكد ونوضح لك الخطوة القادمة.",
    inputType: "choice",
    options: yesNoUnknownOptions,
  },
  {
    id: "hasPreviousSponsor",
    eyebrow: "كفيل سابق",
    question: "هل عندك إقامة أو كفيل سابق في ليبيا؟",
    inputType: "choice",
    options: yesNoUnknownOptions,
  },
  {
    id: "hasSponsorClearance",
    eyebrow: "إخلاء الطرف",
    question: "هل عندك إخلاء طرف من الكفيل السابق؟",
    helper: "لو عندك كفيل سابق غالباً نحتاج إخلاء طرف حتى نبدأ بشكل صحيح.",
    inputType: "choice",
    options: [
      { label: "نعم عندي", value: "yes" },
      { label: "لا ما عنديش", value: "no" },
      { label: "مش متأكد", value: "unknown" },
    ],
  },
  {
    id: "canObtainSponsorClearance",
    eyebrow: "إمكانية التجهيز",
    question: "هل تقدر تجيب إخلاء الطرف؟",
    inputType: "choice",
    options: [
      { label: "نعم نقدر نجيبه", value: "yes" },
      { label: "لا ما نقدرش", value: "no" },
      { label: "مش متأكد", value: "unknown" },
    ],
  },
  {
    id: "passportValid",
    eyebrow: "الجواز",
    question: "هل الجواز موجود وصالح؟",
    inputType: "choice",
    options: yesNoUnknownOptions,
  },
  {
    id: "healthCertificateReady",
    eyebrow: "الشهادة الصحية",
    question: "هل الشهادة الصحية جاهزة؟",
    helper: "لو مش جاهزة، عادي. بنضيفها في قائمة الأوراق الناقصة.",
    inputType: "choice",
    options: yesNoUnknownOptions,
  },
  {
    id: "photosReady",
    eyebrow: "الصور",
    question: "هل الصور الشخصية جاهزة؟",
    inputType: "choice",
    options: yesNoUnknownOptions,
  },
  {
    id: "agreesToVisit",
    eyebrow: "الخطوة الجدية",
    question: "إذا كانت حالتك مناسبة، هل تقدر تحضر للمكتب وتسلم الأوراق وتدفع الدفعة الأولى؟",
    helper: "لا يوجد دفع من خلال الموقع. هذه فقط لتحديد جاهزية الحالة.",
    inputType: "choice",
    options: [
      { label: "نعم جاهز", value: "yes" },
      { label: "لا حالياً", value: "no" },
    ],
  },
  {
    id: "wantsWaafedHelp",
    eyebrow: "منصة وافد",
    question: "هل تريد مساعدة في تعبئة منصة وافد؟",
    inputType: "choice",
    options: yesNoUnknownOptions,
  },
];

export function getVisibleChatSteps(answers: QualificationAnswers): ChatStep[] {
  return chatSteps.filter((step) => {
    if (step.id === "hasSponsorClearance") return answers.hasPreviousSponsor === "yes";
    if (step.id === "canObtainSponsorClearance") {
      return answers.hasPreviousSponsor === "yes" && answers.hasSponsorClearance === "no";
    }
    return true;
  });
}

export function isStepComplete(answers: QualificationAnswers, step: ChatStep): boolean {
  const value = answers[step.id];
  if (!step.required && step.inputType === "choice") return true;
  if (step.inputType === "choice") return value !== "unknown" || step.id !== "agreesToVisit";
  return typeof value === "string" && value.trim().length >= (step.id === "phone" ? 6 : 2);
}

export function nextIncompleteStepIndex(answers: QualificationAnswers, steps = getVisibleChatSteps(answers)): number {
  const index = steps.findIndex((step) => !isStepComplete(answers, step));
  return index === -1 ? steps.length - 1 : index;
}

export function normalizeBranchingAnswers(answers: QualificationAnswers): QualificationAnswers {
  if (answers.hasPreviousSponsor === "no") {
    return {
      ...answers,
      hasSponsorClearance: "not_applicable",
      canObtainSponsorClearance: "not_applicable",
    };
  }

  if (answers.hasSponsorClearance === "yes") {
    return { ...answers, canObtainSponsorClearance: "not_applicable" };
  }

  return answers;
}
