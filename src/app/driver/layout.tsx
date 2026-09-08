import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DriverHeader } from "@/components/driver/DriverHeader";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "DRIVER" && session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <DriverHeader userName={session.user.name} />
      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
    </div>
  );
}
