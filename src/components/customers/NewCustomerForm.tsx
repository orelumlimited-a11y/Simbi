"use client";

import { useActionState, useState } from "react";
import { createCustomer, type ActionState } from "@/lib/actions/customers";
import { Field, inputClass, selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { COUNTRIES } from "@/lib/countries";
import { ContactPreferenceToggles } from "@/components/customers/ContactPreferenceToggles";
import { Plus, X } from "lucide-react";

const initialState: ActionState = {};

export function NewCustomerForm({ defaultCountry = "United States" }: { defaultCountry?: string }) {
  const [state, formAction, pending] = useActionState(createCustomer, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New Customer
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">New Customer</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {state.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
        <Field label="Name" required>
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Company" hint="Optional">
          <input name="company" className={inputClass} />
        </Field>
        <Field label="Email" required>
          <input name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Phone" required>
          <input name="phone" required className={inputClass} />
        </Field>
        <Field label="Address">
          <input name="address" className={inputClass} />
        </Field>
        <Field label="City">
          <input name="city" className={inputClass} />
        </Field>
        <Field label="Postcode">
          <input name="postcode" className={inputClass} />
        </Field>
        <Field label="Country">
          <select name="country" defaultValue={defaultCountry} className={selectClass}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </select>
        </Field>
        <div className="col-span-2">
          <ContactPreferenceToggles />
        </div>
        <div className="col-span-2 flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Create Customer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
