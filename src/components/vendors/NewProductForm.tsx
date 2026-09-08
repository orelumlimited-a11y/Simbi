"use client";

import { useActionState, useState } from "react";
import { createProduct, type ActionState } from "@/lib/actions/products";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Plus, X } from "lucide-react";

const initialState: ActionState = {};

export function NewProductForm() {
  const [state, formAction, pending] = useActionState(createProduct, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New Product
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">New Product</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {state.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
        <Field label="Product name" required>
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="SKU" hint="Optional">
          <input name="sku" className={inputClass} />
        </Field>
        <Field label="Unit" hint="e.g. pcs, kg, box">
          <input name="unit" defaultValue="pcs" className={inputClass} />
        </Field>
        <Field label="Reorder level" hint="Flag as low stock at or below this">
          <input name="reorderLevel" type="number" min={0} defaultValue={0} className={inputClass} />
        </Field>
        <Field label="Description" className="md:col-span-2" hint="Optional">
          <textarea name="description" rows={2} className={inputClass} />
        </Field>
        <div className="col-span-2 flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
