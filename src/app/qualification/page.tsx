import QualificationForm from "@/components/QualificationForm";

export const metadata = {
  title: "شات التأهيل | الإقامة الآمنة",
  description: "شات تأهيل أولي لتحديد حالة العميل: يحتاج أوراق، جاهز للدفعة، أو لا يمكن البدء حالياً.",
};

export default function QualificationPage() {
  return (
    <main className="qualification-page">
      <QualificationForm />
    </main>
  );
}
