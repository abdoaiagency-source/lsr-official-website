import { redirect } from "next/navigation";
import TasksDashboard from "@/components/TasksDashboard";
import { hasStaffSession } from "@/lib/admin-auth";

export const metadata = { title: "المهام | LSR OS", description: "متابعة المهام اليومية." };
export default async function TasksPage() {
  if (!(await hasStaffSession())) redirect("/signin?next=/tasks");
  return <TasksDashboard />;
}
