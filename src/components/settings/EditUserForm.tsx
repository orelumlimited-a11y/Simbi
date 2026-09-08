"use client";

import { useActionState, useState } from "react";
import { updateUser } from "@/lib/actions/settings";
import type { ActionState } from "@/lib/actions/orders";
import { Field, inputClass, selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/constants";
import { X } from "lucide-react";

const initialState: ActionState = {};

interface EditableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  financeAccess: boolean;
}

export function EditUserForm({ user, onCancel }: { user: EditableUser; onCancel: () => void }) {
  const [state, formAction, pending] = useActionState(updateUser, initialState);
  const [role, setRole] = useState(user.role);

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      <input type="hidden" name="id" value={user.id} />
      {state.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
      <Field label="Name" required>
        <input name="name" defaultValue={user.name} required className={inputClass} />
      </Field>
      <Field label="Email" required>
        <input name="email" type="email" defaultValue={user.email} required className={inputClass} />
      </Field>
      <Field label="Role" required>
        <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r as Role] ?? r}</option>
          ))}
        </select>
      </Field>
      <Field label="New password" hint="Leave blank to keep the current password">
        <input name="password" type="password" minLength={8} className={inputClass} />
      </Field>
      {role === "OPERATIONS" && (
        <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="financeAccess" defaultChecked={user.financeAccess} />
          Grant access to financial data
        </label>
      )}
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving..." : "Save Changes"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
      </div>
    </form>
  );
}
