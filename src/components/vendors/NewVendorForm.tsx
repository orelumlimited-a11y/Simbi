"use client";

import { useActionState, useState } from "react";
import { createVendor, type ActionState } from "@/lib/actions/vendors";
import { Field, inputClass, selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { COUNTRIES } from "@/lib/countries";
import { Plus, X } from "lucide-react";

const initialState: ActionState = {};

export function NewVendorForm({ defaultCountry = "United States" }: { defaultCountry?: string }) {
  const [state, formAction, pending] = useActionState(createVendor, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New Vendor
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">New Vendor</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {state.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
        <Field label="Vendor name" required>
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Contact person" hint="Optional">
          <input name="contactName" className={inputClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" className={inputClass} />
        </Field>
        <Field label="Phone">
          <input name="phone" className={inputClass} />
        </Field>
        <Field label="Address" className="md:col-span-2">
          <input name="address" className={inputClass} />
        </Field>
        <Field label="City">
          <input name="city" className={inputClass} />
        </Field>
        <Field label="Country">
          <select name="country" defaultValue={defaultCountry} className={selectClass}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Notes" className="md:col-span-2" hint="Optional">
          <textarea name="notes" rows={2} className={inputClass} />
        </Field>
        <div className="col-span-2 flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Create Vendor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
