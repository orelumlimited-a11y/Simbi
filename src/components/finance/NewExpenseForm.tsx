"use client";

import { useActionState, useState } from "react";
import { createExpense } from "@/lib/actions/expenses";
import type { ActionState } from "@/lib/actions/orders";
import { Field, inputClass, selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@/lib/constants";
import { Plus, X } from "lucide-react";

const initialState: ActionState = {};

export function NewExpenseForm() {
  const [state, formAction, pending] = useActionState(createExpense, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Log Expense
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Log Expense</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {state.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
        <Field label="Category" required>
          <select name="category" className={selectClass} required>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </Field>
        <Field label="Amount" required>
          <input name="amount" type="number" step="0.01" min={0} required className={inputClass} />
        </Field>
        <Field label="Date">
          <input name="date" type="date" className={inputClass} />
        </Field>
        <Field label="Description">
          <input name="description" className={inputClass} />
        </Field>
        <div className="col-span-2 flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Expense"}
          </Button>
        </div>
      </form>
    </div>
  );
}
