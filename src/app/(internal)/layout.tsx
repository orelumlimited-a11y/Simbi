import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "DRIVER") redirect("/driver");

  return (
    <AppShell role={session.user.role} financeAccess={session.user.financeAccess} userName={session.user.name}>
      {children}
    </AppShell>
  );
}
