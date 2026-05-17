import CaseDetailDashboard from "@/components/CaseDetailDashboard";

export const metadata = { title: "تفاصيل الحالة | LSR OS", description: "إدارة تفاصيل حالة تشغيلية." };
export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CaseDetailDashboard caseId={id} />; }
