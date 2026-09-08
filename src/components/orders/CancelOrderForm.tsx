"use client";

import { useActionState, useState } from "react";
import { cancelOrder, deleteOrder, type ActionState } from "@/lib/actions/orders";
import { inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function CancelOrderForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(cancelOrder, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="danger" size="sm" type="button" onClick={() => setOpen(true)}>
        Cancel Order
      </Button>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <input type="hidden" name="orderId" value={orderId} />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Reason for cancellation</label>
        <input name="reason" className={inputClass} placeholder="e.g. Customer requested cancellation" required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "Cancelling..." : "Confirm Cancellation"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Back
        </Button>
      </div>
    </form>
  );
}

export function DeleteOrderForm({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(true)} className="text-red-600 hover:bg-red-50">
        Delete Order
      </Button>
    );
  }

  return (
    <form action={deleteOrder} className="mt-3 space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-xs text-slate-600">
        This permanently deletes order <strong>{orderNumber}</strong> and all associated records. This cannot be undone.
      </p>
      <div className="flex gap-2">
        <Button type="submit" variant="danger" size="sm">
          Permanently Delete
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Back
        </Button>
      </div>
    </form>
  );
}
