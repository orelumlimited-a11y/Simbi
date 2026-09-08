"use client";

import { useActionState, useState } from "react";
import { createDriver, type ActionState } from "@/lib/actions/drivers";
import { Field, inputClass, selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Plus, X } from "lucide-react";

interface Vehicle {
  id: string;
  type: string;
  registration: string;
}

const initialState: ActionState = {};

export function NewDriverForm({ vehicles }: { vehicles: Vehicle[] }) {
  const [state, formAction, pending] = useActionState(createDriver, initialState);
  const [open, setOpen] = useState(false);
  const [createLogin, setCreateLogin] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New Driver
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">New Driver</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {state.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
        <Field label="Name" required>
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Phone" required>
          <input name="phone" required className={inputClass} />
        </Field>
        <Field label="Email" required>
          <input name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Vehicle">
          <select name="vehicleId" className={selectClass} defaultValue="">
            <option value="">Unassigned</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.type} — {v.registration}</option>
            ))}
          </select>
        </Field>
        <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="createLogin" checked={createLogin} onChange={(e) => setCreateLogin(e.target.checked)} />
          Create a driver login for the mobile dashboard
        </label>
        {createLogin && (
          <Field label="Temporary password" required className="col-span-2">
            <input name="password" type="password" minLength={8} className={inputClass} placeholder="At least 8 characters" />
          </Field>
        )}
        <div className="col-span-2 flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Create Driver"}
          </Button>
        </div>
      </form>
    </div>
  );
}
