"use client";

import { useActionState, useState } from "react";
import { updateOrderStatus, type ActionState } from "@/lib/actions/orders";
import { inputClass, selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Stage {
  key: string;
  label: string;
}

const initialState: ActionState = {};

export function StatusUpdateForm({ orderId, stages, currentKey }: { orderId: string; stages: Stage[]; currentKey: string }) {
  const [state, formAction, pending] = useActionState(updateOrderStatus, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} type="button">
        Update Status
      </Button>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="orderId" value={orderId} />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">New status</label>
        <select name="newStageKey" defaultValue={currentKey} className={selectClass} required>
          {stages.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Location (optional)</label>
        <input name="location" className={inputClass} placeholder="e.g. Springfield Sorting Facility" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Note (optional)</label>
        <textarea name="note" rows={2} className={inputClass} placeholder="Add context for this update" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving..." : "Save Update"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
