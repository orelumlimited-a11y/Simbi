"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function DriverHeader({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <Logo size={32} />
        <div>
          <p className="text-sm font-semibold text-slate-900">Simbi Logistics</p>
          <p className="text-xs text-slate-400">{userName}</p>
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </header>
  );
}
