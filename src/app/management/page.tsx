import { redirect } from "next/navigation";
import ManagementDashboard from "@/components/ManagementDashboard";
import { hasStaffSession } from "@/lib/admin-auth";

export const metadata = { title: "الإدارة | LSR OS", description: "مؤشرات تشغيلية للإدارة." };
export default async function ManagementPage() {
  if (!(await hasStaffSession())) redirect("/signin?next=/management");
  return <ManagementDashboard />;
}
