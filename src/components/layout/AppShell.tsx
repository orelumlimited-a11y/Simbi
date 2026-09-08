"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, LogOut, Search, User as UserIcon } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Logo } from "@/components/ui/Logo";
import type { Role } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/constants";

export function AppShell({
  role,
  financeAccess,
  userName,
  children,
}: {
  role: Role;
  financeAccess: boolean;
  userName: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/orders?search=${encodeURIComponent(search.trim())}`);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} financeAccess={financeAccess} />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64 bg-[var(--sidebar)]">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Logo size={28} />
                <span className="text-sm font-semibold text-white">Simbi Logistics</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div onClick={() => setMobileOpen(false)}>
              <Sidebar role={role} financeAccess={financeAccess} />
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-slate-500 md:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <form onSubmit={handleSearch} className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 md:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders, customers, tracking #..."
                className="w-72 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </form>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{userName}</p>
              <p className="text-xs text-slate-400">{ROLE_LABELS[role]}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UserIcon className="h-4 w-4" />
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 bg-background p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
