"use client";

import { useActionState, useState } from "react";
import { assignDriver, type ActionState } from "@/lib/actions/orders";
import { selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Driver {
  id: string;
  name: string;
}
interface Vehicle {
  id: string;
  type: string;
  registration: string;
}

const initialState: ActionState = {};

export function AssignDriverForm({
  orderId,
  drivers,
  vehicles,
  currentDriverId,
}: {
  orderId: string;
  drivers: Driver[];
  vehicles: Vehicle[];
  currentDriverId?: string | null;
}) {
  const [state, formAction, pending] = useActionState(assignDriver, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(true)}>
        {currentDriverId ? "Reassign Driver" : "Assign Driver"}
      </Button>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="orderId" value={orderId} />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Driver</label>
        <select name="driverId" defaultValue={currentDriverId ?? ""} className={selectClass} required>
          <option value="" disabled>Select a driver</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Vehicle (optional)</label>
        <select name="vehicleId" defaultValue="" className={selectClass}>
          <option value="">Use driver&apos;s default vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.type} — {v.registration}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
