import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, auth } from "@/auth";
import { inputClass } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "DRIVER" ? "/driver" : "/dashboard");
  }

  const params = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: callbackUrl,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=invalid&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
      throw err;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={56} className="mb-3 rounded-xl" />
          <h1 className="text-xl font-semibold text-white">Simbi Logistics</h1>
          <p className="mt-1 text-sm text-slate-400">Order Management &amp; Delivery Tracking</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Sign in to your account</h2>

          {params.error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
              Invalid email or password.
            </div>
          )}

          <form action={login} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={params.callbackUrl || "/dashboard"} />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
              <input name="email" type="email" required className={inputClass} placeholder="you@company.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Password</label>
              <input name="password" type="password" required className={inputClass} placeholder="••••••••" />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
