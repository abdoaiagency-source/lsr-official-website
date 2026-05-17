import { redirect } from "next/navigation";
import CaseDetailDashboard from "@/components/CaseDetailDashboard";
import { hasStaffSession } from "@/lib/admin-auth";

export const metadata = { title: "تفاصيل الحالة | LSR OS", description: "إدارة تفاصيل حالة تشغيلية." };
export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await hasStaffSession())) redirect(`/signin?next=/cases/${id}`);
  return <CaseDetailDashboard caseId={id} />;
}
