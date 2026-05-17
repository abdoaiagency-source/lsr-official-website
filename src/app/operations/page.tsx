import { redirect } from "next/navigation";
import OperationsDashboard from "@/components/OperationsDashboard";
import { hasStaffSession } from "@/lib/admin-auth";

export const metadata = {
  title: "لوحة التحويل | الإقامة الآمنة",
  description: "لوحة تشغيل LSR OS لمراجعة الطلبات وتحويلها إلى حالات.",
};

export default async function OperationsPage() {
  if (!(await hasStaffSession())) redirect("/signin?next=/operations");
  return <OperationsDashboard />;
}
