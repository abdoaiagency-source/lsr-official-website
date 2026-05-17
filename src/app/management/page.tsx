import { redirect } from "next/navigation";
import ManagementDashboard from "@/components/ManagementDashboard";
import { hasAdminSession } from "@/lib/admin-auth";

export const metadata = { title: "الإدارة | LSR OS", description: "مؤشرات تشغيلية للإدارة." };
export default async function ManagementPage() {
  if (!(await hasAdminSession())) redirect("/signin?next=/management");
  return <ManagementDashboard />;
}
