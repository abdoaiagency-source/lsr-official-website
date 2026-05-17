import StaffSignIn from "@/components/StaffSignIn";
import { safeInternalPath } from "@/lib/safe-path";

export const metadata = { title: "دخول الموظفين | LSR OS", description: "تسجيل دخول فريق LSR." };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <StaffSignIn nextPath={safeInternalPath(params.next)} />;
}
