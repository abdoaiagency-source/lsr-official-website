import { redirect } from "next/navigation";
import CasesDashboard from "@/components/CasesDashboard";
import { hasStaffSession } from "@/lib/admin-auth";

export const metadata = { title: "الحالات | LSR OS", description: "قائمة حالات LSR التشغيلية." };
export default async function CasesPage() {
  if (!(await hasStaffSession())) redirect("/signin?next=/cases");
  return <CasesDashboard />;
}
