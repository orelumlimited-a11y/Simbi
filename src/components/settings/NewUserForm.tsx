"use client";

import { useActionState, useState } from "react";
import { createUser } from "@/lib/actions/settings";
import type { ActionState } from "@/lib/actions/orders";
import { Field, inputClass, selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { Plus, X } from "lucide-react";

const initialState: ActionState = {};

export function NewUserForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("OPERATIONS");

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> New User
      </Button>
    );
  }

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      {state.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
      <Field label="Name" required>
        <input name="name" required className={inputClass} />
      </Field>
      <Field label="Email" required>
        <input name="email" type="email" required className={inputClass} />
      </Field>
      <Field label="Role" required>
        <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
          {ROLES.filter((r) => r !== "DRIVER").map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </Field>
      <Field label="Temporary password" required>
        <input name="password" type="password" minLength={8} required className={inputClass} />
      </Field>
      {role === "OPERATIONS" && (
        <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="financeAccess" />
          Grant access to financial data
        </label>
      )}
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving..." : "Create User"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
