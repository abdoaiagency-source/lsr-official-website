import StaffSignIn from "@/components/StaffSignIn";

export const metadata = { title: "دخول الموظفين | LSR OS", description: "تسجيل دخول فريق LSR." };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/operations";
  return <StaffSignIn nextPath={nextPath} />;
}
