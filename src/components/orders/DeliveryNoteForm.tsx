"use client";

import { useActionState } from "react";
import { addDeliveryNote, type ActionState } from "@/lib/actions/orders";
import { inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function DeliveryNoteForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(addDeliveryNote, initialState);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex-1">
        <input name="note" className={inputClass} placeholder="Add a delivery note..." required />
        {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding..." : "Add Note"}
      </Button>
    </form>
  );
}
