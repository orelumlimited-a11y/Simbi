"use client";

import { useActionState, useState } from "react";
import { createVehicle } from "@/lib/actions/drivers";
import type { ActionState } from "@/lib/actions/orders";
import { Field, inputClass, selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { VEHICLE_STATUSES } from "@/lib/constants";
import { Plus, X } from "lucide-react";

const initialState: ActionState = {};

export function NewVehicleForm() {
  const [state, formAction, pending] = useActionState(createVehicle, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New Vehicle
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">New Vehicle</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {state.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
        <Field label="Type" required hint="e.g. Cargo Van, Motorbike, Truck">
          <input name="type" required className={inputClass} />
        </Field>
        <Field label="Registration" required>
          <input name="registration" required className={inputClass} />
        </Field>
        <Field label="Capacity (kg)">
          <input name="capacityKg" type="number" step="0.1" className={inputClass} />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue="ACTIVE" className={selectClass}>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <div className="col-span-2 flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Create Vehicle"}
          </Button>
        </div>
      </form>
    </div>
  );
}
