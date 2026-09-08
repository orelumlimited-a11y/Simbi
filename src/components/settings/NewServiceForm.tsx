"use client";

import { useActionState, useState } from "react";
import { createService } from "@/lib/actions/settings";
import type { ActionState } from "@/lib/actions/orders";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Plus, X } from "lucide-react";

const initialState: ActionState = {};

export function NewServiceForm() {
  const [state, formAction, pending] = useActionState(createService, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add Service
      </Button>
    );
  }

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
      {state.error && <p className="col-span-3 text-xs text-red-600">{state.error}</p>}
      <Field label="Name" required>
        <input name="name" required className={inputClass} />
      </Field>
      <Field label="Base price" required>
        <input name="basePrice" type="number" step="0.01" min={0} required className={inputClass} />
      </Field>
      <Field label="Description">
        <input name="description" className={inputClass} />
      </Field>
      <div className="col-span-3 flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
