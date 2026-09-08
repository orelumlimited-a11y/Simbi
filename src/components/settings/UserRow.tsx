"use client";

import { useState } from "react";
import { toggleUserActive } from "@/lib/actions/settings";
import { EditUserForm } from "@/components/settings/EditUserForm";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { Pencil } from "lucide-react";
import clsx from "clsx";

interface UserRowUser {
  id: string;
  name: string;
  email: string;
  role: string;
  financeAccess: boolean;
  active: boolean;
}

export function UserRow({ user }: { user: UserRowUser }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-lg border border-slate-100 px-3 py-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-800">{user.name}</p>
          <p className="text-xs text-slate-400">
            {user.email} · {ROLE_LABELS[user.role as Role] ?? user.role}
            {user.financeAccess ? " · Finance access" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setEditing((v) => !v)} className="text-xs font-medium text-brand hover:underline">
            <Pencil className="mr-0.5 inline h-3 w-3" /> Edit
          </button>
          <form action={toggleUserActive}>
            <input type="hidden" name="id" value={user.id} />
            <button
              type="submit"
              className={clsx(
                "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                user.active ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : "bg-slate-100 text-slate-500 ring-slate-300"
              )}
            >
              {user.active ? "Active" : "Disabled"}
            </button>
          </form>
        </div>
      </div>
      {editing && <EditUserForm user={user} onCancel={() => setEditing(false)} />}
    </div>
  );
}
